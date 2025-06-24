'use client';

import { useEffect, useState, use, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Post {
  id: number;
  content: string;
  created_at: string;
  username: string;
  like_count: number;
  reply_count: number;
}

interface Reply {
  id: number;
  content: string;
  created_at: string;
  username: string;
}

export default function PostDetail({ params }: { params: Promise<{ id: string }> }) {
  const { data: session } = useSession();
  const router = useRouter();
  const resolvedParams = use(params);
  const [post, setPost] = useState<Post | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [newReply, setNewReply] = useState('');
  const [loading, setLoading] = useState(false);

  // 投稿を取得
  const fetchPost = useCallback(async () => {
    try {
      const response = await fetch('/api/posts');
      if (response.ok) {
        const posts = await response.json();
        const currentPost = posts.find((p: Post) => p.id === parseInt(resolvedParams.id));
        setPost(currentPost || null);
      }
    } catch (error) {
      console.error('投稿取得エラー:', error);
    }
  }, [resolvedParams.id]);

  const fetchReplies = useCallback(async () => {
    try {
      const response = await fetch(`/api/posts/${resolvedParams.id}/replies`);
      if (response.ok) {
        const data = await response.json();
        setReplies(data);
      }
    } catch (error) {
      console.error('返信取得エラー:', error);
    }
  }, [resolvedParams.id]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReply.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/posts/${resolvedParams.id}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newReply }),
      });

      if (response.ok) {
        setNewReply('');
        fetchReplies();
        fetchPost(); // 返信数を更新
      } else {
        const error = await response.json();
        alert(error.error || '返信に失敗しました');
      }
    } catch (error) {
      console.error('返信エラー:', error);
      alert('返信に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!post) return;
    
    try {
      const response = await fetch(`/api/posts/${post.id}/like`, {
        method: 'POST',
      });
      
      if (response.ok) {
        fetchPost(); // いいね数を更新
      }
    } catch (error) {
      console.error('いいねエラー:', error);
    }
  };

  // 投稿削除機能
  const handleDelete = async () => {
    if (!post || !window.confirm('この投稿を削除しますか？')) {
      return;
    }

    try {
      const response = await fetch(`/api/posts/${post.id}/delete`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        alert('投稿が削除されました');
        router.push('/'); // メインページにリダイレクト
      } else {
        const error = await response.json();
        alert(error.error || '削除に失敗しました');
      }
    } catch (error) {
      console.error('削除エラー:', error);
      alert('削除に失敗しました');
    }
  };

  useEffect(() => {
    fetchPost();
    fetchReplies();
  }, [fetchPost, fetchReplies]);

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">ログインが必要です</p>
          <Link
            href="/auth/signin"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            ログインページへ
          </Link>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">投稿が見つかりません</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
          <Link href="/" className="text-blue-600 hover:text-blue-800 mr-4">
            ← 戻る
          </Link>
          <h1 className="text-xl font-bold text-gray-900">投稿詳細</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* 元の投稿 */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex justify-between items-start mb-3">
            <span className="font-medium text-gray-900 text-lg">@{post.username}</span>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                {new Date(post.created_at).toLocaleString('ja-JP')}
              </span>
              {/* 自分の投稿の場合のみ削除ボタンを表示 */}
              {post.username === session?.user?.name && (
                <button
                  onClick={handleDelete}
                  className="text-red-500 hover:text-red-700 text-sm"
                  title="投稿を削除"
                >
                  🗑️
                </button>
              )}
            </div>
          </div>
          <p className="text-gray-800 text-lg mb-4">{post.content}</p>
          <div className="flex items-center space-x-6 text-sm text-gray-500 border-t pt-3">
            <button
              onClick={handleLike}
              className="flex items-center space-x-1 hover:text-red-500"
            >
              <span>❤️</span>
              <span>{post.like_count}</span>
            </button>
            <div className="flex items-center space-x-1">
              <span>💬</span>
              <span>{post.reply_count}</span>
            </div>
          </div>
        </div>

        {/* 返信フォーム */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <form onSubmit={handleReply}>
            <textarea
              value={newReply}
              onChange={(e) => setNewReply(e.target.value)}
              placeholder="返信を書く..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              maxLength={280}
            />
            <div className="flex justify-between items-center mt-3">
              <span className="text-sm text-gray-500">
                {newReply.length}/280
              </span>
              <button
                type="submit"
                disabled={loading || !newReply.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '返信中...' : '返信'}
              </button>
            </div>
          </form>
        </div>

        {/* 返信一覧 */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-gray-900">返信</h2>
          {replies.map((reply) => (
            <div key={reply.id} className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex justify-between items-start mb-2">
                <span className="font-medium text-gray-900">@{reply.username}</span>
                <span className="text-sm text-gray-500">
                  {new Date(reply.created_at).toLocaleString('ja-JP')}
                </span>
              </div>
              <p className="text-gray-800">{reply.content}</p>
            </div>
          ))}
          
          {replies.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              まだ返信がありません
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
