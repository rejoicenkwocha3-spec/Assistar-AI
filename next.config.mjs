/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
  serverExternalPackages: ["mammoth", "unpdf"],
};
export default nextConfig;
