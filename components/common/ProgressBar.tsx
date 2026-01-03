import React from 'react';

interface ProgressBarProps {
  percent: number;
  height?: number;
  label?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ percent, height = 8, label }) => {
  const clamped = Math.max(0, Math.min(100, Math.round(percent || 0)));
  return (
    <div className="w-full">
      {label ? <div className="text-xs text-gray-500 mb-1">{label}</div> : null}
      <div className="w-full bg-gray-100 rounded" style={{ height }}>
        <div className="bg-[#231f20]" style={{ width: `${clamped}%`, height, borderRadius: 6 }} />
      </div>
      <div className="text-xs text-gray-500 mt-1 text-right">{clamped}%</div>
    </div>
  );
};

export default ProgressBar;
