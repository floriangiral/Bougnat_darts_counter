import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  ...props 
}) => {
  const baseStyles = "font-black rounded focus:outline-none transition-all duration-200 flex items-center justify-center uppercase tracking-wide";
  
  const variants = {
    // New Fire Gradient Theme
    primary: "bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white shadow-[0_4px_15px_rgba(234,88,12,0.4)] border border-transparent",
    secondary: "bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 hover:border-gray-500 shadow-sm",
    danger: "bg-red-900/50 hover:bg-red-800 text-red-200 border border-red-800",
    ghost: "bg-transparent text-gray-400 hover:text-white hover:bg-white/5"
  };

  const sizes = {
    sm: "px-3 py-1 text-xs",
    md: "px-6 py-3 text-sm",
    lg: "px-8 py-4 text-xl"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};