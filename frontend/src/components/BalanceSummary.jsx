import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, CheckCircle, Users } from 'lucide-react';

const BalanceSummary = ({ groups, expenses, settlements }) => {
  const calculateGroupBalances = (group) => {
    const balances = {};
    group.members.forEach(member => {
      balances[member] = 0;
    });

    const groupExpenses = expenses.filter(e => e.groupId === group.id);
    const groupSettlements = settlements.filter(s => s.groupId === group.id);

    groupExpenses.forEach(expense => {
      const paidBy = expense.paidBy;
      const amount = parseFloat(expense.amount);
      balances[paidBy] += amount;

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
      <div className="bg-white rounded-xl p-12 text-center shadow-md border border-slate-200">
        <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-slate-900 mb-2">No groups yet</h3>
        <p className="text-slate-600">Create a group to see balance summaries</p>
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
            className="bg-white rounded-xl p-6 shadow-md border border-slate-200"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{group.name}</h3>
                  <p className="text-sm text-slate-600">{group.members.length} members</p>
                </div>
              </div>
              {isBalanced && (
                <div className="flex items-center gap-2 bg-emerald-100 px-4 py-2 rounded-full">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-semibold text-emerald-700">All Settled</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Member Balances</h4>
                <div className="space-y-2">
                  {Object.entries(balances).map(([member, balance]) => (
                    <div key={member} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <span className="font-medium text-slate-900">{member}</span>
                      {balance > 0.01 ? (
                        <div className="flex items-center gap-2 text-emerald-600">
                          <TrendingUp className="w-4 h-4" />
                          <span className="font-bold">+₹{balance.toFixed(2)}</span>
                        </div>
                      ) : balance < -0.01 ? (
                        <div className="flex items-center gap-2 text-red-600">
                          <TrendingDown className="w-4 h-4" />
                          <span className="font-bold">-₹{Math.abs(balance).toFixed(2)}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-semibold">₹0.00</span>
                      )}
                    </div>
                  ))}
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
                    {suggestedSettlements.map((settlement, idx) => (
                      <div key={idx} className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                        <p className="text-sm text-slate-900">
                          <span className="font-semibold">{settlement.from}</span>
                          {' owes '}
                          <span className="font-semibold">{settlement.to}</span>
                        </p>
                        <p className="text-lg font-bold text-amber-600 mt-1">
                          ₹{settlement.amount}
                        </p>
                      </div>
                    ))}
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