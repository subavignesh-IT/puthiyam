import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Clock, AlertCircle, Loader2, XCircle, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface QRCodePaymentProps {
  total: number;
  onPaymentComplete: () => void;
  onBack: () => void;
  onTimeout: () => void;
}

const QRCodePayment: React.FC<QRCodePaymentProps> = ({ total, onPaymentComplete, onBack, onTimeout }) => {
  const { user } = useAuth();
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes in seconds

  // PhonePe / GPay backend flow state
  const [gpayLoading, setGpayLoading] = useState(false);
  const [gpayPolling, setGpayPolling] = useState(false);
  const [gpayTxnId, setGpayTxnId] = useState<string | null>(null);
  const pollRef = useRef<number | null>(null);
  const pollStopRef = useRef(false);

  // Timer countdown - Auto cancel on timeout
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto cancel - no confirmation needed
          onTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onTimeout]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const stopPolling = () => {
    pollStopRef.current = true;
    if (pollRef.current) {
      clearTimeout(pollRef.current);
      pollRef.current = null;
    }
    setGpayPolling(false);
  };

  useEffect(() => () => stopPolling(), []);

  const pollStatus = async (txnId: string) => {
    pollStopRef.current = false;
    setGpayPolling(true);
    const started = Date.now();
    const maxMs = 9 * 60 * 1000; // stop polling 1 min before timer expires
    const tick = async () => {
      if (pollStopRef.current) return;
      try {
        const { data, error } = await supabase.functions.invoke('phonepe-status', {
          body: { merchantTransactionId: txnId },
        });
        if (error) throw error;
        if (data?.status === 'PAID') {
          stopPolling();
          toast({ title: 'Payment Successful', description: `₹${total} received. Confirming your order...` });
          onPaymentComplete();
          return;
        }
        if (data?.status === 'FAILED') {
          stopPolling();
          toast({ title: 'Payment Failed', description: 'Your payment did not go through. Try again.', variant: 'destructive' });
          setGpayTxnId(null);
          return;
        }
      } catch (e) {
        console.error('status poll failed', e);
      }
      if (Date.now() - started > maxMs) { stopPolling(); return; }
      pollRef.current = window.setTimeout(tick, 3000);
    };
    tick();
  };

  const handlePayWithGpay = async () => {
    if (gpayLoading || gpayPolling) return;
    setGpayLoading(true);
    try {
      const orderRef = `ORD${Date.now()}`;
      const { data, error } = await supabase.functions.invoke('phonepe-initiate', {
        body: {
          amount: total,
          orderId: orderRef,
          userId: user?.id || 'guest',
          redirectUrl: window.location.href,
        },
      });
      if (error) throw error;
      if (!data?.redirectUrl || !data?.merchantTransactionId) {
        throw new Error(data?.error || 'Failed to start payment');
      }
      setGpayTxnId(data.merchantTransactionId);
      // Open PhonePe payment page (will route to GPay/UPI app)
      window.open(data.redirectUrl, '_blank');
      toast({
        title: 'Complete payment in the opened tab',
        description: 'We are checking the status automatically. Your order confirms once payment succeeds.',
        duration: 8000,
      });
      pollStatus(data.merchantTransactionId);
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Could not start payment', description: e?.message || 'Try again.', variant: 'destructive' });
    } finally {
      setGpayLoading(false);
    }
  };

  const handleCancelGpay = () => {
    stopPolling();
    setGpayTxnId(null);
    toast({ title: 'Payment cancelled', description: 'Your order has NOT been placed.', variant: 'destructive' });
  };

  return (
    <Card className="animate-fade-in">
        <CardHeader>
          <Button variant="ghost" size="sm" onClick={() => { stopPolling(); onBack(); }} className="w-fit -ml-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <CardTitle className="font-serif text-center">Secure Payment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Timer - Highlighted when low */}
          <div className={`flex items-center justify-center gap-2 p-3 rounded-lg ${
            timeRemaining < 120 ? 'bg-destructive text-destructive-foreground animate-pulse' : 'bg-muted'
          }`}>
            <Clock className="w-5 h-5" />
            <span className="font-medium">Time remaining: {formatTime(timeRemaining)}</span>
          </div>

          {timeRemaining < 120 && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg text-destructive text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>Order will be auto-cancelled when timer expires</span>
            </div>
          )}

          <div className="text-center">
            <p className="text-muted-foreground mb-2">Amount to Pay</p>
            <p className="text-3xl font-bold text-primary">₹{total}</p>
          </div>

          {/* Pay with GPay via PhonePe (verified by backend) */}
          <div className="space-y-2">
            {!gpayPolling ? (
              <Button
                onClick={handlePayWithGpay}
                disabled={gpayLoading}
                className="w-full gradient-hero text-primary-foreground h-12"
              >
                {gpayLoading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Starting secure payment...</>
                ) : (
                  <>Pay ₹{total} with GPay (Secure)</>
                )}
              </Button>
            ) : (
              <div className="space-y-2 p-3 rounded-lg border border-primary/40 bg-primary/5">
                <div className="flex items-center gap-2 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span>Waiting for payment confirmation from PhonePe...</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Your order confirms automatically once the payment succeeds. If you closed the GPay tab without paying, cancel below.
                </p>
                <Button variant="destructive" size="sm" onClick={handleCancelGpay} className="w-full">
                  <XCircle className="w-4 h-4 mr-2" /> Cancel Payment
                </Button>
              </div>
            )}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
              <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span>
                Your order is placed <strong>only after</strong> we receive payment confirmation from PhonePe.
                Simply opening and closing a UPI app will <strong>not</strong> mark this order as paid.
              </span>
            </div>
          </div>
        </CardContent>
    </Card>
  );
};

export default QRCodePayment;
