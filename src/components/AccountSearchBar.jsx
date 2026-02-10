
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserPlus, Loader2, Phone, User, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAccounts } from '@/hooks/useAccounts';
import QuickAddAccountModal from './QuickAddAccountModal';
import FullAddAccountForm from './FullAddAccountForm';

const AccountSearchBar = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showFullAdd, setShowFullAdd] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  
  const { fetchAccounts } = useAccounts();
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const addMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
      if (addMenuRef.current && !addMenuRef.current.contains(event.target)) {
        setShowAddMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchTimer = setTimeout(async () => {
      if (query.trim().length >= 1) {
        setIsSearching(true);
        const { data } = await fetchAccounts({ search: query });
        setResults(data || []);
        setIsSearching(false);
        setShowResults(true);
      } else {
        setResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(searchTimer);
  }, [query, fetchAccounts]);

  const handleResultClick = (accountId) => {
    navigate(`/account/${accountId}`);
    setShowResults(false);
    setQuery('');
  };

  return (
    <div className="w-full relative z-50" ref={searchRef}>
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none z-10">
            {isSearching ? (
              <Loader2 className="h-5 w-5 text-indigo-400 animate-spin" />
            ) : (
              <Search className="h-5 w-5 text-stone-400" />
            )}
          </div>
          <input
            type="text"
            className="block w-full pr-12 pl-4 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white placeholder:text-stone-400 focus:bg-white focus:text-stone-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all font-medium shadow-xl"
            placeholder="ابحث عن عميل أو مورد..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.length >= 1 && setShowResults(true)}
          />
        </div>

        <div className="relative" ref={addMenuRef}>
          <Button 
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="h-full py-4 px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl shadow-lg shadow-indigo-900/20 font-bold border-0 gap-2"
          >
            <UserPlus className="w-5 h-5" />
            <span className="hidden sm:inline">إضافة</span>
            <ChevronDown className={`w-4 h-4 opacity-50 transition-transform ${showAddMenu ? 'rotate-180' : ''}`} />
          </Button>

          {showAddMenu && (
            <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-stone-100 p-2 z-50 flex flex-col animate-in fade-in zoom-in-95 duration-200">
              <button 
                onClick={() => {
                  setShowQuickAdd(true);
                  setShowAddMenu(false);
                }}
                className="w-full text-right p-3 rounded-lg hover:bg-stone-50 cursor-pointer font-bold text-stone-700 text-sm transition-colors"
              >
                إضافة سريعة
              </button>
              <button 
                onClick={() => {
                  setShowFullAdd(true);
                  setShowAddMenu(false);
                }}
                className="w-full text-right p-3 rounded-lg hover:bg-stone-50 cursor-pointer font-bold text-stone-700 text-sm transition-colors"
              >
                إضافة كاملة
              </button>
            </div>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showResults && (
          <div className="absolute top-full right-0 left-0 mt-2 bg-white rounded-2xl shadow-2xl border border-stone-100 overflow-hidden z-50 max-h-80 overflow-y-auto">
            {results.length > 0 ? (
              <div className="py-2">
                {results.map((account) => {
                  const displayName = account.nickname || account.name || 'بدون اسم';
                  const displayChar = (displayName || '?').charAt(0);
                  const accountType = account.account_type || 'customer';
                  
                  return (
                    <div
                      key={account.id}
                      onClick={() => handleResultClick(account.id)}
                      className="px-4 py-3 hover:bg-stone-50 cursor-pointer border-b border-stone-50 last:border-0 transition-colors flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border flex-shrink-0 ${
                          accountType === 'customer' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                          accountType === 'supplier' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                          'bg-purple-50 text-purple-600 border-purple-100'
                        }`}>
                          {displayChar}
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-baseline gap-2">
                            <h4 className="font-bold text-stone-800 group-hover:text-indigo-600 transition-colors text-base">
                              {displayName}
                            </h4>
                            {(account.nickname && account.name) && (
                              <span className="text-xs text-stone-500 font-normal">
                                ({account.name})
                              </span>
                            )}
                          </div>
                          {account.phone1 && (
                            <div className="flex items-center gap-1.5 text-xs text-stone-400 dir-ltr">
                              <Phone className="w-3 h-3" />
                              <span className="font-mono">{account.phone1}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-xs font-bold text-stone-300 flex-shrink-0">
                        {accountType === 'customer' ? 'عميل' : accountType === 'supplier' ? 'مورد' : 'مشترك'}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-stone-400">
                <User className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="font-medium text-sm">لا توجد نتائج مطابقة</p>
              </div>
            )}
          </div>
        )}
      </div>

      <QuickAddAccountModal
        isOpen={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        onSuccess={() => setShowQuickAdd(false)}
      />

      <FullAddAccountForm
        isOpen={showFullAdd}
        onClose={() => setShowFullAdd(false)}
        onSuccess={() => setShowFullAdd(false)}
      />
    </div>
  );
};

export default AccountSearchBar;
