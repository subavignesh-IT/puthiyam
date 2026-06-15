import React, { useEffect, useState } from 'react';
import { Download, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const WINDOW_MS = 5 * 60 * 1000;

interface StoredOrder {
  orderId: string;
  imageUrl: string;
  timestamp: number;
}

const read = (): StoredOrder | null => {
  try {
    const raw = localStorage.getItem('lastOrderBill');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredOrder;
    if (!parsed?.imageUrl || !parsed?.timestamp) return null;
    if (Date.now() - parsed.timestamp > WINDOW_MS) {
      localStorage.removeItem('lastOrderBill');
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

const LastOrderBillBanner: React.FC = () => {
  const [order, setOrder] = useState<StoredOrder | null>(() => read());
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const refresh = () => setOrder(read());
    window.addEventListener('lastOrderBill:update', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('lastOrderBill:update', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  useEffect(() => {
    if (!order) return;
    const tick = () => {
      const left = WINDOW_MS - (Date.now() - order.timestamp);
      if (left <= 0) {
        localStorage.removeItem('lastOrderBill');
        setOrder(null);
        setRemaining(0);
      } else {
        setRemaining(left);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [order]);

  if (!order) return null;

  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);

  const download = () => {
    const link = document.createElement('a');
    link.download = `PUTHIYAM_Bill_${order.orderId}.png`;
    link.href = order.imageUrl;
    link.click();
  };

  return (
    <Card className="mb-6 border-secondary/40 bg-secondary/5 animate-fade-in">
      <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-secondary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">Order Confirmed · {order.orderId}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Bill available for {mins}:{secs.toString().padStart(2, '0')}
            </p>
          </div>
        </div>
        <Button onClick={download} className="gradient-hero text-primary-foreground w-full sm:w-auto">
          <Download className="w-4 h-4 mr-2" />
          Download Bill
        </Button>
      </CardContent>
    </Card>
  );
};

export default LastOrderBillBanner;