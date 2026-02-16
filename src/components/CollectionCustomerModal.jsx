
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import CollectionInstallmentsList from './CollectionInstallmentsList';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { cn } from '@/lib/utils';

const CollectionCustomerModal = ({ customer, open, onOpenChange }) => {
  const { user } = useAuth();

  if (!customer) return null;

  const renderName = () => {
    const nickname = customer.nickname;
    const name = customer.name;

    if (nickname && nickname !== name) {
        return (
            <>
                <span className="block mb-1">{nickname}</span>
                {name && <span className="block text-sm md:text-base opacity-90 font-normal">({name})</span>}
            </>
        );
    }
    return name || nickname || 'عميل';
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent 
          className="max-w-none md:max-w-[950px] w-[95%] md:w-full h-[85vh] md:h-[500px] p-0 gap-0 border-none shadow-2xl rounded-2xl md:rounded-[2rem] overflow-hidden bg-transparent" 
          dir="rtl"
        >
          <div className="flex flex-col md:flex-row h-full w-full shadow-2xl bg-white">
            
            {/* Right Section: Customer Info (Red Background) */}
            <div className="w-full md:w-[35%] h-auto md:h-full bg-[#901B36] text-white relative flex flex-col items-center text-center z-10 shrink-0 shadow-lg">
              
              {/* Close Button - Absolute */}
              <div className="absolute top-4 left-4 z-20">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => onOpenChange(false)}
                  className="rounded-full bg-white/10 hover:bg-white/20 text-white w-8 h-8 md:w-9 md:h-9 border border-white/20 transition-all hover:scale-105"
                >
                  <X className="w-4 h-4 md:w-5 md:h-5" />
                </Button>
              </div>

              {/* Centered Content Container */}
              <div className="flex flex-col items-center justify-center w-full h-full px-6 py-4 space-y-6">
                
                {/* Spacer to push content to center visually */}
                <div className="flex-1 flex flex-col items-center justify-center w-full space-y-4">
                  {/* Avatar/Initial (Optional) - skipped to keep clean as per previous design, just text */}
                  
                  {/* Name & Details */}
                  <div className="space-y-2 w-full flex flex-col items-center">
                    <h2 className="text-xl md:text-2xl font-bold tracking-tight text-center leading-tight">
                      {renderName()}
                    </h2>
                    
                    <div className="flex flex-col items-center gap-1 text-white/80 text-xs font-medium mt-1">
                      <div className="bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
                         {customer.details?.address || customer.address || 'العنوان غير مسجل'}
                      </div>
                      <div className="font-mono text-white/90 dir-ltr tracking-wide opacity-90">
                         {customer.phone || 'لا يوجد هاتف'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Amount Section - Bottom Anchored or Flexed */}
                <div className="w-full pt-6 border-t border-white/10 pb-2">
                  <div className="space-y-1 md:space-y-2 flex flex-col items-center">
                    <p className="text-white/70 text-xs font-bold uppercase tracking-widest">
                      المطلوب سداده
                    </p>
                    <div className="text-4xl md:text-5xl lg:text-5xl font-bold tracking-tight font-mono leading-none text-white drop-shadow-sm">
                      {customer.totalOverdueAmount?.toLocaleString() || '0'}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                       <span className="h-[1px] w-8 bg-white/20"></span>
                       <p className="text-white/60 text-xs font-medium">جنيه مصري</p>
                       <span className="h-[1px] w-8 bg-white/20"></span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Left Section: Installments List (White Background) */}
            <div className="w-full md:w-[65%] h-full bg-slate-50 p-4 md:p-6 flex flex-col relative overflow-hidden">
                 <CollectionInstallmentsList 
                    customerId={customer.id} 
                 />
                 
                 {/* Mobile fade overlay */}
                 <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-slate-50 to-transparent pointer-events-none md:hidden" />
            </div>

          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CollectionCustomerModal;
