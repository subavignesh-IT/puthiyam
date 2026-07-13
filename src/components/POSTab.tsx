import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Plus, Trash2, Download, Share2, Store, QrCode } from 'lucide-react';
import { generateOrderId } from '@/utils/orderIdGenerator';

interface POSTabProps {
  sellerId: string;
}

interface Variant { id?: string; quantity: number; price: number; }
interface ProductLite { id: string; name: string; base_price: number; variants: Variant[]; }
interface CartLine { productId: string; name: string; variant?: Variant; quantity: number; price: number; }

const POSTab: React.FC<POSTabProps> = ({ sellerId }) => {
  const { user } = useAuth();
  const [products, setProducts] = useState<ProductLite[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMode, setPaymentMode] = useState<'cash' | 'upi'>('cash');
  const [upiId, setUpiId] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [saving, setSaving] = useState(false);
  const [lastOrder, setLastOrder] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { data: p } = await supabase
        .from('products')
        .select('id, name, base_price')
        .eq('seller_id', sellerId)
        .eq('is_active', true);
      const { data: v } = await supabase
        .from('product_variants')
        .select('id, product_id, quantity, price');
      const list: ProductLite[] = ((p as any[]) || []).map((pr) => ({
        ...pr,
        variants: ((v as any[]) || []).filter((vv) => vv.product_id === pr.id),
      }));
      setProducts(list);

      const { data: prof } = await supabase.from('profiles').select('upi_id').eq('user_id', sellerId).maybeSingle();
      if ((prof as any)?.upi_id) setUpiId((prof as any).upi_id);
    })();
  }, [sellerId]);

  const activeProduct = products.find((p) => p.id === selectedProductId);
  const activeVariant = activeProduct?.variants.find((v) => v.id === selectedVariantId);

  const addToCart = () => {
    if (!activeProduct) { toast({ title: 'Select a product', variant: 'destructive' }); return; }
    const qty = parseInt(quantity) || 1;
    const price = activeVariant?.price ?? activeProduct.base_price;
    setCart((prev) => [...prev, {
      productId: activeProduct.id,
      name: activeProduct.name,
      variant: activeVariant ? { quantity: activeVariant.quantity, price: activeVariant.price } : undefined,
      quantity: qty,
      price,
    }]);
    setSelectedVariantId('');
    setQuantity('1');
  };

  const removeLine = (idx: number) => setCart((prev) => prev.filter((_, i) => i !== idx));

  const total = useMemo(() => cart.reduce((s, l) => s + l.price * l.quantity, 0), [cart]);

  const upiPayUrl = useMemo(() => {
    if (!upiId || total <= 0) return '';
    const params = new URLSearchParams({
      pa: upiId,
      pn: 'PUTHIYAM',
      am: total.toFixed(2),
      cu: 'INR',
      tn: `POS-${Date.now()}`,
    });
    return `upi://pay?${params.toString()}`;
  }, [upiId, total]);

  const qrSrc = upiPayUrl ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiPayUrl)}` : '';

  const saveOrder = async () => {
    if (cart.length === 0) { toast({ title: 'Cart is empty', variant: 'destructive' }); return; }
    if (!customerName.trim() || !customerPhone.trim()) { toast({ title: 'Enter customer name & phone', variant: 'destructive' }); return; }
    if (!user) return;
    setSaving(true);
    const orderNumber = generateOrderId();
    const payload = {
      user_id: user.id,
      order_number: orderNumber,
      customer_name: customerName.trim(),
      customer_phone: customerPhone.trim(),
      customer_address: null,
      delivery_type: 'self-pickup',
      payment_method: 'cod',
      payment_status: 'paid',
      order_status: 'delivered',
      items: cart.map((l) => ({
        id: l.productId,
        name: l.name,
        price: l.price,
        quantity: l.quantity,
        selectedVariant: l.variant ? { weight: `${l.variant.quantity}`, price: l.variant.price } : undefined,
      })),
      subtotal: total,
      shipping_cost: 0,
      total,
      sale_channel: 'offline',
    };
    const { data, error } = await supabase.from('orders').insert([payload as any]).select('*').single();
    setSaving(false);
    if (error) {
      toast({ title: 'Failed to save', description: error.message, variant: 'destructive' });
      return;
    }
    setLastOrder({ ...data, paymentMode });
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    toast({ title: 'Offline sale recorded', description: `Order ${orderNumber}` });
  };

  const buildBillText = (o: any) => {
    const items = (o.items || []).map((it: any) => `${it.name}${it.selectedVariant ? ` (${it.selectedVariant.weight})` : ''} × ${it.quantity} = ₹${(it.price * it.quantity).toFixed(2)}`).join('\n');
    return `*PUTHIYAM PRODUCTS*\n(Offline / POS)\n\nOrder: ${o.order_number}\nDate: ${new Date(o.created_at).toLocaleString()}\nCustomer: ${o.customer_name} (${o.customer_phone})\nPayment: ${o.paymentMode === 'upi' ? 'UPI' : 'Cash'}\n\n${items}\n\n*Total: ₹${Number(o.total).toFixed(2)}*\n\nThank you!`;
  };

  const downloadBill = (o: any) => {
    const blob = new Blob([buildBillText(o)], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `POS-${o.order_number}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const shareWhatsApp = (o: any) => {
    const phone = (o.customer_phone || '').replace(/\D/g, '');
    const msg = encodeURIComponent(buildBillText(o));
    window.open(`https://wa.me/${phone.length >= 10 ? phone : ''}?text=${msg}`, '_blank');
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="w-5 h-5 text-primary" /> POS / Cash Sale
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Customer Name</Label>
              <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Walk-in customer" />
            </div>
            <div>
              <Label>Customer Phone</Label>
              <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="10-digit number" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div className="md:col-span-2">
              <Label>Product</Label>
              <Select value={selectedProductId} onValueChange={(v) => { setSelectedProductId(v); setSelectedVariantId(''); }}>
                <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                <SelectContent>
                  {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Variant</Label>
              <Select value={selectedVariantId} onValueChange={setSelectedVariantId} disabled={!activeProduct || activeProduct.variants.length === 0}>
                <SelectTrigger><SelectValue placeholder="Default" /></SelectTrigger>
                <SelectContent>
                  {activeProduct?.variants.map((v) => (
                    <SelectItem key={v.id} value={v.id!}>{v.quantity} — ₹{v.price}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Qty</Label>
              <div className="flex gap-2">
                <Input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                <Button size="icon" onClick={addToCart}><Plus className="w-4 h-4" /></Button>
              </div>
            </div>
          </div>

          {cart.length > 0 && (
            <div className="border rounded-lg p-3 space-y-2">
              {cart.map((l, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium">{l.name}</span>
                    {l.variant && <span className="text-muted-foreground"> ({l.variant.quantity})</span>}
                    <span className="text-muted-foreground"> × {l.quantity}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">₹{(l.price * l.quantity).toFixed(2)}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeLine(i)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-lg">₹{total.toFixed(2)}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Payment Mode</Label>
              <Select value={paymentMode} onValueChange={(v) => setPaymentMode(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="upi">UPI (QR)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {paymentMode === 'upi' && (
              <div>
                <Label>Your UPI ID</Label>
                <Input value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="yourname@upi" />
              </div>
            )}
          </div>

          {paymentMode === 'upi' && upiId && total > 0 && (
            <div className="flex flex-col items-center gap-2 p-4 border rounded-lg bg-muted/30">
              <QrCode className="w-4 h-4" />
              <img src={qrSrc} alt="UPI QR" className="w-48 h-48" />
              <p className="text-xs text-muted-foreground">Show this QR to the customer to pay ₹{total.toFixed(2)}</p>
            </div>
          )}

          <Button className="w-full gradient-hero text-primary-foreground" onClick={saveOrder} disabled={saving || cart.length === 0}>
            {saving ? 'Saving...' : `Record Offline Sale — ₹${total.toFixed(2)}`}
          </Button>
        </CardContent>
      </Card>

      {lastOrder && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Last Sale — {lastOrder.order_number} <Badge className="ml-2 bg-green-500 text-white">Offline</Badge></CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => downloadBill(lastOrder)}>
              <Download className="w-4 h-4 mr-2" /> Download Bill
            </Button>
            <Button variant="outline" size="sm" onClick={() => shareWhatsApp(lastOrder)}>
              <Share2 className="w-4 h-4 mr-2" /> Share on WhatsApp
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default POSTab;