// app/components/Section.tsx
import { ReactNode } from 'react';
import Container from './Container';

interface SectionProps {
  children: ReactNode;
  className?: string;
  containerClassName?: string;
  fullWidth?: boolean;
  background?: string;
}

export default function Section({ 
  children, 
  className = '',
  containerClassName = '',
  fullWidth = false,
  background = 'bg-transparent'
}: SectionProps) {
  return (
    <section className={`${background} ${className}`}>
      <Container className={containerClassName} fullWidth={fullWidth}>
        {children}
      </Container>
    </section>
  );
}
