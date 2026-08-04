import React from 'react';
import type { HTMLMotionProps } from 'framer-motion';
import { motion } from 'framer-motion';

interface GlassCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: React.ReactNode;
  raised?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  className?: string;
}

const paddingMap = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

export function GlassCard({
  children,
  raised = false,
  padding = 'md',
  hoverable = true,
  className = '',
  style,
  whileHover,
  ...props
}: GlassCardProps) {
  return (
    <motion.div
      className={`lc-glass ${raised ? 'lc-glass-raised' : ''} ${paddingMap[padding]} ${className}`}
      style={style}
      whileHover={hoverable ? (whileHover ?? { y: -4, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } }) : undefined}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function GlassModal({
  isOpen,
  onClose,
  children,
  title,
  size = 'md',
  className = '',
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}) {
  if (!isOpen) return null;

  const sizeMap = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-[90vw]',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-lc-void/80 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className={`lc-glass w-full ${sizeMap[size]} max-h-[90vh] overflow-hidden flex flex-col ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-lc-glass-border">
            <h3 id="modal-title" className="font-display text-lg font-semibold text-lc-text">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="lc-neo lc-neo-pill p-2 text-lc-text-muted hover:text-lc-text transition-colors"
              aria-label="Close"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </motion.div>
    </motion.div>
  );
}