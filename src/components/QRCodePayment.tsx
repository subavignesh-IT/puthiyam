import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, QrCode, Copy, Check, Clock, AlertCircle, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

interface QRCodePaymentProps {
  total: number;
  onPaymentComplete: () => void;
  onBack: () => void;
  onTimeout: () => void;
}

const QRCodePayment: React.FC<QRCodePaymentProps> = ({ total, onPaymentComplete, onBack, onTimeout }) => {
  const upiId = 'kathaiahkarthik@okhdfcbank';
  const merchantName = 'PUTHIYAM PRODUCTS';
  const bankName = 'TMB Bank';
  const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${total}&cu=INR&tn=${encodeURIComponent(`Payment for order - ₹${total}`)}`;
  
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes in seconds
  const [copied, setCopied] = useState(false);
  const [upiAppOpened, setUpiAppOpened] = useState(false);
  
  // Generate QR code using QR Server API
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUrl)}`;

  // Timer countdown - Auto cancel on timeout
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
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

  const handleOpenDefaultUpiApp = useCallback(() => {
    window.location.href = upiUrl;
    setUpiAppOpened(true);
  }, [upiUrl]);

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId).catch(() => {});
    setCopied(true);
    toast({
      title: 'UPI ID Copied!',
      description: `Paste this in your UPI app to pay ₹${total}`,
    });
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <>
      <Card className="animate-fade-in">
        <CardHeader>
          <Button variant="ghost" size="sm" onClick={onBack} className="w-fit -ml-2">
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

          {/* Open default UPI app */}
          <div className="space-y-2">
            <Button
              onClick={handleOpenDefaultUpiApp}
              className="w-full gradient-hero text-primary-foreground h-12"
            >
              <Smartphone className="w-4 h-4 mr-2" />
              Pay ₹{total} with UPI
            </Button>
            <p className="text-[11px] text-center text-muted-foreground">
              Opens GPay / PhonePe / Paytm — any UPI app on your device
            </p>
          </div>

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

          {/* Manual confirmation - no gateway to auto-verify */}
          {upiAppOpened && (
            <div className="space-y-2 p-3 rounded-lg border border-primary/40 bg-primary/5">
              <p className="text-sm text-center">
                After completing the payment in your UPI app, tap the button below to confirm your order.
              </p>
              <Button
                onClick={onPaymentComplete}
                className="w-full h-12"
                variant="default"
              >
                <Check className="w-4 h-4 mr-2" /> I've Paid — Confirm Order
              </Button>
            </div>
          )}

          <p className="text-xs text-center text-muted-foreground">
            After payment is confirmed, your order bill will be shared via WhatsApp
          </p>
        </CardContent>
      </Card>
    </>
  );
};

export default QRCodePayment;
