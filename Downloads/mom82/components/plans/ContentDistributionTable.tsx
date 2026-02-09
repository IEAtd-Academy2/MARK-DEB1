
import React, { useEffect } from 'react';
import { ContentDistributionRow } from '../../types';

interface ContentDistributionTableProps {
    data: ContentDistributionRow[];
    isEditing: boolean;
    onDataChange: (newData: ContentDistributionRow[]) => void;
}

const PLATFORMS_CONFIG = [
    { name: 'انستقرام', color: 'bg-[#f4a460] text-black' }, // Sandy Brown/Orange
    { name: 'سناب شات', color: 'bg-[#f1c40f] text-black' }, // Yellow
    { name: 'تيك توك', color: 'bg-black text-white' }, // Black
    { name: 'يوتيوب', color: 'bg-[#cc0000] text-white' }, // Red
    { name: 'اكس', color: 'bg-[#444444] text-white' }, // Dark Gray
    { name: 'لينكد إن', color: 'bg-[#2980b9] text-white' }, // Blue
    { name: 'فيسبوك', color: 'bg-[#1e4e79] text-white' }, // Dark Blue
    { name: 'ويب سايت', color: 'bg-black text-white' } // Black
];

const CONTENT_TYPES = [
    { label: 'Awareness', color: 'bg-[#cc0000] text-white' },
    { label: 'Positioning', color: 'bg-[#27ae60] text-white' },
    { label: 'sales', color: 'bg-[#1e4e79] text-white' },
    { label: 'post-sales', color: 'bg-[#16a085] text-white' }
];

const ContentDistributionTable: React.FC<ContentDistributionTableProps> = ({ data, isEditing, onDataChange }) => {

    // Initialize data if empty
    useEffect(() => {
        if (!data || data.length === 0) {
            const initialData: ContentDistributionRow[] = [];
            PLATFORMS_CONFIG.forEach(p => {
                CONTENT_TYPES.forEach(t => {
                    initialData.push({
                        platform: p.name,
                        contentType: t.label as any,
                        distribution: '0%',
                        videoCount: 0,
                        designCount: 0
                    });
                });
            });
            onDataChange(initialData);
        }
    }, []);

    const handleChange = (index: number, field: keyof ContentDistributionRow, value: any) => {
        const newData = [...data];
        // @ts-ignore
        newData[index][field] = value;
        onDataChange(newData);
    };

    if (!data || data.length === 0) return null;

    return (
        <div className="overflow-x-auto border border-gray-600 rounded-lg shadow-sm" dir="ltr">
            <table className="min-w-full text-sm text-center border-collapse border border-gray-600">
                <thead>
                    <tr className="bg-[#1f4e5f] text-white font-bold">
                        <th className="border border-white/30 p-3 w-40">Platform</th>
                        <th className="border border-white/30 p-3 w-40">Content Type</th>
                        <th className="border border-white/30 p-3 w-40">Content Distribution</th>
                        <th className="border border-white/30 p-3 w-32">Videos \ Reels</th>
                        <th className="border border-white/30 p-3 w-32">Designs \ Carousel</th>
                        <th className="border border-white/30 p-3 w-32">Total Month Posts</th>
                    </tr>
                </thead>
                <tbody className="bg-white">
                    {data.map((row, idx) => {
                        const isStartOfPlatform = idx % 4 === 0;
                        const platformIndex = Math.floor(idx / 4);
                        const platformConfig = PLATFORMS_CONFIG[platformIndex] || PLATFORMS_CONFIG[0];
                        const contentTypeConfig = CONTENT_TYPES.find(t => t.label === row.contentType);
                        const total = Number(row.videoCount) + Number(row.designCount);

                        return (
                            <tr key={idx} className="border-b border-gray-300">
                                {/* Platform Column (RowSpan) */}
                                {isStartOfPlatform && (
                                    <td rowSpan={4} className={`border border-gray-400 font-bold ${platformConfig.color} align-middle text-lg`}>
                                        {row.platform}
                                    </td>
                                )}

                                {/* Content Type */}
                                <td className="border border-gray-400 p-1">
                                    <span className={`block w-full py-1 rounded-full text-xs font-bold ${contentTypeConfig?.color}`}>
                                        {row.contentType}
                                    </span>
                                </td>

                                {/* Distribution */}
                                <td className="border border-gray-400 p-1">
                                    {isEditing ? (
                                        <input 
                                            type="text" 
                                            className="w-full text-center outline-none bg-transparent" 
                                            value={row.distribution} 
                                            onChange={(e) => handleChange(idx, 'distribution', e.target.value)} 
                                        />
                                    ) : (
                                        <span>{row.distribution}</span>
                                    )}
                                </td>

                                {/* Videos */}
                                <td className="border border-gray-400 p-1 bg-white">
                                    {isEditing ? (
                                        <input 
                                            type="number" 
                                            className="w-full text-center outline-none bg-transparent" 
                                            value={row.videoCount} 
                                            onChange={(e) => handleChange(idx, 'videoCount', Number(e.target.value))} 
                                        />
                                    ) : (
                                        <span>{row.videoCount || ''}</span>
                                    )}
                                </td>

                                {/* Designs */}
                                <td className="border border-gray-400 p-1 bg-white">
                                    {isEditing ? (
                                        <input 
                                            type="number" 
                                            className="w-full text-center outline-none bg-transparent" 
                                            value={row.designCount} 
                                            onChange={(e) => handleChange(idx, 'designCount', Number(e.target.value))} 
                                        />
                                    ) : (
                                        <span>{row.designCount || ''}</span>
                                    )}
                                </td>

                                {/* Total (Calculated) */}
                                <td className="border border-gray-400 p-1 bg-gray-50 font-bold">
                                    {total > 0 ? total : ''}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default ContentDistributionTable;
