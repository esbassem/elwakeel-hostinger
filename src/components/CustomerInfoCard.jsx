
import React from 'react';
import { 
   User, Phone, MapPin, Smartphone, Briefcase, 
   CreditCard, FileText, Calendar, Building2, Hash 
} from 'lucide-react';

const CustomerInfoCard = ({ account }) => {
  if (!account) return null;

  const InfoRow = ({ icon: Icon, label, value, isMono = false, className = "" }) => {
    if (!value) return null;
    return (
      <div className={`flex items-start gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-colors ${className}`}>
        <Icon className="w-3.5 h-3.5 text-indigo-300 mt-1 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-indigo-200/60 font-medium mb-0.5">{label}</p>
          <p className={`text-xs text-white font-medium truncate ${isMono ? 'font-mono' : ''}`}>{value}</p>
        </div>
      </div>
    );
  };

  // Use Personal Photo (id_card_image) if available, otherwise fallback to ID Card Front (id_card_front)
  const avatarImage = account.id_card_image || account.id_card_front;

  return (
    <div className="bg-slate-900 rounded-xl shadow-lg text-white overflow-hidden border border-slate-800">
      
      {/* Compact Header */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center border border-white/10 shrink-0 overflow-hidden">
              {avatarImage ? (
                 <img src={avatarImage} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                 <User className="w-5 h-5 text-indigo-300" />
              )}
           </div>
           <div className="min-w-0">
              <h3 className="text-sm font-bold text-white truncate leading-tight">
                 {account.name || 'مجهول'}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                 <span className="text-[10px] text-indigo-300 font-medium truncate">
                    {account.nickname || 'لا يوجد لقب'}
                 </span>
                 <span className="w-1 h-1 rounded-full bg-white/20" />
                 <span className="text-[10px] text-white/50 bg-white/10 px-1.5 rounded">
                    {account.account_type === 'customer' ? 'عميل' : account.account_type}
                 </span>
              </div>
           </div>
        </div>
      </div>

      {/* Dense Grid Content */}
      <div className="p-2 grid grid-cols-1 gap-0.5">
         
         {/* Contact Section */}
         <div className="grid grid-cols-2 gap-0.5">
            <InfoRow icon={Phone} label="الهاتف 1" value={account.phone1} isMono />
            <InfoRow icon={Smartphone} label="الهاتف 2" value={account.phone2} isMono />
         </div>
         
         <InfoRow icon={MapPin} label="العنوان" value={account.address} />
         
         {/* Divider */}
         <div className="h-px bg-white/5 mx-2 my-1" />

         {/* Work & Personal */}
         <div className="grid grid-cols-2 gap-0.5">
            <InfoRow icon={Briefcase} label="الوظيفة" value={account.job} />
            <InfoRow icon={Calendar} label="الميلاد" value={account.birth_date ? new Date(account.birth_date).toLocaleDateString('ar-LY') : null} isMono />
         </div>

         <InfoRow icon={Building2} label="عنوان العمل" value={account.job_address} />
         <InfoRow icon={CreditCard} label="الرقم الوطني" value={account.national_id} isMono />

         {/* Notes Section */}
         {account.notes && (
            <div className="mt-1 p-3 bg-indigo-950/30 rounded-lg border border-indigo-500/10 m-1">
               <div className="flex items-center gap-1.5 mb-1.5">
                  <FileText className="w-3 h-3 text-indigo-400" />
                  <span className="text-[10px] text-indigo-300 font-bold">ملاحظات</span>
               </div>
               <p className="text-[11px] text-white/70 leading-relaxed whitespace-pre-line">
                  {account.notes}
               </p>
            </div>
         )}
      </div>
    </div>
  );
};

export default CustomerInfoCard;
