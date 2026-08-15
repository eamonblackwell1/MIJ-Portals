"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PasswordGate({ slug }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, password }),
      });

      if (res.ok) {
        // Cookie is set by the server; re-render the page as signed in.
        router.refresh();
      } else {
        setError("Incorrect password. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      fontFamily: "'Sen',sans-serif",
      background: "#1a1a1a",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 24px",
    }}>
      <div style={{ maxWidth: 420, width: "100%", textAlign: "center" }}>
        {/* Wordmark */}
        <div style={{ fontSize: 11, letterSpacing: 4, textTransform: "uppercase", color: "#B8977E", marginBottom: 40 }}>
          Married in Japan
        </div>

        {/* Accent line */}
        <div style={{ width: 40, height: 2, background: "#B8977E", margin: "0 auto 40px" }} />

        <h1 style={{
          fontFamily: "'Cormorant Garamond',serif",
          fontSize: "clamp(32px,5vw,48px)",
          fontWeight: 300,
          color: "#FAF8F5",
          margin: "0 0 12px",
          lineHeight: 1.1,
        }}>
          Your Planning Dashboard
        </h1>
        <p style={{ fontSize: 14, color: "rgba(250,248,245,0.4)", marginBottom: 48, lineHeight: 1.7 }}>
          Enter your password to access your wedding planning portal.
        </p>

        <form onSubmit={handleSubmit} style={{ textAlign: "left" }}>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
            style={{
              width: "100%",
              fontFamily: "'Sen',sans-serif",
              fontSize: 14,
              background: "rgba(250,248,245,0.05)",
              border: "1px solid rgba(250,248,245,0.12)",
              borderRadius: 0,
              color: "#FAF8F5",
              padding: "14px 18px",
              outline: "none",
              boxSizing: "border-box",
              marginBottom: error ? 12 : 20,
              transition: "border-color 0.2s",
            }}
            onFocus={e => (e.currentTarget.style.borderColor = "#B8977E")}
            onBlur={e => (e.currentTarget.style.borderColor = "rgba(250,248,245,0.12)")}
          />

          {error && (
            <div style={{ fontSize: 13, color: "#c97a7a", marginBottom: 16, lineHeight: 1.5 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            style={{
              width: "100%",
              fontFamily: "'Sen',sans-serif",
              fontSize: 12,
              letterSpacing: 3,
              textTransform: "uppercase",
              background: loading || !password ? "rgba(184,151,126,0.4)" : "#B8977E",
              color: "#1a1a1a",
              border: "none",
              padding: "14px 20px",
              cursor: loading || !password ? "default" : "pointer",
              transition: "background 0.2s",
              fontWeight: 700,
            }}
          >
            {loading ? "Checking..." : "Enter"}
          </button>
        </form>
      </div>

      {/* Footer */}
      <div style={{ position: "absolute", bottom: 32, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "rgba(250,248,245,0.15)" }}>
        Married in Japan · Planning Portal
      </div>
    </div>
  );
}
