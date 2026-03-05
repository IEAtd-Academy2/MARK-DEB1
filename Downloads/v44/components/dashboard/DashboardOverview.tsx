
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
import WeeklyReportModal from './WeeklyReportModal';
import QuickActionModal from './QuickActionModal';

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

  // New Modals State
  const [showWeeklyReportModal, setShowWeeklyReportModal] = useState(false);
  const [showQuickActionModal, setShowQuickActionModal] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false); // We might just redirect

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
      
      {/* Header & Shortcuts */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-[32px] p-8 text-white shadow-xl relative overflow-hidden">
         <div className="absolute top-0 right-0 p-10 opacity-10 text-9xl">🚀</div>
         <div className="relative z-10">
            <h1 className="text-4xl font-black mb-2">Valu Edition v4</h1>
            <p className="text-slate-300 text-lg mb-8">لوحة التحكم الرئيسية</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button 
                    onClick={() => navigate('/reports')}
                    className="bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all p-4 rounded-2xl border border-white/10 text-center group"
                >
                    <span className="text-3xl block mb-2 group-hover:scale-110 transition-transform">💰</span>
                    <span className="font-bold text-sm">تظبيط المرتبات</span>
                </button>

                <button 
                    onClick={() => setShowWeeklyReportModal(true)}
                    className="bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all p-4 rounded-2xl border border-white/10 text-center group"
                >
                    <span className="text-3xl block mb-2 group-hover:scale-110 transition-transform">📝</span>
                    <span className="font-bold text-sm">إضافة تقرير أسبوعي</span>
                </button>

                <button 
                    onClick={() => setShowQuickActionModal(true)}
                    className="bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all p-4 rounded-2xl border border-white/10 text-center group"
                >
                    <span className="text-3xl block mb-2 group-hover:scale-110 transition-transform">⚡</span>
                    <span className="font-bold text-sm">إجراء سريع (خصم/حافز)</span>
                </button>

                <button 
                    onClick={() => navigate('/campaign-reports')}
                    className="bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all p-4 rounded-2xl border border-white/10 text-center group"
                >
                    <span className="text-3xl block mb-2 group-hover:scale-110 transition-transform">📢</span>
                    <span className="font-bold text-sm">تقارير الحملات</span>
                </button>
            </div>
         </div>
      </div>

      {/* Attendance Summary */}
      <div className="bg-white dark:bg-ui-darkCard rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-white/5">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    📅 سجل الحضور اليومي
                    <span className="text-xs font-normal text-gray-500 bg-gray-100 dark:bg-white/10 px-2 py-1 rounded-full">{selectedDate.toLocaleDateString()}</span>
                </h3>
                <input 
                    type="date" 
                    value={selectedDate.toISOString().split('T')[0]} 
                    onChange={(e) => setSelectedDate(new Date(e.target.value))}
                    className="bg-gray-50 dark:bg-black/20 text-gray-800 dark:text-white text-xs rounded p-2 border border-gray-200 dark:border-white/10 outline-none"
                />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-xl text-center">
                    <span className="block text-2xl font-black text-green-600 dark:text-green-400">{presentCount}</span>
                    <span className="text-xs text-green-800 dark:text-green-300">حاضر</span>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-xl text-center">
                    <span className="block text-2xl font-black text-red-600 dark:text-red-400">{absentCount}</span>
                    <span className="text-xs text-red-800 dark:text-red-300">غياب</span>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-xl text-center">
                    <span className="block text-2xl font-black text-yellow-600 dark:text-yellow-400">{onLeaveCount}</span>
                    <span className="text-xs text-yellow-800 dark:text-yellow-300">إجازة</span>
                </div>
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-xl text-center">
                    <span className="block text-2xl font-black text-indigo-600 dark:text-indigo-400">{finishedKpisCount}</span>
                    <span className="text-xs text-indigo-800 dark:text-indigo-300">KPIs مكتملة</span>
                </div>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {employeeSummaries.map(s => (
                    <div key={s.employee.id} className="min-w-[120px] bg-gray-50 dark:bg-black/20 rounded-xl p-3 text-center border border-gray-100 dark:border-white/5">
                        <p className="text-xs font-bold truncate mb-2 text-gray-800 dark:text-gray-200">{s.employee.name.split(' ')[0]}</p>
                        <select 
                        value={s.todaysAttendance || ''}
                        onChange={(e) => handleAttendanceChange(s.employee.id, e.target.value as AttendanceStatus)}
                        className={`w-full text-[10px] rounded border-none p-1.5 font-bold ${
                            s.todaysAttendance === AttendanceStatus.Present ? 'bg-green-100 text-green-800' :
                            s.todaysAttendance === AttendanceStatus.Absent ? 'bg-red-100 text-red-800' :
                            s.todaysAttendance === AttendanceStatus.Leave ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-200 text-gray-800'
                        }`}
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
      
      {showWeeklyReportModal && <WeeklyReportModal onClose={() => setShowWeeklyReportModal(false)} onSave={() => {}} />}
      {showQuickActionModal && <QuickActionModal onClose={() => setShowQuickActionModal(false)} onSave={() => fetchDashboardData()} />}
    </div>
  );
};

export default DashboardOverview;
