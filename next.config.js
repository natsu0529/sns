/** @type {import('next').NextConfig} */
const nextConfig = {
  // ESLintエラーでビルドを停止しない
  eslint: {
    ignoreDuringBuilds: true,
  },
  // TypeScriptエラーでビルドを停止しない
  typescript: {
    ignoreBuildErrors: true,
  },
  // 実験的な機能
  experimental: {
    // 必要に応じて追加
  },
};

module.exports = nextConfig;
