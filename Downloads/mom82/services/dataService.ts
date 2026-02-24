
import {
  Employee, KPIConfig, KPIRecord, Task, BehaviorLog, ProblemLog, Financials, Role, Department,
  TaskStatus, MoodRating, SolutionStatus, EmployeeKPIData, EmployeeTaskDisplay,
  BehaviorChartData, PayrollBreakdown, Client, OtherCommissionLog, EmployeeSummary, Campaign, SiteConfig,
  LeaveRequest, LeaveStatus, LeaveType, KpiStatus, AttendanceLog, AttendanceStatus, PlanSheet, TaskColumn, TaskLog,
  ManagerTask, AdCampaign, PasswordCategory, VaultPassword
} from '../types';
import {
  DEFAULT_KPI_TARGET, DEFAULT_INCENTIVE_PERCENTAGE, MOOD_RATING_MAP,
  MIN_MOOD_RATING_FOR_LOW_FOCUS, MAX_MOOD_RATING_FOR_HIGH_ANGER, DEFAULT_MANAGER_SCHEDULE
} from '../constants';
import { supabase } from '../supabaseClient';

class DataServiceManager {
  private static instance: DataServiceManager;
  private constructor() {}
  public static getInstance(): DataServiceManager {
    if (!DataServiceManager.instance) DataServiceManager.instance = new DataServiceManager();
    return DataServiceManager.instance;
  }

  private parseDates<T>(item: T, dateFields: string[]): T {
    if (!item) return item;
    const parsedItem: any = { ...item };
    for (const field of dateFields) {
      if (parsedItem[field] && typeof parsedItem[field] === 'string') {
        parsedItem[field] = new Date(parsedItem[field]);
      }
    }
    return parsedItem as T;
  }

  // --- Password Vault (New) ---
  public async getPasswordCategories(): Promise<PasswordCategory[]> {
      const { data } = await supabase.from('password_categories').select('*').order('name');
      return data || [];
  }

  public async createPasswordCategory(name: string, icon: string, color: string): Promise<void> {
      await supabase.from('password_categories').insert({ name, icon, color });
  }

  public async getPasswordsByCategory(catId: string): Promise<VaultPassword[]> {
      const { data } = await supabase.from('vault_passwords').select('*').eq('category_id', catId).order('title');
      return data || [];
  }

  public async upsertPassword(passwordData: Partial<VaultPassword>): Promise<void> {
      if (passwordData.id) {
          await supabase.from('vault_passwords').update(passwordData).eq('id', passwordData.id);
      } else {
          await supabase.from('vault_passwords').insert(passwordData);
      }
  }

  public async deletePassword(id: string): Promise<void> {
      await supabase.from('vault_passwords').delete().eq('id', id);
  }

  public async deletePasswordCategory(id: string): Promise<void> {
      await supabase.from('password_categories').delete().eq('id', id);
  }

  // --- Kanban & Tasks ---
  public async getTaskColumns(): Promise<TaskColumn[]> {
      const { data } = await supabase.from('task_columns').select('*').order('order_index');
      return data || [];
  }

  public async createTaskColumn(title: string): Promise<void> {
      const columns = await this.getTaskColumns();
      const maxOrder = columns.length > 0 ? Math.max(...columns.map(c => c.order_index)) : -1;
      await supabase.from('task_columns').insert({ title, order_index: maxOrder + 1 });
  }

  public async updateTaskColumn(id: string, title: string): Promise<void> {
      await supabase.from('task_columns').update({ title }).eq('id', id);
  }

  public async deleteTaskColumn(id: string): Promise<void> {
      await supabase.from('task_columns').delete().eq('id', id);
  }

  public async getEmployeeTasks(eid: string): Promise<any[]> { 
      const { data } = await supabase.from('tasks').select('*').eq('assigned_to', eid).order('order_index'); 
      return (data || []).map(t => ({...this.parseDates(t, ['deadline', 'completion_date']), isLate: t.status === 'Done' && new Date(t.completion_date) > new Date(t.deadline)})); 
  }

  public async getAllTasks(): Promise<any[]> {
      const { data } = await supabase.from('tasks').select('*, employee:employees(name, role)').order('order_index');
      return (data || []).map(t => ({...this.parseDates(t, ['deadline', 'completion_date'])}));
  }

