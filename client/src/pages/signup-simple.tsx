import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function SignupSimple() {
  const [email, setEmail] = useState('slazengersnow@gmail.com');
  const [password, setPassword] = useState('');
  const [result, setResult] = useState<any>(null);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    console.log('[SignupSimple] start', { email });
    const { data, error } = await supabase.auth.signUp({ email, password });
    console.log('[SignupSimple] response', { data, error });
    setResult({ data, error });
  }

  return (
    <div style={{ maxWidth: 420, margin: '40px auto', fontFamily: 'system-ui' }}>
      <h2>Signup Simple (Debug)</h2>
      <form onSubmit={handleSignup}>
        <div style={{ margin: '12px 0' }}>
          <label>email</label>
          <input value={email} onChange={e=>setEmail(e.target.value)} style={{ width:'100%' }} />
        </div>
        <div style={{ margin: '12px 0' }}>
          <label>password</label>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} style={{ width:'100%' }} />
        </div>
        <button type="submit">Sign up</button>
      </form>
      <pre style={{ background:'#f6f8fa', padding:12, marginTop:16 }}>
        {result ? JSON.stringify(result, null, 2) : '結果はここに表示されます'}
      </pre>
    </div>
  );
}