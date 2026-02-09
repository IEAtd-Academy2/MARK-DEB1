
import React, { useState, useEffect } from 'react';
import Button from '../common/Button';
import Card from '../common/Card';
import { KPIRecord, KPIConfig } from '../../types';
import { DataService } from '../../services/dataService';
import Alert from '../common/Alert';
import LoadingSpinner from '../common/LoadingSpinner';

interface KpiSubmissionFormProps {
  employeeId: string;
  onClose: () => void;
  onSubmit: () => Promise<void>;
  isModal?: boolean;
}

const KpiSubmissionForm: React.FC<KpiSubmissionFormProps> = ({ employeeId, onClose, onSubmit, isModal = false }) => {
  const [configs, setConfigs] = useState<KPIConfig[]>([]);
  const [selectedConfigId, setSelectedConfigId] = useState('');
  const [weekNumber, setWeekNumber] = useState(1);
  const [achievedValue, setAchievedValue] = useState<number | ''>('');
  const [loading, setLoading] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const fetchConfigs = async () => {
      const data = await DataService.getKPIConfigs(employeeId, currentMonth, currentYear);
      setConfigs(data);
      if (data.length > 0) setSelectedConfigId(data[0].id);
      setLoading(false);
    };
    fetchConfigs();
  }, [employeeId, currentMonth, currentYear]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConfigId || achievedValue === '') return;
    
    try {
      await DataService.addKPIRecord({
        employee_id: employeeId,
        kpi_config_id: selectedConfigId,
        week_number: weekNumber,
        month: currentMonth,
        year: currentYear,
        achieved_value: Number(achievedValue)
      });
      await onSubmit();
      onClose();
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  if (loading) return <div className="p-10 text-center"><LoadingSpinner /></div>;

  const FormContent = (
    <Card className="p-8 dark:bg-[#1A1A1A] rounded-[32px] border-none shadow-2xl">
      <h3 className="text-2xl font-black mb-8 dark:text-white">تسجيل تقدم العمل ({currentMonth}/{currentYear})</h3>
      {configs.length === 0 ? (
          <div className="text-center">
              <p className="text-gray-500 mb-4">لم يتم تحديد أهداف لهذا الشهر بعد.</p>
              <Button onClick={onClose} variant="secondary">إغلاق</Button>
          </div>
      ) : (
      <form onSubmit={handleSubmit} className="space-y-6">
        {formError && <Alert type="error" message={formError} className="mb-4" />}
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-2">اختر المؤشر (هدف الشهر)</label>
          <select 
            value={selectedConfigId} 
            onChange={(e) => setSelectedConfigId(e.target.value)}
            className="w-full p-4 bg-gray-50 dark:bg-black/20 border dark:border-white/10 rounded-2xl dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {configs.map(c => <option key={c.id} value={c.id}>{c.kpi_name}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2">رقم الأسبوع</label>
            <input 
              type="number" 
              value={weekNumber} 
              onChange={(e) => setWeekNumber(Number(e.target.value))} 
              className="w-full p-4 bg-gray-50 dark:bg-black/20 border dark:border-white/10 rounded-2xl dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2">القيمة المحققة</label>
            <input 
              type="number" 
              value={achievedValue} 
              onChange={(e) => setAchievedValue(Number(e.target.value))} 
              className="w-full p-4 bg-gray-50 dark:bg-black/20 border dark:border-white/10 rounded-2xl dark:text-white"
              required
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} className="rounded-xl px-8">إلغاء</Button>
          <Button type="submit" className="rounded-xl px-8 bg-indigo-600 text-white shadow-lg">تأكيد التسجيل</Button>
        </div>
      </form>
      )}
    </Card>
  );

  return isModal ? (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
      <div className="w-full max-w-lg">{FormContent}</div>
    </div>
  ) : FormContent;
};

export default KpiSubmissionForm;