  public async getEmployeeTaskLogs(eid: string, month: number, year: number): Promise<TaskLog[]> {
      const { data } = await supabase.from('task_logs')
        .select('*')
        .eq('employee_id', eid)
        .eq('month', month)
        .eq('year', year);
      return (data || []).map(l => this.parseDates(l, ['completed_at']));
  }

  public async addTask(t: any): Promise<any> { 
      if (!t.column_id) {
          const cols = await this.getTaskColumns();
          if (cols.length > 0) t.column_id = cols[0].id;
      }
      const { data } = await supabase.from('tasks').insert({...t, deadline: t.deadline.toISOString()}).select().single(); 
      return data; 
  }

  public async updateTask(t: any): Promise<any> { 
      const { data: currentTask } = await supabase.from('tasks').select('*').eq('id', t.id).single();
      const updatePayload = { ...t };
      
      if (currentTask && t.assigned_to && t.assigned_to !== currentTask.assigned_to) {
          if (currentTask.total_duration > 0) {
              const now = new Date();
              await supabase.from('task_logs').insert({
                  task_id: currentTask.id,
                  employee_id: currentTask.assigned_to,
                  task_title: currentTask.title,
                  duration_seconds: currentTask.total_duration,
                  completed_at: now.toISOString(),
                  month: now.getMonth() + 1,
                  year: now.getFullYear()
              });
          }
          updatePayload.total_duration = 0;
          updatePayload.status = TaskStatus.Pending;
          updatePayload.is_running = false;
          updatePayload.timer_start = null;
          updatePayload.completion_date = null;
      }

      if (t.deadline && t.deadline instanceof Date) {
          updatePayload.deadline = t.deadline.toISOString();
      }
      
      const { data, error } = await supabase.from('tasks').update(updatePayload).eq('id', t.id).select().single(); 
      if (error) throw new Error(error.message);
      return data; 
  }

  public async moveTask(taskId: string, newColumnId: string, newIndex: number): Promise<void> {
      await supabase.from('tasks').update({ column_id: newColumnId, order_index: newIndex }).eq('id', taskId);
  }

  public async startTaskTimer(taskId: string): Promise<void> {
      await supabase.from('tasks').update({
          is_running: true,
          timer_start: new Date().toISOString()
      }).eq('id', taskId);
  }

  public async stopTaskTimer(taskId: string, currentTotal: number): Promise<void> {
      await supabase.from('tasks').update({
          is_running: false,
          timer_start: null,
          total_duration: currentTotal
      }).eq('id', taskId);
  }

  public async completeTask(taskId: string, finalDuration: number, isLowScore: boolean): Promise<void> {
      const now = new Date();
      await supabase.from('tasks').update({
          status: TaskStatus.Done,
          is_running: false,
          timer_start: null,
          total_duration: finalDuration,
          completion_date: now.toISOString()
      }).eq('id', taskId);
  }

  public async getEmployeeAverageTaskTime(eid: string): Promise<number> {
      const { data: currentTasks } = await supabase.from('tasks')
        .select('total_duration')
        .eq('assigned_to', eid)
        .eq('status', 'Done')
        .gt('total_duration', 0);
      
      const { data: logs } = await supabase.from('task_logs')
        .select('duration_seconds')
        .eq('employee_id', eid);

      const allDurations = [
          ...(currentTasks || []).map(t => t.total_duration),
          ...(logs || []).map(l => l.duration_seconds)
      ];
      
      if (allDurations.length === 0) return 0;
      const total = allDurations.reduce((sum, d) => sum + d, 0);
      return total / allDurations.length;
  }

  public async updateTaskStatus(taskId: string, status: TaskStatus): Promise<void> {
    const updateData: any = { status };
    if (status === TaskStatus.Done) updateData.completion_date = new Date().toISOString();
    await supabase.from('tasks').update(updateData).eq('id', taskId);
  }
  public async deleteTask(id: string): Promise<void> { await supabase.from('tasks').delete().eq('id', id); }

  public async getPlan(sheetName: string): Promise<PlanSheet | null> {
      const { data, error } = await supabase.from('plans').select('*').eq('sheet_name', sheetName).maybeSingle();
      if (error && error.code !== 'PGRST116') throw new Error(error.message);
      return data || null;
  }

