import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import DatabaseManager from '@/lib/database';

// 型定義
interface UserRecord {
  id: number;
  username: string;
  password: string;
}

interface ExtendedUser {
  id: string;
  name: string;
}

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'ユーザー名', type: 'text' },
        password: { label: 'パスワード', type: 'password' }
      },
      async authorize(credentials): Promise<ExtendedUser | null> {
        if (!credentials?.username || !credentials?.password) {
          console.log('認証失敗: 認証情報が不足');
          return null;
        }

        const db = DatabaseManager.getInstance();
        try {
          const user = db.get(
            'SELECT * FROM users WHERE username = ?',
            credentials.username
          ) as UserRecord | undefined;

          console.log(`認証試行: ${credentials.username} -> ${user ? '見つかった' : '見つからない'}`);

          if (user && await bcrypt.compare(credentials.password, user.password)) {
            console.log(`認証成功: ${user.username}`);
            return {
              id: user.id.toString(),
              name: user.username,
            };
          }
          
          console.log('認証失敗: パスワード不一致またはユーザー不存在');
          return null;
        } catch (error) {
          console.error('認証エラー:', error);
          return null;
        }
        // Note: シングルトンパターンなのでcloseしない
      }
    })
  ],
  pages: {
    signIn: '/auth/signin',
  },
  debug: process.env.NODE_ENV === 'development',
  callbacks: {
    session: async ({ session, token }: { session: any; token: any }) => {
      if (token.sub && session.user) {
        // ユーザーIDをセッションに追加
        (session.user as { id?: string }).id = token.sub;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
