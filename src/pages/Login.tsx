import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import ProfileEditDialog from '@/components/ProfileEditDialog';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    const { error } = await signIn(formData.email, formData.password);
    setLoading(false);

    if (error) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Welcome Back!",
      description: "You have successfully logged in",
    });
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md shadow-elevated animate-fade-in">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 gradient-hero rounded-full flex items-center justify-center">
              <span className="text-primary-foreground font-serif font-bold text-2xl">P</span>
            </div>
            <CardTitle className="font-serif text-2xl">Welcome Back</CardTitle>
            <CardDescription>Login to your PUTHIYAM account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="e.g. john@example.com"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="e.g. ••••••••"
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full gradient-hero text-primary-foreground"
                disabled={loading}
              >
                {loading ? 'Verifying...' : 'Continue'}
              </Button>
            </form>

            <div className="mt-3 text-center">
              <button
                type="button"
                onClick={() => setShowForgot(true)}
                className="text-sm text-primary hover:underline font-medium"
              >
                Forgot Password?
              </button>
            </div>

            {showForgot && (
              <div className="mt-4 p-4 border border-border rounded-lg bg-muted/30 space-y-3 animate-fade-in">
                <p className="text-sm font-medium">Reset your password</p>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    disabled={forgotLoading || !forgotEmail}
                    onClick={async () => {
                      setForgotLoading(true);
                      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
                        redirectTo: `${window.location.origin}/reset-password`,
                      });
                      setForgotLoading(false);
                      if (error) {
                        toast({ title: 'Error', description: error.message, variant: 'destructive' });
                      } else {
                        toast({ title: 'Email Sent!', description: 'Check your inbox for a password reset link.' });
                        setShowForgot(false);
                      }
                    }}
                  >
                    {forgotLoading ? 'Sending...' : 'Send Reset Link'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowForgot(false)}>Cancel</Button>
                </div>
              </div>
            )}

            <div className="mt-4 flex justify-center">
              <ProfileEditDialog />
            </div>

            <div className="mt-4 text-center text-sm">
              <span className="text-muted-foreground">Don't have an account? </span>
              <Link to="/signup" className="text-primary hover:underline font-medium">
                Sign up
              </Link>
            </div>
            <div className="mt-2 text-center text-sm">
              <span className="text-muted-foreground">Are you a seller? </span>
              <Link to="/seller-login" className="text-primary hover:underline font-medium">
                Seller Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default Login;