  public async savePlan(plan: PlanSheet): Promise<void> {
      const existing = await this.getPlan(plan.sheet_name);
      if (existing) {
          const { error } = await supabase.from('plans').update({
              data: plan.data,
              links: plan.links,
              updated_at: new Date().toISOString()
          }).eq('id', existing.id);
          if (error) throw new Error(error.message);
      } else {
          const { error } = await supabase.from('plans').insert({
              title: plan.title,
              sheet_name: plan.sheet_name,
              data: plan.data,
              links: plan.links
          });
          if (error) throw new Error(error.message);
      }
  }

  public async uploadFile(file: File, path: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(path, file, { cacheControl: '3600', upsert: true });

    if (error) {
        if (error.message.includes('Bucket not found') || error.message.includes('The resource was not found')) {
             throw new Error('لم يتم العثور على مساحة التخزين (Bucket).');
        }
        throw new Error('فشل رفع الملف: ' + error.message);
    }
    const { data: publicData } = supabase.storage.from('documents').getPublicUrl(data.path);
    return publicData.publicUrl;
  }

  public async getAllEmployees(): Promise<Employee[]> {
    const { data, error } = await supabase.from('employees').select('*');
    if (error) throw new Error(error.message);
    return data || [];
  }
  public async getEmployee(id: string): Promise<Employee | undefined> {
    const { data, error } = await supabase.from('employees').select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data || undefined;
  }
  public async updateEmployee(updatedEmployee: Employee): Promise<Employee | undefined> {
    const { data, error } = await supabase.from('employees').update(updatedEmployee).eq('id', updatedEmployee.id).select().single();
    if (error) throw new Error(error.message);
    return data || undefined;
  }
  public async addEmployee(employee: Omit<Employee, 'id'>): Promise<Employee> {
    const newEmp = { ...employee, leave_balance: employee.leave_balance ?? 21 };
    const { data, error } = await supabase.from('employees').insert(newEmp).select().single();
    if (error) throw new Error(error.message);
    return data as Employee;
  }
  public async deleteEmployee(id: string): Promise<void> { await supabase.from('employees').delete().eq('id', id); }

  public async getAttendance(date: Date): Promise<AttendanceLog[]> {
    const dateStr = date.toISOString().split('T')[0];
    const { data, error } = await supabase.from('attendance_logs').select('*').eq('date', dateStr);
    if (error) throw new Error(error.message);
    return data || [];
  }

  public async getAttendanceForMonth(eid: string, m: number, y: number): Promise<AttendanceLog[]> {
    const startDateStr = `${y}-${String(m).padStart(2, '0')}-01`;
    const endDateStr = new Date(y, m, 0).toISOString().split('T')[0];
    const { data, error } = await supabase.from('attendance_logs').select('*').eq('employee_id', eid).gte('date', startDateStr).lte('date', endDateStr);
    if (error) throw new Error(error.message);
    return data || [];
  }

  public async upsertAttendance(employeeId: string, date: Date, status: AttendanceStatus): Promise<void> {
    const dateStr = date.toISOString().split('T')[0];
    const { error } = await supabase.from('attendance_logs').upsert(
        { employee_id: employeeId, date: dateStr, status },
        { onConflict: 'employee_id,date' }
    );
    if (error) throw new Error(error.message);
  }

  public async isLeavesLocked(): Promise<boolean> {
    const { data } = await supabase.from('site_configs').select('value').eq('key', 'leaves_locked').single();
    return data?.value === 'true';
  }
  public async setLeavesLocked(locked: boolean): Promise<void> {
    await supabase.from('site_configs').upsert({ key: 'leaves_locked', value: String(locked) });
  }
  public async getLeaveRequests(employeeId: string): Promise<LeaveRequest[]> {
    const { data, error } = await supabase.from('leave_requests').select('*').eq('employee_id', employeeId).order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  }
  public async getAllPendingLeaveRequests(): Promise<(LeaveRequest & { employee: { name: string, role: string } })[]> {
    const { data, error } = await supabase
      .from('leave_requests')
      .select('*, employee:employees(name, role)')
      .eq('status', 'Pending')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map((item: any) => ({ ...item, employee: Array.isArray(item.employee) ? item.employee[0] : item.employee }));
  }
  public async createLeaveRequest(request: Omit<LeaveRequest, 'id' | 'status' | 'created_at'>): Promise<void> {
    const { error } = await supabase.from('leave_requests').insert({ ...request, status: LeaveStatus.Pending });
    if (error) throw new Error(error.message);
  }

