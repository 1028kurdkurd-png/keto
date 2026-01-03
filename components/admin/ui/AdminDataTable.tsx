import React, { useState } from 'react';
import { ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';

export interface Column<T> {
    header: string;
    accessor: keyof T | ((item: T) => React.ReactNode);
    sortable?: boolean;
    className?: string; // Tailwind classes for the cell
}

interface AdminDataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    keyField: keyof T; // e.g., 'id'
    onRowClick?: (_item: T) => void;
    actions?: (_item: T) => React.ReactNode;
    searchQuery?: string;
}

export function AdminDataTable<T>({
    data,
    columns,
    keyField,
    onRowClick,
    actions
}: AdminDataTableProps<T>) {
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    const handleSort = (colIndex: number) => {
        const col = columns[colIndex];
        if (!col.sortable) return;

        // Use column header or index as key for simplicity if accessor is function
        const key = String(colIndex);

        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedData = React.useMemo(() => {
        if (!sortConfig) return data;

        const colIndex = parseInt(sortConfig.key);
        const col = columns[colIndex];

        return [...data].sort((a, b) => {
            let valA: any;
            let valB: any;

            if (typeof col.accessor === 'function') {
                // If accessor is a renderer, we can't easily sort unless we have a separate sortValue?
                // For simplicity, we skip sorting on complex renderers or assume they return sortable primitives
                // Real usage: pass a string key accessor for sortable columns
                valA = 0; valB = 0;
            } else {
                valA = a[col.accessor];
                valB = b[col.accessor];
            }

            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [data, sortConfig, columns]);

    return (
        <div className="w-full overflow-hidden rounded-[24px] shadow-sm border border-gray-100 bg-white">
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-sm text-right rtl">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                            {columns.map((col, idx) => (
                                <th
                                    key={idx}
                                    onClick={() => handleSort(idx)}
                                    className={`
                                        px-6 py-4 font-black text-gray-400 uppercase tracking-wider text-xs whitespace-nowrap
                                        ${col.sortable ? 'cursor-pointer hover:text-primary transition-colors select-none group' : ''}
                                        ${col.className || ''}
                                    `}
                                >
                                    <div className="flex items-center gap-2">
                                        {col.header}
                                        {col.sortable && (
                                            <span className="text-gray-300 group-hover:text-accent">
                                                {sortConfig?.key === String(idx) ? (
                                                    sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                                                ) : <ArrowUpDown size={14} />}
                                            </span>
                                        )}
                                    </div>
                                </th>
                            ))}
                            {actions && <th className="px-6 py-4 font-black text-gray-400 uppercase tracking-wider text-xs">Actions</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {sortedData.map((item) => (
                            <tr
                                key={String(item[keyField])}
                                onClick={() => onRowClick && onRowClick(item)}
                                className={`
                                    group transition-all duration-200
                                    ${onRowClick ? 'cursor-pointer hover:bg-orange-50/50' : 'hover:bg-gray-50'}
                                `}
                            >
                                {columns.map((col, colIdx) => (
                                    <td key={colIdx} className={`px-6 py-4 whitespace-nowrap ${col.className || ''}`}>
                                        {typeof col.accessor === 'function'
                                            ? col.accessor(item)
                                            : String(item[col.accessor])}
                                    </td>
                                ))}
                                {actions && (
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200 translate-x-4 group-hover:translate-x-0">
                                            {actions(item)}
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                        {sortedData.length === 0 && (
                            <tr>
                                <td colSpan={columns.length + (actions ? 1 : 0)} className="px-6 py-20 text-center text-gray-400 font-bold">
                                    No data found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
