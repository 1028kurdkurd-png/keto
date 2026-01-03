import React from 'react';

interface SizeControlProps {
  size: number; // 10-30, where 15 is default
  children: React.ReactNode;
}

export const SizeControl: React.FC<SizeControlProps> = ({ size, children }) => {
  // Calculate dimensions based on size parameter
  const calculateWidth = (baseSize: number) => {
    const scale = size / 15; // 15 is the default/normal size
    return Math.round(baseSize * scale);
  };

  // Generate dynamic CSS classes
  const mdMaxW = calculateWidth(640);
  const lgMaxW = calculateWidth(800);
  const mdMy = Math.round((size / 15) * 1.5 * 16); // Convert to pixels
  const rounded = Math.round((size / 15) * 18);

  // Build dynamic className
  const dynamicClassName = `min-h-screen flex flex-col w-full mx-auto bg-[#faf8f5] shadow-[0_0_28px_-8px_rgba(0,0,0,0.08)] overflow-hidden relative rtl text-right`;

  return (
    <div 
      className={dynamicClassName}
      style={{
        maxWidth: `${lgMaxW}px`,
        margin: '0 auto',
        borderRadius: `${rounded}px`,
        '@media (min-width: 768px)': {
          maxWidth: `${mdMaxW}px`,
          margin: `${mdMy}px auto`,
          borderRadius: `${rounded}px`,
        }
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
};

// Alternative: Simple CSS custom properties approach
interface AppContainerProps {
  size?: number;
  children: React.ReactNode;
}

export const AppContainer: React.FC<AppContainerProps> = ({ size = 15, children }) => {
  const scale = size / 15;
  
  const mdMaxW = Math.round(640 * scale);
  const lgMaxW = Math.round(800 * scale);
  const mdMy = Math.round(1.5 * scale * 16); // pixels
  const rounded = Math.round(18 * scale);
  
  return (
    <div 
      className="min-h-screen flex flex-col w-full mx-auto bg-[#faf8f5] shadow-[0_0_28px_-8px_rgba(0,0,0,0.08)] overflow-hidden relative rtl text-right"
      style={{
        maxWidth: `${lgMaxW}px`,
        margin: '0 auto',
        borderRadius: `${rounded}px`,
        '@media (min-width: 768px)': {
          maxWidth: `${mdMaxW}px`,
          margin: `${mdMy}px auto`,
          borderRadius: `${rounded}px`,
        }
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
};

// Size presets for easy usage
export const APP_SIZES = {
  TINY: 10,    // Very small app
  SMALL: 12,  // Small app
  NORMAL: 15, // Default size
  LARGE: 20,  // Large app
  HUGE: 25,   // Extra large app
  MASSIVE: 30 // Maximum size
} as const;

// Usage examples:
/*
// Very small app
<SizeControl size={APP_SIZES.TINY}>
  <App />
</SizeControl>

// Normal app (default)
<SizeControl size={APP_SIZES.NORMAL}>
  <App />
</SizeControl>

// Large app
<SizeControl size={APP_SIZES.LARGE}>
  <App />
</SizeControl>

// Custom size
<SizeControl size={18}>
  <App />
</SizeControl>
*/