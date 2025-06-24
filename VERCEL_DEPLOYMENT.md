# SNS Application - Vercelでの永続化設定

## 概要
このSNSアプリケーションをVercelにデプロイし、データを永続化する方法について説明します。

## 現在の状況
- ローカル開発: SQLite (`sns.db`)でデータ永続化 ✅
- Vercel環境: SQLite (一時的) ⚠️

## Vercelでの永続化手順

### 方法1: Vercel Postgres (推奨)

#### 1. Vercelにプロジェクトをデプロイ
```bash
# GitHubリポジトリがすでに連携されているため、
# Vercel Dashboardで自動デプロイされます
```

#### 2. Vercel Postgresデータベースを作成
1. [Vercel Dashboard](https://vercel.com/dashboard)にアクセス
2. プロジェクトを選択
3. 「Storage」タブをクリック
4. 「Create Database」→「Postgres」を選択
5. データベース名を入力（例：`sns-database`）
6. リージョンを選択（推奨：`us-east-1`）
7. 「Create」をクリック

#### 3. 環境変数の自動設定
Vercelが以下の環境変数を自動設定します：
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL` 
- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_USER`
- `POSTGRES_HOST`
- `POSTGRES_PASSWORD`
- `POSTGRES_DATABASE`

#### 4. データベースマネージャーの切り替え
PostgreSQL対応版を使用する場合：
```bash
# database-postgres.tsをdatabase.tsに置き換える
mv src/lib/database.ts src/lib/database-sqlite.ts
mv src/lib/database-postgres.ts src/lib/database.ts
```

### 方法2: 他の外部データベースサービス

#### PlanetScale (MySQL)
1. [PlanetScale](https://planetscale.com/)でアカウント作成
2. データベースを作成
3. Vercelの環境変数に`DATABASE_URL`を設定

#### Supabase (PostgreSQL)
1. [Supabase](https://supabase.com/)でプロジェクト作成
2. データベースURLを取得
3. Vercelの環境変数に`DATABASE_URL`を設定

#### Turso (分散SQLite)
1. [Turso](https://turso.tech/)でデータベース作成
2. 接続URLを取得
3. Vercelの環境変数に`DATABASE_URL`を設定

## 現在の実装状況

### ✅ 完了
- SQLiteでの基本機能
- ローカル開発環境での永続化
- Vercel Postgres用ライブラリのインストール

### 🚧 準備中
- PostgreSQL対応版データベースマネージャー
- 環境に応じた自動切り替え

### 📋 今後のタスク
- [ ] Vercel Postgresデータベースの作成
- [ ] PostgreSQL対応版への切り替え
- [ ] マイグレーション機能の実装
- [ ] 本番環境での動作確認

## 費用について

### Vercel Postgres
- 無料枠: 256MB、月100万リクエスト
- 有料プラン: $20/月〜

### PlanetScale
- 無料枠: 1GB、月100万リクエスト
- 有料プラン: $29/月〜

### Supabase
- 無料枠: 2GB、月50万リクエスト
- 有料プラン: $25/月〜

## 推奨事項
小規模なプロジェクトの場合、**Vercel Postgres**の無料枠で十分です。
成長に応じて他のサービスへの移行を検討してください。
