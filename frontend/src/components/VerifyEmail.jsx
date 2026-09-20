import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { MailCheck, Loader2, LogOut } from 'lucide-react';
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8 text-center"
      >
        <div className="flex flex-col items-center mb-6">
          <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-3 rounded-xl shadow-lg text-white mb-4">
            <MailCheck size={28} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Verify your email</h1>
          <p className="text-sm text-slate-600 mt-2">
            We sent a verification link to <span className="font-semibold text-slate-800">{user?.email}</span>.
            Click it to activate your account.
          </p>
        </div>

        <button
          type="button"
          onClick={resend}
          disabled={sending}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold py-2.5 rounded-lg transition-all active:scale-[0.98] disabled:opacity-60"
        >
          {sending && <Loader2 className="w-4 h-4 animate-spin" />}
          Resend verification email
        </button>

        <button
          type="button"
          onClick={logout}
          className="mt-4 w-full flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-red-600 transition-colors py-2"
        >
          <LogOut className="w-4 h-4" />
          Log out
        </button>
      </motion.div>
    </div>
  );
};

export default VerifyEmail;