import { NextRequest, NextResponse } from 'next/server';
import DatabaseManager from '@/lib/database';

export async function GET(request: NextRequest) {
  // 本番環境では無効化（セキュリティのため）
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Debug endpoint disabled in production' },
      { status: 403 }
    );
  }

  try {
    console.log('=== データベース接続テスト開始 ===');
    
    const db = DatabaseManager.getInstance();
    console.log('データベースインスタンス取得完了');

    // 簡単なテストクエリ
    const testResult = await db.get('SELECT 1 as test');
    console.log('テストクエリ結果:', testResult);

    // ユーザーテーブルの存在確認（PostgreSQL用）
    let tableExists = false;
    try {
      const tableCheck = await db.get(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      `);
      tableExists = !!tableCheck;
      console.log('usersテーブル存在確認:', tableExists);
    } catch (error) {
      console.log('テーブル存在確認エラー (SQLiteかも):', error);
      // SQLiteの場合の確認
      try {
        const sqliteCheck = await db.get(`
          SELECT name FROM sqlite_master 
          WHERE type='table' AND name='users'
        `);
        tableExists = !!sqliteCheck;
        console.log('SQLite usersテーブル存在確認:', tableExists);
      } catch (sqliteError) {
        console.log('SQLiteテーブル確認もエラー:', sqliteError);
      }
    }

    const result = {
      success: true,
      testQuery: testResult,
      usersTableExists: tableExists,
      timestamp: new Date().toISOString()
    };

    console.log('=== データベース接続テスト完了 ===', result);
    return NextResponse.json(result);

  } catch (error) {
    console.error('データベース接続テストエラー:', error);
    console.error('エラー詳細:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
