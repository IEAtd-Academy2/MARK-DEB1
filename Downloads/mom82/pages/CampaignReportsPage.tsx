import React, { useState, useEffect } from 'react';
import { CampaignReport } from '../types';
import { DataService } from '../services/dataService';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import LoadingSpinner from '../components/common/LoadingSpinner';

const CampaignReportsPage: React.FC = () => {
    const [reports, setReports] = useState<CampaignReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newReport, setNewReport] = useState<Partial<CampaignReport>>({
        campaign_name: '',
        report_link: '',
        duration_months: 0,
        duration_years: 0
    });

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const data = await DataService.getCampaignReports();
            setReports(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!newReport.campaign_name || !newReport.report_link) return;
        try {
            await DataService.createCampaignReport(newReport);
            setShowModal(false);
            setNewReport({ campaign_name: '', report_link: '', duration_months: 0, duration_years: 0 });
            fetchReports();
        } catch (error) {
            console.error(error);
            alert('Failed to save report');
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">تقارير الحملات</h1>
                    <p className="text-gray-500">أرشيف شامل لجميع تقارير الحملات الإعلانية</p>
                </div>
                <Button onClick={() => setShowModal(true)}>➕ إضافة تقرير جديد</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reports.map(report => (
                    <Card key={report.id} className="hover:shadow-lg transition-shadow border-t-4 border-indigo-500">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{report.campaign_name}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                            <span>⏱️ المدة:</span>
                            {report.duration_years > 0 && <span>{report.duration_years} سنة</span>}
                            {report.duration_months > 0 && <span>{report.duration_months} شهر</span>}
                        </div>
                        <a 
                            href={report.report_link} 
                            target="_blank" 
                            rel="noreferrer"
                            className="block w-full text-center py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors font-bold"
                        >
                            🔗 فتح التقرير
                        </a>
                        <p className="text-xs text-gray-400 mt-4 text-left" dir="ltr">
                            {new Date(report.created_at!).toLocaleDateString()}
                        </p>
                    </Card>
                ))}
                {reports.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        لا توجد تقارير حملات مسجلة حتى الآن.
                    </div>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-ui-darkCard p-6 rounded-2xl shadow-xl w-full max-w-md animate-in zoom-in-95">
                        <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">إضافة تقرير حملة</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">اسم الحملة</label>
                                <input 
                                    type="text" 
                                    value={newReport.campaign_name}
                                    onChange={e => setNewReport({...newReport, campaign_name: e.target.value})}
                                    className="w-full p-2 border rounded-lg dark:bg-black/20 dark:border-white/10"
                                    placeholder="مثال: حملة رمضان 2024"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">رابط التقرير</label>
                                <input 
                                    type="url" 
                                    value={newReport.report_link}
                                    onChange={e => setNewReport({...newReport, report_link: e.target.value})}
                                    className="w-full p-2 border rounded-lg dark:bg-black/20 dark:border-white/10"
                                    placeholder="https://..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المدة (شهور)</label>
                                    <input 
                                        type="number" 
                                        value={newReport.duration_months}
                                        onChange={e => setNewReport({...newReport, duration_months: Number(e.target.value)})}
                                        className="w-full p-2 border rounded-lg dark:bg-black/20 dark:border-white/10"
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المدة (سنين)</label>
                                    <input 
                                        type="number" 
                                        value={newReport.duration_years}
                                        onChange={e => setNewReport({...newReport, duration_years: Number(e.target.value)})}
                                        className="w-full p-2 border rounded-lg dark:bg-black/20 dark:border-white/10"
                                        min="0"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <Button variant="secondary" onClick={() => setShowModal(false)}>إلغاء</Button>
                            <Button onClick={handleSave}>حفظ التقرير</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CampaignReportsPage;
