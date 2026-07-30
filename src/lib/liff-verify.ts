import "server-only";

export type LiffProfile = {
  sub: string;
  name: string | null;
  picture: string | null;
};

// ยืนยัน ID token จาก @line/liff ฝั่งเซิร์ฟเวอร์ ห้ามเชื่อข้อมูลโปรไฟล์ที่ client ส่งมาตรงๆ
// เพราะปลอมแปลงได้ — ต้องเช็คกับ LINE ก่อนทุกครั้ง
// เอกสาร: https://developers.line.biz/en/reference/line-login/#verify-id-token
export async function verifyLiffIdToken(idToken: string): Promise<LiffProfile | null> {
  const clientId = process.env.LINE_CHANNEL_ID;
  if (!clientId) {
    console.error("[liff-verify] Missing LINE_CHANNEL_ID environment variable");
    throw new Error("Missing LINE_CHANNEL_ID environment variable");
  }

  const response = await fetch("https://api.line.me/oauth2/v2.1/verify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ id_token: idToken, client_id: clientId }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`[liff-verify] LINE verify failed: ${response.status} ${body}`);
    return null;
  }

  const data = await response.json();
  if (typeof data.sub !== "string") {
    console.error("[liff-verify] LINE verify response missing sub:", data);
    return null;
  }

  return {
    sub: data.sub,
    name: typeof data.name === "string" ? data.name : null,
    picture: typeof data.picture === "string" ? data.picture : null,
  };
}
