import React from 'react';

interface AppPageBackgroundProps {
  children: React.ReactNode;
  contentClassName?: string;
}

export const AppPageBackground: React.FC<AppPageBackgroundProps> = ({
  children,
  contentClassName = 'mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-8 sm:px-6 sm:py-10',
}) => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#05070b] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,146,60,0.22),transparent_28%),radial-gradient(circle_at_80%_18%,rgba(220,38,38,0.18),transparent_22%),radial-gradient(circle_at_bottom,rgba(255,255,255,0.05),transparent_35%)]" />
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:28px_28px]" />
      <div className={`relative z-10 ${contentClassName}`}>
        {children}
      </div>
    </div>
  );
};
