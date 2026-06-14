import React from 'react';
import { Button } from '@/components/ui/button';
import { Smartphone } from 'lucide-react';

interface UPIAppSelectorProps {
  upiUrl: string;
  amount: number;
  onAppOpened: () => void;
}

// UPI app configurations — scheme is the app-specific prefix; we replace
// the leading `upi://` from the standard UPI URL so the chosen app opens.
const UPI_APPS = [
  { name: 'Google Pay', icon: '💳', scheme: 'gpay://upi/pay' },
  { name: 'PhonePe',    icon: '📱', scheme: 'phonepe://pay' },
  { name: 'Paytm',      icon: '💰', scheme: 'paytmmp://pay' },
  { name: 'BHIM',       icon: '🏦', scheme: 'upi://pay' },
  { name: 'Amazon Pay', icon: '🛒', scheme: 'amazonpay://pay' },
  { name: 'WhatsApp Pay', icon: '💬', scheme: 'whatsapp://pay' },
  { name: 'CRED',       icon: '💎', scheme: 'credpay://pay' },
];

const UPIAppSelector: React.FC<UPIAppSelectorProps> = ({ upiUrl, amount, onAppOpened }) => {
  const handleAppClick = (app: typeof UPI_APPS[0]) => {
    onAppOpened();
    // Replace the `upi://pay` prefix with the chosen app's scheme so the
    // OS opens that specific UPI app. Falls back to standard UPI URL if
    // the app isn't installed.
    const appUrl = upiUrl.replace(/^upi:\/\/pay/, app.scheme);
    try {
      window.location.href = appUrl;
      // Fallback to standard UPI URL after a short delay
      setTimeout(() => { window.location.href = upiUrl; }, 1500);
    } catch {
      window.location.href = upiUrl;
    }
  };

  const handleGenericUPI = () => {
    onAppOpened();
    window.location.href = upiUrl;
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground text-center mb-4">
        Choose your preferred UPI app to pay <strong>₹{amount}</strong>
      </p>
      
      <div className="grid grid-cols-3 gap-3">
        {UPI_APPS.map((app) => (
          <Button
            key={app.name}
            variant="outline"
            onClick={() => handleAppClick(app)}
            className="h-auto py-4 flex flex-col items-center gap-2 hover:border-primary hover:bg-primary/5 transition-all"
          >
            <span className="text-2xl">{app.icon}</span>
            <span className="text-sm font-medium">{app.name}</span>
          </Button>
        ))}
      </div>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">or</span>
        </div>
      </div>

      <Button 
        onClick={handleGenericUPI}
        className="w-full gradient-hero text-primary-foreground py-6 text-lg"
      >
        <Smartphone className="w-5 h-5 mr-2" />
        Open Any UPI App
      </Button>
      
      <p className="text-xs text-center text-muted-foreground">
        This will open your default UPI app with the payment details pre-filled
      </p>
    </div>
  );
};

export default UPIAppSelector;
