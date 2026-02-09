
import React, { useEffect } from 'react';
import { AnalysisQuarter, AnalysisRowOrganic, AnalysisRowPaid } from '../../types';

interface AnalysisTableProps {
    data: AnalysisQuarter[];
    isEditing: boolean;
    onDataChange: (newData: AnalysisQuarter[]) => void;
}

const DEFAULT_ORGANIC_PLATFORMS = ['انستقرام', 'تويتر', 'سناب شات', 'تيك توك', 'لينكد إن', 'اكس'];
const DEFAULT_PAID_PLATFORMS = ['جوجل', 'انستقرام', 'تيك توك', 'فيسبوك'];

const AnalysisTable: React.FC<AnalysisTableProps> = ({ data, isEditing, onDataChange }) => {

    useEffect(() => {
        if (!data || data.length === 0) {
            const initialData: AnalysisQuarter[] = [
                createQuarter('تحليلات الربع الأول من السنة'),
                createQuarter('تحليلات الربع الثاني من السنة'),
                createQuarter('تحليلات الربع الثالث من السنة'),
                createQuarter('تحليلات الربع الرابع من السنة'),
            ];
            onDataChange(initialData);
        }
    }, []);

    const createQuarter = (name: string): AnalysisQuarter => ({
        quarter_name: name,
        organic_data: DEFAULT_ORGANIC_PLATFORMS.map(p => ({
            platform: p, reach: '', impressions: '', interactions: '', shares: '', comments: '', video_views: '', post_clicks: ''
        })),
        paid_data: DEFAULT_PAID_PLATFORMS.map(p => ({
            platform: p, reach: '', impressions: '', clicks: '', results: '', cpc: '', cpr: '', cpm: ''
        }))
    });

    const handleOrganicChange = (qIndex: number, rIndex: number, field: keyof AnalysisRowOrganic, value: string) => {
        const newData = [...data];
        newData[qIndex].organic_data[rIndex][field] = value;
        onDataChange(newData);
    };

    const handlePaidChange = (qIndex: number, rIndex: number, field: keyof AnalysisRowPaid, value: string) => {
        const newData = [...data];
        newData[qIndex].paid_data[rIndex][field] = value;
        onDataChange(newData);
    };

    if (!data || data.length === 0) return null;

    return (
        <div className="space-y-8" dir="rtl">
            {data.map((quarter, qIdx) => (
                <div key={qIdx} className="border border-gray-400 rounded-lg overflow-hidden shadow-sm">
                    {/* Main Header */}
                    <div className="bg-[#1f4e5f] text-white font-bold text-center py-2 text-lg">
                        {quarter.quarter_name}
                    </div>

                    {/* Organic Section */}
                    <div className="bg-white text-center font-bold py-2 border-b border-gray-400">
                        المحتوى المجاني
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-xs text-center border-collapse border border-gray-400">
                            <thead>
                                <tr className="bg-[#1f4e5f] text-white">
                                    <th className="border border-white/30 p-2 w-32">المدة</th>
                                    <th className="border border-white/30 p-2">الوصول</th>
                                    <th className="border border-white/30 p-2">الظهور</th>
                                    <th className="border border-white/30 p-2">تفاعلات</th>
                                    <th className="border border-white/30 p-2">المشاركات</th>
                                    <th className="border border-white/30 p-2">التعليقات</th>
                                    <th className="border border-white/30 p-2">مشاهدات الفيديو</th>
                                    <th className="border border-white/30 p-2">نقررات المنشور</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white">
                                {quarter.organic_data.map((row, rIdx) => (
                                    <tr key={rIdx} className="border-b border-gray-300">
                                        <td className="border border-gray-300 p-2 font-bold bg-gray-50">{row.platform}</td>
                                        <td className="border border-gray-300 p-1">{renderInput(isEditing, row.reach, (v) => handleOrganicChange(qIdx, rIdx, 'reach', v))}</td>
                                        <td className="border border-gray-300 p-1">{renderInput(isEditing, row.impressions, (v) => handleOrganicChange(qIdx, rIdx, 'impressions', v))}</td>
                                        <td className="border border-gray-300 p-1">{renderInput(isEditing, row.interactions, (v) => handleOrganicChange(qIdx, rIdx, 'interactions', v))}</td>
                                        <td className="border border-gray-300 p-1">{renderInput(isEditing, row.shares, (v) => handleOrganicChange(qIdx, rIdx, 'shares', v))}</td>
                                        <td className="border border-gray-300 p-1">{renderInput(isEditing, row.comments, (v) => handleOrganicChange(qIdx, rIdx, 'comments', v))}</td>
                                        <td className="border border-gray-300 p-1">{renderInput(isEditing, row.video_views, (v) => handleOrganicChange(qIdx, rIdx, 'video_views', v))}</td>
                                        <td className="border border-gray-300 p-1">{renderInput(isEditing, row.post_clicks, (v) => handleOrganicChange(qIdx, rIdx, 'post_clicks', v))}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Paid Section Headers */}
                    <div className="overflow-x-auto mt-4">
                        <table className="min-w-full text-xs text-center border-collapse border border-gray-400">
                            <thead>
                                <tr className="bg-[#1f4e5f] text-white">
                                    <th className="border border-white/30 p-2 w-32">المنصة</th>
                                    <th className="border border-white/30 p-2">الوصول</th>
                                    <th className="border border-white/30 p-2">الظهور</th>
                                    <th className="border border-white/30 p-2">نقررات</th>
                                    <th className="border border-white/30 p-2">النتائج</th>
                                    <th className="border border-white/30 p-2">سعر النقررة</th>
                                    <th className="border border-white/30 p-2">سعر التحويل</th>
                                    <th className="border border-white/30 p-2">سعر الظهور</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white">
                                {quarter.paid_data.map((row, rIdx) => (
                                    <tr key={rIdx} className="border-b border-gray-300">
                                        <td className="border border-gray-300 p-2 font-bold bg-gray-50">{row.platform}</td>
                                        <td className="border border-gray-300 p-1">{renderInput(isEditing, row.reach, (v) => handlePaidChange(qIdx, rIdx, 'reach', v))}</td>
                                        <td className="border border-gray-300 p-1">{renderInput(isEditing, row.impressions, (v) => handlePaidChange(qIdx, rIdx, 'impressions', v))}</td>
                                        <td className="border border-gray-300 p-1">{renderInput(isEditing, row.clicks, (v) => handlePaidChange(qIdx, rIdx, 'clicks', v))}</td>
                                        <td className="border border-gray-300 p-1">{renderInput(isEditing, row.results, (v) => handlePaidChange(qIdx, rIdx, 'results', v))}</td>
                                        <td className="border border-gray-300 p-1">{renderInput(isEditing, row.cpc, (v) => handlePaidChange(qIdx, rIdx, 'cpc', v))}</td>
                                        <td className="border border-gray-300 p-1">{renderInput(isEditing, row.cpr, (v) => handlePaidChange(qIdx, rIdx, 'cpr', v))}</td>
                                        <td className="border border-gray-300 p-1">{renderInput(isEditing, row.cpm, (v) => handlePaidChange(qIdx, rIdx, 'cpm', v))}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}
        </div>
    );
};

const renderInput = (isEditing: boolean, value: string, onChange: (val: string) => void) => {
    if (isEditing) {
        return <input className="w-full text-center bg-transparent outline-none p-1" value={value} onChange={e => onChange(e.target.value)} />;
    }
    return <span>{value}</span>;
};

export default AnalysisTable;
