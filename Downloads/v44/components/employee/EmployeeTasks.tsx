
import React from 'react';
import Card from '../common/Card';
import { DataService } from '../../services/dataService';
import { EmployeeTaskDisplay, TaskStatus, Department, Task } from '../../types';
import Button from '../common/Button';
import { TASK_STATUS_AR_MAP, DEPARTMENT_AR_MAP } from '../../constants';

interface EmployeeTasksProps {
  employeeId: string;
  activeTasks: EmployeeTaskDisplay[]; // Data passed as prop
  onAddTask: () => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onTaskUpdate: () => void; // This will trigger parent refresh
  // Fix: Added isReadOnly prop
  isReadOnly?: boolean;
}

const EmployeeTasks: React.FC<EmployeeTasksProps> = ({
  employeeId,
  activeTasks,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onTaskUpdate,
  isReadOnly = false
}) => {
  const handleUpdateTaskStatus = async (taskId: string, status: TaskStatus) => {
    try {
      await DataService.updateTaskStatus(taskId, status);
      onTaskUpdate(); // Notify parent to refresh employee details
    } catch (err) {
      console.error("فشل تحديث حالة المهمة:", err);
      // Optionally set an error state here to display in the component
    }
  };

  const getDeadlineColor = (task: EmployeeTaskDisplay) => {
    if (task.status === TaskStatus.Done) {
      return task.isLate ? 'text-red-600' : 'text-green-600';
    }
    const now = new Date();
    const deadline = new Date(task.deadline);
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'text-red-500'; // Overdue
    if (diffDays <= 2) return 'text-orange-500'; // Approaching deadline
    return 'text-gray-600'; // Plenty of time
  };


  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-700">المهام النشطة</h3>
        {/* Fix: Conditionally render management actions */}
        {!isReadOnly && (
          <Button onClick={onAddTask} size="sm">إضافة مهمة جديدة</Button>
        )}
      </div>
      {activeTasks.length === 0 ? (
        <p className="text-gray-600 text-center py-4">لا توجد مهام مخصصة لهذا الموظف.</p>
      ) : (
        <div className="space-y-4 max-h-80 overflow-y-auto">
          {activeTasks.map(task => (
            <div key={task.id} className="p-3 border rounded-lg bg-gray-50">
              <h4 className="font-semibold text-gray-800">{task.title}</h4>
              <p className="text-sm text-gray-600 mb-1">{task.description}</p>
              <div className="flex items-center justify-between text-xs mt-2">
                <div>
                  <span className={`font-medium ${getDeadlineColor(task)}`}>
                    الموعد النهائي: {task.deadline.toLocaleDateString()}
                    {task.status === TaskStatus.Done && (task.completion_date &&
                      ` (تم الإنجاز: ${task.completion_date.toLocaleDateString()}${task.isLate ? ' - متأخر' : ' - في الوقت المحدد'})`
                    )}
                  </span>
                  <p className="text-gray-500 text-xs">القسم المصدر: {DEPARTMENT_AR_MAP[task.source_dept]}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-white text-xs ${
                  task.status === TaskStatus.Done ? 'bg-green-500' : 'bg-yellow-500'
                }`}>
                  {TASK_STATUS_AR_MAP[task.status]}
                </span>
              </div>
              {/* Fix: Conditionally render management actions */}
              {!isReadOnly && (
                <div className="mt-3 flex gap-2 flex-wrap">
                  {task.status === TaskStatus.Pending && (
                    <Button
                      onClick={() => handleUpdateTaskStatus(task.id, TaskStatus.Done)}
                      size="sm"
                      variant="primary"
                    >
                      تحديد كمكتملة
                    </Button>
                  )}
                  <Button onClick={() => onEditTask(task)} variant="secondary" size="sm">تعديل</Button>
                  <Button onClick={() => onDeleteTask(task.id)} variant="danger" size="sm">حذف</Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default EmployeeTasks;