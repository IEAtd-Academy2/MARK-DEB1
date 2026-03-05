
import React, { useState, useEffect } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import { LeaveRequest, LeaveStatus, LeaveType } from '../../types';
import LeaveRequestForm from '../forms/LeaveRequestForm';
import { DataService } from '../../services/dataService';

interface EmployeeLeaveCardProps {
  employeeId: string;
  leaveBalance: number;
  leaveRequests: LeaveRequest[];
  onRefresh: () => void;
  isManagerView?: boolean;
}

const EmployeeLeaveCard: React.FC<EmployeeLeaveCardProps> = ({ 
  employeeId, leaveBalance, leaveRequests, onRefresh, isManagerView = false 
}) => {
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [resetMonth, setResetMonth] = useState(new Date().getMonth() + 1);
  const [resetYear, setResetYear] = useState(new Date().getFullYear());

  useEffect(() => { if (isManagerView) DataService.isLeavesLocked().then(setIsLocked); }, [isManagerView]);
  const toggleLock = async () => { const newState = !isLocked; await DataService.setLeavesLocked(newState); setIsLocked(newState); };

  const getStatusColor = (status: LeaveStatus) => {
    switch (status) {
        case LeaveStatus.Approved: return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
        case LeaveStatus.Rejected: return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
        default: return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800';
    }
  };

  const getLeaveTypeText = (r: LeaveRequest) => {
      const map: Record<LeaveType, string> = {
          [LeaveType.Casual]: 'عارضة / مفاجئة',
          [LeaveType.SickShort]: 'مرضية قصيرة',
          [LeaveType.SickLong]: 'مرضية طويلة',
          [LeaveType.Annual]: 'اعتيادية',
          [LeaveType.Exceptional]: 'استثنائي (ضغط)',
          [LeaveType.Absence]: 'إعلام غياب',
          [LeaveType.Permission]: `إذن (${r.hours_count} ساعة)`,
      };
      return map[r.leave_type] || r.leave_type;
  };

  const handleApprove = async (id: string) => {
    if (!window.confirm('موافقة؟')) return;
    setProcessingId(id);
    try { await DataService.approveLeaveRequest(id, 'تمت الموافقة'); onRefresh(); } catch (e: any) { alert(e.message); } finally { setProcessingId(null); }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('سبب الرفض (سيظهر للموظف):');
    if (reason === null) return; // Cancelled
    setProcessingId(id);
    try { await DataService.rejectLeaveRequest(id, reason || 'لم يتم ذكر سبب محدد'); onRefresh(); } catch (e: any) { alert(e.message); } finally { setProcessingId(null); }
  };
  
  const handleResetMonthlyLeaves = async () => {
      if (!window.confirm("تصفير الشهر؟")) return;
      try { await DataService.deleteMonthlyLeaveRequests(employeeId, resetMonth, resetYear); onRefresh(); alert("تم التصفير."); } catch (e: any) { alert(e.message); }
  };
  const handleResetAnnualBalance = async () => {
      if (!window.confirm("تجديد رصيد 21 يوم؟")) return;
      try { await DataService.resetAnnualLeaveBalance(employeeId, 21); onRefresh(); } catch (e: any) { alert(e.message); }
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">🏖️ الإجازات والأذونات</h3>
            <p className="text-xs text-gray-500 mt-1">طلبات المغادرة</p>
        </div>
        {isManagerView && (
            <div className="text-left flex flex-col items-end">
                <span className="block text-[10px] font-bold uppercase text-gray-400">الرصيد</span>
                <div className="flex items-center gap-2">
                    <button onClick={handleResetAnnualBalance} title="تجديد" className="w-6 h-6 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-full text-xs">🔄</button>
                    <span className={`text-2xl font-black ${leaveBalance === 0 ? 'text-red-500' : 'text-indigo-600 dark:text-indigo-400'}`}>{leaveBalance} <span className="text-sm">يوم</span></span>
                </div>
            </div>
        )}
      </div>

      {!isManagerView && (
          <Button onClick={() => setShowRequestForm(true)} className="w-full mb-6 py-3 shadow-md bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm">+ تقديم طلب</Button>
      )}
      
      {isManagerView && (
          <div className="mb-6 space-y-3">
              <div className={`p-4 rounded-xl border flex justify-between items-center ${isLocked ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' : 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'}`}>
                  <p className={`font-bold text-sm ${isLocked ? 'text-red-800 dark:text-red-300' : 'text-green-800 dark:text-green-300'}`}>{isLocked ? '🔒 مقفولة' : '🔓 متاحة'}</p>
                  <button onClick={toggleLock} className="px-3 py-1 rounded-lg text-xs font-bold shadow-sm bg-white dark:bg-gray-800 dark:text-white">{isLocked ? 'فتح' : 'قفل'}</button>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 flex gap-2">
                  <select value={resetMonth} onChange={(e) => setResetMonth(Number(e.target.value))} className="p-1 rounded text-sm bg-white dark:bg-gray-800 dark:text-white border-none">{[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}</select>
                  <button onClick={handleResetMonthlyLeaves} className="text-[10px] bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300 px-3 py-1 rounded font-bold hover:bg-red-200 transition-colors">تصفير الشهر</button>
              </div>
          </div>
      )}

      <div className="space-y-4">
         <h4 className="text-sm font-bold text-gray-600 dark:text-gray-400 border-b dark:border-gray-700 pb-2">سجل الطلبات</h4>
         {leaveRequests.length === 0 ? <p className="text-center text-gray-400 py-4 text-sm">لا توجد طلبات.</p> : (
             <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                 {leaveRequests.map(req => (
                     <div key={req.id} className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-white/5 relative">
                         <div className="flex justify-between mb-2">
                             <span className={`text-[10px] font-bold px-2 py-1 rounded border ${getStatusColor(req.status)}`}>
                                 {req.status === LeaveStatus.Pending ? 'قيد الانتظار' : req.status === LeaveStatus.Approved ? 'مقبول' : 'مرفوض'}
                             </span>
                             <span className="text-[10px] text-gray-400">{new Date(req.created_at).toLocaleDateString()}</span>
                         </div>
                         <div className="flex justify-between items-center mb-1">
                             <span className="font-bold text-sm text-gray-800 dark:text-gray-200">{getLeaveTypeText(req)}</span>
                             {req.leave_type !== LeaveType.Permission && <span className="font-bold text-sm bg-white dark:bg-black/30 px-2 rounded text-indigo-600 dark:text-indigo-400">{req.days_count} يوم</span>}
                         </div>
                         <p className="text-xs text-gray-500 mb-2">{new Date(req.start_date).toLocaleDateString()}{req.leave_type !== LeaveType.Permission && ` ➝ ${new Date(req.end_date).toLocaleDateString()}`}</p>
                         <div className="bg-white dark:bg-black/20 p-2 rounded text-xs text-gray-600 dark:text-gray-300 italic">"{req.reason}"</div>
                         
                         {/* Show Rejection Reason - Logic Updated to show even if comment is empty but status is rejected */}
                         {req.status === LeaveStatus.Rejected && (
                             <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/40 border border-red-200 dark:border-red-800 rounded-lg">
                                 <p className="text-[10px] font-bold text-red-800 dark:text-red-300 uppercase mb-1">⛔ سبب الرفض:</p>
                                 <p className="text-xs text-red-700 dark:text-red-200 font-medium">
                                     "{req.manager_comment || 'لم يتم ذكر سبب محدد'}"
                                 </p>
                             </div>
                         )}

                         {isManagerView && req.status === LeaveStatus.Pending && (
                             <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                 <button onClick={() => handleApprove(req.id)} disabled={processingId === req.id} className="flex-1 bg-green-500 text-white text-xs font-bold py-2 rounded hover:bg-green-600">موافقة</button>
                                 <button onClick={() => handleReject(req.id)} disabled={processingId === req.id} className="flex-1 bg-red-500 text-white text-xs font-bold py-2 rounded hover:bg-red-600">رفض</button>
                             </div>
                         )}
                     </div>
                 ))}
             </div>
         )}
      </div>

      {showRequestForm && <LeaveRequestForm employeeId={employeeId} onClose={() => setShowRequestForm(false)} onSubmit={() => { setShowRequestForm(false); onRefresh(); }} isModal={true} />}
    </Card>
  );
};

export default EmployeeLeaveCard;
