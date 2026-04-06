import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Theme {
  name: string;
  label: string;
  colors: Record<string, string>;
}

export const THEMES: Theme[] = [
  { name: 'default', label: '🍂 Puthiyam Classic', colors: { '--primary': '25 90% 48%', '--accent': '35 85% 55%', '--background': '30 25% 97%', '--foreground': '20 20% 15%', '--card': '30 30% 99%', '--muted': '30 15% 92%', '--secondary': '145 35% 35%' } },
  { name: 'ocean', label: '🌊 Ocean Blue', colors: { '--primary': '210 80% 50%', '--accent': '190 70% 50%', '--background': '210 30% 97%', '--foreground': '210 20% 15%', '--card': '210 30% 99%', '--muted': '210 15% 92%', '--secondary': '180 40% 40%' } },
  { name: 'forest', label: '🌲 Forest Green', colors: { '--primary': '150 60% 35%', '--accent': '120 50% 45%', '--background': '140 20% 97%', '--foreground': '150 20% 12%', '--card': '140 20% 99%', '--muted': '140 15% 92%', '--secondary': '160 40% 30%' } },
  { name: 'rose', label: '🌹 Rose Pink', colors: { '--primary': '340 75% 55%', '--accent': '330 60% 60%', '--background': '340 20% 97%', '--foreground': '340 20% 15%', '--card': '340 25% 99%', '--muted': '340 15% 92%', '--secondary': '300 30% 40%' } },
  { name: 'sunset', label: '🌅 Sunset Orange', colors: { '--primary': '15 85% 55%', '--accent': '30 90% 55%', '--background': '20 25% 97%', '--foreground': '15 25% 12%', '--card': '20 30% 99%', '--muted': '20 15% 92%', '--secondary': '350 50% 45%' } },
  { name: 'lavender', label: '💜 Lavender Dream', colors: { '--primary': '270 60% 55%', '--accent': '280 50% 65%', '--background': '270 20% 97%', '--foreground': '270 20% 15%', '--card': '270 25% 99%', '--muted': '270 15% 93%', '--secondary': '240 40% 45%' } },
  { name: 'midnight', label: '🌙 Midnight Dark', colors: { '--primary': '220 70% 55%', '--accent': '200 60% 60%', '--background': '220 30% 10%', '--foreground': '220 15% 92%', '--card': '220 25% 14%', '--muted': '220 20% 18%', '--secondary': '200 40% 40%' } },
  { name: 'cherry', label: '🍒 Cherry Red', colors: { '--primary': '0 75% 50%', '--accent': '10 80% 55%', '--background': '0 15% 97%', '--foreground': '0 20% 12%', '--card': '0 20% 99%', '--muted': '0 10% 92%', '--secondary': '340 50% 40%' } },
  { name: 'gold', label: '✨ Royal Gold', colors: { '--primary': '42 90% 45%', '--accent': '38 85% 55%', '--background': '40 20% 97%', '--foreground': '40 25% 12%', '--card': '40 25% 99%', '--muted': '40 15% 92%', '--secondary': '25 50% 40%' } },
  { name: 'teal', label: '🧊 Cool Teal', colors: { '--primary': '175 65% 40%', '--accent': '185 55% 50%', '--background': '175 20% 97%', '--foreground': '175 25% 12%', '--card': '175 25% 99%', '--muted': '175 15% 92%', '--secondary': '190 40% 35%' } },
  { name: 'coral', label: '🪸 Coral Reef', colors: { '--primary': '16 80% 60%', '--accent': '25 75% 55%', '--background': '15 20% 97%', '--foreground': '15 25% 12%', '--card': '15 25% 99%', '--muted': '15 15% 92%', '--secondary': '180 40% 40%' } },
  { name: 'grape', label: '🍇 Grape Vine', colors: { '--primary': '290 55% 45%', '--accent': '310 50% 55%', '--background': '290 15% 97%', '--foreground': '290 20% 12%', '--card': '290 20% 99%', '--muted': '290 12% 92%', '--secondary': '260 40% 40%' } },
  { name: 'mint', label: '🌿 Fresh Mint', colors: { '--primary': '160 55% 42%', '--accent': '140 50% 50%', '--background': '155 25% 97%', '--foreground': '160 25% 12%', '--card': '155 25% 99%', '--muted': '155 15% 92%', '--secondary': '175 40% 35%' } },
  { name: 'amber', label: '🔥 Warm Amber', colors: { '--primary': '30 85% 50%', '--accent': '45 80% 50%', '--background': '35 20% 97%', '--foreground': '30 25% 12%', '--card': '35 25% 99%', '--muted': '35 15% 92%', '--secondary': '15 50% 40%' } },
  { name: 'sky', label: '☁️ Clear Sky', colors: { '--primary': '200 75% 50%', '--accent': '210 65% 55%', '--background': '200 25% 97%', '--foreground': '200 20% 12%', '--card': '200 25% 99%', '--muted': '200 15% 92%', '--secondary': '220 40% 40%' } },
  { name: 'plum', label: '🫐 Dark Plum', colors: { '--primary': '280 50% 40%', '--accent': '300 45% 50%', '--background': '280 20% 10%', '--foreground': '280 15% 90%', '--card': '280 18% 14%', '--muted': '280 15% 18%', '--secondary': '260 35% 45%' } },
  { name: 'sand', label: '🏖️ Sandy Beach', colors: { '--primary': '35 60% 50%', '--accent': '45 55% 55%', '--background': '35 25% 95%', '--foreground': '35 25% 15%', '--card': '35 25% 98%', '--muted': '35 15% 90%', '--secondary': '20 40% 40%' } },
  { name: 'slate', label: '🪨 Modern Slate', colors: { '--primary': '215 20% 45%', '--accent': '210 25% 55%', '--background': '215 15% 96%', '--foreground': '215 20% 12%', '--card': '215 15% 99%', '--muted': '215 10% 91%', '--secondary': '200 20% 38%' } },
  { name: 'emerald', label: '💎 Emerald Lux', colors: { '--primary': '145 65% 38%', '--accent': '160 55% 45%', '--background': '145 15% 97%', '--foreground': '145 25% 10%', '--card': '145 20% 99%', '--muted': '145 12% 92%', '--secondary': '170 40% 35%' } },
  { name: 'crimson', label: '🎭 Crimson Night', colors: { '--primary': '350 70% 45%', '--accent': '0 65% 55%', '--background': '350 20% 8%', '--foreground': '350 10% 92%', '--card': '350 18% 12%', '--muted': '350 15% 16%', '--secondary': '330 40% 40%' } },
  { name: 'peach', label: '🍑 Peach Blossom', colors: { '--primary': '20 70% 60%', '--accent': '15 65% 65%', '--background': '20 30% 97%', '--foreground': '20 25% 12%', '--card': '20 30% 99%', '--muted': '20 20% 92%', '--secondary': '10 40% 45%' } },
  { name: 'arctic', label: '❄️ Arctic Ice', colors: { '--primary': '195 70% 48%', '--accent': '185 60% 55%', '--background': '195 25% 97%', '--foreground': '195 20% 12%', '--card': '195 25% 99%', '--muted': '195 15% 93%', '--secondary': '210 35% 40%' } },
];

