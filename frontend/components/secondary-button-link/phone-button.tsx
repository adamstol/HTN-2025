"use client";

import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Phone } from "lucide-react";
import styles from "./styles.module.css";
import { buttonVariants } from "@/components/ui/button";

interface PhoneButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  phoneNumber: string;
  children: React.ReactNode;
  className?: string;
}

export function PhoneButton({
  phoneNumber,
  children,
  className,
  ...props
}: PhoneButtonProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if the device is mobile
    const checkIfMobile = () => {
      setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const handleClick = async () => {
    try {
      if (isMobile) {
        // On mobile, open the dialer
        window.location.href = `tel:${phoneNumber}`;
      } else {
        // On desktop, copy to clipboard
        await navigator.clipboard.writeText(phoneNumber);
        toast.success("Phone number copied to clipboard", {
          description: phoneNumber,
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error handling phone number:', error);
      toast.error("Failed to copy phone number");
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        // "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
        // "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        // "disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
        // "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        // "h-10 py-2 px-4",
        buttonVariants({ variant: "secondary" }),
        styles.cta,
        className
      )}
      {...props}
    >
      <Phone className="mr-2 h-4 w-4" />
      {children}
    </button>
  );
}

export default PhoneButton;
