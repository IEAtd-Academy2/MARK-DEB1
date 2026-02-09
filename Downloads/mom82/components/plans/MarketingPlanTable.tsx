
import React from 'react';
import { PlanRow } from '../../types';

interface MarketingPlanTableProps {
    data: PlanRow[];
    isEditing: boolean;
    onDataChange: (newData: PlanRow[]) => void;
}

const MarketingPlanTable: React.FC<MarketingPlanTableProps> = ({ data, isEditing, onDataChange }) => {

    const handleRowChange = (index: number, field: string, subField: string | null, value: string) => {
        const newData = [...data];
        if (subField) {
            // @ts-ignore
            newData[index][field][subField] = value;
        } else {
            // @ts-ignore
            newData[index][field] = value;
        }
        onDataChange(newData);
    };

    const addRow = () => {
        onDataChange([...data, {
            goal: '',
            platforms: { snap_tiktok: '', insta_linkedin: '', youtube: '', fb_wa: '' },
            paid: { insta: '', fb: '', tiktok: '', youtube: '', google: '' }
        }]);
    };

    const deleteRow = (index: number) => {
        const newData = data.filter((_, i) => i !== index);
        onDataChange(newData);
    };

    return (
        <div className="overflow-x-auto border border-gray-400 rounded-lg shadow-sm" dir="rtl">
            <table className="min-w-full text-xs text-center border-collapse border border-gray-400">
                <thead>
                    {/* Level 1 Headers */}
                    <tr className="bg-[#1f5f5b] text-white">
                        <th className="border border-white/20 p-2 w-32" rowSpan={2}>الهدف</th>
                        <th className="border border-white/20 p-2" colSpan={4}>المنصات</th>
                        <th className="border border-white/20 p-2" colSpan={5}>الممول</th>
                        {isEditing && <th className="border border-white/20 p-2 w-10" rowSpan={2}>🗑️</th>}
                    </tr>
                    {/* Level 2 Headers */}
                    <tr className="bg-[#2a7a75] text-white text-[10px]">
                        {/* Platforms */}
                        <th className="border border-white/20 p-2">سناب شات / تيك توك</th>
                        <th className="border border-white/20 p-2">انستقرام / اكس / لينكد إن</th>
                        <th className="border border-white/20 p-2">يوتيوب</th>
                        <th className="border border-white/20 p-2">فيسبوك / واتس اب / تيليجرام / جوجل (ويب سايت)</th>
                        
                        {/* Paid */}
                        <th className="border border-white/20 p-2 bg-[#b59e66] text-black">انستقرام</th>
                        <th className="border border-white/20 p-2 bg-[#b59e66] text-black">فيسبوك</th>
                        <th className="border border-white/20 p-2 bg-[#b59e66] text-black">تيك توك</th>
                        <th className="border border-white/20 p-2 bg-[#b59e66] text-black">يوتيوب</th>
                        <th className="border border-white/20 p-2 bg-[#b59e66] text-black">جوجل (السايت)</th>
                    </tr>
                </thead>
                <tbody className="bg-white">
                    {data.map((row, idx) => (
                        <tr key={idx} className="border-b border-gray-300 hover:bg-gray-50 transition-colors">
                            {/* Goal */}
                            <td className="border border-gray-300 bg-gray-100 p-2 align-middle font-bold text-gray-700">
                                {isEditing ? <input className="w-full bg-transparent text-center font-bold outline-none" value={row.goal} onChange={e => handleRowChange(idx, 'goal', null, e.target.value)} /> : row.goal}
                            </td>
                            
                            {/* Platforms */}
                            <td className="border border-gray-300 p-2 bg-teal-50/30">
                                {isEditing ? <textarea className="w-full h-full bg-transparent text-center text-[10px] resize-none outline-none" rows={3} value={row.platforms.snap_tiktok} onChange={e => handleRowChange(idx, 'platforms', 'snap_tiktok', e.target.value)} /> : <div className="whitespace-pre-wrap">{row.platforms.snap_tiktok}</div>}
                            </td>
                            <td className="border border-gray-300 p-2 bg-teal-50/30">
                                {isEditing ? <textarea className="w-full h-full bg-transparent text-center text-[10px] resize-none outline-none" rows={3} value={row.platforms.insta_linkedin} onChange={e => handleRowChange(idx, 'platforms', 'insta_linkedin', e.target.value)} /> : <div className="whitespace-pre-wrap">{row.platforms.insta_linkedin}</div>}
                            </td>
                            <td className="border border-gray-300 p-2 bg-teal-50/30">
                                {isEditing ? <textarea className="w-full h-full bg-transparent text-center text-[10px] resize-none outline-none" rows={3} value={row.platforms.youtube} onChange={e => handleRowChange(idx, 'platforms', 'youtube', e.target.value)} /> : <div className="whitespace-pre-wrap">{row.platforms.youtube}</div>}
                            </td>
                            <td className="border border-gray-300 p-2 bg-teal-50/30">
                                {isEditing ? <textarea className="w-full h-full bg-transparent text-center text-[10px] resize-none outline-none" rows={3} value={row.platforms.fb_wa} onChange={e => handleRowChange(idx, 'platforms', 'fb_wa', e.target.value)} /> : <div className="whitespace-pre-wrap">{row.platforms.fb_wa}</div>}
                            </td>

                            {/* Paid */}
                            <td className="border border-gray-300 p-1 bg-yellow-50/20 text-[10px]">
                                {isEditing ? <textarea className="w-full h-full bg-transparent text-center resize-none outline-none" rows={3} value={row.paid.insta} onChange={e => handleRowChange(idx, 'paid', 'insta', e.target.value)} /> : <div className="whitespace-pre-wrap">{row.paid.insta}</div>}
                            </td>
                            <td className="border border-gray-300 p-1 bg-yellow-50/20 text-[10px]">
                                {isEditing ? <textarea className="w-full h-full bg-transparent text-center resize-none outline-none" rows={3} value={row.paid.fb} onChange={e => handleRowChange(idx, 'paid', 'fb', e.target.value)} /> : <div className="whitespace-pre-wrap">{row.paid.fb}</div>}
                            </td>
                            <td className="border border-gray-300 p-1 bg-yellow-50/20 text-[10px]">
                                {isEditing ? <textarea className="w-full h-full bg-transparent text-center resize-none outline-none" rows={3} value={row.paid.tiktok} onChange={e => handleRowChange(idx, 'paid', 'tiktok', e.target.value)} /> : <div className="whitespace-pre-wrap">{row.paid.tiktok}</div>}
                            </td>
                            <td className="border border-gray-300 p-1 bg-yellow-50/20 text-[10px]">
                                {isEditing ? <textarea className="w-full h-full bg-transparent text-center resize-none outline-none" rows={3} value={row.paid.youtube} onChange={e => handleRowChange(idx, 'paid', 'youtube', e.target.value)} /> : <div className="whitespace-pre-wrap">{row.paid.youtube}</div>}
                            </td>
                            <td className="border border-gray-300 p-1 bg-yellow-50/20 text-[10px]">
                                {isEditing ? <textarea className="w-full h-full bg-transparent text-center resize-none outline-none" rows={3} value={row.paid.google} onChange={e => handleRowChange(idx, 'paid', 'google', e.target.value)} /> : <div className="whitespace-pre-wrap">{row.paid.google}</div>}
                            </td>

                            {isEditing && (
                                <td className="border border-gray-300 p-1 bg-red-50">
                                    <button onClick={() => deleteRow(idx)} className="text-red-500 hover:text-red-700 font-bold">✕</button>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
            {isEditing && (
                <div className="p-3 bg-gray-50 border-t border-gray-300 text-center">
                    <button onClick={addRow} className="text-indigo-600 font-bold text-sm hover:text-indigo-800 transition-colors">+ إضافة صف جديد</button>
                </div>
            )}
        </div>
    );
};

export default MarketingPlanTable;
