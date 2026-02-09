
import React, { useState, useEffect } from 'react';
import Button from '../common/Button';
import Card from '../common/Card';
import { DataService } from '../../services/dataService';
import Alert from '../common/Alert';

interface ManualDeductionFormProps {
  employeeId: string;
  month: number;
  year: number;
  currentDeduction?: number; 
  currentNote?: string;
  onClose: () => void;
  onSubmit: (amount: number, note: string) => Promise<void>; 
  isModal?: boolean;
}

const ManualDeductionForm: React.FC<ManualDeductionFormProps> = ({ employeeId, month, year, currentDeduction = 0, currentNote = '', onClose, onSubmit, isModal = false }) => {
  // Use string state for better input handling (decimals, empty state)
  const [deductionAmount, setDeductionAmount] = useState<string>(currentDeduction > 0 ? currentDeduction.toString() : '');
  const [note, setNote] = useState(currentNote || '');
  const [formError, setFormError] = useState<string | null>(null);
  const [employeeName, setEmployeeName] = useState<string>('');
  const [employeeSalary, setEmployeeSalary] = useState<number>(0);
  const [loadingEmployee, setLoadingEmployee] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchEmployeeData = async () => {
      setLoadingEmployee(true);
      try {
        const employee = await DataService.getEmployee(employeeId);
        if (employee) {
          setEmployeeName(employee.name);
          setEmployeeSalary(employee.base_salary || 0);
        } else {
          setFormError('الموظف غير موجود.');
        }
      } catch (err: any) {
        setFormError('فشل جلب بيانات الموظف: ' + err.message);
      } finally {
        setLoadingEmployee(false);
      }
    };
    fetchEmployeeData();

    // Reset when props update
    setDeductionAmount(currentDeduction > 0 ? currentDeduction.toString() : '');
    setNote(currentNote || '');
  }, [currentDeduction, currentNote, employeeId]);

  const calculateQuickDeduction = (ratio: number, label: string) => {
      if (employeeSalary <= 0) {
          setFormError("تنبيه: الراتب الأساسي للموظف 0، لا يمكن حساب الخصم بالنسبة تلقائياً. يرجى إدخال المبلغ يدوياً.");
          return;
      }
      
      const dayRate = employeeSalary / 30;
      const amount = dayRate * ratio;
      
      // Round to 2 decimal places and set as string
      setDeductionAmount((Math.round(amount * 100) / 100).toString());
      
      // Append note smartly
      setNote(prev => {
          if (!prev) return label;
          if (prev.includes(label)) return prev; // Avoid duplicate
          return `${prev} | ${label}`;
      });
      setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    const finalAmount = parseFloat(deductionAmount);

    if (deductionAmount === '' || isNaN(finalAmount) || finalAmount < 0) {
      setFormError('الرجاء إدخال مبلغ خصم صحيح وموجب.');
      setIsSubmitting(false);
      return;
    }

    try {
        await onSubmit(finalAmount, note);
        onClose();
    } catch (err: any) {
        setFormError("فشل تطبيق الخصم: " + err.message);
    } finally {
        setIsSubmitting(false);
    }
  };

  if (loadingEmployee) {
    return (
      <Card className="p-6">
        <p className="text-gray-600">جاري تحميل بيانات الموظف...</p>
      </Card>
    );
  }

  const FormContent = (
    <Card className="p-6 bg-white dark:bg-slate-900 border-none shadow-none">
      <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
        خصم يدوي للموظف: <span className="text-indigo-600 dark:text-indigo-400">{employeeName}</span>
      </h3>
      <p className="text-xs text-gray-500 mb-6 font-bold">
        عن شهر: {new Date(year, month - 1).toLocaleString('ar-EG', { month: 'long', year: 'numeric' })} | الراتب الأساسي: {employeeSalary.toLocaleString()} ج.م
      </p>

      {formError && <Alert type="error" message={formError} className="mb-4" onClose={() => setFormError(null)} />}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Quick Actions */}
        <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
            <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">حساب سريع (بناءً على يومية 30 يوم)</p>
            <div className="grid grid-cols-4 gap-2">
                <button 
                    type="button" 
                    onClick={() => calculateQuickDeduction(0.25, 'تأخير (ربع يوم)')}
                    className="py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-xs font-bold hover:border-red-400 hover:text-red-500 transition-colors"
                >
                    ¼ يوم
                </button>
                <button 
                    type="button" 
                    onClick={() => calculateQuickDeduction(0.5, 'جزاء (نصف يوم)')}
                    className="py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-xs font-bold hover:border-red-400 hover:text-red-500 transition-colors"
                >
                    ½ يوم
                </button>
                <button 
                    type="button" 
                    onClick={() => calculateQuickDeduction(1, 'غياب (يوم كامل)')}
                    className="py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-xs font-bold hover:border-red-400 hover:text-red-500 transition-colors"
                >
                    1 يوم
                </button>
                <button 
                    type="button" 
                    onClick={() => calculateQuickDeduction(2, 'غياب يومين')}
                    className="py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-xs font-bold hover:border-red-400 hover:text-red-500 transition-colors"
                >
                    2 يوم
                </button>
            </div>
        </div>

        <div>
          <label htmlFor="deductionAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            مبلغ الخصم (جنيه مصري)
          </label>
          <input
            type="number"
            id="deductionAmount"
            value={deductionAmount}
            onChange={(e) => setDeductionAmount(e.target.value)}
            min="0"
            step="0.01"
            className="w-full p-3 bg-white dark:bg-black/20 border border-gray-300 dark:border-gray-600 rounded-xl outline-none focus:border-red-500 text-lg font-bold text-red-600 dark:text-red-400"
            placeholder="0.00"
            required
          />
        </div>

        <div>
          <label htmlFor="note" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            سبب الخصم (ملاحظات)
          </label>
          <textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full p-3 bg-white dark:bg-black/20 border border-gray-300 dark:border-gray-600 rounded-xl outline-none focus:border-indigo-500 text-sm dark:text-white"
            rows={3}
            placeholder="مثلاً: تأخير متكرر، غياب بدون إذن..."
          />
        </div>

        <div className="flex justify-end space-x-3 rtl:space-x-reverse pt-4 border-t border-gray-100 dark:border-gray-700">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            إلغاء
          </Button>
          <Button type="submit" variant="danger" className="px-6" disabled={isSubmitting}>
            {isSubmitting ? 'جاري الحفظ...' : 'تأكيد الخصم'}
          </Button>
        </div>
      </form>
    </Card>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 bg-gray-600/50 dark:bg-black/70 backdrop-blur-sm overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4">
        <div className="relative w-full max-w-lg mx-auto bg-white dark:bg-slate-900 rounded-xl shadow-2xl overflow-hidden">
          {FormContent}
        </div>
      </div>
    );
  }

  return FormContent;
};

export default ManualDeductionForm;
