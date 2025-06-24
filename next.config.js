/** @type {import('next').NextConfig} */
const nextConfig = {
  // ESLintエラーでビルドを停止しない
  eslint: {
    ignoreDuringBuilds: true,
  },
  // TypeScriptエラーでビルドを停止しない（開発中のみ）
  typescript: {
    ignoreBuildErrors: false,
  },
  // 実験的な機能
  experimental: {
    // 必要に応じて追加
  },
};

module.exports = nextConfig;
