/** @type {import('next').NextConfig} */
const nextConfig = {
  // ESLintエラーでビルドを停止しない
  eslint: {
    ignoreDuringBuilds: true,
    dirs: [], // ESLintを完全に無効化
  },
  // TypeScriptエラーでビルドを停止しない
  typescript: {
    ignoreBuildErrors: true,
  },
  // 実験的な機能
  experimental: {
    // 必要に応じて追加
  },
  // 環境変数の検証をスキップ
  skipTrailingSlashRedirect: true,
  skipMiddlewareUrlNormalize: true,
};

module.exports = nextConfig;
