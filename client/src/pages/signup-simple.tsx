import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[signup] start", { email });

    if (!email || !password) {
      setMsg("メールとパスワードを入力してください");
      return;
    }

    const { data, error } = await supabase.auth.signUp({ email, password });
    console.log("[signup] response", { data, error });

    if (error) {
      setMsg(error.message);
      return;
    }

    // すぐに session が生えない環境もあるので、2段階で確認
    const s1 = await supabase.auth.getSession();
    console.log("[signup] session-now", s1);
    setTimeout(async () => {
      const s2 = await supabase.auth.getSession();
      console.log("[signup] session-after-200ms", s2);
      if (s2.data.session) {
        location.href = "/";
      } else {
        setMsg("確認メールを送信しました。受信後にログインしてください。");
      }
    }, 200);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>新規登録</h2>
      <form onSubmit={onSubmit}>
        <div style={{ marginBottom: "10px" }}>
          <input 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            placeholder="email"
            style={{ padding: "8px", width: "200px" }}
          />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <input 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            placeholder="password"
            style={{ padding: "8px", width: "200px" }}
          />
        </div>
        <button type="submit" style={{ padding: "8px 16px" }}>Create account</button>
        <p>{msg}</p>
      </form>
    </div>
  );
}