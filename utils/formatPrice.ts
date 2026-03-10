export function formatPrice(price: number): string {
  if (price === undefined || price === null) return "0.--";
  
  // Check if it's an integer
  if (Number.isInteger(price) || price % 1 === 0) {
    const formattedNumber = price.toLocaleString("de-CH", { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0 
    });
    return `${formattedNumber}.--`;
  }
  
  // If it has decimals, format with exactly 2 decimal places
  const formattedDecimal = price.toLocaleString("de-CH", { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
  return formattedDecimal;
}
