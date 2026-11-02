export const WHATSAPP_NUMBER = '923210424424';
export const DISPLAY_PHONE = '0321-0424424';

export function getWhatsAppUrl(message?: string): string {
  const baseUrl = `https://wa.me/${WHATSAPP_NUMBER}`;
  if (!message) return baseUrl;
  return `${baseUrl}?text=${encodeURIComponent(message)}`;
}

export function getProductOrderWhatsAppUrl(productName: string, price: number, selectedColor?: string): string {
  const colorText = selectedColor ? ` (Color: ${selectedColor})` : '';
  const message = `Hello VoltGlide Motors!\n\nI want to place an order for:\n*${productName}*${colorText}\n*Price:* PKR ${price.toLocaleString()}\n\nPlease share booking procedure, delivery timeline, and payment details for my city.`;
  return getWhatsAppUrl(message);
}

export function getInstallmentInquiryWhatsAppUrl(productName: string, price: number): string {
  const message = `Hello VoltGlide!\n\nI want to inquire about the *Easy Monthly Installment Plan* for:\n*${productName}* (Cash Price: PKR ${price.toLocaleString()}).\n\nPlease send details on down-payment and monthly installment options.`;
  return getWhatsAppUrl(message);
}

export function getTestRideWhatsAppUrl(productName: string): string {
  const message = `Hello VoltGlide!\n\nI would like to schedule a *Showroom Test Ride* for the *${productName}*. Please let me know the nearest available showroom and slot.`;
  return getWhatsAppUrl(message);
}
