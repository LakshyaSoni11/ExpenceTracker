import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Receipt, DollarSign, TrendingUp, Wallet, Loader2, LogOut, Mail, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GroupCard from '@/components/GroupCard';
import ExpenseModal from '@/components/ExpenseModal';
import ExpenseList from '@/components/ExpenseList';
import BalanceSummary from '@/components/BalanceSummary';
import SettlementModal from './SettlementModal';
import SettlementHistory from '@/components/SettlementHistory';
import GroupModal from '@/components/GroupModal';
import AIChatbot from '@/components/AIChatbot'; // Integrated AI Component
import ExportReportButton from '@/components/ExportReportButton';
import api from "@/api/axios";
import { toast } from "sonner";
import { useAuth } from '@/context/AuthContext';
import socket from '@/lib/socket';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [groups, setGroups] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('groups');
  
  // Modal states
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

  // --- AI AUTO-HANDLERS (Task Automation) ---

  const handleAutoCreateGroup = async (params) => {
    // Resolve member names to registered user IDs (AI passes names)
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
    // Find the group ID by name since AI only knows names
    const targetGroup = groups.find(g => g.name.toLowerCase() === params.group.toLowerCase());
    if (!targetGroup) {
      toast.error(`Group "${params.group}" not found.`);
      throw new Error("Group not found");
    }

    // Default to splitting equally among all active members (members are populated objects)
    const active = targetGroup.members.filter((m) => m.membershipStatus === 'active');
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

  // --- MANUAL HANDLERS (Used by Modals & AI) ---

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
      toast.error('Failed to create group');
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
        splits: expenseData.splits
      });
      const newExpense = { ...response.data, id: response.data._id };
      setExpenses([newExpense, ...expenses]);
      setShowExpenseModal(false);
      toast.success('Expense added successfully!');
    } catch (error) {
      toast.error('Failed to add expense');
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
      toast.error('Failed to record settlement');
    }
  };

  const calculateTotalExpenses = () => {
    return expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 relative">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 flex justify-between items-center gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2 sm:p-3 rounded-xl shadow-lg text-white shrink-0">
              <Wallet size={24} className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <h1 className="text-xl sm:text-3xl font-bold text-slate-900 truncate leading-tight">Expense Tracker</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {user && (
              <span className="hidden sm:inline-flex text-sm font-medium text-slate-700 px-3 py-1 bg-slate-100 rounded-full truncate max-w-[200px]">{user.name}</span>
            )}
            <Button onClick={() => setShowGroupModal(true)} className="bg-emerald-600 text-white shrink-0 px-3 sm:px-4">
              <Plus className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">New Group</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={logout} title="Logout" className="shrink-0 hover:bg-red-50 hover:text-red-600" aria-label="Logout">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <MetricCard title="Active Groups" value={groups.length} icon={<Users className="text-blue-600"/>} bgColor="bg-blue-100" delay={0.1} />
          <MetricCard title="Total Expenses" value={`₹${calculateTotalExpenses().toFixed(2)}`} icon={<Receipt className="text-emerald-600"/>} bgColor="bg-emerald-100" delay={0.2} />
          <MetricCard title="Settlements" value={settlements.length} icon={<TrendingUp className="text-amber-600"/>} bgColor="bg-amber-100" delay={0.3} />
        </div>

        {invites.length > 0 && (
          <div className="mb-8 bg-amber-50 border border-amber-200 rounded-xl p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3">
              <Mail className="w-4 h-4 text-amber-600" />
              <h2 className="font-semibold text-slate-900">Pending Invitations ({invites.length})</h2>
            </div>
            <div className="space-y-2">
              {invites.map((invite) => (
                <div key={invite.id} className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white rounded-lg border border-amber-200 p-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{invite.name}</p>
                    <p className="text-sm text-slate-600 truncate">
                      Invited by {invite.invite?.invitedBy || 'a member'}
                      {invite.invite?.invitedAt ? ` · ${new Date(invite.invite.invitedAt).toLocaleDateString()}` : ''}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" onClick={() => handleAcceptInvite(invite)} className="bg-emerald-600 hover:bg-emerald-700">
                      <Check className="w-4 h-4 mr-1" /> Accept
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDeclineInvite(invite)} className="hover:bg-red-50 hover:text-red-600 hover:border-red-300">
                      <X className="w-4 h-4 mr-1" /> Decline
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 bg-white rounded-xl p-1 shadow-md border border-slate-200">
            <TabsTrigger value="groups" className="text-xs sm:text-sm px-1 sm:px-3">Groups</TabsTrigger>
            <TabsTrigger value="expenses" className="text-xs sm:text-sm px-1 sm:px-3">Expenses</TabsTrigger>
            <TabsTrigger value="balances" className="text-xs sm:text-sm px-1 sm:px-3">Balances</TabsTrigger>
            <TabsTrigger value="settlements" className="text-xs sm:text-sm px-1 sm:px-3">Settlements</TabsTrigger>
          </TabsList>

          <TabsContent value="groups" className="mt-6">
            {groups.length === 0 ? (
              <EmptyState title="No groups yet" onAction={() => setShowGroupModal(true)} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groups.map((group, index) => (
                  <GroupCard
                    key={group.id}
                    group={group}
                    expenses={expenses.filter(e => e.groupId === group.id)}
                    settlements={settlements.filter(s => s.groupId === group.id)}
                    onAddExpense={() => { setSelectedGroup(group); setShowExpenseModal(true); }}
                    onSettle={() => { setSelectedGroup(group); setShowSettleModal(true); }}
                    onDeleted={handleDeleteGroup}
                    index={index}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          {/* Other tab contents map to existing lists... */}
          <TabsContent value="expenses" className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-slate-900">All Expenses</h2>
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

      {/* --- AI CHATBOT BUBBLE --- */}
      <AIChatbot 
        onRefresh={fetchData} 
        onAutoAddExpense={handleAutoAddExpense} 
        onAutoCreateGroup={handleAutoCreateGroup}
      />

      {/* Modals */}
      <GroupModal isOpen={showGroupModal} onClose={() => setShowGroupModal(false)} onSubmit={handleCreateGroup} />
      <ExpenseModal isOpen={showExpenseModal} onClose={() => setShowExpenseModal(false)} onSubmit={handleAddExpense} group={selectedGroup} />
      <SettlementModal isOpen={showSettleModal} onClose={() => setShowSettleModal(false)} onSubmit={handleSettle} group={selectedGroup} expenses={expenses} settlements={settlements} />
    </div>
  );
};

const MetricCard = ({ title, value, icon, bgColor, delay }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className="bg-white rounded-xl p-4 sm:p-6 shadow-md border border-slate-200">
    <div className="flex items-center justify-between">
      <div className="min-w-0">
        <p className="text-xs sm:text-sm font-medium text-slate-600">{title}</p>
        <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2 break-all">{value}</p>
      </div>
      <div className={`${bgColor} p-2 sm:p-3 rounded-lg shrink-0`}>{icon}</div>
    </div>
  </motion.div>
);

const EmptyState = ({ title, onAction }) => (
  <div className="bg-white rounded-xl p-6 sm:p-12 text-center shadow-md border border-slate-200">
    <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
    <h3 className="text-xl font-semibold text-slate-900 mb-2">{title}</h3>
    <Button onClick={onAction} className="bg-emerald-600 text-white mt-4">
      <Plus className="w-4 h-4 mr-2" /> Create Group
    </Button>
  </div>
);

export default Dashboard;