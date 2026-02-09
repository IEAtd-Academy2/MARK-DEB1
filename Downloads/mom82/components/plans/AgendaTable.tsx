
import React from 'react';
import { AgendaRow } from '../../types';

interface AgendaTableProps {
    data: AgendaRow[];
    isEditing: boolean;
    onDataChange: (newData: AgendaRow[]) => void;
}

const PLATFORMS_LIST = ['Youtube', 'Facebook', 'Tiktok', 'Snapchat', 'Instagram', 'Linkedin'];
const POST_TYPES = ['Video', 'Carousel', 'Reel', 'Post', 'Story'];
const CONTENT_TYPES = ['Company Content', 'ATTRACT CONTENT', 'Product Content', 'AUTHORITY CONTENT', 'Direct Sales Content', 'ACTION CONTENT', 'AFFINITY CONTENT'];
const CATEGORIES = ['Awareness', 'Sales', 'Positioning', 'Engagement'];

const AgendaTable: React.FC<AgendaTableProps> = ({ data, isEditing, onDataChange }) => {

    const handleRowChange = (index: number, field: keyof AgendaRow, value: any) => {
        const newData = [...data];
        // @ts-ignore
        newData[index][field] = value;
        onDataChange(newData);
    };

    const handleNestedChange = (index: number, parent: 'status' | 'metrics', field: string, value: any) => {
        const newData = [...data];
        // @ts-ignore
        newData[index][parent][field] = value;
        onDataChange(newData);
    };

    const togglePlatform = (index: number, platform: string) => {
        const newData = [...data];
        const currentPlatforms = newData[index].platforms || [];
        if (currentPlatforms.includes(platform)) {
            newData[index].platforms = currentPlatforms.filter(p => p !== platform);
        } else {
            newData[index].platforms = [...currentPlatforms, platform];
        }
        onDataChange(newData);
    };

    const addRow = () => {
        onDataChange([...data, {
            date: new Date().toISOString().split('T')[0],
            time: '9:00 am',
            content_type: 'Company Content',
            post_category: 'Awareness',
            title: '',
            post_type: 'Post',
            platforms: [],
            content: '',
            url: '',
            status: { task_creation: false, media_product: false, scheduling: false },
            metrics: { reach: '', engagement: '', views: '' }
        }]);
    };

    const deleteRow = (index: number) => {
        const newData = data.filter((_, i) => i !== index);
        onDataChange(newData);
    };

    return (
        <div className="overflow-x-auto border border-gray-400 rounded-lg shadow-sm" dir="ltr">
            <table className="min-w-full text-xs text-center border-collapse border border-gray-400">
                <thead>
                    <tr className="bg-[#5c1818] text-white uppercase font-bold tracking-wider">
                        <th className="border border-white/20 p-2 w-24">Date</th>
                        <th className="border border-white/20 p-2 w-20">Time</th>
                        <th className="border border-white/20 p-2 w-40">CONTENT TYPE</th>
                        <th className="border border-white/20 p-2 w-32">Post Category</th>
                        <th className="border border-white/20 p-2 w-64">Title</th>
                        <th className="border border-white/20 p-2 w-32">Post Type</th>
                        <th className="border border-white/20 p-2 w-40">The Platform</th>
                        <th className="border border-white/20 p-2 w-64">Content</th>
                        <th className="border border-white/20 p-2 w-40">URL</th>
                        <th className="border border-white/20 p-2 w-16 text-[10px]">task creation</th>
                        <th className="border border-white/20 p-2 w-16 text-[10px]">media product</th>
                        <th className="border border-white/20 p-2 w-16 text-[10px]">schedul ing</th>
                        <th className="border border-white/20 p-2 w-20">reach</th>
                        <th className="border border-white/20 p-2 w-20">engagm ent</th>
                        <th className="border border-white/20 p-2 w-20">views</th>
                        {isEditing && <th className="border border-white/20 p-2 w-10">❌</th>}
                    </tr>
                </thead>
                <tbody className="bg-white text-black font-medium">
                    {data.map((row, idx) => (
                        <tr key={idx} className="border-b border-gray-300 hover:bg-gray-50 transition-colors">
                            {/* Date */}
                            <td className="border border-gray-300 p-1">
                                {isEditing ? <input type="date" className="w-full bg-transparent text-center outline-none" value={row.date} onChange={e => handleRowChange(idx, 'date', e.target.value)} /> : row.date}
                            </td>
                            {/* Time */}
                            <td className="border border-gray-300 p-1">
                                {isEditing ? <input type="text" className="w-full bg-transparent text-center outline-none" value={row.time} onChange={e => handleRowChange(idx, 'time', e.target.value)} /> : row.time}
                            </td>
                            {/* Content Type */}
                            <td className="border border-gray-300 p-2">
                                {isEditing ? (
                                    <select className="w-full bg-transparent text-xs" value={row.content_type} onChange={e => handleRowChange(idx, 'content_type', e.target.value)}>
                                        {CONTENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                ) : (
                                    <span className="bg-[#fce5cd] text-[#b45f06] border border-[#b45f06] px-2 py-1 rounded text-[10px] font-bold block whitespace-nowrap overflow-hidden text-ellipsis">{row.content_type}</span>
                                )}
                            </td>
                            {/* Post Category */}
                            <td className="border border-gray-300 p-2">
                                {isEditing ? (
                                    <select className="w-full bg-transparent text-xs" value={row.post_category} onChange={e => handleRowChange(idx, 'post_category', e.target.value)}>
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                ) : (
                                    <span className="bg-[#f4cccc] text-[#990000] border border-[#990000] px-2 py-1 rounded-full text-[10px] font-bold">{row.post_category}</span>
                                )}
                            </td>
                            {/* Title */}
                            <td className="border border-gray-300 p-2 text-right bg-[#eefaff]">
                                {isEditing ? <textarea className="w-full bg-transparent text-right text-xs resize-none outline-none" rows={2} value={row.title} onChange={e => handleRowChange(idx, 'title', e.target.value)} /> : row.title}
                            </td>
                            {/* Post Type */}
                            <td className="border border-gray-300 p-2">
                                {isEditing ? (
                                    <select className="w-full bg-transparent text-xs font-bold" value={row.post_type} onChange={e => handleRowChange(idx, 'post_type', e.target.value)}>
                                        {POST_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                ) : (
                                    <span className={`px-2 py-1 rounded font-bold text-white text-[10px] block w-full 
                                        ${row.post_type === 'video' ? 'bg-[#1155cc]' : 
                                          row.post_type === 'Carousel' ? 'bg-[#e69138]' : 
                                          row.post_type === 'Reel' ? 'bg-[#38761d]' : 'bg-[#cc0000]'}`}>
                                        {row.post_type}
                                    </span>
                                )}
                            </td>
                            {/* Platforms */}
                            <td className="border border-gray-300 p-1 bg-white">
                                <div className="flex flex-col gap-1">
                                    {isEditing ? (
                                        PLATFORMS_LIST.map(p => (
                                            <label key={p} className={`text-[9px] px-2 py-0.5 rounded cursor-pointer border ${row.platforms.includes(p) ? 'bg-[#a61c00] text-white border-[#a61c00]' : 'bg-gray-100 text-gray-400 border-gray-200'}`}>
                                                <input type="checkbox" className="hidden" checked={row.platforms.includes(p)} onChange={() => togglePlatform(idx, p)} />
                                                {p}
                                            </label>
                                        ))
                                    ) : (
                                        row.platforms.map(p => (
                                            <span key={p} className="bg-[#a61c00] text-white text-[9px] px-2 py-0.5 rounded border border-[#a61c00] shadow-sm">{p}</span>
                                        ))
                                    )}
                                </div>
                            </td>
                            {/* Content */}
                            <td className="border border-gray-300 p-2 text-right">
                                {isEditing ? <textarea className="w-full bg-transparent text-right text-[10px] resize-none outline-none" rows={3} value={row.content} onChange={e => handleRowChange(idx, 'content', e.target.value)} /> : <div className="max-h-[80px] overflow-y-auto text-[10px]">{row.content}</div>}
                            </td>
                            {/* URL */}
                            <td className="border border-gray-300 p-2 break-all">
                                {isEditing ? <input type="text" className="w-full bg-transparent text-xs outline-none text-blue-600" value={row.url} onChange={e => handleRowChange(idx, 'url', e.target.value)} /> : <a href={row.url} target="_blank" rel="noreferrer" className="text-blue-600 underline text-[9px]">{row.url ? 'Link' : ''}</a>}
                            </td>
                            
                            {/* Workflow Checkboxes */}
                            <td className="border border-gray-300 p-2 bg-[#f3f3f3]">
                                <input type="checkbox" className="w-4 h-4 accent-[#4a8998] cursor-pointer" checked={row.status?.task_creation} onChange={(e) => handleNestedChange(idx, 'status', 'task_creation', e.target.checked)} disabled={!isEditing && !row.status?.task_creation} />
                            </td>
                            <td className="border border-gray-300 p-2 bg-[#f3f3f3]">
                                <input type="checkbox" className="w-4 h-4 accent-[#4a8998] cursor-pointer" checked={row.status?.media_product} onChange={(e) => handleNestedChange(idx, 'status', 'media_product', e.target.checked)} disabled={!isEditing && !row.status?.media_product} />
                            </td>
                            <td className="border border-gray-300 p-2 bg-[#f3f3f3]">
                                <input type="checkbox" className="w-4 h-4 accent-[#4a8998] cursor-pointer" checked={row.status?.scheduling} onChange={(e) => handleNestedChange(idx, 'status', 'scheduling', e.target.checked)} disabled={!isEditing && !row.status?.scheduling} />
                            </td>

                            {/* Metrics */}
                            <td className="border border-gray-300 p-1">
                                {isEditing ? <input className="w-full text-center bg-transparent" value={row.metrics?.reach} onChange={e => handleNestedChange(idx, 'metrics', 'reach', e.target.value)} /> : row.metrics?.reach}
                            </td>
                            <td className="border border-gray-300 p-1">
                                {isEditing ? <input className="w-full text-center bg-transparent" value={row.metrics?.engagement} onChange={e => handleNestedChange(idx, 'metrics', 'engagement', e.target.value)} /> : row.metrics?.engagement}
                            </td>
                            <td className="border border-gray-300 p-1">
                                {isEditing ? <input className="w-full text-center bg-transparent" value={row.metrics?.views} onChange={e => handleNestedChange(idx, 'metrics', 'views', e.target.value)} /> : row.metrics?.views}
                            </td>

                            {isEditing && (
                                <td className="border border-gray-300 p-1 bg-red-50">
                                    <button onClick={() => deleteRow(idx)} className="text-red-500 font-bold hover:scale-110">✕</button>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
            {isEditing && (
                <div className="p-3 bg-gray-50 border-t border-gray-300 text-center">
                    <button onClick={addRow} className="text-[#5c1818] font-bold text-sm hover:underline">+ Add Agenda Row</button>
                </div>
            )}
        </div>
    );
};

export default AgendaTable;
