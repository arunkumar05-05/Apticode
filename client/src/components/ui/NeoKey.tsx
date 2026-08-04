import React from 'react';
import type { HTMLMotionProps } from 'framer-motion';
import { motion } from 'framer-motion';
import { useDeviceTier } from '../../hooks/useDeviceTier';

interface NeoKeyProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  pill?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}

const sizeStyles = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2.5',
};

const variantStyles = {
  primary: 'bg-gradient-to-r from-lc-violet to-lc-cyan text-white shadow-[0_8px_20px_-8px_var(--lc-brand-violet)] hover:from-lc-violet-hover hover:to-lc-cyan-hover',
  secondary: 'bg-lc-neo text-lc-text border border-lc-glass-border hover:border-lc-violet/30',
  ghost: 'bg-transparent text-lc-text-muted hover:text-lc-text hover:bg-lc-glass-bg',
  danger: 'bg-lc-rose/20 text-lc-rose border border-lc-rose/30 hover:bg-lc-rose/30',
};

export function NeoKey({
  children,
  variant = 'primary',
  size = 'md',
  pill = false,
  iconLeft,
  iconRight,
  loading = false,
  fullWidth = false,
  className = '',
  disabled,
  whileTap,
  whileHover,
  ...props
}: NeoKeyProps) {
  const { tier } = useDeviceTier();
  const isLowTier = tier === 'low';

  const baseClasses = `
    lc-neo ${pill ? 'lc-neo-pill' : ''}
    inline-flex items-center justify-center font-semibold
    transition-all duration-120 ease-[cubic-bezier(0.22,1,0.36,1)]
    touch-manipulation select-none
    ${fullWidth ? 'w-full' : ''}
    ${sizeStyles[size]}
    ${variantStyles[variant]}
    ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''}
    ${className}
  `;

  return (
    <motion.button
      className={baseClasses}
      disabled={disabled || loading}
      whileTap={isLowTier || disabled || loading ? undefined : whileTap ?? { scale: 0.97 }}
      whileHover={isLowTier || disabled || loading ? undefined : whileHover ?? { y: -2 }}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : iconLeft ? (
        <span className="flex-shrink-0">{iconLeft}</span>
      ) : null}
      <span className={loading ? 'opacity-0' : ''}>{children}</span>
      {!loading && iconRight && <span className="flex-shrink-0">{iconRight}</span>}
    </motion.button>
  );
}

interface NeoSegmentProps {
  options: { value: string; label: string; icon?: React.ReactNode }[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export function NeoSegment({ options, value, onChange, className = '', size = 'md' }: NeoSegmentProps) {
  return (
    <div className={`inline-flex lc-neo p-1 ${className}`} role="radiogroup">
      {options.map((opt) => (
        <button
          key={opt.value}
          role="radio"
          aria-checked={value === opt.value}
          onClick={() => onChange(opt.value)}
          disabled={value === opt.value}
          className={`
            relative flex items-center gap-1.5 font-semibold transition-all duration-120 ease-[cubic-bezier(0.22,1,0.36,1)]
            ${size === 'sm' ? 'px-3 py-1.5 text-xs rounded-md' : 'px-4 py-2 text-sm rounded-lg'}
            ${value === opt.value
              ? 'text-lc-violet bg-lc-glass-bg shadow-[inset_0_0_0_1px_var(--lc-brand-violet)]'
              : 'text-lc-text-muted hover:text-lc-text'}
          `}
          style={value === opt.value ? { boxShadow: 'inset 0 0 0 1px var(--lc-brand-violet)' } : undefined}
        >
          {opt.icon && <span className="flex-shrink-0">{opt.icon}</span>}
          {opt.label}
        </button>
      ))}
    </div>
  );
}

interface NeoSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function NeoSwitch({ checked, onChange, label, disabled, className = '' }: NeoSwitchProps) {
  const { tier } = useDeviceTier();

  return (
    <label className={`inline-flex items-center gap-3 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only peer"
        />
        <div
          className={`
            lc-neo w-12 h-6 rounded-full transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]
            ${checked ? 'bg-gradient-to-r from-lc-violet to-lc-cyan' : 'bg-lc-glass-bg'}
            ${tier === 'low' ? '' : 'peer-focus-visible:ring-2 peer-focus-visible:ring-lc-violet/50'}
          `}
        >
          <motion.div
            animate={{ x: checked ? 24 : 2 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="w-4 h-4 rounded-full bg-white shadow-lg flex items-center justify-center"
            style={{ boxShadow: checked ? '0 2px 8px rgba(139,92,246,0.4)' : 'var(--lc-shadow-neo-raised)' }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </motion.div>
        </div>
      </div>
      {label && <span className="text-sm text-lc-text-muted">{label}</span>}
    </label>
  );
}

interface NeoSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  className?: string;
}

export function NeoSlider({ value, onChange, min = 0, max = 100, step = 1, label, className = '' }: NeoSliderProps) {
  const pct = ((value - min) / (max - min)) * 100;
  const trackRef = React.useRef<HTMLDivElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Math.min(max, Math.max(min, Number(e.target.value))));
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <div className="flex justify-between text-xs text-lc-text-muted mb-2">
          <span>{label}</span>
          <span className="font-mono tabular-nums">{value}</span>
        </div>
      )}
      <div className="relative h-2">
        <div ref={trackRef} className="absolute inset-0 lc-neo rounded-full overflow-hidden" />
        <div
          className="pointer-events-none absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-lc-violet to-lc-cyan transition-all duration-100 ease-out"
          style={{ width: `${pct}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          aria-label={label}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <motion.div
          animate={{ left: `calc(${pct}% - 10px)` }}
          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
          className="pointer-events-none absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white lc-neo"
          style={{ left: `calc(${pct}% - 10px)` }}
        />
      </div>
    </div>
  );
}