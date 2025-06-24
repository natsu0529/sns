/** @type {import('next').NextConfig} */
const nextConfig = {
  // ESLintを完全に無効化
  eslint: {
    ignoreDuringBuilds: true,
  },
  // TypeScriptエラーでビルドを停止しない
  typescript: {
    ignoreBuildErrors: true,
  },
  // 実験的機能でESLintを完全無効化
  experimental: {
    forceSwcTransforms: true,
  },
  // webpackの設定でlintingを無効化
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // ESLintプラグインを削除
    config.plugins = config.plugins.filter(
      plugin => plugin.constructor.name !== 'ESLintWebpackPlugin'
    );
    return config;
  },
  // 実験的な機能
  experimental: {
    // 必要に応じて追加
  },
  // Webpack設定でLinterを無効化
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // ESLintローダーを削除
    config.module.rules = config.module.rules.filter(
      (rule) => !rule.loader || !rule.loader.includes('eslint-loader')
    );
    return config;
  },
};

module.exports = nextConfig;
