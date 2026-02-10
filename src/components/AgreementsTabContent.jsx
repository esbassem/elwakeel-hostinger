
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { FileText, Download, Eye, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import ImagePreviewModal from './ImagePreviewModal';

const AgreementsTabContent = ({ finance }) => {
  const [agreements, setAgreements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    const fetchAgreements = async () => {
      if (!finance?.id) return;
      try {
        setLoading(true);
        const { data } = await supabase
          .from('finance_agreements')
          .select('*')
          .eq('finance_id', finance.id)
          .order('created_at', { ascending: false });
        setAgreements(data || []);
      } catch (error) {
        console.error('Error fetching agreements:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAgreements();
  }, [finance?.id]);

  if (loading) {
    return (
       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}
       </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
       <div className="flex items-center gap-2 mb-2 px-1">
         <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
            <FileText className="w-5 h-5" />
         </div>
         <h3 className="font-bold text-stone-800">العقود والاتفاقيات</h3>
       </div>

       {agreements.length === 0 ? (
         <div className="text-center py-12 bg-stone-50 rounded-xl border border-dashed border-stone-200">
            <FileText className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <p className="text-stone-500 font-medium">لا توجد عقود مرفقة</p>
         </div>
       ) : (
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {agreements.map((agreement) => (
               <div key={agreement.id} className="bg-white rounded-xl border border-stone-100 shadow-sm hover:shadow-md transition-all overflow-hidden group flex flex-col">
                  {/* Thumbnail / Icon Area */}
                  <div 
                     className="aspect-[4/3] bg-stone-50 relative cursor-pointer overflow-hidden border-b border-stone-50"
                     onClick={() => setPreviewImage({ url: agreement.contract_image_url, title: agreement.contract_name })}
                  >
                     {agreement.contract_image_url ? (
                        <>
                           <img 
                              src={agreement.contract_image_url} 
                              alt={agreement.contract_name} 
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                           />
                           <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <Eye className="w-8 h-8 text-white drop-shadow-md" />
                           </div>
                        </>
                     ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-300">
                           <FileText className="w-12 h-12" />
                        </div>
                     )}
                  </div>

                  {/* Content Area */}
                  <div className="p-4 flex-1 flex flex-col">
                     <h4 className="font-bold text-stone-800 text-sm mb-1 line-clamp-2" title={agreement.contract_name}>
                        {agreement.contract_name || 'عقد تمويل'}
                     </h4>
                     
                     <div className="flex items-center gap-1.5 text-xs text-stone-400 mb-4">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(agreement.created_at).toLocaleDateString('ar-LY')}</span>
                     </div>

                     <div className="mt-auto flex gap-2">
                        <Button 
                           className="flex-1 bg-stone-900 hover:bg-stone-800 text-xs h-8"
                           onClick={() => setPreviewImage({ url: agreement.contract_image_url, title: agreement.contract_name })}
                           disabled={!agreement.contract_image_url}
                        >
                           <Eye className="w-3 h-3 ml-1.5" />
                           معاينة
                        </Button>
                        <Button 
                           variant="outline"
                           className="flex-1 border-stone-200 hover:bg-stone-50 text-xs h-8"
                           onClick={() => {
                              const link = document.createElement('a');
                              link.href = agreement.contract_image_url;
                              link.download = agreement.contract_name || 'contract';
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                           }}
                           disabled={!agreement.contract_image_url}
                        >
                           <Download className="w-3 h-3 ml-1.5" />
                           تحميل
                        </Button>
                     </div>
                  </div>
               </div>
            ))}
         </div>
       )}

       <ImagePreviewModal 
         isOpen={!!previewImage}
         onClose={() => setPreviewImage(null)}
         imageUrl={previewImage?.url}
         title={previewImage?.title}
       />
    </div>
  );
};

export default AgreementsTabContent;
