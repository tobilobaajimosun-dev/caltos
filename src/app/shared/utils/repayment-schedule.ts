import { LoanApplication } from '../services/loans.service';

export interface RepaymentInstallment {
  dueDate: string;
  amount: number;
  paid: boolean;
}

/** Rough month-adder that doesn't need a date library for this demo-scale schedule. */
function addMonths(iso: string, months: number): string {
  const d = new Date(iso);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

/**
 * There's no stored repayment ledger or disbursement date on LoanApplication — this app has
 * no backend, so the schedule is derived on the fly from tenor/monthlyRepayment, anchored to
 * whichever activityLog entry mentions disbursement (falling back to appliedAt for loans that
 * haven't disbursed yet). Installments before "today" are treated as paid for a disbursed loan,
 * which is a reasonable stand-in for a real repayment-collection record in this demo app.
 */
export function buildRepaymentSchedule(loan: LoanApplication): RepaymentInstallment[] {
  const disbursedEntry = [...loan.activityLog].reverse().find((e) => /disburs/i.test(e.event));
  const anchor = (disbursedEntry?.timestamp ?? loan.appliedAt).slice(0, 10);
  const now = new Date();

  return Array.from({ length: loan.tenor }, (_, i) => {
    const dueDate = addMonths(anchor, i + 1);
    const paid = loan.status === 'closed' || (loan.status === 'disbursed' && new Date(dueDate) < now);
    return { dueDate, amount: loan.monthlyRepayment, paid };
  });
}
