"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";
import Spinner from "@/components/Spinner";
import { useToast } from "@/components/Toast";

const SEEDED_USERS = [
  { name: "Alice", email: "alice@example.com" },
  { name: "Bob", email: "bob@example.com" },
  { name: "Carol", email: "carol@example.com" },
];
const SEED_PASSWORD = "password123";

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const router = useRouter();
  const showToast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/");
  }, [loading, user, router]);

  if (loading || user) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      showToast("Signed in");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Something went wrong";
      setError(message);
      showToast(message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4">
      <div>
        <h1 className="text-2xl font-semibold">Docs</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Sign in with a seeded demo account. Password for all: <code>{SEED_PASSWORD}</code>
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {SEEDED_USERS.map((u) => (
          <button
            key={u.email}
            type="button"
            onClick={() => {
              setEmail(u.email);
              setPassword(SEED_PASSWORD);
            }}
            className={`w-full rounded-lg border px-4 py-3 text-left transition-all active:scale-[0.98] ${
              email === u.email
                ? "border-neutral-900 bg-neutral-50 ring-1 ring-neutral-900"
                : "border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50"
            }`}
          >
            <div className="font-medium">{u.name}</div>
            <div className="text-sm text-neutral-500">{u.email}</div>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 border-t border-neutral-200 pt-6">
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm transition-shadow focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-200"
        />
        <input
          type="password"
          required
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm transition-shadow focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-200"
        />
        {error && <p className="animate-fade-in text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-neutral-700 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
        >
          {submitting && <Spinner className="h-3.5 w-3.5 text-white" />}
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
