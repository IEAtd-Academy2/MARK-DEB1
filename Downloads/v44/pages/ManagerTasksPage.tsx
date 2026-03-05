
import React, { useState, useEffect } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { DataService } from '../services/dataService';
import { ManagerTask, ManagerTaskStatus } from '../types';

const ManagerTasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<ManagerTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Custom Task State
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('');

  // Editing State
  const [editingTask, setEditingTask] = useState<ManagerTask | null>(null);

  // Sorting Helper: Converts time string to comparable minutes
  // Handles formats like "09:00 - 10:00", "01:00 - 02:00", "5:00"
  const getMinutesFromTimeSlot = (timeSlot: string) => {
      if (!timeSlot) return 0;
      
      // Extract the first time part (start time)
      const match = timeSlot.match(/(\d{1,2}):(\d{2})/);
      if (!match) return 9999; // Unknown time goes to end

      let hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);

      // Heuristic for Work Day (09:00 AM to 05:00 PM)
      // If hour is 01, 02, 03, 04, 05 -> Treat as PM (add 12)
      // If hour is 06, 07, 08 -> Treat as PM or very early AM? Assuming PM for typical office work, or very early. 
      // Let's assume standard office hours: 09:00 AM - 06:00 PM (18:00)
      
      // Logic: 
      // 08, 09, 10, 11 -> AM (Keep as is)
      // 12 -> PM (Keep as 12)
      // 01, 02, 03, 04, 05, 06, 07 -> PM (Add 12)
      
      if (hours >= 1 && hours <= 7) {
          hours += 12;
      }

      return hours * 60 + minutes;
  };

  const fetchTasks = async (date: Date) => {
      setLoading(true);
      try {
          await DataService.initDailyManagerTasks(date); // Ensure defaults exist
          const data = await DataService.getManagerTasks(date);
          
          // Sort chronologically
          const sortedData = data.sort((a, b) => {
              return getMinutesFromTimeSlot(a.time_slot) - getMinutesFromTimeSlot(b.time_slot);
          });

          setTasks(sortedData);
      } catch(e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
      fetchTasks(selectedDate);
  }, [selectedDate]);

  const handleStatusChange = async (task: ManagerTask, status: ManagerTaskStatus) => {
      const updated = { ...task, status };
      setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
      await DataService.updateManagerTask(updated);
  };

  const handleNotesChange = async (task: ManagerTask, notes: string) => {
      const updated = { ...task, notes };
      setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
      await DataService.updateManagerTask(updated); // Debounce if heavy usage, but fine for now
  };

  const handleAddCustomTask = async () => {
      if (!newTitle.trim()) return;
      const dateStr = selectedDate.toISOString().split('T')[0];
      await DataService.addManagerTask({
          title: newTitle,
          time_slot: newTime || 'مهمة إضافية',
          status: 'pending',
          date: dateStr,
          is_custom: true,
          notes: ''
      });
      setIsAdding(false);
      setNewTitle('');
      setNewTime('');
      fetchTasks(selectedDate);
  };

  // --- Delete Functionality ---
  const handleDeleteTask = async (taskId: string) => {
      if (!window.confirm("هل أنت متأكد من حذف هذه المهمة من الجدول؟")) return;
      try {
          await DataService.deleteManagerTask(taskId);
          setTasks(prev => prev.filter(t => t.id !== taskId));
      } catch(e: any) {
          alert(e.message);
      }
  };

  // --- Edit Functionality ---
  const startEdit = (task: ManagerTask) => {
      setEditingTask({ ...task });
  };

  const saveEdit = async () => {
      if (!editingTask) return;
      try {
          await DataService.updateManagerTask(editingTask);
          setEditingTask(null);
          fetchTasks(selectedDate); // Re-fetch to re-sort
      } catch(e: any) {
          alert(e.message);
      }
  };

  const getStatusColor = (status: ManagerTaskStatus) => {
      switch(status) {
          case 'completed': return 'bg-green-100 border-green-300 text-green-800';
          case 'in_progress': return 'bg-blue-100 border-blue-300 text-blue-800 animate-pulse-slow';
          case 'incomplete': return 'bg-red-100 border-red-300 text-red-800';
          default: return 'bg-white border-gray-200 text-gray-600';
      }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-3xl font-black text-gray-800 dark:text-white">📝 مهام المدير اليومية</h2>
            <p className="text-gray-500 text-sm">متابعة الجدول الزمني والعمليات (مرتبة زمنياً)</p>
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-white/5 p-2 rounded-xl">
              <button onClick={() => setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() - 1)))} className="px-3 text-gray-500 hover:bg-gray-100 rounded">◀</button>
              <input 
                type="date" 
                value={selectedDate.toISOString().split('T')[0]} 
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                className="bg-transparent font-bold outline-none cursor-pointer"
              />
              <button onClick={() => setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() + 1)))} className="px-3 text-gray-500 hover:bg-gray-100 rounded">▶</button>
          </div>
      </div>

      {/* Edit Modal */}
      {editingTask && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <Card className="w-full max-w-md">
                  <h3 className="text-xl font-bold mb-4">تعديل المهمة</h3>
                  <div className="space-y-4">
                      <div>
                          <label className="text-xs font-bold text-gray-500">الوقت</label>
                          <input 
                              value={editingTask.time_slot} 
                              onChange={(e) => setEditingTask({...editingTask, time_slot: e.target.value})}
                              className="w-full p-2 border rounded"
                          />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-gray-500">العنوان</label>
                          <input 
                              value={editingTask.title} 
                              onChange={(e) => setEditingTask({...editingTask, title: e.target.value})}
                              className="w-full p-2 border rounded"
                          />
                      </div>
                      <div className="flex gap-2 justify-end">
                          <Button onClick={() => setEditingTask(null)} variant="secondary">إلغاء</Button>
                          <Button onClick={saveEdit}>حفظ التعديلات</Button>
                      </div>
                  </div>
              </Card>
          </div>
      )}

      {loading ? <LoadingSpinner /> : (
          <div className="space-y-4">
              {tasks.map((task) => (
                  <Card key={task.id} className={`p-4 border-l-8 transition-all relative group ${getStatusColor(task.status)} dark:bg-white/5`}>
                      
                      {/* Action Buttons (Edit/Delete) - Top Left */}
                      <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEdit(task)} className="p-1.5 bg-white/50 hover:bg-white rounded-lg text-gray-600 hover:text-blue-600 shadow-sm transition-colors" title="تعديل">
                              ✏️
                          </button>
                          <button onClick={() => handleDeleteTask(task.id)} className="p-1.5 bg-white/50 hover:bg-white rounded-lg text-gray-600 hover:text-red-600 shadow-sm transition-colors" title="حذف">
                              🗑️
                          </button>
                      </div>

                      <div className="flex flex-col md:flex-row justify-between gap-4">
                          {/* Time & Title */}
                          <div className="flex-1 pr-2">
                              <span className="block text-xs font-black opacity-60 mb-1">{task.time_slot}</span>
                              <h3 className={`text-lg font-bold ${task.status === 'completed' ? 'line-through opacity-70' : ''}`}>
                                  {task.title}
                              </h3>
                              {/* Notes Input */}
                              <textarea 
                                  placeholder="ملاحظات..."
                                  className="w-full mt-2 bg-white/50 dark:bg-black/20 text-sm p-2 rounded border border-transparent focus:border-gray-300 outline-none resize-none"
                                  rows={1}
                                  value={task.notes || ''}
                                  onChange={(e) => handleNotesChange(task, e.target.value)}
                              />
                          </div>

                          {/* Actions */}
                          <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
                              {task.status === 'pending' && (
                                  <Button onClick={() => handleStatusChange(task, 'in_progress')} size="sm" className="bg-blue-600 text-white">ابدأ الآن</Button>
                              )}
                              {task.status === 'in_progress' && (
                                  <Button onClick={() => handleStatusChange(task, 'completed')} size="sm" className="bg-green-600 text-white animate-bounce-short">تم الإنجاز ✅</Button>
                              )}
                              {task.status !== 'completed' && task.status !== 'incomplete' && (
                                  <button 
                                    onClick={() => handleStatusChange(task, 'incomplete')}
                                    className="text-xs text-red-500 hover:underline px-2"
                                  >
                                      تحديد كـ لم تكتمل ✕
                                  </button>
                              )}
                              {task.status === 'completed' && <span className="text-green-700 font-bold text-sm">تمت ✅</span>}
                              {task.status === 'incomplete' && (
                                  <div className="flex items-center gap-2">
                                      <span className="text-red-700 font-bold text-sm">لم تكتمل ⛔</span>
                                      <button onClick={() => handleStatusChange(task, 'pending')} className="text-[10px] underline">إعادة</button>
                                  </div>
                              )}
                          </div>
                      </div>
                  </Card>
              ))}

              {/* Add Custom Task */}
              {isAdding ? (
                  <Card className="bg-gray-50 border border-dashed border-gray-300">
                      <div className="flex flex-col md:flex-row gap-2">
                          <input 
                            placeholder="وقت المهمة (مثلاً 05:00 - 06:00)" 
                            className="p-2 rounded border w-full md:w-1/4"
                            value={newTime}
                            onChange={e => setNewTime(e.target.value)}
                          />
                          <input 
                            placeholder="عنوان المهمة" 
                            className="p-2 rounded border w-full md:w-1/2"
                            value={newTitle}
                            onChange={e => setNewTitle(e.target.value)}
                            autoFocus
                          />
                          <div className="flex gap-2 w-full md:w-auto">
                              <Button onClick={handleAddCustomTask} className="flex-1">حفظ</Button>
                              <Button onClick={() => setIsAdding(false)} variant="secondary" className="flex-1">إلغاء</Button>
                          </div>
                      </div>
                  </Card>
              ) : (
                  <button 
                    onClick={() => setIsAdding(true)}
                    className="w-full py-4 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 font-bold hover:bg-gray-50 hover:border-indigo-300 hover:text-indigo-600 transition-all"
                  >
                      + إضافة مهمة خاصة
                  </button>
              )}
          </div>
      )}
    </div>
  );
};

export default ManagerTasksPage;