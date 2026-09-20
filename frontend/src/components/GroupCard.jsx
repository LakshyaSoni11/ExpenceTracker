import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, IndianRupee, Trash2, Clock, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/api/axios";
import { toast } from "sonner";
import { memberId, memberName } from "@/lib/members";
import { initials, avatarGradient } from "@/lib/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Avatar = ({ m, className = "" }) => {
  const name = memberName(m);
  return (
    <span
      title={name}
      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarGradient(name)} text-[11px] font-bold text-white ring-2 ring-white ${className}`}
    >
      {initials(name)}
    </span>
  );
};

const GroupCard = ({ group, expenses, settlements, currentUserId, onAddExpense, onSettle, onDeleted, index }) => {
  const activeMembers = group.members.filter((m) => m.membershipStatus === "active");
  const pendingMembers = group.members.filter((m) => m.membershipStatus === "invited");

  const calculateBalances = () => {
    const balances = {};
    activeMembers.forEach((m) => (balances[memberId(m)] = 0));

    expenses.forEach((e) => {
      const payer = memberId(e.paidBy);
      if (payer in balances) balances[payer] += e.amount;
      e.splits.forEach((s) => {
        const sm = memberId(s.member);
        if (sm in balances) balances[sm] -= s.amount;
      });
    });

    settlements.forEach((s) => {
      const from = memberId(s.from);
      const to = memberId(s.to);
      if (from in balances) balances[from] += s.amount;
      if (to in balances) balances[to] -= s.amount;
    });

    return balances;
  };

  const balances = calculateBalances();
  const myBalance = currentUserId ? balances[memberId(currentUserId)] ?? 0 : null;
  const isBalanced = Object.values(balances).every((b) => Math.abs(b) < 0.01);
  const myLabel =
    myBalance === null ? null : Math.abs(myBalance) < 0.01 ? "settled" : myBalance > 0 ? "owed" : "owing";

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
      transition={{ delay: index * 0.06 }}
      whileHover={{ y: -4 }}
      className="group relative flex flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft transition-shadow hover:shadow-lift"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2.5">
          <div className="relative shrink-0">
            <Avatar m={activeMembers[0]} className="h-11 w-11 text-sm" />
            <AnimatePresence>
              {activeMembers[1] && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`-ml-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br ${avatarGradient(memberName(activeMembers[1]))} text-sm font-bold text-white ring-2 ring-white`}
                >
                  {initials(memberName(activeMembers[1]))}
                </motion.span>
              )}
            </AnimatePresence>
            {activeMembers.length > 2 && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-white ring-2 ring-white">
                +{activeMembers.length - 2}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-bold text-slate-900">{group.name}</h3>
            <p className="mt-0.5 truncate text-xs text-slate-500">
              {activeMembers.length} active · {pendingMembers.length} pending
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1">
              {myLabel && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    myLabel === "owed"
                      ? "bg-emerald-100 text-emerald-700"
                      : myLabel === "owing"
                        ? "bg-rose-100 text-rose-600"
                        : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {myLabel === "owed" ? (
                    <>You're owed ₹{Math.abs(myBalance).toFixed(2)}</>
                  ) : myLabel === "owing" ? (
                    <>You owe ₹{Math.abs(myBalance).toFixed(2)}</>
                  ) : (
                    <><Wallet className="h-3 w-3" /> All settled</>
                  )}
                </span>
              )}
              {isBalanced && !myLabel && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  <Wallet className="h-3 w-3" /> Balanced
                </span>
              )}
              {pendingMembers.length > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                  <Clock className="h-3 w-3" /> {pendingMembers.length} invite pending
                </span>
              )}
            </div>
          </div>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500"
              aria-label="Delete group"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete group?</AlertDialogTitle>
              <AlertDialogDescription>
                This permanently removes "{group.name}" along with its expenses and settlements.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={deleteGroup} className="bg-rose-600 hover:bg-rose-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Live balances below the fold */}
      <div className="mt-4 rounded-xl bg-slate-50 p-3">
        {activeMembers.length === 0 ? (
          <p className="text-center text-xs text-slate-500">No active members yet</p>
        ) : (
          <>
            <div className="mb-2 flex items-center gap-1.5">
              <IndianRupee className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Net balances
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {activeMembers.slice(0, 5).map((m) => {
                const b = balances[memberId(m)] ?? 0;
                const isMe = currentUserId && memberId(m) === currentUserId;
                return (
                  <span
                    key={memberId(m)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-medium ${
                      Math.abs(b) < 0.01
                        ? "bg-white text-slate-400"
                        : b > 0
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-rose-100 text-rose-600"
                    }`}
                  >
                    <span className="font-semibold text-slate-600">{memberName(m).split(" ")[0]}</span>
                    {isMe && <span className="font-bold">(you)</span>}
                    <span className="font-bold">
                      {b > 0 ? `+₹${b.toFixed(2)}` : b < 0 ? `-₹${Math.abs(b).toFixed(2)}` : "₹0"}
                    </span>
                  </span>
                );
              })}
              {activeMembers.length > 5 && (
                <span className="inline-flex items-center rounded-full bg-white px-2 py-1 text-[11px] font-medium text-slate-400">
                  +{activeMembers.length - 5} more
                </span>
              )}
            </div>
          </>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Button
          onClick={() => onAddExpense(group)}
          className="flex-1 justify-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-soft transition-all hover:from-emerald-600 hover:to-teal-700 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" /> Add Expense
        </Button>
        <Button
          variant="outline"
          onClick={() => onSettle(group)}
          className="flex-1 justify-center gap-1.5 border-slate-200 bg-white hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700"
        >
          <IndianRupee className="h-4 w-4" /> Settle
        </Button>
      </div>
    </motion.div>
  );
};

export default GroupCard;