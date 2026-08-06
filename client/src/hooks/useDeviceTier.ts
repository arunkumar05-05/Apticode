import { useEffect, useState } from 'react';

export type DeviceTier = 'high' | 'mid' | 'low';

interface DeviceInfo {
  tier: DeviceTier;
  prefersReducedMotion: boolean;
  isMobile: boolean;
  dpr: number;
  gpuTier?: 'high' | 'mid' | 'low';
}

export function useDeviceTier(): DeviceInfo {
  const [info, setInfo] = useState<DeviceInfo>({
    tier: 'high',
    prefersReducedMotion: false,
    isMobile: false,
    dpr: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
  });

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const check = () => {
      const reduced = mq.matches;
      const mobile = window.innerWidth < 768 || /Mobi|Android/i.test(navigator.userAgent);
      const dpr = window.devicePixelRatio;

      let tier: DeviceTier = 'high';
      if (reduced) {
        tier = 'low';
      } else if (mobile || dpr > 2) {
        tier = 'mid';
      }

      setInfo({ tier, prefersReducedMotion: reduced, isMobile: mobile, dpr });
    };

    check();
    mq.addEventListener?.('change', check);
    window.addEventListener('resize', check);
    return () => {
      mq.removeEventListener?.('change', check);
      window.removeEventListener('resize', check);
    };
  }, []);

  return info;
}