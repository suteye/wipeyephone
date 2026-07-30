import type { PhoneDetail } from "@/app/api/phones/[id]/route";

export async function getPhone(id: string): Promise<PhoneDetail | null> {
  const response = await fetch(`/api/phones/${id}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("โหลดข้อมูลสินค้าไม่สำเร็จ");
  return response.json();
}
