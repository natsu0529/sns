/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
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

  useEffect(() => {
    const fetchPost = async () => {
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
    };

    const fetchReplies = async () => {
      try {
        const response = await fetch(`/api/posts/${resolvedParams.id}/replies`);
        if (response.ok) {
          const data = await response.json();
          setReplies(data);
        }
      } catch (error) {
        console.error('返信取得エラー:', error);
      }
    };

    fetchPost();
    fetchReplies();
  }, [resolvedParams.id]); // eslint-disable-line react-hooks/exhaustive-deps

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
      </main>
    </div>
  );
}
