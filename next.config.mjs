/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // ให้ build ออกมาเป็นเซิร์ฟเวอร์ก้อนเดียวใน .next/standalone สำหรับใส่ Docker image
  output: "standalone",
};

export default nextConfig;
