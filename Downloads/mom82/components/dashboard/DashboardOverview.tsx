
import React, { useState, useEffect, useCallback } from 'react';
import Card from '../common/Card';
import EmployeeCard from './EmployeeCard';
import { DataService } from '../../services/dataService';
import { Employee, EmployeeSummary, AttendanceStatus, AttendanceLog, KpiStatus } from '../../types';
import LoadingSpinner from '../common/LoadingSpinner';
import Alert from '../common/Alert';
import EmployeeForm from '../forms/EmployeeForm';
import ConfirmationModal from '../common/ConfirmationModal';
import { useNavigate } from 'react-router-dom';
import { ATTENDANCE_STATUS_AR_MAP } from '../../constants';
import { supabase } from '../../supabaseClient'; 

const DashboardOverview: React.FC = () => {
  const [employeeSummaries, setEmployeeSummaries] = useState<EmployeeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<string | null>(null);
  const [pendingLeaves, setPendingLeaves] = useState<any[]>([]);
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([]);

  const navigate = useNavigate();

  const fetchDashboardData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError(null);
    try {
      const employees = await DataService.getAllEmployees();
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      const leaves = await DataService.getAllPendingLeaveRequests();
      setPendingLeaves(leaves);
      
      let attLogs: AttendanceLog[] = [];
      try {
        attLogs = await DataService.getAttendance(selectedDate);
      } catch (e) {
        console.warn("Attendance load skipped.");
      }
      setAttendanceLogs(attLogs);

      const summariesResults = await Promise.allSettled(employees.map(async (employee): Promise<EmployeeSummary> => {
        const kpis = await DataService.getKPIConfigs(employee.id, currentMonth, currentYear);
        let planStatus = KpiStatus.Approved;
        if (kpis.some(k => k.status === KpiStatus.Rejected)) planStatus = KpiStatus.Rejected;
        else if (kpis.some(k => k.status === KpiStatus.Pending)) planStatus = KpiStatus.Pending;
        else if (kpis.some(k => k.status === KpiStatus.Draft) || kpis.length === 0) planStatus = KpiStatus.Draft;
        
        const totalKpiProgress = await DataService.getEmployeeCurrentKPIProgress(employee.id);
        const onTimeRate = await DataService.getEmployeeOnTimeRate(employee.id);
        const payroll = await DataService.calculatePayroll(employee.id, currentMonth, currentYear);
        const moodAlerts = await DataService.getEmployeeMoodAlerts(employee.id);
        
        const att = attLogs.find(a => a.employee_id === employee.id);

        let salesTargetProgress = 0;
        if (employee.is_sales_specialist && employee.monthly_sales_target) {
            salesTargetProgress = (payroll.totalSalesRevenue / employee.monthly_sales_target) * 100;
        }

        return {
            employee, kpiSummaries: [], totalKpiProgress, onTimeRate, currentExpectedPayout: payroll.finalPayout, moodAlerts,
            totalSalesRevenue: payroll.totalSalesRevenue, salesTargetProgress,
            kpiPlanStatus: planStatus,
            todaysAttendance: att?.status
        };
      }));

      const summaries = summariesResults
        .filter((r): r is PromiseFulfilledResult<EmployeeSummary> => r.status === 'fulfilled')
        .map(r => r.value);

      setEmployeeSummaries(summaries);
    } catch (err: any) {
      setError(err.message);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  useEffect(() => {
    const channel = supabase.channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leave_requests' }, () => fetchDashboardData(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_logs' }, () => fetchDashboardData(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kpi_configs' }, () => fetchDashboardData(true))
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchDashboardData]);

  const handleAttendanceChange = async (empId: string, status: AttendanceStatus) => {
      try {
          await DataService.upsertAttendance(empId, selectedDate, status);
          setEmployeeSummaries(prev => prev.map(s => s.employee.id === empId ? {...s, todaysAttendance: status} : s));
      } catch (e: any) {
          alert("فشل تحديث الحضور: " + e.message);
      }
  };

  const handleAddEmployee = () => { setEditingEmployee(null); setShowEmployeeForm(true); };
  const handleEditEmployee = (emp: Employee) => { setEditingEmployee(emp); setShowEmployeeForm(true); };
  const handleDeleteEmployee = async (id: string) => { setEmployeeToDelete(id); setShowDeleteConfirm(true); };
  const confirmDeleteEmployee = async () => {
    if (employeeToDelete) {
        try { await DataService.deleteEmployee(employeeToDelete); setShowDeleteConfirm(false); fetchDashboardData(); } 
        catch (err: any) { setError(err.message); }
    }
  };
  const handleEmployeeFormSubmit = async (d: any) => {
      if (d.id) await DataService.updateEmployee(d); else await DataService.addEmployee(d);
      setShowEmployeeForm(false); fetchDashboardData();
  };

  const finishedKpisCount = employeeSummaries.filter(s => s.kpiPlanStatus === KpiStatus.Approved).length;
  const pendingKpisCount = employeeSummaries.filter(s => s.kpiPlanStatus === KpiStatus.Pending).length;
  const onLeaveCount = employeeSummaries.filter(s => s.todaysAttendance === AttendanceStatus.Leave).length;
  const absentCount = employeeSummaries.filter(s => s.todaysAttendance === AttendanceStatus.Absent).length;
  const presentCount = employeeSummaries.filter(s => s.todaysAttendance === AttendanceStatus.Present || s.todaysAttendance === AttendanceStatus.WFH).length;

  if (loading) return <div className="h-64 flex justify-center items-center"><LoadingSpinner /></div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="bg-gradient-to-r from-slate-700 to-slate-900 rounded-[32px] p-8 text-white shadow-xl relative overflow-hidden">
         <div className="absolute top-0 right-0 p-10 opacity-10 text-9xl">👋</div>
         <div className="relative z-10">
            <h1 className="text-4xl font-black mb-2">صباح الخير يا مستر عبدالرحمن ☀️</h1>
            <p className="text-slate-200 text-lg mb-6">إليك ملخص سريع لأداء فريقك اليوم:</p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                    <p className="text-xs text-slate-300 font-bold uppercase mb-1">حالة خطط KPIs</p>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-black text-white">{finishedKpisCount}</span>
                        <span className="text-xs mb-1">من أصل {employeeSummaries.length} مكتمل</span>
                    </div>
                    {pendingKpisCount > 0 && <p className="text-xs text-yellow-300 mt-1">⚠️ {pendingKpisCount} بانتظار الموافقة</p>}
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                    <p className="text-xs text-slate-300 font-bold uppercase mb-1">تواجد الفريق اليوم</p>
                    {onLeaveCount === 0 && absentCount === 0 ? (
                        <div className="text-green-300 font-bold text-lg mt-1">✅ الفريق مكتمل</div>
                    ) : (
                        <div className="text-white">
                            <span className="font-bold">{presentCount}</span> حاضر 
                            <span className="mx-2 opacity-50">|</span>
                            <span className="text-red-300">{absentCount}</span> غياب
                        </div>
                    )}
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 col-span-2">
                     <div className="flex justify-between items-center mb-2">
                        <p className="text-xs text-slate-300 font-bold uppercase">سجل الحضور ({selectedDate.toLocaleDateString()})</p>
                        <input 
                            type="date" 
                            value={selectedDate.toISOString().split('T')[0]} 
                            onChange={(e) => setSelectedDate(new Date(e.target.value))}
                            className="bg-black/30 text-white text-xs rounded p-1 border-none outline-none"
                        />
                     </div>
                     <div className="flex gap-3 overflow-x-auto pb-2">
                         {employeeSummaries.map(s => (
                             <div key={s.employee.id} className="min-w-[100px] bg-black/20 rounded-xl p-2 text-center">
                                 <p className="text-xs font-bold truncate mb-1">{s.employee.name.split(' ')[0]}</p>
                                 <select 
                                    value={s.todaysAttendance || ''}
                                    onChange={(e) => handleAttendanceChange(s.employee.id, e.target.value as AttendanceStatus)}
                                    className="w-full text-[10px] bg-white/20 text-white rounded border-none p-1"
                                 >
                                     <option value="">--</option>
                                     <option value={AttendanceStatus.Present}>حاضر</option>
                                     <option value={AttendanceStatus.WFH}>من المنزل</option>
                                     <option value={AttendanceStatus.Absent}>غائب</option>
                                     <option value={AttendanceStatus.Leave}>إجازة</option>
                                     <option value={AttendanceStatus.Permission}>إذن</option>
                                 </select>
                             </div>
                         ))}
                     </div>
                </div>
            </div>
         </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-black text-gray-800 dark:text-white">بطاقات الموظفين</h2>
        <button onClick={handleAddEmployee} className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg hover:bg-black transition-all">
          + إضافة موظف
        </button>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {employeeSummaries.map(summary => (
          <EmployeeCard
            key={summary.employee.id}
            summary={summary}
            onEdit={handleEditEmployee}
            onDelete={handleDeleteEmployee}
          />
        ))}
      </div>

      {showEmployeeForm && <EmployeeForm employee={editingEmployee} onClose={() => setShowEmployeeForm(false)} onSubmit={handleEmployeeFormSubmit} isModal={true} />}
      <ConfirmationModal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} onConfirm={confirmDeleteEmployee} title="تأكيد الحذف" message="هل أنت متأكد؟" />
    </div>
  );
};

export default DashboardOverview;
