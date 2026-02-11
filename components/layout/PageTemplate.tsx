// app/components/layout/PageTemplate.tsx
import { ReactNode } from 'react';

interface PageTemplateProps {
  children: ReactNode;
  className?: string;
  background?: 'default' | 'dark' | 'light' | 'gradient';
  containerWidth?: 'full' | 'content' | 'wide';
}

export default function PageTemplate({ 
  children, 
  className = '',
  background = 'default',
  containerWidth = 'content'
}: PageTemplateProps) {
  // Background classes
  const backgroundClasses = {
    default: 'bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900',
    dark: 'bg-slate-950',
    light: 'bg-slate-100 text-slate-900',
    gradient: 'bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900'
  };

  // Container width classes
  const containerClasses = {
    full: 'w-full',
    content: 'content-container',
    wide: 'max-w-[1800px] mx-auto px-6 lg:px-10 xl:px-12'
  };

  return (
    <div className={`min-h-[calc(100vh-200px)] ${backgroundClasses[background]} ${className}`}>
      <div className={`${containerClasses[containerWidth]} py-8`}>
        {children}
      </div>
    </div>
  );
}
