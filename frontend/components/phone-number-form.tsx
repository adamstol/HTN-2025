"use client";

import { useState } from "react";
import { Phone, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface PhoneNumberFormProps {
  onSuccess?: () => void;
}

export function PhoneNumberForm({ onSuccess }: PhoneNumberFormProps) {
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const router = useRouter();

  const validatePhoneNumber = (number: string) => {
    // US/Canada phone number regex (10 digits after +1)
    const phoneRegex = /^\+1\d{10}$/;
    return phoneRegex.test(number);
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digit characters
    const numbers = value.replace(/\D/g, "");

    // If empty, return empty string
    if (!numbers) return "";

    // If starts with 1, assume it's a US/Canada number with country code
    if (numbers.startsWith("1") && numbers.length > 1) {
      return `+1${numbers.slice(1, 11)}`;
    }

    // Otherwise, format as US/Canada number
    return `+1${numbers.slice(0, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreedToTerms) {
      toast.error("Please agree to the Terms of Service");
      return;
    }

    if (!validatePhoneNumber(phone)) {
      toast.error("Please enter a valid US or Canadian phone number");
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch("/api/profile/phone", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone }),
      });

      if (!response.ok) {
        throw new Error("Failed to save phone number");
      }

      toast.success("Phone number saved successfully!");
      if (onSuccess) onSuccess();
      router.refresh();
    } catch (error) {
      console.error("Error saving phone number:", error);
      toast.error("Failed to save phone number. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      <div className="space-y-2">
        <div className="flex items-center bg-background/50 backdrop-blur-xs rounded-full border border-border/50 p-1">
          <div className="flex items-center pl-4 text-muted-foreground text-sm">
            +1
          </div>
          <Input
            id="phone"
            type="tel"
            placeholder="(555) 123-4567"
            value={phone.replace("+1", "")}
            onChange={handlePhoneChange}
            className="flex-1 border-0 bg-transparent text-sm px-2 py-2 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60"
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={isLoading || !phone || !agreedToTerms}
            size="sm"
            className="rounded-full px-6 py-2 text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
        </div>
        <div className="flex items-center px-4">
          <Checkbox
            id="terms"
            checked={agreedToTerms}
            onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
            disabled={isLoading}
            className="h-4 w-4 rounded"
          />
          <label
            htmlFor="terms"
            className="text-xs text-muted-foreground ml-2 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            I agree to the <a href="/terms" className="underline hover:text-primary">Terms of Service</a>
          </label>
        </div>
      </div>
    </form>
  );
}

export default PhoneNumberForm;
