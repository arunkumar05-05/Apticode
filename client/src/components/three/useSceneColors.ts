import React from 'react';

export interface SceneColors {
  violet: string;
  cyan: string;
  accent: string;
  amber: string;
  isLight: boolean;
}

export function useSceneColors(): SceneColors {
  const [theme, setTheme] = React.useState<'dark' | 'light'>(
    () => (document.documentElement.classList.contains('light') ? 'light' : 'dark')
  );

  React.useEffect(() => {
    const obs = new MutationObserver(() => {
      setTheme(document.documentElement.classList.contains('light') ? 'light' : 'dark');
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  const violet = theme === 'dark' ? '#a78bfa' : '#7c3aed';
  const cyan = theme === 'dark' ? '#22d3ee' : '#0891b2';
  const accent = theme === 'dark' ? '#e879f9' : '#a21caf';
  const amber = theme === 'dark' ? '#fbbf24' : '#d97706';

  return { violet, cyan, accent, amber, isLight: theme === 'light' };
}
