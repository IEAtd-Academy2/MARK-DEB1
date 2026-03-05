
import React, { useState, useEffect } from 'react';
import Button from '../common/Button';
import Card from '../common/Card';
import Alert from '../common/Alert';
import { LeaveType } from '../../types';
import { DataService } from '../../services/dataService';
import LoadingSpinner from '../common/LoadingSpinner';

interface LeaveRequestFormProps {
  employeeId: string;
  leaveBalance?: number; 
  onClose: () => void;
  onSubmit: () => void;
  isModal?: boolean;
}

const LeaveRequestForm: React.FC<LeaveRequestFormProps> = ({ employeeId, onClose, onSubmit, isModal = false }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [leaveType, setLeaveType] = useState<LeaveType>(LeaveType.Annual);
  const [reason, setReason] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [canWorkRemotely, setCanWorkRemotely] = useState(false); 
  const [daysCount, setDaysCount] = useState(0);
  const [hoursCount, setHoursCount] = useState(0); // New for permission
  const [formError, setFormError] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkLock = async () => {
        try {
            const locked = await DataService.isLeavesLocked();
            setIsLocked(locked);
            if (locked) setLeaveType(LeaveType.Exceptional);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    checkLock();
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
      setDaysCount(diffDays);
    }
  }, [startDate, endDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!startDate) { setFormError('يرجى تحديد التاريخ.'); return; }
    if (leaveType !== LeaveType.Permission && !endDate) { setFormError('يرجى تحديد تاريخ النهاية.'); return; }
    if (!reason.trim()) { setFormError('يرجى كتابة السبب.'); return; }
    
    // Permission Validation
    if (leaveType === LeaveType.Permission) {
        if (hoursCount <= 0 || hoursCount > 2) {
            setFormError('الإذن يجب أن يكون بين ساعة وساعتين كحد أقصى.');
            return;
        }
    }

    try {
      await DataService.createLeaveRequest({
        employee_id: employeeId,
        leave_type: leaveType,
        start_date: new Date(startDate).toISOString(),
        end_date: leaveType === LeaveType.Permission ? new Date(startDate).toISOString() : new Date(endDate).toISOString(),
        days_count: leaveType === LeaveType.Permission ? 0 : daysCount,
        hours_count: leaveType === LeaveType.Permission ? hoursCount : 0,
        reason: reason,
        attachment_url: attachmentUrl,
        can_work_remotely: canWorkRemotely
      });
      onSubmit(); onClose();
    } catch (err: any) { setFormError(err.message); }
  };

  if (loading) return <div className="p-10 flex justify-center"><LoadingSpinner /></div>;

  const FormContent = (
    <Card className="p-6 max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border-none shadow-none">
      <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
          {isLocked ? '🔒 تقديم طلب استثنائي' : 'تقديم طلب إجازة / إذن'}
      </h3>
      
      {isLocked && <div className="bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 p-4 rounded-xl mb-4 text-sm font-bold border border-red-200 dark:border-red-800">⚠️ الإجازات مقفولة. للضرورة القصوى فقط.</div>}
      {formError && <Alert type="error" message={formError} className="mb-4" onClose={() => setFormError(null)} />}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">نوع الطلب</label>
          <select 
            value={leaveType} 
            onChange={(e) => setLeaveType(e.target.value as LeaveType)}
            className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-medium transition-colors"
            disabled={isLocked}
          >
            {isLocked ? (
                <option value={LeaveType.Exceptional}>استثنائي (ضغط عمل)</option>
            ) : (
                <>
                    <option value={LeaveType.Permission}>إذن (ساعة - ساعتين)</option>
                    <option value={LeaveType.Casual}>عارضة / مفاجئة</option>
                    <option value={LeaveType.Annual}>اعتيادية</option>
                    <option value={LeaveType.SickShort}>مرضية قصيرة</option>
                    <option value={LeaveType.SickLong}>مرضية طويلة</option>
                    <option value={LeaveType.Absence}>إعلام غياب (خصم)</option>
                </>
            )}
          </select>
        </div>

        {leaveType === LeaveType.Permission ? (
            <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">تاريخ اليوم</label>
                    <input 
                        type="date" 
                        value={startDate} 
                        onChange={(e) => setStartDate(e.target.value)} 
                        className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" 
                        required 
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">عدد الساعات (ماكس 2)</label>
                    <input 
                        type="number" 
                        min="1" 
                        max="2" 
                        value={hoursCount} 
                        onChange={(e) => setHoursCount(Number(e.target.value))} 
                        className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" 
                        required 
                    />
                 </div>
            </div>
        ) : (
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">من تاريخ</label>
                    <input 
                        type="date" 
                        value={startDate} 
                        onChange={(e) => setStartDate(e.target.value)} 
                        className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" 
                        required 
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">إلى تاريخ</label>
                    <input 
                        type="date" 
                        value={endDate} 
                        onChange={(e) => setEndDate(e.target.value)} 
                        className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" 
                        required 
                    />
                </div>
            </div>
        )}

        {leaveType !== LeaveType.Permission && daysCount > 0 && (
            <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 text-center bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded border border-indigo-100 dark:border-indigo-800">مدة الإجازة: {daysCount} يوم</p>
        )}
        
        {leaveType !== LeaveType.Permission && (
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-800 p-3 rounded-xl border border-gray-200 dark:border-slate-700">
                <input 
                    type="checkbox" 
                    id="remoteWork" 
                    checked={canWorkRemotely} 
                    onChange={(e) => setCanWorkRemotely(e.target.checked)} 
                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500" 
                />
                <label htmlFor="remoteWork" className="text-sm font-bold text-gray-700 dark:text-gray-300 cursor-pointer select-none">هل يمكنك متابعة العمل عن بعد (Online)؟</label>
            </div>
        )}

        <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">السبب (مطلوب)</label>
            <textarea 
                value={reason} 
                onChange={(e) => setReason(e.target.value)} 
                rows={3} 
                className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" 
                placeholder="يرجى كتابة التفاصيل..." 
                required 
            />
        </div>

        <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">رابط مرفقات/إثباتات</label>
            <input 
                type="text" 
                value={attachmentUrl} 
                onChange={(e) => setAttachmentUrl(e.target.value)} 
                className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 text-sm" 
                placeholder="اختياري" 
            />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
             <Button type="button" variant="secondary" onClick={onClose} className="dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600">إلغاء</Button>
             <Button type="submit" variant="primary">تقديم الطلب</Button>
        </div>
      </form>
    </Card>
  );

  return isModal ? (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="w-full max-w-lg shadow-2xl rounded-[24px] overflow-hidden">{FormContent}</div>
    </div>
  ) : FormContent;
};

export default LeaveRequestForm;
