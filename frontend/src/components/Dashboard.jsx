import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Receipt, DollarSign, TrendingUp, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GroupCard from '@/components/GroupCard';
import ExpenseList from '@/components/ExpenseList';
import BalanceSummary from '@/components/BalanceSummary';
import SettlementHistory from '@/components/SettlementHistory';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Dashboard = ({ 
  groups, 
  expenses, 
  settlements, 
  onCreateGroup, 
  onAddExpense, 
  onSettle,
  onDeleteGroup,
  onDeleteExpense
}) => {
  const [selectedTab, setSelectedTab] = useState('groups');

  const calculateTotalExpenses = () => {
    return expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
  };

  const calculateActiveGroups = () => {
    return groups.length;
  };

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-3 rounded-xl shadow-lg">
                <Wallet className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Expence Tracker App</h1>
                <p className="text-sm text-slate-600">Simple Expence Tracking application</p>
              </div>
            </div>
            <Button 
              onClick={onCreateGroup}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Group
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-6 shadow-md border border-slate-200 hover:shadow-lg transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Active Groups</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{calculateActiveGroups()}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-6 shadow-md border border-slate-200 hover:shadow-lg transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Expenses</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">${calculateTotalExpenses().toFixed(2)}</p>
              </div>
              <div className="bg-emerald-100 p-3 rounded-lg">
                <Receipt className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-6 shadow-md border border-slate-200 hover:shadow-lg transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Settlements</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{settlements.length}</p>
              </div>
              <div className="bg-amber-100 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </motion.div>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white rounded-xl p-1 shadow-md border border-slate-200">
            <TabsTrigger value="groups" className="data-[state=active]:bg-linear-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white">
              Groups
            </TabsTrigger>
            <TabsTrigger value="expenses" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white">
              Expenses
            </TabsTrigger>
            <TabsTrigger value="balances" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white">
              Balances
            </TabsTrigger>
            <TabsTrigger value="settlements" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white">
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="groups" className="mt-6">
            {groups.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center shadow-md border border-slate-200">
                <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No groups yet</h3>
                <p className="text-slate-600 mb-6">Create your first group to start tracking expenses</p>
                <Button onClick={onCreateGroup} className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Group
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groups.map((group, index) => (
                  <GroupCard
                    key={group.id}
                    group={group}
                    expenses={expenses.filter(e => e.groupId === group.id)}
                    settlements={settlements.filter(s => s.groupId === group.id)}
                    onAddExpense={onAddExpense}
                    onSettle={onSettle}
                    onDelete={onDeleteGroup}
                    index={index}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="expenses" className="mt-6">
            <ExpenseList 
              expenses={expenses} 
              groups={groups}
              onDelete={onDeleteExpense}
            />
          </TabsContent>

          <TabsContent value="balances" className="mt-6">
            <BalanceSummary 
              groups={groups}
              expenses={expenses}
              settlements={settlements}
            />
          </TabsContent>

          <TabsContent value="settlements" className="mt-6">
            <SettlementHistory 
              settlements={settlements}
              groups={groups}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;