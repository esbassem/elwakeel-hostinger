
import React, { useState } from 'react';
import { Users, ChevronDown, ChevronUp, CreditCard } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import ImagePreviewModal from './ImagePreviewModal';

const GuarantorsReviewTab = ({ guarantors, loading }) => {
  const [openItems, setOpenItems] = useState({});
  const [previewImage, setPreviewImage] = useState(null);

  const toggleItem = (id) => {
    setOpenItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
      </div>
    );
  }

  if (!guarantors || guarantors.length === 0) {
    return (
      <div className="text-center py-8 bg-stone-50 rounded-xl border border-dashed border-stone-200">
        <Users className="w-10 h-10 text-stone-300 mx-auto mb-2" />
        <p className="text-stone-500 text-sm">لا يوجد ضامنين مسجلين لهذا التمويل</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {guarantors.map((guarantor) => {
        // Handle joined data
        const account = guarantor.accounts;
        if (!account) return null;

        return (
          <Collapsible 
            key={guarantor.id} 
            open={openItems[guarantor.id]}
            onOpenChange={() => toggleItem(guarantor.id)}
            className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden"
          >
            <div className="p-3 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0 border border-indigo-100 overflow-hidden">
                   {account.id_card_image ? (
                      <img src={account.id_card_image} alt={account.name} className="w-full h-full object-cover" />
                   ) : (
                      account.name ? account.name.charAt(0) : <Users className="w-5 h-5" />
                   )}
                </div>
                <div>
                  <h4 className="font-bold text-stone-800 text-sm">{account.name}</h4>
                  <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5">
                    <span className="bg-stone-100 px-1.5 py-0.5 rounded">{guarantor.relationship || 'ضامن'}</span>
                    <span dir="ltr">{account.phone1}</span>
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
              <div className="px-3 pb-3 pt-2 border-t border-stone-50 bg-stone-50/30">
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <GuarantorImageCard 
                    title="وجه البطاقة"
                    url={account.id_card_front}
                    onPreview={() => setPreviewImage({ url: account.id_card_front, title: `بطاقة ${account.name} - وجه` })}
                  />
                  <GuarantorImageCard 
                    title="ظهر البطاقة"
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
    className={`relative rounded-lg border ${url ? 'border-stone-200 bg-white cursor-pointer hover:shadow-sm' : 'border-dashed border-stone-200 bg-stone-50'} transition-all overflow-hidden group`}
    onClick={url ? onPreview : undefined}
  >
    {url ? (
      <div className="aspect-[16/9] relative">
        <img src={url} alt={title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
          <span className="bg-white/90 text-stone-900 text-[10px] font-bold px-2 py-1 rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity">
            معاينة
          </span>
        </div>
        <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/60 to-transparent p-1.5">
          <p className="text-white text-[10px] font-bold">{title}</p>
        </div>
      </div>
    ) : (
      <div className="aspect-[16/9] flex flex-col items-center justify-center p-2 text-stone-400">
        <CreditCard className="w-6 h-6 mb-1 opacity-50" />
        <span className="text-[10px] font-medium">غير متوفر</span>
      </div>
    )}
  </div>
);

export default GuarantorsReviewTab;
