"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

import client from "../../lib/client";

type AuthMeta = { configured: boolean; reason?: string };

export default function LoginPage() {
  const r = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  const [serverMsg, setServerMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const meta = await client.get<AuthMeta>("/auth/meta");
        if (!meta.configured) {
          setServerMsg(meta.reason || "ADMIN_EMAIL not set on server");
        }
      } catch {}
    })();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const { token } = await client.post<{ token: string }>("/auth/login", {
        email,
        password,
      });
      localStorage.setItem("admin_token", token);
      document.cookie = `admin_token=${token}; Path=/; Max-Age=604800; SameSite=Lax`;
      r.replace("/");
    } catch (e: any) {
      setErr(e?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
     <img src="/launchalot-logo.png" alt="logo" width={120} className="absolute top-2 left-6" />
    <div className="min-h-screen flex items-center justify-center bg-gray-400 p-6">

   

      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-xl bg-[#55B7BA] p-6 shadow-lg space-y-4"
      >
        <h1 className="text-xl font-semibold">Admin Login</h1>

        <label className="block">
          <div className="text-sm mb-1">Email</div>
          <input
            type="email"
            autoComplete="username"
            className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label className="block">
          <div className="text-sm mb-1">Password</div>
          <div className="relative">
            <input
              type={showPwd ? "text" : "password"}
              autoComplete="current-password"
              className="w-full rounded-md border px-3 py-2 pr-10 outline-none focus:ring-2 focus:ring-blue-200"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPwd((s) => !s)}
              aria-label={showPwd ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPwd ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </label>

        {serverMsg && <div className="text-sm text-red-600">{serverMsg}</div>}
        {err && <div className="text-sm text-red-600">{err}</div>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-[#1aa1e5] py-2 font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
    </>
    
  );
}
