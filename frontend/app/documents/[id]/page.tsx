"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import RequireAuth from "@/components/RequireAuth";
import DocEditor from "@/components/Editor";
import { apiFetch, ApiError } from "@/lib/api";

type DocumentDetail = {
  id: number;
  title: string;
  content: string;
  ownerId: number;
  ownerName: string;
  isOwner: boolean;
  updatedAt: string;
};

type ShareUser = { id: number; name: string; email: string };

export default function DocumentPage() {
  return (
    <RequireAuth>
      <DocumentEditorPage />
    </RequireAuth>
  );
}

function DocumentEditorPage() {
  const { id } = useParams<{ id: string }>();
  const documentId = Number(id);
  const queryClient = useQueryClient();

  const { data: doc, isLoading, error } = useQuery({
    queryKey: ["documents", documentId],
    queryFn: () => apiFetch<DocumentDetail>(`/documents/${documentId}`),
    retry: false,
  });

  const saveMutation = useMutation({
    mutationFn: (data: { title?: string; content?: string }) =>
      apiFetch(`/documents/${documentId}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["documents"] }),
  });

  if (isLoading) return <main className="mx-auto max-w-3xl px-4 py-10 text-sm text-neutral-400">Loading…</main>;

  if (error || !doc) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-sm text-red-600">
          {error instanceof ApiError ? error.message : "Document not found"}
        </p>
        <Link href="/" className="mt-4 inline-block text-sm underline">
          Back to My Docs
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="text-sm text-neutral-500 hover:underline">
          ← My Docs
        </Link>
        {doc.isOwner ? <ShareControl documentId={documentId} /> : (
          <span className="text-xs text-neutral-500">Shared by {doc.ownerName} · view &amp; edit access</span>
        )}
      </div>

      <TitleField
        title={doc.title}
        editable={doc.isOwner}
        onSave={(title) => saveMutation.mutate({ title })}
      />

      <div className="mt-6">
        <DocEditor
          key={doc.id}
          initialContent={doc.content}
          editable
          onSave={async (content) => {
            await saveMutation.mutateAsync({ content });
          }}
        />
      </div>
    </main>
  );
}

function TitleField({
  title,
  editable,
  onSave,
}: {
  title: string;
  editable: boolean;
  onSave: (title: string) => void;
}) {
  const [value, setValue] = useState(title);

  useEffect(() => setValue(title), [title]);

  if (!editable) {
    return <h1 className="text-2xl font-semibold">{title}</h1>;
  }

  return (
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => value.trim() && value !== title && onSave(value.trim())}
      className="w-full rounded-lg border border-transparent px-2 py-1 text-2xl font-semibold hover:border-neutral-200 focus:border-neutral-300 focus:outline-none"
    />
  );
}

function ShareControl({ documentId }: { documentId: number }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: shares = [] } = useQuery({
    queryKey: ["documents", documentId, "shares"],
    queryFn: () => apiFetch<ShareUser[]>(`/documents/${documentId}/shares`),
    enabled: open,
  });

  const shareMutation = useMutation({
    mutationFn: (email: string) =>
      apiFetch<ShareUser[]>(`/documents/${documentId}/shares`, {
        method: "POST",
        body: JSON.stringify({ email }),
      }),
    onSuccess: () => {
      setEmail("");
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["documents", documentId, "shares"] });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "Couldn't share"),
  });

  const unshareMutation = useMutation({
    mutationFn: (userId: number) =>
      apiFetch(`/documents/${documentId}/shares/${userId}`, { method: "DELETE" }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["documents", documentId, "shares"] }),
  });

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50"
      >
        Share
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-2 w-72 rounded-lg border border-neutral-200 bg-white p-4 shadow-lg">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (email.trim()) shareMutation.mutate(email.trim());
            }}
            className="flex gap-2"
          >
            <input
              type="email"
              required
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="min-w-0 flex-1 rounded-md border border-neutral-300 px-2 py-1 text-sm"
            />
            <button
              type="submit"
              disabled={shareMutation.isPending}
              className="rounded-md bg-neutral-900 px-3 py-1 text-sm text-white disabled:opacity-50"
            >
              Add
            </button>
          </form>
          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

          <ul className="mt-3 flex flex-col gap-1.5">
            {shares.length === 0 && (
              <li className="text-xs text-neutral-400">Not shared with anyone yet.</li>
            )}
            {shares.map((u) => (
              <li key={u.id} className="flex items-center justify-between text-sm">
                <span>
                  {u.name} <span className="text-neutral-400">({u.email})</span>
                </span>
                <button
                  onClick={() => unshareMutation.mutate(u.id)}
                  className="text-xs text-neutral-400 hover:text-red-600"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
