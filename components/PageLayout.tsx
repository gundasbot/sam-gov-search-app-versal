import { ReactNode } from 'react';
import Container from './Container';

interface PageLayoutProps {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export default function PageLayout({ 
  children, 
  header,
  footer,
  className = ''
}: PageLayoutProps) {
  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 ${className}`}>
      {header && (
        <div className="border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
          <Container className="py-4">
            {header}
          </Container>
        </div>
      )}
      
      <main className="py-8">
        <Container>
          {children}
        </Container>
      </main>

      {footer && (
        <div className="border-t border-white/5 bg-slate-950/80 backdrop-blur-xl">
          <Container className="py-8">
            {footer}
          </Container>
        </div>
      )}
    </div>
  );
}