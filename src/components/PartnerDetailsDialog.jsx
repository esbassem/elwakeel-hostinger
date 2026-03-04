import React, { useState } from 'react';
import { X, Edit, Phone, MapPin, Briefcase, Calendar, AlertCircle, FileText } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import FullAddAccountForm from './FullAddAccountForm';
import { usePartners } from '@/hooks/usePartners';

const PartnerDetailsDialog = ({ isOpen, onClose, partner, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const { getMissingFields } = usePartners();

  if (!partner) return null;

  const missingFields = getMissingFields(partner);
  const accountTypeLabels = {
    customer: 'عميل',
    supplier: 'مورد',
    both: 'عميل ومورد'
  };

  const partnerName = partner.name || 'بدون اسم';
  const accountType = partner.account_type || 'customer';

  const InfoRow = ({ icon: Icon, label, value, missing = false }) => {
    if (!value && !missing) return null;

    return (
      <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-stone-50 transition-colors">
        <div className={`p-2 rounded-lg ${missing ? 'bg-rose-50' : 'bg-stone-100'} shrink-0`}>
          {missing ? <AlertCircle className="w-4 h-4 text-rose-500" /> : <Icon className="w-4 h-4 text-stone-500" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-stone-500 font-medium mb-1">{label}</p>
          <p className={`text-sm font-bold ${missing ? 'text-rose-500 italic' : 'text-stone-800'} break-words`}>
            {value || 'غير محدد'}
          </p>
        </div>
      </div>
    );
  };

  return (
    <>
      <Dialog open={isOpen && !isEditing} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl bg-white rounded-3xl border-none p-0 overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="bg-gradient-to-l from-indigo-600 to-indigo-700 p-6 sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-white mb-1">{partnerName}</h2>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-bold rounded-full">
                    {accountTypeLabels[accountType] || 'غير محدد'}
                  </span>
                  {missingFields.length > 0 && (
                    <span className="px-3 py-1 bg-rose-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {missingFields.length} حقول مفقودة
                    </span>
                  )}
                </div>
              </div>
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm border border-white/30 rounded-xl px-4 py-2"
              >
                <Edit className="w-4 h-4 ml-2" />
                تعديل
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-sm font-bold text-stone-700 flex items-center gap-2 border-b border-stone-100 pb-2 mb-3">
                <div className="w-1 h-4 bg-indigo-500 rounded-full"></div>
                المعلومات الشخصية
              </h3>
              <div className="space-y-2">
                <InfoRow icon={FileText} label="الاسم الكامل" value={partnerName} missing={!partner.name} />
                <InfoRow icon={FileText} label="اللقب" value={partner.nickname} />
                <InfoRow icon={Calendar} label="تاريخ الميلاد" value={partner.birth_date ? new Date(partner.birth_date).toLocaleDateString('ar-SA') : null} />
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-sm font-bold text-stone-700 flex items-center gap-2 border-b border-stone-100 pb-2 mb-3">
                <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
                معلومات الاتصال
              </h3>
              <div className="space-y-2">
                <InfoRow icon={Phone} label="رقم هاتف 1" value={partner.phone1} missing={!partner.phone1} />
                <InfoRow icon={Phone} label="رقم هاتف 2" value={partner.phone2} />
                <InfoRow icon={MapPin} label="العنوان" value={partner.address} missing={!partner.address} />
              </div>
            </div>

            {/* Work Information */}
            <div>
              <h3 className="text-sm font-bold text-stone-700 flex items-center gap-2 border-b border-stone-100 pb-2 mb-3">
                <div className="w-1 h-4 bg-amber-500 rounded-full"></div>
                معلومات العمل
              </h3>
              <div className="space-y-2">
                <InfoRow icon={Briefcase} label="العمل" value={partner.job} />
                <InfoRow icon={MapPin} label="عنوان العمل" value={partner.job_address} />
              </div>
            </div>

            {/* ID Card Image */}
            {partner.id_card_image && (
              <div>
                <h3 className="text-sm font-bold text-stone-700 flex items-center gap-2 border-b border-stone-100 pb-2 mb-3">
                  <div className="w-1 h-4 bg-rose-500 rounded-full"></div>
                  صورة البطاقة
                </h3>
                <img 
                  src={partner.id_card_image} 
                  alt="ID Card" 
                  className="w-full max-w-md mx-auto rounded-2xl border-2 border-stone-200 shadow-md"
                />
              </div>
            )}

            {/* Notes */}
            {partner.notes && (
              <div>
                <h3 className="text-sm font-bold text-stone-700 flex items-center gap-2 border-b border-stone-100 pb-2 mb-3">
                  <div className="w-1 h-4 bg-purple-500 rounded-full"></div>
                  ملاحظات
                </h3>
                <p className="text-sm text-stone-600 p-4 bg-stone-50 rounded-xl leading-relaxed">{partner.notes}</p>
              </div>
            )}

            {/* Metadata */}
            <div className="pt-4 border-t border-stone-100">
              <div className="flex items-center justify-between text-xs text-stone-400">
                <span>تم الإنشاء: {partner.created_at ? new Date(partner.created_at).toLocaleDateString('ar-SA') : '-'}</span>
                <span>آخر تحديث: {partner.updated_at ? new Date(partner.updated_at).toLocaleDateString('ar-SA') : '-'}</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <FullAddAccountForm
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        editAccount={partner}
        onSuccess={() => {
          setIsEditing(false);
          onUpdate?.();
        }}
      />
    </>
  );
};

export default PartnerDetailsDialog;
