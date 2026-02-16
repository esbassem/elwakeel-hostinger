import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Plus, TrendingUp, TrendingDown, DollarSign, Calendar, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import TransactionForm from '@/components/TransactionForm';
import TransactionList from '@/components/TransactionList';
import BalanceCard from '@/components/BalanceCard';

const Dashboard = ({ username, onLogout }) => {
  const [transactions, setTransactions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all'); // all, income, expense
  const { toast } = useToast();

  useEffect(() => {
    const savedTransactions = localStorage.getItem('khazna_transactions');
    if (savedTransactions) {
      setTransactions(JSON.parse(savedTransactions));
    }
  }, []);

  const saveTransactions = (newTransactions) => {
    localStorage.setItem('khazna_transactions', JSON.stringify(newTransactions));
    setTransactions(newTransactions);
  };

  const addTransaction = (transaction) => {
    const newTransaction = {
      ...transaction,
      id: Date.now().toString(),
      date: new Date().toISOString(),
    };
    const updatedTransactions = [newTransaction, ...transactions];
    saveTransactions(updatedTransactions);
    
    toast({
      title: "تم الإضافة بنجاح",
      description: `تم إضافة ${transaction.type === 'income' ? 'إيراد' : 'مصروف'} بقيمة ${transaction.amount} ${transaction.currency}`,
    });
    
    setShowForm(false);
  };

  const deleteTransaction = (id) => {
    const updatedTransactions = transactions.filter(t => t.id !== id);
    saveTransactions(updatedTransactions);
    
    toast({
      title: "تم الحذف",
      description: "تم حذف العملية بنجاح",
    });
  };

  const calculateBalance = () => {
    return transactions.reduce((acc, transaction) => {
      if (transaction.type === 'income') {
        return acc + parseFloat(transaction.amount);
      } else {
        return acc - parseFloat(transaction.amount);
      }
    }, 0);
  };

  const calculateTotalIncome = () => {
    return transactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + parseFloat(t.amount), 0);
  };

  const calculateTotalExpense = () => {
    return transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + parseFloat(t.amount), 0);
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (filter === 'all') return true;
    return transaction.type === filter;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">خزنة</h1>
            <p className="text-slate-400">مرحبfاً، {username}</p>
          </div>
          <Button
            onClick={onLogout}
            variant="outline"
            className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <LogOut className="w-4 h-4 ml-2" />
            خروج
          </Button>
        </motion.header>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <BalanceCard
            title="الرصيد الإجمالي"
            amount={calculateBalance()}
            icon={DollarSign}
            color="blue"
            delay={0.1}
          />
          <BalanceCard
            title="إجمالي الإيرادات"
            amount={calculateTotalIncome()}
            icon={TrendingUp}
            color="green"
            delay={0.2}
          />
          <BalanceCard
            title="إجمالي المصروفات"
            amount={calculateTotalExpense()}
            icon={TrendingDown}
            color="red"
            delay={0.3}
          />
        </div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap gap-3 mb-6"
        >
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
          >
            <Plus className="w-4 h-4 ml-2" />
            إضافة عملية جديدة
          </Button>
          
          <div className="flex gap-2">
            <Button
              onClick={() => setFilter('all')}
              variant={filter === 'all' ? 'default' : 'outline'}
              className={filter === 'all' ? 'bg-slate-700' : 'border-slate-700 text-slate-300'}
            >
              الكل
            </Button>
            <Button
              onClick={() => setFilter('income')}
              variant={filter === 'income' ? 'default' : 'outline'}
              className={filter === 'income' ? 'bg-emerald-600' : 'border-slate-700 text-slate-300'}
            >
              إيرادات
            </Button>
            <Button
              onClick={() => setFilter('expense')}
              variant={filter === 'expense' ? 'default' : 'outline'}
              className={filter === 'expense' ? 'bg-red-600' : 'border-slate-700 text-slate-300'}
            >
              مصروفات
            </Button>
          </div>
        </motion.div>

        {/* Transaction Form */}
        <AnimatePresence>
          {showForm && (
            <TransactionForm
              onSubmit={addTransaction}
              onCancel={() => setShowForm(false)}
            />
          )}
        </AnimatePresence>

        {/* Transaction List */}
        <TransactionList
          transactions={filteredTransactions}
          onDelete={deleteTransaction}
        />
      </div>
    </div>
  );
};

export default Dashboard;
