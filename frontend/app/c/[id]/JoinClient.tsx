'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface JoinClientProps {
  conversationId: string;
  inviteCode: string;
}

export default function JoinClient({ conversationId, inviteCode }: JoinClientProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      // Send magic link with redirect to this same page
      const redirectUrl = `${window.location.origin}/c/${conversationId}?code=${inviteCode}`;

      const { error, data } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: redirectUrl,
        },
      });
      await supabase.rpc('claim_scanner_by_email', { p_conversation: conversationId, p_code: inviteCode, p_email: email.trim() });

      if (error) throw error;

      setMessage('Check your email for a sign-in link!');
    } catch (err) {
      console.error('Sign in error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send sign-in link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-gradient-to-b from-[#343D40] to-[#131519] text-white flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Join Conversation</h1>
          <p className="text-gray-300">
            You&quot;ve been invited to join a conversation. Sign in to continue.
          </p>
        </div>

        {/* Sign In Form */}
        <div className="bg-slate-800 rounded-2xl p-6 space-y-6">
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              {loading ? 'Sending...' : 'Send Sign-In Link'}
            </button>
          </form>

          {/* Messages */}
          {message && (
            <div className="bg-green-900/50 border border-green-700 text-green-300 px-4 py-3 rounded-lg text-sm">
              {message}
            </div>
          )}

          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="text-center text-sm text-gray-400">
          <p>
            We&apos;ll send you a secure sign-in link. After signing in, you&apos;ll automatically join the conversation.
          </p>
        </div>
      </div>
    </div>
  );
}