  public async approveLeaveRequest(requestId: string, managerComment: string): Promise<void> {
    const { data: request, error: fetchError } = await supabase.from('leave_requests').select('*').eq('id', requestId).single();
    if (fetchError || !request) throw new Error('الطلب غير موجود');
    if (request.status !== LeaveStatus.Pending) throw new Error('لا يمكن تغيير حالة هذا الطلب');

    const employeeId = request.employee_id;
    const leaveType = request.leave_type as LeaveType;
    const days = request.days_count;
    const employee = await this.getEmployee(employeeId);
    if (!employee) throw new Error('الموظف غير موجود');

    if (leaveType === LeaveType.Absence || leaveType === LeaveType.Exceptional) {
       const dailyRate = employee.base_salary / 30;
       const deductionAmount = dailyRate * days;
       const reqDate = new Date(request.start_date);
       await this.addOrUpdateManualDeduction(
         employeeId, reqDate.getMonth() + 1, reqDate.getFullYear(), 
         deductionAmount, true, 
         `خصم ${days} يوم (${leaveType === LeaveType.Absence ? 'غياب' : 'استثنائي'}) - ${reqDate.toLocaleDateString()}`
       );
    } else if (leaveType !== LeaveType.Permission) {
        const newBalance = employee.leave_balance - days;
        await this.updateEmployee({ ...employee, leave_balance: newBalance });
    }

    const { error: updateError } = await supabase.from('leave_requests').update({
        status: LeaveStatus.Approved,
        manager_comment: managerComment
    }).eq('id', requestId);
    if (updateError) throw new Error(updateError.message);
    
    if (leaveType !== LeaveType.Permission) {
        await this.upsertAttendance(employeeId, new Date(request.start_date), AttendanceStatus.Leave);
    }
  }

  public async rejectLeaveRequest(requestId: string, managerComment: string): Promise<void> {
    const { error } = await supabase.from('leave_requests').update({
        status: LeaveStatus.Rejected,
        manager_comment: managerComment
    }).eq('id', requestId);
    if (error) throw new Error(error.message);
  }
  
  public async deleteMonthlyLeaveRequests(eid: string, month: number, year: number): Promise<void> {
      const startDateStr = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDateStr = new Date(year, month, 0).toISOString().split('T')[0];
      await supabase.from('leave_requests').delete().eq('employee_id', eid).gte('start_date', startDateStr).lte('start_date', endDateStr);
      await this.deleteManualDeduction(eid, month, year);
  }
  public async resetAnnualLeaveBalance(eid: string, defaultBalance: number = 21): Promise<void> {
      const emp = await this.getEmployee(eid);
      if (emp) await this.updateEmployee({ ...emp, leave_balance: defaultBalance });
  }

  public async addOrUpdateManualDeduction(eid: string, m: number, y: number, amount: number, isAdditive: boolean = false, note?: string): Promise<void> {
    const { data } = await supabase.from('financials').select('*').eq('employee_id', eid).eq('month', m).eq('year', y).maybeSingle();
    let finalAmount = amount;
    let finalNote = note || '';
    if (data && isAdditive) {
        finalAmount = (data.manual_deduction || 0) + amount;
        const oldNote = data.manual_deduction_note;
        const parts = [oldNote, note].filter(s => s && s.trim() !== '');
        finalNote = parts.join(' | ');
    }
    const payload: any = { employee_id: eid, month: m, year: y, manual_deduction: finalAmount };
    if (finalNote) payload.manual_deduction_note = finalNote;
    if (data && data.id) {
        const { error } = await supabase.from('financials').update(payload).eq('id', data.id);
        if(error) throw new Error(error.message);
    } else {
        const { error } = await supabase.from('financials').insert(payload);
        if(error) throw new Error(error.message);
    }
  }

  public async updateManagerFeedback(eid: string, m: number, y: number, feedback: string): Promise<void> {
    const { data } = await supabase.from('financials').select('id').eq('employee_id', eid).eq('month', m).eq('year', y).maybeSingle();
    const payload = { employee_id: eid, month: m, year: y, manager_feedback: feedback };
    if (data && data.id) {
        const { error } = await supabase.from('financials').update(payload).eq('id', data.id);
        if(error) throw new Error(error.message);
    } else {
        const { error } = await supabase.from('financials').insert(payload);
        if(error) throw new Error(error.message);
    }
  }

