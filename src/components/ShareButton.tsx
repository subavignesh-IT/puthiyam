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
  productImage,
  className = '',
  variant = 'icon',
}) => {
  const fetchImageFile = async (): Promise<File | null> => {
    if (!productImage) return null;
    try {
      const res = await fetch(productImage, { mode: 'cors' });
      if (!res.ok) return null;
      const blob = await res.blob();
      const ext = (blob.type.split('/')[1] || 'jpg').split('+')[0];
      const safeName = productName.replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 40) || 'product';
      return new File([blob], `${safeName}.${ext}`, { type: blob.type || 'image/jpeg' });
    } catch {
      return null;
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    // Use edge function URL for rich link previews (OG meta tags + image)
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
    const shareUrl = `${SUPABASE_URL}/functions/v1/product-share?id=${productId}`;
    const fallbackUrl = `${window.location.origin}/product/${productId}`;
    const text = `Check out ${productName} on PUTHIYAM!`;

    try {
      const file = await fetchImageFile();
      const shareData: ShareData & { files?: File[] } = { title: productName, text, url: shareUrl };
      if (file && (navigator as any).canShare?.({ files: [file] })) {
        shareData.files = [file];
      }
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
    }

    try {
      await navigator.clipboard.writeText(`${text} ${fallbackUrl}`);
      toast({
        title: 'Link copied!',
        description: productImage
          ? 'Product link copied. The shared link includes the product image preview!'
          : 'Product link copied to clipboard.',
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