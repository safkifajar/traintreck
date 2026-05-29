import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Di Windows, folder .next/dev sering dikunci VSCode (TS server/watcher)
  // sehingga `next dev` gagal EPERM. Script dev memakai NEXT_DIST_DIR=.next-dev
  // (folder terpisah, tak dipantau) untuk menghindarinya. Build/Vercel tetap .next.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