  public async updatePerformanceMetrics(eid: string, m: number, y: number, metrics: { commitment_score?: number, is_needs_improvement?: boolean, improvement_note?: string }): Promise<void> {
    const { data } = await supabase.from('financials').select('id').eq('employee_id', eid).eq('month', m).eq('year', y).maybeSingle();
    const payload = { employee_id: eid, month: m, year: y, ...metrics };
    if (data && data.id) {
        const { error } = await supabase.from('financials').update(payload).eq('id', data.id);
        if(error) throw new Error(error.message);
    } else {
        const { error } = await supabase.from('financials').insert(payload);
        if(error) throw new Error(error.message);
    }
  }

  public async deleteManualDeduction(eid: string, m: number, y: number): Promise<void> {
    await supabase.from('financials').update({ manual_deduction: 0, manual_deduction_note: null }).eq('employee_id', eid).eq('month', m).eq('year', y);
  }
  public async resetMonthlyFinancials(eid: string, m: number, y: number): Promise<void> {
    await supabase.from('financials').update({
        manual_deduction: 0, manual_deduction_note: null, calculated_incentive: 0, sales_commission_payout: 0, other_commission_payout: 0, final_payout: 0, manager_feedback: null 
    }).eq('employee_id', eid).eq('month', m).eq('year', y);
    await supabase.from('other_commission_logs').delete().eq('employee_id', eid).eq('month', m).eq('year', y);
  }
  public async addOtherCommissionLog(l: any): Promise<void> { await supabase.from('other_commission_logs').insert(l); }

  public async getKPIConfigs(employeeId: string, month?: number, year?: number): Promise<KPIConfig[]> {
    let query = supabase.from('kpi_configs').select('*').eq('employee_id', employeeId);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
  }
  public async addKPIConfig(config: Omit<KPIConfig, 'id'>): Promise<KPIConfig> {
    const { data, error } = await supabase.from('kpi_configs').insert({ ...config, status: KpiStatus.Draft }).select().single();
    if (error) throw new Error(error.message);
    return data;
  }
  public async updateKPIConfig(config: KPIConfig): Promise<KPIConfig> {
    const { data, error } = await supabase.from('kpi_configs').update(config).eq('id', config.id).select().single();
    if (error) throw new Error(error.message);
    return data;
  }
  public async deleteKPIConfig(id: string): Promise<void> { await supabase.from('kpi_configs').delete().eq('id', id); }

  public async submitKPIPlan(employeeId: string, month: number, year: number): Promise<void> {
      await supabase.from('kpi_configs')
        .update({ status: KpiStatus.Pending })
        .eq('employee_id', employeeId)
        .eq('applicable_month', month)
        .eq('applicable_year', year)
        .in('status', [KpiStatus.Draft, KpiStatus.Rejected]); 
  }

  public async reviewKPI(kpiId: string, status: KpiStatus, feedback?: string): Promise<void> {
      const updateData: any = { status };
      if (feedback) updateData.manager_feedback = feedback;
      await supabase.from('kpi_configs').update(updateData).eq('id', kpiId);
  }

  public async approveAllKPIs(employeeId: string, month: number, year: number): Promise<void> {
      await supabase.from('kpi_configs')
        .update({ status: KpiStatus.Approved, manager_feedback: null }) 
        .eq('employee_id', employeeId)
        .eq('applicable_month', month)
        .eq('applicable_year', year)
        .in('status', [KpiStatus.Pending, KpiStatus.Rejected, KpiStatus.Draft]);
  }

  public async rejectAllKPIs(employeeId: string, month: number, year: number, feedback: string): Promise<void> {
      await supabase.from('kpi_configs')
        .update({ status: KpiStatus.Rejected, manager_feedback: feedback })
        .eq('employee_id', employeeId)
        .eq('applicable_month', month)
        .eq('applicable_year', year)
        .in('status', [KpiStatus.Pending, KpiStatus.Approved]);
  }

