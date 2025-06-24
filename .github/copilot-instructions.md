<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# SNS Application - Copilot Instructions

## プロジェクト概要
このプロジェクトは、Next.js + TypeScriptで構築されたシンプルなSNSアプリケーションです。X（Twitter）のような基本的な機能を持ちながら、複雑な機能は省略されています。

## 技術スタック
- **フロントエンド**: Next.js 15 + TypeScript + Tailwind CSS
- **認証**: NextAuth.js (Credentials Provider)
- **データベース**: SQLite3
- **スタイリング**: Tailwind CSS

## 機能仕様
### 実装済み機能
- ユーザー登録・ログイン（ユーザー名・パスワードのみ）
- 投稿作成（テキストのみ、280文字制限）
- 投稿一覧表示
- いいね機能
- 返信機能
- 投稿詳細表示

### 除外機能（実装しない）
- リツイート・引用機能
- ユーザーアイコン・背景画像
- 画像・動画の投稿
- フォロー・フォロワー機能
- ダイレクトメッセージ

## セキュリティ要件
1. **環境変数の管理**: `.env.local`ファイルを使用し、`.gitignore`で除外済み
2. **パスワードハッシュ化**: bcryptjsを使用
3. **SQLインジェクション対策**: パラメータ化クエリを使用
4. **認証**: NextAuth.jsを使用したセッション管理

## データベーススキーマ
```sql
-- ユーザーテーブル
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 投稿テーブル
CREATE TABLE posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- いいねテーブル
CREATE TABLE likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  post_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (post_id) REFERENCES posts(id),
  UNIQUE(user_id, post_id)
);

-- 返信テーブル
CREATE TABLE replies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  post_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (post_id) REFERENCES posts(id)
);
```

## APIエンドポイント
- `POST /api/auth/register` - ユーザー登録
- `GET/POST /api/posts` - 投稿取得・作成
- `POST /api/posts/[id]/like` - いいね機能
- `GET/POST /api/posts/[id]/replies` - 返信取得・作成

## 開発ガイドライン
1. **型安全性**: TypeScriptを活用し、適切な型定義を行う
2. **エラーハンドリング**: APIエラーの適切な処理
3. **ユーザビリティ**: 直感的なUI/UX
4. **セキュリティ**: 常にセキュリティを意識した実装

## 今後の拡張予定
- リアルタイム更新機能
- 投稿の編集・削除機能
- より詳細なユーザープロフィール
- 検索機能
