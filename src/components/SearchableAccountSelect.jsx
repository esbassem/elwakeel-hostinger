
import React, { useState, useEffect, useRef } from 'react';
import { Search, User, UserPlus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const SearchableAccountSelect = ({ accounts = [], value, onChange, onAddNew, placeholder = "بحث عن حساب..." }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = event => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const filtered = accounts.filter(acc => 
    (acc.name?.toLowerCase().includes(search.toLowerCase())) || 
    (acc.phone1?.includes(search)) ||
    (acc.nickname?.toLowerCase().includes(search.toLowerCase()))
  );
  
  const selected = accounts.find(a => a.id === value);

  return (
    <div className="flex items-center gap-2" ref={wrapperRef}>
      <div className="relative flex-1">
        <div 
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "h-10 w-full flex items-center justify-between px-3 bg-white border rounded-lg text-xs cursor-pointer transition-all shadow-sm hover:shadow",
            isOpen ? "border-blue-600 ring-1 ring-blue-600/20" : "border-slate-200 hover:border-blue-400"
          )}
        >
          {selected ? (
            <div className="flex items-center gap-2 overflow-hidden">
               <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <User className="w-3 h-3" />
               </div>
               <span className="font-bold text-slate-900 truncate">
                 {selected.nickname ? `${selected.nickname} (${selected.name})` : selected.name}
               </span>
            </div>
          ) : (
            <span className="text-slate-500 text-xs font-bold truncate">{placeholder}</span>
          )}
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        </div>
        
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-lg shadow-xl z-50 max-h-60 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-2 border-b border-slate-50 bg-slate-50/50">
              <input 
                ref={inputRef}
                className="w-full p-2 text-xs border border-slate-200 rounded-md outline-none focus:border-blue-500 focus:bg-white transition-all bg-white font-medium" 
                placeholder="اكتب للبحث بالاسم أو الهاتف..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="overflow-y-auto custom-scrollbar p-1 space-y-0.5">
              {filtered.length > 0 ? filtered.map(acc => (
                <div 
                  key={acc.id} 
                  className={cn(
                    "p-2.5 rounded-md text-xs cursor-pointer flex justify-between items-center transition-colors group",
                    value === acc.id ? "bg-blue-50 text-blue-700 font-bold" : "hover:bg-slate-50 text-slate-700"
                  )}
                  onClick={() => { onChange(acc.id); setIsOpen(false); setSearch(''); }}
                >
                   <div className="flex flex-col">
                      <span className="font-bold group-hover:text-blue-700 transition-colors">
                        {acc.nickname ? `${acc.nickname} (${acc.name})` : acc.name}
                      </span>
                      <span className="opacity-70 font-mono text-[10px]">{acc.phone1}</span>
                   </div>
                   {value === acc.id && <Check className="w-3.5 h-3.5" />}
                </div>
              )) : (
                <div className="p-4 text-center">
                   <p className="text-[10px] text-slate-400 font-bold mb-2">لا توجد نتائج مطابقة</p>
                   {onAddNew && (
                      <Button size="sm" variant="outline" className="text-xs h-7 w-full border-dashed" onClick={() => { onAddNew(); setIsOpen(false); }}>
                        <UserPlus className="w-3 h-3 mr-1" />
                        إضافة جديد
                      </Button>
                   )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {onAddNew && (
        <Button 
          onClick={onAddNew}
          size="icon" 
          variant="outline" 
          className="h-10 w-10 rounded-lg border-dashed border border-slate-300 text-slate-500 hover:text-blue-600 hover:border-blue-500 hover:bg-blue-50 shadow-sm shrink-0"
          title="إضافة حساب جديد"
        >
          <UserPlus className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};

export default SearchableAccountSelect;
