import React, { useState } from 'react';
import { X, Edit, Phone, MapPin, Briefcase, Calendar, AlertCircle, FileText } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import FullAddAccountForm from './FullAddAccountForm';
import { useAccounts } from '@/hooks/useAccounts';

const AccountDetailsDialog = ({ isOpen, onClose, account, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const { getMissingFields } = useAccounts();

  if (!account) return null;

  const missingFields = getMissingFields(account);
  const accountTypeLabels = {
    customer: 'عميل',
    supplier: 'مورد',
    both: 'عميل ومورد'
  };

  const accountName = account.name || 'بدون اسم';
  const accountType = account.account_type || 'customer';

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
                <h2 className="text-2xl font-black text-white mb-1">{accountName}</h2>
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
                <InfoRow icon={FileText} label="الاسم الكامل" value={accountName} missing={!account.name} />
                <InfoRow icon={FileText} label="اللقب" value={account.nickname} />
                <InfoRow icon={Calendar} label="تاريخ الميلاد" value={account.birth_date ? new Date(account.birth_date).toLocaleDateString('ar-SA') : null} />
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-sm font-bold text-stone-700 flex items-center gap-2 border-b border-stone-100 pb-2 mb-3">
                <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
                معلومات الاتصال
              </h3>
              <div className="space-y-2">
                <InfoRow icon={Phone} label="رقم هاتف 1" value={account.phone1} missing={!account.phone1} />
                <InfoRow icon={Phone} label="رقم هاتف 2" value={account.phone2} />
                <InfoRow icon={MapPin} label="العنوان" value={account.address} missing={!account.address} />
              </div>
            </div>

            {/* Work Information */}
            <div>
              <h3 className="text-sm font-bold text-stone-700 flex items-center gap-2 border-b border-stone-100 pb-2 mb-3">
                <div className="w-1 h-4 bg-amber-500 rounded-full"></div>
                معلومات العمل
              </h3>
              <div className="space-y-2">
                <InfoRow icon={Briefcase} label="العمل" value={account.job} />
                <InfoRow icon={MapPin} label="عنوان العمل" value={account.job_address} />
              </div>
            </div>

            {/* ID Card Image */}
            {account.id_card_image && (
              <div>
                <h3 className="text-sm font-bold text-stone-700 flex items-center gap-2 border-b border-stone-100 pb-2 mb-3">
                  <div className="w-1 h-4 bg-rose-500 rounded-full"></div>
                  صورة البطاقة
                </h3>
                <img 
                  src={account.id_card_image} 
                  alt="ID Card" 
                  className="w-full max-w-md mx-auto rounded-2xl border-2 border-stone-200 shadow-md"
                />
              </div>
            )}

            {/* Notes */}
            {account.notes && (
              <div>
                <h3 className="text-sm font-bold text-stone-700 flex items-center gap-2 border-b border-stone-100 pb-2 mb-3">
                  <div className="w-1 h-4 bg-purple-500 rounded-full"></div>
                  ملاحظات
                </h3>
                <p className="text-sm text-stone-600 p-4 bg-stone-50 rounded-xl leading-relaxed">{account.notes}</p>
              </div>
            )}

            {/* Metadata */}
            <div className="pt-4 border-t border-stone-100">
              <div className="flex items-center justify-between text-xs text-stone-400">
                <span>تم الإنشاء: {account.created_at ? new Date(account.created_at).toLocaleDateString('ar-SA') : '-'}</span>
                <span>آخر تحديث: {account.updated_at ? new Date(account.updated_at).toLocaleDateString('ar-SA') : '-'}</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <FullAddAccountForm
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        editAccount={account}
        onSuccess={() => {
          setIsEditing(false);
          onUpdate?.();
        }}
      />
    </>
  );
};

export default AccountDetailsDialog;