import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Calendar, ArrowRight } from 'lucide-react';

const SettlementHistory = ({ settlements, groups }) => {
  const getGroupName = (groupId) => {
    const group = groups.find(g => g.id === groupId);
    return group ? group.name : 'Unknown Group';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (settlements.length === 0) {
    return (
      <div className="bg-white rounded-xl p-12 text-center shadow-md border border-slate-200">
        <CheckCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-slate-900 mb-2">No settlements yet</h3>
        <p className="text-slate-600">Settlement history will appear here once you record payments</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {settlements.map((settlement, index) => (
        <motion.div
          key={settlement.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className="bg-white rounded-xl p-6 shadow-md border border-slate-200 hover:shadow-lg transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2 rounded-lg">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Payment Recorded</h3>
                <p className="text-sm text-slate-600">{getGroupName(settlement.groupId)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(settlement.createdAt)}</span>
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-sm text-slate-600 mb-1">From</p>
                <p className="font-bold text-slate-900 text-lg">{settlement.from}</p>
              </div>
              <ArrowRight className="w-6 h-6 text-emerald-600" />
              <div className="text-center">
                <p className="text-sm text-slate-600 mb-1">To</p>
                <p className="font-bold text-slate-900 text-lg">{settlement.to}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-600 mb-1">Amount</p>
              <p className="text-2xl font-bold text-emerald-600">₹{parseFloat(settlement.amount).toFixed(2)}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default SettlementHistory;