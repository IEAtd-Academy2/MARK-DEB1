import React, { useState, useEffect } from 'react';
import { DataService } from '../../services/dataService';
import { Employee } from '../../types';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';

interface QuickActionModalProps {
    onClose: () => void;
    onSave: () => void;
}

type ActionType = 'deduction' | 'bonus' | 'kpi';

const QuickActionModal: React.FC<QuickActionModalProps> = ({ onClose, onSave }) => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
    const [actionType, setActionType] = useState<ActionType>('deduction');
    
    // Form States
    const [amount, setAmount] = useState(0);
    const [reason, setReason] = useState('');
    const [kpiName, setKpiName] = useState('');
    const [kpiTarget, setKpiTarget] = useState(0);
    const [kpiIncentive, setKpiIncentive] = useState(0);

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const data = await DataService.getEmployees();
                setEmployees(data);
                if (data.length > 0) setSelectedEmployeeId(data[0].id);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchEmployees();
    }, []);

    const handleSave = async () => {
        if (!selectedEmployeeId) return;
        const today = new Date();
        const month = today.getMonth() + 1;
        const year = today.getFullYear();

        try {
            if (actionType === 'deduction') {
                await DataService.addOrUpdateManualDeduction(selectedEmployeeId, month, year, amount, true, reason);
            } else if (actionType === 'bonus') {
                await DataService.addOrUpdateBonus(selectedEmployeeId, month, year, amount, true);
            } else if (actionType === 'kpi') {
                await DataService.createKPIConfig({
                    employee_id: selectedEmployeeId,
                    kpi_name: kpiName,
                    target_value: kpiTarget,
                    incentive_percentage: kpiIncentive,
                    applicable_month: month,
                    applicable_year: year,
                    status: 'Approved'
                });
            }
            onSave();
            onClose();
        } catch (error) {
            console.error(error);
            alert('Failed to perform action');
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-ui-darkCard p-6 rounded-2xl shadow-xl w-full max-w-lg animate-in zoom-in-95">
                <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">إجراء سريع</h3>
                
                <div className="space-y-4">
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

                    <div className="flex gap-2 bg-gray-100 dark:bg-black/20 p-1 rounded-lg">
                        <button 
                            onClick={() => setActionType('deduction')}
                            className={`flex-1 py-2 rounded-md text-sm font-bold transition-colors ${actionType === 'deduction' ? 'bg-red-500 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-white/5'}`}
                        >
                            خصم
                        </button>
                        <button 
                            onClick={() => setActionType('bonus')}
                            className={`flex-1 py-2 rounded-md text-sm font-bold transition-colors ${actionType === 'bonus' ? 'bg-green-500 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-white/5'}`}
                        >
                            حافز / إضافة
                        </button>
                        <button 
                            onClick={() => setActionType('kpi')}
                            className={`flex-1 py-2 rounded-md text-sm font-bold transition-colors ${actionType === 'kpi' ? 'bg-indigo-500 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-white/5'}`}
                        >
                            KPI جديد
                        </button>
                    </div>

                    {actionType === 'deduction' && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">قيمة الخصم</label>
                                <input 
                                    type="number" 
                                    value={amount}
                                    onChange={e => setAmount(Number(e.target.value))}
                                    className="w-full p-2 border rounded-lg dark:bg-black/20 dark:border-white/10"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">السبب</label>
                                <input 
                                    type="text" 
                                    value={reason}
                                    onChange={e => setReason(e.target.value)}
                                    className="w-full p-2 border rounded-lg dark:bg-black/20 dark:border-white/10"
                                />
                            </div>
                        </div>
                    )}

                    {actionType === 'bonus' && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">قيمة الحافز</label>
                                <input 
                                    type="number" 
                                    value={amount}
                                    onChange={e => setAmount(Number(e.target.value))}
                                    className="w-full p-2 border rounded-lg dark:bg-black/20 dark:border-white/10"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ملاحظات</label>
                                <input 
                                    type="text" 
                                    value={reason}
                                    onChange={e => setReason(e.target.value)}
                                    className="w-full p-2 border rounded-lg dark:bg-black/20 dark:border-white/10"
                                />
                            </div>
                        </div>
                    )}

                    {actionType === 'kpi' && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">اسم الـ KPI</label>
                                <input 
                                    type="text" 
                                    value={kpiName}
                                    onChange={e => setKpiName(e.target.value)}
                                    className="w-full p-2 border rounded-lg dark:bg-black/20 dark:border-white/10"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المستهدف</label>
                                    <input 
                                        type="number" 
                                        value={kpiTarget}
                                        onChange={e => setKpiTarget(Number(e.target.value))}
                                        className="w-full p-2 border rounded-lg dark:bg-black/20 dark:border-white/10"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نسبة الحافز (%)</label>
                                    <input 
                                        type="number" 
                                        value={kpiIncentive}
                                        onChange={e => setKpiIncentive(Number(e.target.value))}
                                        className="w-full p-2 border rounded-lg dark:bg-black/20 dark:border-white/10"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2 mt-6">
                    <Button variant="secondary" onClick={onClose}>إلغاء</Button>
                    <Button onClick={handleSave}>تنفيذ</Button>
                </div>
            </div>
        </div>
    );
};

export default QuickActionModal;
