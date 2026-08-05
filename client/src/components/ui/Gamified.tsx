import React from 'react';
import { motion } from 'framer-motion';
import { useDeviceTier } from '../../hooks/useDeviceTier';

interface StatOrbProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  accent?: 'violet' | 'cyan' | 'emerald' | 'amber' | 'rose';
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  className?: string;
}

const accentStyles = {
  violet: 'from-lc-violet/20 to-lc-violet/5 border-lc-violet/30 text-lc-violet',
  cyan: 'from-lc-cyan/20 to-lc-cyan/5 border-lc-cyan/30 text-lc-cyan',
  emerald: 'from-lc-emerald/20 to-lc-emerald/5 border-lc-emerald/30 text-lc-emerald',
  amber: 'from-lc-amber/20 to-lc-amber/5 border-lc-amber/30 text-lc-amber',
  rose: 'from-lc-rose/20 to-lc-rose/5 border-lc-rose/30 text-lc-rose',
};

export function StatOrb({
  label,
  value,
  icon,
  accent = 'violet',
  trend = 'neutral',
  trendValue,
  className = '',
}: StatOrbProps) {
  const { tier } = useDeviceTier();
  const isLowTier = tier === 'low';

  const style = accentStyles[accent];

  return (
    <motion.div
      className={`lc-glass relative overflow-hidden ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={!isLowTier ? { y: -4, transition: { duration: 0.2 } } : undefined}
    >
      <div className="absolute inset-0 bg-gradient-to-br opacity-50" style={{ background: `linear-gradient(135deg, var(--lc-${accent}-light), transparent)` }} />
      <div className="relative p-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-lc-text-muted">{label}</p>
          {icon && <span className={`text-lg ${style}`}>{icon}</span>}
        </div>
        <motion.div
          className="font-display font-bold text-3xl text-lc-text tabular-nums"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {value}
        </motion.div>
        {(trend !== 'neutral' || trendValue) && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trend === 'up' ? 'text-lc-emerald' : trend === 'down' ? 'text-lc-rose' : 'text-lc-text-muted'}`}>
            {trend === 'up' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 15l-6-6-6 6" /></svg>}
            {trend === 'down' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>}
            {trendValue && <span>{trendValue}</span>}
          </div>
        )}
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r" style={{ background: `linear-gradient(90deg, var(--lc-${accent}), var(--lc-${accent === 'violet' ? 'cyan' : accent === 'cyan' ? 'violet' : 'emerald'}))` }} />
    </motion.div>
  );
}

interface XPBarProps {
  xp: number;
  nextLevelXp: number;
  level: string;
  label?: string;
  showLevel?: boolean;
  animated?: boolean;
  className?: string;
}

