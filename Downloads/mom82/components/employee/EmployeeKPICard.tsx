
import React, { useState } from 'react';
import Card from '../common/Card';
import ProgressBar from '../common/ProgressBar';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { KPIRecord, EmployeeKPIData, KPIConfig, KpiStatus } from '../../types';
import { KPI_STATUS_AR_MAP } from '../../constants';
import { DataService } from '../../services/dataService'; 

interface EmployeeKPICardProps {
  employeeId: string;
  allKpiRecords: KPIRecord[];
  kpiChartData: EmployeeKPIData[];
  kpiConfigs: KPIConfig[]; 
  onAddKpiRecord: () => void;
  onEditKpiRecord: (record: KPIRecord) => void;
  onDeleteKpiRecord: (recordId: string) => void;
  onDeleteKpiConfig?: (configId: string) => void; // Added prop for Config Deletion
  onConfigureKpi: () => void;
  isReadOnly?: boolean;
}

const EmployeeKPICard: React.FC<EmployeeKPICardProps> = ({
  employeeId,
  allKpiRecords,
  kpiChartData,
  kpiConfigs,
  onAddKpiRecord,
  onEditKpiRecord,
  onDeleteKpiRecord,
  onDeleteKpiConfig,
  onConfigureKpi,
  isReadOnly = false
}) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const displayedConfigs = kpiConfigs.filter(c => {
     if (c.applicable_month && c.applicable_year) {
         return c.applicable_month === selectedMonth && c.applicable_year === selectedYear;
     }
     return true; 
  });

  const hasPendingItems = displayedConfigs.some(c => c.status === KpiStatus.Pending);

  // Manager Actions
  const handleApproveKpi = async (kpi: KPIConfig) => {
      await DataService.reviewKPI(kpi.id, KpiStatus.Approved);
      window.location.reload(); // Quick refresh
  };

  const handleRejectKpi = async (kpi: KPIConfig) => {
      const feedback = prompt("سبب طلب التعديل/الرفض:");
      if (!feedback) return;
      await DataService.reviewKPI(kpi.id, KpiStatus.Rejected, feedback);
      window.location.reload();
  };

  // Bulk Actions
  const handleApproveAll = async () => {
      if(!window.confirm("هل أنت متأكد من الموافقة على جميع الأهداف لهذا الشهر؟")) return;
      try {
          await DataService.approveAllKPIs(employeeId, selectedMonth, selectedYear);
          window.location.reload();
      } catch(e: any) { alert(e.message); }
  };

  const handleRejectAll = async () => {
      const feedback = prompt("اكتب سبب طلب التعديل العام على الخطة:");
      if (!feedback) return;
      try {
          await DataService.rejectAllKPIs(employeeId, selectedMonth, selectedYear, feedback);
          window.location.reload();
      } catch(e: any) { alert(e.message); }
  };

  const distinctKpis = Array.from(new Set(kpiChartData.map(d => d.kpi_name)));

  return (
    <Card className="p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h3 className="text-xl font-bold">🎯 مؤشرات الأداء (SMART)</h3>
          <p className="text-xs text-ui-lightMuted dark:text-ui-darkMuted mt-1">تتبع الأهداف الذكية شهرياً</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="bg-gray-100 dark:bg-white/10 p-2 rounded-lg text-xs font-bold">
                {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>{new Date(2000, i).toLocaleString('ar-EG', {month: 'long'})}</option>)}
            </select>
            <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="bg-gray-100 dark:bg-white/10 p-2 rounded-lg text-xs font-bold">
                {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            
            <div className="flex gap-2">
                {!isReadOnly && (
                <button onClick={onAddKpiRecord} className="bg-ui-lightText dark:bg-ui-darkText text-ui-lightCard dark:text-ui-darkBg px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">تسجيل إنجاز</button>
                )}
                <button onClick={onConfigureKpi} className="border border-ui-lightBorder dark:border-ui-darkBorder px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">تخطيط الأهداف</button>
            </div>
        </div>
      </div>

      {/* Bulk Action Buttons for Managers */}
      {!isReadOnly && hasPendingItems && (
          <div className="mb-6 flex gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-2xl border border-yellow-200 dark:border-yellow-800">
              <span className="text-sm font-bold text-yellow-800 dark:text-yellow-200 self-center flex-1">⚠️ يوجد خطة معلقة بانتظار المراجعة</span>
              <button onClick={handleApproveAll} className="bg-green-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-green-700 transition-colors">موافقة على الكل</button>
              <button onClick={handleRejectAll} className="bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-red-700 transition-colors">طلب تعديل للكل</button>
          </div>
      )}

      {displayedConfigs.length === 0 ? (
        <div className="text-center p-6 bg-gray-50 dark:bg-white/5 rounded-2xl border border-dashed mb-6">
            <p className="text-sm text-gray-500">لا توجد أهداف محددة لهذا الشهر.</p>
            <button onClick={onConfigureKpi} className="text-indigo-600 font-bold text-xs mt-2 underline">ابدأ بوضع خطة الشهر</button>
        </div>
      ) : (
        <div className="space-y-6 mb-10">
            {displayedConfigs.map(config => {
            const records = allKpiRecords.filter(r => r.kpi_config_id === config.id); 
            const achieved = records.reduce((s, r) => s + r.achieved_value, 0);
            const progress = Math.min(100, (achieved / config.target_value) * 100);
            const isMergedFormat = (!config.smart_m || config.smart_m === '-') && (!config.smart_t || config.smart_t === '-');

            return (
                <div key={config.id} className="p-5 rounded-2xl bg-ui-lightBg dark:bg-ui-darkBg/30 border border-ui-lightBorder dark:border-ui-darkBorder relative group">
                    <div className="flex justify-between items-start mb-3">
                        <div className="max-w-[85%]">
                             <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-bold text-base text-gray-800 dark:text-gray-200">{config.kpi_name}</h4>
                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${config.status === KpiStatus.Approved ? 'bg-green-100 text-green-700' : config.status === KpiStatus.Pending ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
                                    {KPI_STATUS_AR_MAP[config.status || KpiStatus.Draft]}
                                </span>
                                {/* Allow deleting KPI Plan even if Approved - Only for Admin/Manager */}
                                {!isReadOnly && onDeleteKpiConfig && (
                                    <button 
                                        onClick={() => onDeleteKpiConfig(config.id)}
                                        className="text-red-400 hover:text-red-600 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                        title="حذف الهدف بالكامل (مسح الخطة)"
                                    >
                                        🗑️
                                    </button>
                                )}
                             </div>
                            
                            {isMergedFormat ? (
                                <div className="space-y-1">
                                    <p className="text-xs text-gray-600 dark:text-gray-400 font-medium"><span className="font-bold text-indigo-600">كيف؟</span> {config.smart_a}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-500 italic"><span className="font-bold">السبب:</span> {config.smart_r}</p>
                                </div>
                            ) : (
                                config.smart_s && <p className="text-xs text-gray-500 dark:text-gray-400 italic">"عدد {config.smart_m} {config.smart_s}..."</p>
                            )}
                        </div>
                        <span className="text-[10px] font-black text-accent-primary bg-white dark:bg-black/20 px-2 py-1 rounded">المستهدف: {config.target_value}</span>
                    </div>
                    
                    {/* Manager Actions - Single Item Approval */}
                    {!isReadOnly && config.status === KpiStatus.Pending && (
                        <div className="flex gap-2 mb-3 bg-white/50 p-2 rounded-lg border border-gray-100 dark:border-white/5">
                            <button onClick={() => handleApproveKpi(config)} className="bg-green-100 text-green-700 hover:bg-green-200 text-[10px] px-3 py-1 rounded font-bold transition-colors">موافقة</button>
                            <button onClick={() => handleRejectKpi(config)} className="bg-red-100 text-red-700 hover:bg-red-200 text-[10px] px-3 py-1 rounded font-bold transition-colors">تعديل/رفض</button>
                        </div>
                    )}

                    <ProgressBar progress={progress} barColor="bg-accent-primary" />
                    <div className="flex justify-between mt-2 text-[10px] text-gray-400">
                        <span>المحقق: {achieved}</span>
                        <span>{progress.toFixed(1)}%</span>
                    </div>

                    {/* Achievement History & Undo Section */}
                    {!isReadOnly && records.length > 0 && (
                        <div className="mt-3 bg-gray-50 dark:bg-black/20 rounded-xl p-3 border border-dashed border-gray-200 dark:border-white/10">
                            <p className="text-[10px] font-bold text-gray-500 mb-2">سجلات الإنجاز (اضغط للحذف/التراجع):</p>
                            <div className="flex flex-wrap gap-2">
                                {records.map(rec => (
                                    <div key={rec.id} className="flex items-center gap-2 bg-white dark:bg-gray-800 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm text-xs">
                                        <span className="text-gray-600 dark:text-gray-300">أسبوع {rec.week_number}:</span>
                                        <span className="font-black text-green-600 dark:text-green-400">{rec.achieved_value}</span>
                                        <button 
                                            onClick={() => onDeleteKpiRecord(rec.id)} 
                                            className="text-red-400 hover:text-red-600 font-bold border-r border-gray-200 dark:border-gray-600 pr-2 mr-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-r transition-colors"
                                            title="حذف هذا الإنجاز"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            );
            })}
        </div>
      )}

      {kpiChartData.length > 0 && (
        <div className="h-[300px] w-full mt-10 border-t pt-6 dark:border-white/10">
          <h4 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-widest">المسار الزمني للإنجاز</h4>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={kpiChartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.3} />
              <XAxis dataKey="week" stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}/>
              <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} />
              {distinctKpis.map((kpiName, idx) => (
                <Line key={kpiName} type="monotone" dataKey="achieved" name={kpiName} stroke={idx === 0 ? '#4F46E5' : idx === 1 ? '#10B981' : '#64748B'} strokeWidth={3} dot={{ r: 3, fill: 'white', strokeWidth: 2 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
};

export default EmployeeKPICard;
