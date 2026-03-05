
import React, { useState, useEffect, useRef } from 'react';
import { Task, TaskStatus, TaskColumn, Employee } from '../../types';
import { DataService } from '../../services/dataService';

interface TaskCardProps {
  task: Task;
  index: number;
  isAdmin: boolean;
  userAverageTime: number; 
  allColumns: TaskColumn[]; 
  allEmployees: Employee[]; 
  onTaskChange: (taskId: string, updates: { column_id?: string, assigned_to?: string, deadline?: Date, notes?: string, attachment_url?: string }) => void;
  onUpdate: () => void;
  onDelete?: (taskId: string) => void; 
}

const TaskCard: React.FC<TaskCardProps> = ({ 
    task, 
    index, 
    isAdmin, 
    userAverageTime, 
    allColumns, 
    allEmployees, 
    onTaskChange, 
    onUpdate,
    onDelete
}) => {
  const [elapsed, setElapsed] = useState(task.total_duration || 0);
  const [isRunning, setIsRunning] = useState(task.is_running || false);
  
  // Handoff State
  const [showHandoffModal, setShowHandoffModal] = useState(false);
  const [pendingAssignee, setPendingAssignee] = useState<string | null>(null);
  const [handoffDeadline, setHandoffDeadline] = useState('');
  const [handoffNotes, setHandoffNotes] = useState(task.notes || '');
  const [handoffAttachment, setHandoffAttachment] = useState(task.attachment_url || '');

  const intervalRef = useRef<number | null>(null);

  // If onTaskChange is a no-op (from KanbanBoard when permission is 'view'), we consider it read-only for moves
  // However, simple function equality check is hard. We rely on the fact that onDelete is undefined if read-only in KanbanBoard logic above.
  const isReadOnly = onDelete === undefined && !isAdmin; 

  useEffect(() => {
    if (task.is_running && task.timer_start) {
        const start = new Date(task.timer_start).getTime();
        const initialTotal = task.total_duration || 0;
        
        intervalRef.current = window.setInterval(() => {
            const now = new Date().getTime();
            const sessionDuration = Math.floor((now - start) / 1000);
            setElapsed(initialTotal + sessionDuration);
        }, 1000);
    } else {
        setElapsed(task.total_duration || 0);
        setIsRunning(task.is_running || false);
    }

    return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [task]);

  const handleStart = async () => {
      await DataService.startTaskTimer(task.id);
      setIsRunning(true);
      onUpdate();
  };

  const handleStop = async () => {
      if (!isAdmin) return; 
      await DataService.stopTaskTimer(task.id, elapsed);
      setIsRunning(false);
      onUpdate();
  };

  const handleComplete = async () => {
      const isLowScore = userAverageTime > 60 && elapsed < userAverageTime;
      await DataService.completeTask(task.id, elapsed, isLowScore);
      
      if (isLowScore) {
          alert(`🎉 مذهل! رقم قياسي جديد 🚀\nأنهيت المهمة في وقت أقل من المعتاد (${formatTime(elapsed)})`);
      } else {
          alert(`💪 عاش يا بطل! تم إنهاء المهمة.\nالوقت المستغرق: ${formatTime(elapsed)}`);
      }
      onUpdate();
  };

  const formatTime = (seconds: number) => {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      return `${h}h ${m}m ${s}s`;
  };

  // Safe fallback if IDs are missing
  const currentColumnId = task.column_id || (allColumns.length > 0 ? allColumns[0].id : '');
  const currentAssigneeId = task.assigned_to || '';

  // Get Assignee Name for display
  const assigneeName = allEmployees.find(e => e.id === currentAssigneeId)?.name || 'غير محدد';

  // Handoff Logic
  const initiateHandoff = (newAssigneeId: string) => {
      setPendingAssignee(newAssigneeId);
      // Default to current time + 24h as suggestion
      const tomorrow = new Date();
      tomorrow.setHours(tomorrow.getHours() + 24);
      setHandoffDeadline(tomorrow.toISOString().slice(0, 16)); // Format for datetime-local
      setShowHandoffModal(true);
  };

  const confirmHandoff = () => {
      if (pendingAssignee && handoffDeadline) {
          onTaskChange(task.id, { 
              assigned_to: pendingAssignee,
              deadline: new Date(handoffDeadline),
              notes: handoffNotes,
              attachment_url: handoffAttachment
          });
          setShowHandoffModal(false);
          setPendingAssignee(null);
      } else {
          alert("يرجى تحديد وقت وتاريخ التسليم (Deadline)");
      }
  };

  return (
    <>
    <div className={`p-6 mb-4 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/50 bg-white dark:bg-slate-800 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-indigo-200 dark:hover:border-indigo-900 group relative`}>
      
      <div className="flex justify-between items-start mb-3">
          <div className="flex flex-col gap-1 w-full">
              <div className="flex justify-between w-full">
                  <h4 className="font-black text-gray-800 dark:text-gray-100 text-lg leading-tight line-clamp-2">{task.title}</h4>
                  {isAdmin && onDelete && (
                      <button 
                        onClick={() => onDelete(task.id)} 
                        className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 px-2"
                        title="حذف المهمة"
                      >
                          🗑️
                      </button>
                  )}
              </div>
              {task.status === TaskStatus.Done && <span className="text-xs font-bold text-green-600 dark:text-green-400 flex items-center gap-1">✅ مكتملة</span>}
          </div>
      </div>
      
      {/* Assignee Badge */}
      <div className="mb-4 flex flex-wrap gap-2">
          <span className="text-[10px] font-bold bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-lg text-indigo-700 dark:text-indigo-300 flex items-center gap-1 w-fit">
             👤 {assigneeName}
          </span>
          <span className="text-[10px] font-bold bg-gray-50 dark:bg-slate-700/50 px-2 py-1 rounded-lg text-gray-600 dark:text-gray-300 flex items-center gap-1 w-fit" dir="ltr">
             📅 {new Date(task.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'numeric' })}
          </span>
      </div>

      {task.description && <p className="text-sm text-gray-600 dark:text-slate-400 mb-4 leading-relaxed line-clamp-3">{task.description}</p>}
      
      {/* Extra Info: Notes & Attachments */}
      {(task.notes || task.attachment_url) && (
          <div className="mb-4 space-y-2 bg-gray-50 dark:bg-slate-900/50 p-3 rounded-xl border border-dashed border-gray-200 dark:border-slate-700">
              {task.notes && (
                  <div className="text-[10px] text-gray-600 dark:text-gray-400">
                      <span className="font-bold text-gray-800 dark:text-gray-300">ملاحظات:</span> {task.notes}
                  </div>
              )}
              {task.attachment_url && (
                  <a 
                    href={task.attachment_url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                      📎 المرفقات
                  </a>
              )}
          </div>
      )}

      <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
          <span className={`text-xs font-mono font-bold flex items-center gap-1 ${isRunning ? 'text-green-600 dark:text-green-400 animate-pulse' : 'text-gray-400'}`}>
              <span>⏱</span> {formatTime(elapsed)}
          </span>
          
          <div className="flex gap-2">
              {!isRunning && task.status !== TaskStatus.Done && (
                  <button 
                    onClick={handleStart} 
                    disabled={isReadOnly}
                    className={`bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg hover:scale-105 active:scale-95 ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    ابدأ 🚀
                  </button>
              )}
              
              {isRunning && isAdmin && (
                  <button 
                    onClick={handleStop} 
                    className="bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
                  >
                    إيقاف
                  </button>
              )}

              {isRunning && (
                  <button 
                    onClick={handleComplete} 
                    className="bg-green-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-green-700 shadow-md animate-bounce"
                  >
                    إتمام
                  </button>
              )}
          </div>
      </div>

      {/* Action Area: Move & Reassign - Only show if not read only */}
      {!isReadOnly && (
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700 flex flex-col gap-2 opacity-60 hover:opacity-100 transition-opacity">
              
              {/* Column Selector */}
              <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-gray-400 w-12">نقل:</span>
                  <select 
                      className="flex-1 bg-transparent text-[10px] py-1 outline-none cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded transition-colors text-gray-700 dark:text-gray-300 font-bold"
                      value={currentColumnId}
                      onChange={(e) => onTaskChange(task.id, { column_id: e.target.value })}
                  >
                      {allColumns.map(col => (
                          <option key={col.id} value={col.id} className="text-black">{col.title}</option>
                      ))}
                  </select>
              </div>

              {/* Assignee Selector (Handoff) */}
              <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-gray-400 w-12">توجيه:</span>
                  <select 
                      className="flex-1 bg-transparent text-[10px] py-1 outline-none cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded transition-colors text-gray-700 dark:text-gray-300 font-bold"
                      value={currentAssigneeId}
                      onChange={(e) => initiateHandoff(e.target.value)}
                  >
                      {allEmployees.map(emp => (
                          <option key={emp.id} value={emp.id} className="text-black">{emp.name}</option>
                      ))}
                  </select>
              </div>

          </div>
      )}
    </div>

    {/* Handoff Modal */}
    {showHandoffModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in duration-300 border border-gray-100 dark:border-slate-800">
                <h3 className="text-xl font-black text-gray-800 dark:text-white mb-6">
                    تحويل المهمة إلى <span className="text-indigo-600 dark:text-indigo-400 underline decoration-wavy">{allEmployees.find(e => e.id === pendingAssignee)?.name}</span>
                </h3>
                
                <div className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">الموعد النهائي الجديد</label>
                        <input 
                            type="datetime-local" 
                            value={handoffDeadline}
                            onChange={(e) => setHandoffDeadline(e.target.value)}
                            className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-xl border-2 border-transparent focus:border-indigo-500 outline-none text-sm font-bold ltr text-center text-gray-900 dark:text-white"
                            style={{direction: 'ltr'}}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">ملاحظات إضافية</label>
                        <textarea 
                            value={handoffNotes}
                            onChange={(e) => setHandoffNotes(e.target.value)}
                            rows={3}
                            className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-xl outline-none text-sm focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                            placeholder="تعليمات خاصة للموظف الجديد..."
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">رابط ملفات</label>
                        <input 
                            type="url" 
                            value={handoffAttachment}
                            onChange={(e) => setHandoffAttachment(e.target.value)}
                            className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-xl outline-none text-sm ltr focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                            placeholder="https://..."
                            dir="ltr"
                        />
                    </div>
                </div>

                <div className="flex gap-4 mt-8">
                    <button onClick={() => setShowHandoffModal(false)} className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 font-bold text-sm hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">إلغاء</button>
                    <button onClick={confirmHandoff} className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">تأكيد التحويل</button>
                </div>
            </div>
        </div>
    )}
    </>
  );
};

export default TaskCard;
