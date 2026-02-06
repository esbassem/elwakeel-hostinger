import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, FileText, Loader2, UploadCloud, Link as LinkIcon } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Label } from '@/components/ui/label';

const ImagePreviewCard = ({ url, title, subTitle, onDelete, onUpload, isUploading }) => {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <>
      <div className="group relative bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-all hover:border-blue-300 h-32 md:h-40">
        {url ? (
          <>
            <img 
              src={url} 
              alt={title} 
              className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity" 
              onClick={() => setShowPreview(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
              <div className="flex justify-between items-center">
                <span className="text-white text-[10px] font-bold truncate max-w-[70%]">{title}</span>
                {onDelete && (
                  <Button 
                    variant="destructive" 
                    size="icon" 
                    className="h-6 w-6 rounded-full bg-red-500/80 hover:bg-red-600"
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 group-hover:bg-blue-50/30 transition-colors cursor-pointer">
            <input 
              type="file" 
              accept="image/*"
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
              onChange={onUpload}
              disabled={isUploading}
            />
            <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform text-blue-500">
               {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
            </div>
            <span className="text-xs font-bold text-slate-600">{title}</span>
            <span className="text-[9px] text-slate-400">{subTitle || 'اضغط للرفع'}</span>
          </div>
        )}
      </div>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
         <DialogContent className="max-w-4xl p-0 bg-transparent border-none shadow-none flex justify-center items-center">
            <img src={url} alt={title} className="max-w-full max-h-[90vh] rounded-lg shadow-2xl" />
         </DialogContent>
      </Dialog>
    </>
  );
};

const AttachmentsTabContent = ({ 
  financeId, 
  receiptsData, 
  setReceiptsData, 
  agreements, 
  setAgreements 
}) => {
  const [loading, setLoading] = useState(false);
  const [isViewMode, setIsViewMode] = useState(!!financeId);
  const [fetchedData, setFetchedData] = useState({
     receipts: null,
     agreements: []
  });
  const { toast } = useToast();

  useEffect(() => {
    if (financeId) fetchAttachments();
  }, [financeId]);

  const fetchAttachments = async () => {
    setLoading(true);
    try {
      const { data: guarantee } = await supabase
        .from('guarantees')
        .select('*')
        .eq('finance_id', financeId)
        .eq('guarantee_type', 'receipts_bundle')
        .maybeSingle();

      const { data: agrs } = await supabase
        .from('finance_agreements')
        .select('*')
        .eq('finance_id', financeId);

      setFetchedData({
        receipts: guarantee,
        agreements: agrs || []
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file, onSuccess, prefix = 'doc') => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const { error } = await supabase.storage.from('finance-attachments').upload(fileName, file);
      if (error) throw error;
      const { data } = supabase.storage.from('finance-attachments').getPublicUrl(fileName);
      onSuccess(data.publicUrl);
    } catch (error) {
      toast({ title: "فشل الرفع", variant: "destructive" });
    }
  };

  const addAgreement = () => {
    setAgreements([...agreements, { contract_name: '', contract_image_url: '' }]);
  };

  const updateAgreement = (index, field, value) => {
    const updated = [...agreements];
    updated[index][field] = value;
    setAgreements(updated);
  };

  const removeAgreement = (index) => {
    setAgreements(agreements.filter((_, i) => i !== index));
  };

  // View Mode
  if (isViewMode) {
    if (loading) return <div className="py-20 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>;

    const receiptImages = fetchedData.receipts ? {
       receipts: JSON.parse(fetchedData.receipts.other_data || '{}').receipts_image,
       front: fetchedData.receipts.id_card_front,
       back: fetchedData.receipts.id_card_back
    } : { receipts: null, front: null, back: null };

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
        {/* Core Documents */}
        <div>
           <h3 className="flex items-center gap-2 font-bold text-slate-800 mb-3 text-xs uppercase tracking-wider">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              مستندات الضمان
           </h3>
           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              <ImagePreviewCard 
                 url={receiptImages.receipts} 
                 title="إيصالات الأمانة" 
                 subTitle="صورة مجمعة"
                 onUpload={(e) => handleUpload(e.target.files[0], async (url) => {
                    toast({ title: "تم الرفع", description: "يرجى حفظ التغييرات" });
                 }, 'receipts')}
              />
              <ImagePreviewCard 
                 url={receiptImages.front} 
                 title="البطاقة (أمام)" 
              />
              <ImagePreviewCard 
                 url={receiptImages.back} 
                 title="البطاقة (خلف)" 
              />
           </div>
        </div>

        {/* Extra Agreements */}
        <div>
           <div className="flex items-center justify-between mb-3">
              <h3 className="flex items-center gap-2 font-bold text-slate-800 text-xs uppercase tracking-wider">
                 <LinkIcon className="w-3.5 h-3.5 text-purple-600" />
                 عقود إضافية
              </h3>
           </div>
           
           {fetchedData.agreements.length === 0 ? (
              <div className="bg-slate-50 rounded-xl p-4 text-center border border-dashed border-slate-200">
                 <p className="text-slate-400 text-xs">لا توجد مستندات إضافية</p>
              </div>
           ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                 {fetchedData.agreements.map((agr) => (
                    <ImagePreviewCard 
                       key={agr.id}
                       url={agr.contract_image_url}
                       title={agr.contract_name}
                    />
                 ))}
              </div>
           )}
        </div>
      </div>
    );
  }

  // Create Mode
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex justify-between items-center mb-4">
           <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
              <div className="p-1 bg-blue-100 rounded text-blue-600"><FileText className="w-3.5 h-3.5" /></div>
              إيصالات الأمانة
           </h3>
           <select 
              className="h-8 px-2 text-xs font-bold border border-slate-200 rounded-lg bg-slate-50 focus:border-blue-500 outline-none"
              value={receiptsData.count}
              onChange={(e) => {
                 const count = parseInt(e.target.value) || 0;
                 const currentNames = [...receiptsData.names];
                 let newNames = count > currentNames.length 
                    ? [...currentNames, ...Array(count - currentNames.length).fill('')]
                    : currentNames.slice(0, count);
                 setReceiptsData({ ...receiptsData, count, names: newNames });
              }}
           >
              {[0, 1, 2, 3, 4, 5, 6].map(i => <option key={i} value={i}>{i} إيصالات</option>)}
           </select>
        </div>

        {receiptsData.count > 0 && (
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
              {receiptsData.names.map((name, idx) => (
                 <div key={idx} className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 bg-slate-100 px-1 rounded">{idx + 1}</span>
                    <input 
                       type="text" 
                       className="w-full h-9 pl-8 pr-3 border border-slate-200 rounded-lg text-xs focus:border-blue-500 outline-none transition-all focus:ring-2 focus:ring-blue-100"
                       placeholder={`اسم الموقع ${idx + 1}...`}
                       value={name}
                       onChange={(e) => {
                          const newNames = [...receiptsData.names];
                          newNames[idx] = e.target.value;
                          setReceiptsData({ ...receiptsData, names: newNames });
                       }}
                    />
                 </div>
              ))}
           </div>
        )}
        
        <div className="grid grid-cols-3 gap-3">
           <ImagePreviewCard 
              url={receiptsData.images.receipts} 
              title="صورة الإيصالات" 
              onUpload={(e) => handleUpload(e.target.files[0], (url) => setReceiptsData({ ...receiptsData, images: { ...receiptsData.images, receipts: url }}), 'receipts')}
           />
           <ImagePreviewCard 
              url={receiptsData.images.front} 
              title="البطاقة (أمام)" 
              onUpload={(e) => handleUpload(e.target.files[0], (url) => setReceiptsData({ ...receiptsData, images: { ...receiptsData.images, front: url }}), 'id_front')}
           />
           <ImagePreviewCard 
              url={receiptsData.images.back} 
              title="البطاقة (خلف)" 
              onUpload={(e) => handleUpload(e.target.files[0], (url) => setReceiptsData({ ...receiptsData, images: { ...receiptsData.images, back: url }}), 'id_back')}
           />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
         <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
               <div className="p-1 bg-purple-100 rounded text-purple-600"><LinkIcon className="w-3.5 h-3.5" /></div>
               عقود ومستندات إضافية
            </h3>
            <Button 
               onClick={addAgreement}
               variant="outline" 
               size="sm"
               className="h-8 text-xs gap-1 border-dashed text-slate-600 hover:text-purple-600 hover:border-purple-300"
            >
               <Plus className="w-3 h-3" />
               إضافة مستند
            </Button>
         </div>

         {agreements.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
               <p className="text-xs text-slate-400 font-medium">لا توجد عقود إضافية مرفقة</p>
               <Button variant="link" onClick={addAgreement} className="text-purple-600 text-xs h-auto p-0 mt-1">إضافة عقد جديد</Button>
            </div>
         ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
               {agreements.map((agr, idx) => (
                  <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200 relative group transition-all hover:border-purple-200 hover:shadow-sm">
                     <Button 
                        variant="destructive" 
                        size="icon" 
                        className="absolute -top-2 -left-2 h-6 w-6 rounded-full shadow-md z-10 opacity-0 group-hover:opacity-100 transition-opacity scale-90"
                        onClick={() => removeAgreement(idx)}
                     >
                        <Trash2 className="w-3 h-3" />
                     </Button>
                     
                     <div className="space-y-3">
                        <div className="space-y-1">
                           <Label className="text-[10px] font-bold text-slate-500">اسم العقد / المستند</Label>
                           <input 
                              type="text" 
                              className="w-full h-8 px-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-purple-500 bg-white"
                              placeholder="مثال: عقد إيجار"
                              value={agr.contract_name}
                              onChange={(e) => updateAgreement(idx, 'contract_name', e.target.value)}
                           />
                        </div>
                        <div className="h-32">
                           <ImagePreviewCard 
                              url={agr.contract_image_url}
                              title={agr.contract_name || "صورة العقد"}
                              subTitle="اضغط للرفع"
                              onUpload={(e) => handleUpload(e.target.files[0], (url) => updateAgreement(idx, 'contract_image_url', url), 'agreement')}
                              onDelete={agr.contract_image_url ? () => updateAgreement(idx, 'contract_image_url', '') : undefined}
                           />
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         )}
      </div>
    </div>
  );
};

export default AttachmentsTabContent;