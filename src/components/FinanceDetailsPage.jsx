import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFinance } from '@/hooks/useFinance';
import { useFinanceCalculations } from '@/hooks/useFinanceCalculations';
import { usePaymentDistribution } from '@/hooks/usePaymentDistribution'; // Task 5
import FinanceDetailsTopCard from './FinanceDetailsTopCard';
import CustomerInfoCard from './CustomerInfoCard';
import InstallmentTabs from './InstallmentTabs';
import NotesTabContent from './NotesTabContent';

const FinanceDetailsPage = ({ currentUser }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [finance, setFinance] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const { getFinanceById } = useFinance();
  const { 
    calculateTotalInstallmentsAmount,
    getStatusColor,
    getStatusLabel,
    formatFinanceNumber
  } = useFinanceCalculations();

  // Task 5: Use distribution hook to get accurate paid amounts
  const { totalPaid: distributedTotalPaid, refreshDistribution } = usePaymentDistribution(
      id, 
      finance?.finance_installments || [], 
      refreshTrigger
  );

  useEffect(() => {
    if (id) fetchDetails();
  }, [id, refreshTrigger]);

  const fetchDetails = async () => {
    const { data } = await getFinanceById(id);
    if (data) setFinance(data);
  };

  const handleRefresh = useCallback(() => {
      setRefreshTrigger(prev => prev + 1);
      refreshDistribution(); // Force recalculation
  }, [refreshDistribution]);

  if (!finance) return (
     <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full"></div>
     </div>
  );

  // Use the distributed total paid calculated by the hook, instead of raw DB sum
  const totalPaid = distributedTotalPaid; 
  const totalAmount = calculateTotalInstallmentsAmount(finance.finance_installments);
  const remaining = Math.max(0, totalAmount - totalPaid);
  const progress = totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0;

  return (
    <div className="min-h-screen bg-slate-50/50 font-cairo text-slate-800 pb-10" dir="rtl">
      
      {/* Header Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm/50 backdrop-blur-xl bg-white/90">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate('/finances')} 
                className="hover:bg-slate-100 rounded-full w-9 h-9 transition-colors text-slate-600"
              >
                 <ArrowRight className="w-5 h-5 rotate-180" />
              </Button>
              <div className="flex flex-col">
                 <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    تفاصيل التمويل
                 </h1>
                 <span className="text-[10px] text-slate-400 font-mono tracking-wider">{formatFinanceNumber(finance.id)}</span>
              </div>
           </div>

           <div className={`px-4 py-1.5 rounded-full text-xs font-bold border flex items-center gap-2 shadow-sm ${getStatusColor(finance.status)}`}>
              {finance.status === 'completed' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
              {getStatusLabel(finance.status)}
           </div>
        </div>
      </div>

      <div className="max-w-[1920px] mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Main Grid Layout */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
           
           {/* RIGHT COLUMN (30%) - Desktop Sidebar (Left in RTL) */}
           <div className="w-full lg:w-[320px] xl:w-[380px] shrink-0 space-y-6 lg:sticky lg:top-24 order-2 lg:order-1">
              <CustomerInfoCard account={finance.accounts} />
              
              {/* Notes Card - Visible ONLY on Desktop */}
              <div className="hidden lg:block h-[500px]">
                <NotesTabContent finance={finance} currentUser={currentUser} />
              </div>
           </div>

           {/* LEFT COLUMN (70%) - Main Content (Right in RTL) */}
           <div className="flex-1 w-full space-y-6 min-w-0 order-1 lg:order-2">
              
              {/* Top Card */}
              <FinanceDetailsTopCard 
                 finance={finance}
                 totalAmount={totalAmount}
                 totalPaid={totalPaid}
                 remaining={remaining}
                 progress={progress}
              />

              {/* Tabs Component */}
              <InstallmentTabs 
                  finance={finance} 
                  currentUser={currentUser} 
                  onRefresh={handleRefresh}
              />
           </div>

        </div>
      </div>
    </div>
  );
};

export default FinanceDetailsPage;