"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import RequireAuth from "@/components/RequireAuth";
import Spinner from "@/components/Spinner";
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
          <button
            onClick={logout}
            className="underline decoration-transparent transition hover:text-neutral-800 hover:decoration-current"
          >
            Switch user
          </button>
        </div>
      </div>

      {error && (
        <p className="animate-fade-in mb-6 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mb-10 flex flex-wrap items-center gap-3">
        <button
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending}
          className="flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-neutral-700 active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100"
        >
          {createMutation.isPending && <Spinner className="h-3.5 w-3.5 text-white" />}
          + New document
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadMutation.isPending}
          className="flex items-center gap-2 rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium transition-all hover:bg-neutral-50 active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100"
        >
          {uploadMutation.isPending && <Spinner className="h-3.5 w-3.5" />}
          {uploadMutation.isPending ? "Uploading…" : "Upload file"}
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
          className="hidden"
        />
        <span className="text-xs text-neutral-400">
          Supported: .{SUPPORTED_UPLOAD_EXTENSIONS.join(", .")}
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-neutral-400">
          <Spinner />
          Loading…
        </div>
      ) : (
        <div className="animate-fade-in">
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
        </div>
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
        <div className="divide-y divide-neutral-200 overflow-hidden rounded-lg border border-neutral-200">
          {children}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-neutral-200 px-4 py-6 text-center text-sm text-neutral-400">
          {empty}
        </p>
      )}
    </section>
  );
}

function DocRow({ doc, onDelete }: { doc: DocumentSummary; onDelete?: () => void }) {
  return (
    <div className="group flex items-center justify-between px-4 py-3 transition-colors hover:bg-neutral-50">
      <Link href={`/documents/${doc.id}`} className="min-w-0 flex-1">
        <div className="truncate font-medium text-neutral-900 transition-colors group-hover:text-neutral-950">
          {doc.title}
        </div>
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
          className="ml-4 shrink-0 rounded-md px-2 py-1 text-xs text-neutral-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
        >
          Delete
        </button>
      )}
    </div>
  );
}
