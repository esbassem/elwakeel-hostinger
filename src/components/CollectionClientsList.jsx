
import React, { useMemo } from 'react';
import OverdueInstallmentsTable from './OverdueInstallmentsTable';
import FinanceInstallmentCard from '@/components/FinanceInstallmentCard';
import { motion, AnimatePresence } from 'framer-motion';

const CollectionClientsList = ({ customers, contracts, loading, onCustomerSelect, viewMode = 'customers' }) => {
  
  // Prepare data for the requested view mode
  const displayContent = useMemo(() => {
    if (loading) return null;

    if (viewMode === 'customers') {
      // Default view: Overdue Installments Table
      return (
        <OverdueInstallmentsTable 
          installments={customers} 
          loading={loading}
          onInstallmentSelect={onCustomerSelect}
          viewMode="customers"
        />
      );
    } 
    
    if (viewMode === 'finance_accounts') {
      // New view: Grid of Finance Account Cards using FinanceInstallmentCard
      const itemsToRender = contracts || [];
      
      if (itemsToRender.length === 0) {
        return (
          <div className="text-center py-10">
             <p className="text-slate-400 text-sm">لا توجد حسابات تمويل للعرض</p>
          </div>
        );
      }

      return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-10" style={{ gridTemplateColumns: 'unset' }}>
          <AnimatePresence mode="popLayout">
            {itemsToRender.map((contract) => (
              <FinanceInstallmentCard
                  key={contract.id}
                  finance={contract} // Contract now already includes metrics from useCollectionData
                  onClick={() => onCustomerSelect({
                      customerId: contract.customerId,
                      contractId: contract.id,
                      type: 'contract_card'
                  })}
              />
            ))}
          </AnimatePresence>
        </div>
      );
    }
  }, [viewMode, customers, contracts, loading, onCustomerSelect]);

  return (
    <motion.div
        key={viewMode}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -5 }}
        transition={{ duration: 0.2 }}
        className="min-h-[300px]"
    >
      {displayContent}
    </motion.div>
  );
};

export default CollectionClientsList;
