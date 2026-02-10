
import React, { useState, useEffect } from 'react';
import { Search, Filter, DollarSign, Clock, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CollectionFiltersBar = ({ onFilterChange }) => {
  const [search, setSearch] = useState('');
  const [daysRange, setDaysRange] = useState('all');
  const [amountRange, setAmountRange] = useState({ min: '', max: '' });
  const [showFilters, setShowFilters] = useState(false);

  // Debounce search & filters
  useEffect(() => {
    const handler = setTimeout(() => {
      onFilterChange({ 
        search, 
        daysRange: daysRange === 'all' ? null : daysRange, 
        minAmount: amountRange.min, 
        maxAmount: amountRange.max 
      });
    }, 300);

    return () => clearTimeout(handler);
  }, [search, daysRange, amountRange, onFilterChange]);

  const hasActiveFilters = daysRange !== 'all' || amountRange.min || amountRange.max;

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-stone-200 mb-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-stone-400" />
          <Input
            placeholder="بحث باسم العميل أو رقم الهاتف..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9"
          />
        </div>

        {/* Filters Toggle & Active Filters */}
        <div className="flex items-center gap-2 w-full md:w-auto">
           <Button 
             variant={showFilters ? "secondary" : "outline"} 
             onClick={() => setShowFilters(!showFilters)}
             className="gap-2"
           >
             <Filter className="w-4 h-4" />
             تصفية
             {hasActiveFilters && (
               <span className="bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">!</span>
             )}
           </Button>

           {hasActiveFilters && (
             <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setDaysRange('all');
                  setAmountRange({ min: '', max: '' });
                }}
                className="text-rose-500 hover:text-rose-700 hover:bg-rose-50"
             >
                <X className="w-4 h-4 ml-1" />
                مسح
             </Button>
           )}
        </div>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="mt-4 pt-4 border-t border-stone-100 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-2">
          
          {/* Days Overdue Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-700 flex items-center gap-2">
              <Clock className="w-4 h-4 text-stone-400" />
              مدة التأخير
            </label>
            <Select value={daysRange} onValueChange={setDaysRange}>
              <SelectTrigger>
                <SelectValue placeholder="اختر المدة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الفترات</SelectItem>
                <SelectItem value="7">أقل من أسبوع (0-7 أيام)</SelectItem>
                <SelectItem value="15">أسبوع - أسبوعين (7-15 يوم)</SelectItem>
                <SelectItem value="30">أسبوعين - شهر (15-30 يوم)</SelectItem>
                <SelectItem value="30+">أكثر من شهر (30+ يوم)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Amount Range */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-700 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-stone-400" />
              قيمة القسط المستحق
            </label>
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <Input 
                  type="number" 
                  placeholder="من" 
                  className="h-10"
                  value={amountRange.min}
                  onChange={(e) => setAmountRange(prev => ({ ...prev, min: e.target.value }))}
                />
              </div>
              <span className="text-stone-300">-</span>
              <div className="relative flex-1">
                <Input 
                  type="number" 
                  placeholder="إلى" 
                  className="h-10"
                  value={amountRange.max}
                  onChange={(e) => setAmountRange(prev => ({ ...prev, max: e.target.value }))}
                />
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default CollectionFiltersBar;
