import React from 'react';
import { LucideIcon } from 'lucide-react';

interface AdminStatsCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: string; // e.g. "+12%"
    trendUp?: boolean;
    color?: string; // Tailwind color class like 'bg-blue-500'
}

export const AdminStatsCard: React.FC<AdminStatsCardProps> = ({ title, value, icon: Icon, trend, trendUp, color = 'bg-primary' }) => {
    return (
        <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 group">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mb-1">{title}</p>
                    <h3 className="font-heading font-black text-3xl text-primary">{value}</h3>
                </div>
                <div className={`w-12 h-12 rounded-2xl ${color} text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    <Icon size={24} />
                </div>
            </div>
            {trend && (
                <div className="mt-4 flex items-center gap-2 text-xs font-bold">
                    <span className={`px-2 py-1 rounded-full ${trendUp ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {trend}
                    </span>
                    <span className="text-gray-400">vs last month</span>
                </div>
            )}
        </div>
    );
};
