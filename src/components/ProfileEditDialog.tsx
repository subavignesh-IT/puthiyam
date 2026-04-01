import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { User, Phone, Mail, Lock, Eye, EyeOff, Edit } from 'lucide-react';

const ProfileEditDialog: React.FC = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (open && user) {
      fetchProfile();
    }
  }, [open, user]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('user_id', user!.id)
      .single();
    setForm(prev => ({
      ...prev,
      full_name: data?.full_name || '',
      phone: data?.phone || '',
      email: user!.email || '',
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Update profile
      await supabase
        .from('profiles')
        .update({ full_name: form.full_name, phone: form.phone })
        .eq('user_id', user!.id);

      // Update email if changed
      if (form.email !== user!.email) {
        const { error } = await supabase.auth.updateUser({ email: form.email });
        if (error) throw error;
      }

      // Update password if provided
      if (form.newPassword) {
        if (form.newPassword !== form.confirmPassword) {
          toast({ title: 'Password Mismatch', description: 'Passwords do not match', variant: 'destructive' });
          setLoading(false);
          return;
        }
        if (form.newPassword.length < 6) {
          toast({ title: 'Weak Password', description: 'Password must be at least 6 characters', variant: 'destructive' });
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.updateUser({ password: form.newPassword });
        if (error) throw error;
      }

      toast({ title: '✅ Profile Updated', description: 'Your details have been saved.' });
      setOpen(false);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Edit className="w-4 h-4" />
          Edit Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Edit Profile
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-1">
            <Label htmlFor="edit-name">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="edit-name"
                value={form.full_name}
                onChange={(e) => setForm(p => ({ ...p, full_name: e.target.value }))}
                placeholder="e.g. John Doe"
                className="pl-10"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="edit-phone">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="edit-phone"
                value={form.phone}
                onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))}
                placeholder="e.g. 9876543210"
                className="pl-10"
                maxLength={10}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="edit-email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="edit-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="e.g. john@example.com"
                className="pl-10"
              />
            </div>
          </div>
          <div className="border-t pt-3">
            <p className="text-xs text-muted-foreground mb-2">Change Password (optional)</p>
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={form.newPassword}
                  onChange={(e) => setForm(p => ({ ...p, newPassword: e.target.value }))}
                  placeholder="New password"
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={(e) => setForm(p => ({ ...p, confirmPassword: e.target.value }))}
                  placeholder="Confirm new password"
                  className="pl-10"
                />
              </div>
            </div>
          </div>
          <Button onClick={handleSave} disabled={loading} className="w-full">
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileEditDialog;
