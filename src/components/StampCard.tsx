import React, { useState, useEffect } from 'react';
import { Check, Gift, PartyPopper, Sparkles, Star, Trophy, Ticket, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { toast } from '@/hooks/use-toast';

const generateCouponCode = (phone: string, email: string): string => {
  const phonePart = (phone || '0000').replace(/\D/g, '').slice(0, 4).padEnd(4, '0');
  const emailPart = (email || 'user').replace(/@.*/, '').slice(0, 4).toUpperCase().padEnd(4, 'X');
  const now = new Date();
  const datePart = `${String(now.getDate()).padStart(2, '0')}${String(now.getMonth() + 1).padStart(2, '0')}`;
  return `${phonePart}${emailPart}${datePart}`;
};

const StampCard: React.FC = () => {
  const { user } = useAuth();
  const [orderCount, setOrderCount] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [loading, setLoading] = useState(true);
  const [flipped, setFlipped] = useState(false);
  const [hoveredStamp, setHoveredStamp] = useState<number | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [userPhone, setUserPhone] = useState('');
  const [loyaltyEnabled, setLoyaltyEnabled] = useState(true);
  const [hasPendingClaim, setHasPendingClaim] = useState(false);
  const [minAmount, setMinAmount] = useState(200);

  useEffect(() => {
    fetchMinAmount();
    if (user) {
      fetchUserProfile();
      fetchOrderCount();
      checkPendingClaim();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchMinAmount = async () => {
    try {
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'loyalty_min_amount')
        .single();
      if (data) setMinAmount(Number(data.value));
    } catch {}
  };

  const checkPendingClaim = async () => {
    const { data } = await supabase
      .from('loyalty_claims')
      .select('id, coupon_code')
      .eq('user_id', user!.id)
      .eq('is_redeemed', false)
      .order('created_at', { ascending: false })
      .limit(1);
    if (data && data.length > 0) {
      setHasPendingClaim(true);
      setCouponCode(data[0].coupon_code);
    }
  };

  const fetchUserProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('phone, loyalty_enabled')
      .eq('user_id', user!.id)
      .single();
    if (data?.phone) setUserPhone(data.phone);
    if (data && data.loyalty_enabled === false) setLoyaltyEnabled(false);
  };

  const fetchOrderCount = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, total, loyalty_coupon_code')
        .eq('user_id', user!.id)
        .gte('total', 200);

      if (!error && data) {
        // Count redeemed claims to know how many full cycles completed
        const { data: claims } = await supabase
          .from('loyalty_claims')
          .select('id')
          .eq('user_id', user!.id)
          .eq('is_redeemed', true);
        
        const redeemedCount = claims?.length || 0;
        
        // Qualifying orders = orders without loyalty coupon
        const qualifyingOrders = (data as any[]).filter(o => !o.loyalty_coupon_code);
        // Each redeemed claim consumed 10 stamps, so remaining stamps:
        const stamps = Math.max(0, qualifyingOrders.length - (redeemedCount * 10)) % 10;
        
        // Check for pending unredeemed claim
        const { data: pendingClaim } = await supabase
          .from('loyalty_claims')
          .select('id')
          .eq('user_id', user!.id)
          .eq('is_redeemed', false)
          .limit(1);
        
        if (pendingClaim && pendingClaim.length > 0) {
          // Has pending claim, show 0 stamps (already claimed, waiting to use)
          setOrderCount(0);
        } else if (qualifyingOrders.length - (redeemedCount * 10) >= 10) {
          // 10 stamps reached, auto-generate coupon and save claim
          setOrderCount(10);
          const code = generateCouponCode(userPhone || '', user!.email || '');
          setCouponCode(code);
          setShowCelebration(true);
        } else {
          setOrderCount(stamps);
        }
      }
    } catch (err) {
      console.error('Error fetching order count:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderCount >= 10 && user) {
      setCouponCode(generateCouponCode(userPhone, user.email || ''));
    }
  }, [userPhone, orderCount, user]);

  const handleClaimReward = async () => {
    if (!user) return;
    const code = generateCouponCode(userPhone, user.email || '');
    
    // Save claim to database
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('user_id', user.id)
      .single();

    await supabase.from('loyalty_claims').insert({
      user_id: user.id,
      customer_name: profile?.full_name || 'Customer',
      customer_phone: profile?.phone || '',
      coupon_code: code,
      stamps_completed: 10,
      is_redeemed: false,
    } as any);

    // Store for checkout use
    localStorage.setItem('loyaltyCoupon', JSON.stringify({
      code,
      stamps: 10,
      claimedAt: new Date().toISOString(),
    }));

    setCouponInput(code);
    setShowCelebration(false);
    setHasPendingClaim(true);
    setOrderCount(0); // Reset stamps immediately
    toast({ title: '🎟️ Coupon Ready!', description: 'Coupon code has been auto-filled. Click Apply to use it!' });
  };

  const handleCopyCoupon = async () => {
    try {
      await navigator.clipboard.writeText(couponCode);
      toast({ title: 'Copied!', description: 'Coupon code copied to clipboard' });
    } catch {
      toast({ title: 'Copy failed', description: couponCode, variant: 'destructive' });
    }
  };

  const handleCouponApply = async () => {
    if (couponInput.trim().toUpperCase() === couponCode.toUpperCase() && couponCode) {
      setCouponApplied(true);
      localStorage.setItem('loyaltyCoupon', JSON.stringify({
        code: couponCode,
        stamps: 10,
        claimedAt: new Date().toISOString(),
      }));

      // Mark claim as redeemed in DB
      await supabase
        .from('loyalty_claims')
        .update({ is_redeemed: true } as any)
        .eq('user_id', user!.id)
        .eq('coupon_code', couponCode)
        .eq('is_redeemed', false);

      setOrderCount(0);
      setHasPendingClaim(false);
      setCouponCode('');
      setCouponInput('');
      toast({
        title: '🎉 Coupon Applied!',
        description: 'Your loyalty reward will be shown on your bill!',
      });
      setTimeout(() => setCouponApplied(false), 2000);
    }
  };

  if (!user || loading || !loyaltyEnabled) return null;

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
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 group">
                <div className="relative">
                  <Gift className="w-5 h-5 text-primary transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12" />
                  {(isComplete || hasPendingClaim) && (
                    <Sparkles className="w-3 h-3 text-accent absolute -top-1 -right-1 animate-pulse" />
                  )}
                </div>
                <h3 className="font-serif font-bold text-foreground text-lg transition-colors duration-200 group-hover:text-primary">
                  Loyalty Card
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full">
                  {stamps}/10
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200 hover:rotate-180"
                  onClick={(e) => { e.stopPropagation(); setFlipped(!flipped); }}
                >
                  <Star className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            <div className="w-full h-1.5 bg-muted rounded-full mb-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <p className="text-xs text-muted-foreground mb-2">
              {hasPendingClaim
                ? '🎟️ You have a pending reward! Apply your coupon code below.'
                : isComplete
                  ? '🎉 You earned a special offer on your next order!'
                  : `Complete ${10 - stamps} more order${10 - stamps !== 1 ? 's' : ''} (₹200+) to unlock a special offer!`}
            </p>

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
                            w-12 h-12 rounded-full flex items-center justify-center border-2 mx-auto
                            transition-all duration-300 cursor-pointer
                            ${filled
                              ? 'bg-primary border-primary text-primary-foreground shadow-md hover:shadow-lg hover:scale-110'
                              : isNext
                                ? 'border-primary/50 bg-primary/5 text-primary/50 animate-pulse hover:scale-110 hover:border-primary hover:bg-primary/10'
                                : 'border-muted-foreground/30 bg-background text-muted-foreground/40 hover:border-muted-foreground/60 hover:scale-105'
                            }
                            ${hoveredStamp === i ? 'ring-2 ring-primary/30 ring-offset-1' : ''}
                          `}
                          style={{ animationDelay: filled ? `${i * 100}ms` : '0ms' }}
                        >
                          {filled ? (
                            <Check className={`w-5 h-5 transition-transform duration-200 ${hoveredStamp === i ? 'scale-125' : ''}`} />
                          ) : (
                            <span className="text-xs font-bold">{i + 1}</span>
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

            {(isComplete || hasPendingClaim) && couponCode && (
              <div className="mt-4 bg-primary/10 border border-primary/30 rounded-xl p-3 text-center animate-scale-in group/banner hover:bg-primary/15 transition-all duration-300">
                <p className="text-sm font-semibold text-primary flex items-center justify-center gap-1.5">
                  <Trophy className="w-4 h-4 transition-transform duration-300 group-hover/banner:scale-125 group-hover/banner:rotate-12" />
                  Special Offer Unlocked!
                </p>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <span className="font-mono font-bold text-primary">{couponCode}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-primary hover:bg-primary/20"
                    onClick={(e) => { e.stopPropagation(); handleCopyCoupon(); }}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Apply it on your next order</p>
              </div>
            )}

            <div className="mt-3" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-2">
                <Ticket className="w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Enter coupon code (optional)"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  className="h-8 text-xs font-mono"
                  onClick={(e) => e.stopPropagation()}
                />
                <Button
                  size="sm"
                  variant={couponApplied ? 'default' : 'outline'}
                  className="h-8 text-xs whitespace-nowrap"
                  onClick={(e) => { e.stopPropagation(); handleCouponApply(); }}
                  disabled={couponApplied || !couponInput.trim()}
                >
                  {couponApplied ? '✅ Applied' : 'Apply'}
                </Button>
              </div>
              {couponApplied && (
                <p className="text-[10px] text-green-600 mt-1 ml-6">Coupon applied! Card reset — earn rewards again!</p>
              )}
            </div>

            <p className="text-[10px] text-muted-foreground/50 text-center mt-3 opacity-60">
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
                onClick={(e) => { e.stopPropagation(); setFlipped(false); }}
              >
                <Star className="w-3.5 h-3.5" />
              </Button>
            </div>
            <div className="space-y-3 text-sm">
              {[
                { emoji: '🛒', text: 'Place an order of ₹200 or more to earn a stamp' },
                { emoji: '🎯', text: 'Collect 10 stamps to complete the card' },
                { emoji: '🎟️', text: 'Get a unique coupon code on completion!' },
                { emoji: '🎁', text: 'Apply coupon for a special offer on your next order!' },
                { emoji: '🔄', text: 'Card resets after claim — earn rewards again!' },
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
              You've completed 10 qualifying orders! Your coupon code is:
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted rounded-lg p-3 my-2 flex items-center justify-center gap-2">
            <p className="font-mono text-xl font-bold text-primary tracking-wider">{couponCode}</p>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopyCoupon}>
              <Copy className="w-4 h-4 text-primary" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Enter this code on your next order for a <strong className="text-primary">special offer</strong>!
          </p>
          <div className="text-4xl animate-fade-in mt-2 flex justify-center gap-2">
            <span className="inline-block animate-bounce" style={{ animationDelay: '0ms' }}>🎊</span>
            <span className="inline-block animate-bounce" style={{ animationDelay: '150ms' }}>🥳</span>
            <span className="inline-block animate-bounce" style={{ animationDelay: '300ms' }}>🎁</span>
          </div>
          <Button
            className="mt-4 w-full group/btn hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            onClick={handleClaimReward}
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
