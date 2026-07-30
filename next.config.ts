import type { NextConfig } from "next";

const nextConfig: NextConfig = {
images: {
  remotePatterns: [
    {
      protocol: "https",
      hostname: "images.unsplash.com",
      pathname: "/**",
    },
  ],
},
experimental: {
  serverActions: {
    // ฟอร์มเพิ่มสินค้าอัปโหลดรูป+วิดีโอผ่าน Server Action โดยตรง ค่า default 1MB
    // เล็กเกินไปสำหรับวิดีโอ ปรับเป็น 50MB ให้พอสำหรับรูปหลายไฟล์ + คลิปสั้นๆ
    bodySizeLimit: "50mb",
  },
},
};

export default nextConfig;
