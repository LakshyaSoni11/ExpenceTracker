import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Receipt, DollarSign, TrendingUp, Wallet, Loader2 } from 'lucide-react';
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
import api from "@/api/axios";
import { toast } from "sonner";

const Dashboard = () => {
  const [groups, setGroups] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('groups');
  
  // Modal states
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);

  // --- DATA FETCHING ---
  const fetchData = async () => {
    try {
      setLoading(true);
      const [groupsRes, expensesRes, settlementsRes] = await Promise.all([
        api.get('/groups'),
        api.get('/expenses'),
        api.get('/settlements')
      ]);
      
      const transformedGroups = groupsRes.data.map(g => ({ ...g, id: g._id }));
      const transformedExpenses = expensesRes.data.map(e => ({ ...e, id: e._id }));
      const transformedSettlements = settlementsRes.data.map(s => ({ ...s, id: s._id }));
      
      setGroups(transformedGroups);
      setExpenses(transformedExpenses);
      setSettlements(transformedSettlements);
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

  // --- AI AUTO-HANDLERS (Task Automation) ---

  const handleAutoCreateGroup = async (params) => {
    // Logic to create a group directly from AI commands
    await handleCreateGroup({
      name: params.name,
      members: params.members || ["Owner", "Guest"]
    });
  };

  const handleAutoAddExpense = async (params) => {
    // Find the group ID by name since AI only knows names
    const targetGroup = groups.find(g => g.name.toLowerCase() === params.group.toLowerCase());
    if (!targetGroup) {
      toast.error(`Group "${params.group}" not found.`);
      throw new Error("Group not found");
    }

    // Default to splitting equally among all members
    const splitAmount = params.amount / targetGroup.members.length;
    const splits = targetGroup.members.map(m => ({
      member: m,
      amount: splitAmount
    }));

    await handleAddExpense({
      groupId: targetGroup.id,
      description: params.desc || "AI Generated Expense",
      amount: parseFloat(params.amount),
      paidBy: params.paidBy || targetGroup.members[0],
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
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-3 rounded-xl shadow-lg text-white">
              <Wallet size={28} />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Expense Tracker</h1>
          </div>
          <Button onClick={() => setShowGroupModal(true)} className="bg-emerald-600 text-white">
            <Plus className="w-4 h-4 mr-2" /> New Group
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <MetricCard title="Active Groups" value={groups.length} icon={<Users className="text-blue-600"/>} bgColor="bg-blue-100" delay={0.1} />
          <MetricCard title="Total Expenses" value={`₹${calculateTotalExpenses().toFixed(2)}`} icon={<Receipt className="text-emerald-600"/>} bgColor="bg-emerald-100" delay={0.2} />
          <MetricCard title="Settlements" value={settlements.length} icon={<TrendingUp className="text-amber-600"/>} bgColor="bg-amber-100" delay={0.3} />
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-4 bg-white rounded-xl p-1 shadow-md border border-slate-200">
            <TabsTrigger value="groups">Groups</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="balances">Balances</TabsTrigger>
            <TabsTrigger value="settlements">Settlements</TabsTrigger>
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
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className="bg-white rounded-xl p-6 shadow-md border border-slate-200">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-600">{title}</p>
        <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
      </div>
      <div className={`${bgColor} p-3 rounded-lg`}>{icon}</div>
    </div>
  </motion.div>
);

const EmptyState = ({ title, onAction }) => (
  <div className="bg-white rounded-xl p-12 text-center shadow-md border border-slate-200">
    <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
    <h3 className="text-xl font-semibold text-slate-900 mb-2">{title}</h3>
    <Button onClick={onAction} className="bg-emerald-600 text-white mt-4">
      <Plus className="w-4 h-4 mr-2" /> Create Group
    </Button>
  </div>
);

export default Dashboard;