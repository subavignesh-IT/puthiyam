import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface UIStyle {
  name: string;
  label: string;
  description: string;
  css: string;
}

export const UI_STYLES: UIStyle[] = [
  {
    name: 'default',
    label: '🎯 Classic Clean',
    description: 'Simple and clean with subtle shadows',
    css: `
      --ui-radius: 0.75rem;
      --ui-card-border: 1px solid hsl(var(--border));
      --ui-hover-scale: 1.02;
      --ui-transition: 0.2s ease;
      --ui-card-shadow: 0 1px 3px rgba(0,0,0,0.1);
      --ui-btn-radius: 0.5rem;
    `
  },
  {
    name: 'glassmorphism',
    label: '🪟 Glass Effect',
    description: 'Frosted glass with blur effects',
    css: `
      --ui-radius: 1rem;
      --ui-card-border: 1px solid rgba(255,255,255,0.2);
      --ui-hover-scale: 1.03;
      --ui-transition: 0.3s ease;
      --ui-card-shadow: 0 8px 32px rgba(0,0,0,0.1);
      --ui-btn-radius: 0.75rem;
    `
  },
  {
    name: 'neumorphism',
    label: '🔘 Soft 3D',
    description: 'Soft raised elements with depth',
    css: `
      --ui-radius: 1.25rem;
      --ui-card-border: none;
      --ui-hover-scale: 1.01;
      --ui-transition: 0.25s ease;
      --ui-card-shadow: 8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.05);
      --ui-btn-radius: 1rem;
    `
  },
  {
    name: 'flat',
    label: '📐 Flat Modern',
    description: 'No shadows, bold colors, sharp edges',
    css: `
      --ui-radius: 0.25rem;
      --ui-card-border: 2px solid hsl(var(--primary));
      --ui-hover-scale: 1;
      --ui-transition: 0.15s ease;
      --ui-card-shadow: none;
      --ui-btn-radius: 0.25rem;
    `
  },
  {
    name: 'rounded',
    label: '🫧 Bubble Round',
    description: 'Extra rounded with playful feel',
    css: `
      --ui-radius: 2rem;
      --ui-card-border: 1px solid hsl(var(--border));
      --ui-hover-scale: 1.05;
      --ui-transition: 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      --ui-card-shadow: 0 4px 20px rgba(0,0,0,0.08);
      --ui-btn-radius: 2rem;
    `
  },
  {
    name: 'elegant',
    label: '✨ Elegant Glow',
    description: 'Glowing borders and smooth animations',
    css: `
      --ui-radius: 0.75rem;
      --ui-card-border: 1px solid hsl(var(--primary) / 0.3);
      --ui-hover-scale: 1.02;
      --ui-transition: 0.4s ease;
      --ui-card-shadow: 0 0 20px hsl(var(--primary) / 0.1);
      --ui-btn-radius: 0.5rem;
    `
  },
  {
    name: 'brutalist',
    label: '🏗️ Bold Brutalist',
    description: 'Thick borders and strong contrast',
    css: `
      --ui-radius: 0;
      --ui-card-border: 3px solid hsl(var(--foreground));
      --ui-hover-scale: 1;
      --ui-transition: 0.1s ease;
      --ui-card-shadow: 4px 4px 0 hsl(var(--foreground));
      --ui-btn-radius: 0;
    `
  },
  {
    name: 'minimal',
    label: '🤍 Ultra Minimal',
    description: 'Borderless with subtle spacing',
    css: `
      --ui-radius: 0.5rem;
      --ui-card-border: none;
      --ui-hover-scale: 1.01;
      --ui-transition: 0.2s ease;
      --ui-card-shadow: 0 1px 2px rgba(0,0,0,0.05);
      --ui-btn-radius: 0.5rem;
    `
  },
  {
    name: 'retro',
    label: '🕹️ Retro Pixel',
    description: 'Pixelated feel with bold shadows',
    css: `
      --ui-radius: 0;
      --ui-card-border: 2px solid hsl(var(--primary));
      --ui-hover-scale: 1.03;
      --ui-transition: 0.15s steps(3);
      --ui-card-shadow: 6px 6px 0 hsl(var(--primary) / 0.3);
      --ui-btn-radius: 0;
    `
  },
  {
    name: 'aurora',
    label: '🌈 Aurora Flow',
    description: 'Gradient borders and flowing animations',
    css: `
      --ui-radius: 1rem;
      --ui-card-border: 1px solid hsl(var(--accent) / 0.4);
      --ui-hover-scale: 1.03;
      --ui-transition: 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      --ui-card-shadow: 0 4px 30px hsl(var(--accent) / 0.15);
      --ui-btn-radius: 0.75rem;
    `
  },
  {
    name: 'neon',
    label: '💡 Neon Glow',
    description: 'Bright neon borders and glow effects',
    css: `
      --ui-radius: 0.5rem;
      --ui-card-border: 1px solid hsl(var(--primary) / 0.6);
      --ui-hover-scale: 1.04;
      --ui-transition: 0.3s ease;
      --ui-card-shadow: 0 0 15px hsl(var(--primary) / 0.3), inset 0 0 15px hsl(var(--primary) / 0.05);
      --ui-btn-radius: 0.5rem;
    `
  },
  {
    name: 'cozy',
    label: '🧸 Cozy Warm',
    description: 'Warm tones with soft rounded edges',
    css: `
      --ui-radius: 1.5rem;
      --ui-card-border: 1px solid hsl(var(--border));
      --ui-hover-scale: 1.02;
      --ui-transition: 0.35s ease;
      --ui-card-shadow: 0 6px 25px rgba(0,0,0,0.06);
      --ui-btn-radius: 1.5rem;
    `
  },
];

interface UIStyleContextType {
  currentStyle: string;
  setStyle: (styleName: string) => void;
  styles: UIStyle[];
}

const UIStyleContext = createContext<UIStyleContextType>({
  currentStyle: 'default',
  setStyle: () => {},
  styles: UI_STYLES,
});

export const UIStyleProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [currentStyle, setCurrentStyle] = useState(() => {
    return localStorage.getItem('app-ui-style') || 'default';
  });

  useEffect(() => {
    const style = UI_STYLES.find(s => s.name === currentStyle);
    if (!style) return;
    const root = document.documentElement;

    // Parse and apply CSS variables
    style.css.split('\n').forEach(line => {
      const match = line.trim().match(/^(--[\w-]+):\s*(.+);$/);
      if (match) {
        root.style.setProperty(match[1], match[2]);
      }
    });

    // Apply style-specific body classes
    root.setAttribute('data-ui-style', currentStyle);
  }, [currentStyle]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('theme')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        // We'll store ui_style in localStorage only for now
      });
  }, [user]);

  const setStyle = (styleName: string) => {
    setCurrentStyle(styleName);
    localStorage.setItem('app-ui-style', styleName);
  };

  return (
    <UIStyleContext.Provider value={{ currentStyle, setStyle, styles: UI_STYLES }}>
      {children}
    </UIStyleContext.Provider>
  );
};

export const useUIStyle = () => useContext(UIStyleContext);
