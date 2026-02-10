
import React, { useState } from 'react';
import { 
  X, Edit, Phone, MapPin, Briefcase, Calendar, 
  CreditCard, FileText, User, StickyNote, Link, Image as ImageIcon
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import GuarantorEditForm from './GuarantorEditForm';

const GuarantorDetailsDialog = ({ isOpen, onClose, guarantor, onUpdate, isDraft = false }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('info');

  if (!guarantor) return null;

  // Handles save from edit form
  const handleSave = (updatedData) => {
    // Pass the merged data back up
    onUpdate(updatedData);
    setIsEditing(false);
  };

  const InfoRow = ({ icon: Icon, label, value, subValue }) => {
    if (!value) return null;
    return (
      <div className="flex items-start gap-3 p-3 rounded-xl bg-stone-50 border border-stone-100/50 hover:border-stone-200 transition-colors">
        <div className="p-2 rounded-lg bg-white border border-stone-100 shrink-0 text-stone-500">
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-stone-400 font-bold mb-0.5">{label}</p>
          <p className="text-sm font-bold text-stone-800 break-words">{value}</p>
          {subValue && <p className="text-xs text-stone-500 mt-0.5">{subValue}</p>}
        </div>
      </div>
    );
  };

  const ImagePreview = ({ label, src }) => (
    <div className="space-y-2">
      <p className="text-xs font-bold text-stone-500 flex items-center gap-1">
        <ImageIcon className="w-3 h-3" />
        {label}
      </p>
      {src ? (
        <div className="relative aspect-video rounded-xl overflow-hidden border border-stone-200 bg-stone-100 group">
           <img src={src} alt={label} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
           <a href={src} target="_blank" rel="noopener noreferrer" className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-white text-xs font-bold bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">عرض بالحجم الكامل</span>
           </a>
        </div>
      ) : (
        <div className="aspect-video rounded-xl border-2 border-dashed border-stone-200 flex flex-col items-center justify-center bg-stone-50 text-stone-400">
           <ImageIcon className="w-6 h-6 mb-1 opacity-50" />
           <span className="text-xs">لا توجد صورة</span>
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        setIsEditing(false);
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-2xl bg-white p-0 gap-0 overflow-hidden shadow-2xl max-h-[90vh] flex flex-col font-cairo" dir="rtl">
        
        {/* Header */}
        <div className="bg-gradient-to-l from-indigo-900 via-indigo-800 to-indigo-900 p-6 shrink-0 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="relative z-10 flex items-start justify-between">
            <div className="flex items-center gap-4">
               <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-inner">
                  {guarantor.id_card_image ? (
                     <img src={guarantor.id_card_image} alt="" className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                     <User className="w-8 h-8" />
                  )}
               </div>
               <div>
                  <h2 className="text-xl font-black text-white leading-tight mb-1">{guarantor.name || 'مستخدم غير معروف'}</h2>
                  <div className="flex items-center gap-2 text-indigo-200 text-xs">
                     <span className="bg-white/20 px-2 py-0.5 rounded-full text-white font-bold backdrop-blur-sm">
                        {guarantor.relationship || 'صلة القرابة غير محددة'}
                     </span>
                     {guarantor.national_id && <span>• {guarantor.national_id}</span>}
                  </div>
               </div>
            </div>
            {!isEditing && (
              <Button 
                onClick={() => setIsEditing(true)}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm rounded-xl"
              >
                <Edit className="w-4 h-4 ml-2" />
                تعديل
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        {isEditing ? (
           <div className="flex-1 overflow-y-auto p-6 bg-stone-50/30">
              <GuarantorEditForm 
                 initialData={guarantor} 
                 onSave={handleSave} 
                 onCancel={() => setIsEditing(false)}
                 isDraft={isDraft}
              />
           </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col">
             <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <div className="px-6 pt-4 bg-white border-b border-stone-100">
                   <TabsList className="bg-stone-100 p-1 rounded-xl">
                      <TabsTrigger value="info" className="rounded-lg gap-2 text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                         <User className="w-3.5 h-3.5" />
                         البيانات الشخصية
                      </TabsTrigger>
                      <TabsTrigger value="images" className="rounded-lg gap-2 text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                         <CreditCard className="w-3.5 h-3.5" />
                         الصور والمستندات
                      </TabsTrigger>
                   </TabsList>
                </div>

                <ScrollArea className="flex-1 bg-stone-50/30">
                   <div className="p-6">
                      <TabsContent value="info" className="mt-0 space-y-6">
                         {/* Guarantee Info Block */}
                         <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                            <h3 className="text-xs font-bold text-amber-700 mb-3 flex items-center gap-2">
                               <Link className="w-3.5 h-3.5" />
                               تفاصيل الضمان
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                               <div className="bg-white/60 p-2.5 rounded-lg">
                                  <p className="text-[10px] text-amber-600 mb-0.5">صلة القرابة</p>
                                  <p className="text-sm font-bold text-amber-900">{guarantor.relationship || 'غير محدد'}</p>
                               </div>
                               <div className="bg-white/60 p-2.5 rounded-lg">
                                  <p className="text-[10px] text-amber-600 mb-0.5">ملاحظات الضمان</p>
                                  <p className="text-sm font-medium text-amber-900">{guarantor.note || 'لا توجد ملاحظات'}</p>
                               </div>
                            </div>
                         </div>

                         {/* Contact Info */}
                         <div>
                            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3 px-1">معلومات الاتصال</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                               <InfoRow icon={Phone} label="رقم الهاتف 1" value={guarantor.phone1} />
                               <InfoRow icon={Phone} label="رقم الهاتف 2" value={guarantor.phone2} />
                               <div className="md:col-span-2">
                                  <InfoRow icon={MapPin} label="العنوان" value={guarantor.address} />
                               </div>
                            </div>
                         </div>

                         {/* Work Info */}
                         {(guarantor.job || guarantor.job_address) && (
                            <div>
                               <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3 px-1">معلومات العمل</h3>
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <InfoRow icon={Briefcase} label="الوظيفة" value={guarantor.job} />
                                  <InfoRow icon={MapPin} label="عنوان العمل" value={guarantor.job_address} />
                               </div>
                            </div>
                         )}
                         
                         {/* Identity Info */}
                         <div>
                            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3 px-1">الهوية</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                               <InfoRow icon={CreditCard} label="الرقم الوطني" value={guarantor.national_id} />
                               <InfoRow icon={Calendar} label="تاريخ الميلاد" value={guarantor.birth_date} />
                            </div>
                         </div>
                      </TabsContent>

                      <TabsContent value="images" className="mt-0">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <ImagePreview label="صورة البطاقة (أمام)" src={guarantor.id_card_front} />
                            <ImagePreview label="صورة البطاقة (خلف)" src={guarantor.id_card_back} />
                            <ImagePreview label="صورة شخصية" src={guarantor.id_card_image} />
                         </div>
                      </TabsContent>
                   </div>
                </ScrollArea>
             </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GuarantorDetailsDialog;
