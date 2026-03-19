import React, { useState, useEffect } from 'react';
import { Check, Gift, PartyPopper } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const StampCard: React.FC = () => {
  const { user } = useAuth();
  const [orderCount, setOrderCount] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [loading, setLoading] = useState(true);

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
        const stamps = count % 11; // Reset after every 11th order cycle
        setOrderCount(stamps);
        
        // Show celebration if they just completed 10
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

  return (
    <>
      <div className="bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/20 border border-primary/20 rounded-2xl p-5 animate-fade-in">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            <h3 className="font-serif font-bold text-foreground text-lg">Loyalty Card</h3>
          </div>
          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full">
            {stamps}/10
          </span>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          {isComplete
            ? '🎉 You earned a special offer on your next order!'
            : `Complete ${10 - stamps} more order${10 - stamps !== 1 ? 's' : ''} to unlock a special offer!`}
        </p>

        <div className="flex items-center justify-between gap-1.5">
          {Array.from({ length: 10 }, (_, i) => {
            const filled = i < stamps;
            return (
              <div
                key={i}
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300
                  ${filled
                    ? 'bg-primary border-primary text-primary-foreground scale-105 shadow-md'
                    : 'border-muted-foreground/30 bg-background text-muted-foreground/40'
                  }
                `}
              >
                {filled ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <span className="text-[10px] font-bold">{i + 1}</span>
                )}
              </div>
            );
          })}
        </div>

        {isComplete && (
          <div className="mt-4 bg-primary/10 border border-primary/30 rounded-xl p-3 text-center animate-scale-in">
            <p className="text-sm font-semibold text-primary">🎁 Special Offer Unlocked!</p>
            <p className="text-xs text-muted-foreground mt-1">Apply it on your 11th order</p>
          </div>
        )}
      </div>

      {/* Celebration Popup */}
      <Dialog open={showCelebration} onOpenChange={setShowCelebration}>
        <DialogContent className="text-center max-w-sm">
          <DialogHeader className="items-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2 animate-scale-in">
              <PartyPopper className="w-10 h-10 text-primary" />
            </div>
            <DialogTitle className="font-serif text-2xl">🎉 Congratulations!</DialogTitle>
            <DialogDescription className="text-base mt-2">
              You've completed 10 orders! You've unlocked a <strong className="text-primary">special offer</strong> on your next order. Thank you for being a loyal customer!
            </DialogDescription>
          </DialogHeader>
          <div className="text-4xl animate-fade-in mt-2">🎊🥳🎁</div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default StampCard;
