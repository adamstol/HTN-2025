import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from "sonner";
import { isValidUniversityEmail, getEmailValidationError } from '@/lib/email-utils';
interface AuthResponse {
  data: {
    user: {
      id: string;
      email?: string;
    } | null;
    session: any | null;
  } | null;
  error: Error | null;
}

export const useEmailSignup = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState<string | null>(null);
  const supabase = createClient();

  // Check localStorage on initial load
  useEffect(() => {
    const email = localStorage.getItem('waitlistEmail');
    setWaitlistEmail(email);
  }, []);

  const signUpWithEmail = async (email: string) => {
    setIsLoading(true);
    try {
      // Validate university email
      // if (!isValidUniversityEmail(email)) {
      //   throw new Error(getEmailValidationError(email) || 'Invalid university email');
      // }

      // const isUCalgaryEmail = email.endsWith('@ucalgary.ca') || email.endsWith('@uwaterloo.ca') || email.endsWith('.ca') || email.endsWith('.edu');

      // if (isUCalgaryEmail) {
      // For UCalgary emails, send magic link for passwordless sign in
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/profile`,

          shouldCreateUser: true,
        },
      }) as unknown as AuthResponse;
      console.log(data, error);

      if (error) throw error;

      toast("Check your email!", {
        description: `We've sent a magic link to ${email}. Click it to sign in.`,
      });

      return { success: true, user: data?.user };
      // } else {
      //   // For non-UCalgary emails, just add to waitlist
      //   const { error: waitlistError } = await supabase
      //     .from('email_waitlist')
      //     .insert(
      //       {
      //         email,
      //       }
      //     );

      //   if (waitlistError) {
      //     throw new Error('Failed to add to waitlist. Please try again.');
      //   }

      // console.log('Added to waitlist:', email);

      // // Store the email in localStorage
      // localStorage.setItem('waitlistEmail', email);
      // setWaitlistEmail(email);

      // toast("Thanks for your interest!", {
      //   description: "We've added you to our waitlist. We'll notify you when we expand to your university!",
      // });

      // return { success: true, user: null };
      // }
    } catch (error: any) {
      console.error('Email signup error:', error);
      toast("Error", {
        description: error.message || "Failed to send magic link. Please try again.",
      });
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  };

  // This function can be used to check the auth state
  const checkAuthState = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user;
  };

  // This function can be used to sign out
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return {
    signUpWithEmail,
    checkAuthState,
    signOut,
    isLoading,
    waitlistEmail
  };
}