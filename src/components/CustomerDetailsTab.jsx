import React from 'react';

const DetailItem = ({ label, value }) => (
    <div className="py-2">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="text-sm font-semibold text-slate-800 mt-0.5 break-words">
            {value || <span className="font-bold text-red-500">--</span>}
        </p>
    </div>
);

const ImagePreview = ({ title, url }) => (
    <div className="w-full">
        <p className="text-sm font-semibold text-slate-700 mb-3">
            {title}
        </p>
        {url ? (
            <div className="aspect-video bg-slate-50 rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center">
                <img src={url} alt={title} className="w-full h-full object-contain" />
            </div>
        ) : (
            <div className="aspect-video bg-slate-50 rounded-lg border border-dashed border-slate-300 flex items-center justify-center">
                <p className="text-sm text-slate-400">لا توجد صورة</p>
            </div>
        )}
    </div>
);

const CustomerDetailsTab = ({ beneficiary }) => {
    if (!beneficiary) {
        return <div className="text-center p-10 text-slate-500">لا توجد بيانات لعرضها.</div>;
    }

    return (
        <div className="pt-2">
            <div className="px-1">
                <DetailItem label="اللقب" value={beneficiary.nickname} />
                <DetailItem label="الاسم الكامل" value={beneficiary.name} />

                {/* Phones Section */}
                <div className="grid grid-cols-2 py-2">
                    <div>
                        <p className="text-xs font-medium text-slate-500">هاتف 1</p>
                        <p className="text-sm font-semibold text-slate-800 mt-0.5 break-words">
                            {beneficiary.phone1 || <span className="font-bold text-red-500">--</span>}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-slate-500">هاتف 2</p>
                        <p className="text-sm font-semibold text-slate-800 mt-0.5 break-words">
                            {beneficiary.phone2 || <span className="font-bold text-red-500">--</span>}
                        </p>
                    </div>
                </div>

                <DetailItem label="عنوان السكن" value={beneficiary.address} />
                <DetailItem label="الوظيفة" value={beneficiary.job} />
                <DetailItem label="عنوان العمل" value={beneficiary.job_address} />
            </div>
            
            <div className="mt-8 pt-6">
                <h3 className="text-base font-bold text-slate-800 mb-5 px-1">مستندات الهوية</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ImagePreview 
                        title="البطاقة الشخصية (وجه أمامي)" 
                        url={beneficiary.id_card_front}
                    />
                    <ImagePreview 
                        title="البطاقة الشخصية (وجه خلفي)" 
                        url={beneficiary.id_card_back}
                    />
                </div>
            </div>
        </div>
    );
};

export default CustomerDetailsTab;
