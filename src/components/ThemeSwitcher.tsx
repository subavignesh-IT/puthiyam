import React from 'react';
import { Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/hooks/useTheme';
import { ScrollArea } from '@/components/ui/scroll-area';

const ThemeSwitcher: React.FC = () => {
  const { currentTheme, setTheme, themes } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-muted/50 transition-all duration-200 hover:scale-110 active:scale-95"
        >
          <Palette className="w-5 h-5 text-primary" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 max-h-[400px]">
        <ScrollArea className="h-[380px]">
          {themes.map((theme) => (
            <DropdownMenuItem
              key={theme.name}
              onClick={() => setTheme(theme.name)}
              className={`cursor-pointer flex items-center gap-2 transition-colors ${
                currentTheme === theme.name ? 'bg-primary/10 font-semibold' : ''
              }`}
            >
              <div
                className="w-4 h-4 rounded-full border flex-shrink-0"
                style={{ backgroundColor: `hsl(${theme.colors['--primary']})` }}
              />
              <span className="text-sm">{theme.label}</span>
              {currentTheme === theme.name && (
                <span className="ml-auto text-primary">✓</span>
              )}
            </DropdownMenuItem>
          ))}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ThemeSwitcher;
