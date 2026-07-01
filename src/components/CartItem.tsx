import React from 'react';
import { Minus, Plus, Trash2, Truck, Tag } from 'lucide-react';
import { CartItem as CartItemType } from '@/types/product';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';

interface CartItemProps {
  item: CartItemType;
}

const CartItem: React.FC<CartItemProps> = ({ item }) => {
  const { updateQuantity, removeFromCart, getItemEffectivePrice, getItemDeliveryCharge } = useCart();

  // Generate cart item ID for removal/update
  const cartItemId = item.selectedVariant 
    ? `${item.id}-${item.selectedVariant.weight}` 
    : item.id;

  const basePrice = item.selectedVariant ? item.selectedVariant.price : item.price;
  const price = getItemEffectivePrice(item);
  const wholesaleActive = price < basePrice;
  const tiers = (item.wholesaleTiers || []).slice().sort((a, b) => a.minQuantity - b.minQuantity);
  const nextTier = tiers.find(t => item.quantity < t.minQuantity);
  const deliveryCharge = item.deliveryCharge ?? 0;
  const liveDelivery = getItemDeliveryCharge(item);
  const deliveryWaived = deliveryCharge > 0 && liveDelivery === 0;

  return (
    <div className="flex gap-4 p-4 bg-card rounded-lg shadow-soft animate-slide-up-fade hover-lift">
      <img
        src={item.image}
        alt={item.name}
        className="w-20 h-20 object-cover rounded-md"
      />
      <div className="flex-1 min-w-0">
        <h3 className="font-serif font-semibold text-foreground truncate">
          {item.name}
          {item.selectedVariant && (
            <span className="text-sm font-normal text-muted-foreground ml-2">
              ({item.selectedVariant.weight})
            </span>
          )}
        </h3>
        <p className="text-sm text-muted-foreground">
          {wholesaleActive && (
            <span className="line-through mr-1 opacity-70">₹{basePrice}</span>
          )}
          ₹{price} × {item.quantity} = <span className="font-semibold text-primary">₹{price * item.quantity}</span>
        </p>
        {wholesaleActive && (
          <p className="text-xs text-secondary flex items-center gap-1 mt-1">
            <Tag className="w-3 h-3" /> Wholesale price applied
          </p>
        )}
        {!wholesaleActive && nextTier && (
          <p className="text-xs text-muted-foreground mt-1">
            Add {nextTier.minQuantity - item.quantity} more for wholesale ₹{nextTier.price} each
          </p>
        )}
        {deliveryCharge > 0 && (
          <p className={`text-xs flex items-center gap-1 mt-1 ${deliveryWaived ? 'text-secondary' : 'text-muted-foreground'}`}>
            <Truck className="w-3 h-3" />
            {deliveryWaived ? (
              <>Free delivery unlocked (qty ≥ {item.freeDeliveryQuantity})</>
            ) : (
              <>
                Delivery ₹{deliveryCharge}
                {(item.freeDeliveryQuantity ?? 0) > 0 && (
                  <> · free at {item.freeDeliveryQuantity}+ qty</>
                )}
              </>
            )}
          </p>
        )}
        <div className="flex items-center gap-2 mt-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => updateQuantity(cartItemId, item.quantity - 1)}
          >
            <Minus className="w-3 h-3" />
          </Button>
          <span className="w-8 text-center font-medium">{item.quantity}</span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => updateQuantity(cartItemId, item.quantity + 1)}
          >
            <Plus className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 ml-auto text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => removeFromCart(cartItemId)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
