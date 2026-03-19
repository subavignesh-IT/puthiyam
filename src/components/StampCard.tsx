import React, { useState, useEffect } from 'react';
import { Check, Gift, PartyPopper, Sparkles, Star, Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const StampCard: React.FC = () => {
  const { user } = useAuth();
  const [orderCount, setOrderCount] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [loading, setLoading] = useState(true);
  const [flipped, setFlipped] = useState(false);
  const [hoveredStamp, setHoveredStamp] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      fetchOrderCount();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchOrderCount = async () => {
    try {
      const { count, error } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id);

      if (!error && count !== null) {
        const stamps = count % 11;
        setOrderCount(stamps);
        if (stamps === 10) {
          setShowCelebration(true);
        }
      }
    } catch (err) {
      console.error('Error fetching order count:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user || loading) return null;

  const stamps = Math.min(orderCount, 10);
  const isComplete = stamps >= 10;
  const progressPercent = (stamps / 10) * 100;

  return (
    <>
      <div
        className="perspective-1000 cursor-pointer select-none"
        onClick={() => setFlipped(!flipped)}
      >
        <div
          className={`relative transition-transform duration-700 transform-style-3d ${flipped ? '[transform:rotateY(180deg)]' : ''}`}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Front Side */}
          <div
            className="bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/20 border border-primary/20 rounded-2xl p-5 animate-fade-in"
            style={{ backfaceVisibility: 'hidden' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 group">
                <div className="relative">
                  <Gift className="w-5 h-5 text-primary transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12" />
                  {isComplete && (
                    <Sparkles className="w-3 h-3 text-accent absolute -top-1 -right-1 animate-pulse" />
                  )}
                </div>
                <h3 className="font-serif font-bold text-foreground text-lg transition-colors duration-200 group-hover:text-primary">
                  Loyalty Card
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full transition-all duration-300 hover:bg-primary/10 hover:text-primary">
                  {stamps}/10
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200 hover:rotate-180"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFlipped(!flipped);
                  }}
                >
                  <Star className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 bg-muted rounded-full mb-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <p className="text-xs text-muted-foreground mb-4 transition-all duration-300">
              {isComplete
                ? '🎉 You earned a special offer on your next order!'
                : `Complete ${10 - stamps} more order${10 - stamps !== 1 ? 's' : ''} to unlock a special offer!`}
            </p>

            {/* Stamp circles */}
            <TooltipProvider delayDuration={200}>
              <div className="grid grid-cols-5 gap-3">
                {Array.from({ length: 10 }, (_, i) => {
                  const filled = i < stamps;
                  const isNext = i === stamps && !isComplete;
                  return (
                    <Tooltip key={i}>
                      <TooltipTrigger asChild>
                        <div
                          onMouseEnter={() => setHoveredStamp(i)}
                          onMouseLeave={() => setHoveredStamp(null)}
                          className={`
                            w-8 h-8 rounded-full flex items-center justify-center border-2 
                            transition-all duration-300 cursor-pointer
                            ${filled
                              ? 'bg-primary border-primary text-primary-foreground shadow-md hover:shadow-lg hover:scale-110'
                              : isNext
                                ? 'border-primary/50 bg-primary/5 text-primary/50 animate-pulse hover:scale-110 hover:border-primary hover:bg-primary/10'
                                : 'border-muted-foreground/30 bg-background text-muted-foreground/40 hover:border-muted-foreground/60 hover:scale-105'
                            }
                            ${hoveredStamp === i ? 'ring-2 ring-primary/30 ring-offset-1' : ''}
                          `}
                          style={{
                            animationDelay: filled ? `${i * 100}ms` : '0ms',
                          }}
                        >
                          {filled ? (
                            <Check className={`w-4 h-4 transition-transform duration-200 ${hoveredStamp === i ? 'scale-125' : ''}`} />
                          ) : (
                            <span className="text-[10px] font-bold">{i + 1}</span>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        {filled ? `Order ${i + 1} ✅` : isNext ? 'Next stamp!' : `Order ${i + 1}`}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </TooltipProvider>

            {/* Completed banner */}
            {isComplete && (
              <div className="mt-4 bg-primary/10 border border-primary/30 rounded-xl p-3 text-center animate-scale-in group/banner hover:bg-primary/15 transition-all duration-300 cursor-pointer">
                <p className="text-sm font-semibold text-primary flex items-center justify-center gap-1.5">
                  <Trophy className="w-4 h-4 transition-transform duration-300 group-hover/banner:scale-125 group-hover/banner:rotate-12" />
                  Special Offer Unlocked!
                </p>
                <p className="text-xs text-muted-foreground mt-1">Apply it on your 11th order</p>
              </div>
            )}

            <p className="text-[10px] text-muted-foreground/50 text-center mt-3 transition-opacity duration-300 hover:opacity-100 opacity-60">
              Tap card to see rewards info →
            </p>
          </div>

          {/* Back Side */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-primary/15 via-secondary/10 to-accent/15 border border-primary/20 rounded-2xl p-5 [transform:rotateY(180deg)]"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif font-bold text-foreground text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                How it Works
              </h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200 hover:rotate-180"
                onClick={(e) => {
                  e.stopPropagation();
                  setFlipped(false);
                }}
              >
                <Star className="w-3.5 h-3.5" />
              </Button>
            </div>
            <div className="space-y-3 text-sm">
              {[
                { emoji: '🛒', text: 'Place an order to earn a stamp' },
                { emoji: '🎯', text: 'Collect 10 stamps to complete the card' },
                { emoji: '🎁', text: 'Get a special offer on your 11th order!' },
                { emoji: '🔄', text: 'Card resets — earn rewards again!' },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-2 rounded-lg transition-all duration-200 hover:bg-primary/10 hover:translate-x-1 cursor-default group/item"
                >
                  <span className="text-lg transition-transform duration-300 group-hover/item:scale-125">{item.emoji}</span>
                  <span className="text-muted-foreground group-hover/item:text-foreground transition-colors duration-200">{item.text}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground/50 text-center mt-4 opacity-60">
              ← Tap to flip back
            </p>
          </div>
        </div>
      </div>

      {/* Celebration Popup */}
      <Dialog open={showCelebration} onOpenChange={setShowCelebration}>
        <DialogContent className="text-center max-w-sm">
          <DialogHeader className="items-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2 animate-scale-in">
              <PartyPopper className="w-10 h-10 text-primary animate-bounce" />
            </div>
            <DialogTitle className="font-serif text-2xl">🎉 Congratulations!</DialogTitle>
            <DialogDescription className="text-base mt-2">
              You've completed 10 orders! You've unlocked a <strong className="text-primary">special offer</strong> on your next order. Thank you for being a loyal customer!
            </DialogDescription>
          </DialogHeader>
          <div className="text-4xl animate-fade-in mt-2 flex justify-center gap-2">
            <span className="inline-block animate-bounce" style={{ animationDelay: '0ms' }}>🎊</span>
            <span className="inline-block animate-bounce" style={{ animationDelay: '150ms' }}>🥳</span>
            <span className="inline-block animate-bounce" style={{ animationDelay: '300ms' }}>🎁</span>
          </div>
          <Button
            className="mt-4 w-full group/btn hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            onClick={() => setShowCelebration(false)}
          >
            <Sparkles className="w-4 h-4 mr-2 transition-transform duration-300 group-hover/btn:rotate-45" />
            Claim My Reward
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default StampCard;
