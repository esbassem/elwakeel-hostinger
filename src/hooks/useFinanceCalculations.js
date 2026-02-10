import { useCallback } from 'react';

export const useFinanceCalculations = () => {
  const calculateTotalPaid = useCallback((installments) => {
    if (!installments || installments.length === 0) return 0;
    return installments.reduce((acc, curr) => acc + (Number(curr.total_paid_amount) || 0), 0);
  }, []);

  const calculateTotalInstallmentsAmount = useCallback((installments) => {
    if (!installments || installments.length === 0) return 0;
    return installments.reduce((acc, curr) => acc + (Number(curr.installment_amount) || 0), 0);
  }, []);

  const calculateRemaining = useCallback((installments) => {
    const totalAmount = calculateTotalInstallmentsAmount(installments);
    const totalPaid = calculateTotalPaid(installments);
    return Math.max(0, totalAmount - totalPaid);
  }, [calculateTotalInstallmentsAmount, calculateTotalPaid]);

  const calculateProfit = useCallback((financeAmount, installments) => {
    const totalInstallments = calculateTotalInstallmentsAmount(installments);
    return Math.max(0, totalInstallments - Number(financeAmount));
  }, [calculateTotalInstallmentsAmount]);

  const formatFinanceNumber = useCallback((id) => {
    return `#FIN-${id.substring(0, 8).toUpperCase()}`;
  }, []);

  const getStatusColor = useCallback((status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'rejected': return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }, []);

  const getStatusLabel = useCallback((status) => {
    switch (status) {
      case 'pending': return 'قيد المراجعة';
      case 'approved': return 'تمت الموافقة';
      case 'rejected': return 'مرفوض';
      case 'completed': return 'مكتمل';
      default: return status;
    }
  }, []);

  return {
    calculateTotalPaid,
    calculateTotalInstallmentsAmount,
    calculateRemaining,
    calculateProfit,
    formatFinanceNumber,
    getStatusColor,
    getStatusLabel
  };
};