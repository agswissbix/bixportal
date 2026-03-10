export function formatPrice(price: number): string {
  if (price === undefined || price === null) return "0.--";
  
  const rounded = Math.round(price * 100) / 100;

  // Se dopo l'arrotondamento è intero
  if (rounded % 1 === 0) {
    return `${rounded.toLocaleString("de-CH")}.--`;
  }

  return rounded.toLocaleString("de-CH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
