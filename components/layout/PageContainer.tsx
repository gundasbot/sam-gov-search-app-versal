// app/components/layout/PageContainer.tsx
import { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  fullWidth?: boolean;
  background?: 'default' | 'gradient' | 'dark' | 'light' | 'none';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

export default function PageContainer({ 
  children, 
  className = '',
  fullWidth = false,
  background = 'default',
  padding = 'md'
}: PageContainerProps) {
  // Background classes
  const backgroundClasses = {
    default: 'bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900',
    gradient: 'bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900',
    dark: 'bg-slate-950',
    light: 'bg-white text-slate-900',
    none: ''
  };

  // Padding classes
  const paddingClasses = {
    none: '',
    sm: 'py-4',
    md: 'py-8',
    lg: 'py-12',
    xl: 'py-16'
  };

  // Width classes
  const widthClasses = fullWidth 
    ? 'w-full' 
    : 'container-wide';

  return (
    <div className={`min-h-screen ${backgroundClasses[background]} ${paddingClasses[padding]} ${className}`}>
      <div className={widthClasses}>
        {children}
      </div>
    </div>
  );
}