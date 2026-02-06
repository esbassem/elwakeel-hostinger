
import React from 'react';
import { Label } from '@/components/ui/label';
import { User, Phone, MapPin, Briefcase, Calendar, CreditCard, Mail } from 'lucide-react';
import CompactImageUpload from './CompactImageUpload';

const GuarantorRegistrationForm = ({ data, onChange }) => {
  const handleChange = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="bg-slate-50/50 p-4 rounded-lg border border-slate-200/60 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
      
      {/* Personal Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-[10px] font-bold text-slate-500">الاسم الكامل <span className="text-rose-500">*</span></Label>
          <div className="relative">
             <User className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
             <input 
               className="w-full h-9 pr-9 pl-3 text-xs font-bold border border-slate-200 rounded-lg focus:border-blue-500 outline-none transition-all bg-white"
               value={data.name || ''}
               onChange={e => handleChange('name', e.target.value)}
               placeholder="الاسم الرباعي"
             />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] font-bold text-slate-500">الرقم الوطني</Label>
          <div className="relative">
             <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
             <input 
               className="w-full h-9 pr-9 pl-3 text-xs border border-slate-200 rounded-lg focus:border-blue-500 outline-none transition-all bg-white font-mono"
               value={data.national_id || ''}
               onChange={e => handleChange('national_id', e.target.value)}
               placeholder="119..."
               maxLength={12}
             />
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-[10px] font-bold text-slate-500">رقم الهاتف 1 <span className="text-rose-500">*</span></Label>
          <div className="relative">
             <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
             <input 
               className="w-full h-9 pr-9 pl-3 text-xs border border-slate-200 rounded-lg focus:border-blue-500 outline-none transition-all bg-white font-mono"
               value={data.phone1 || ''}
               onChange={e => handleChange('phone1', e.target.value)}
               placeholder="09..."
             />
          </div>
        </div>
        <div className="space-y-1">
           <Label className="text-[10px] font-bold text-slate-500">رقم الهاتف 2</Label>
           <div className="relative">
             <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
             <input 
               className="w-full h-9 pr-9 pl-3 text-xs border border-slate-200 rounded-lg focus:border-blue-500 outline-none transition-all bg-white font-mono"
               value={data.phone2 || ''}
               onChange={e => handleChange('phone2', e.target.value)}
               placeholder="09..."
             />
           </div>
        </div>
      </div>

      <div className="space-y-1">
         <Label className="text-[10px] font-bold text-slate-500">العنوان</Label>
         <div className="relative">
             <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
             <input 
               className="w-full h-9 pr-9 pl-3 text-xs border border-slate-200 rounded-lg focus:border-blue-500 outline-none transition-all bg-white"
               value={data.address || ''}
               onChange={e => handleChange('address', e.target.value)}
               placeholder="المدينة، المنطقة، الشارع"
             />
         </div>
      </div>

      {/* Job Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
         <div className="space-y-1">
             <Label className="text-[10px] font-bold text-slate-500">الوظيفة</Label>
             <div className="relative">
               <Briefcase className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
               <input 
                 className="w-full h-9 pr-9 pl-3 text-xs border border-slate-200 rounded-lg focus:border-blue-500 outline-none transition-all bg-white"
                 value={data.job || ''}
                 onChange={e => handleChange('job', e.target.value)}
                 placeholder="المسمى الوظيفي"
               />
             </div>
         </div>
         <div className="space-y-1">
             <Label className="text-[10px] font-bold text-slate-500">عنوان العمل</Label>
             <div className="relative">
               <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
               <input 
                 className="w-full h-9 pr-9 pl-3 text-xs border border-slate-200 rounded-lg focus:border-blue-500 outline-none transition-all bg-white"
                 value={data.job_address || ''}
                 onChange={e => handleChange('job_address', e.target.value)}
                 placeholder="جهة العمل"
               />
             </div>
         </div>
      </div>

      {/* Images */}
      <div className="space-y-2 pt-2">
         <Label className="text-[10px] font-bold text-slate-500">المستندات والصور</Label>
         <div className="grid grid-cols-3 gap-2">
            <CompactImageUpload 
               label="بطاقة (أمام)"
               value={data.id_card_front}
               onChange={url => handleChange('id_card_front', url)}
            />
            <CompactImageUpload 
               label="بطاقة (خلف)"
               value={data.id_card_back}
               onChange={url => handleChange('id_card_back', url)}
            />
            <CompactImageUpload 
               label="صورة شخصية"
               value={data.id_card_image}
               onChange={url => handleChange('id_card_image', url)}
            />
         </div>
      </div>
    </div>
  );
};

export default GuarantorRegistrationForm;
