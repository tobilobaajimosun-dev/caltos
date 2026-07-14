/** Strips everything but digits, then re-inserts thousand separators — "500000" / "500,000" / "₦500,000" all become "500,000". */
export function formatThousands(raw: string | number | null | undefined): string {
  const digits = String(raw ?? '').replace(/[^\d]/g, '');
  return digits ? Number(digits).toLocaleString('en-US') : '';
}

/** Strips commas (and anything else non-numeric except a leading minus/decimal point) so a comma-formatted string can be parsed as a number. */
export function parseThousands(formatted: string | number | null | undefined): number {
  const cleaned = String(formatted ?? '').replace(/[^\d.-]/g, '');
  return cleaned ? Number(cleaned) : 0;
}