  public async getAllKPIRecords(employeeId: string, month?: number, year?: number): Promise<KPIRecord[]> {
    let query = supabase.from('kpi_records').select('*').eq('employee_id', employeeId);
    if (month && year) query = query.eq('month', month).eq('year', year);
    const { data } = await query;
    return (data || []).map(r => this.parseDates(r, ['submission_date']));
  }
  public async addKPIRecord(record: any): Promise<KPIRecord> {
    const { data, error } = await supabase.from('kpi_records').insert({...record, submission_date: new Date().toISOString()}).select().single();
    if (error) throw new Error(error.message);
    return this.parseDates(data, ['submission_date']);
  }
  public async deleteKPIRecord(id: string): Promise<void> { await supabase.from('kpi_records').delete().eq('id', id); }

  public async getEmployeeKPIData(employeeId: string): Promise<EmployeeKPIData[]> {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const configs = await this.getKPIConfigs(employeeId);
    const relevantConfigs = configs.filter(c => (c.applicable_month === currentMonth && c.applicable_year === currentYear) || (!c.applicable_month));
    const records = await this.getAllKPIRecords(employeeId, currentMonth, currentYear);
    const chartData: EmployeeKPIData[] = [];
    records.forEach(r => {
      const config = relevantConfigs.find(c => c.id === r.kpi_config_id);
      if (config) {
        chartData.push({
          week: r.week_number,
          kpi_name: config.kpi_name,
          achieved: r.achieved_value,
          target: config.target_value,
          progress: (r.achieved_value / config.target_value) * 100
        });
      }
    });
    return chartData.sort((a,b) => a.week - b.week);
  }
  public async getEmployeeCurrentKPIProgress(eid: string, m?: number, y?: number): Promise<number> {
    const currentMonth = m || new Date().getMonth() + 1;
    const currentYear = y || new Date().getFullYear();
    const allConfigs = await this.getKPIConfigs(eid);
    const configs = allConfigs.filter(c => (c.applicable_month === currentMonth && c.applicable_year === currentYear) || (!c.applicable_month));
    const records = await this.getAllKPIRecords(eid, currentMonth, currentYear);
    if (configs.length === 0) return 0;
    let totalProgress = 0;
    configs.forEach(conf => {
      const confRecords = records.filter(r => r.kpi_config_id === conf.id);
      const achievedSum = confRecords.reduce((s, r) => s + r.achieved_value, 0);
      totalProgress += Math.min(1, achievedSum / conf.target_value);
    });
    return (totalProgress / configs.length) * 100;
  }

  public async calculatePayroll(eid: string, m: number, y: number): Promise<PayrollBreakdown> {
    const emp = await this.getEmployee(eid);
    if (!emp) throw new Error('ERR');
    const allConfigs = await this.getKPIConfigs(eid);
    const configs = allConfigs.filter(c => 
        ((c.applicable_month === m && c.applicable_year === y) || (!c.applicable_month)) 
        && c.status === KpiStatus.Approved 
    );
    const records = await this.getAllKPIRecords(eid, m, y);
    let totalIncentive = 0;
    let totalProgressScore = 0;
    if (configs.length > 0) {
      configs.forEach(conf => {
        const confRecords = records.filter(r => r.kpi_config_id === conf.id);
        const achievedSum = confRecords.reduce((s, r) => s + r.achieved_value, 0);
        totalProgressScore += Math.min(1, achievedSum / conf.target_value);
      });
      totalProgressScore = (totalProgressScore / configs.length) * 100;
    }
    const INCENTIVE_THRESHOLD = 65;
    if (totalProgressScore >= INCENTIVE_THRESHOLD) {
        configs.forEach(conf => {
            const confRecords = records.filter(r => r.kpi_config_id === conf.id);
            const achievedSum = confRecords.reduce((s, r) => s + r.achieved_value, 0);
            const unitPrice = conf.unit_value || 0;
            totalIncentive += achievedSum * unitPrice;
        });
    }
    const bonus = await this.getEmployeeProblemSolvingBonusTotal(eid, m, y);
    const { data: fin } = await supabase.from('financials').select('*').eq('employee_id', eid).eq('month', m).eq('year', y).maybeSingle();
    const deduction = fin?.manual_deduction || 0;
    const { data: otherComm } = await supabase.from('other_commission_logs').select('amount').eq('employee_id', eid).eq('month', m).eq('year', y);
    const otherCommissionTotal = (otherComm || []).reduce((sum, item) => sum + item.amount, 0);
    const final = emp.base_salary + totalIncentive + bonus + otherCommissionTotal - deduction;
    return { 
      baseSalary: emp.base_salary, kpiIncentive: totalIncentive, problemBonus: bonus, salesCommission: 0, 
      otherCommission: otherCommissionTotal, manualDeduction: deduction, manualDeductionNote: fin?.manual_deduction_note,
      finalPayout: final, kpiScorePercentage: totalProgressScore, totalSalesRevenue: 0, managerFeedback: fin?.manager_feedback,
      commitmentScore: fin?.commitment_score || 0, isNeedsImprovement: fin?.is_needs_improvement || false, improvementNote: fin?.improvement_note || ''
    };
  }

