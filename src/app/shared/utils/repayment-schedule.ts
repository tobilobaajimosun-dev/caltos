import { LoanApplication } from '../services/loans.service';

export type InstallmentStatus = 'paid' | 'partial' | 'overdue' | 'upcoming';

export interface RepaymentInstallment {
  dueDate: string;
  amount: number;
  amountPaid: number;
  status: InstallmentStatus;
  /** Kept for existing callers that only care about "fully settled." */
  paid: boolean;
}

/** Rough month-adder that doesn't need a date library for this demo-scale schedule. */
function addMonths(iso: string, months: number): string {
  const d = new Date(iso);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

/**
 * Builds the installment schedule anchored to disbursement (falling back to appliedAt for loans
 * that haven't disbursed yet), and reconciles each installment against `loan.repayments` — the
 * actual recorded-payment ledger (see LoansService.recordRepayment) — rather than assuming every
 * past-due installment was silently collected. An installment with no matching repayments past its
 * due date is 'overdue' (and eligible for "Pay now"), not automatically 'paid'.
 */
export function buildRepaymentSchedule(loan: LoanApplication): RepaymentInstallment[] {
  const disbursedEntry = [...loan.activityLog].reverse().find((e) => /disburs/i.test(e.event));
  const anchor = (disbursedEntry?.timestamp ?? loan.appliedAt).slice(0, 10);
  const now = new Date();

  return Array.from({ length: loan.tenor }, (_, i) => {
    const dueDate = addMonths(anchor, i + 1);
    const amountPaid = (loan.repayments ?? [])
      .filter((r) => r.installmentDueDate === dueDate)
      .reduce((sum, r) => sum + r.amount, 0);

    const isDisbursed = loan.status === 'disbursed' || loan.status === 'closed';
    const isPastDue = new Date(dueDate) < now;

    let status: InstallmentStatus;
    if (amountPaid >= loan.monthlyRepayment) status = 'paid';
    else if (loan.status === 'closed') status = 'paid'; // liquidated — remaining balance settled in one shot, not per-installment
    else if (amountPaid > 0) status = 'partial';
    else if (isDisbursed && isPastDue) status = 'overdue';
    else status = 'upcoming';

    return { dueDate, amount: loan.monthlyRepayment, amountPaid, status, paid: status === 'paid' };
  });
}
