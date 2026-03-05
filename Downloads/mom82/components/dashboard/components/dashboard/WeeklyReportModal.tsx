import React, { useState, useEffect } from 'react';
import { DataService } from '../../services/dataService';
import Button from '../common/Button';
import { Employee } from '../../types';

interface WeeklyReportModalProps {
    employeeId?: string;
    onClose: () => void;
    onSave: () => void;
}

const WeeklyReportModal: React.FC<WeeklyReportModalProps> = ({ employeeId, onClose, onSave }) => {
    const [selectedEmployeeId, setSelectedEmployeeId] = useState(employeeId || '');
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [weekStart, setWeekStart] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!employeeId) {
            const fetchEmployees = async () => {
                const data = await DataService.getEmployees();
                setEmployees(data);
                if (data.length > 0) setSelectedEmployeeId(data[0].id);
            };
            fetchEmployees();
        }
    }, [employeeId]);

    const handleSave = async () => {
        if (!selectedEmployeeId || !weekStart || !content) return;
        setLoading(true);
        try {
            await DataService.createWeeklyReport({
                employee_id: selectedEmployeeId,
                week_start_date: weekStart,
                content: content
            });
            onSave();
            onClose();
        } catch (error) {
            console.error(error);
            alert('Failed to save report');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-ui-darkCard p-6 rounded-2xl shadow-xl w-full max-w-lg animate-in zoom-in-95">
                <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">إضافة تقرير أسبوعي</h3>
                <div className="space-y-4">
                    {!employeeId && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الموظف</label>
                            <select 
                                value={selectedEmployeeId}
                                onChange={e => setSelectedEmployeeId(e.target.value)}
                                className="w-full p-2 border rounded-lg dark:bg-black/20 dark:border-white/10"
                            >
                                {employees.map(emp => (
                                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تاريخ بداية الأسبوع</label>
                        <input 
                            type="date" 
                            value={weekStart}
                            onChange={e => setWeekStart(e.target.value)}
                            className="w-full p-2 border rounded-lg dark:bg-black/20 dark:border-white/10"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">محتوى التقرير</label>
                        <textarea 
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            className="w-full p-2 border rounded-lg dark:bg-black/20 dark:border-white/10 h-32"
                            placeholder="اكتب تفاصيل التقرير هنا..."
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <Button variant="secondary" onClick={onClose}>إلغاء</Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading ? 'جاري الحفظ...' : 'حفظ التقرير'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default WeeklyReportModal;