  public async getAllCampaigns(m?: number, y?: number): Promise<Campaign[]> { 
    let query = supabase.from('campaigns').select('*');
    if (m && y) query = query.eq('month', m).eq('year', y);
    const { data } = await query;
    return (data || []).map(c => ({ ...c, expenses: Number(c.expenses) })); 
  }
  public async getAllBehaviorLogs(eid: string, m?: number, y?: number): Promise<BehaviorLog[]> { 
    let query = supabase.from('behavior_logs').select('*').eq('employee_id', eid);
    if (m && y) query = query.eq('month', m).eq('year', y);
    const { data } = await query;
    return data || []; 
  }
  public async getEmployeeOnTimeRate(eid: string, m?: number, y?: number): Promise<number> { 
    let query = supabase.from('tasks').select('deadline, completion_date').eq('assigned_to', eid).eq('status', 'Done');
    if (m && y) {
        const startDateStr = `${y}-${String(m).padStart(2, '0')}-01`;
        const endDateStr = new Date(y, m, 0).toISOString().split('T')[0];
        query = query.gte('completion_date', startDateStr).lte('completion_date', endDateStr);
    }
    const { data } = await query;
    if (!data || data.length === 0) return 100;
    const onTime = data.filter(t => new Date(t.completion_date) <= new Date(t.deadline)); 
    return (onTime.length / data.length) * 100; 
  }
  public async getSiteConfig(key: string): Promise<string | null> { const { data } = await supabase.from('site_configs').select('value').eq('key', key).single(); return data?.value || null; }
  public async updateSiteConfig(key: string, value: string): Promise<void> { await supabase.from('site_configs').upsert({ key, value }); }
  public async getEmployeeMoodAlerts(eid: string): Promise<string[]> { const { data } = await supabase.from('behavior_logs').select('week_number, mood_rating').eq('employee_id', eid).order('week_number', {ascending:false}).limit(3); return (data || []).filter(l => MOOD_RATING_MAP[l.mood_rating as MoodRating] <= MIN_MOOD_RATING_FOR_LOW_FOCUS).map(l => `تراجع أداء أسبوع ${l.week_number}`); }
  public async getEmployeeProblemLogs(eid: string): Promise<ProblemLog[]> { const { data } = await supabase.from('problem_logs').select('*').eq('employee_id', eid); return (data || []).map(l => this.parseDates(l, ['logged_date', 'solved_date'])); }
  public async getEmployeeProblemSolvingBonusTotal(eid: string, m: number, y: number): Promise<number> { const { data } = await supabase.from('problem_logs').select('potential_bonus_amount').eq('employee_id', eid).eq('solution_status', 'Solved'); return (data || []).reduce((s, p) => s + p.potential_bonus_amount, 0); }
  public async getEmployeeBehaviorData(eid: string): Promise<any[]> { const logs = await this.getAllBehaviorLogs(eid); return logs.map(l => ({ week: l.week_number, moodValue: MOOD_RATING_MAP[l.mood_rating as MoodRating] || 5, moodText: l.mood_rating })); }
  public async getAllClients(): Promise<Client[]> { const { data } = await supabase.from('clients').select('*'); return (data || []).map(c => this.parseDates(c, ['acquisition_date'])); }
  public async addBehaviorLog(log: Omit<BehaviorLog, 'id'>): Promise<BehaviorLog> { const { data, error } = await supabase.from('behavior_logs').insert(log).select().single(); if (error) throw new Error(error.message); return data; }
  public async deleteBehaviorLog(id: string): Promise<void> { await supabase.from('behavior_logs').delete().eq('id', id); }
  public async addProblemLog(log: Omit<ProblemLog, 'id' | 'logged_date' | 'solution_status'>): Promise<ProblemLog> {
    const { data, error } = await supabase.from('problem_logs').insert({ ...log, logged_date: new Date().toISOString(), solution_status: SolutionStatus.Unsolved }).select().single();
    if (error) throw new Error(error.message);
    return this.parseDates(data, ['logged_date', 'solved_date']);
  }
  public async updateProblemLog(log: ProblemLog): Promise<ProblemLog> {
    const { data, error } = await supabase.from('problem_logs').update({ ...log, logged_date: log.logged_date.toISOString(), solved_date: log.solved_date?.toISOString() }).eq('id', log.id).select().single();
    if (error) throw new Error(error.message);
    return this.parseDates(data, ['logged_date', 'solved_date']);
  }
  public async deleteProblemLog(id: string): Promise<void> { await supabase.from('problem_logs').delete().eq('id', id); }
  public async addClient(client: Omit<Client, 'id' | 'acquisition_date'>): Promise<Client> {
    const { data, error } = await supabase.from('clients').insert({ ...client, acquisition_date: new Date().toISOString() }).select().single();
    if (error) throw new Error(error.message);
    return this.parseDates(data, ['acquisition_date']);
  }
  public async updateClient(client: Client): Promise<Client> {
    const { data, error } = await supabase.from('clients').update({ ...client, acquisition_date: client.acquisition_date.toISOString() }).eq('id', client.id).select().single();
    if (error) throw new Error(error.message);
    return this.parseDates(data, ['acquisition_date']);
  }
  public async deleteClient(id: string): Promise<void> { await supabase.from('clients').delete().eq('id', id); }
  public async addCampaign(campaign: Omit<Campaign, 'id'>): Promise<Campaign> { const { data, error } = await supabase.from('campaigns').insert(campaign).select().single(); if (error) throw new Error(error.message); return data; }
  public async deleteCampaign(id: string): Promise<void> { await supabase.from('campaigns').delete().eq('id', id); }

