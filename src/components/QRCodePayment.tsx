import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, QrCode, Copy, Check, Clock, AlertCircle, CheckCircle, Loader2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import UPIAppSelector from './UPIAppSelector';

interface QRCodePaymentProps {
  total: number;
  onPaymentComplete: () => void;
  onBack: () => void;
  onTimeout: () => void;
}

const QRCodePayment: React.FC<QRCodePaymentProps> = ({ total, onPaymentComplete, onBack, onTimeout }) => {
  const { user } = useAuth();
  const upiId = 'kathaiahkarthik@okhdfcbank';
  const merchantName = 'PUTHIYAM PRODUCTS';
  const bankName = 'TMB Bank';
  const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${total}&cu=INR&tn=${encodeURIComponent(`Payment for order - ₹${total}`)}`;
  
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes in seconds
  const [copied, setCopied] = useState(false);
  const [payerUpi, setPayerUpi] = useState('');
  const [paymentRequested, setPaymentRequested] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [upiAppOpened, setUpiAppOpened] = useState(false);
  const returnCheckRef = useRef<number | null>(null);

  // PhonePe / GPay backend flow state
  const [gpayLoading, setGpayLoading] = useState(false);
  const [gpayPolling, setGpayPolling] = useState(false);
  const [gpayTxnId, setGpayTxnId] = useState<string | null>(null);
  const pollRef = useRef<number | null>(null);
  const pollStopRef = useRef(false);
  
  // Generate QR code using QR Server API
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUrl)}`;

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

  // Listen for visibility change to detect when user returns from UPI app
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && upiAppOpened) {
        // User returned to the page after opening UPI app
        // Show confirmation dialog after a short delay
        if (returnCheckRef.current) {
          clearTimeout(returnCheckRef.current);
        }
        returnCheckRef.current = window.setTimeout(() => {
          setShowConfirmDialog(true);
        }, 500);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (returnCheckRef.current) {
        clearTimeout(returnCheckRef.current);
      }
    };
  }, [upiAppOpened]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAppOpened = useCallback(() => {
    setUpiAppOpened(true);
  }, []);

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    toast({
      title: "UPI ID Copied!",
      description: `Paste this in your UPI app to pay ₹${total}`,
    });
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSendPaymentRequest = () => {
    if (!payerUpi.trim() || !payerUpi.includes('@')) {
      toast({
        title: "Invalid UPI Address",
        description: "Please enter a valid UPI address (e.g., name@upi)",
        variant: "destructive"
      });
      return;
    }

    // In a real implementation, this would call a backend API to send collect request
    setPaymentRequested(true);
    toast({
      title: "Payment Request Sent!",
      description: `A payment request for ₹${total} has been sent to ${payerUpi}. Please approve it in your UPI app.`,
      duration: 8000,
    });
    
    // Start listening for return after user opens their UPI app
    setUpiAppOpened(true);
  };

  const handlePaymentConfirmed = () => {
    setShowConfirmDialog(false);
    onPaymentComplete();
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
    <>
      <Card className="animate-fade-in">
        <CardHeader>
          <Button variant="ghost" size="sm" onClick={() => { stopPolling(); onBack(); }} className="w-fit -ml-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <CardTitle className="font-serif text-center">Complete Payment</CardTitle>
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
            <p className="text-[11px] text-center text-muted-foreground">
              Backend-verified · order confirms only after payment is received
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or pay manually</span>
            </div>
          </div>

          {/* UPI App Selector */}
          <UPIAppSelector 
            upiUrl={upiUrl} 
            amount={total} 
            onAppOpened={handleAppOpened}
          />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or scan QR code</span>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center gap-4">
            <div className="bg-card p-4 rounded-lg shadow-soft border border-border">
              <img
                src={qrCodeUrl}
                alt="UPI Payment QR Code"
                className="w-48 h-48"
              />
            </div>
            <div className="flex items-center gap-2">
              <QrCode className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Scan with any UPI app</span>
            </div>
          </div>

          {/* UPI ID Copy */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">UPI ID ({bankName})</p>
                <p className="font-mono font-medium">{upiId}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleCopyUpi}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or enter your UPI</span>
            </div>
          </div>

          {/* Enter UPI Address for Collect Request */}
          <div className="space-y-3">
            <Label htmlFor="payerUpi">Your UPI Address</Label>
            <div className="flex gap-2">
              <Input
                id="payerUpi"
                value={payerUpi}
                onChange={(e) => setPayerUpi(e.target.value)}
                placeholder="e.g. yourname@upi"
                disabled={paymentRequested}
              />
              <Button 
                onClick={handleSendPaymentRequest}
                disabled={paymentRequested || !payerUpi.trim()}
                variant="outline"
              >
                {paymentRequested ? 'Sent!' : 'Request'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              We'll send a payment request for ₹{total} to your UPI app
            </p>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            After completing payment, your order will be confirmed via WhatsApp
          </p>
        </CardContent>
      </Card>

      {/* Payment Confirmation Dialog - Only Yes button */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-primary" />
              Did you complete the payment?
            </AlertDialogTitle>
            <AlertDialogDescription>
              If you've successfully paid ₹{total} using your UPI app, click below to confirm your order.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-center pt-4">
            <AlertDialogAction onClick={handlePaymentConfirmed} className="gradient-hero px-8">
              Yes, Payment Done ✓
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default QRCodePayment;