interface ThemeContextType {
  currentTheme: string;
  setTheme: (themeName: string) => void;
  themes: Theme[];
}

const ThemeContext = createContext<ThemeContextType>({
  currentTheme: 'default',
  setTheme: () => {},
  themes: THEMES,
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('app-theme') || 'default';
  });

  // Apply theme
  useEffect(() => {
    const theme = THEMES.find(t => t.name === currentTheme);
    if (!theme) return;
    const root = document.documentElement;
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
    // Update gradient
    const primary = theme.colors['--primary'];
    const accent = theme.colors['--accent'];
    root.style.setProperty('--gradient-hero', `linear-gradient(135deg, hsl(${primary}), hsl(${accent}))`);
    root.style.setProperty('--ring', primary);
    root.style.setProperty('--border', theme.colors['--muted']);
    root.style.setProperty('--input', theme.colors['--muted']);
    root.style.setProperty('--card-foreground', theme.colors['--foreground']);
    root.style.setProperty('--popover', theme.colors['--card']);
    root.style.setProperty('--popover-foreground', theme.colors['--foreground']);
    root.style.setProperty('--muted-foreground', theme.colors['--foreground'].replace(/\d+%$/, '45%'));
    root.style.setProperty('--primary-foreground', '0 0% 100%');
    root.style.setProperty('--secondary-foreground', '0 0% 100%');
    root.style.setProperty('--accent-foreground', theme.colors['--foreground']);
    root.style.setProperty('--destructive', '0 84% 60%');
    root.style.setProperty('--destructive-foreground', '0 0% 100%');
  }, [currentTheme]);

  // Load from DB on login
  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('theme')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        if (data?.theme && data.theme !== 'default') {
          setCurrentTheme(data.theme);
          localStorage.setItem('app-theme', data.theme);
        }
      });
  }, [user]);

  const setTheme = (themeName: string) => {
    setCurrentTheme(themeName);
    localStorage.setItem('app-theme', themeName);
    if (user) {
      supabase
        .from('profiles')
        .update({ theme: themeName } as any)
        .eq('user_id', user.id)
        .then(() => {});
    }
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
