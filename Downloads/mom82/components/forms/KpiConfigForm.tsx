
import React, { useState, useEffect, useMemo } from 'react';
import Button from '../common/Button';
import Card from '../common/Card';
import { KPIConfig, KpiStatus } from '../../types';
import { DataService } from '../../services/dataService';
import Alert from '../common/Alert';
import LoadingSpinner from '../common/LoadingSpinner';
import { AuthService } from '../../services/authService';
import { KPI_STATUS_AR_MAP } from '../../constants';

interface KpiConfigFormProps {
  employeeId: string;
  onClose: () => void;
  onSubmit: () => Promise<void>;
  isModal?: boolean;
}

const KpiConfigForm: React.FC<KpiConfigFormProps> = ({ employeeId, onClose, onSubmit, isModal = false }) => {
  const [configs, setConfigs] = useState<KPIConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [showAddModal, setShowAddModal] = useState(false);
  const [tempKpi, setTempKpi] = useState<Partial<KPIConfig>>({
    smart_s: '',
    target_value: 0,
    smart_a: '',
    smart_r: '',
    unit_value: 0
  });

  const totalPotentialPayout = useMemo(() => {
    return configs.reduce((sum, config) => sum + (Number(config.target_value || 0) * Number(config.unit_value || 0)), 0);
  }, [configs]);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const session = await AuthService.getCurrentSession();
      setIsAdmin(!!session?.isAdmin);
      const allData = await DataService.getKPIConfigs(employeeId);
      const filteredData = allData.filter(c => 
        (c.applicable_month === selectedMonth && c.applicable_year === selectedYear) ||
        (!c.applicable_month && !c.applicable_year)
      );
      setConfigs(filteredData); 
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchConfigs(); }, [employeeId, selectedMonth, selectedYear]);

  const openAddModal = () => {
    setTempKpi({ smart_s: '', target_value: 0, smart_a: '', smart_r: '', unit_value: 0, smart_m: '-', smart_t: '-' });
    setShowAddModal(true);
  };

  const confirmAddKpi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempKpi.smart_s || !tempKpi.smart_a || !tempKpi.smart_r) {
        setFormError("يرجى ملء جميع الحقول المطلوبة في النافذة.");
        return;
    }
    const newKpi: KPIConfig = {
      id: '', 
      employee_id: employeeId,
      kpi_name: tempKpi.smart_s, 
      target_value: Number(tempKpi.target_value),
      unit_value: Number(tempKpi.unit_value),
      incentive_percentage: 0,
      smart_s: tempKpi.smart_s,
      smart_m: '-',
      smart_a: tempKpi.smart_a,
      smart_r: tempKpi.smart_r,
      smart_t: '-',
      applicable_month: selectedMonth,
      applicable_year: selectedYear,
      status: KpiStatus.Draft 
    };
    setConfigs([...configs, newKpi]);
    setShowAddModal(false);
    setFormError(null);
  };

  const handleUpdateLocal = (index: number, field: keyof KPIConfig, value: any) => {
    const newConfigs = [...configs];
    if (newConfigs[index].status === KpiStatus.Approved || newConfigs[index].status === KpiStatus.Pending) {
        if (!isAdmin) return;
    }

    newConfigs[index] = { ...newConfigs[index], [field]: value };
    if (field === 'smart_s' && (!newConfigs[index].kpi_name || newConfigs[index].kpi_name === newConfigs[index].smart_s)) {
         newConfigs[index].kpi_name = value;
    }
    setConfigs(newConfigs);
  };

  const handleSaveAll = async () => {
    setFormError(null);
    try {
      for (const config of configs) {
        if (config.status !== KpiStatus.Approved && config.status !== KpiStatus.Pending) {
             if (!config.smart_s || !config.smart_a || !config.smart_r) throw new Error('يرجى التأكد من اكتمال بيانات جميع الأهداف الجديدة.');
        }

        const finalConfig = { ...config, kpi_name: config.kpi_name || config.smart_s || 'هدف جديد', smart_m: config.smart_m || '-', smart_t: config.smart_t || '-' };
        
        if (finalConfig.id && finalConfig.id.trim() !== '') {
            await DataService.updateKPIConfig(finalConfig);
        } else {
            const { id, ...createPayload } = finalConfig;
            await DataService.addKPIConfig(createPayload);
        }
      }
      await onSubmit();
      alert("تم حفظ المسودة بنجاح");
    } catch (err: any) { setFormError(err.message); }
  };

  const handleSubmitPlan = async () => {
      await handleSaveAll();
      if (formError) return;

      if (!window.confirm("هل أنت متأكد من إرسال الأهداف للموافقة؟")) return;
      try {
          await DataService.submitKPIPlan(employeeId, selectedMonth, selectedYear);
          alert("تم إرسال الخطة للمدير بنجاح!");
          await fetchConfigs();
          await onSubmit();
      } catch (e: any) {
          setFormError(e.message);
      }
  };

  const handleDeleteKpi = async (id: string, index: number) => {
    if (configs[index].status === KpiStatus.Approved) {
        if (!isAdmin) {
            alert("لا يمكن حذف هدف معتمد من قبل الموظف."); 
            return; 
        }
        if (!window.confirm("تحذير: هذا الهدف معتمد. هل أنت متأكد تماماً من رغبتك في حذفه؟ سيتم حذف جميع سجلات الإنجاز المرتبطة به.")) return;
    }
    
    if (id) await DataService.deleteKPIConfig(id);
    setConfigs(configs.filter((_, i) => i !== index));
  };

  if (loading) return <div className="p-10 text-center"><LoadingSpinner /></div>;

  const FormContent = (
    <Card className="p-8 dark:bg-[#1A1A1A] rounded-[32px] max-h-[90vh] overflow-y-auto relative border-none shadow-2xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
           <h3 className="text-2xl font-black dark:text-white">تخطيط الأهداف (KPIs)</h3>
           <p className="text-xs text-gray-500 mt-1">قم باختيار الشهر أولاً ثم أضف أهدافك</p>
        </div>
        <div className="flex flex-wrap gap-3">
            <div className="flex gap-2 bg-gray-50 dark:bg-white/5 p-1 rounded-xl">
                <select 
                    value={selectedMonth} 
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="bg-transparent p-2 text-sm font-bold outline-none text-indigo-600 dark:text-indigo-400"
                >
                    {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>{new Date(2000, i).toLocaleString('ar-EG', {month: 'long'})}</option>)}
                </select>
                <select 
                    value={selectedYear} 
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="bg-transparent p-2 text-sm font-bold outline-none text-indigo-600 dark:text-indigo-400 border-r border-gray-200 dark:border-white/10"
                >
                    {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
            </div>
            <Button onClick={openAddModal} size="sm" variant="outline" className="bg-indigo-600 text-white border-none hover:bg-indigo-700 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all">
              ✨ + إضافة هدف جديد
            </Button>
        </div>
      </div>

      {isAdmin && configs.length > 0 && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/10 border-r-4 border-green-500 rounded-xl flex justify-between items-center shadow-sm">
              <div>
                  <p className="text-[10px] font-black text-green-700 dark:text-green-400 uppercase tracking-widest">إجمالي الحوافز المستهدفة (عند تحقيق 100%)</p>
                  <p className="text-2xl font-black text-green-800 dark:text-green-300">{totalPotentialPayout.toLocaleString()} <span className="text-xs">ج.م</span></p>
              </div>
              <div className="text-left">
                  <span className="bg-white dark:bg-black/30 text-[10px] font-bold px-3 py-1 rounded-full text-green-600 border border-green-100">
                      ميزانية الخطة الحالية
                  </span>
              </div>
          </div>
      )}

      {formError && <Alert type="error" message={formError} className="mb-6" onClose={() => setFormError(null)} />}

      <div className="space-y-6">
        {configs.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 dark:bg-white/5 rounded-3xl border border-dashed">
                <p className="text-gray-500 font-bold">لا توجد أهداف مسجلة لهذا الشهر.</p>
                <p className="text-xs text-gray-400 mt-2">اضغط على "إضافة هدف جديد" للبدء.</p>
            </div>
        ) : (
            configs.map((config, idx) => {
                const isLocked = !isAdmin && (config.status === KpiStatus.Approved || config.status === KpiStatus.Pending);
                const totalPotential = (Number(config.target_value) || 0) * (Number(config.unit_value) || 0);
                
                return (
                <div key={idx} className={`p-5 border rounded-2xl bg-white dark:bg-white/5 relative group transition-colors shadow-sm ${config.status === KpiStatus.Rejected ? 'border-red-300 bg-red-50' : 'border-gray-200 dark:border-white/10'}`}>
                    <div className="absolute top-4 left-4 flex gap-2">
                        <span className={`text-[9px] px-2 py-1 rounded-full font-bold self-center 
                            ${config.status === KpiStatus.Approved ? 'bg-green-100 text-green-700' : 
                              config.status === KpiStatus.Pending ? 'bg-yellow-100 text-yellow-700' : 
                              config.status === KpiStatus.Rejected ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                            {KPI_STATUS_AR_MAP[config.status || KpiStatus.Draft]}
                        </span>
                        {(!isLocked || isAdmin) && (
                            <button onClick={() => handleDeleteKpi(config.id, idx)} className="text-red-400 hover:text-red-600 p-1 transition-colors" title="حذف">🗑️</button>
                        )}
                    </div>
                    
                    <h4 className="font-bold text-indigo-700 dark:text-indigo-400 text-sm mb-3">الهدف رقم {idx + 1}</h4>
                    
                    {config.manager_feedback && config.status === KpiStatus.Rejected && (
                        <div className="mb-3 p-2 bg-red-100 text-red-800 text-xs rounded border border-red-200">
                            <strong>ملاحظات المدير:</strong> {config.manager_feedback}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">وصف الهدف (نوع المحتوى)</label>
                            <input type="text" value={config.smart_s} onChange={(e) => handleUpdateLocal(idx, 'smart_s', e.target.value)} disabled={isLocked} className="w-full bg-gray-50 dark:bg-black/30 p-2 rounded-lg border-none text-sm font-bold text-gray-800 dark:text-gray-200 disabled:opacity-60" placeholder="مثال: فيديو AI" />
                        </div>
                        
                        <div className={!isAdmin ? "md:col-span-2" : ""}>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">الرقم المستهدف</label>
                            <input type="number" value={config.target_value} onChange={(e) => handleUpdateLocal(idx, 'target_value', Number(e.target.value))} disabled={isLocked} className="w-full bg-gray-50 dark:bg-black/30 p-2 rounded-lg border-none text-sm font-bold disabled:opacity-60" />
                        </div>
                        
                        {isAdmin && (
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">سعر القطعة (ج.م)</label>
                                <input type="number" value={config.unit_value} onChange={(e) => handleUpdateLocal(idx, 'unit_value', Number(e.target.value))} disabled={isLocked} className="w-full bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded-lg border-none text-sm font-bold text-indigo-700 disabled:opacity-60" />
                            </div>
                        )}

                        <div className="md:col-span-2">
                             <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">طريقة التحقيق (السبب في التسعير)</label>
                             <input type="text" value={config.smart_a} onChange={(e) => handleUpdateLocal(idx, 'smart_a', e.target.value)} disabled={isLocked} className="w-full bg-gray-50 dark:bg-black/30 p-2 rounded-lg border-none text-sm text-gray-600 disabled:opacity-60" placeholder="مثال: يحتاج بحث وكتابة وتوافق SEO" />
                        </div>
                        
                        {isAdmin && (
                            <div className="md:col-span-2 flex items-end">
                                <div className="w-full bg-gray-100 dark:bg-white/5 p-2 rounded-lg text-center border border-dashed border-gray-300">
                                    <span className="text-[10px] text-gray-500">إجمالي هذا البند:</span>
                                    <span className="block font-black text-lg text-green-600">{totalPotential.toLocaleString()} ج.م</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )})
        )}
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center pt-6 mt-6 border-t dark:border-white/5 gap-4">
        <Button type="button" variant="secondary" onClick={onClose} className="rounded-xl px-8 w-full md:w-auto">إغلاق</Button>
        <div className="flex gap-2 w-full md:w-auto">
            <Button type="button" onClick={handleSaveAll} className="flex-1 rounded-xl px-6 bg-gray-600 text-white">حفظ المسودة</Button>
            <Button type="button" onClick={handleSubmitPlan} className="flex-1 rounded-xl px-8 bg-green-600 text-white shadow-lg animate-pulse hover:animate-none">✅ إرسال للموافقة</Button>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
             <div className="bg-white dark:bg-[#202020] w-full max-w-lg rounded-[32px] p-8 shadow-2xl border border-white/10">
                <h3 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mb-6 text-center">🎯 هدف جديد</h3>
                <form onSubmit={confirmAddKpi} className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">نوع المحتوى / المهمة</label>
                        <input type="text" autoFocus value={tempKpi.smart_s || ''} onChange={(e) => setTempKpi({...tempKpi, smart_s: e.target.value})} className="w-full bg-gray-100 dark:bg-black/40 p-4 rounded-xl border-2 border-transparent focus:border-indigo-500 outline-none text-sm font-bold dark:text-white" placeholder="مثال: فيديو AI (مشروع الرسائل)" required />
                    </div>
                    <div className={`grid gap-4 ${isAdmin ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2">العدد المطلوب</label>
                            <input type="number" value={tempKpi.target_value} onChange={(e) => setTempKpi({...tempKpi, target_value: Number(e.target.value)})} className="w-full bg-gray-100 dark:bg-black/40 p-3 rounded-xl outline-none font-bold text-center dark:text-white" required />
                        </div>
                        {isAdmin && (
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-2">سعر القطعة (ج.م)</label>
                                <input type="number" value={tempKpi.unit_value} onChange={(e) => setTempKpi({...tempKpi, unit_value: Number(e.target.value)})} className="w-full bg-gray-100 dark:bg-black/40 p-3 rounded-xl outline-none font-bold text-center text-indigo-600 dark:text-indigo-400" placeholder="50" required />
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">السبب في التسعير / المتطلبات (A)</label>
                        <input type="text" value={tempKpi.smart_a || ''} onChange={(e) => setTempKpi({...tempKpi, smart_a: e.target.value})} className="w-full bg-gray-100 dark:bg-black/40 p-3 rounded-xl outline-none text-sm dark:text-white" placeholder="يحتاج مونتاج دقيق..." required />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">الأثر المتوقع (R)</label>
                        <input type="text" value={tempKpi.smart_r || ''} onChange={(e) => setTempKpi({...tempKpi, smart_r: e.target.value})} className="w-full bg-gray-100 dark:bg-black/40 p-3 rounded-xl outline-none text-sm dark:text-white" placeholder="زيادة الوصول..." required />
                    </div>
                    
                    {isAdmin && (
                        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-xl text-center text-xs text-green-700 dark:text-green-300 border border-green-100">
                            إجمالي البند المتوقع: <span className="font-bold text-lg">{(Number(tempKpi.target_value || 0) * Number(tempKpi.unit_value || 0)).toLocaleString()} ج.م</span>
                        </div>
                    )}

                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)} className="flex-1 rounded-xl">إلغاء</Button>
                        <Button type="submit" className="flex-1 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700">إضافة للقائمة</Button>
                    </div>
                </form>
             </div>
        </div>
      )}
    </Card>
  );

  return isModal ? (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
      <div className="w-full max-w-5xl">{FormContent}</div>
    </div>
  ) : FormContent;
};

export default KpiConfigForm;
