
import React, { useState } from 'react';
import Button from '../common/Button';
import Card from '../common/Card';
import Alert from '../common/Alert';

interface ManagerFeedbackFormProps {
  currentFeedback: string;
  onClose: () => void;
  onSubmit: (feedback: string) => Promise<void>;
  month: number;
  year: number;
  isModal?: boolean;
}

const ManagerFeedbackForm: React.FC<ManagerFeedbackFormProps> = ({ currentFeedback, onClose, onSubmit, month, year, isModal = false }) => {
  const [feedback, setFeedback] = useState(currentFeedback || '');
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      await onSubmit(feedback);
      onClose();
    } catch (err: any) {
      setFormError("فشل حفظ النصائح: " + err.message);
    }
  };

  const FormContent = (
    <Card className="p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">
        نصائح وتوجيهات المدير لشهر {month}/{year}
      </h3>
      <p className="text-xs text-gray-500 mb-4">هذه الملاحظات ستظهر للموظف في صفحة التقارير الشهرية الخاصة به.</p>
      
      {formError && <Alert type="error" message={formError} className="mb-4" onClose={() => setFormError(null)} />}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">النصائح / التقييم الشهري</label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={6}
            className="w-full bg-gray-50 dark:bg-black/20 p-4 rounded-xl border border-gray-200 dark:border-white/10 outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            placeholder="اكتب نصائحك للموظف لتحسين الأداء في الشهر القادم..."
          />
        </div>

        <div className="flex justify-end space-x-3 rtl:space-x-reverse">
          <Button type="button" variant="secondary" onClick={onClose}>إلغاء</Button>
          <Button type="submit" variant="primary">حفظ وإرسال</Button>
        </div>
      </form>
    </Card>
  );

  return isModal ? (
    <div className="fixed inset-0 bg-gray-600/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="w-full max-w-lg">{FormContent}</div>
    </div>
  ) : FormContent;
};

export default ManagerFeedbackForm;
