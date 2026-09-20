import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, CheckCircle, Users } from 'lucide-react';
import { memberId, memberName } from '@/lib/members';
import { initials, avatarGradient } from '@/lib/avatar';

const BalanceSummary = ({ groups, expenses, settlements }) => {
  const calculateGroupBalances = (group) => {
    const balances = {};
    group.members.filter((m) => m.membershipStatus === 'active').forEach(member => {
      balances[memberId(member)] = 0;
    });

    const groupExpenses = expenses.filter(e => e.groupId === group.id);
    const groupSettlements = settlements.filter(s => s.groupId === group.id);

    groupExpenses.forEach(expense => {
      const paidBy = memberId(expense.paidBy);
      const amount = parseFloat(expense.amount);
      balances[paidBy] += amount;

      expense.splits.forEach(split => {
        balances[memberId(split.member)] -= parseFloat(split.amount);
      });
    });

    groupSettlements.forEach(settlement => {
      balances[memberId(settlement.from)] += parseFloat(settlement.amount);
      balances[memberId(settlement.to)] -= parseFloat(settlement.amount);
    });

    return balances;
  };

  const calculateSettlements = (balances) => {
    const settlements = [];
    const creditors = [];
    const debtors = [];

    Object.entries(balances).forEach(([member, balance]) => {
      if (balance > 0.01) {
        creditors.push({ member, amount: balance });
      } else if (balance < -0.01) {
        debtors.push({ member, amount: Math.abs(balance) });
      }
    });

    let i = 0, j = 0;
    while (i < creditors.length && j < debtors.length) {
      const creditor = creditors[i];
      const debtor = debtors[j];
      const amount = Math.min(creditor.amount, debtor.amount);

      if (amount > 0.01) {
        settlements.push({
          from: debtor.member,
          to: creditor.member,
          amount: amount.toFixed(2)
        });
      }

      creditor.amount -= amount;
      debtor.amount -= amount;

      if (creditor.amount < 0.01) i++;
      if (debtor.amount < 0.01) j++;
    }

    return settlements;
  };

  if (groups.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 sm:p-14 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100">
          <Users className="h-8 w-8 text-blue-600" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">No groups yet</h3>
        <p className="text-slate-500">Create a group to see balance summaries</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((group, groupIndex) => {
        const balances = calculateGroupBalances(group);
        const suggestedSettlements = calculateSettlements(balances);
        const isBalanced = Object.values(balances).every(bal => Math.abs(bal) < 0.01);

        return (
          <motion.div
            key={group.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: groupIndex * 0.1 }}
            className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft sm:p-6"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-3 min-w-0">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 sm:p-3 rounded-xl shrink-0 shadow-soft">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 truncate">{group.name}</h3>
                  <p className="text-sm text-slate-600">{group.members.length} members</p>
                </div>
              </div>
              {isBalanced && (
                <div className="flex items-center gap-2 bg-emerald-100 px-4 py-2 rounded-full self-start sm:self-auto">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-semibold text-emerald-700">All Settled</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Member Balances</h4>
                <div className="space-y-2">
                  {Object.entries(balances).map(([member, balance]) => {
                    const name = group.members.find(m => memberId(m) === member);
                    return (
                      <div key={member} className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl">
                        <span className="flex items-center gap-2 min-w-0 flex-1">
                          <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarGradient(memberName(name))} text-[9px] font-bold text-white`}>
                            {initials(memberName(name))}
                          </span>
                          <span className="font-medium text-slate-900 min-w-0 truncate">{memberName(name)}</span>
                        </span>
                        {balance > 0.01 ? (
                          <div className="flex items-center gap-1.5 text-emerald-600 shrink-0">
                            <TrendingUp className="w-4 h-4 shrink-0" />
                            <span className="font-bold whitespace-nowrap">+₹{balance.toFixed(2)}</span>
                          </div>
                        ) : balance < -0.01 ? (
                          <div className="flex items-center gap-1.5 text-red-600 shrink-0">
                            <TrendingDown className="w-4 h-4 shrink-0" />
                            <span className="font-bold whitespace-nowrap">-₹{Math.abs(balance).toFixed(2)}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-semibold shrink-0 whitespace-nowrap">₹0.00</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Suggested Settlements</h4>
                {suggestedSettlements.length === 0 ? (
                  <div className="bg-emerald-50 p-6 rounded-lg text-center border border-emerald-200">
                    <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                    <p className="text-sm text-emerald-700 font-medium">All balanced!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {suggestedSettlements.map((settlement, idx) => {
                      const from = group.members.find(m => memberId(m) === settlement.from);
                      const to = group.members.find(m => memberId(m) === settlement.to);
                      return (
                        <div key={idx} className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                          <div className="flex items-center gap-2">
                            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarGradient(memberName(from))} text-[9px] font-bold text-white`}>
                              {initials(memberName(from))}
                            </span>
                            <p className="text-sm text-slate-900 min-w-0 flex-1 truncate">
                              <span className="font-semibold">{memberName(from)}</span>
                              {' owes '}
                              <span className="font-semibold">{memberName(to)}</span>
                            </p>
                            <p className="text-base sm:text-lg font-bold text-amber-600 shrink-0 whitespace-nowrap ml-1">
                              ₹{settlement.amount}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default BalanceSummary;