import React, { useEffect, useRef } from 'react';
import { useDeviceTier } from '../../hooks/useDeviceTier';

interface LiquidBackdropProps {
  className?: string;
  blobCount?: number;
  intensity?: number;
  interactive?: boolean;
}

export function LiquidBackdrop({
  className = '',
  blobCount = 3,
  intensity = 1,
  interactive = true,
}: LiquidBackdropProps) {
  const { tier, prefersReducedMotion } = useDeviceTier();
  const isLowTier = tier === 'low' || prefersReducedMotion;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const blobsRef = useRef<Array<{
    x: number; y: number; baseX: number; baseY: number;
    radius: number; speed: number; angle: number;
    color: 'violet' | 'cyan';
    phase: number;
  }>>([]);

  const targetRef = useRef({ x: 0.5, y: 0.5 });
  const currentRef = useRef({ x: 0.5, y: 0.5 });

  useEffect(() => {
    if (isLowTier) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let width = 0, height = 0;

    const initBlobs = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;

      const count = Math.min(blobCount, 4);
      blobsRef.current = Array.from({ length: count }, (_, i) => {
        const isViolet = i % 2 === 0;
        const side = i < 2 ? 0.2 : 0.8;
        return {
          x: width * (side + (Math.random() - 0.5) * 0.3),
          y: height * (0.3 + Math.random() * 0.4),
          baseX: width * side,
          baseY: height * 0.5,
          radius: Math.min(width, height) * (0.25 + Math.random() * 0.15),
          speed: 0.0003 + Math.random() * 0.0004,
          angle: Math.random() * Math.PI * 2,
          color: isViolet ? 'violet' : 'cyan',
          phase: Math.random() * Math.PI * 2,
        };
      });
    };

    initBlobs();
    window.addEventListener('resize', initBlobs);

    const handleMove = (e: MouseEvent) => {
      if (!interactive) return;
      targetRef.current = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      };
    };
    window.addEventListener('mousemove', handleMove);

    let raf: number;
    const animate = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d')!;

      ctx.clearRect(0, 0, width, height);

      currentRef.current.x += (targetRef.current.x - currentRef.current.x) * 0.02;
      currentRef.current.y += (targetRef.current.y - currentRef.current.y) * 0.02;

      blobsRef.current.forEach((blob) => {
        const t = Date.now() * blob.speed + blob.phase;
        const driftX = Math.sin(t * 0.7) * width * 0.08;
        const driftY = Math.cos(t * 0.5) * height * 0.06;

        const influenceX = (currentRef.current.x - 0.5) * width * 0.15 * intensity;
        const influenceY = (currentRef.current.y - 0.5) * height * 0.12 * intensity;

        blob.x = blob.baseX + driftX + influenceX;
        blob.y = blob.baseY + driftY + influenceY;

        const gradient = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, blob.radius);
        if (blob.color === 'violet') {
          gradient.addColorStop(0, 'rgba(139, 92, 246, 0.18)');
          gradient.addColorStop(0.4, 'rgba(139, 92, 246, 0.06)');
          gradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
        } else {
          gradient.addColorStop(0, 'rgba(34, 211, 238, 0.18)');
          gradient.addColorStop(0.4, 'rgba(34, 211, 238, 0.06)');
          gradient.addColorStop(1, 'rgba(34, 211, 238, 0)');
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        const sides = 8;
        for (let j = 0; j < sides; j++) {
          const angle = (j / sides) * Math.PI * 2 + t * 0.1;
          const r = blob.radius * (0.85 + 0.15 * Math.sin(t * 1.3 + j));
          const px = blob.x + Math.cos(angle) * r;
          const py = blob.y + Math.sin(angle) * r;
          if (j === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
      });

      raf = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', initBlobs);
      window.removeEventListener('mousemove', handleMove);
      cancelAnimationFrame(raf);
    };
  }, [blobCount, intensity, interactive, isLowTier]);

  if (isLowTier) {
    return (
      <div
        className={`fixed inset-0 -z-10 ${className}`}
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 20% 20%, color-mix(in oklch, var(--lc-brand-violet) 8%, transparent) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 80% 80%, color-mix(in oklch, var(--lc-brand-cyan) 8%, transparent) 0%, transparent 60%),
            radial-gradient(ellipse 50% 50% at 50% 50%, color-mix(in oklch, var(--lc-brand-violet) 4%, transparent) 0%, transparent 70%)
          `,
        }}
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 -z-10 ${className}`}
      style={{ touchAction: 'none' }}
      aria-hidden="true"
    />
  );
}
