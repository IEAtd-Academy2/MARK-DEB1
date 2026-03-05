
import React, { useState, useEffect } from 'react';
import { Task, TaskColumn, Employee, ColumnPermission } from '../../types';
import { DataService } from '../../services/dataService';
import TaskCard from './TaskCard';
import LoadingSpinner from '../common/LoadingSpinner';
import Button from '../common/Button';
import TaskForm from '../forms/TaskForm'; 

interface KanbanBoardProps {
  isAdmin: boolean;
  employeeId?: string;
}

const COLUMN_COLORS = [
    'border-t-blue-500',
    'border-t-yellow-500',
    'border-t-green-500',
    'border-t-purple-500',
    'border-t-pink-500',
    'border-t-indigo-500'
];

const KanbanBoard: React.FC<KanbanBoardProps> = ({ isAdmin, employeeId }) => {
  const [columns, setColumns] = useState<TaskColumn[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]); 
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [userAverage, setUserAverage] = useState(0);

  // New Column State
  const [newColTitle, setNewColTitle] = useState('');
  const [showAddCol, setShowAddCol] = useState(false);
  
  // Task Form State
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedColumnId, setSelectedColumnId] = useState<string | undefined>(undefined);

  const fetchData = async () => {
      try {
          const [cols, allTasks, allEmployees] = await Promise.all([
              DataService.getTaskColumns(),
              isAdmin ? DataService.getAllTasks() : DataService.getEmployeeTasks(employeeId!),
              DataService.getAllEmployees()
          ]);
          setColumns(cols);
          setTasks(allTasks);
          setEmployees(allEmployees);
          
          if (employeeId) {
              const avg = await DataService.getEmployeeAverageTaskTime(employeeId);
              setUserAverage(avg);
              const me = allEmployees.find(e => e.id === employeeId);
              setCurrentUser(me || null);
          }
      } catch (e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => { fetchData(); }, [isAdmin, employeeId]);

  const handleTaskChange = async (taskId: string, updates: { column_id?: string, assigned_to?: string }) => {
      const newTasks = [...tasks];
      const taskIndex = newTasks.findIndex(t => t.id === taskId);
      if (taskIndex > -1) {
          if (updates.column_id) newTasks[taskIndex].column_id = updates.column_id;
          if (updates.assigned_to) newTasks[taskIndex].assigned_to = updates.assigned_to;
          
          setTasks(newTasks);
          await DataService.updateTask({ id: taskId, ...updates });
          fetchData(); 
      }
  };

  const handleAddColumn = async () => {
      if (!newColTitle.trim()) return;
      await DataService.createTaskColumn(newColTitle);
      setNewColTitle('');
      setShowAddCol(false);
      fetchData();
  };

  const handleDeleteColumn = async (id: string) => {
      if(!window.confirm("حذف العمود؟ سيتم حذف المهام المرتبطة.")) return;
      await DataService.deleteTaskColumn(id);
      fetchData();
  };

  const handleDeleteTask = async (taskId: string) => {
      if (!window.confirm("هل أنت متأكد من حذف هذه المهمة نهائياً؟")) return;
      try {
          await DataService.deleteTask(taskId);
          setTasks(prev => prev.filter(t => t.id !== taskId));
      } catch (e: any) {
          alert("فشل الحذف: " + e.message);
      }
  };

  const handleTaskSubmit = async (task: any) => {
      if (task.id) await DataService.updateTask(task);
      else await DataService.addTask(task);
      
      setShowTaskForm(false);
      setSelectedColumnId(undefined);
      fetchData();
  };

  const openTaskForm = (colId?: string) => {
      setSelectedColumnId(colId);
      setShowTaskForm(true);
  };

  // Determine Permission Logic
  const getColumnAccess = (colId: string): ColumnPermission => {
      if (isAdmin) return 'edit';
      if (!currentUser?.column_permissions) return 'edit'; // Default to edit if not set
      return currentUser.column_permissions[colId] || 'edit'; // Default to edit if specific column not set
  };

  if (loading) return <LoadingSpinner />;

  // Filter columns based on visibility
  const visibleColumns = columns.filter(col => {
      const access = getColumnAccess(col.id);
      return access !== 'hidden';
  });

  return (
    <div className="h-full flex flex-col">
        {/* Header - Realigned for RTL */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black text-gray-800 dark:text-white">📋 لوحة المهام</h2>
                <div className="h-6 w-[1px] bg-gray-300 dark:bg-gray-700 mx-2 hidden md:block"></div>
                {isAdmin && (
                    <Button onClick={() => openTaskForm()} size="sm" className="bg-indigo-600 text-white shadow-md hover:scale-105 transition-transform flex items-center gap-1 rounded-xl">
                        <span>➕</span> <span className="hidden sm:inline">إضافة مهمة</span>
                    </Button>
                )}
            </div>

            {isAdmin && (
                <div className="flex gap-2 w-full md:w-auto justify-end">
                    {showAddCol ? (
                        <div className="flex gap-2 bg-white dark:bg-slate-800 p-1 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 animate-in fade-in slide-in-from-left-2">
                            <input autoFocus value={newColTitle} onChange={e => setNewColTitle(e.target.value)} placeholder="اسم العمود" className="px-2 py-1 text-sm outline-none bg-transparent w-32 text-gray-800 dark:text-white placeholder-gray-400" />
                            <button onClick={handleAddColumn} className="text-green-600 font-bold px-2 hover:bg-green-50 dark:hover:bg-green-900/20 rounded">✓</button>
                            <button onClick={() => setShowAddCol(false)} className="text-red-500 font-bold px-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">✕</button>
                        </div>
                    ) : (
                        <Button onClick={() => setShowAddCol(true)} size="sm" variant="secondary" className="rounded-xl">+ عمود جديد</Button>
                    )}
                </div>
            )}
        </div>

        <div className="flex gap-6 overflow-x-auto pb-6 h-full px-2">
            {visibleColumns.map((col, idx) => {
                const colTasks = tasks.filter(t => t.column_id === col.id || (!t.column_id && col.order_index === 0));
                const colorClass = COLUMN_COLORS[idx % COLUMN_COLORS.length];
                const access = getColumnAccess(col.id);
                const canEdit = access === 'edit';

                return (
                    <div key={col.id} className={`min-w-[360px] w-[360px] flex flex-col bg-gray-50 dark:bg-slate-900/40 rounded-3xl border-x border-b border-gray-200 dark:border-slate-800/50 border-t-[6px] ${colorClass} h-fit max-h-[85vh] shadow-sm flex-shrink-0 relative group`}>
                        
                        <div className="p-5 flex justify-between items-center border-b border-gray-200 dark:border-slate-800/50 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
                            <div className="flex items-center gap-2">
                                <h3 className="font-black text-lg text-gray-800 dark:text-gray-200">{col.title}</h3>
                                <span className="bg-white dark:bg-slate-700/50 px-2 py-0.5 rounded-md text-[10px] font-bold text-gray-500 dark:text-gray-400 shadow-sm border border-gray-100 dark:border-transparent">{colTasks.length}</span>
                            </div>
                            
                            {/* Safer Delete Position */}
                            {isAdmin && (
                                <div className="relative">
                                    <button 
                                        onClick={() => handleDeleteColumn(col.id)} 
                                        className="text-gray-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                        title="حذف العمود"
                                    >
                                        🗑
                                    </button>
                                </div>
                            )}
                        </div>
                        
                        <div className="p-4 flex-1 overflow-y-auto min-h-[150px]">
                            {colTasks.map((task, index) => (
                                <TaskCard 
                                    key={task.id} 
                                    task={task} 
                                    index={index} 
                                    isAdmin={isAdmin}
                                    userAverageTime={userAverage}
                                    allColumns={columns}
                                    allEmployees={employees} 
                                    onTaskChange={canEdit ? handleTaskChange : () => alert('ليس لديك صلاحية نقل المهام من هذا العمود')}
                                    onDelete={canEdit ? handleDeleteTask : undefined}
                                    onUpdate={fetchData}
                                />
                            ))}
                            
                            {/* Interactive Empty State - Only if Edit Access */}
                            {canEdit && (
                                <button 
                                    onClick={() => openTaskForm(col.id)}
                                    className="w-full py-8 border-2 border-dashed border-gray-300 dark:border-slate-700/50 rounded-2xl flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 hover:border-indigo-400 dark:hover:border-indigo-500 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all group/btn"
                                >
                                    <span className="text-2xl mb-1 group-hover/btn:scale-110 transition-transform">➕</span>
                                    <span className="text-xs font-bold">إضافة مهمة هنا</span>
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>

        {showTaskForm && (
            <TaskForm 
                employeeId={employeeId || ''} 
                employees={employees} 
                onClose={() => { setShowTaskForm(false); setSelectedColumnId(undefined); }} 
                onSubmit={handleTaskSubmit} 
                isModal={true} 
                initialColumnId={selectedColumnId} // Pass context
            />
        )}
    </div>
  );
};

export default KanbanBoard;