export function XPBar({ xp, nextLevelXp, level, label = 'XP', showLevel = true, animated = true, className = '' }: XPBarProps) {
  const progress = Math.min((xp / nextLevelXp) * 100, 100);

  return (
    <div className={`lc-glass p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="lc-text-gradient font-display font-bold text-sm">{label}</span>
          {showLevel && (
            <span className="lc-neo lc-neo-pill px-2.5 py-0.5 text-xs font-semibold text-lc-violet bg-lc-violet/10 border border-lc-violet/20">
              Level {level}
            </span>
          )}
        </div>
        <span className="font-mono text-sm tabular-nums text-lc-text-muted">{(typeof xp === 'number' && Number.isFinite(xp) ? xp : 0).toLocaleString()} / {(typeof nextLevelXp === 'number' && Number.isFinite(nextLevelXp) ? nextLevelXp : 0).toLocaleString()}</span>
      </div>
      <div className="relative h-2.5 lc-neo rounded-full overflow-hidden" style={{ boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.3)' }}>
        <motion.div
          className="h-full bg-gradient-to-r from-lc-violet to-lc-cyan rounded-full"
          initial={animated ? { width: 0 } : { width: `${progress}%` }}
          animate={{ width: `${progress}%` }}
          transition={animated ? { duration: 1.2, ease: [0.22, 1, 0.36, 1] } : { duration: 0 }}
          style={{ boxShadow: '0 0 12px var(--lc-brand-violet), 0 0 24px var(--lc-brand-cyan)' }}
        />
      </div>
    </div>
  );
}

interface TiltCardProps {
  children: React.ReactNode;
  maxTilt?: number;
  className?: string;
  scaleOnHover?: number;
}

export function TiltCard({ children, maxTilt = 6, className = '', scaleOnHover = 1.02 }: TiltCardProps) {
  const { tier } = useDeviceTier();
  const isLowTier = tier !== 'high';
  const [rotate, setRotate] = React.useState({ x: 0, y: 0 });

  if (isLowTier) {
    return (
      <motion.div
        className={`lc-glass ${className}`}
        whileHover={{ y: -4, scale: scaleOnHover, transition: { duration: 0.2 } }}
      >
        {children}
      </motion.div>
    );
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateY = ((x - centerX) / centerX) * maxTilt;
    const rotateX = -((y - centerY) / centerY) * maxTilt;
    setRotate({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => setRotate({ x: 0, y: 0 });

  return (
    <motion.div
      className={`lc-glass perspective-1000 ${className}`}
      style={{
        transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
        transition: 'transform 0.1s ease-out',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={{ scale: scaleOnHover, transition: { duration: 0.2 } }}
    >
      <div className="transform-gpu">{children}</div>
    </motion.div>
  );
}

interface TickerProps {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  fontSize?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Ticker({ value, decimals = 0, prefix = '', suffix = '', className = '', fontSize = 'md' }: TickerProps) {
  const startValue = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  const [displayValue, setDisplayValue] = React.useState(startValue);
  const startRef = React.useRef(startValue);
  const sizeMap = { sm: 'text-xl', md: 'text-3xl', lg: 'text-5xl', xl: 'text-7xl' };

  React.useEffect(() => {
    const start = startRef.current;
    const end = value;
    const duration = 800;
    const startTime = Date.now();
    let raf: number;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * eased;
      setDisplayValue(current);
      if (progress < 1) raf = requestAnimationFrame(animate);
      else startRef.current = end;
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return (
    <span className={`font-display font-bold tabular-nums ${sizeMap[fontSize]} ${className}`}>
      {prefix}
      {displayValue.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </span>
  );
}

interface ConfettiBurstProps {
  trigger: number;
  colors?: string[];
  count?: number;
  className?: string;
}

export function ConfettiBurst({ trigger, colors, count = 30, className = '' }: ConfettiBurstProps) {
  const { tier } = useDeviceTier();
  const isLowTier = tier === 'low';

  const defaultColors = [
    '#8b5cf6', '#22d3ee', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#f472b6'
  ];

  const palette = colors || defaultColors;

  React.useEffect(() => {
    if (isLowTier) return;
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d')!;
    const pieces = Array.from({ length: count }, () => ({
      x: window.innerWidth / 2 + (Math.random() - 0.5) * 200,
      y: window.innerHeight / 2 + (Math.random() - 0.5) * 100,
      vx: (Math.random() - 0.5) * 12,
      vy: -Math.random() * 8 - 4,
      rotation: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 8 + 4,
      color: palette[Math.floor(Math.random() * palette.length)],
      life: 1,
    }));

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15;
        p.rotation += p.vr;
        p.life -= 0.015;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();

        if (p.life <= 0 || p.y > canvas.height + 50) pieces.splice(i, 1);
      });

      if (pieces.length > 0) requestAnimationFrame(animate);
      else { canvas.remove(); window.removeEventListener('resize', resize); }
    };
    requestAnimationFrame(animate);
  }, [isLowTier, trigger, count, palette]);

  if (isLowTier) return null;

  return <div className={className} />;
}