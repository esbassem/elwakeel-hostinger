import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowRight, Edit, Trash2, Phone, MapPin, Briefcase, 
  Calendar, AlertCircle, FileText, User, UserCircle, ShieldAlert
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAccounts } from '@/hooks/useAccounts';
import FullAddAccountForm from './FullAddAccountForm';

const AccountPage = ({ currentUser }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getAccountById, deleteAccount, getMissingFields } = useAccounts();
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const fetchDetails = async () => {
    setLoading(true);
    const { data, error } = await getAccountById(id);
    if (error) {
      setError(error);
    } else {
      setAccount(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الحساب نهائياً؟')) return;
    
    const { error } = await deleteAccount(id, false);
    if (!error) {
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-stone-400 font-bold">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  if (error || !account) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center space-y-4 max-w-md px-4">
          <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-500">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-stone-800">تعذر تحميل الحساب</h2>
          <p className="text-stone-500">حدث خطأ أثناء تحميل البيانات، أو أن الحساب غير موجود.</p>
          <div className="flex gap-3 justify-center">
             <Button variant="outline" onClick={() => navigate('/')}>عودة للرئيسية</Button>
             <Button onClick={fetchDetails}>إعادة المحاولة</Button>
          </div>
        </div>
      </div>
    );
  }

  const missingFields = getMissingFields(account);
  const isAdmin = currentUser?.role === 'admin';
  const accountName = account.name || 'بدون اسم';
  const accountType = account.account_type || 'customer';

  const InfoCard = ({ title, icon: Icon, children, className = "" }) => (
    <div className={`bg-white rounded-3xl p-6 border border-stone-100 shadow-sm ${className}`}>
      <div className="flex items-center gap-2 mb-6 pb-2 border-b border-stone-50">
        <div className="p-2 bg-stone-50 rounded-xl text-stone-500">
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="font-bold text-lg text-stone-800">{title}</h3>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );

  const Field = ({ label, value, missing = false, icon: FieldIcon }) => {
    if (!value && !missing) return null;
    return (
      <div className="group flex items-start gap-3 p-3 rounded-xl hover:bg-stone-50 transition-colors">
        <div className={`mt-0.5 ${missing ? 'text-rose-500' : 'text-stone-400 group-hover:text-indigo-500'}`}>
          {missing ? <AlertCircle className="w-4 h-4" /> : FieldIcon ? <FieldIcon className="w-4 h-4" /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
        </div>
        <div className="flex-1">
          <p className="text-xs text-stone-400 font-medium mb-0.5">{label}</p>
          <p className={`font-bold ${missing ? 'text-rose-500 italic' : 'text-stone-800'} break-words leading-relaxed`}>
            {value || 'غير محدد'}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-stone-50/50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-stone-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="rounded-xl hover:bg-stone-100">
                <ArrowRight className="w-5 h-5 text-stone-500" />
              </Button>
              <div>
                <h1 className="text-xl font-black text-stone-900">{accountName}</h1>
                <div className="flex items-center gap-2 text-xs font-medium text-stone-500">
                   <span className={`px-2 py-0.5 rounded-full border ${
                     accountType === 'customer' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 
                     accountType === 'supplier' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 
                     'bg-purple-50 text-purple-600 border-purple-200'
                   }`}>
                     {accountType === 'customer' ? 'عميل' : accountType === 'supplier' ? 'مورد' : 'عميل ومورد'}
                   </span>
                   <span>•</span>
                   <span>تم الإضافة: {account.created_at ? new Date(account.created_at).toLocaleDateString('ar-SA') : '-'}</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={() => setIsEditing(true)} variant="outline" className="gap-2 rounded-xl border-stone-200 hidden sm:flex">
                <Edit className="w-4 h-4" />
                تعديل
              </Button>
              {isAdmin && (
                <Button onClick={handleDelete} variant="ghost" className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl">
                  <Trash2 className="w-5 h-5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Missing Fields Warning */}
        {missingFields.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
             <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
             <div>
               <h4 className="font-bold text-amber-800 text-sm">بيانات ناقصة</h4>
               <p className="text-xs text-amber-600 mt-1">
                 يرجى استكمال البيانات التالية: {missingFields.map(f => f.label).join('، ')}
               </p>
               <button onClick={() => setIsEditing(true)} className="text-xs font-bold text-amber-700 underline mt-2 hover:text-amber-900">
                 استكمال البيانات الآن
               </button>
             </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Info Column */}
          <div className="md:col-span-2 space-y-6">
            <InfoCard title="المعلومات الشخصية" icon={UserCircle}>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                 <Field label="الاسم الكامل" value={accountName} icon={User} />
                 <Field label="اللقب / الشهرة" value={account.nickname} icon={User} />
                 <Field label="تاريخ الميلاد" value={account.birth_date} icon={Calendar} />
                 <Field label="نوع الحساب" value={accountType === 'both' ? 'عميل ومورد' : accountType === 'customer' ? 'عميل' : 'مورد'} icon={UserCircle} />
               </div>
            </InfoCard>

            <InfoCard title="معلومات الاتصال" icon={Phone}>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                 <Field label="رقم هاتف 1" value={account.phone1} missing={!account.phone1} icon={Phone} />
                 <Field label="رقم هاتف 2" value={account.phone2} icon={Phone} />
                 <div className="sm:col-span-2">
                   <Field label="العنوان" value={account.address} missing={!account.address} icon={MapPin} />
                 </div>
               </div>
            </InfoCard>

            {(account.job || account.job_address) && (
              <InfoCard title="معلومات العمل" icon={Briefcase}>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                   <Field label="الوظيفة / العمل" value={account.job} icon={Briefcase} />
                   <Field label="عنوان العمل" value={account.job_address} icon={MapPin} />
                 </div>
              </InfoCard>
            )}

            {account.notes && (
              <InfoCard title="ملاحظات" icon={FileText}>
                 <p className="text-sm text-stone-600 leading-relaxed bg-stone-50 p-4 rounded-xl">
                   {account.notes}
                 </p>
              </InfoCard>
            )}
          </div>

          {/* Sidebar / Image Column */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-stone-100 shadow-sm flex flex-col items-center text-center">
               <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-100 to-white border-2 border-indigo-50 mb-4 flex items-center justify-center text-3xl font-bold text-indigo-600 shadow-inner">
                  {(accountName || '?').charAt(0)}
               </div>
               <h2 className="font-bold text-stone-900 text-lg mb-1">{accountName}</h2>
               <p className="text-sm text-stone-500 mb-6">{account.nickname || 'لا يوجد لقب'}</p>
               
               <Button onClick={() => setIsEditing(true)} className="w-full rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold">
                 تعديل الحساب
               </Button>
            </div>

            {account.id_card_image ? (
              <div className="bg-white rounded-3xl p-4 border border-stone-100 shadow-sm overflow-hidden">
                <h3 className="font-bold text-stone-700 text-sm mb-3 px-2">صورة البطاقة</h3>
                <img 
                  src={account.id_card_image} 
                  alt="ID Card" 
                  className="w-full rounded-2xl border border-stone-100 hover:scale-105 transition-transform cursor-pointer"
                  onClick={() => window.open(account.id_card_image, '_blank')}
                />
              </div>
            ) : (
              <div className="bg-stone-50 rounded-3xl p-8 border-2 border-dashed border-stone-200 text-center">
                 <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mx-auto text-stone-400 mb-3">
                    <FileText className="w-6 h-6" />
                 </div>
                 <p className="text-xs font-bold text-stone-400">لا توجد صورة بطاقة</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <FullAddAccountForm
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        editAccount={account}
        onSuccess={() => {
          setIsEditing(false);
          fetchDetails();
        }}
      />
    </div>
  );
};

export default AccountPage;