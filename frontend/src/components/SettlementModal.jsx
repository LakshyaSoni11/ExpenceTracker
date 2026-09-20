import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner'; // Swapped from use-toast

const SettlementModal = ({ isOpen, onClose, onSubmit, group, expenses, settlements }) => {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');

  const resetForm = () => {
    setFrom('');
    setTo('');
    setAmount('');
  };

  const calculateBalances = () => {
    if (!group) return {};
    
    const balances = {};
    group.members.forEach(member => {
      balances[member] = 0;
    });

    const groupExpenses = expenses.filter(e => e.groupId === group.id);
    const groupSettlements = settlements.filter(s => s.groupId === group.id);

    groupExpenses.forEach(expense => {
      const paidBy = expense.paidBy;
      const expenseAmount = parseFloat(expense.amount);
      balances[paidBy] += expenseAmount;

      expense.splits.forEach(split => {
        balances[split.member] -= parseFloat(split.amount);
      });
    });

    groupSettlements.forEach(settlement => {
      balances[settlement.from] += parseFloat(settlement.amount);
      balances[settlement.to] -= parseFloat(settlement.amount);
    });

    return balances;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Refactored to Sonner
    if (!from || !to || !amount) {
      toast.error("Please fill in all fields");
      return;
    }

    if (from === to) {
      toast.error("You cannot settle with yourself");
      return;
    }

    if (parseFloat(amount) <= 0) {
      toast.error("Amount must be greater than zero");
      return;
    }

    onSubmit({
      groupId: group.id,
      from,
      to,
      amount: parseFloat(amount)
    });

    toast.success(`Settlement recorded: ${from} paid ${to}`);
    resetForm();
    onClose();
  };

  if (!group) return null;

  const balances = calculateBalances();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-125 bg-gray-300">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl font-bold text-slate-900">Settle Dues - {group.name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="text-sm font-semibold text-emerald-500 mb-2">Current Balances</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.entries(balances).map(([member, balance]) => (
                <div key={member} className="flex justify-between text-xs p-1 bg-white/50 rounded">
                  <span className="text-slate-700 font-medium">{member}</span>
                  <span className={`font-bold ${balance > 0 ? 'text-emerald-600' : balance < 0 ? 'text-red-600' : 'text-slate-400'}`}>
                    {balance > 0 ? '+' : ''}{balance.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="from" className="text-sm font-medium text-slate-700">
                From (Payer)
              </Label>
              <select
                id="from"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all bg-white"
              >
                <option value="">Select</option>
                {group.members.map(member => (
                  <option key={member} value={member}>{member}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="to" className="text-sm font-medium text-slate-700">
                To (Receiver)
              </Label>
              <select
                id="to"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all bg-white"
              >
                <option value="">Select</option>
                {group.members.map(member => (
                  <option key={member} value={member}>{member}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center gap-2 flex-wrap">
              <Label htmlFor="amount" className="text-sm font-medium text-slate-700">
                Amount
              </Label>
              {from && balances[from] < 0 && (
                <button 
                  type="button"
                  onClick={() => setAmount(Math.abs(balances[from]).toFixed(2))}
                  className="text-xs text-emerald-600 hover:underline font-medium"
                >
                  Settle full debt (₹{Math.abs(balances[from]).toFixed(2)})
                </button>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400">₹</span>
              <input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-7 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-linear-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md transition-all active:scale-95"
            >
              Record Settlement
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SettlementModal;