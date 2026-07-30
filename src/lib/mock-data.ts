export type Phone = { id: string; name: string; storage: string; price: number; image: string; condition: string; battery: string; installment: number; tone: string; };
export const phones: Phone[] = [
  { id: "iphone-15-pro", name: "iPhone 15 Pro", storage: "256 GB · Natural Titanium", price: 28900, image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=900&q=82", condition: "สวยมาก", battery: "98%", installment: 3, tone: "bg-stone-100" },
  { id: "iphone-14-pro", name: "iPhone 14 Pro", storage: "128 GB · Deep Purple", price: 21200, image: "https://images.unsplash.com/photo-1663499482523-3c7d4c7d35d9?auto=format&fit=crop&w=900&q=82", condition: "สภาพดี", battery: "91%", installment: 2, tone: "bg-pink-50" },
  { id: "iphone-13", name: "iPhone 13", storage: "128 GB · Starlight", price: 14800, image: "https://images.unsplash.com/photo-1632661674596-df8be070a5c5?auto=format&fit=crop&w=900&q=82", condition: "สภาพดี", battery: "88%", installment: 2, tone: "bg-rose-50" },
  { id: "iphone-12", name: "iPhone 12", storage: "64 GB · Black", price: 10900, image: "https://images.unsplash.com/photo-1603898037225-1bea0e9a40ad?auto=format&fit=crop&w=900&q=82", condition: "มีรอยเล็กน้อย", battery: "86%", installment: 2, tone: "bg-fuchsia-50" },
];
export const money = new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 });
export const thaiDate = new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "numeric" });
