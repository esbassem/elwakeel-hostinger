import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, AlertCircle, User, Phone, MapPin, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAccounts } from '@/hooks/useAccounts';
import QuickAddAccountModal from './QuickAddAccountModal';
import FullAddAccountForm from './FullAddAccountForm';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

const AccountsTab = ({ currentUser }) => {
  const [accounts, setAccounts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showFullAdd, setShowFullAdd] = useState(false);
  const { fetchAccounts, deleteAccount, getMissingFields, loading } = useAccounts();
  const { toast } = useToast();
  const navigate = useNavigate();

  const isAdmin = currentUser?.role === 'admin';

  const loadAccounts = async () => {
    const filters = {
      search: searchQuery,
      account_type: filterType !== 'all' ? filterType : undefined
    };
    const { data } = await fetchAccounts(filters);
    if (data) {
      setAccounts(data);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, [searchQuery, filterType]);

  const handleDelete = async (e, id, name) => {
    e.stopPropagation();
    if (!isAdmin) {
      toast({
        title: "غير مصرح",
        description: "فقط المدير يمكنه حذف الحسابات",
        variant: "destructive"
      });
      return;
    }

    const confirmed = window.confirm(`هل أنت متأكد من حذف حساب "${name}"؟`);
    if (!confirmed) return;

    const { error } = await deleteAccount(id, false);
    if (!error) {
      loadAccounts();
    }
  };

  const accountTypeLabels = {
    customer: 'عميل',
    supplier: 'مورد',
    both: 'عميل ومورد'
  };

  const accountTypeColors = {
    customer: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    supplier: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    both: 'bg-purple-50 text-purple-600 border-purple-200'
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100"
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-black text-stone-800 mb-1">إدارة الحسابات</h2>
            <p className="text-sm text-stone-500">إجمالي {accounts.length} حساب</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowQuickAdd(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-4 py-2 shadow-md"
            >
              <Plus className="w-4 h-4 ml-2" />
              إضافة سريعة
            </Button>
            <Button
              onClick={() => setShowFullAdd(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-4 py-2 shadow-md"
            >
              <Plus className="w-4 h-4 ml-2" />
              إضافة كاملة
            </Button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              placeholder="بحث بالاسم، اللقب، أو رقم الهاتف..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-3 bg-stone-50 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-200 transition-all text-stone-800"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-3 bg-stone-50 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-200 transition-all text-stone-800"
          >
            <option value="all">جميع الأنواع</option>
            <option value="customer">عملاء</option>
            <option value="supplier">موردين</option>
            <option value="both">عملاء وموردين</option>
          </select>
        </div>
      </motion.div>

      {/* Accounts Grid */}
      {loading ? (
        <div className="text-center py-16 text-stone-400">جاري التحميل...</div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-stone-100 shadow-sm">
          <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto text-stone-300 mb-4">
            <User className="w-8 h-8" />
          </div>
          <p className="text-stone-500 font-bold">لا توجد حسابات</p>
          <p className="text-sm text-stone-400 mt-1">ابدأ بإضافة حساب جديد</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account, index) => {
            const missingFields = getMissingFields(account);
            const accountType = account.account_type || 'customer';
            const accountName = account.name || 'بدون اسم';
            
            return (
              <motion.div
                key={account.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => navigate(`/account/${account.id}`)}
                className="group bg-white rounded-2xl p-5 border border-stone-100 hover:shadow-lg hover:shadow-stone-200/40 hover:-translate-y-1 transition-all cursor-pointer relative"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-stone-800 truncate mb-1 group-hover:text-indigo-600 transition-colors">{accountName}</h3>
                    {account.nickname && (
                      <p className="text-xs text-stone-500 truncate">"{account.nickname}"</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {isAdmin && (
                      <button
                        onClick={(e) => handleDelete(e, account.id, accountName)}
                        className="p-2 text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors opacity-0 group-hover:opacity-100"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Account Type Badge */}
                <div className="mb-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${accountTypeColors[accountType] || accountTypeColors.customer}`}>
                    {accountTypeLabels[accountType] || 'غير محدد'}
                  </span>
                </div>

                {/* Contact Info */}
                <div className="space-y-2 mb-4">
                  {account.phone1 && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span className="text-stone-600 font-medium dir-ltr">{account.phone1}</span>
                    </div>
                  )}
                  {account.address && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                      <span className="text-stone-600 font-medium line-clamp-2">{account.address}</span>
                    </div>
                  )}
                </div>

                {/* Missing Fields Warning */}
                {missingFields.length > 0 && (
                  <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="text-xs font-bold text-amber-700">
                      {missingFields.length} حقل مفقود
                    </span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <QuickAddAccountModal
        isOpen={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        onSuccess={loadAccounts}
      />

      <FullAddAccountForm
        isOpen={showFullAdd}
        onClose={() => setShowFullAdd(false)}
        onSuccess={loadAccounts}
      />
    </div>
  );
};

export default AccountsTab;