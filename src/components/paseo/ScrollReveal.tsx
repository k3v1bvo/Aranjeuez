'use client';

import React, { useEffect, useRef, useState } from 'react';

interface ScrollRevealProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  staggerIndex?: number;
}

export function ScrollReveal({
  children,
  delay = 0,
  className = '',
  staggerIndex,
}: ScrollRevealProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Stagger de 60ms por elemento según Regla 1
  const calculatedDelay = staggerIndex !== undefined ? staggerIndex * 0.06 : delay;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -60px 0px',
      }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
        transition: `opacity 800ms cubic-bezier(0.16, 1, 0.3, 1) ${calculatedDelay}s, transform 800ms cubic-bezier(0.16, 1, 0.3, 1) ${calculatedDelay}s`,
      }}
      className={className}
    >
      {children}
    </div>
  );
}

export function ScrollRevealContainer({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}

export function ScrollRevealItem({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <ScrollReveal className={className}>{children}</ScrollReveal>;
}
