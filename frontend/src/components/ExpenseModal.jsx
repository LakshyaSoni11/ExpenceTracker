import React, { useState } from 'react';
import { IndianRupee, Percent, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner'; // Swapped from useToast

const ExpenseModal = ({ isOpen, onClose, onSubmit, group }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [splitType, setSplitType] = useState('equal');
  const [exactSplits, setExactSplits] = useState({});
  const [percentSplits, setPercentSplits] = useState({});

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setPaidBy('');
    setSplitType('equal');
    setExactSplits({});
    setPercentSplits({});
  };

  const calculateEqualSplit = () => {
    if (!group || !amount) return [];
    const splitAmount = (parseFloat(amount) / group.members.length).toFixed(2);
    return group.members.map(member => ({
      member,
      amount: splitAmount
    }));
  };

  const calculateExactSplit = () => {
    return Object.entries(exactSplits).map(([member, amt]) => ({
      member,
      amount: amt || '0'
    }));
  };

  const calculatePercentSplit = () => {
    if (!amount) return [];
    return Object.entries(percentSplits).map(([member, percent]) => ({
      member,
      amount: ((parseFloat(amount) * (parseFloat(percent || 0) / 100))).toFixed(2)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Updated Sonner error handling
    if (!description.trim() || !amount || !paidBy) {
      toast.error("Please fill in all required fields");
      return;
    }

    let splits = [];
    if (splitType === 'equal') {
      splits = calculateEqualSplit();
    } else if (splitType === 'exact') {
      splits = calculateExactSplit();
      const total = splits.reduce((sum, s) => sum + parseFloat(s.amount), 0);
      if (Math.abs(total - parseFloat(amount)) > 0.01) {
        toast.error(`Total sum (₹${total.toFixed(2)}) doesn't match amount (₹${amount})`);
        return;
      }
    } else if (splitType === 'percent') {
      const totalPercent = Object.values(percentSplits).reduce((sum, p) => sum + parseFloat(p || 0), 0);
      if (Math.abs(totalPercent - 100) > 0.01) {
        toast.error("Percentages must add up to exactly 100%");
        return;
      }
      splits = calculatePercentSplit();
    }

    onSubmit({
      groupId: group.id,
      description,
      amount,
      paidBy,
      splitType,
      splits
    });
    
    toast.success("Expense added successfully!");
    resetForm();
    onClose();
  };

  if (!group) return null;

  const totalAmount = parseFloat(amount) || 0;
  const exactAssigned = Object.values(exactSplits).reduce((sum, value) => sum + (parseFloat(value) || 0), 0);
  const exactRemaining = totalAmount - exactAssigned;
  const exactBalanced = Math.abs(exactRemaining) < 0.01;

  const totalPercent = Object.values(percentSplits).reduce((sum, value) => sum + (parseFloat(value) || 0), 0);
  const percentRemaining = 100 - totalPercent;
  const percentBalanced = Math.abs(percentRemaining) < 0.01;

  const balanceTone = (balanced, over) =>
    balanced ? 'text-emerald-600' : over < 0 ? 'text-red-600' : 'text-amber-600';

  const progressTone = (balanced, over) =>
    balanced ? 'bg-emerald-500' : over < 0 ? 'bg-red-500' : 'bg-amber-400';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-150 bg-gray-300">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl font-bold text-slate-900">Add Expense to {group.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-slate-700">
              Description
            </Label>
            <input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              placeholder="e.g., Dinner at restaurant"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-sm font-medium text-slate-700">
                Amount
              </Label>
              <input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paidBy" className="text-sm font-medium text-slate-700">
                Paid By
              </Label>
              <select
                id="paidBy"
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white"
              >
                <option value="">Select member</option>
                {group.members.map(member => (
                  <option key={member} value={member}>{member}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium text-slate-700">Split Method</Label>
            <Tabs value={splitType} onValueChange={setSplitType}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="equal">
                  <Users className="w-4 h-4 mr-1" />
                  Equal
                </TabsTrigger>
                <TabsTrigger value="exact">
                  <IndianRupee className="w-4 h-4 mr-1" />
                  Exact
                </TabsTrigger>
                <TabsTrigger value="percent">
                  <Percent className="w-4 h-4 mr-1" />
                  Percent
                </TabsTrigger>
              </TabsList>

              <TabsContent value="equal" className="mt-4">
                <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                  <p className="text-sm text-slate-700">
                    The expense will be split equally among all {group.members.length} members.
                    {amount && ` Each person pays ₹${(parseFloat(amount) / group.members.length).toFixed(2)}`}
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="exact" className="mt-4 space-y-2">
                {group.members.map(member => (
                  <div key={member} className="flex items-center gap-3">
                    <Label className="w-32 text-sm">{member}</Label>
                    <input
                      type="number"
                      step="0.01"
                      value={exactSplits[member] || ''}
                      onChange={(e) => setExactSplits({...exactSplits, [member]: e.target.value})}
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                      placeholder="0.00"
                    />
                  </div>
                ))}

                {totalAmount > 0 && (
                  <div className="mt-2 bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-slate-700">
                        Allotted: <span className="font-semibold text-slate-900">₹{exactAssigned.toFixed(2)}</span>
                        <span className="text-slate-500"> / ₹{totalAmount.toFixed(2)}</span>
                      </p>
                      <span className={`text-sm font-semibold ${balanceTone(exactBalanced, exactRemaining)}`}>
                        ₹{Math.abs(exactRemaining).toFixed(2)} {exactRemaining >= 0 ? 'left' : 'over'}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${progressTone(exactBalanced, exactRemaining)}`}
                        style={{ width: `${Math.min(100, (exactAssigned / totalAmount) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="percent" className="mt-4 space-y-2">
                {group.members.map(member => (
                  <div key={member} className="flex items-center gap-3">
                    <Label className="w-32 text-sm">{member}</Label>
                    <input
                      type="number"
                      step="0.01"
                      value={percentSplits[member] || ''}
                      onChange={(e) => setPercentSplits({...percentSplits, [member]: e.target.value})}
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                      placeholder="0"
                    />
                    <span className="text-slate-600">%</span>
                  </div>
                ))}

                {totalAmount > 0 && (
                  <div className="mt-2 bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-slate-700">
                        Allocated: <span className="font-semibold text-slate-900">{totalPercent.toFixed(2)}%</span>
                        <span className="text-slate-500"> / 100%</span>
                      </p>
                      <span className={`text-sm font-semibold ${balanceTone(percentBalanced, percentRemaining)}`}>
                        {Math.abs(percentRemaining).toFixed(2)}% {percentRemaining >= 0 ? 'left' : 'over'}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${progressTone(percentBalanced, percentRemaining)}`}
                        style={{ width: `${Math.min(100, totalPercent)}%` }}
                      />
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
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
              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
            >
              Add Expense
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ExpenseModal;