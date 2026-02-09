
import React, { useState, useEffect } from 'react';
import Button from '../common/Button';
import Card from '../common/Card';
import { MoodRating, BehaviorLog } from '../../types';
import { MOOD_RATING_AR_MAP } from '../../constants';
import Alert from '../common/Alert'; // Ensure Alert is imported

interface BehaviorLogFormProps {
  employeeId: string;
  behaviorLog?: BehaviorLog | null; // Optional prop for editing
  onClose: () => void;
  onSubmit: (log: BehaviorLog | Omit<BehaviorLog, 'id'>) => Promise<void>; // onSubmit is now async
  isModal?: boolean;
}

const BehaviorLogForm: React.FC<BehaviorLogFormProps> = ({ employeeId, behaviorLog, onClose, onSubmit, isModal = false }) => {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const [weekNumber, setWeekNumber] = useState(behaviorLog?.week_number || 1); // Default to week 1 for new entry
  const [month, setMonth] = useState(behaviorLog?.month || currentMonth); // Default to current month
  const [year, setYear] = useState(behaviorLog?.year || currentYear); // Default to current year
  const [moodRating, setMoodRating] = useState<MoodRating | number>(behaviorLog?.mood_rating || MoodRating.Neutral);
  const [notes, setNotes] = useState(behaviorLog?.notes || '');
  const [moodRatingType, setMoodRatingType] = useState<'enum' | 'number'>(
    typeof behaviorLog?.mood_rating === 'number' ? 'number' : 'enum'
  );
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (behaviorLog) {
      setWeekNumber(behaviorLog.week_number);
      setMonth(behaviorLog.month);
      setYear(behaviorLog.year);
      setMoodRating(behaviorLog.mood_rating);
      setNotes(behaviorLog.notes || '');
      setMoodRatingType(typeof behaviorLog.mood_rating === 'number' ? 'number' : 'enum');
    }
  }, [behaviorLog]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (weekNumber <= 0 || month <= 0 || month > 12 || year <= 1900) { // Simple validation
      setFormError('الرجاء إدخال رقم أسبوع وشهر وسنة صحيحة.');
      return;
    }
    if (moodRatingType === 'number' && (isNaN(Number(moodRating)) || Number(moodRating) < 1 || Number(moodRating) > 10)) {
        setFormError('الرجاء إدخال تقييم مزاج رقمي بين 1 و 10.');
        return;
    }

    const submittedMoodRating = moodRatingType === 'enum' ? (moodRating as MoodRating) : parseInt(moodRating as string);

    const logData = {
      employee_id: employeeId,
      week_number: weekNumber,
      month,
      year,
      mood_rating: submittedMoodRating,
      notes,
    };

    try {
        if (behaviorLog) {
          await onSubmit({ ...behaviorLog, ...logData }); // For editing
        } else {
          await onSubmit(logData); // For adding
        }
        onClose();
    } catch (err: any) {
        setFormError("فشل حفظ سجل السلوك: " + err.message);
    }
  };

  const FormContent = (
    <Card className="p-6">
      <h3 className="text-2xl font-bold text-gray-800 mb-4">
        {behaviorLog ? 'تعديل سجل سلوك' : 'تسجيل سلوك موظف'}
      </h3>
      {formError && <Alert type="error" message={formError} className="mb-4" onClose={() => setFormError(null)} />}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="weekNumber" className="block text-sm font-medium text-gray-700">
            رقم الأسبوع
          </label>
          <input
            type="number"
            id="weekNumber"
            value={weekNumber}
            onChange={(e) => setWeekNumber(parseInt(e.target.value))}
            min="1"
            max="53"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="month" className="block text-sm font-medium text-gray-700">
              الشهر
            </label>
            <input
              type="number"
              id="month"
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              min="1"
              max="12"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="year" className="block text-sm font-medium text-gray-700">
              السنة
            </label>
            <input
              type="number"
              id="year"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              min="2000" // reasonable minimum year
              max={new Date().getFullYear() + 5} // reasonable maximum year
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="moodRatingType" className="block text-sm font-medium text-gray-700">
            نوع تقييم المزاج
          </label>
          <select
            id="moodRatingType"
            value={moodRatingType}
            onChange={(e) => {
              setMoodRatingType(e.target.value as 'enum' | 'number');
              setMoodRating(e.target.value === 'enum' ? MoodRating.Neutral : 5); // Reset mood
            }}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="enum">تعداد (غاضب، مركز، إلخ)</option>
            <option value="number">رقم (1-10)</option>
          </select>
        </div>

        <div>
          <label htmlFor="moodRating" className="block text-sm font-medium text-gray-700">
            تقييم المزاج
          </label>
          {moodRatingType === 'enum' ? (
            <select
              id="moodRating"
              value={moodRating as MoodRating}
              onChange={(e) => setMoodRating(e.target.value as MoodRating)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            >
              {Object.values(MoodRating).map((mood) => (
                <option key={mood} value={mood}>
                  {MOOD_RATING_AR_MAP[mood]}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="number"
              id="moodRating"
              value={moodRating as number}
              onChange={(e) => setMoodRating(parseInt(e.target.value))}
              min="1"
              max="10"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            />
          )}
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
            ملاحظات (اختياري)
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          ></textarea>
        </div>

        <div className="flex justify-end space-x-3 rtl:space-x-reverse">
          <Button type="button" variant="secondary" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="submit" variant="primary">
            {behaviorLog ? 'تحديث السجل' : 'تسجيل السلوك'}
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

export default BehaviorLogForm;
