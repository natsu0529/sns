'use client';

import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Post {
  id: number;
  content: string;
  created_at: string;
  username: string;
  like_count: number;
  reply_count: number;
}

export default function Home() {
  const { data: session, status } = useSession();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(false);

  // 投稿を取得
  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/posts');
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (error) {
      console.error('投稿の取得でエラー:', error);
    }
  };

  // 新しい投稿を作成
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newPost }),
      });

      if (response.ok) {
        setNewPost('');
        fetchPosts(); // 投稿一覧を再読み込み
      } else {
        const error = await response.json();
        alert(error.error || '投稿に失敗しました');
      }
    } catch (error) {
      console.error('投稿作成エラー:', error);
      alert('投稿に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // いいね機能
  const handleLike = async (postId: number) => {
    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
      });
      
      if (response.ok) {
        fetchPosts(); // 投稿一覧を再読み込み
      }
    } catch (error) {
      console.error('いいねエラー:', error);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">読み込み中...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">SNS</h1>
            <p className="text-gray-600 mb-8">シンプルなソーシャルネットワーク</p>
            <div className="space-y-4">
              <Link
                href="/auth/signin"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                ログイン
              </Link>
              <Link
                href="/auth/register"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                新規登録
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-2xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">SNS</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">@{session.user?.name}</span>
            <button
              onClick={() => signOut()}
              className="text-sm text-red-600 hover:text-red-800"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* 新規投稿フォーム */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <form onSubmit={handleCreatePost}>
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="今何してる？"
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              maxLength={280}
            />
            <div className="flex justify-between items-center mt-3">
              <span className="text-sm text-gray-500">
                {newPost.length}/280
              </span>
              <button
                type="submit"
                disabled={loading || !newPost.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '投稿中...' : '投稿'}
              </button>
            </div>
          </form>
        </div>

        {/* 投稿一覧 */}
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex justify-between items-start mb-2">
                <span className="font-medium text-gray-900">@{post.username}</span>
                <span className="text-sm text-gray-500">
                  {new Date(post.created_at).toLocaleString('ja-JP')}
                </span>
              </div>
              <p className="text-gray-800 mb-3">{post.content}</p>
              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <button
                  onClick={() => handleLike(post.id)}
                  className="flex items-center space-x-1 hover:text-red-500"
                >
                  <span>❤️</span>
                  <span>{post.like_count}</span>
                </button>
                <Link
                  href={`/posts/${post.id}`}
                  className="flex items-center space-x-1 hover:text-blue-500"
                >
                  <span>💬</span>
                  <span>{post.reply_count}</span>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {posts.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            まだ投稿がありません
          </div>
        )}
      </main>
    </div>
  );
}
