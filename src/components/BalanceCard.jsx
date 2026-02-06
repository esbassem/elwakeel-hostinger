import React from 'react';
import { motion } from 'framer-motion';

const BalanceCard = ({ title, amount, icon: Icon, color, delay }) => {
  const colorClasses = {
    blue: {
      bg: 'from-blue-500 to-blue-600',
      text: 'text-blue-500',
      iconBg: 'bg-blue-500/10'
    },
    green: {
      bg: 'from-emerald-500 to-teal-600',
      text: 'text-emerald-500',
      iconBg: 'bg-emerald-500/10'
    },
    red: {
      bg: 'from-red-500 to-rose-600',
      text: 'text-red-500',
      iconBg: 'bg-red-500/10'
    }
  };

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -4 }}
      className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:bg-slate-800/70 transition-all"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colors.iconBg}`}>
          <Icon className={`w-6 h-6 ${colors.text}`} />
        </div>
      </div>
      
      <h3 className="text-slate-400 text-sm mb-2" dir="rtl">{title}</h3>
      <div className={`text-3xl font-bold bg-gradient-to-r ${colors.bg} bg-clip-text text-transparent`}>
        {amount.toFixed(2)}
      </div>
      <div className="text-xs text-slate-500 mt-1">USD</div>
    </motion.div>
  );
};

export default BalanceCard;