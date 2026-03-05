import React, { useState } from 'react';
import { Employee, PayrollBreakdown } from '../../types';
import Button from '../common/Button';
import { DataService } from '../../services/dataService';

interface PerformanceEditModalProps {
    employee: Employee;
    month: number;
    year: number;
    initialData: PayrollBreakdown;
    onClose: () => void;
    onSave: () => void;
}

const PerformanceEditModal: React.FC<PerformanceEditModalProps> = ({ employee, month, year, initialData, onClose, onSave }) => {
    const [commitmentScore, setCommitmentScore] = useState(initialData.commitmentScore || 0);
    const [isNeedsImprovement, setIsNeedsImprovement] = useState(initialData.isNeedsImprovement || false);
    const [improvementNote, setImprovementNote] = useState(initialData.improvementNote || '');
    const [recommendations, setRecommendations] = useState(initialData.recommendations || '');
    const [reportNotes, setReportNotes] = useState(initialData.reportNotes || '');
    const [isExcluded, setIsExcluded] = useState(initialData.isExcludedFromTopPerformers || false);
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        setLoading(true);
        try {
            await DataService.updatePerformanceMetrics(employee.id, month, year, {
                commitment_score: commitmentScore,
                is_needs_improvement: isNeedsImprovement,
                improvement_note: improvementNote,
                recommendations: recommendations,
                report_notes: reportNotes,
                is_excluded_from_top_performers: isExcluded
            });
            onSave();
            onClose();
        } catch (error) {
            console.error(error);
            alert('Failed to save');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md my-8">
                <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">تقييم الأداء: {employee.name}</h3>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">معدل الالتزام بالوقت (0-100)</label>
                        <input 
                            type="number" 
                            value={commitmentScore} 
                            onChange={(e) => setCommitmentScore(Number(e.target.value))}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            min="0" max="100"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">التوصيات (Recommendations)</label>
                        <textarea 
                            value={recommendations} 
                            onChange={(e) => setRecommendations(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            rows={3}
                            placeholder="توصيات لتطوير الموظف..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ملاحظات التقرير (Notes)</label>
                        <textarea 
                            value={reportNotes} 
                            onChange={(e) => setReportNotes(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            rows={3}
                            placeholder="ملاحظات إضافية للتقرير..."
                        />
                    </div>

                    <div className="flex items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                        <input 
                            id="exclude-top" 
                            type="checkbox" 
                            checked={isExcluded} 
                            onChange={(e) => setIsExcluded(e.target.checked)}
                            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                        />
                        <label htmlFor="exclude-top" className="mr-2 block text-sm text-gray-900 dark:text-gray-300">
                            استبعاد من قائمة "الأعلى أداءً" (Exclude from Top Performers)
                        </label>
                    </div>

                    <div className="flex items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                        <input 
                            id="needs-improvement" 
                            type="checkbox" 
                            checked={isNeedsImprovement} 
                            onChange={(e) => setIsNeedsImprovement(e.target.checked)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor="needs-improvement" className="mr-2 block text-sm text-gray-900 dark:text-gray-300">
                            يحتاج لتحسين (Needs Improvement)
                        </label>
                    </div>

                    {isNeedsImprovement && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ملاحظات التحسين</label>
                            <textarea 
                                value={improvementNote} 
                                onChange={(e) => setImprovementNote(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                rows={2}
                            />
                        </div>
                    )}
                </div>

                <div className="mt-6 flex justify-end gap-2">
                    <Button variant="secondary" onClick={onClose}>إلغاء</Button>
                    <Button variant="primary" onClick={handleSave} disabled={loading}>
                        {loading ? 'جاري الحفظ...' : 'حفظ'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default PerformanceEditModal;
