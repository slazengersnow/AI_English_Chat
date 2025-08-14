import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function SignupSimple() {
  const [email, setEmail] = useState('slazengersnow@gmail.com');
  const [password, setPassword] = useState('StrongPass#1');
  const [out, setOut] = useState<any>(null);

  async function onSignup() {
    console.log('[SignupSimple] start', { email });
    const { data, error } = await supabase.auth.signUp({ email, password });
    console.log('[SignupSimple] resp', { data, error });
    setOut({ data, error });

    if (!error) {
      // Confirm email OFF 前提なら即ログインを強制
      await supabase.auth.signInWithPassword({ email, password });

      // セッションを握るまで待つ
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        window.location.href = "/"; // ホームへ
      } else {
        // 予防的に 300ms 後にもう一度確認（環境によって遅延する場合あり）
        setTimeout(async () => {
          const { data: d2 } = await supabase.auth.getSession();
          if (d2.session) window.location.href = "/";
        }, 300);
      }
    }
  }

  // @ts-expect-error
  const dbg = window.SUPA_DEBUG;

  return (
    <div style={{maxWidth:480, margin:'40px auto', fontFamily:'sans-serif'}}>
      <h1>Signup Simple (Debug)</h1>
      <p>VITE URL: <code>{dbg?.url}</code></p>
      <p>VITE ANON(head): <code>{dbg?.anonHead}</code></p>
      <div style={{display:'grid', gap:8}}>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="email" />
        <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="password" type="password" />
        <button onClick={onSignup}>Sign up</button>
      </div>
      <pre style={{whiteSpace:'pre-wrap', background:'#f6f6f6', padding:12, marginTop:16}}>
        {out ? JSON.stringify(out, null, 2) : 'no response yet'}
      </pre>
    </div>
  );
}