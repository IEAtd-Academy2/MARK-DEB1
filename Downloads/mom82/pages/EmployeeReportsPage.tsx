
import React, { useState, useEffect } from 'react';
import Card from '../components/common/Card';
import ProgressBar from '../components/common/ProgressBar';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Alert from '../components/common/Alert';
import { DataService } from '../services/dataService';
import { AuthService } from '../services/authService';
import { Employee, PayrollBreakdown, KPIConfig, KPIRecord, Task, LeaveRequest } from '../types';
import { TASK_STATUS_AR_MAP } from '../constants';
import EmployeeLeaveCard from '../components/employee/EmployeeLeaveCard';

const EmployeeReportsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState<Employee | null>(null);
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [payroll, setPayroll] = useState<PayrollBreakdown | null>(null);
  const [configs, setConfigs] = useState<KPIConfig[]>([]);
  const [records, setRecords] = useState<KPIRecord[]>([]);
  
  const [completedTaskItems, setCompletedTaskItems] = useState<{title: string, date: string, duration: number}[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);

  const [avgTaskTime, setAvgTaskTime] = useState(0);
  const [slowestTasks, setSlowestTasks] = useState<{title: string, duration: number}[]>([]);

  const now = new Date();
  const releaseDate = new Date(selectedYear, selectedMonth, 7); 
  const isFinalized = now >= releaseDate;

  const fetchEmployeeData = async () => {
    try {
        const session = await AuthService.getCurrentSession();
        if (session?.employeeId) {
          const emp = await DataService.getEmployee(session.employeeId);
          setEmployee(emp || null);
          
          if (emp) {
            const pay = await DataService.calculatePayroll(emp.id, selectedMonth, selectedYear);
            setPayroll(pay);

            const kpiConfs = await DataService.getKPIConfigs(emp.id, selectedMonth, selectedYear);
            setConfigs(kpiConfs);
            const kpiRecs = await DataService.getAllKPIRecords(emp.id, selectedMonth, selectedYear);
            setRecords(kpiRecs);

            const allTasks = await DataService.getEmployeeTasks(emp.id);
            const currentMonthTasks = allTasks.filter(t => {
               if (!t.completion_date || t.status !== 'Done') return false;
               const d = new Date(t.completion_date);
               return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
            }).map(t => ({
                title: t.title,
                date: t.completion_date?.toISOString(),
                duration: t.total_duration || 0
            }));

            const historyLogs = await DataService.getEmployeeTaskLogs(emp.id, selectedMonth, selectedYear);
            const historyItems = historyLogs.map(l => ({
                title: l.task_title,
                date: l.completed_at.toISOString(),
                duration: l.duration_seconds
            }));

            const combined = [...currentMonthTasks, ...historyItems];
            setCompletedTaskItems(combined);

            if (combined.length > 0) {
                const totalSeconds = combined.reduce((sum, t) => sum + t.duration, 0);
                setAvgTaskTime(totalSeconds / combined.length);
                const sorted = [...combined].sort((a,b) => b.duration - a.duration);
                setSlowestTasks(sorted.slice(0, 3));
            } else {
                setAvgTaskTime(0);
                setSlowestTasks([]);
            }

            const leaves = await DataService.getLeaveRequests(emp.id);
            setLeaveRequests(leaves);
          }
        }
      } catch (err) {
        console.error(err);
      }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchEmployeeData();
      setLoading(false);
    };
    init();
  }, [selectedMonth, selectedYear]);

  const formatTime = (seconds: number) => {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      return `${h}h ${m}m`;
  };

  if (loading) return <div className="h-64 flex items-center justify-center"><LoadingSpinner /></div>;
  if (!employee || !payroll) return <Alert type="info" message="لا توجد بيانات متاحة." />;

  const totalIncentives = payroll.kpiIncentive + payroll.problemBonus + payroll.salesCommission + payroll.otherCommission;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
         <div>
            <h2 className="text-3xl font-black text-ui-lightText dark:text-ui-darkText">تقاريري الشهرية</h2>
            <p className="text-sm text-gray-500">مراجعة الأداء والمستحقات المالية</p>
         </div>
         <div className="flex gap-2 bg-white dark:bg-white/5 p-2 rounded-xl shadow-sm border border-gray-100 dark:border-white/10">
            <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-transparent font-bold text-indigo-700 dark:text-indigo-300 outline-none p-1"
            >
                {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>{new Date(2000, i).toLocaleString('ar-EG', {month: 'long'})}</option>)}
            </select>
            <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent font-bold text-indigo-700 dark:text-indigo-300 outline-none border-r border-gray-200 dark:border-white/10 px-2"
            >
                {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
            {/* Net Payout Summary Card */}
            <Card className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white shadow-xl overflow-hidden relative border-none">
                 <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                 <h3 className="text-xs font-black uppercase tracking-widest opacity-80 mb-6 flex items-center gap-2">
                     <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                     الصافي التقديري للشهر
                 </h3>
                 <div className="flex items-end gap-2 mb-8">
                     <span className="text-5xl font-black">{(payroll.baseSalary + totalIncentives - (isFinalized ? payroll.manualDeduction : 0)).toLocaleString()}</span>
                     <span className="text-sm font-bold opacity-80 mb-2">ج.م</span>
                 </div>
                 
                 <div className="space-y-3 bg-black/20 -mx-6 -mb-6 p-6">
                    <div className="flex justify-between text-xs font-bold">
                        <span className="opacity-70">إجمالي الحوافز المكتسبة:</span>
                        <span className="text-green-300">+{totalIncentives.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold">
                        <span className="opacity-70">الحالة:</span>
                        <span className={isFinalized ? 'text-green-400' : 'text-yellow-300'}>{isFinalized ? 'مغلق (نهائي) ✅' : 'قيد التحديث ⏳'}</span>
                    </div>
                 </div>
            </Card>

            <Card className={`border-r-4 ${payroll.managerFeedback ? 'border-amber-500 bg-amber-50/30 dark:bg-amber-900/10' : 'border-gray-200'}`}>
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2">💡 ملاحظات المدير</h3>
                {payroll.managerFeedback ? (
                    <div className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 italic">
                        "{payroll.managerFeedback}"
                    </div>
                ) : (
                    <p className="text-xs text-gray-500">لا توجد ملاحظات مسجلة.</p>
                )}
            </Card>

            <EmployeeLeaveCard 
                employeeId={employee.id} 
                leaveBalance={employee.leave_balance} 
                leaveRequests={leaveRequests} 
                onRefresh={fetchEmployeeData}
            />
        </div>

        <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {/* Financial Details (Always Summary, Details on Finalization) */}
                 <Card>
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">📊 تفاصيل المستحقات</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                            <span className="text-gray-500 dark:text-gray-400 font-bold text-xs">الراتب الأساسي</span>
                            <span className="font-black">{payroll.baseSalary.toLocaleString()}</span>
                        </div>
                        
                        {/* Incentives List - Always Visible */}
                        <div className="p-4 rounded-xl border-2 border-green-100 dark:border-green-900/30 bg-green-50/50 dark:bg-green-900/10">
                            <p className="text-[10px] font-black text-green-700 dark:text-green-400 uppercase mb-3">تفاصيل الحوافز المكتسبة:</p>
                            <div className="space-y-2">
                                <div className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-300">أداء الـ KPIs:</span>
                                        <span className="font-bold text-green-600">+{payroll.kpiIncentive.toLocaleString()}</span>
                                    </div>
                                    {payroll.kpiDetails && payroll.kpiDetails.length > 0 && (
                                        <div className="mr-4 space-y-1 border-r-2 border-gray-200 dark:border-white/10 pr-2 mt-1">
                                            {payroll.kpiDetails.map((detail, idx) => (
                                                <div key={idx} className="flex justify-between text-[10px] text-gray-500 dark:text-gray-400">
                                                    <span>- {detail.name}</span>
                                                    <span>+{detail.amount.toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {payroll.problemBonus > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-300">حل المشكلات:</span>
                                        <span className="font-bold text-green-600">+{payroll.problemBonus.toLocaleString()}</span>
                                    </div>
                                )}
                                {payroll.otherCommission > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-300">إضافات أخرى:</span>
                                        <span className="font-bold text-green-600">+{payroll.otherCommission.toLocaleString()}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Deductions - Visible only if finalized or if manager allows? Let's show only after finalizing to prevent disputes before closing */}
                        {isFinalized ? (
                             payroll.manualDeduction > 0 && (
                                <div className="flex justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900/30">
                                    <span className="text-red-700 dark:text-red-400 font-bold text-xs">الخصومات ({payroll.manualDeductionNote || 'جزاءات'})</span>
                                    <span className="font-bold text-red-600">-{payroll.manualDeduction.toLocaleString()}</span>
                                </div>
                             )
                        ) : (
                            <div className="p-3 bg-gray-100 dark:bg-white/5 rounded-xl text-center">
                                <p className="text-[10px] text-gray-400">الخصومات النهائية تظهر بعد المراجعة في يوم 7.</p>
                            </div>
                        )}
                    </div>
                 </Card>

                 {/* KPI Progress Card */}
                 <Card>
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">🎯 الإنجاز الفني (KPIs)</h3>
                    {configs.length === 0 ? (
                        <p className="text-center text-gray-500 py-10 text-xs">لا توجد أهداف مسجلة لهذا الشهر.</p>
                    ) : (
                        <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2">
                            {configs.map(conf => {
                                const confRecords = records.filter(r => r.kpi_config_id === conf.id);
                                const achieved = confRecords.reduce((s, r) => s + r.achieved_value, 0);
                                const percent = Math.min(100, (achieved / conf.target_value) * 100);
                                
                                return (
                                    <div key={conf.id} className="border-b border-gray-100 dark:border-white/5 pb-4 last:border-0">
                                        <div className="flex justify-between mb-2">
                                            <span className="font-bold text-xs">{conf.kpi_name}</span>
                                            <span className="text-[9px] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 px-2 py-1 rounded">المستهدف: {conf.target_value}</span>
                                        </div>
                                        <ProgressBar progress={percent} barColor={percent >= 100 ? 'bg-green-500' : 'bg-indigo-500'} />
                                        <div className="flex justify-between mt-1 text-[10px] text-gray-500">
                                            <span>تحقق: {achieved}</span>
                                            <span className="font-black">{percent.toFixed(1)}%</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                 </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card>
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">⏱️ تحليل زمن المهام</h3>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl flex-1 text-center">
                            <p className="text-[10px] font-bold text-gray-500 uppercase">إجمالي المنجز</p>
                            <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{completedTaskItems.length}</p>
                        </div>
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl flex-1 text-center">
                            <p className="text-[10px] font-bold text-gray-500 uppercase">متوسط التنفيذ</p>
                            <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{formatTime(avgTaskTime)}</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">أطول المهام زمناً:</p>
                        {slowestTasks.map((t, idx) => (
                            <div key={idx} className="flex justify-between items-center text-xs p-2 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/5">
                                <span className="font-medium truncate max-w-[70%]">{t.title}</span>
                                <span className="font-bold text-gray-600 dark:text-gray-300">{formatTime(t.duration)}</span>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card>
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">✅ المهام المكتملة والأرشيف</h3>
                    {completedTaskItems.length === 0 ? (
                        <p className="text-center text-gray-500 py-6 text-xs">لا توجد سجلات منجزة.</p>
                    ) : (
                        <div className="overflow-x-auto max-h-[300px]">
                            <table className="w-full text-right text-[11px]">
                                <thead className="sticky top-0 bg-white dark:bg-ui-darkCard z-10">
                                    <tr className="border-b border-gray-100 dark:border-white/10 text-gray-400">
                                        <th className="p-2 font-black uppercase">المهمة</th>
                                        <th className="p-2 font-black uppercase">التاريخ</th>
                                        <th className="p-2 font-black uppercase">المدة</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                    {completedTaskItems.map((t, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                            <td className="p-2 font-bold truncate max-w-[100px]">{t.title}</td>
                                            <td className="p-2 opacity-60">{new Date(t.date).toLocaleDateString()}</td>
                                            <td className="p-2 text-green-600 font-bold">{formatTime(t.duration)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeReportsPage;
