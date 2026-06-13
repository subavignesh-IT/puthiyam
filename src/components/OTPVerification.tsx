import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface OTPVerificationProps {
  email: string;
  onVerified: () => void;
  onBack: () => void;
}

const OTPVerification: React.FC<OTPVerificationProps> = ({ email, onVerified, onBack }) => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [showInvalidDialog, setShowInvalidDialog] = useState(false);

  // Send a 6-digit OTP to the user's email via Supabase Auth (free, unlimited)
  const generateOTP = async () => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: `${window.location.origin}/`,
        },
      });
      if (error) {
        toast({
          title: 'Failed to send OTP',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }
      toast({
        title: 'OTP Sent!',
        description: `Code emailed to ${email}`,
      });
    } catch (e: any) {
      toast({ title: 'Network error', description: e?.message, variant: 'destructive' });
    }
  };

  useEffect(() => {
    generateOTP();
  }, []);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the 6-digit OTP",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    });
    setLoading(false);

    if (error) {
      setOtp('');
      setShowInvalidDialog(true);
      return;
    }

    toast({
      title: "Verified!",
      description: "Email verified successfully",
    });
    onVerified();
  };

  const handleResend = () => {
    generateOTP();
  };

  return (
    <Card className="w-full max-w-md shadow-elevated animate-fade-in">
      <CardHeader className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 gradient-hero rounded-full flex items-center justify-center">
          <span className="text-primary-foreground font-serif font-bold text-2xl">P</span>
        </div>
        <CardTitle className="font-serif text-2xl">Verify OTP</CardTitle>
        <CardDescription>
          Enter the 6-digit code emailed to <strong>{email}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-center">
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={setOtp}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        <Button
          onClick={handleVerify}
          className="w-full gradient-hero text-primary-foreground"
          disabled={loading || otp.length !== 6}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Verifying...
            </>
          ) : (
            'Verify OTP'
          )}
        </Button>

        <div className="text-center">
          <Button variant="ghost" onClick={handleResend} className="text-primary">
            <RefreshCw className="w-4 h-4 mr-2" />
            Resend OTP
          </Button>
        </div>

        <Button
          variant="ghost"
          onClick={onBack}
          className="w-full text-muted-foreground"
        >
          ← Back to Login
        </Button>
      </CardContent>

      <AlertDialog open={showInvalidDialog} onOpenChange={setShowInvalidDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Invalid OTP</AlertDialogTitle>
            <AlertDialogDescription>
              The OTP you entered is incorrect. Please click "Resend OTP" to receive a new code.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                setShowInvalidDialog(false);
                handleResend();
              }}
            >
              Resend OTP
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default OTPVerification;
