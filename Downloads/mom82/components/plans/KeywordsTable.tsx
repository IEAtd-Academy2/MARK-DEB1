
import React from 'react';
import { KeywordsRow } from '../../types';

interface KeywordsTableProps {
    data: KeywordsRow[];
    isEditing: boolean;
    onDataChange: (newData: KeywordsRow[]) => void;
}

const COMPETITION_OPTIONS = ['high', 'medium', 'low'];
const STATUS_OPTIONS = ['in', 'out'];

const KeywordsTable: React.FC<KeywordsTableProps> = ({ data, isEditing, onDataChange }) => {

    const handleRowChange = (index: number, field: keyof KeywordsRow, value: any) => {
        const newData = [...data];
        // @ts-ignore
        newData[index][field] = value;
        onDataChange(newData);
    };

    const addRow = () => {
        onDataChange([...data, {
            keyword: '',
            avg_monthly_searches: '',
            competition: 'low',
            account_status: 'out',
            yoy_change: '{ + 00 }'
        }]);
    };

    const deleteRow = (index: number) => {
        const newData = data.filter((_, i) => i !== index);
        onDataChange(newData);
    };

    const getCompetitionStyle = (comp: string) => {
        switch(comp) {
            case 'high': return 'bg-[#f4cccc] text-[#990000]'; // Light red, dark red text
            case 'low': return 'bg-[#274e13] text-white'; // Dark green, white text
            case 'medium': return 'bg-[#d9ead3] text-[#38761d]'; // Light green/yellow, dark green text
            default: return 'bg-gray-100';
        }
    };

    const getStatusStyle = (status: string) => {
        switch(status) {
            case 'in': return 'bg-[#274e13] text-white'; // Dark green
            case 'out': return 'bg-[#fce5cd] text-[#b45f06]'; // Light orange, dark orange text
            default: return 'bg-gray-100';
        }
    };

    return (
        <div className="overflow-x-auto border border-gray-400 rounded-lg shadow-sm" dir="ltr">
            <table className="min-w-full text-sm text-left border-collapse border border-gray-400">
                <thead>
                    <tr className="bg-[#1f4e5f] text-white font-bold text-center">
                        <th className="border border-white/30 p-3 w-64 text-left pl-4">keyword</th>
                        <th className="border border-white/30 p-3 w-48 text-left pl-4">Avg. monthly searches</th>
                        <th className="border border-white/30 p-3 w-40 text-center">competition</th>
                        <th className="border border-white/30 p-3 w-40 text-center">account status</th>
                        <th className="border border-white/30 p-3 w-40 text-left pl-4">YoY change %</th>
                        {isEditing && <th className="border border-white/30 p-3 w-10">❌</th>}
                    </tr>
                </thead>
                <tbody className="bg-white">
                    {data.map((row, idx) => (
                        <tr key={idx} className="border-b border-gray-300 hover:bg-gray-50 transition-colors">
                            {/* Keyword */}
                            <td className="border border-gray-300 p-1">
                                {isEditing ? (
                                    <input 
                                        className="w-full bg-transparent outline-none p-1 px-2" 
                                        value={row.keyword} 
                                        onChange={e => handleRowChange(idx, 'keyword', e.target.value)} 
                                    />
                                ) : <span className="px-2">{row.keyword}</span>}
                            </td>

                            {/* Avg Search */}
                            <td className="border border-gray-300 p-1">
                                {isEditing ? (
                                    <input 
                                        type="text"
                                        className="w-full bg-transparent outline-none p-1 px-2" 
                                        value={row.avg_monthly_searches} 
                                        onChange={e => handleRowChange(idx, 'avg_monthly_searches', e.target.value)} 
                                    />
                                ) : <span className="px-2">{row.avg_monthly_searches}</span>}
                            </td>

                            {/* Competition */}
                            <td className="border border-gray-300 p-1 text-center">
                                {isEditing ? (
                                    <select 
                                        className={`w-full text-center outline-none p-1 font-bold rounded ${getCompetitionStyle(row.competition)}`}
                                        value={row.competition}
                                        onChange={e => handleRowChange(idx, 'competition', e.target.value)}
                                    >
                                        {COMPETITION_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                ) : (
                                    <span className={`block w-full py-1 rounded text-xs font-bold ${getCompetitionStyle(row.competition)}`}>
                                        {row.competition}
                                    </span>
                                )}
                            </td>

                            {/* Account Status */}
                            <td className="border border-gray-300 p-1 text-center">
                                {isEditing ? (
                                    <select 
                                        className={`w-full text-center outline-none p-1 font-bold rounded ${getStatusStyle(row.account_status)}`}
                                        value={row.account_status}
                                        onChange={e => handleRowChange(idx, 'account_status', e.target.value)}
                                    >
                                        {STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                ) : (
                                    <span className={`block w-full py-1 rounded text-xs font-bold ${getStatusStyle(row.account_status)}`}>
                                        {row.account_status}
                                    </span>
                                )}
                            </td>

                            {/* YoY Change */}
                            <td className="border border-gray-300 p-1">
                                {isEditing ? (
                                    <input 
                                        type="text"
                                        className="w-full bg-transparent outline-none p-1 px-2" 
                                        value={row.yoy_change} 
                                        onChange={e => handleRowChange(idx, 'yoy_change', e.target.value)} 
                                    />
                                ) : <span className="px-2">{row.yoy_change}</span>}
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
                            <td colSpan={5} className="p-8 text-center text-gray-400">No keywords data.</td>
                        </tr>
                    )}
                </tbody>
            </table>
            {isEditing && (
                <div className="p-3 bg-gray-50 border-t border-gray-300 text-center">
                    <button onClick={addRow} className="text-[#1f4e5f] font-bold text-sm hover:underline">+ Add Keyword</button>
                </div>
            )}
        </div>
    );
};

export default KeywordsTable;
