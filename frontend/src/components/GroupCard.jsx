import React from "react";
import { motion } from "framer-motion";
import { Users, Plus, IndianRupee, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/api/axios";
import { toast } from "sonner";
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
    group.members.forEach((m) => (balances[m] = 0));

    expenses.forEach((e) => {
      balances[e.paidBy] += e.amount;
      e.splits.forEach((s) => {
        balances[s.member] -= s.amount;
      });
    });

    settlements.forEach((s) => {
      balances[s.from] += s.amount;
      balances[s.to] -= s.amount;
    });

    return balances;
  };

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
        <div className="flex items-center gap-3">
          <Users />
          <div>
            <h3 className="font-semibold">{group.name}</h3>
            <p className="text-sm">{group.members.length} members</p>
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
