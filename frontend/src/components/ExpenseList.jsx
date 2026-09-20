import React from 'react';
import { motion } from 'framer-motion';
import { Receipt, Calendar, IndianRupee, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { memberId, memberName, buildMemberNameMap } from '@/lib/members';
import { initials, avatarGradient } from '@/lib/avatar';
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

const ExpenseList = ({ expenses, groups, onDelete }) => {
  const memberNames = buildMemberNameMap(groups);

  const getGroupName = (groupId) => {
    const group = groups.find(g => g.id === groupId);
    return group ? group.name : 'Unknown Group';
  };

  const getMemberName = (id) => memberNames[id] || 'Unknown member';

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (expenses.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 sm:p-14 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100">
          <Receipt className="h-8 w-8 text-emerald-600" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">No expenses yet</h3>
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-slate-500">
          Add expenses to your groups to start tracking shared costs.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {expenses.map((expense, index) => {
        const payerName = getMemberName(memberId(expense.paidBy));
        return (
          <motion.div
            key={expense.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft transition-shadow hover:shadow-lift sm:p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <div className="shrink-0 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-2.5 text-white shadow-soft">
                    <Receipt className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-bold text-slate-900 sm:text-lg">{expense.description}</h3>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                        {getGroupName(expense.groupId)}
                      </span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs text-slate-500">{formatDate(expense.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                  <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
                    <IndianRupee className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span className="text-sm text-slate-500">Amount</span>
                    <span className="ml-auto text-sm font-bold text-slate-900">₹{parseFloat(expense.amount).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarGradient(payerName)} text-[9px] font-bold text-white`}>
                      {initials(payerName)}
                    </span>
                    <span className="text-sm text-slate-500">Paid by</span>
                    <span className="ml-auto min-w-0 truncate text-sm font-semibold text-slate-900">{payerName}</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-1.5 pt-3">
                  <Calendar className="h-3.5 w-3.5 text-amber-600" />
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Split ({expense.splitType})
                  </p>
                </div>
                <div className="mt-2 grid grid-cols-1 gap-2 min-[400px]:grid-cols-2 md:grid-cols-3">
                  {expense.splits.map((split, idx) => {
                    const smName = getMemberName(memberId(split.member));
                    return (
                      <div key={idx} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm">
                        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarGradient(smName)} text-[8px] font-bold text-white`}>
                          {initials(smName)}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-xs text-slate-700">{smName}</span>
                        <span className="shrink-0 text-xs font-bold text-slate-900">₹{parseFloat(split.amount).toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Expense</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this expense? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(expense.id)} className="bg-red-600 hover:bg-red-700">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default ExpenseList;