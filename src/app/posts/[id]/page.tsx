'use client';

import { useEffect, useState, use } from 'react';
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

  // 返信作成ハンドラー
  const handleCreateReply = async (e: React.FormEvent) => {
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
        console.log('返信作成成功 - 一覧を再取得');
        // 返信一覧を再読み込み
        const repliesResponse = await fetch(`/api/posts/${resolvedParams.id}/replies`);
        if (repliesResponse.ok) {
          const data = await repliesResponse.json();
          console.log('返信一覧再取得:', data);
          setReplies(Array.isArray(data) ? data : []);
        } else {
          console.error('返信一覧再取得失敗:', repliesResponse.status);
        }
      } else {
        let errorMessage = '返信に失敗しました';
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch (jsonError) {
          errorMessage = `返信に失敗しました (${response.status}: ${response.statusText})`;
        }
        alert(errorMessage);
      }
    } catch (error) {
      console.error('返信作成エラー:', error);
      alert('返信に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchPost = async () => {
      try {
        console.log('投稿詳細取得開始 - ID:', resolvedParams.id);
        const response = await fetch('/api/final-test');
        console.log('API response status:', response.status);
        
        if (response.ok) {
          const posts = await response.json();
          console.log('投稿詳細ページ - 取得したデータ:', posts);
          
          if (Array.isArray(posts)) {
            const currentPost = posts.find((p: Post) => p.id === parseInt(resolvedParams.id));
            console.log('見つかった投稿:', currentPost);
            setPost(currentPost || null);
          } else {
            console.error('投稿データが配列ではありません:', posts);
            setPost(null);
          }
        } else {
          console.error('投稿取得失敗:', response.status, response.statusText);
          setPost(null);
        }
      } catch (error) {
        console.error('投稿取得エラー:', error);
        setPost(null);
      }
    };

    const fetchReplies = async () => {
      try {
        console.log('返信取得開始 - 投稿ID:', resolvedParams.id);
        const response = await fetch(`/api/posts/${resolvedParams.id}/replies`);
        console.log('返信API response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('返信データ取得:', data);
          setReplies(Array.isArray(data) ? data : []);
        } else {
          console.error('返信取得失敗:', response.status, response.statusText);
          setReplies([]);
        }
      } catch (error) {
        console.error('返信取得エラー:', error);
        setReplies([]);
      }
    };

    if (resolvedParams.id) {
      fetchPost();
      fetchReplies();
    }
  }, [resolvedParams.id]); // 依存配列にresolvedParams.idを追加

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">ログインが必要です</p>
          <Link href="/auth/signin" className="text-blue-600 hover:text-blue-800 underline">
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
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
          <Link href="/" className="text-blue-600 hover:text-blue-800 mr-4">← 戻る</Link>
          <h1 className="text-xl font-bold text-gray-900">投稿詳細</h1>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex justify-between items-start mb-3">
            <span className="font-medium text-gray-900 text-lg">@{post.username}</span>
            <span className="text-sm text-gray-500">
              {new Date(post.created_at).toLocaleString('ja-JP')}
            </span>
          </div>
          <p className="text-gray-800 text-lg mb-4">{post.content}</p>
          <div className="flex items-center space-x-6 text-sm text-gray-500 border-t pt-3">
            <div className="flex items-center space-x-1">
              <span>❤️</span>
              <span>{post.like_count}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span>💬</span>
              <span>{post.reply_count}</span>
            </div>
          </div>
        </div>

        {/* 返信フォーム */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">返信を投稿</h3>
          <form onSubmit={handleCreateReply}>
            <textarea
              value={newReply}
              onChange={(e) => setNewReply(e.target.value)}
              placeholder="返信を入力してください..."
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
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">返信 ({replies.length})</h3>
          <div className="space-y-4">
            {replies.length > 0 ? (
              replies.map((reply) => (
                <div key={reply.id} className="bg-white rounded-lg shadow-sm border p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-gray-900">@{reply.username}</span>
                    <span className="text-sm text-gray-500">
                      {new Date(reply.created_at).toLocaleString('ja-JP')}
                    </span>
                  </div>
                  <p className="text-gray-800">{reply.content}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                まだ返信がありません
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
