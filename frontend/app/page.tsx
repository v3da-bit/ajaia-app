"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import RequireAuth from "@/components/RequireAuth";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, ApiError } from "@/lib/api";

type DocumentSummary = {
  id: number;
  title: string;
  ownerId: number;
  ownerName: string;
  isOwner: boolean;
  updatedAt: string;
};

const SUPPORTED_UPLOAD_EXTENSIONS = ["txt", "md"];

export default function DashboardPage() {
  return (
    <RequireAuth>
      <Dashboard />
    </RequireAuth>
  );
}

function Dashboard() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: () => apiFetch<DocumentSummary[]>("/documents"),
  });

  const createMutation = useMutation({
    mutationFn: () => apiFetch<{ id: number }>("/documents", { method: "POST", body: "{}" }),
    onSuccess: (doc) => {
      window.location.href = `/documents/${doc.id}`;
    },
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append("file", file);
      return apiFetch<{ id: number }>("/documents/upload", { method: "POST", body: form });
    },
    onSuccess: (doc) => {
      window.location.href = `/documents/${doc.id}`;
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "Upload failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/documents/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["documents"] }),
  });

  const owned = docs.filter((d) => d.isOwner);
  const shared = docs.filter((d) => !d.isOwner);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Docs</h1>
        <div className="flex items-center gap-3 text-sm text-neutral-500">
          <span>
            Signed in as <strong className="text-neutral-800">{user?.name}</strong>
          </span>
          <button onClick={logout} className="underline hover:text-neutral-800">
            Switch user
          </button>
        </div>
      </div>

      {error && (
        <p className="mb-6 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="mb-10 flex flex-wrap items-center gap-3">
        <button
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
        >
          + New document
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.md"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setError(null);
              uploadMutation.mutate(file);
            }
          }}
          className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-100 file:px-3 file:py-2 file:text-sm hover:file:bg-neutral-200"
        />
        <span className="text-xs text-neutral-400">
          Supported: .{SUPPORTED_UPLOAD_EXTENSIONS.join(", .")}
        </span>
      </div>

      {isLoading ? (
        <p className="text-sm text-neutral-400">Loading…</p>
      ) : (
        <>
          <Section title="Owned by me" empty="No documents yet — create or upload one above.">
            {owned.map((d) => (
              <DocRow key={d.id} doc={d} onDelete={() => deleteMutation.mutate(d.id)} />
            ))}
          </Section>

          <Section title="Shared with me" empty="Nothing has been shared with you yet.">
            {shared.map((d) => (
              <DocRow key={d.id} doc={d} />
            ))}
          </Section>
        </>
      )}
    </main>
  );
}

function Section({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: React.ReactNode;
}) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : !!children;
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
        {title}
      </h2>
      {hasChildren ? (
        <div className="divide-y divide-neutral-200 rounded-lg border border-neutral-200">
          {children}
        </div>
      ) : (
        <p className="text-sm text-neutral-400">{empty}</p>
      )}
    </section>
  );
}

function DocRow({ doc, onDelete }: { doc: DocumentSummary; onDelete?: () => void }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <Link href={`/documents/${doc.id}`} className="min-w-0 flex-1">
        <div className="truncate font-medium text-neutral-900">{doc.title}</div>
        <div className="text-xs text-neutral-500">
          {doc.isOwner ? "Owned by you" : `Shared by ${doc.ownerName}`} · Updated{" "}
          {new Date(doc.updatedAt).toLocaleString()}
        </div>
      </Link>
      {onDelete && (
        <button
          onClick={(e) => {
            e.preventDefault();
            onDelete();
          }}
          className="ml-4 text-xs text-neutral-400 hover:text-red-600"
        >
          Delete
        </button>
      )}
    </div>
  );
}
