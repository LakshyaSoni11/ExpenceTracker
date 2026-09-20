import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Calendar, ArrowRight } from 'lucide-react';
import { memberId, memberName, buildMemberNameMap } from '@/lib/members';
import { initials, avatarGradient } from '@/lib/avatar';

const SettlementHistory = ({ settlements, groups }) => {
  const memberNames = buildMemberNameMap(groups);

  const getGroupName = (groupId) => {
    const group = groups.find(g => g.id === groupId);
    return group ? group.name : 'Unknown Group';
  };

  const getMemberName = (id) => memberNames[memberId(id)] || 'Unknown member';

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
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 sm:p-14 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100">
          <CheckCircle className="h-8 w-8 text-emerald-600" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">No settlements yet</h3>
        <p className="text-slate-500">Settlement history will appear here once you record payments</p>
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
          className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft transition-shadow hover:shadow-lift sm:p-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2 rounded-xl shadow-soft shrink-0">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 truncate">Payment Recorded</h3>
                <p className="text-sm text-slate-600 truncate">{getGroupName(settlement.groupId)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600 shrink-0 pl-10 sm:pl-0">
              <Calendar className="w-4 h-4 shrink-0" />
              <span>{formatDate(settlement.createdAt)}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] items-center gap-3 sm:gap-4 bg-slate-50 rounded-lg p-4">
            <div className="flex flex-col gap-2 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarGradient(getMemberName(settlement.from))} text-[10px] font-bold text-white`}>
                  {initials(getMemberName(settlement.from))}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-wide text-slate-500 mb-0.5">From</p>
                  <p className="font-bold text-slate-900 text-sm sm:text-base truncate">{getMemberName(settlement.from)}</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0 self-center -my-0.5" />
              <div className="flex items-center gap-2 min-w-0">
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarGradient(getMemberName(settlement.to))} text-[10px] font-bold text-white`}>
                  {initials(getMemberName(settlement.to))}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-wide text-slate-500 mb-0.5">To</p>
                  <p className="font-bold text-slate-900 text-sm sm:text-base truncate">{getMemberName(settlement.to)}</p>
                </div>
              </div>
            </div>
            <div className="text-left sm:text-right shrink-0">
              <p className="text-sm text-slate-600 mb-1">Amount</p>
              <p className="text-xl sm:text-2xl font-bold text-emerald-600 whitespace-nowrap">₹{parseFloat(settlement.amount).toFixed(2)}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default SettlementHistory;