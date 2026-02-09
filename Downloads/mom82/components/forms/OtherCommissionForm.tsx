
import React, { useState, useEffect } from 'react';
import Button from '../common/Button';
import Card from '../common/Card';
import { DataService } from '../../services/dataService';
import Alert from '../common/Alert';

interface OtherCommissionFormProps {
  employeeId: string;
  month: number;
  year: number;
  onClose: () => void;
  onSubmit: (amount: number, description: string) => Promise<void>;
  isModal?: boolean;
}

const OtherCommissionForm: React.FC<OtherCommissionFormProps> = ({ employeeId, month, year, onClose, onSubmit, isModal = false }) => {
  const [amount, setAmount] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [employeeName, setEmployeeName] = useState<string>('');
  const [loadingEmployee, setLoadingEmployee] = useState(true);

  useEffect(() => {
    const fetchEmployeeName = async () => {
      setLoadingEmployee(true);
      try {
        const employee = await DataService.getEmployee(employeeId);
        if (employee) {
          setEmployeeName(employee.name);
        } else {
          setFormError('الموظف غير موجود.');
        }
      } catch (err: any) {
        setFormError('فشل جلب اسم الموظف: ' + err.message);
      } finally {
        setLoadingEmployee(false);
      }
    };
    fetchEmployeeName();
  }, [employeeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (amount === '' || isNaN(Number(amount)) || Number(amount) < 0) {
      setFormError('الرجاء إدخال مبلغ عمولة صحيح وموجب.');
      return;
    }
    if (!description.trim()) {
      setFormError('الرجاء إدخال وصف للعمولة.');
      return;
    }

    try {
        await onSubmit(Number(amount), description);
        onClose();
    } catch (err: any) {
        setFormError("فشل حفظ العمولة الإضافية: " + err.message);
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
    <Card className="p-6">
      <h3 className="text-2xl font-bold text-gray-800 mb-4">
        إضافة عمولة إضافية لـ {employeeName} (
        {new Date(year, month - 1).toLocaleString('ar-EG', { month: 'long', year: 'numeric' })}
        )
      </h3>
      {formError && <Alert type="error" message={formError} className="mb-4" onClose={() => setFormError(null)} />}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
            مبلغ العمولة (جنيه مصري)
          </label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value !== '' ? parseFloat(e.target.value) : '')}
            min="0"
            step="0.01"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-right"
            required
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            الوصف
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          ></textarea>
        </div>
        <div className="flex justify-end space-x-3 rtl:space-x-reverse">
          <Button type="button" variant="secondary" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="submit" variant="primary">
            إضافة العمولة
          </Button>
        </div>
      </form>
    </Card>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
        <div className="relative p-5 w-full max-w-lg mx-auto bg-white rounded-lg shadow-lg">
          {FormContent}
        </div>
      </div>
    );
  }

  return FormContent;
};

export default OtherCommissionForm;
