import React from 'react';
import { Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useUIStyle } from '@/hooks/useUIStyle';
import { ScrollArea } from '@/components/ui/scroll-area';

const UIStyleSwitcher: React.FC = () => {
  const { currentStyle, setStyle, styles } = useUIStyle();
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-muted/50 transition-all duration-200 hover:scale-110 active:scale-95"
        >
          <Layers className="w-5 h-5 text-primary" />
        </Button>
      </DialogTrigger>
      <DialogContent className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-lg w-[92vw] sm:w-full animate-scale-in border-2 border-primary/30 shadow-elevated">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Choose UI Style</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[400px] pr-4">
          <div className="grid grid-cols-2 gap-3">
            {styles.map((style) => (
              <button
                key={style.name}
                onClick={() => {
                  setStyle(style.name);
                  setOpen(false);
                }}
                className={`group relative p-4 rounded-lg border text-left transition-all duration-300 hover:scale-[1.03] hover:shadow-lg ${
                  currentStyle === style.name
                    ? 'border-primary bg-primary/10 shadow-md ring-2 ring-primary/30'
                    : 'border-border bg-card hover:border-primary/50 hover:bg-muted/50'
                }`}
              >
                <div className="text-lg mb-1">{style.label}</div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {style.description}
                </p>
                {currentStyle === style.name && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-primary-foreground text-xs">✓</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default UIStyleSwitcher;
