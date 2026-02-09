import React, { useState, useEffect } from 'react';
import Button from '../common/Button';
import Card from '../common/Card';
import { ProblemLog } from '../../types';
import Alert from '../common/Alert'; // Ensure Alert is imported
import { DataService } from '../../services/dataService';


interface ProblemLogFormProps {
  employeeId: string;
  problemLog?: ProblemLog | null; // Optional prop for editing
  onClose: () => void;
  onSubmit: (log: ProblemLog | Omit<ProblemLog, 'id' | 'logged_date' | 'solution_status'>) => Promise<void>; // onSubmit is now async
  isModal?: boolean;
}

const ProblemLogForm: React.FC<ProblemLogFormProps> = ({ employeeId, problemLog, onClose, onSubmit, isModal = false }) => {
  const [problemDesc, setProblemDesc] = useState(problemLog?.problem_desc || '');
  const [guidanceGiven, setGuidanceGiven] = useState(problemLog?.guidance_given || false);
  const [potentialBonusAmount, setPotentialBonusAmount] = useState<number | ''>(problemLog?.potential_bonus_amount || ''); // New state for bonus
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

    if (problemLog) {
      setProblemDesc(problemLog.problem_desc);
      setGuidanceGiven(problemLog.guidance_given);
      setPotentialBonusAmount(problemLog.potential_bonus_amount);
    }
  }, [problemLog, employeeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!problemDesc.trim()) {
      setFormError('الرجاء إدخال وصف المشكلة.');
      return;
    }
    if (potentialBonusAmount === '' || isNaN(Number(potentialBonusAmount)) || Number(potentialBonusAmount) < 0) {
      setFormError('الرجاء إدخال مبلغ مكافأة محتملة صحيح وموجب.');
      return;
    }

    const logData = {
      employee_id: employeeId,
      problem_desc: problemDesc,
      guidance_given: guidanceGiven,
      potential_bonus_amount: Number(potentialBonusAmount), // Include bonus amount
    };

    try {
        if (problemLog) {
          await onSubmit({ ...problemLog, ...logData }); // For editing
        } else {
          await onSubmit(logData); // For adding
        }
        onClose();
    } catch (err: any) {
        setFormError("فشل حفظ سجل المشكلة: " + err.message);
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
        {problemLog ? 'تعديل سجل مشكلة' : 'تسجيل مشكلة جديدة'} للموظف {employeeName}
      </h3>
      {formError && <Alert type="error" message={formError} className="mb-4" onClose={() => setFormError(null)} />}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="problemDesc" className="block text-sm font-medium text-gray-700">
            وصف المشكلة
          </label>
          <textarea
            id="problemDesc"
            value={problemDesc}
            onChange={(e) => setProblemDesc(e.target.value)}
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          ></textarea>
        </div>

        <div className="flex items-center">
          <input
            id="guidanceGiven"
            name="guidanceGiven"
            type="checkbox"
            checked={guidanceGiven}
            onChange={(e) => setGuidanceGiven(e.target.checked)}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label htmlFor="guidanceGiven" className="mr-2 block text-sm text-gray-900">
            تم تقديم توجيه من المدير
          </label>
        </div>

        <div>
          <label htmlFor="potentialBonusAmount" className="block text-sm font-medium text-gray-700">
            مبلغ المكافأة المحتملة (جنيه مصري، عند الحل)
          </label>
          <input
            type="number"
            id="potentialBonusAmount"
            value={potentialBonusAmount}
            onChange={(e) => setPotentialBonusAmount(e.target.value !== '' ? parseFloat(e.target.value) : '')}
            min="0"
            step="0.01"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-right"
            required
          />
        </div>

        <div className="flex justify-end space-x-3 rtl:space-x-reverse">
          <Button type="button" variant="secondary" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="submit" variant="primary">
            {problemLog ? 'تحديث المشكلة' : 'تسجيل المشكلة'}
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

export default ProblemLogForm;