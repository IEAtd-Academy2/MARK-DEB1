
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Card from '../components/common/Card';
import Alert from '../components/common/Alert';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { DataService } from '../services/dataService';
import { EmployeeSummary, Employee, Client, PayrollBreakdown, KPIConfig, KPIRecord } from '../types';
import { ROLE_AR_MAP, DEPARTMENT_AR_MAP, MOOD_RATING_MAP } from '../constants';
import ProgressBar from '../components/common/ProgressBar';
import AIAnalysisModal from '../components/dashboard/AIAnalysisModal'; // Import Modal
import PerformanceEditModal from '../components/dashboard/PerformanceEditModal';
import Button from '../components/common/Button';
import { supabase } from '../supabaseClient'; // Import Supabase

interface TaskAnalytics {
    avgTime: number;
    totalCompleted: number;
    slowestTasks: {title: string, duration: number}[];
    history: {title: string, date: string, duration: number}[];
}

interface EmployeeReportData {
  employee: Employee;
  payroll: PayrollBreakdown;
  kpiProgress: number;
  performanceScore: number;
  averageMood: number;
  totalMoodScore: number;
  attendanceCount: number;
  taskAnalytics: TaskAnalytics;
  kpiConfigs: KPIConfig[];
  kpiRecords: KPIRecord[];
}

const ReportsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for Month/Year Selection
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [campaignExpenses, setCampaignExpenses] = useState<number>(0);
  const [clients, setClients] = useState<Client[]>([]);
  const [employeeReports, setEmployeeReports] = useState<EmployeeReportData[]>([]);
  
  // New State for AI Modal
  const [showAIModal, setShowAIModal] = useState(false);
  
  // Row Expansion State
  const [expandedEmployeeId, setExpandedEmployeeId] = useState<string | null>(null);
  const [editingReport, setEditingReport] = useState<EmployeeReportData | null>(null);

  const fetchReportsData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Get Campaign Expenses for selected month
      const campaigns = await DataService.getAllCampaigns(selectedMonth, selectedYear);
      // Safety check: force parsing to number just in case
      const totalCampaignCosts = campaigns.reduce((sum, c) => sum + (Number(c.expenses) || 0), 0);
      setCampaignExpenses(totalCampaignCosts);

      // 2. Get Clients acquired in selected month
      const allClients = await DataService.getAllClients();
      const monthClients = allClients.filter(c => {
        const date = new Date(c.acquisition_date);
        return (date.getMonth() + 1) === selectedMonth && date.getFullYear() === selectedYear;
      });
      setClients(monthClients);

      // 3. Get Employee Data & Calculate Payroll & Tasks for SELECTED Month
      const employees = await DataService.getAllEmployees();
      const reports = await Promise.all(employees.map(async (emp) => {
        // Financials & KPIs
        const payroll = await DataService.calculatePayroll(emp.id, selectedMonth, selectedYear);
        const kpiProgress = await DataService.getEmployeeCurrentKPIProgress(emp.id, selectedMonth, selectedYear);
        const onTimeRate = await DataService.getEmployeeOnTimeRate(emp.id, selectedMonth, selectedYear);
        
        // Fetch detailed KPI data
        const kpiConfigs = await DataService.getKPIConfigs(emp.id, selectedMonth, selectedYear);
        const kpiRecords = await DataService.getAllKPIRecords(emp.id, selectedMonth, selectedYear);

        // Behavioral
        const logs = await DataService.getAllBehaviorLogs(emp.id, selectedMonth, selectedYear);
        const moodValues = logs.map(l => {
            if (typeof l.mood_rating === 'number') return l.mood_rating;
            if (!isNaN(Number(l.mood_rating))) return Number(l.mood_rating);
            return MOOD_RATING_MAP[l.mood_rating] || 5;
        });
        const avgMood = moodValues.length > 0 ? moodValues.reduce((a,b) => a+b, 0) / moodValues.length : 5;
        const totalMoodScore = moodValues.reduce((a,b) => a+b, 0);

        // Attendance
        const attendanceLogs = await DataService.getAttendanceForMonth(emp.id, selectedMonth, selectedYear);
        const absences = attendanceLogs.filter(l => l.status === 'Absent').length;

        // Performance Score Calculation
        // KPI (40%) + Commitment (30%) + Attendance (20%) + Mood (10%)
        const kpiScore = kpiProgress;
        const commitmentScore = payroll.commitmentScore || 0;
        const attendanceScore = Math.max(0, 100 - (absences * 5)); // 5 points penalty per absence
        const moodScore = (avgMood / 10) * 100;

        const perfScore = (kpiScore * 0.4) + (commitmentScore * 0.3) + (attendanceScore * 0.2) + (moodScore * 0.1);
        const normalizedPerfScore = perfScore / 100;

        // --- Task Analytics Logic ---
        // 1. Active Completed Tasks
        const allTasks = await DataService.getEmployeeTasks(emp.id);
        const currentMonthTasks = allTasks.filter((t: any) => {
            if (!t.completion_date || t.status !== 'Done') return false;
            const d = new Date(t.completion_date);
            return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
        }).map((t: any) => ({
            title: t.title,
            date: t.completion_date,
            duration: t.total_duration || 0
        }));

        // 2. Historical Logs
        const historyLogs = await DataService.getEmployeeTaskLogs(emp.id, selectedMonth, selectedYear);
        const historyItems = historyLogs.map((l: any) => ({
            title: l.task_title,
            date: l.completed_at,
            duration: l.duration_seconds
        }));

        // 3. Combine & Calculate
        const combined = [...currentMonthTasks, ...historyItems];
        let avgTime = 0;
        let slowestTasks: {title: string, duration: number}[] = [];
        
        if (combined.length > 0) {
            const totalSeconds = combined.reduce((sum, t) => sum + t.duration, 0);
            avgTime = totalSeconds / combined.length;
            slowestTasks = [...combined].sort((a,b) => b.duration - a.duration).slice(0, 3);
        }

        const taskAnalytics: TaskAnalytics = {
            avgTime,
            totalCompleted: combined.length,
            slowestTasks,
            history: combined
        };

        return { 
            employee: emp, 
            payroll, 
            kpiProgress, 
            performanceScore: normalizedPerfScore, 
            averageMood: avgMood, 
            totalMoodScore,
            attendanceCount: absences,
            taskAnalytics, 
            kpiConfigs, 
            kpiRecords 
        };
      }));
      setEmployeeReports(reports);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchReportsData();
  }, [fetchReportsData]);

  // Realtime Subscription for Campaigns
  useEffect(() => {
    const channel = supabase.channel('reports-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'campaigns' }, () => {
        // Trigger fetch to update expenses
        fetchReportsData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, () => {
        // Trigger fetch to update clients revenue
        fetchReportsData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchReportsData]);

  const totalRevenue = useMemo(() => clients.reduce((sum, c) => sum + c.initial_revenue, 0), [clients]);
  
  const topPerformers = useMemo(() => [...employeeReports]
      .filter(r => !r.payroll.isExcludedFromTopPerformers)
      .sort((a,b) => b.performanceScore - a.performanceScore)
      .slice(0, 3), [employeeReports]);
  const happiestEmployees = useMemo(() => [...employeeReports].sort((a,b) => b.totalMoodScore - a.totalMoodScore).slice(0, 3), [employeeReports]);
  const needsImprovement = useMemo(() => employeeReports.filter(r => r.payroll.isNeedsImprovement), [employeeReports]);

  const formatTime = (seconds: number) => {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      if (h > 0) return `${h}h ${m}m`;
      if (m > 0) return `${m}m ${s}s`;
      return `${s}s`;
  };

  const toggleRow = (id: string) => {
      if (expandedEmployeeId === id) setExpandedEmployeeId(null);
      else setExpandedEmployeeId(id);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white">التقارير والتحليلات الشاملة</h2>
          <p className="text-gray-500">مراجعة الأداء والميزانية والرضا الوظيفي</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            {/* AI Analysis Button */}
            <Button 
                onClick={() => setShowAIModal(true)}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2 px-6"
            >
                <span>✨</span> تحليل الذكاء الاصطناعي
            </Button>

            {/* Month/Year Selector - Controls ALL calculations on page */}
            <Card className="flex items-center justify-center gap-3 p-2 bg-white dark:bg-ui-darkCard shadow-sm border border-indigo-100 dark:border-white/10">
            <span className="text-xs font-bold text-indigo-800 dark:text-indigo-400 mr-2">فترة التقرير:</span>
            <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="border-none bg-transparent font-bold text-indigo-700 dark:text-indigo-300 focus:ring-0 cursor-pointer text-sm"
            >
                {[...Array(12)].map((_, i) => (
                <option key={i+1} value={i+1}>{new Date(2000, i).toLocaleString('ar-EG', { month: 'long' })}</option>
                ))}
            </select>
            <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="border-none bg-transparent font-bold text-indigo-700 dark:text-indigo-300 focus:ring-0 cursor-pointer text-sm"
            >
                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            </Card>
        </div>
      </div>

      {/* --- Financial Summary --- */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
        <Card className="bg-red-50 dark:bg-red-900/10 border-r-4 border-red-500 p-4">
          <span className="text-red-600 dark:text-red-400 text-[10px] md:text-xs font-bold uppercase">مصاريف الحملات</span>
          <div className="text-xl md:text-2xl font-bold text-red-700 dark:text-red-300 mt-1">{campaignExpenses.toLocaleString()} <span className="text-[10px] md:text-sm">ج.م</span></div>
          <p className="text-[10px] md:text-xs text-red-400 mt-1">تلقائي من صفحة الحملات</p>
        </Card>
        <Card className="bg-green-50 dark:bg-green-900/10 border-r-4 border-green-500 p-4">
          <span className="text-green-600 dark:text-green-400 text-[10px] md:text-xs font-bold uppercase">العائد الإجمالي</span>
          <div className="text-xl md:text-2xl font-bold text-green-700 dark:text-green-300 mt-1">{totalRevenue.toLocaleString()} <span className="text-[10px] md:text-sm">ج.م</span></div>
          <p className="text-[10px] md:text-xs text-green-400 mt-1">من إيراد العملاء الجدد</p>
        </Card>
        <Card className="bg-blue-50 dark:bg-blue-900/10 border-r-4 border-blue-500 p-4">
          <span className="text-blue-600 dark:text-blue-400 text-[10px] md:text-xs font-bold uppercase">عدد العملاء الجدد</span>
          <div className="text-xl md:text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">{clients.length} <span className="text-[10px] md:text-sm">عميل</span></div>
          <p className="text-[10px] md:text-xs text-blue-400 mt-1">في الفترة المحددة</p>
        </Card>
        <Card className="bg-indigo-50 dark:bg-indigo-900/10 border-r-4 border-indigo-500 p-4">
          <span className="text-indigo-600 dark:text-indigo-400 text-[10px] md:text-xs font-bold uppercase">جودة العملاء</span>
          <div className="text-xl md:text-2xl font-bold text-indigo-700 dark:text-indigo-300 mt-1">{(clients.length > 0 ? (totalRevenue/clients.length) : 0).toLocaleString()} <span className="text-[10px] md:text-sm">ج.م</span></div>
          <p className="text-[10px] md:text-xs text-indigo-400 mt-1">متوسط العميل الواحد</p>
        </Card>
        <Card className="bg-purple-50 dark:bg-purple-900/10 border-r-4 border-purple-500 p-4 col-span-2 lg:col-span-1">
          <span className="text-purple-600 dark:text-purple-400 text-[10px] md:text-xs font-bold uppercase">إجمالي الرواتب</span>
          <div className="text-xl md:text-2xl font-bold text-purple-700 dark:text-purple-300 mt-1">{employeeReports.reduce((s, r) => s + r.payroll.finalPayout, 0).toLocaleString()} <span className="text-[10px] md:text-sm">ج.م</span></div>
          <p className="text-[10px] md:text-xs text-purple-400 mt-1">شامل الحوافز والخصومات</p>
        </Card>
      </div>

      {/* --- Performance & Happiness Leaderboard --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Performance */}
        <Card className="border-t-4 border-green-500">
          <h3 className="text-lg font-bold text-green-700 dark:text-green-400 mb-4 flex items-center gap-2">🏆 الأعلى أداءً</h3>
          <div className="space-y-4">
            {topPerformers.map((r, i) => (
              <div key={r.employee.id} className="flex items-center justify-between p-2 rounded bg-green-50 dark:bg-green-900/20">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{'🥇🥈🥉'[i] || '✨'}</span>
                  <div>
                    <p className="font-bold text-sm text-gray-800 dark:text-gray-200">{r.employee.name}</p>
                    <p className="text-xs text-gray-500">{ROLE_AR_MAP[r.employee.role]}</p>
                  </div>
                </div>
                <span className="font-bold text-green-600 dark:text-green-400">{(r.performanceScore * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Happiest Employees */}
        <Card className="border-t-4 border-yellow-400">
          <h3 className="text-lg font-bold text-yellow-700 dark:text-yellow-500 mb-4 flex items-center gap-2">😊 الأكثر سعادة</h3>
          <div className="space-y-4">
            {happiestEmployees.map((r, i) => (
              <div key={r.employee.id} className="flex items-center justify-between p-2 rounded bg-yellow-50 dark:bg-yellow-900/20">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{'😍😎🙂'[i] || '😊'}</span>
                  <div>
                    <p className="font-bold text-sm text-gray-800 dark:text-gray-200">{r.employee.name}</p>
                    <p className="text-xs text-gray-500">{ROLE_AR_MAP[r.employee.role]}</p>
                  </div>
                </div>
                <span className="font-bold text-yellow-600 dark:text-yellow-400">
                    {r.totalMoodScore.toFixed(0)}
                    <span className="text-[10px] text-yellow-500">/{Math.round(r.totalMoodScore / r.averageMood * 10) || 40}</span>
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Needs Improvement */}
        <Card className="border-t-4 border-orange-500">
          <h3 className="text-lg font-bold text-orange-700 dark:text-orange-500 mb-4 flex items-center gap-2">⚠️ يحتاج لتحسين</h3>
          <div className="space-y-4">
            {needsImprovement.length === 0 ? (
                <p className="text-gray-500 text-center py-4 text-xs">لا يوجد موظفين بحاجة لتحسين حالياً.</p>
            ) : (
                needsImprovement.map((r, i) => (
                <div key={r.employee.id} className="flex items-center justify-between p-2 rounded bg-orange-50 dark:bg-orange-900/20">
                    <div className="flex items-center gap-3">
                    <span className="text-xl">{'📉'}</span>
                    <div>
                        <p className="font-bold text-sm text-gray-800 dark:text-gray-200">{r.employee.name}</p>
                        <p className="text-xs text-gray-500">{ROLE_AR_MAP[r.employee.role]}</p>
                    </div>
                    </div>
                    <div className="text-left max-w-[120px]">
                    <span className="block font-bold text-orange-600 dark:text-orange-400">{(r.performanceScore * 100).toFixed(1)}%</span>
                    {r.payroll.improvementNote && <p className="text-[9px] text-orange-400 truncate" title={r.payroll.improvementNote}>{r.payroll.improvementNote}</p>}
                    </div>
                </div>
                ))
            )}
          </div>
        </Card>
      </div>

      {/* --- Detailed Table with Task Analytics --- */}
      <Card>
        <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-6">كشف الرواتب وتحليل المهام ({selectedMonth}/{selectedYear})</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-right border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-white/5 border-b dark:border-white/10">
                <th className="p-3 text-xs font-bold text-gray-500 dark:text-gray-400 w-10"></th>
                <th className="p-3 text-xs font-bold text-gray-500 dark:text-gray-400">الموظف</th>
                <th className="p-3 text-xs font-bold text-gray-500 dark:text-gray-400 min-w-[120px]">تحقيق الـ KPI</th>
                <th className="p-3 text-xs font-bold text-gray-500 dark:text-gray-400">الأساسي</th>
                <th className="p-3 text-xs font-bold text-gray-500 dark:text-gray-400">الحوافز (KPIs)</th>
                <th className="p-3 text-xs font-bold text-gray-500 dark:text-gray-400">الخصومات</th>
                <th className="p-3 text-xs font-bold text-gray-500 dark:text-gray-400 font-extrabold text-indigo-700 dark:text-indigo-300">الصافي النهائي</th>
              </tr>
            </thead>
            <tbody>
              {employeeReports.map((r) => (
                <React.Fragment key={r.employee.id}>
                    <tr className={`border-b dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${expandedEmployeeId === r.employee.id ? 'bg-indigo-50/30 dark:bg-white/5' : ''}`}>
                    <td className="p-3">
                        <button 
                            onClick={() => toggleRow(r.employee.id)}
                            className="text-gray-400 hover:text-indigo-600 text-lg transition-colors"
                        >
                            {expandedEmployeeId === r.employee.id ? '➖' : '➕'}
                        </button>
                    </td>
                    <td className="p-3">
                        <p className="font-bold text-sm text-gray-800 dark:text-gray-200">{r.employee.name}</p>
                        <p className="text-[10px] text-gray-400">{ROLE_AR_MAP[r.employee.role]}</p>
                    </td>
                    <td className="p-3 w-40">
                        <ProgressBar progress={r.kpiProgress} barColor={r.kpiProgress >= 80 ? 'bg-green-500' : 'bg-orange-500'} className="text-[10px]" />
                    </td>
                    <td className="p-3 text-sm text-gray-600 dark:text-gray-400">{r.payroll.baseSalary.toLocaleString()}</td>
                    <td className="p-3 text-sm text-green-600 dark:text-green-400">
                        +{(r.payroll.kpiIncentive + r.payroll.problemBonus + r.payroll.salesCommission + r.payroll.otherCommission).toLocaleString()}
                    </td>
                    <td className="p-3 text-sm text-red-500">-{r.payroll.manualDeduction.toLocaleString()}</td>
                    <td className="p-3 font-extrabold text-indigo-800 dark:text-indigo-300 bg-indigo-50/20 dark:bg-indigo-900/20 rounded-lg">{r.payroll.finalPayout.toLocaleString()} ج.م</td>
                    </tr>
                    
                    {/* Expanded Task Analytics Section */}
                    {expandedEmployeeId === r.employee.id && (
                        <tr>
                            <td colSpan={7} className="p-6 bg-gray-50 dark:bg-black/20">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2">
                                    
                                    {/* Card 1: Task Time Analysis */}
                                    <div className="bg-white dark:bg-ui-darkCard p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-white/10">
                                        <h3 className="text-sm font-bold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
                                            ⏱️ تحليل وقت المهام
                                        </h3>
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl flex-1 text-center">
                                                <p className="text-xs font-bold text-gray-500">إجمالي المنجز</p>
                                                <p className="text-xl font-black text-indigo-600 dark:text-indigo-400">{r.taskAnalytics.totalCompleted}</p>
                                            </div>
                                            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl flex-1 text-center">
                                                <p className="text-xs font-bold text-gray-500">متوسط الوقت</p>
                                                <p className="text-xl font-black text-indigo-600 dark:text-indigo-400" dir="ltr">{formatTime(r.taskAnalytics.avgTime)}</p>
                                            </div>
                                        </div>
                                        
                                        <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-2">أكثر المهام استهلاكاً للوقت</h4>
                                        <div className="space-y-2">
                                            {r.taskAnalytics.slowestTasks.map((t, idx) => (
                                                <div key={idx} className="flex justify-between items-center text-xs p-2 bg-gray-50 dark:bg-white/5 rounded-lg">
                                                    <span className="font-medium truncate max-w-[70%] text-gray-700 dark:text-gray-300">{t.title}</span>
                                                    <span className="font-bold text-gray-600 dark:text-gray-300" dir="ltr">{formatTime(t.duration)}</span>
                                                </div>
                                            ))}
                                            {r.taskAnalytics.slowestTasks.length === 0 && <p className="text-gray-400 text-xs">لا توجد بيانات.</p>}
                                        </div>
                                    </div>

                                    {/* Card 2: Completion History */}
                                    <div className="bg-white dark:bg-ui-darkCard p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-white/10">
                                        <h3 className="text-sm font-bold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
                                            ✅ سجل الإنجاز (مهام + أرشيف)
                                        </h3>
                                        {r.taskAnalytics.history.length === 0 ? (
                                            <p className="text-gray-500 text-center py-4 text-xs">لا توجد مهام مكتملة في هذا الشهر.</p>
                                        ) : (
                                            <div className="overflow-x-auto max-h-[300px]">
                                                <table className="w-full text-right text-xs">
                                                    <thead>
                                                        <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/10 text-gray-500">
                                                            <th className="p-3">المهمة</th>
                                                            <th className="p-3">التاريخ</th>
                                                            <th className="p-3">المدة</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {r.taskAnalytics.history.map((t, idx) => (
                                                            <tr key={idx} className="border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5">
                                                                <td className="p-3 font-medium truncate max-w-[100px] text-gray-800 dark:text-gray-200">{t.title}</td>
                                                                <td className="p-3 text-gray-500">{new Date(t.date).toLocaleDateString()}</td>
                                                                <td className="p-3 text-green-600 font-bold" dir="ltr">{formatTime(t.duration)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>

                                    {/* Card 3: KPI Breakdown */}
                                    <div className="bg-white dark:bg-ui-darkCard p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-white/10 col-span-1 md:col-span-2 relative">
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="text-sm font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                                🎯 تفاصيل الـ KPIs والأداء
                                            </h3>
                                            <Button 
                                                variant="secondary" 
                                                onClick={() => setEditingReport(r)}
                                                className="text-[10px] py-1 px-2 h-auto"
                                            >
                                                ⚙️ تقييم الأداء
                                            </Button>
                                        </div>
                                        
                                        {/* Performance Metrics Summary */}
                                        <div className="grid grid-cols-4 gap-2 mb-4 text-center">
                                            <div className="bg-gray-50 dark:bg-white/5 p-2 rounded border border-gray-100 dark:border-white/5">
                                                <span className="text-[10px] text-gray-500 block">KPIs (40%)</span>
                                                <span className="font-bold text-indigo-600 dark:text-indigo-400">{r.kpiProgress.toFixed(0)}%</span>
                                            </div>
                                            <div className="bg-gray-50 dark:bg-white/5 p-2 rounded border border-gray-100 dark:border-white/5">
                                                <span className="text-[10px] text-gray-500 block">الالتزام (30%)</span>
                                                <span className="font-bold text-indigo-600 dark:text-indigo-400">{r.payroll.commitmentScore || 0}%</span>
                                            </div>
                                            <div className="bg-gray-50 dark:bg-white/5 p-2 rounded border border-gray-100 dark:border-white/5">
                                                <span className="text-[10px] text-gray-500 block">الغياب (20%)</span>
                                                <span className="font-bold text-red-500">{r.attendanceCount}</span>
                                            </div>
                                            <div className="bg-gray-50 dark:bg-white/5 p-2 rounded border border-gray-100 dark:border-white/5">
                                                <span className="text-[10px] text-gray-500 block">المزاج (10%)</span>
                                                <span className="font-bold text-yellow-500">{(r.averageMood * 10).toFixed(0)}%</span>
                                            </div>
                                        </div>

                                        {/* Manager Recommendations & Notes */}
                                        {(r.payroll.recommendations || r.payroll.reportNotes) && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                {r.payroll.recommendations && (
                                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
                                                        <h4 className="text-xs font-bold text-blue-800 dark:text-blue-300 mb-1">💡 التوصيات</h4>
                                                        <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{r.payroll.recommendations}</p>
                                                    </div>
                                                )}
                                                {r.payroll.reportNotes && (
                                                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-100 dark:border-yellow-800">
                                                        <h4 className="text-xs font-bold text-yellow-800 dark:text-yellow-300 mb-1">📝 ملاحظات المدير</h4>
                                                        <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{r.payroll.reportNotes}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {r.kpiConfigs.map(conf => {
                                                const confRecords = r.kpiRecords.filter(rec => rec.kpi_config_id === conf.id);
                                                const achieved = confRecords.reduce((s, rec) => s + rec.achieved_value, 0);
                                                const percent = Math.min(100, (achieved / conf.target_value) * 100);
                                                
                                                return (
                                                    <div key={conf.id} className="bg-gray-50 dark:bg-white/5 p-3 rounded-xl border border-gray-100 dark:border-white/5">
                                                        <div className="flex justify-between mb-2">
                                                            <span className="font-bold text-xs text-gray-700 dark:text-gray-300">{conf.kpi_name}</span>
                                                            <span className="text-[10px] text-gray-500">المستهدف: {conf.target_value}</span>
                                                        </div>
                                                        <ProgressBar progress={percent} barColor={percent >= 100 ? 'bg-green-500' : 'bg-indigo-500'} className="h-1.5" />
                                                        
                                                        <div className="flex flex-wrap gap-1 mt-2">
                                                            {confRecords.sort((a,b) => a.week_number - b.week_number).map(rec => (
                                                                <span key={rec.id} className="text-[9px] bg-white dark:bg-black/20 px-1.5 rounded border border-gray-100 dark:border-white/5 text-gray-500">
                                                                    أ{rec.week_number}: <span className="font-bold text-gray-700 dark:text-gray-300">{rec.achieved_value}</span>
                                                                </span>
                                                            ))}
                                                        </div>
                                                        <div className="mt-2 text-[10px] text-right font-bold text-indigo-600 dark:text-indigo-400">
                                                            الإجمالي: {achieved}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {r.kpiConfigs.length === 0 && <p className="text-gray-500 text-xs col-span-full text-center">لا توجد KPIs مسجلة.</p>}
                                        </div>
                                    </div>

                                </div>
                            </td>
                        </tr>
                    )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      
      {showAIModal && <AIAnalysisModal onClose={() => setShowAIModal(false)} />}
      
      {editingReport && (
        <PerformanceEditModal 
            employee={editingReport.employee}
            month={selectedMonth}
            year={selectedYear}
            initialData={editingReport.payroll}
            onClose={() => setEditingReport(null)}
            onSave={fetchReportsData}
        />
      )}
    </div>
  );
};

export default ReportsPage;