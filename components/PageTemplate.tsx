// app/components/PageTemplate.tsx
import { ReactNode } from 'react';

interface PageTemplateProps {
  children: ReactNode;
  header?: ReactNode;
  className?: string;
}

export default function PageTemplate({ 
  children, 
  header,
  className = ''
}: PageTemplateProps) {
  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 ${className}`}>
      {header && (
        <div className="border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
          <div className="max-w-[1800px] mx-auto px-6 lg:px-10 xl:px-12">
            {header}
          </div>
        </div>
      )}
      
      <main className="max-w-[1800px] mx-auto px-6 lg:px-10 xl:px-12 py-8">
        {children}
      </main>
    </div>
  );
}