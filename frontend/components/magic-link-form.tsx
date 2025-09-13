'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export function MagicLinkForm() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/verify`,
        },
      });

      if (error) throw error;

      toast(
        'Check your email',
        {
          description: 'We\'ve sent you a magic link to sign in. Click the link in your email to continue.',
        },
      );
    } catch (error: unknown) {
      toast(
        'Error',
        {
          description: error instanceof Error ? error.message : 'Failed to send magic link',
        },
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Sign in with a magic link</h3>
        <p className="text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a link to sign in.
        </p>
      </div>

      <form onSubmit={handleSendMagicLink} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="magic-email">Email</Label>
          <Input
            id="magic-email"
            type="email"
            placeholder="m@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? 'Sending...' : 'Send Magic Link'}
        </Button>
      </form>
    </div>
  );
}
