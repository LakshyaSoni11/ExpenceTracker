import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Receipt, DollarSign, TrendingUp, Wallet, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GroupCard from '@/components/GroupCard';
import ExpenseModal from '@/components/ExpenseModal';
import ExpenseList from '@/components/ExpenseList';
import BalanceSummary from '@/components/BalanceSummary';
// import SettlementModal from '@/components/SettlementModal';
import SettlementModal from './SettlementModal';
import SettlementHistory from '@/components/SettlementHistory';
import GroupModal from '@/components/GroupModal';
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

  // Fetch all data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [groupsRes, expensesRes, settlementsRes] = await Promise.all([
        api.get('/groups'),
        api.get('/expenses'),
        api.get('/settlements')
      ]);
      
      // Transform data to match component expectations (id instead of _id)
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

  // Group handlers
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
      console.error('Error creating group:', error);
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
      console.error('Delete error:', error);
      toast.error('Failed to delete group');
    }
  };

  // Expense handlers
  const openExpenseModal = (group) => {
    setSelectedGroup(group);
    setShowExpenseModal(true);
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
      console.error('Error adding expense:', error);
      toast.error('Failed to add expense');
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    try {
      await api.delete(`/expenses/${expenseId}`);
      setExpenses(expenses.filter(e => e.id !== expenseId));
      toast.success('Expense deleted successfully');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete expense');
    }
  };

  // Settlement handlers
  const openSettleModal = (group) => {
    setSelectedGroup(group);
    setShowSettleModal(true);
  };

  const handleSettle = async (settlementData) => {
    try {
      const response = await api.post('/settlements', {
        groupId: settlementData.groupId,
        from: settlementData.from,
        to: settlementData.to,
        amount: parseFloat(settlementData.amount)
      });
      const newSettlement = { ...response.data, id: response.data._id };
      setSettlements([newSettlement, ...settlements]);
      setShowSettleModal(false);
      toast.success('Settlement recorded successfully!');
    } catch (error) {
      console.error('Error recording settlement:', error);
      toast.error('Failed to record settlement');
    }
  };

  const calculateTotalExpenses = () => {
    return expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-3 rounded-xl shadow-lg">
                <Wallet className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Expense Tracker</h1>
              </div>
            </div>
            <Button 
              onClick={() => setShowGroupModal(true)}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Group
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <MetricCard 
            title="Active Groups" 
            value={groups.length} 
            icon={<Users className="w-6 h-6 text-blue-600" />} 
            bgColor="bg-blue-100" 
            delay={0.1}
          />
          <MetricCard 
            title="Total Expenses" 
            value={`₹${calculateTotalExpenses().toFixed(2)}`} 
            icon={<Receipt className="w-6 h-6 text-emerald-600" />} 
            bgColor="bg-emerald-100" 
            delay={0.2}
          />
          <MetricCard 
            title="Settlements" 
            value={settlements.length} 
            icon={<TrendingUp className="w-6 h-6 text-amber-600" />} 
            bgColor="bg-amber-100" 
            delay={0.3}
          />
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-4 bg-white rounded-xl p-1 shadow-md border border-slate-200">
            <TabsTrigger value="groups">Groups</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="balances">Balances</TabsTrigger>
            <TabsTrigger value="settlements">Settlements</TabsTrigger>
          </TabsList>

          {/* Groups Tab */}
          <TabsContent value="groups" className="mt-6">
            {groups.length === 0 ? (
              <EmptyState 
                title="No groups yet" 
                onAction={() => setShowGroupModal(true)} 
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groups.map((group, index) => (
                  <GroupCard
                    key={group.id}
                    group={group}
                    expenses={expenses.filter(e => e.groupId === group.id)}
                    settlements={settlements.filter(s => s.groupId === group.id)}
                    onAddExpense={() => openExpenseModal(group)}
                    onSettle={() => openSettleModal(group)}
                    onDeleted={handleDeleteGroup}
                    index={index}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Expenses Tab */}
          <TabsContent value="expenses" className="mt-6">
            <ExpenseList 
              expenses={expenses} 
              groups={groups} 
              onDelete={handleDeleteExpense} 
            />
          </TabsContent>

          {/* Balances Tab */}
          <TabsContent value="balances" className="mt-6">
            <BalanceSummary 
              groups={groups} 
              expenses={expenses} 
              settlements={settlements} 
            />
          </TabsContent>

          {/* Settlements Tab */}
          <TabsContent value="settlements" className="mt-6">
            <SettlementHistory 
              settlements={settlements} 
              groups={groups} 
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Modals */}
      <GroupModal 
        isOpen={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        onSubmit={handleCreateGroup}
      />

      <ExpenseModal
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        onSubmit={handleAddExpense}
        group={selectedGroup}
      />

      <SettlementModal
        isOpen={showSettleModal}
        onClose={() => setShowSettleModal(false)}
        onSubmit={handleSettle}
        group={selectedGroup}
        expenses={expenses}
        settlements={settlements}
      />
    </div>
  );
};

// Metric Card Component
const MetricCard = ({ title, value, icon, bgColor, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white rounded-xl p-6 shadow-md border border-slate-200"
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-600">{title}</p>
        <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
      </div>
      <div className={`${bgColor} p-3 rounded-lg`}>{icon}</div>
    </div>
  </motion.div>
);

// Empty State Component
const EmptyState = ({ title, onAction }) => (
  <div className="bg-white rounded-xl p-12 text-center shadow-md border border-slate-200">
    <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
    <h3 className="text-xl font-semibold text-slate-900 mb-2">{title}</h3>
    <p className="text-slate-600 mb-6">Create your first group to start tracking expenses</p>
    <Button onClick={onAction} className="bg-emerald-600 hover:bg-emerald-700">
      <Plus className="w-4 h-4 mr-2" /> Create First Group
    </Button>
  </div>
);

export default Dashboard;