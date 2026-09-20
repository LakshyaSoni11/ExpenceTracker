import React from 'react';
import { Helmet } from 'react-helmet';
import { Loader2, Wallet } from 'lucide-react';
import Dashboard from '@/components/Dashboard';
import AuthPage from '@/components/AuthPage';
import VerifyEmail from '@/components/VerifyEmail';
import { Toaster } from 'sonner';
import { useAuth } from '@/context/AuthContext';

function App() {
  const { user, initializing } = useAuth();

  if (initializing) {
    return (
      <div className="bg-app min-h-screen flex flex-col items-center justify-center gap-5">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-4 rounded-2xl shadow-lift text-white">
          <Wallet size={32} />
        </div>
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
          Loading your expense world…
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>ExpenceTracker - Expense Sharing Made Easy</title>
        <meta name="description" content="Track shared expenses and settle dues easily with your friends and family." />
      </Helmet>

      <div className="bg-app min-h-screen">
        {!user ? <AuthPage /> : !user.isVerified ? <VerifyEmail /> : <Dashboard />}
        <Toaster richColors position="top-right" />
      </div>
    </>
  );
}

export default App;