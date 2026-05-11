import React, { useEffect, useState } from 'react';
import { Flame, TrendingUp, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface TrendingItem {
  id: string;
  name: string;
  image: string;
  price: number;
  purchaseCount: number;
  category: string;
}

const TrendingPopup: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<TrendingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    fetchTrending();
  }, [open]);

  const fetchTrending = async () => {
    setLoading(true);
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: orders } = await supabase
        .from('orders')
        .select('items')
        .gte('created_at', thirtyDaysAgo.toISOString());

      const counts: Record<string, number> = {};
      orders?.forEach((order) => {
        const list = order.items as Array<{ id: string; quantity: number }>;
        list?.forEach((it) => {
          counts[it.id] = (counts[it.id] || 0) + (it.quantity || 1);
        });
      });

      const { data: products } = await supabase
        .from('products')
        .select('id, name, base_price, category')
        .eq('is_active', true)
        .eq('is_in_stock', true);

      const enriched: TrendingItem[] = await Promise.all(
        (products || []).map(async (p) => {
          const { data: imgs } = await supabase
            .from('product_images')
            .select('image_url, is_primary')
            .eq('product_id', p.id);
          const primary = imgs?.find((i) => i.is_primary) || imgs?.[0];
          return {
            id: p.id,
            name: p.name,
            category: p.category,
            price: p.base_price,
            image: primary?.image_url || '/placeholder.svg',
            purchaseCount: counts[p.id] || 0,
          };
        })
      );

      const top = enriched
        .sort((a, b) => b.purchaseCount - a.purchaseCount)
        .slice(0, 10);
      setItems(top);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const goToProduct = (id: string) => {
    setOpen(false);
    navigate(`/product/${id}`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-muted/50 transition-all duration-300 hover:scale-110 active:scale-95 group"
          aria-label="Trending products"
        >
          <Flame className="w-5 h-5 text-destructive animate-pulse-soft group-hover:animate-bounce" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-destructive animate-ping" />
        </Button>
      </DialogTrigger>
      <DialogContent className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-lg w-[92vw] sm:w-full p-0 overflow-hidden border-2 border-primary/30 shadow-elevated animate-scale-in">
        <div className="gradient-hero p-4 text-primary-foreground">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl flex items-center gap-2 text-primary-foreground">
              <Sparkles className="w-5 h-5 animate-pulse" />
              Trending Now
              <Flame className="w-5 h-5 animate-bounce" />
            </DialogTitle>
            <p className="text-xs text-primary-foreground/90 mt-1">
              Most loved by everyone in the last 30 days
            </p>
          </DialogHeader>
        </div>
        <ScrollArea className="h-[420px] p-4">
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No trending data yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => goToProduct(item.id)}
                  style={{ animationDelay: `${idx * 60}ms` }}
                  className="w-full flex items-center gap-3 p-2 rounded-lg border border-border bg-card hover:border-primary hover:shadow-soft hover:-translate-y-0.5 transition-all duration-300 animate-fade-in text-left"
                >
                  <div className="relative">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-14 h-14 rounded-lg object-contain bg-muted"
                      loading="lazy"
                    />
                    {idx < 3 && (
                      <span className="absolute -top-1 -left-1 bg-gradient-to-r from-destructive to-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        #{idx + 1}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{item.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-primary">₹{item.price}</p>
                    {item.purchaseCount > 0 && (
                      <p className="text-[10px] text-muted-foreground flex items-center gap-0.5 justify-end">
                        <Flame className="w-3 h-3 text-destructive" />
                        {item.purchaseCount}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
        <div className="p-3 border-t border-border bg-muted/30">
          <Button
            className="w-full gradient-hero text-primary-foreground hover:scale-[1.02] transition-transform"
            onClick={() => {
              setOpen(false);
              navigate('/trending');
            }}
          >
            View All Trending
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TrendingPopup;