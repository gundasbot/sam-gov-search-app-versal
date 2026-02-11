// components/layout/Container.tsx
import React, { ReactNode } from 'react'

interface ContainerProps {
  children: ReactNode
  className?: string
  fullWidth?: boolean
  as?: keyof React.JSX.IntrinsicElements
  maxWidth?: 'wide' | 'content'
}

export default function Container({
  children,
  className = '',
  fullWidth = false,
  as: Component = 'div',
  maxWidth = 'wide',
}: ContainerProps) {
  const base = 'mx-auto px-4 sm:px-6 lg:px-10 2xl:px-12 w-full'
  const width = fullWidth
    ? 'w-full'
    : maxWidth === 'content'
      ? `${base} max-w-[1440px]`
      : `${base} max-w-[1920px]`

  return <Component className={`${width} ${className}`}>{children}</Component>
}
