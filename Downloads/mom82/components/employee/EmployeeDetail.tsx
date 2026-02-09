
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import Card from '../common/Card';
import { DataService } from '../../services/dataService';
import { Employee, KPIRecord, ProblemLog, BehaviorLog, PayrollBreakdown, KPIConfig, Task, Role, Department, EmployeeTaskDisplay, BehaviorChartData, EmployeeKPIData, LeaveRequest, TaskLog } from '../../types';
import LoadingSpinner from '../common/LoadingSpinner';
import Alert from '../common/Alert';
import EmployeeKPICard from './EmployeeKPICard';
import EmployeeTasks from './EmployeeTasks';
import EmployeeBehaviorChart from './EmployeeBehaviorChart';
import EmployeeProblemLog from './EmployeeProblemLog';
import EmployeeFinancialsCard from './EmployeeFinancialsCard';
import EmployeeLeaveCard from './EmployeeLeaveCard'; 
import KpiSubmissionForm from '../forms/KpiSubmissionForm';
import BehaviorLogForm from '../forms/BehaviorLogForm';
import ProblemLogForm from '../forms/ProblemLogForm';
import ManualDeductionForm from '../forms/ManualDeductionForm';
import EmployeeForm from '../forms/EmployeeForm';
import KpiConfigForm from '../forms/KpiConfigForm';
import TaskForm from '../forms/TaskForm';
import Button from '../common/Button';
import ConfirmationModal from '../common/ConfirmationModal';
import { DEPARTMENT_AR_MAP, ROLE_AR_MAP } from '../../constants';
import OtherCommissionForm from '../forms/OtherCommissionForm';
import { supabase } from '../../supabaseClient'; 

interface EmployeeDetailProps {
  isPortalView?: boolean;
  overrideId?: string;
}

