/**
 * Centralized Indian Rupee (₹) and Indian Numbering System Utility
 * 
 * Implements the standard Indian numbering system (comma placement):
 * - Groups rightmost 3 digits (hundreds), then groups every 2 digits (thousands, lakhs, crores).
 * - Examples:
 *   ₹1,000.00 (One Thousand)
 *   ₹10,000.00 (Ten Thousand)
 *   ₹1,00,000.00 (One Lakh)
 *   ₹12,34,567.50 (Twelve Lakhs, Thirty-Four Thousand, Five Hundred Sixty-Seven and Fifty Paise)
 *   ₹1,23,45,678.00 (One Crore, Twenty-Three Lakhs, Forty-Five Thousand, Six Hundred Seventy-Eight)
 */

export interface CurrencyFormatOptions {
  /** Currency symbol prefix, defaults to '₹' */
  symbol?: string;
  /** Decimal places (defaults to 2 for standard financial ledger display) */
  decimals?: number;
  /** If true, formats with exact 2 decimal places (paise) */
  exact?: boolean;
  /** If true, formats large amounts into Indian Lakhs (L) and Crores (Cr) */
  compact?: boolean;
  /** Space between symbol and number, default false */
  space?: boolean;
}

/**
 * Pure Indian numbering system formatter without currency symbol.
 * Formats numbers into standard Indian comma grouping (##,##,##,###.##).
 */
export function formatIndianNumber(
  value: number | string | null | undefined,
  decimals: number = 2
): string {
  if (value === null || value === undefined || value === '') {
    return decimals > 0 ? `0.${'0'.repeat(decimals)}` : '0';
  }

  const num = typeof value === 'number' ? value : Number(value);
  if (isNaN(num)) {
    return decimals > 0 ? `0.${'0'.repeat(decimals)}` : '0';
  }

  const isNegative = num < 0;
  const absNum = Math.abs(num);

  // Round accurately to the required decimal places
  const fixedStr = absNum.toFixed(decimals);
  const [integerPart, decimalPart] = fixedStr.split('.');

  let formattedInteger = '';
  if (integerPart.length <= 3) {
    formattedInteger = integerPart;
  } else {
    const lastThree = integerPart.substring(integerPart.length - 3);
    const otherDigits = integerPart.substring(0, integerPart.length - 3);
    const groupedPairs = otherDigits.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    formattedInteger = `${groupedPairs},${lastThree}`;
  }

  const result = decimals > 0 && decimalPart ? `${formattedInteger}.${decimalPart}` : formattedInteger;
  return isNegative ? `-${result}` : result;
}

/**
 * Standard Indian Rupee Currency Formatter
 * Defaults to ₹ symbol and Indian numbering comma placement.
 * 
 * @example
 * formatCurrency(1234567) => "₹12,34,567.00"
 * formatCurrency(100000, { decimals: 0 }) => "₹1,00,000"
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  options?: CurrencyFormatOptions
): string {
  if (amount === null || amount === undefined || amount === '') {
    const sym = options?.symbol ?? '₹';
    const dec = options?.exact ? 2 : (options?.decimals ?? 2);
    return dec > 0 ? `${sym}0.${'0'.repeat(dec)}` : `${sym}0`;
  }

  const num = typeof amount === 'number' ? amount : Number(amount);
  if (isNaN(num)) {
    const sym = options?.symbol ?? '₹';
    const dec = options?.exact ? 2 : (options?.decimals ?? 2);
    return dec > 0 ? `${sym}0.${'0'.repeat(dec)}` : `${sym}0`;
  }

  const sym = options?.symbol ?? '₹';
  const spacing = options?.space ? ' ' : '';
  const isNegative = num < 0;
  const absAmount = Math.abs(num);

  // Handle Compact notation in Crores and Lakhs if requested
  if (options?.compact) {
    if (absAmount >= 10000000) {
      // Crores (1 Cr = 1,00,00,000)
      const crVal = (absAmount / 10000000).toFixed(2);
      const sign = isNegative ? '-' : '';
      return `${sign}${sym}${spacing}${crVal} Cr`;
    } else if (absAmount >= 100000) {
      // Lakhs (1 L = 1,00,000)
      const lVal = (absAmount / 100000).toFixed(2);
      const sign = isNegative ? '-' : '';
      return `${sign}${sym}${spacing}${lVal} L`;
    }
  }

  const decimals = options?.exact !== undefined ? (options.exact ? 2 : 0) : (options?.decimals ?? 2);
  const formattedNumber = formatIndianNumber(absAmount, decimals);

  if (isNegative) {
    return `-${sym}${spacing}${formattedNumber}`;
  }
  return `${sym}${spacing}${formattedNumber}`;
}

/**
 * Primary formatINR function as specified in the application requirements:
 * Accepts a number and returns a string using the Indian Rupee symbol (₹)
 * and the Indian numbering system format (e.g., 1,00,000.00).
 *
 * @param amount - Number or numeric string to format
 * @param options - Optional configuration or boolean (pass false to suppress .00 decimals)
 * 
 * @example
 * formatINR(100000) => "₹1,00,000.00"
 * formatINR(1234567.89) => "₹12,34,567.89"
 * formatINR(100000, false) => "₹1,00,000"
 */
export function formatINR(
  amount: number | string | null | undefined,
  options?: boolean | { decimals?: number; exact?: boolean; compact?: boolean; space?: boolean }
): string {
  if (typeof options === 'boolean') {
    return formatCurrency(amount, { exact: options, decimals: options ? 2 : 0 });
  }

  const decimals = options?.decimals ?? (options?.exact === false ? 0 : 2);
  const exact = options?.exact ?? (decimals === 2);

  return formatCurrency(amount, {
    decimals,
    exact,
    compact: options?.compact,
    space: options?.space,
  });
}

/**
 * Format currency with exact paise / 2 decimals (e.g. ₹12,34,567.00)
 */
export function formatCurrencyExact(amount: number | string | null | undefined): string {
  return formatINR(amount, true);
}

/**
 * Format currency in compact Indian scale (Lakhs / Crores)
 * e.g. formatCurrencyCompact(2500000) => "₹25.00 L"
 */
export function formatCurrencyCompact(amount: number | string | null | undefined): string {
  return formatCurrency(amount, { compact: true });
}

/**
 * Parse an Indian currency or formatted string back to a numeric value
 */
export function parseIndianCurrency(input: string): number {
  if (!input) return 0;
  const cleaned = input.replace(/[₹$,\s]/g, '').trim();
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}
