import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const TransactionForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    type: 'income',
    amount: '',
    description: '',
    currency: 'USD',
    category: ''
  });
  const { toast } = useToast();

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast({
        title: "خطأ",
        description: "الرجاء إدخال مبلغ صحيح",
        variant: "destructive"
      });
      return;
    }

    if (!formData.description.trim()) {
      toast({
        title: "خطأ",
        description: "الرجاء إدخال وصف للعملية",
        variant: "destructive"
      });
      return;
    }

    onSubmit(formData);
    setFormData({
      type: 'income',
      amount: '',
      description: '',
      currency: 'USD',
      category: ''
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 mb-6"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">إضافة عملية جديدة</h2>
        <Button
          onClick={onCancel}
          variant="ghost"
          size="sm"
          className="text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, type: 'income' })}
            className={`p-4 rounded-lg border-2 transition-all ${
              formData.type === 'income'
                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500'
                : 'border-slate-700 bg-slate-900/50 text-slate-400 hover:border-slate-600'
            }`}
          >
            <div className="font-semibold">إيراد</div>
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, type: 'expense' })}
            className={`p-4 rounded-lg border-2 transition-all ${
              formData.type === 'expense'
                ? 'border-red-500 bg-red-500/10 text-red-500'
                : 'border-slate-700 bg-slate-900/50 text-slate-400 hover:border-slate-600'
            }`}
          >
            <div className="font-semibold">مصروف</div>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">المبلغ</label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="0.00"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">العملة</label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              dir="rtl"
            >
              <option value="USD">دولار (USD)</option>
              <option value="EUR">يورو (EUR)</option>
              <option value="SAR">ريال سعودي (SAR)</option>
              <option value="AED">درهم إماراتي (AED)</option>
              <option value="EGP">جنيه مصري (EGP)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">الفئة</label>
          <input
            type="text"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            placeholder="مثال: مبيعات، رواتب، إيجار..."
            dir="rtl"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">الوصف</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
            rows="3"
            placeholder="وصف تفصيلي للعملية..."
            dir="rtl"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
          >
            حفظ
          </Button>
          <Button
            type="button"
            onClick={onCancel}
            variant="outline"
            className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            إلغاء
          </Button>
        </div>
      </form>
    </motion.div>
  );
};

export default TransactionForm;