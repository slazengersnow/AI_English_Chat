import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function SignupSimple() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [log, setLog] = useState<string>('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLog('Signing up...');

    const { data, error } = await supabase.auth.signUp({ email, password });

    console.log('[SignupSimple] result:', { data, error });
    setLog(JSON.stringify({ data, error }, null, 2));
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Signup Simple</h1>
      <form onSubmit={onSubmit}>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="email" />
        <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="password" type="password" />
        <button type="submit">Sign up</button>
      </form>
      <pre style={{ background: '#f5f5f5', padding: '10px', marginTop: '10px', whiteSpace: 'pre-wrap' }}>{log}</pre>
    </div>
  );
}