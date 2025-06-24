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

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'ユーザー名', type: 'text' },
        password: { label: 'パスワード', type: 'password' }
      },
      async authorize(credentials): Promise<ExtendedUser | null> {
        console.log('=== 認証処理開始 ===');
        console.log('入力された認証情報:', {
          username: credentials?.username,
          password: credentials?.password ? '入力あり' : '入力なし'
        });

        if (!credentials?.username || !credentials?.password) {
          console.log('認証情報が不足しています');
          return null;
        }

        const db = DatabaseManager.getInstance();
        try {
          console.log('データベースからユーザー検索:', credentials.username);
          const user = db.get(
            'SELECT * FROM users WHERE username = ?',
            credentials.username
          ) as UserRecord | undefined;

          console.log('ユーザー検索結果:', user ? `見つかった (ID: ${user.id})` : '見つからない');

          if (user) {
            console.log('パスワード比較開始');
            console.log('入力パスワード:', credentials.password);
            console.log('保存されたハッシュ:', user.password);
            
            const passwordMatch = await bcrypt.compare(credentials.password, user.password);
            console.log('パスワード比較結果:', passwordMatch);
            
            if (passwordMatch) {
              console.log('認証成功:', user.username);
              return {
                id: user.id.toString(),
                name: user.username,
              };
            } else {
              console.log('パスワード不一致');
            }
          }
          
          console.log('認証失敗');
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
    session: async ({ session, token }) => {
      if (token.sub && session.user) {
        // ユーザーIDをセッションに追加
        (session.user as { id?: string }).id = token.sub;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
