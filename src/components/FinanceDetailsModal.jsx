import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import CustomerDetailsTab from './CustomerDetailsTab';
import CustomerGuarantorsTab from './CustomerGuarantorsTab';
import PaymentHistoryTab from './PaymentHistoryTab'; // Import the correct tab
import { User, Shield, StickyNote, LayoutList, Wallet } from 'lucide-react';
import FinanceDetailsTopCard from './FinanceDetailsTopCard';


const FinanceDetailsModal = ({ finance, trigger, onRefresh }) => {
  const [activeTab, setActiveTab] = useState('beneficiary');

  if (!finance) {
    return <Dialog><DialogTrigger asChild>{trigger}</DialogTrigger></Dialog>;
  }

  const tabs = [
    { id: 'beneficiary', label: 'العميل', icon: User },
    { id: 'guarantors', label: 'الضامنين', icon: Shield },
    { id: 'payments', label: 'المدفوعات', icon: Wallet },
    // { id: 'installments', label: 'الأقساط', icon: LayoutList },
    // { id: 'notes', label: 'الملاحظات', icon: StickyNote },
  ];
  
  const renderContent = () => {
    switch (activeTab) {
      case 'beneficiary':
        return <CustomerDetailsTab beneficiary={finance.accounts} />;
      case 'guarantors':
        return <CustomerGuarantorsTab finance={finance} />;
      case 'payments':
        // Use the PaymentHistoryTab component
        return <div className="p-4"><PaymentHistoryTab financeId={finance.id} onRefresh={onRefresh} /></div>;
      case 'installments':
        return <div>محتوى الأقساط سيعرض هنا.</div>;
      case 'notes':
        return <div>محتوى الملاحظات سيعرض هنا.</div>;
      default:
        return null;
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent 
        className="max-w-3xl w-full p-0 bg-slate-50/50" 
        style={{ maxHeight: '90vh' }}
        dir="rtl"
      >
        <div className="p-4">
            <FinanceDetailsTopCard finance={finance} isModal={true} />
        </div>
        
        <div className="bg-white rounded-b-xl mt-2">
            <div className="border-b border-slate-100 px-4">
            <div className="flex items-center gap-4">
                {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative py-4 px-2 text-sm font-bold flex items-center gap-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                        ? 'text-indigo-600'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                    {tab.label}
                    {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />
                    )}
                </button>
                ))}
            </div>
            </div>

            <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 250px)' }}>
             {renderContent()}
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FinanceDetailsModal;
