// components/layout/Section.tsx

import React, { ReactNode } from 'react'
import Container from './Container'

interface SectionProps {
  children: ReactNode
  className?: string
  containerClassName?: string
  fullWidth?: boolean
  background?: string
  as?: keyof React.JSX.IntrinsicElements
}

export default function Section({
  children,
  className = '',
  containerClassName = '',
  fullWidth = false,
  background = '',
  as: Component = 'section',
}: SectionProps) {
  return (
    <Component className={`${background} ${className}`}>
      <Container className={containerClassName} fullWidth={fullWidth}>
        {children}
      </Container>
    </Component>
  )
}
