"use client";
import { useState } from "react";

export default function RegisterPage() {
  const [form, setForm] = useState({ email: "", password: "", fullName: "", role: "buyer" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      localStorage.setItem("access_token", data.accessToken);
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = { width: "100%", background: "#080C14", border: "1px solid rgba(255,107,53,0.2)", borderRadius: 4, padding: "12px 14px", color: "#E8EBF0", fontSize: 14, outline: "none", fontFamily: "monospace" };
  const labelStyle = { display: "block" as const, fontFamily: "monospace", fontSize: 10, color: "rgba(255,107,53,0.7)", letterSpacing: "0.15em", textTransform: "uppercase" as const, marginBottom: 6 };

  return (
    <div style={{ minHeight: "100vh", background: "#080C14", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 400, background: "#0D1220", border: "1px solid rgba(255,107,53,0.2)", borderRadius: 8, padding: 40 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>✈</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#E8EBF0", fontFamily: "Georgia, serif" }}>SouqPilot</h1>
          <p style={{ color: "rgba(232,235,240,0.4)", fontSize: 13, fontFamily: "monospace", letterSpacing: "0.1em" }}>CREATE ACCOUNT</p>
        </div>
        {error && <div style={{ background: "rgba(255,107,53,0.1)", border: "1px solid rgba(255,107,53,0.3)", borderRadius: 4, padding: "10px 14px", marginBottom: 20, color: "#FF6B35", fontSize: 13, fontFamily: "monospace" }}>{error}</div>}
        <form onSubmit={handleRegister}>
          {[
            { key: "fullName", label: "Full Name", type: "text" },
            { key: "email", label: "Email", type: "email" },
            { key: "password", label: "Password", type: "password" },
          ].map(({ key, label, type }) => (
            <div key={key} style={{ marginBottom: 16 }}>
              <label style={labelStyle}>{label}</label>
              <input type={type} value={(form as Record<string, string>)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} required style={inputStyle} />
            </div>
          ))}
          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>Account Type</label>
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              style={{ ...inputStyle, cursor: "pointer" }}>
              <option value="buyer">Buyer</option>
              <option value="seller">Seller</option>
            </select>
          </div>
          <button type="submit" disabled={loading}
            style={{ width: "100%", background: "linear-gradient(135deg, #FF6B35, #E85A20)", color: "#fff", border: "none", borderRadius: 4, padding: "14px", fontFamily: "monospace", fontSize: 12, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer" }}>
            {loading ? "CREATING ACCOUNT..." : "JOIN SOUQPILOT →"}
          </button>
        </form>
        <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "rgba(232,235,240,0.4)", fontFamily: "monospace" }}>
          Have an account? <a href="/login" style={{ color: "#FF6B35", textDecoration: "none" }}>Login</a>
        </p>
      </div>
    </div>
  );
}
