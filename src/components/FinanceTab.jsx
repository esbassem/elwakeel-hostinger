
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  RefreshCw, 
  Wallet,
  Plus,
  ArrowUpRight,
  ShieldAlert,
  CheckCircle2,
  CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFinance } from '@/hooks/useFinance';
import { useFinanceApprovals } from '@/hooks/useFinanceApprovals';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

import FinanceListCard from './FinanceListCard';
import NewFinanceModal from './NewFinanceModal';
import PendingApprovalsModal from './PendingApprovalsModal';
import GlobalLayoutWrapper from '@/components/GlobalLayoutWrapper';

const FinanceTab = ({ currentUser }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Data State
  const [groupedFinances, setGroupedFinances] = useState({});
  const [sortedMonthKeys, setSortedMonthKeys] = useState([]);
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);
  
  const [pendingFinances, setPendingFinances] = useState([]);
  
  // UI State
  const [isRefreshed, setIsRefreshed] = useState(false);
  
  // Modal States
  const [showNewFinanceModal, setShowNewFinanceModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [pendingModalFinance, setPendingModalFinance] = useState(null);

  // Hooks
  const { getApprovedFinancesByMonth, loading } = useFinance();
  const { 
    fetchPendingApprovals, 
    approvePendingFinance, 
    rejectPendingFinance,
  } = useFinanceApprovals();

  const isAdmin = currentUser?.role === 'admin';

  // Fetch Data
  const fetchData = async () => {
    setIsRefreshed(true);
    const { data: pending } = await fetchPendingApprovals();
    if (pending) setPendingFinances(pending);
    
    const { data: grouped } = await getApprovedFinancesByMonth('');
    if (grouped) {
      setGroupedFinances(grouped);
      const keys = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
      setSortedMonthKeys(keys);
      setCurrentMonthIndex(0);
    }
    
    setTimeout(() => setIsRefreshed(false), 800);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handlers
  const handleFinanceClick = (finance) => {
    if (finance.status === 'pending') {
      if (isAdmin) {
        setPendingModalFinance(finance);
        setShowApprovalModal(true);
      } else {
        toast({
          title: "قيد المراجعة",
          description: "هذا العقد بانتظار موافقة الإدارة",
          variant: "default"
        });
      }
      return;
    }
    // Clicks on approved finances do nothing now.
  };

  const handlePendingClick = (finance) => {
    if (isAdmin) {
      setPendingModalFinance(finance);
      setShowApprovalModal(true);
    } else {
      toast({
        title: "غير مصرح",
        description: "عرض الطلبات المعلقة يتطلب صلاحيات مدير",
        variant: "destructive"
      });
    }
  };

  const onApproveFinance = async () => {
    if (!pendingModalFinance) return;
    const { success } = await approvePendingFinance(pendingModalFinance.id, currentUser);
    if (success) {
      setShowApprovalModal(false);
      setPendingModalFinance(null);
      fetchData(); 
    }
  };

  const onRejectFinance = async () => {
    if (!pendingModalFinance) return;
    const reason = window.prompt("الرجاء إدخال سبب الرفض:");
    if (reason === null) return; 

    const { success } = await rejectPendingFinance(pendingModalFinance.id, reason, currentUser);
    if (success) {
      setShowApprovalModal(false);
      setPendingModalFinance(null);
      fetchData(); 
    }
  };

  // Month Navigation
  const handlePrevMonth = () => {
    if (currentMonthIndex < sortedMonthKeys.length - 1) {
      setCurrentMonthIndex(prev => prev + 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonthIndex > 0) {
      setCurrentMonthIndex(prev => prev - 1);
    }
  };

  const currentMonthKey = sortedMonthKeys[currentMonthIndex];
  const currentMonthData = currentMonthKey ? groupedFinances[currentMonthKey] : null;

  return (
    <GlobalLayoutWrapper className="font-cairo text-slate-800" dir="rtl">
        {/* Main Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start w-full">
          
          {/* Sidebar / Info Column */}
          <div className="lg:col-span-4 xl:col-span-3 space-y-4 lg:sticky lg:top-6 order-1">
             
             {/* Main Action Card */}
             <div className="bg-gradient-to-br from-blue-700 to-indigo-700 p-4 md:p-5 rounded-2xl shadow-lg shadow-blue-900/10 text-white relative overflow-hidden group">
                
                {/* Decorative Elements */}
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-20 h-20 bg-indigo-500/30 rounded-full blur-xl pointer-events-none"></div>

                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md border border-white/20 shadow-inner">
                      <Wallet className="w-5 h-5 text-white" />
                    </div>
                    <Button 
                        onClick={fetchData} 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8 text-blue-100 hover:text-white hover:bg-white/20 rounded-lg transition-all"
                      >
                         <RefreshCw className={cn("w-4 h-4", isRefreshed && "animate-spin")} />
                    </Button>
                  </div>
                  
                  <h1 className="text-xl font-bold text-white mb-1.5 tracking-wide">
                    إدارة التمويلات
                  </h1>
                  <p className="text-xs text-blue-100/90 font-medium leading-relaxed mb-5 max-w-[95%]">
                    إدارة العقود، متابعة الأقساط، والتحكم المالي.
                  </p>

                  <Button 
                    onClick={() => setShowNewFinanceModal(true)}
                    className="w-full bg-white text-blue-700 hover:bg-blue-50 hover:text-blue-800 font-bold h-10 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>تمويل جديد</span>
                  </Button>
                </div>
             </div>

             {/* Pending Approvals Widget */}
             <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-50 flex items-center justify-between bg-amber-50/30">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-500" />
                    <h3 className="text-xs font-bold text-slate-700">
                      طلبات قيد المراجعة
                    </h3>
                  </div>
                  {pendingFinances.length > 0 && (
                    <span className="bg-amber-500 text-white px-2 py-0.5 rounded-md text-[10px] font-bold">
                      {pendingFinances.length}
                    </span>
                  )}
                </div>

                <div className="p-2 space-y-2 relative z-10 max-h-[300px] overflow-y-auto custom-scrollbar">
                  <AnimatePresence mode="popLayout">
                    {pendingFinances.length > 0 ? (
                      pendingFinances.map((finance, idx) => (
                        <motion.div
                          key={finance.id}
                          initial={{ opacity: 0, x: -5 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ delay: idx * 0.05 }}
                          layout
                          onClick={() => handlePendingClick(finance)}
                          className="bg-white p-2.5 rounded-lg border border-slate-100 hover:border-amber-300 hover:bg-amber-50/20 cursor-pointer transition-all group shadow-sm relative"
                        >
                          <div className="flex justify-between items-start mb-1">
                             <h4 className="font-bold text-xs text-slate-800 line-clamp-1 group-hover:text-amber-700 transition-colors">
                               {finance.accounts?.name}
                             </h4>
                             <ArrowUpRight className="w-3 h-3 text-slate-300 group-hover:text-amber-500 transition-colors" />
                          </div>
                          <div className="flex justify-between items-center">
                             <div className="flex items-center gap-1 text-[9px] text-slate-400 font-medium">
                               <CreditCard className="w-2.5 h-2.5" />
                               <span>{new Date(finance.created_at).toLocaleDateString('ar-EG')}</span>
                             </div>
                             <span className="text-[10px] font-bold text-slate-900 font-mono bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                               {Number(finance.finance_amount).toLocaleString()}
                             </span>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="py-8 flex flex-col items-center justify-center text-center">
                        <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center mb-2 shadow-sm border border-green-100">
                           <CheckCircle2 className="w-5 h-5 text-green-500" />
                        </div>
                        <p className="text-xs font-bold text-slate-600">لا يوجد طلبات معلقة</p>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
             </div>
          </div>

          {/* Main Content Column */}
          <div className="lg:col-span-8 xl:col-span-9 order-2 min-w-0 h-full">
             <FinanceListCard 
                currentMonthData={currentMonthData}
                onNextMonth={handleNextMonth}
                onPrevMonth={handlePrevMonth}
                isNextDisabled={currentMonthIndex === 0}
                isPrevDisabled={currentMonthIndex >= sortedMonthKeys.length - 1}
                loading={loading}
                onFinanceClick={handleFinanceClick}
             />
          </div>

        </div>

      {/* Modals */}
      <NewFinanceModal 
        isOpen={showNewFinanceModal}
        onClose={() => setShowNewFinanceModal(false)}
        onSuccess={() => {
          setShowNewFinanceModal(false);
          fetchData();
        }}
        initialData={{ amount: '' }}
        currentUser={currentUser}
      />

      {pendingModalFinance && (
        <PendingApprovalsModal 
          isOpen={showApprovalModal}
          onClose={() => {
            setShowApprovalModal(false);
            setPendingModalFinance(null);
          }}
          financeId={pendingModalFinance.id}
          onApprove={onApproveFinance}
          onReject={onRejectFinance}
        />
      )}

    </GlobalLayoutWrapper>
  );
};

export default FinanceTab;
