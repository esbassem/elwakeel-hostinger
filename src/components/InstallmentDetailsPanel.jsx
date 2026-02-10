
import React from 'react';
import { 
  X, Phone, MapPin, Calendar, 
  AlertTriangle, CreditCard, User, Building2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import CollectionAttemptsTab from './CollectionAttemptsTab';

const InstallmentDetailsPanel = ({ installment, onClose, currentUser }) => {
  if (!installment) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-5xl h-[85vh] shadow-2xl overflow-hidden flex flex-col md:flex-row" dir="rtl">
        
        {/* Right Sidebar: Info Summary */}
        <div className="w-full md:w-80 bg-stone-50 border-l border-stone-200 p-6 overflow-y-auto">
          
          <div className="mb-6 text-center">
            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3 text-indigo-600 font-bold text-2xl">
              {installment.client.name?.charAt(0)}
            </div>
            <h2 className="font-bold text-lg text-stone-900 leading-tight">{installment.client.name}</h2>
            <div className="flex items-center justify-center gap-2 mt-2 text-stone-500 text-sm">
               <Phone className="w-3 h-3" />
               <span dir="ltr">{installment.client.phone1}</span>
            </div>
          </div>

          <div className="space-y-6">
            
            {/* Installment Status Box */}
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
              <span className="block text-xs text-red-400 font-bold uppercase tracking-wider mb-1">حالة القسط</span>
              <div className="flex items-center justify-center gap-2 text-red-600 font-bold mb-2">
                <AlertTriangle className="w-5 h-5" />
                <span>متأخر {installment.daysOverdue} يوم</span>
              </div>
              <div className="text-2xl font-black text-stone-800">
                {installment.remaining.toLocaleString()} <span className="text-sm text-stone-400">د.ل</span>
              </div>
            </div>

            <Separator />

            {/* Contract Info */}
            <div>
               <h3 className="text-xs font-bold text-stone-400 uppercase mb-3 flex items-center gap-2">
                 <Building2 className="w-3 h-3" />
                 بيانات التمويل
               </h3>
               <div className="space-y-3 text-sm">
                 <div className="flex justify-between">
                   <span className="text-stone-500">رقم العقد</span>
                   <span className="font-bold text-stone-700">#{installment.contract.id.slice(0,8)}</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-stone-500">اسم التمويل</span>
                   <span className="font-bold text-stone-700 text-left w-32 truncate">{installment.contract.name}</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-stone-500">إجمالي التمويل</span>
                   <span className="font-bold text-stone-700">{installment.contract.totalAmount.toLocaleString()}</span>
                 </div>
               </div>
            </div>

            <Separator />

             {/* Customer Info */}
             <div>
               <h3 className="text-xs font-bold text-stone-400 uppercase mb-3 flex items-center gap-2">
                 <User className="w-3 h-3" />
                 بيانات العميل
               </h3>
               <div className="space-y-3 text-sm">
                 <div className="flex justify-between items-start">
                   <span className="text-stone-500 shrink-0 ml-2">العنوان</span>
                   <span className="font-medium text-stone-700 text-left">{installment.client.address || '-'}</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-stone-500">رقم الهوية</span>
                   <span className="font-medium text-stone-700 text-left">{installment.client.national_id || '-'}</span>
                 </div>
               </div>
            </div>

          </div>
        </div>

        {/* Main Content: Tabs/Details */}
        <div className="flex-1 flex flex-col bg-white">
          <div className="p-4 border-b border-stone-100 flex justify-between items-center sticky top-0 bg-white z-10">
            <div>
              <h3 className="font-bold text-lg text-stone-800">تفاصيل القسط #{installment.installment_number}</h3>
              <p className="text-xs text-stone-400">تاريخ الاستحقاق: {new Date(installment.dueDate).toLocaleDateString('ar-LY')}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-stone-100">
              <X className="w-6 h-6 text-stone-500" />
            </Button>
          </div>

          <div className="flex-1 p-6 overflow-hidden">
             <CollectionAttemptsTab 
               financeId={installment.contract.id} 
               installmentNumber={installment.installment_number}
               currentUser={currentUser}
             />
          </div>
        </div>

      </div>
    </div>
  );
};

export default InstallmentDetailsPanel;
