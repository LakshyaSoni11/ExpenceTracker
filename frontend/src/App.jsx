import React from 'react';
import { Helmet } from 'react-helmet';
import { Loader2 } from 'lucide-react';
import Dashboard from '@/components/Dashboard';
import AuthPage from '@/components/AuthPage';
import VerifyEmail from '@/components/VerifyEmail';
import { Toaster } from 'sonner';
import { useAuth } from '@/context/AuthContext';

function App() {
  const { user, initializing } = useAuth();

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>CredResolve - Expense Sharing Made Easy</title>
        <meta name="description" content="Track shared expenses and settle dues easily." />
      </Helmet>

      <div className="min-h-screen bg-slate-50">
        {!user ? <AuthPage /> : !user.isVerified ? <VerifyEmail /> : <Dashboard />}
        <Toaster richColors position="top-right" />
      </div>
    </>
  );
}

export default App;