import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowLeft } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartItem from '@/components/CartItem';
import CheckoutForm from '@/components/CheckoutForm';
import StampCard from '@/components/StampCard';
import BottomNav from '@/components/BottomNav';
import LastOrderBillBanner from '@/components/LastOrderBillBanner';
import { Button } from '@/components/ui/button';

const Cart: React.FC = () => {
  const { items, getTotal, getItemEffectivePrice } = useCart();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login?returnTo=/cart', { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-2" />Continue Shopping</Button></Link>
        </div>

        <h1 className="font-serif text-3xl font-bold mb-6">Your Cart</h1>

        <LastOrderBillBanner />

        <div className="mb-8">
          <StampCard />
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="font-serif text-2xl font-semibold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">Add some products to get started!</p>
            <Link to="/"><Button className="gradient-hero text-primary-foreground">Browse Products</Button></Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h2 className="font-serif text-xl font-semibold mb-4">Items ({items.length})</h2>
              {items.map(item => (<CartItem key={item.id} item={item} />))}
              
              <div className="bg-muted/50 rounded-lg p-4 mt-6">
                <h3 className="font-semibold mb-3">Price Details</h3>
                {items.map(item => {
                  const p = getItemEffectivePrice(item);
                  return (
                    <div key={item.id} className="flex justify-between text-sm text-muted-foreground mb-1">
                      <span>{item.name}</span>
                      <span>₹{p} × {item.quantity} = ₹{p * item.quantity}</span>
                    </div>
                  );
                })}
                <div className="border-t border-border mt-3 pt-3 flex justify-between font-semibold">
                  <span>Subtotal</span>
                  <span className="text-primary">₹{getTotal()}</span>
                </div>
              </div>
            </div>
            <div><CheckoutForm /></div>
          </div>
        )}
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
};

export default Cart;