  public async getManagerTasks(date: Date): Promise<ManagerTask[]> {
      const dateStr = date.toISOString().split('T')[0];
      const { data } = await supabase.from('manager_tasks').select('*').eq('date', dateStr).order('id', {ascending: true});
      return data || [];
  }

  public async initDailyManagerTasks(date: Date): Promise<void> {
      const dateStr = date.toISOString().split('T')[0];
      const existing = await this.getManagerTasks(date);
      if (existing.length > 0) return;
      const tasksToInsert = DEFAULT_MANAGER_SCHEDULE.map(item => ({
          title: item.title,
          time_slot: item.time,
          status: 'pending',
          date: dateStr,
          is_custom: false
      }));
      await supabase.from('manager_tasks').insert(tasksToInsert);
  }

  public async addManagerTask(task: Omit<ManagerTask, 'id'>): Promise<ManagerTask> {
      const { data, error } = await supabase.from('manager_tasks').insert(task).select().single();
      if(error) throw new Error(error.message);
      return data;
  }

  public async updateManagerTask(task: ManagerTask): Promise<void> {
      await supabase.from('manager_tasks').update(task).eq('id', task.id);
  }

  public async deleteManagerTask(id: string): Promise<void> {
      await supabase.from('manager_tasks').delete().eq('id', id);
  }

  public async getAdCampaigns(): Promise<AdCampaign[]> {
      const { data } = await supabase.from('ad_campaigns').select('*').order('created_at', { ascending: false });
      return data || [];
  }

  public async addAdCampaign(campaign: Omit<AdCampaign, 'id'>): Promise<AdCampaign> {
      const { data, error } = await supabase.from('ad_campaigns').insert(campaign).select().single();
      if(error) throw new Error(error.message);
      return data;
  }

  public async updateAdCampaign(campaign: AdCampaign): Promise<void> {
      await supabase.from('ad_campaigns').update(campaign).eq('id', campaign.id);
  }

  public async deleteAdCampaign(id: string): Promise<void> {
      await supabase.from('ad_campaigns').delete().eq('id', id);
  }
}

export { DataServiceManager };
export const DataService = DataServiceManager.getInstance();
