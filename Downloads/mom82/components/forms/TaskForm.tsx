
import React, { useState, useEffect } from 'react';
import Button from '../common/Button';
import Card from '../common/Card';
import { Task, Department, Employee } from '../../types';
import { DataService } from '../../services/dataService';
import Alert from '../common/Alert';
import { DEPARTMENT_AR_MAP } from '../../constants';

interface TaskFormProps {
  employeeId?: string; // Made optional
  employees?: Employee[]; // List of employees for selection
  task?: Task | null;
  onClose: () => void;
  onSubmit: (task: Task | Omit<Task, 'id' | 'status'>) => Promise<void>;
  isModal?: boolean;
  initialColumnId?: string; // New Prop for Context
}

const TaskForm: React.FC<TaskFormProps> = ({ employeeId, employees, task, onClose, onSubmit, isModal = false, initialColumnId }) => {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [sourceDept, setSourceDept] = useState<Department>(task?.source_dept || Department.Operations);
  // Default datetime handling
  const defaultDate = task?.deadline ? new Date(task.deadline) : new Date();
  // Adjust to local ISO string for input[type="datetime-local"]
  const toLocalISO = (date: Date) => {
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };
  
  const [deadline, setDeadline] = useState(toLocalISO(defaultDate));
  const [isProblemSolving, setIsProblemSolving] = useState(task?.is_problem_solving || false);
  const [attachmentUrl, setAttachmentUrl] = useState(task?.attachment_url || '');
  const [notes, setNotes] = useState(task?.notes || '');
  
  // Assignee State
  const [assignedTo, setAssignedTo] = useState<string>(task?.assigned_to || employeeId || (employees?.[0]?.id || ''));
  
  const [formError, setFormError] = useState<string | null>(null);
  const [employeeName, setEmployeeName] = useState<string>('');
  const [loadingEmployee, setLoadingEmployee] = useState(false);

  useEffect(() => {
    // If we have a specific ID but no list, fetch the name
    const fetchEmployeeName = async () => {
      if (!employees && employeeId && employeeId.trim() !== '') {
        setLoadingEmployee(true);
        try {
          const employee = await DataService.getEmployee(employeeId);
          if (employee) {
            setEmployeeName(employee.name);
          }
        } catch (err: any) {
          console.error('Failed to fetch employee name:', err);
        } finally {
          setLoadingEmployee(false);
        }
      }
    };
    fetchEmployeeName();

    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setSourceDept(task.source_dept);
      setDeadline(toLocalISO(new Date(task.deadline)));
      setIsProblemSolving(task.is_problem_solving);
      setAssignedTo(task.assigned_to);
      setAttachmentUrl(task.attachment_url || '');
      setNotes(task.notes || '');
    }
  }, [task, employeeId, employees]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError('الرجاء إدخال عنوان المهمة.');
      return;
    }
    if (!assignedTo) {
        setFormError('الرجاء اختيار الموظف المسؤول.');
        return;
    }
    if (!deadline) {
      setFormError('الرجاء تحديد الموعد النهائي للمهمة.');
      return;
    }

    const taskData: any = {
      assigned_to: assignedTo,
      title,
      description,
      source_dept: sourceDept,
      deadline: new Date(deadline),
      is_problem_solving: isProblemSolving,
      attachment_url: attachmentUrl,
      notes: notes
    };

    if (initialColumnId && !task) {
        taskData.column_id = initialColumnId;
    }

    try {
        if (task) {
          await onSubmit({ ...task, ...taskData });
        } else {
          await onSubmit(taskData);
        }
        onClose();
    } catch (err: any) {
        setFormError("فشل حفظ المهمة: " + err.message);
    }
  };

  if (loadingEmployee) {
    return (
      <Card className="p-6">
        <p className="text-gray-600 dark:text-gray-400">جاري تحميل البيانات...</p>
      </Card>
    );
  }

  const inputClass = "mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm placeholder-gray-400 dark:placeholder-gray-500";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300";

  const FormContent = (
    <Card className="p-6 max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border-none shadow-none">
      <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
        {task ? 'تعديل المهمة' : 'إضافة مهمة جديدة'}
      </h3>
      {formError && <Alert type="error" message={formError} className="mb-4" onClose={() => setFormError(null)} />}
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Employee Selection Logic */}
        <div>
            <label className={labelClass}>الموظف المسؤول</label>
            {employees && employees.length > 0 ? (
                <select 
                    value={assignedTo} 
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className={inputClass}
                    required
                >
                    <option value="" disabled>اختر موظفاً</option>
                    {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                </select>
            ) : (
                <input 
                    type="text" 
                    value={employeeName || 'جاري التعيين...'} 
                    disabled 
                    className={`${inputClass} bg-gray-100 dark:bg-slate-800 text-gray-500`} 
                />
            )}
        </div>

        <div>
          <label htmlFor="title" className={labelClass}>
            عنوان المهمة
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
            required
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="sourceDept" className={labelClass}>
                القسم المصدر
              </label>
              <select
                id="sourceDept"
                value={sourceDept}
                onChange={(e) => setSourceDept(e.target.value as Department)}
                className={inputClass}
                required
              >
                {Object.values(Department).map((d) => (
                  <option key={d} value={d}>{DEPARTMENT_AR_MAP[d]}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="deadline" className={labelClass}>
                الموعد النهائي (وقت وتاريخ)
              </label>
              <input
                type="datetime-local"
                id="deadline"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className={`${inputClass} ltr`}
                style={{ direction: 'ltr' }}
                required
              />
            </div>
        </div>

        <div>
          <label htmlFor="description" className={labelClass}>
            الوصف (اختياري)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className={inputClass}
          ></textarea>
        </div>

        <div>
          <label htmlFor="attachmentUrl" className={labelClass}>
            رابط المرفقات (Drive/Docs/Link)
          </label>
          <input
            type="url"
            id="attachmentUrl"
            value={attachmentUrl}
            onChange={(e) => setAttachmentUrl(e.target.value)}
            placeholder="https://..."
            className={`${inputClass} ltr`}
            dir="ltr"
          />
        </div>

        <div>
          <label htmlFor="notes" className={labelClass}>
            ملاحظات إضافية
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className={inputClass}
            placeholder="ملاحظات هامة عند التنفيذ..."
          ></textarea>
        </div>

        <div className="flex items-center">
          <input
            id="isProblemSolving"
            name="isProblemSolving"
            type="checkbox"
            checked={isProblemSolving}
            onChange={(e) => setIsProblemSolving(e.target.checked)}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800"
          />
          <label htmlFor="isProblemSolving" className={`mr-2 ${labelClass}`}>
            هل تتضمن حل مشكلة؟
          </label>
        </div>
        <div className="flex justify-end space-x-3 rtl:space-x-reverse pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="submit" variant="primary">
            {task ? 'تحديث المهمة' : 'إضافة المهمة'}
          </Button>
        </div>
      </form>
    </Card>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 bg-gray-600/50 dark:bg-black/70 backdrop-blur-sm overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4">
        <div className="relative w-full max-w-lg mx-auto bg-white dark:bg-slate-900 rounded-xl shadow-2xl overflow-hidden">
          {FormContent}
        </div>
      </div>
    );
  }

  return FormContent;
};

export default TaskForm;
