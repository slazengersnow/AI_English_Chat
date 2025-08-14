import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function SignupSimple() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [out, setOut] = useState<any>(null);

  async function onSignup() {
    if (!email || !password) {
      setOut({ error: { message: "メールアドレスとパスワードを入力してください" } });
      return;
    }

    setLoading(true);
    console.log('[SignupSimple] start', { email });
    
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });
    
    console.log('[SignupSimple] resp', { data, error });
    setOut({ data, error });

    if (error) {
      // 既存メール時のエラー処理
      if (String(error.message).toLowerCase().includes("already") || error.status === 422) {
        setOut({ error: { message: "このメールアドレスは既に登録されています。ログインをお試しください。" } });
      } else {
        setOut({ error });
      }
      setLoading(false);
      return;
    }

    if (data.user) {
      // メール確認が必要な場合
      if (!data.session) {
        setOut({ 
          data: { 
            message: "確認メールを送信しました。メール内のリンクをクリックして登録を完了してください。", 
            user: data.user 
          } 
        });
        setLoading(false);
        return;
      }

      // セッションがある場合はプラン選択画面へ
      window.location.href = "/subscription-select";
    }
    setLoading(false);
  }

  // @ts-expect-error
  const dbg = window.SUPA_DEBUG;

  return (
    <div style={{maxWidth:480, margin:'40px auto', fontFamily:'sans-serif', backgroundColor: '#e7effe', minHeight: '100vh', padding: '40px 20px'}}>
      <div style={{backgroundColor: 'white', padding: '32px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)'}}>
        <h1 style={{textAlign: 'center', marginBottom: '24px', color: '#333'}}>新規登録</h1>
        <p style={{textAlign: 'center', marginBottom: '24px', color: '#666'}}>AI英作文チャットで英語力を向上させましょう</p>
        
        {dbg && (
          <div style={{marginBottom: '16px', fontSize: '12px', color: '#888'}}>
            <p>VITE URL: <code>{dbg?.url}</code></p>
            <p>VITE ANON(head): <code>{dbg?.anonHead}</code></p>
          </div>
        )}
        
        <div style={{display:'grid', gap:16}}>
          <div>
            <label style={{display: 'block', marginBottom: '4px', fontWeight: '500'}}>メールアドレス</label>
            <input 
              value={email} 
              onChange={e=>setEmail(e.target.value)} 
              placeholder="example@email.com" 
              type="email"
              style={{width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px'}}
            />
          </div>
          <div>
            <label style={{display: 'block', marginBottom: '4px', fontWeight: '500'}}>パスワード</label>
            <input 
              value={password} 
              onChange={e=>setPassword(e.target.value)} 
              placeholder="8文字以上" 
              type="password"
              style={{width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px'}}
            />
          </div>
          <button 
            onClick={onSignup}
            disabled={loading}
            style={{
              width: '100%', 
              padding: '12px', 
              backgroundColor: loading ? '#ccc' : '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '登録中...' : '新規登録'}
          </button>
        </div>
        
        {out && (
          <div style={{marginTop: '16px', padding: '12px', borderRadius: '4px', backgroundColor: out.error ? '#fee' : '#efe'}}>
            {out.error ? (
              <p style={{color: '#c33', margin: 0}}>{out.error.message}</p>
            ) : out.data?.message ? (
              <p style={{color: '#393', margin: 0}}>{out.data.message}</p>
            ) : (
              <pre style={{whiteSpace:'pre-wrap', fontSize: '12px', margin: 0}}>
                {JSON.stringify(out, null, 2)}
              </pre>
            )}
          </div>
        )}
        
        <div style={{textAlign: 'center', marginTop: '24px'}}>
          <p style={{color: '#666', fontSize: '14px'}}>
            既にアカウントをお持ちの方は <a href="/login" style={{color: '#007bff'}}>ログイン</a>
          </p>
        </div>
      </div>
    </div>
  );
}