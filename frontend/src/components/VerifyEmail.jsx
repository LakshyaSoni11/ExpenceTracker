import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { MailCheck, Loader2, LogOut, Inbox } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

const VerifyEmail = () => {
  const { user, resendVerification, logout, verifyEmail } = useAuth();
  const [sending, setSending] = useState(false);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) return;
    ran.current = true;
    const handle = async () => {
      try {
        await verifyEmail(token);
        window.history.replaceState({}, '', window.location.pathname);
        toast.success('Email verified. Welcome!');
      } catch (err) {
        window.history.replaceState({}, '', window.location.pathname);
        toast.error(err.response?.data?.message || 'Verification failed');
      }
    };
    handle();
  }, [verifyEmail]);

  const resend = async () => {
    if (!user?.email) return;
    setSending(true);
    try {
      await resendVerification(user.email);
      toast.success('Verification email sent — check your inbox');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend verification email');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-amber-300/30 blur-3xl animate-blob" />
      <div className="pointer-events-none absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-emerald-300/30 blur-3xl animate-blob [animation-delay:-7s]" />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="glass w-full max-w-md rounded-3xl border border-white/60 p-6 text-center shadow-lift sm:p-8"
      >
        <div className="mb-6 flex flex-col items-center">
          <div className="mb-5 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 p-3.5 text-white shadow-lift">
            <MailCheck size={30} strokeWidth={2.2} />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Verify your email
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            We sent a verification link to{' '}
            <span className="font-semibold text-slate-700">{user?.email}</span>. Click it to
            activate your account.
          </p>
        </div>

        <button
          type="button"
          onClick={resend}
          disabled={sending}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-2.5 font-semibold text-white shadow-lift transition-all hover:from-emerald-600 hover:to-teal-700 active:scale-[0.98] disabled:opacity-60"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Inbox className="h-4 w-4" />
          )}
          Resend verification email
        </button>

        <button
          type="button"
          onClick={logout}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-2 text-sm text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </motion.div>
    </div>
  );
};

export default VerifyEmail;