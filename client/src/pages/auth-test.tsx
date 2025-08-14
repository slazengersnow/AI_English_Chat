import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function AuthTest() {
  const [email, setEmail] = useState("slazengersnow@gmail.com");
  const [password, setPassword] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function testLogin() {
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      setResult({ success: true, data, error });
    } catch (e: any) {
      setResult({ success: false, error: e.message });
    } finally {
      setLoading(false);
    }
  }

  async function testSignup() {
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth-callback` }
      });
      setResult({ success: true, data, error, action: 'signup' });
    } catch (e: any) {
      setResult({ success: false, error: e.message, action: 'signup' });
    } finally {
      setLoading(false);
    }
  }

  async function getCurrentSession() {
    const { data } = await supabase.auth.getSession();
    setResult({ session: data.session });
  }

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", padding: 24 }}>
      <h1>Auth Test Page</h1>
      <div style={{ marginBottom: 16 }}>
        <input 
          value={email} 
          onChange={e => setEmail(e.target.value)} 
          placeholder="Email" 
          type="email" 
          style={{ width: "100%", padding: 8, marginBottom: 8 }}
        />
        <input 
          value={password} 
          onChange={e => setPassword(e.target.value)} 
          placeholder="Password" 
          type="password" 
          style={{ width: "100%", padding: 8 }}
        />
      </div>
      
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <button onClick={testLogin} disabled={loading}>Test Login</button>
        <button onClick={testSignup} disabled={loading}>Test Signup</button>
        <button onClick={getCurrentSession}>Get Session</button>
      </div>

      {result && (
        <div style={{ background: "#f5f5f5", padding: 16, marginTop: 16 }}>
          <h3>Result:</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}

      <div style={{ marginTop: 20, fontSize: "12px" }}>
        <h4>Debug Info:</h4>
        <pre>{JSON.stringify((window as any).SUPA_DEBUG, null, 2)}</pre>
      </div>
    </div>
  );
}