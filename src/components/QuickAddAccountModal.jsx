import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAccounts } from '@/hooks/useAccounts';
import { useToast } from '@/components/ui/use-toast';

const QuickAddAccountModal = ({ isOpen, onClose, onSuccess }) => {
  const { addAccount, loading } = useAccounts();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    nickname: '',
    phone1: '',
    phone2: '',
    account_type: 'customer'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation: Require nickname, phone1, and phone2
    if (!formData.nickname.trim() || !formData.phone1.trim() || !formData.phone2.trim()) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى ملء جميع الحقول المطلوبة (اللقب ورقمي الهاتف)",
        variant: "destructive"
      });
      return;
    }

    // Map nickname to name for DB compatibility (DB requires 'name')
    const submissionData = {
      ...formData,
      name: formData.nickname, // Use nickname as the primary name
    };

    const { data, error } = await addAccount(submissionData);

    if (!error && data) {
      setFormData({ nickname: '', phone1: '', phone2: '', account_type: 'customer' });
      onSuccess?.();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white rounded-3xl border-none p-0 overflow-hidden shadow-2xl">
        <div className="bg-indigo-600 p-6">
          <DialogHeader>
            <DialogTitle className="text-white text-xl font-bold">إضافة سريعة</DialogTitle>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="text-xs font-bold text-stone-600 mb-2 block">
              اللقب (الاسم) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="nickname"
              required
              value={formData.nickname}
              onChange={handleChange}
              className="w-full p-3 bg-stone-50 rounded-xl font-medium outline-none focus:ring-2 focus:ring-indigo-200 transition-all text-stone-800"
              placeholder="الاسم أو اللقب"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-stone-600 mb-2 block">
                رقم هاتف 1 <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                name="phone1"
                required
                value={formData.phone1}
                onChange={handleChange}
                className="w-full p-3 bg-stone-50 rounded-xl font-medium outline-none focus:ring-2 focus:ring-indigo-200 transition-all text-stone-800"
                placeholder="07XX XXX XXXX"
                dir="ltr"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-stone-600 mb-2 block">
                رقم هاتف 2 <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                name="phone2"
                required
                value={formData.phone2}
                onChange={handleChange}
                className="w-full p-3 bg-stone-50 rounded-xl font-medium outline-none focus:ring-2 focus:ring-indigo-200 transition-all text-stone-800"
                placeholder="07XX XXX XXXX"
                dir="ltr"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-stone-600 mb-2 block">نوع الحساب</label>
            <select
              name="account_type"
              value={formData.account_type}
              onChange={handleChange}
              className="w-full p-3 bg-stone-50 rounded-xl font-medium outline-none focus:ring-2 focus:ring-indigo-200 transition-all text-stone-800"
            >
              <option value="customer">عميل</option>
              <option value="supplier">مورد</option>
              <option value="both">عميل ومورد</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-6 rounded-2xl font-bold shadow-lg transition-transform active:scale-95"
            >
              {loading ? 'جاري الحفظ...' : 'حفظ'}
            </Button>
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="px-6 py-6 rounded-2xl border-2 border-stone-200 hover:bg-stone-50"
            >
              إلغاء
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default QuickAddAccountModal;