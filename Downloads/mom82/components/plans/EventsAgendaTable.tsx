
import React from 'react';
import { EventsAgendaRow } from '../../types';

interface EventsAgendaTableProps {
    data: EventsAgendaRow[];
    isEditing: boolean;
    onDataChange: (newData: EventsAgendaRow[]) => void;
}

const EventsAgendaTable: React.FC<EventsAgendaTableProps> = ({ data, isEditing, onDataChange }) => {

    const handleRowChange = (index: number, field: keyof EventsAgendaRow, value: string) => {
        const newData = [...data];
        // @ts-ignore
        newData[index][field] = value;
        onDataChange(newData);
    };

    const addRow = () => {
        onDataChange([...data, {
            occasion: '',
            date_gregorian: '',
            date_hijri: '',
            content_type: '',
            deadline: ''
        }]);
    };

    const deleteRow = (index: number) => {
        const newData = data.filter((_, i) => i !== index);
        onDataChange(newData);
    };

    return (
        <div className="overflow-x-auto border border-gray-400 rounded-lg shadow-sm" dir="rtl">
            <table className="min-w-full text-sm text-right border-collapse border border-gray-400">
                <thead>
                    <tr className="bg-[#1f4e5f] text-white font-bold text-center">
                        <th className="border border-white/30 p-3 w-64">المناسبة</th>
                        <th className="border border-white/30 p-3 w-48">التاريخ ميلادي</th>
                        <th className="border border-white/30 p-3 w-48">التاريخ هجري</th>
                        <th className="border border-white/30 p-3 flex-1">نوع المحتوى</th>
                        <th className="border border-white/30 p-3 w-48">اخر موعد للتسليم</th>
                        {isEditing && <th className="border border-white/30 p-3 w-10">حذف</th>}
                    </tr>
                </thead>
                <tbody className="bg-white">
                    {data.map((row, idx) => (
                        <tr key={idx} className="border-b border-gray-300 hover:bg-gray-50 transition-colors">
                            {/* Occasion */}
                            <td className="border border-gray-300 p-2 font-bold text-gray-800">
                                {isEditing ? (
                                    <input 
                                        className="w-full bg-transparent outline-none p-1" 
                                        value={row.occasion} 
                                        onChange={e => handleRowChange(idx, 'occasion', e.target.value)} 
                                        placeholder="اسم المناسبة"
                                    />
                                ) : row.occasion}
                            </td>

                            {/* Gregorian Date */}
                            <td className="border border-gray-300 p-2 text-center font-bold">
                                {isEditing ? (
                                    <input 
                                        type="text"
                                        className="w-full bg-transparent text-center outline-none p-1" 
                                        value={row.date_gregorian} 
                                        onChange={e => handleRowChange(idx, 'date_gregorian', e.target.value)} 
                                        placeholder="23/9/2025 م"
                                    />
                                ) : <span dir="ltr">{row.date_gregorian}</span>}
                            </td>

                            {/* Hijri Date */}
                            <td className="border border-gray-300 p-2 text-center font-bold">
                                {isEditing ? (
                                    <input 
                                        type="text"
                                        className="w-full bg-transparent text-center outline-none p-1" 
                                        value={row.date_hijri} 
                                        onChange={e => handleRowChange(idx, 'date_hijri', e.target.value)} 
                                        placeholder="1/4/1447 هـ"
                                    />
                                ) : <span dir="ltr">{row.date_hijri}</span>}
                            </td>

                            {/* Content Type */}
                            <td className="border border-gray-300 p-2 font-medium">
                                {isEditing ? (
                                    <textarea 
                                        className="w-full bg-transparent outline-none p-1 resize-none" 
                                        rows={2}
                                        value={row.content_type} 
                                        onChange={e => handleRowChange(idx, 'content_type', e.target.value)} 
                                        placeholder="1. تصميم تهنئة..."
                                    />
                                ) : <div className="whitespace-pre-wrap">{row.content_type}</div>}
                            </td>

                            {/* Deadline */}
                            <td className="border border-gray-300 p-2 text-center font-bold">
                                {isEditing ? (
                                    <input 
                                        type="text"
                                        className="w-full bg-transparent text-center outline-none p-1" 
                                        value={row.deadline} 
                                        onChange={e => handleRowChange(idx, 'deadline', e.target.value)} 
                                        placeholder="20/9/2025 م"
                                    />
                                ) : <span dir="ltr">{row.deadline}</span>}
                            </td>

                            {isEditing && (
                                <td className="border border-gray-300 p-2 text-center bg-red-50">
                                    <button onClick={() => deleteRow(idx)} className="text-red-600 font-bold hover:scale-110">✕</button>
                                </td>
                            )}
                        </tr>
                    ))}
                    {data.length === 0 && !isEditing && (
                        <tr>
                            <td colSpan={5} className="p-8 text-center text-gray-400">لا توجد مناسبات مسجلة.</td>
                        </tr>
                    )}
                </tbody>
            </table>
            {isEditing && (
                <div className="p-3 bg-gray-50 border-t border-gray-300 text-center">
                    <button onClick={addRow} className="text-[#1f4e5f] font-bold text-sm hover:underline">+ إضافة مناسبة جديدة</button>
                </div>
            )}
        </div>
    );
};

export default EventsAgendaTable;
