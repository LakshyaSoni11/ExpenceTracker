import React from 'react';
import { motion } from 'framer-motion';
import { Receipt, Calendar, User, IndianRupee, Trash2 } from 'lucide-react';
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

const ExpenseList = ({ expenses, groups, onDelete }) => {
  const getGroupName = (groupId) => {
    const group = groups.find(g => g.id === groupId);
    return group ? group.name : 'Unknown Group';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (expenses.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 sm:p-12 text-center shadow-md border border-slate-200">
        <Receipt className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-slate-900 mb-2">No expenses yet</h3>
        <p className="text-slate-600">Add expenses to your groups to start tracking</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {expenses.map((expense, index) => (
        <motion.div
          key={expense.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className="bg-white rounded-xl p-6 shadow-md border border-slate-200 hover:shadow-lg transition-all duration-300 group"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2 rounded-lg">
                  <Receipt className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{expense.description}</h3>
                  <p className="text-sm text-slate-600">{getGroupName(expense.groupId)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="flex items-center gap-2 text-sm">
                  <IndianRupee className="w-4 h-4 text-emerald-600" />
                  <span className="text-slate-600">Amount:</span>
                  <span className="font-semibold text-slate-900">₹{parseFloat(expense.amount).toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-blue-600" />
                  <span className="text-slate-600">Paid by:</span>
                  <span className="font-semibold text-slate-900">{expense.paidBy}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-amber-600" />
                  <span className="text-slate-600">Date:</span>
                  <span className="font-semibold text-slate-900">{formatDate(expense.createdAt)}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-200">
                <p className="text-xs font-medium text-slate-600 mb-2">Split Details ({expense.splitType}):</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {expense.splits.map((split, idx) => (
                    <div key={idx} className="bg-slate-50 px-3 py-2 rounded-lg text-sm">
                      <span className="text-slate-700">{split.member}:</span>
                      <span className="font-semibold text-slate-900 ml-2">₹{parseFloat(split.amount).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600 ml-2 sm:ml-4 shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
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
      ))}
    </div>
  );
};

export default ExpenseList;