
export const calculateFinanceMetrics = (finance) => {
  const installments = finance.finance_installments || finance.installments || [];
  const payments = finance.finance_installment_payments || [];

  // 1. Total Amount
  // Try finance.total_amount first, then sum of installments
  const totalAmount = Number(finance.total_amount) || installments.reduce((sum, inst) => sum + (Number(inst.installment_amount || inst.amount) || 0), 0) || 0;

  // 2. Paid (Sum of all payments)
  const totalPaid = payments.reduce((sum, p) => sum + (Number(p.paid_amount) || 0), 0);

  // 3. Expected Paid (Sum of installments due by today)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sortedInstallments = [...installments].sort((a, b) => new Date(a.installment_date) - new Date(b.installment_date));

  const expectedPaid = sortedInstallments.reduce((sum, inst) => {
    const d = new Date(inst.installment_date);
    d.setHours(0, 0, 0, 0);
    if (d <= today) {
      return sum + (Number(inst.installment_amount || inst.amount) || 0);
    }
    return sum;
  }, 0);

  // 4. Overdue Amount (Expected - Paid, capped at 0)
  const overdueAmount = Math.max(0, expectedPaid - totalPaid);

  // 5. Total Remaining (Total - Paid, capped at 0)
  const totalRemaining = Math.max(0, totalAmount - totalPaid);

  // 6. Counts (Waterfall logic for UI ticks)
  // Determine which specific installments are "paid" vs "overdue" based on cash flow
  let remainingCash = totalPaid;
  let paidCount = 0;
  let overdueCountInst = 0;
  let firstUnpaidIndex = -1;

  sortedInstallments.forEach((inst, index) => {
    const amount = Number(inst.installment_amount || inst.amount) || 0;
    const paidForThis = Math.min(remainingCash, amount);
    remainingCash = Math.max(0, remainingCash - paidForThis);

    // Consider paid if remaining amount is negligible (< 1.0)
    const isFullyPaid = (amount - paidForThis) < 1.0;

    if (isFullyPaid) {
      paidCount++;
    } else {
      if (firstUnpaidIndex === -1) firstUnpaidIndex = index;
      
      const d = new Date(inst.installment_date);
      d.setHours(0, 0, 0, 0);
      
      // If it's not fully paid and the date is passed (or today), it contributes to overdue count
      if (d <= today) {
        overdueCountInst++;
      }
    }
  });

  // Next Due Date (First unpaid installment's date, or the last one if all paid)
  const nextDueInstallment = sortedInstallments[firstUnpaidIndex !== -1 ? firstUnpaidIndex : sortedInstallments.length - 1];

  return {
    totalAmount,
    totalPaid,
    expectedPaid,
    overdueAmount,
    totalRemaining,
    paidCount,
    overdueCountInst,
    totalInstallmentsCount: sortedInstallments.length,
    nextDueDate: nextDueInstallment?.installment_date,
    currentInstallmentNum: firstUnpaidIndex !== -1 ? firstUnpaidIndex + 1 : sortedInstallments.length
  };
};
