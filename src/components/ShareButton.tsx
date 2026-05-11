import React from 'react';
import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface ShareButtonProps {
  productId: string;
  productName: string;
  productImage?: string;
  price?: number;
  className?: string;
  variant?: 'icon' | 'full';
}

const ShareButton: React.FC<ShareButtonProps> = ({
  productId,
  productName,
  price,
  className = '',
  variant = 'icon',
}) => {
  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const url = `${window.location.origin}/product/${productId}`;
    const text = price
      ? `Check out ${productName} for ₹${price} on PUTHIYAM!`
      : `Check out ${productName} on PUTHIYAM!`;

    try {
      if (navigator.share) {
        await navigator.share({ title: productName, text, url });
        return;
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
    }

    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      toast({
        title: 'Link copied!',
        description: 'Product link copied to clipboard.',
      });
    } catch {
      toast({
        title: 'Could not share',
        description: 'Please copy the URL manually.',
        variant: 'destructive',
      });
    }
  };

  if (variant === 'full') {
    return (
      <Button
        type="button"
        variant="outline"
        onClick={handleShare}
        className={`gap-2 hover:scale-105 active:scale-95 transition-all ${className}`}
      >
        <Share2 className="w-4 h-4" />
        Share
      </Button>
    );
  }

  return (
    <Button
      type="button"
      size="icon"
      variant="secondary"
      onClick={handleShare}
      aria-label={`Share ${productName}`}
      className={`w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-primary hover:text-primary-foreground hover:scale-110 active:scale-95 transition-all shadow-soft ${className}`}
    >
      <Share2 className="w-4 h-4" />
    </Button>
  );
};

export default ShareButton;