const EmployeeDetail: React.FC<EmployeeDetailProps> = ({ isPortalView = false, overrideId }) => {
  const { id: paramId } = useParams<{ id: string }>();
  const id = overrideId || paramId;

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [payrollBreakdown, setPayrollBreakdown] = useState<PayrollBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [allKpiRecords, setAllKpiRecords] = useState<KPIRecord[]>([]);
  const [kpiChartData, setKpiChartData] = useState<EmployeeKPIData[]>([]);
  const [kpiConfigs, setKpiConfigs] = useState<KPIConfig[]>([]);
  const [activeTasks, setActiveTasks] = useState<EmployeeTaskDisplay[]>([]);
  const [allBehaviorLogs, setAllBehaviorLogs] = useState<BehaviorLog[]>([]);
  const [behaviorChartData, setBehaviorChartData] = useState<BehaviorChartData[]>([]);
  const [moodAlerts, setMoodAlerts] = useState<string[]>([]);
  const [allProblemLogs, setAllProblemLogs] = useState<ProblemLog[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]); 
  
  const [taskHistory, setTaskHistory] = useState<{title: string, date: string, duration: number}[]>([]);

  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [showKpiSubmissionForm, setShowKpiSubmissionForm] = useState(false);
  const [showKpiConfigForm, setShowKpiConfigForm] = useState(false);
  const [showBehaviorForm, setShowBehaviorForm] = useState(false);
  const [showProblemForm, setShowProblemForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showDeductionForm, setShowDeductionForm] = useState(false);
  const [showOtherCommissionForm, setShowOtherCommissionForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: string; id: string } | null>(null);

  const now = new Date();
  const releaseDate = new Date(selectedYear, selectedMonth, 7); 
  const canViewFinancials = !isPortalView || now >= releaseDate;

  // Calculate Potential Incentive (100% target achievement)
  const totalPotentialIncentive = useMemo(() => {
    return kpiConfigs.reduce((sum, config) => sum + (Number(config.target_value || 0) * Number(config.unit_value || 0)), 0);
  }, [kpiConfigs]);

  const fetchEmployeeDetails = useCallback(async (isSilent = false) => {
    if (!id) return;
    if (!isSilent) setLoading(true);
    
    try {
      const fetchedEmployee = await DataService.getEmployee(id);
      if (!fetchedEmployee) throw new Error('بيانات الموظف غير موجودة.');
      setEmployee(fetchedEmployee);

      const [configs, kpiRecords, kpiData, tasks, behaviorLogs, behaviorData, alerts, problemLogs, breakdown, leaves, taskLogs] = await Promise.all([
        DataService.getKPIConfigs(id, selectedMonth, selectedYear), 
        DataService.getAllKPIRecords(id, selectedMonth, selectedYear),
        DataService.getEmployeeKPIData(id),
        DataService.getEmployeeTasks(id),
        DataService.getAllBehaviorLogs(id, selectedMonth, selectedYear),
        DataService.getEmployeeBehaviorData(id),
        DataService.getEmployeeMoodAlerts(id),
        DataService.getEmployeeProblemLogs(id),
        DataService.calculatePayroll(id, selectedMonth, selectedYear),
        DataService.getLeaveRequests(id),
        DataService.getEmployeeTaskLogs(id, selectedMonth, selectedYear)
      ]);

      setKpiConfigs(configs);
      setAllKpiRecords(kpiRecords);
      setKpiChartData(kpiData);
      setActiveTasks(tasks);
      setAllBehaviorLogs(behaviorLogs);
      setBehaviorChartData(behaviorData);
      setMoodAlerts(alerts);
      setAllProblemLogs(problemLogs);
      setPayrollBreakdown(breakdown);
      setLeaveRequests(leaves);

      const combinedHistory = [...tasks.filter(t => t.status === 'Done'), ...taskLogs];
      setTaskHistory(combinedHistory.map(t => ({ title: t.title || t.task_title, date: t.completion_date || t.completed_at, duration: t.total_duration || t.duration_seconds })));
    } catch (err: any) {
      setError(err.message);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [id, selectedMonth, selectedYear]);

  useEffect(() => { fetchEmployeeDetails(false); }, [fetchEmployeeDetails]);

  useEffect(() => {
    if (!id) return;
    const channel = supabase.channel(`employee-realtime-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leave_requests', filter: `employee_id=eq.${id}` }, () => fetchEmployeeDetails(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `assigned_to=eq.${id}` }, () => fetchEmployeeDetails(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'financials', filter: `employee_id=eq.${id}` }, () => fetchEmployeeDetails(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kpi_configs', filter: `employee_id=eq.${id}` }, () => fetchEmployeeDetails(true))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, fetchEmployeeDetails]);

  const handleDeleteItem = (type: string, id: string) => { setItemToDelete({ type, id }); setShowDeleteConfirm(true); };
  
  const confirmDelete = async () => {
      if (!itemToDelete) return;
      try {
          if (itemToDelete.type === 'kpi_record') await DataService.deleteKPIRecord(itemToDelete.id);
          if (itemToDelete.type === 'kpi_config') await DataService.deleteKPIConfig(itemToDelete.id);
          if (itemToDelete.type === 'behavior') await DataService.deleteBehaviorLog(itemToDelete.id);
          if (itemToDelete.type === 'problem') await DataService.deleteProblemLog(itemToDelete.id);
          if (itemToDelete.type === 'task') await DataService.deleteTask(itemToDelete.id);
          if (itemToDelete.type === 'deduction') await DataService.deleteManualDeduction(id!, selectedMonth, selectedYear);
          setShowDeleteConfirm(false);
          fetchEmployeeDetails(true);
      } catch (e: any) { alert(e.message); }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><LoadingSpinner /></div>;
  if (error) return <Alert type="error" message={error} />;
  if (!employee || !payrollBreakdown) return <Alert type="error" message="Employee not found" />;

  return (
    <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
         <div>
            <h2 className="text-3xl font-black text-ui-lightText dark:text-ui-darkText">{employee.name}</h2>
            <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-bold text-gray-500 dark:text-gray-400">{ROLE_AR_MAP[employee.role as Role]}</span>
                <span className="text-gray-300">•</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">{DEPARTMENT_AR_MAP[employee.department as Department]}</span>
            </div>
         </div>
         
         <div className="flex gap-3">
             {!isPortalView && (
                 <div className="flex gap-2 bg-white dark:bg-white/5 p-1 rounded-xl shadow-sm border border-gray-100 dark:border-white/10">
                    <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="bg-transparent p-2 text-sm font-bold outline-none cursor-pointer text-indigo-600">
                        {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>{new Date(2000, i).toLocaleString('ar-EG', {month: 'long'})}</option>)}
                    </select>
                    <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="bg-transparent p-2 text-sm font-bold outline-none border-r border-gray-200 dark:border-white/10 cursor-pointer text-indigo-600">
                        {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                 </div>
             )}
             {!isPortalView && <Button onClick={() => setShowEmployeeForm(true)} variant="secondary" size="sm">تعديل البيانات</Button>}
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6 lg:col-span-1">
             <EmployeeFinancialsCard 
                employeeId={employee.id} 
                payrollBreakdown={payrollBreakdown}
                onAddDeduction={() => setShowDeductionForm(true)}
                onDeleteDeduction={() => handleDeleteItem('deduction', 'current')}
                onAddOtherCommission={() => setShowOtherCommissionForm(true)}
                onResetFinancials={!isPortalView ? async () => {
                    if(window.confirm(`تأكيد تصفير الدفتر المالي لشهر ${selectedMonth}/${selectedYear}؟`)) {
                        await DataService.resetMonthlyFinancials(employee.id, selectedMonth, selectedYear);
                        fetchEmployeeDetails(true);
                    }
                } : undefined}
                isSalesSpecialist={employee.is_sales_specialist || false}
                isReadOnly={isPortalView}
                canViewDetails={canViewFinancials} 
                releaseDate={releaseDate} 
                targetPotentialIncentive={totalPotentialIncentive}
             />
             <EmployeeLeaveCard 
                employeeId={employee.id} 
                leaveBalance={employee.leave_balance} 
                leaveRequests={leaveRequests} 
                onRefresh={() => fetchEmployeeDetails(true)} 
                isManagerView={!isPortalView}
             />
        </div>

        <div className="space-y-6 lg:col-span-2">
            <EmployeeKPICard 
                employeeId={employee.id}
                allKpiRecords={allKpiRecords}
                kpiChartData={kpiChartData}
                kpiConfigs={kpiConfigs}
                onAddKpiRecord={() => setShowKpiSubmissionForm(true)}
                onEditKpiRecord={(r) => {}}
                onDeleteKpiRecord={(id) => handleDeleteItem('kpi_record', id)}
                onDeleteKpiConfig={(id) => handleDeleteItem('kpi_config', id)}
                onConfigureKpi={() => setShowKpiConfigForm(true)}
                isReadOnly={isPortalView}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <EmployeeTasks 
                    employeeId={employee.id}
                    activeTasks={activeTasks}
                    onAddTask={() => setShowTaskForm(true)}
                    onEditTask={(t) => {}}
                    onDeleteTask={(id) => handleDeleteItem('task', id)}
                    onTaskUpdate={() => fetchEmployeeDetails(true)}
                    isReadOnly={isPortalView}
                />
                <EmployeeBehaviorChart 
                    employeeId={employee.id}
                    allBehaviorLogs={allBehaviorLogs}
                    behaviorChartData={behaviorChartData}
                    moodAlerts={moodAlerts}
                    onAddBehaviorLog={() => setShowBehaviorForm(true)}
                    onEditBehaviorLog={(l) => {}}
                    onDeleteBehaviorLog={(id) => handleDeleteItem('behavior', id)}
                    isReadOnly={isPortalView}
                />
            </div>
        </div>
      </div>

      {showEmployeeForm && <EmployeeForm employee={employee} onClose={() => setShowEmployeeForm(false)} onSubmit={async (d) => { await DataService.updateEmployee(d as Employee); fetchEmployeeDetails(true); }} isModal={true} />}
      {showKpiSubmissionForm && <KpiSubmissionForm employeeId={employee.id} onClose={() => setShowKpiSubmissionForm(false)} onSubmit={async () => { fetchEmployeeDetails(true); }} isModal={true} />}
      {showKpiConfigForm && <KpiConfigForm employeeId={employee.id} onClose={() => setShowKpiConfigForm(false)} onSubmit={async () => { fetchEmployeeDetails(true); }} isModal={true} />}
      {showBehaviorForm && <BehaviorLogForm employeeId={employee.id} onClose={() => setShowBehaviorForm(false)} onSubmit={async (d) => { await DataService.addBehaviorLog(d); fetchEmployeeDetails(true); }} isModal={true} />}
      {showProblemForm && <ProblemLogForm employeeId={employee.id} onClose={() => setShowProblemForm(false)} onSubmit={async (d) => { await DataService.addProblemLog(d); fetchEmployeeDetails(true); }} isModal={true} />}
      {showDeductionForm && <ManualDeductionForm employeeId={employee.id} month={selectedMonth} year={selectedYear} onClose={() => setShowDeductionForm(false)} onSubmit={async (a, n) => { await DataService.addOrUpdateManualDeduction(employee.id, selectedMonth, selectedYear, a, true, n); fetchEmployeeDetails(true); }} isModal={true} />}
      {showTaskForm && <TaskForm employeeId={employee.id} onClose={() => setShowTaskForm(false)} onSubmit={async (t) => { await DataService.addTask(t); fetchEmployeeDetails(true); }} isModal={true} />}
      {showOtherCommissionForm && <OtherCommissionForm employeeId={employee.id} month={selectedMonth} year={selectedYear} onClose={() => setShowOtherCommissionForm(false)} onSubmit={async (a, d) => { await DataService.addOtherCommissionLog({ employee_id: employee.id, month: selectedMonth, year: selectedYear, amount: a, description: d }); fetchEmployeeDetails(true); }} isModal={true} />}

      <ConfirmationModal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} onConfirm={confirmDelete} title="تأكيد الحذف" message="هل أنت متأكد؟" />
    </div>
  );
};

export default EmployeeDetail;
