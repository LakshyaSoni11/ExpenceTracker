import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Plus, Receipt, TrendingUp, Wallet, Loader2, LogOut, Mail, Check, X, FolderPlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GroupCard from '@/components/GroupCard';
import ExpenseModal from '@/components/ExpenseModal';
import ExpenseList from '@/components/ExpenseList';
import BalanceSummary from '@/components/BalanceSummary';
import SettlementModal from './SettlementModal';
import SettlementHistory from '@/components/SettlementHistory';
import GroupModal from '@/components/GroupModal';
import AIChatbot from '@/components/AIChatbot';
import ExportReportButton from '@/components/ExportReportButton';
import api from "@/api/axios";
import { toast } from "sonner";
import { useAuth } from '@/context/AuthContext';
import socket from '@/lib/socket';
import { initials, avatarGradient } from '@/lib/avatar';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [groups, setGroups] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('groups');

  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);

  // --- DATA FETCHING ---
  const fetchData = async (opts = {}) => {
    try {
      if (!opts.silent) setLoading(true);
      const [groupsRes, expensesRes, settlementsRes, invitesRes] = await Promise.all([
        api.get('/groups'),
        api.get('/expenses'),
        api.get('/settlements'),
        api.get('/groups/invites')
      ]);

      const transformedGroups = groupsRes.data.map(g => ({ ...g, id: g._id }));
      const transformedExpenses = expensesRes.data.map(e => ({ ...e, id: e._id }));
      const transformedSettlements = settlementsRes.data.map(s => ({ ...s, id: s._id }));
      const transformedInvites = invitesRes.data.map(g => ({ ...g, id: g._id }));

      setGroups(transformedGroups);
      setExpenses(transformedExpenses);
      setSettlements(transformedSettlements);
      setInvites(transformedInvites);
    } catch (error) {
      console.error("Data fetch error:", error);
      toast.error("Failed to load data. Make sure your backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- REALTIME (Socket.IO) ---
  useEffect(() => {
    const refresh = () => fetchData({ silent: true });
    const toastInvite = (data) => {
      if (data.groupName) {
        toast.info(`${data.invitedByName || 'Someone'} invited you to "${data.groupName}". Accept it in the Invites section.`, { duration: 6000 });
      }
      refresh();
    };
    const toastExpense = (data) => {
      if (data.groupName && data.description) {
        toast.success(`New expense in "${data.groupName}": ${data.description} — ₹${Number(data.amount).toFixed(2)}`);
      }
      refresh();
    };
    const toastSettlement = (data) => {
      if (data.groupName) toast.success(`New settlement in "${data.groupName}"`);
      refresh();
    };
    const quiet = () => refresh();

    socket.on('invite:new', toastInvite);
    socket.on('expense:added', toastExpense);
    socket.on('expense:deleted', quiet);
    socket.on('settlement:added', toastSettlement);
    socket.on('group:created', quiet);
    socket.on('group:member-changed', refresh);
    socket.on('group:deleted', (data) => {
      if (data.groupName) toast.info(`Group "${data.groupName}" was deleted`);
      refresh();
    });

    return () => {
      socket.off('invite:new', toastInvite);
      socket.off('expense:added', toastExpense);
      socket.off('expense:deleted', quiet);
      socket.off('settlement:added', toastSettlement);
      socket.off('group:created', quiet);
      socket.off('group:member-changed', refresh);
      socket.off('group:deleted');
    };
  }, []);

  // --- INVITE HANDLERS ---
  const handleAcceptInvite = async (invite) => {
    try {
      await api.post(`/groups/${invite.id}/invite/accept`);
      toast.success(`You joined "${invite.name}"`);
      await fetchData({ silent: true });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to accept invite');
    }
  };

  const handleDeclineInvite = async (invite) => {
    try {
      await api.post(`/groups/${invite.id}/invite/decline`);
      toast.success(`Declined invite to "${invite.name}"`);
      await fetchData({ silent: true });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to decline invite');
    }
  };

  // --- AI AUTO-HANDLERS ---
  const handleAutoCreateGroup = async (params) => {
    const memberNames = (params.members && params.members.length) ? params.members : [];
    const resolved = [];
    for (const name of memberNames) {
      try {
        const res = await api.get('/users/search', { params: { q: name } });
        const match = res.data.find(u => u.name.toLowerCase() === name.toLowerCase());
        if (match) resolved.push(match._id);
      } catch { /* ignore */ }
    }
    if (resolved.length === 0) {
      toast.error(`No registered users found for "${memberNames.join('", "')}". Ask them to sign up first.`);
      throw new Error("No registered users to add");
    }
    await handleCreateGroup({
      name: params.name,
      members: resolved
    });
  };

  const handleAutoAddExpense = async (params) => {
    const targetGroup = groups.find(g => g.name.toLowerCase() === params.group.toLowerCase());
    if (!targetGroup) {
      toast.error(`Group "${params.group}" not found.`);
      throw new Error("Group not found");
    }

    const active = targetGroup.members.filter((m) => m.membershipStatus === 'active');
    if (active.length === 0) {
      toast.error(`No active members in "${targetGroup.name}".`);
      throw new Error("No active members");
    }

    const splitAmount = params.amount / active.length;
    const splits = active.map(m => ({
      member: m._id,
      amount: splitAmount
    }));

    let paidBy;
    if (params.paidBy) {
      paidBy = active.find(m => m.name.toLowerCase() === params.paidBy.toLowerCase());
      if (!paidBy) {
        toast.error(`Member "${params.paidBy}" not found in group "${params.group}".`);
        throw new Error("Member not found");
      }
    } else {
      paidBy = active[0];
    }

    await handleAddExpense({
      groupId: targetGroup.id,
      description: params.desc || "AI Generated Expense",
      amount: parseFloat(params.amount),
      paidBy: paidBy._id,
      splits: splits
    });
  };

  // --- MANUAL HANDLERS ---
  const handleCreateGroup = async (groupData) => {
    try {
      const response = await api.post('/groups', {
        name: groupData.name,
        members: groupData.members
      });
      const newGroup = { ...response.data, id: response.data._id };
      setGroups([newGroup, ...groups]);
      setShowGroupModal(false);
      toast.success('Group created successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create group');
    }
  };

  const handleDeleteGroup = async (groupId) => {
    try {
      await api.delete(`/groups/${groupId}`);
      setGroups(groups.filter(g => g.id !== groupId));
      setExpenses(expenses.filter(e => e.groupId !== groupId));
      setSettlements(settlements.filter(s => s.groupId !== groupId));
      toast.success('Group deleted successfully');
    } catch (error) {
      toast.error('Failed to delete group');
    }
  };

  const handleAddExpense = async (expenseData) => {
    try {
      const response = await api.post('/expenses', {
        groupId: expenseData.groupId,
        description: expenseData.description,
        amount: parseFloat(expenseData.amount),
        paidBy: expenseData.paidBy,
        splitType: expenseData.splitType,
        splits: expenseData.splits
      });
      const newExpense = { ...response.data, id: response.data._id };
      setExpenses([newExpense, ...expenses]);
      setShowExpenseModal(false);
      toast.success('Expense added successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add expense');
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    try {
      await api.delete(`/expenses/${expenseId}`);
      setExpenses(expenses.filter(e => e.id !== expenseId));
      toast.success('Expense deleted successfully');
    } catch (error) {
      toast.error('Failed to delete expense');
    }
  };

  const handleSettle = async (settlementData) => {
    try {
      const response = await api.post('/settlements', settlementData);
      const newSettlement = { ...response.data, id: response.data._id };
      setSettlements([newSettlement, ...settlements]);
      setShowSettleModal(false);
      toast.success('Settlement recorded!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to record settlement');
    }
  };

  const calculateTotalExpenses = () => {
    return expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-sm text-slate-500">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <header className="glass sticky top-0 z-10 border-b border-slate-200/70 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-2.5 text-white shadow-lift sm:p-3">
              <Wallet size={22} className="sm:h-6 sm:w-6" strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-extrabold tracking-tight text-slate-900 sm:text-2xl">
                ExpenceTracker
              </h1>
              <p className="hidden text-xs text-slate-500 sm:block">
                {greeting}, {user?.name?.split(' ')[0]} 👋
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {user && (
              <span className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-3 shadow-sm md:inline-flex">
                <span className={`flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br ${avatarGradient(user.name)} text-[11px] font-bold text-white`}>
                  {initials(user.name)}
                </span>
                <span className="max-w-[140px] truncate text-sm font-semibold text-slate-700">
                  {user.name}
                </span>
              </span>
            )}
            <Button
              onClick={() => setShowGroupModal(true)}
              className="items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 px-3 text-white shadow-soft transition-all hover:from-emerald-600 hover:to-teal-700 active:scale-[0.98] sm:px-4"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Group</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              title="Logout"
              aria-label="Logout"
              className="h-9 w-9 shrink-0 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          <MetricCard
            title="Active Groups"
            value={groups.length}
            icon={<Users className="h-5 w-5 text-blue-600" />}
            chipClass="from-blue-500 to-indigo-600"
            delay={0.05}
          />
          <MetricCard
            title="Total Expenses"
            value={`₹${calculateTotalExpenses().toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
            icon={<Receipt className="h-5 w-5 text-emerald-600" />}
            chipClass="from-emerald-500 to-teal-600"
            delay={0.12}
          />
          <MetricCard
            title="Settlements"
            value={settlements.length}
            icon={<TrendingUp className="h-5 w-5 text-amber-600" />}
            chipClass="from-amber-400 to-orange-500"
            delay={0.19}
          />
        </div>

        {invites.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 rounded-2xl border border-amber-200/70 bg-amber-50/80 p-4 shadow-soft sm:p-5"
          >
            <div className="mb-3 flex items-center gap-2">
              <Mail className="h-4 w-4 text-amber-600" />
              <h2 className="font-bold text-slate-900">Pending Invitations ({invites.length})</h2>
            </div>
            <div className="space-y-2">
              {invites.map((invite) => (
                <div key={invite.id} className="flex flex-col gap-3 rounded-xl border border-amber-200/70 bg-white p-3 shadow-sm sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarGradient(invite.name)} text-xs font-bold text-white`}>
                      {initials(invite.name)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{invite.name}</p>
                      <p className="truncate text-xs text-slate-500">
                        Invited by {invite.invitedByName || 'a member'}
                        {invite.invitedAt ? ` · ${new Date(invite.invitedAt).toLocaleDateString()}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button size="sm" onClick={() => handleAcceptInvite(invite)} className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 sm:flex-none">
                      <Check className="h-4 w-4" /> Accept
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDeclineInvite(invite)} className="flex-1 border-slate-200 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 sm:flex-none">
                      <X className="h-4 w-4" /> Decline
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mt-8">
          <TabsList className="no-scrollbar flex w-full items-center gap-1.5 overflow-x-auto rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-soft sm:grid sm:grid-cols-4 sm:overflow-visible sm:gap-0">
            <TabsTrigger value="groups" className="shrink-0 whitespace-nowrap rounded-xl px-4 py-2 text-xs font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white sm:px-0 sm:text-sm">Groups</TabsTrigger>
            <TabsTrigger value="expenses" className="shrink-0 whitespace-nowrap rounded-xl px-4 py-2 text-xs font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white sm:px-0 sm:text-sm">Expenses</TabsTrigger>
            <TabsTrigger value="balances" className="shrink-0 whitespace-nowrap rounded-xl px-4 py-2 text-xs font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white sm:px-0 sm:text-sm">Balances</TabsTrigger>
            <TabsTrigger value="settlements" className="shrink-0 whitespace-nowrap rounded-xl px-4 py-2 text-xs font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white sm:px-0 sm:text-sm">Settlements</TabsTrigger>
          </TabsList>

          <TabsContent value="groups" className="mt-6">
            {groups.length === 0 ? (
              <EmptyState onAction={() => setShowGroupModal(true)} />
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {groups.map((group, index) => (
                  <GroupCard
                    key={group.id}
                    group={group}
                    currentUserId={user?._id}
                    expenses={expenses.filter(e => e.groupId === group.id)}
                    settlements={settlements.filter(s => s.groupId === group.id)}
                    onAddExpense={(g) => { setSelectedGroup(g); setShowExpenseModal(true); }}
                    onSettle={(g) => { setSelectedGroup(g); setShowSettleModal(true); }}
                    onDeleted={handleDeleteGroup}
                    index={index}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="expenses" className="mt-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-slate-900">All Expenses</h2>
              <ExportReportButton expenses={expenses} groups={groups} settlements={settlements} />
            </div>
            <ExpenseList expenses={expenses} groups={groups} onDelete={handleDeleteExpense} />
          </TabsContent>

          <TabsContent value="balances" className="mt-6">
            <BalanceSummary groups={groups} expenses={expenses} settlements={settlements} />
          </TabsContent>

          <TabsContent value="settlements" className="mt-6">
            <SettlementHistory settlements={settlements} groups={groups} />
          </TabsContent>
        </Tabs>
      </main>

      <AIChatbot
        onRefresh={fetchData}
        onAutoAddExpense={handleAutoAddExpense}
        onAutoCreateGroup={handleAutoCreateGroup}
      />

      <GroupModal isOpen={showGroupModal} onClose={() => setShowGroupModal(false)} onSubmit={handleCreateGroup} />
      <ExpenseModal isOpen={showExpenseModal} onClose={() => setShowExpenseModal(false)} onSubmit={handleAddExpense} group={selectedGroup} />
      <SettlementModal isOpen={showSettleModal} onClose={() => setShowSettleModal(false)} onSubmit={handleSettle} group={selectedGroup} expenses={expenses} settlements={settlements} />
    </div>
  );
};

const MetricCard = ({ title, value, icon, chipClass, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    whileHover={{ y: -3 }}
    className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-soft transition-shadow hover:shadow-lift sm:p-5"
  >
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 sm:text-sm">{title}</p>
      <p className="mt-1.5 truncate text-xl font-extrabold text-slate-900 sm:text-2xl">{value}</p>
    </div>
    <div className={`shrink-0 rounded-xl bg-gradient-to-br ${chipClass} p-2.5 text-white shadow-soft`}>
      {icon}
    </div>
  </motion.div>
);

const EmptyState = ({ onAction }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-center shadow-sm sm:p-14"
  >
    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100">
      <FolderPlus className="h-8 w-8 text-emerald-600" />
    </div>
    <h3 className="text-xl font-bold text-slate-900">No groups yet</h3>
    <p className="mx-auto mt-1.5 max-w-sm text-sm text-slate-500">
      Create a group, invite your friends, and start tracking shared expenses together.
    </p>
    <Button
      onClick={onAction}
      className="mt-5 gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-soft hover:from-emerald-600 hover:to-teal-700"
    >
      <Plus className="h-4 w-4" /> Create Group
    </Button>
  </motion.div>
);

export default Dashboard;