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
  const [error, setError] = useState<string | null>(null);
  
  console.log('Home コンポーネント レンダリング:', { 
    status, 
    hasSession: !!session, 
    postsType: Array.isArray(posts) ? 'array' : typeof posts,
    postsLength: Array.isArray(posts) ? posts.length : 'not array'
  });

  // 投稿を取得
  const fetchPosts = async () => {
    console.log('投稿取得開始...');
    setError(null);
    
    try {
      const response = await fetch('/api/posts');
      console.log('API レスポンス:', response.status, response.statusText);
      
      if (response.ok) {
        // レスポンスのテキストを確認してからJSONパースを試行
        const responseText = await response.text();
        console.log('生のレスポンステキスト:', responseText);
        
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('JSONパースエラー:', parseError);
          setPosts([]);
          setError('レスポンスのJSONパースに失敗しました');
          return;
        }
        
        console.log('取得データ:', {
          dataType: Array.isArray(data) ? 'array' : typeof data,
          dataLength: Array.isArray(data) ? data.length : 'not array',
          data: data
        });
        
        // エラーレスポンスの場合
        if (data.error) {
          console.error('APIエラー:', data.error, data.message);
          setPosts(data.posts || []);
          setError(`APIエラー: ${data.message || data.error}`);
          return;
        }
        
        // 確実に配列であることを保証
        if (Array.isArray(data)) {
          setPosts(data);
        } else {
          console.error('APIが配列以外を返しました:', data);
          setPosts([]);
          setError('投稿データの形式が正しくありません');
        }
      } else {
        console.error('投稿取得失敗:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('エラーレスポンス:', errorText);
        setPosts([]);
        setError(`投稿の取得に失敗しました (${response.status}): ${errorText}`);
      }
    } catch (error) {
      console.error('投稿の取得でエラー:', error);
      setPosts([]);
      setError(`投稿の取得中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
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
        let errorMessage = '投稿に失敗しました';
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch (jsonError) {
          // JSONパースエラーの場合、ステータステキストを使用
          errorMessage = `投稿に失敗しました (${response.status}: ${response.statusText})`;
        }
        alert(errorMessage);
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
      } else {
        console.error('いいね処理失敗:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('いいねエラー:', error);
    }
  };

  // 投稿削除機能
  const handleDelete = async (postId: number) => {
    if (!window.confirm('この投稿を削除しますか？')) {
      return;
    }

    try {
      const response = await fetch(`/api/posts/${postId}/delete`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        fetchPosts(); // 投稿一覧を再読み込み
        alert('投稿が削除されました');
      } else {
        let errorMessage = '削除に失敗しました';
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch (jsonError) {
          errorMessage = `削除に失敗しました (${response.status}: ${response.statusText})`;
        }
        alert(errorMessage);
      }
    } catch (error) {
      console.error('削除エラー:', error);
      alert('削除に失敗しました');
    }
  };

  useEffect(() => {
    console.log('useEffect実行:', { status, hasSession: !!session });
    
    // 読み込み中は何もしない
    if (status === 'loading') {
      console.log('セッション読み込み中...');
      return;
    }
    
    // セッションが確認できてから投稿を取得
    if (status === 'authenticated' && session) {
      console.log('セッション確認完了、投稿取得開始');
      fetchPosts();
    } else if (status === 'unauthenticated') {
      console.log('未認証のため投稿取得をスキップ');
      setPosts([]);
      setError(null);
    }
  }, [status, session]);

  // セーフティチェック：postsが配列でない場合は空配列に修正
  if (!Array.isArray(posts)) {
    console.error('posts が配列ではありません:', posts);
    setPosts([]);
  }

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

        {/* エラー表示 */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* 投稿一覧 */}
        <div className="space-y-4">
          {Array.isArray(posts) && posts.length > 0 ? (
            posts.map((post) => (
              <div key={post.id} className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium text-gray-900">@{post.username}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">
                      {new Date(post.created_at).toLocaleString('ja-JP')}
                    </span>
                    {/* 自分の投稿の場合のみ削除ボタンを表示 */}
                    {post.username === session.user?.name && (
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="text-red-500 hover:text-red-700 text-sm"
                        title="投稿を削除"
                      >
                        🗑️
                      </button>
                  )}
                </div>
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
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              {posts.length === 0 ? 'まだ投稿がありません' : '投稿を読み込んでいます...'}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
