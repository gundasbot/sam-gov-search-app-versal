// app/components/Container.tsx
import { ReactNode } from 'react';

interface ContainerProps {
  children: ReactNode;
  className?: string;
  fullWidth?: boolean;
}

export default function Container({ 
  children, 
  className = '',
  fullWidth = false 
}: ContainerProps) {
  if (fullWidth) {
    return (
      <div className={`w-full ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <div className={`max-w-[1800px] mx-auto px-6 lg:px-10 xl:px-12 ${className}`}>
      {children}
    </div>
  );
}
