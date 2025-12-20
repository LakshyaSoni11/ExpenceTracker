import React from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, DollarSign, Trash2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const GroupCard = ({ group, expenses, settlements, onAddExpense, onSettle, onDelete, index }) => {
  const calculateGroupTotal = () => {
    return expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
  };

  const calculateBalances = () => {
    const balances = {};
    group.members.forEach(member => {
      balances[member] = 0;
    });

    expenses.forEach(expense => {
      const paidBy = expense.paidBy;
      const amount = parseFloat(expense.amount);
      balances[paidBy] += amount;

      expense.splits.forEach(split => {
        balances[split.member] -= parseFloat(split.amount);
      });
    });

    settlements.forEach(settlement => {
      balances[settlement.from] += parseFloat(settlement.amount);
      balances[settlement.to] -= parseFloat(settlement.amount);
    });

    return balances;
  };

  const balances = calculateBalances();
  const isBalanced = Object.values(balances).every(bal => Math.abs(bal) < 0.01);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-xl p-6 shadow-md border border-slate-200 hover:shadow-lg transition-all duration-300 group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-lg shadow-md">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{group.name}</h3>
            <p className="text-sm text-slate-600">{group.members.length} members</p>
          </div>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Group</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{group.name}"? This will remove all expenses and settlements associated with this group.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(group.id)} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
          <span className="text-sm font-medium text-slate-700">Total Expenses</span>
          <span className="text-lg font-bold text-emerald-600">${calculateGroupTotal().toFixed(2)}</span>
        </div>
        
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
          <span className="text-sm font-medium text-slate-700">Status</span>
          <span className={`text-sm font-semibold px-3 py-1 rounded-full ${isBalanced ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
            {isBalanced ? 'Settled' : 'Pending'}
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <Button 
          onClick={() => onAddExpense(group)}
          className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md hover:shadow-lg transition-all duration-300"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Expense
        </Button>
        <Button 
          onClick={() => onSettle(group)}
          variant="outline"
          className="flex-1 border-slate-300 hover:bg-slate-50 transition-all duration-300"
          size="sm"
        >
          <DollarSign className="w-4 h-4 mr-1" />
          Settle
        </Button>
      </div>
    </motion.div>
  );
};

export default GroupCard;