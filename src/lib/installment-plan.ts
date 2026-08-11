// กฎการผ่อนแบบไดนามิก (ลูกค้าเลือกความถี่/ระยะเวลาเอง) ใช้ร่วมกันทั้งฝั่ง
// preview (เครื่องคำนวณ), หน้าสินค้า (สร้างคำสั่งซื้อจริง) และ server action (ตรวจซ้ำ)
export const INSTALLMENT_SURCHARGE = 1000;
export const MIN_INSTALLMENT_AMOUNT = 300;
export const WEEK_OPTIONS = [1, 2, 3] as const;

export type Frequency = "daily" | "weekly";

export function installmentCount(freq: Frequency, weeks: number): number {
  return freq === "daily" ? weeks * 7 : weeks;
}

export function intervalDaysFor(freq: Frequency): number {
  return freq === "daily" ? 1 : 7;
}

// totalAmount = ราคาเครื่อง + ค่าธรรมเนียมผ่อนแล้ว — เช็คว่างวดที่เล็กที่สุดยังไม่ต่ำกว่าขั้นต่ำ
export function isValidInstallmentOption(totalAmount: number, freq: Frequency, weeks: number): boolean {
  const count = installmentCount(freq, weeks);
  if (totalAmount <= 0 || count <= 0) return false;
  return Math.floor(totalAmount / count) >= MIN_INSTALLMENT_AMOUNT;
}

export function isFrequency(value: unknown): value is Frequency {
  return value === "daily" || value === "weekly";
}

export function isWeekOption(value: unknown): value is (typeof WEEK_OPTIONS)[number] {
  return typeof value === "number" && (WEEK_OPTIONS as readonly number[]).includes(value);
}

export type ScheduleRow = { sequence: number; dueDate: string; amount: number };

function addDays(date: Date, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// กระจายเศษบาทไปงวดแรกๆ (base+1) ที่เหลือเป็น base ผลรวมเท่ากับ totalAmount เป๊ะ ไม่มีงวดไหนติดลบ
export function buildInstallmentSchedule(
  totalAmount: number,
  freq: Frequency,
  weeks: number,
  startDate: Date = new Date(),
): ScheduleRow[] {
  const count = installmentCount(freq, weeks);
  const intervalDays = intervalDaysFor(freq);
  const base = Math.floor(totalAmount / count);
  const remainder = totalAmount - base * count;
  return Array.from({ length: count }, (_, i) => ({
    sequence: i + 1,
    dueDate: addDays(startDate, i * intervalDays),
    amount: base + (i < remainder ? 1 : 0),
  }));
}
