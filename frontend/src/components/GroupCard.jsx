import React from "react";
import { motion } from "framer-motion";
import { Users, Plus, IndianRupee, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/api/axios";
import { toast } from "sonner";
import { memberId, memberName } from "@/lib/members";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const GroupCard = ({
  group,
  expenses,
  settlements,
  onAddExpense,
  onSettle,
  onDeleted,
  index,
}) => {
  const calculateBalances = () => {
    const balances = {};
    group.members.filter((m) => m.membershipStatus === 'active').forEach((m) => (balances[memberId(m)] = 0));

    expenses.forEach((e) => {
      balances[memberId(e.paidBy)] += e.amount;
      e.splits.forEach((s) => {
        balances[memberId(s.member)] -= s.amount;
      });
    });

    settlements.forEach((s) => {
      balances[memberId(s.from)] += s.amount;
      balances[memberId(s.to)] -= s.amount;
    });

    return balances;
  };

  const pendingCount = group.members.filter((m) => m.membershipStatus === 'invited').length;

  const balances = calculateBalances();
  const isBalanced = Object.values(balances).every(
    (b) => Math.abs(b) < 0.01
  );

  const deleteGroup = async () => {
    try {
      await api.delete(`/groups/${group._id}`);
      toast.success("Group deleted");
      onDeleted(group._id);
    } catch {
      toast.error("Failed to delete group");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white p-6 rounded-xl shadow"
    >
      <div className="flex justify-between mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <Users className="shrink-0" />
          <div className="min-w-0">
            <h3 className="font-semibold truncate">{group.name}</h3>
            <p className="text-sm">
              {group.members.length} members: {group.members.map(m => memberName(m) + (m.membershipStatus === 'invited' ? ' (pending)' : '')).join(", ")}
            </p>
            {pendingCount > 0 && (
              <span className="inline-block mt-1 text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">{pendingCount} invite pending</span>
            )}
          </div>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost">
              <Trash2 />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Group?</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={deleteGroup}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <Button onClick={() => onAddExpense(group)} className="flex-1 sm:flex-none justify-center">
          <Plus className="w-4 h-4 mr-1" /> Add Expense
        </Button>
        <Button variant="outline" onClick={() => onSettle(group)} className="flex-1 sm:flex-none justify-center">
          <IndianRupee className="w-4 h-4 mr-1" /> Settle
        </Button>
      </div>
    </motion.div>
  );
};

export default GroupCard;
