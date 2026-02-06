import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutList, Shield, FileCheck, Banknote, MessageSquare } from 'lucide-react';
import InstallmentsTabContent from './InstallmentsTabContent';
import GuaranteesTabContent from './GuaranteesTabContent';
import ReceiptGuaranteesTabContent from './ReceiptGuaranteesTabContent';
import DisbursementTabContent from './DisbursementTabContent';
import NotesTabContent from './NotesTabContent';

const InstallmentTabs = ({ finance, currentUser }) => {
  const [activeTab, setActiveTab] = useState('installments');

  const tabs = [
    { id: 'installments', label: 'الأقساط', icon: LayoutList },
    { id: 'guarantees', label: 'الضامن', icon: Shield },
    { id: 'documents', label: 'إيصالات الأمانة', icon: FileCheck },
    { id: 'disbursement', label: 'صرف التمويل', icon: Banknote },
    // "Notes" tab is conditionally rendered in the UI
    { id: 'notes', label: 'الملاحظات', icon: MessageSquare, isMobileOnly: true },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
      {/* Tabs Header */}
      <div className="border-b border-slate-100 bg-slate-50/50 px-2 sm:px-6 pt-4">
        <div className="flex gap-2 sm:gap-6 overflow-x-auto no-scrollbar pb-0">
          {tabs.map((tab) => {
             // Logic: If it's a mobile-only tab, hide it on desktop (md:hidden)
             const hiddenClass = tab.isMobileOnly ? 'md:hidden' : '';
             const Icon = tab.icon;
             const isActive = activeTab === tab.id;
             
             return (
                <button
                   key={tab.id}
                   onClick={() => setActiveTab(tab.id)}
                   className={`
                      relative pb-4 px-3 text-sm font-bold flex items-center gap-2 transition-colors whitespace-nowrap
                      ${isActive ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'}
                      ${hiddenClass}
                   `}
                >
                   <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                   {tab.label}
                   {isActive && (
                      <motion.div 
                        layoutId="activeTabIndicator"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" 
                      />
                   )}
                </button>
             );
          })}
        </div>
      </div>

      {/* Tabs Content */}
      <div className="flex-1 bg-white p-4 sm:p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {activeTab === 'installments' && <InstallmentsTabContent installments={finance.finance_installments} />}
            {activeTab === 'guarantees' && <GuaranteesTabContent />}
            {activeTab === 'documents' && <ReceiptGuaranteesTabContent finance={finance} />}
            {activeTab === 'disbursement' && <DisbursementTabContent finance={finance} />}
            {activeTab === 'notes' && <NotesTabContent finance={finance} currentUser={currentUser} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default InstallmentTabs;