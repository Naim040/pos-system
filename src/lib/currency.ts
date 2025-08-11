// Currency configuration for Bangladeshi Taka (BDT)
export interface CurrencyConfig {
  symbol: string;
  code: string;
  name: string;
  locale: string;
  decimalDigits: number;
  symbolPosition: 'before' | 'after';
  spaceBetween: boolean;
}

export const BDT_CURRENCY: CurrencyConfig = {
  symbol: '৳',
  code: 'BDT',
  name: 'Bangladeshi Taka',
  locale: 'en-BD',
  decimalDigits: 2,
  symbolPosition: 'before',
  spaceBetween: false
};

// Format price with BDT currency
export function formatPrice(amount: number): string {
  const { symbol, decimalDigits, symbolPosition, spaceBetween } = BDT_CURRENCY;
  
  // Format the number with proper decimal places
  const formattedAmount = amount.toFixed(decimalDigits);
  
  // Add thousand separators (Bangladeshi format uses commas)
  const parts = formattedAmount.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  const formattedNumber = parts.join('.');
  
  // Position the symbol
  if (symbolPosition === 'before') {
    return spaceBetween ? `${symbol} ${formattedNumber}` : `${symbol}${formattedNumber}`;
  } else {
    return spaceBetween ? `${formattedNumber} ${symbol}` : `${formattedNumber}${symbol}`;
  }
}

// Format price for input fields (without symbol)
export function formatPriceForInput(amount: number): string {
  const { decimalDigits } = BDT_CURRENCY;
  return amount.toFixed(decimalDigits);
}

// Parse price from input string
export function parsePriceFromInput(value: string): number {
  // Remove any non-numeric characters except decimal point
  const cleanedValue = value.replace(/[^\d.]/g, '');
  return parseFloat(cleanedValue) || 0;
}

// Get currency symbol
export function getCurrencySymbol(): string {
  return BDT_CURRENCY.symbol;
}

// Get currency code
export function getCurrencyCode(): string {
  return BDT_CURRENCY.code;
}

// Format price for international standards (with currency code)
export function formatPriceInternational(amount: number): string {
  const { code, decimalDigits } = BDT_CURRENCY;
  return `${amount.toFixed(decimalDigits)} ${code}`;
}

// Format large amounts with abbreviated notation
export function formatLargePrice(amount: number): string {
  const { symbol } = BDT_CURRENCY;
  
  if (amount >= 10000000) { // 1 crore or more
    return `${symbol}${(amount / 10000000).toFixed(1)} কোটি`;
  } else if (amount >= 100000) { // 1 lakh or more
    return `${symbol}${(amount / 100000).toFixed(1)} লাখ`;
  } else if (amount >= 1000) { // 1 thousand or more
    return `${symbol}${(amount / 1000).toFixed(1)}K`;
  }
  
  return formatPrice(amount);
}

// Validate price input
export function validatePriceInput(value: string): boolean {
  // Allow empty string, numbers, and decimal point
  if (value === '') return true;
  
  // Check if it's a valid number format
  const regex = /^\d*\.?\d*$/;
  return regex.test(value);
}

// Convert price to words (Bangla)
export function priceToWords(amount: number): string {
  // This is a simplified version - in production, you'd want a comprehensive Bangla number converter
  const integerPart = Math.floor(amount);
  const decimalPart = Math.round((amount - integerPart) * 100);
  
  let words = '';
  
  if (integerPart > 0) {
    words += `${integerPart} টাকা`;
  }
  
  if (decimalPart > 0) {
    if (words) words += ' ';
    words += `${decimalPart} পয়সা`;
  }
  
  return words || 'শূন্য টাকা';
}