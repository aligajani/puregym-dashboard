"use client";

import { useState } from "react";

interface Props {
  onSave: (email: string, pin: string) => void;
}

export default function CredentialsForm({ onSave }: Props) {
  const [email, setEmail] = useState("");
  const [pin, setPin]     = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !pin.trim()) return;
    localStorage.setItem("puregym_email", email.trim());
    localStorage.setItem("puregym_pin", pin.trim());
    onSave(email.trim(), pin.trim());
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8, letterSpacing: "-0.3px" }}>
          Pure<span style={{ color: "#e63946" }}>Gym</span> Dashboard
        </h1>
        <p style={{ fontSize: 14, color: "#666", marginBottom: 32 }}>
          Your credentials are stored only in your browser and never sent to any server except PureGym.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Email address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>PIN</label>
            <input
              type="password"
              value={pin}
              onChange={e => setPin(e.target.value)}
              placeholder="Your PureGym PIN"
              required
              style={inputStyle}
            />
          </div>

          <button type="submit" style={btnStyle}>
            Open Dashboard
          </button>
        </form>

        <p style={{ fontSize: 12, color: "#444", marginTop: 20, lineHeight: 1.6 }}>
          Credentials are saved to <code style={{ color: "#888" }}>localStorage</code> on this device only.
          Clear them anytime from the dashboard settings.
        </p>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: "0.8px",
  color: "#666",
  marginBottom: 8,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#1a1a1a",
  border: "1px solid #2e2e2e",
  borderRadius: 8,
  padding: "10px 14px",
  color: "#f0f0f0",
  fontSize: 14,
  outline: "none",
};

const btnStyle: React.CSSProperties = {
  width: "100%",
  background: "#e63946",
  border: "none",
  borderRadius: 8,
  padding: "12px",
  color: "#fff",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};
