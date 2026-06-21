"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function GateForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/gate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        const next = searchParams.get("next") || "/";
        router.push(next);
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Incorrect password");
      }
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        autoFocus
        required
        style={{
          width: "100%",
          padding: "0.75rem 1rem",
          fontSize: "0.9375rem",
          background: "#0a0a0a",
          border: "1px solid #262626",
          borderRadius: 8,
          color: "#fafafa",
          outline: "none",
          boxSizing: "border-box",
          marginBottom: "0.75rem",
        }}
      />
      {error && (
        <p
          style={{
            color: "#ef4444",
            fontSize: "0.8125rem",
            marginBottom: "0.75rem",
          }}
        >
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        style={{
          width: "100%",
          padding: "0.75rem",
          fontSize: "0.9375rem",
          fontWeight: 600,
          background: "#c8553d",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          cursor: loading ? "wait" : "pointer",
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? "Checking..." : "Enter"}
      </button>
    </form>
  );
}

export default function GatePage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0a0a",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          padding: "2.5rem",
          background: "#141414",
          borderRadius: 12,
          border: "1px solid #262626",
        }}
      >
        <h1
          style={{
            fontSize: "1.25rem",
            fontWeight: 600,
            color: "#fafafa",
            marginBottom: "0.5rem",
            textAlign: "center",
          }}
        >
          Site Under Testing
        </h1>
        <p
          style={{
            fontSize: "0.875rem",
            color: "#737373",
            marginBottom: "1.5rem",
            textAlign: "center",
          }}
        >
          Enter the access password to continue.
        </p>
        <Suspense>
          <GateForm />
        </Suspense>
      </div>
    </div>
  );
}
