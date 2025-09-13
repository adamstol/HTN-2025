'use client';

import { Button } from './ui/button';
import { MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function WhatsAppButton({ phoneNumber = '1234567890', message = 'Hello!' }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if we're on mobile
    const userAgent = typeof window.navigator === 'undefined' ? '' : navigator.userAgent;
    const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    setIsMobile(mobile);
  }, []);

  // Format the phone number by removing any non-digit characters
  const formattedPhone = phoneNumber.replace(/\D/g, '');

  // Create the WhatsApp URL
  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
  const scanUrl = `${window.location.origin || process.env.NEXT_PUBLIC_APP_URL}/scan?url=${encodeURIComponent(whatsappUrl)}`;

  // Use direct WhatsApp URL on mobile, scan URL on desktop
  const buttonUrl = isMobile ? whatsappUrl : scanUrl;

  return (
    <>
    <Button
      asChild
      className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-full flex items-center gap-2 shadow-lg transition-all hover:scale-105"
    >
      <Link href={buttonUrl} target="_blank" rel="noopener noreferrer">
        <MessageCircle className="w-5 h-5" />
        Chat with me on WhatsApp!
      </Link>
    </Button>
    <p className="text-xs text-muted-foreground mt-2 text-center">
      By chatting with me, you agree to our <Link href="/terms" target="_blank" className="underline">Terms of Service</Link>
    </p>
    </>
  );
}
