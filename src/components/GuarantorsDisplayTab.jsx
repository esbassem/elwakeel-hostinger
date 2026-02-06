
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Users, ChevronDown, ChevronUp, CreditCard } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import ImagePreviewModal from './ImagePreviewModal';

const GuarantorsDisplayTab = ({ finance }) => {
  const [guarantors, setGuarantors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState(null);
  const [openItems, setOpenItems] = useState({});

  useEffect(() => {
    const fetchGuarantors = async () => {
      if (!finance?.id) return;
      try {
        setLoading(true);
        const { data } = await supabase
          .from('guarantees')
          .select(`
             *,
             accounts:guarantor_account_id (*)
          `)
          .eq('finance_contract_id', finance.id) // Updated column
          .neq('guarantee_type', 'receipts_bundle');
        setGuarantors(data || []);
        
        // Default open first item if exists
        if (data && data.length > 0) {
            setOpenItems({ [data[0].id]: true });
        }
      } catch (error) {
        console.error('Error fetching guarantors:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGuarantors();
  }, [finance?.id]);

  const toggleItem = (id) => {
      setOpenItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) {
     return (
        <div className="space-y-4">
           {[1, 2].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
     );
  }

  if (guarantors.length === 0) {
     return (
        <div className="text-center py-12 bg-stone-50 rounded-xl border border-dashed border-stone-200">
           <Users className="w-12 h-12 text-stone-300 mx-auto mb-3" />
           <p className="text-stone-500 font-medium">لا يوجد ضامنين مسجلين لهذا التمويل</p>
        </div>
     );
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
       {guarantors.map((guarantor) => {
          const account = guarantor.accounts;
          if (!account) return null;

          return (
            <Collapsible 
               key={guarantor.id} 
               open={openItems[guarantor.id]}
               onOpenChange={() => toggleItem(guarantor.id)}
               className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden"
            >
               <div className="p-4 flex items-center justify-between bg-white">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg border border-emerald-100 overflow-hidden">
                        {account.id_card_image ? (
                           <img src={account.id_card_image} alt={account.name} className="w-full h-full object-cover" />
                        ) : (
                           account.name ? account.name.charAt(0) : <Users />
                        )}
                     </div>
                     <div>
                        <h4 className="font-bold text-stone-800">{account.name}</h4>
                        <div className="flex items-center gap-2 text-sm text-stone-500 mt-1">
                           <span className="bg-stone-100 px-2 py-0.5 rounded text-xs">{guarantor.relationship || 'ضامن'}</span>
                           <span dir="ltr" className="font-mono">{account.phone1}</span>
                        </div>
                     </div>
                  </div>
                  <CollapsibleTrigger asChild>
                     <Button variant="ghost" size="sm" className="w-8 h-8 p-0 rounded-full bg-stone-50 hover:bg-stone-100">
                        {openItems[guarantor.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                     </Button>
                  </CollapsibleTrigger>
               </div>

               <CollapsibleContent>
                  <div className="px-4 pb-4 pt-2 border-t border-stone-50 bg-stone-50/30">
                     {guarantor.note && (
                        <p className="text-xs text-stone-500 mb-3 italic">
                           ملاحظة: {guarantor.note}
                        </p>
                     )}
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                        {/* Front ID from Account */}
                        <GuarantorImageCard 
                           title="البطاقة الشخصية (وجه)"
                           url={account.id_card_front}
                           onPreview={() => setPreviewImage({ url: account.id_card_front, title: `بطاقة ${account.name} - وجه` })}
                        />
                        
                        {/* Back ID from Account */}
                        <GuarantorImageCard 
                           title="البطاقة الشخصية (ظهر)"
                           url={account.id_card_back}
                           onPreview={() => setPreviewImage({ url: account.id_card_back, title: `بطاقة ${account.name} - ظهر` })}
                        />
                     </div>
                  </div>
               </CollapsibleContent>
            </Collapsible>
          );
       })}

       <ImagePreviewModal 
         isOpen={!!previewImage}
         onClose={() => setPreviewImage(null)}
         imageUrl={previewImage?.url}
         title={previewImage?.title}
       />
    </div>
  );
};

const GuarantorImageCard = ({ title, url, onPreview }) => (
   <div 
      className={`relative rounded-lg border ${url ? 'border-stone-200 bg-white cursor-pointer hover:shadow-md' : 'border-dashed border-stone-200 bg-stone-50'} transition-all overflow-hidden group`}
      onClick={url ? onPreview : undefined}
   >
      {url ? (
         <div className="aspect-[16/9] relative">
            <img src={url} alt={title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
               <span className="bg-white/90 text-stone-900 text-[10px] font-bold px-2 py-1 rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity transform scale-90 group-hover:scale-100">
                  معاينة
               </span>
            </div>
            <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/60 to-transparent p-2">
               <p className="text-white text-xs font-bold">{title}</p>
            </div>
         </div>
      ) : (
         <div className="aspect-[16/9] flex flex-col items-center justify-center p-4 text-stone-400">
            <CreditCard className="w-8 h-8 mb-2 opacity-50" />
            <span className="text-xs font-medium">غير متوفر</span>
         </div>
      )}
   </div>
);

export default GuarantorsDisplayTab;
