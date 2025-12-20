import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import Dashboard from '@/components/Dashboard';
import GroupModal from '@/components/GroupModal';
import ExpenseModal from '@/components/ExpenseModal';
import SettlementModal from '@/components/SettlementModal';
import { Toaster, toast } from 'sonner'; // Use toast from sonner

function App() {
  const [groups, setGroups] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);

  // Load data from LocalStorage on mount
  useEffect(() => {
    const savedGroups = localStorage.getItem('expenseGroups');
    const savedExpenses = localStorage.getItem('expenses');
    const savedSettlements = localStorage.getItem('settlements');
    
    if (savedGroups) setGroups(JSON.parse(savedGroups));
    if (savedExpenses) setExpenses(JSON.parse(savedExpenses));
    if (savedSettlements) setSettlements(JSON.parse(savedSettlements));
  }, []);

  // Save to LocalStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('expenseGroups', JSON.stringify(groups));
  }, [groups]);

  useEffect(() => {
    localStorage.setItem('expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('settlements', JSON.stringify(settlements));
  }, [settlements]);

  const handleCreateGroup = (groupData) => {
    const newGroup = {
      id: Date.now().toString(),
      ...groupData,
      createdAt: new Date().toISOString()
    };
    setGroups([...groups, newGroup]);
    setIsGroupModalOpen(false);
    toast.success(`Group "${groupData.name}" created!`);
  };

  const handleAddExpense = (expenseData) => {
    const newExpense = {
      id: Date.now().toString(),
      ...expenseData,
      createdAt: new Date().toISOString()
    };
    setExpenses([...expenses, newExpense]);
    setIsExpenseModalOpen(false);
    toast.success(`Expense "${expenseData.description}" added.`);
  };

  const handleSettlement = (settlementData) => {
    const newSettlement = {
      id: Date.now().toString(),
      ...settlementData,
      createdAt: new Date().toISOString()
    };
    setSettlements([...settlements, newSettlement]);
    setIsSettlementModalOpen(false);
    toast.success("Payment recorded successfully.");
  };

  const handleDeleteGroup = (groupId) => {
    setGroups(groups.filter(g => g.id !== groupId));
    setExpenses(expenses.filter(e => e.groupId !== groupId));
    setSettlements(settlements.filter(s => s.groupId !== groupId));
    toast.info("Group removed.");
  };

  const handleDeleteExpense = (expenseId) => {
    setExpenses(expenses.filter(e => e.id !== expenseId));
    toast.info("Expense removed.");
  };

  return (
    <>
      <Helmet>
        <title>CredResolve - Expense Sharing Made Easy</title>
        <meta name="description" content="Track shared expenses and settle dues easily." />
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Dashboard
          groups={groups}
          expenses={expenses}
          settlements={settlements}
          onCreateGroup={() => setIsGroupModalOpen(true)}
          onAddExpense={(group) => {
            setSelectedGroup(group);
            setIsExpenseModalOpen(true);
          }}
          onSettle={(group) => {
            setSelectedGroup(group);
            setIsSettlementModalOpen(true);
          }}
          onDeleteGroup={handleDeleteGroup}
          onDeleteExpense={handleDeleteExpense}
        />

        <GroupModal
          isOpen={isGroupModalOpen}
          onClose={() => setIsGroupModalOpen(false)}
          onSubmit={handleCreateGroup}
        />

        <ExpenseModal
          isOpen={isExpenseModalOpen}
          onClose={() => {
            setIsExpenseModalOpen(false);
            setSelectedGroup(null);
          }}
          onSubmit={handleAddExpense}
          group={selectedGroup}
        />

        <SettlementModal
          isOpen={isSettlementModalOpen}
          onClose={() => {
            setIsSettlementModalOpen(false);
            setSelectedGroup(null);
          }}
          onSubmit={handleSettlement}
          group={selectedGroup}
          expenses={expenses}
          settlements={settlements}
        />

        <Toaster richColors position="top-right" />
      </div>
    </>
  );
}

export default App; 