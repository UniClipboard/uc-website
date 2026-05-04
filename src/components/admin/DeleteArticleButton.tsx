"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function DeleteArticleButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      className="text-red-500 hover:text-red-400 disabled:opacity-50"
      onClick={() => {
        if (!confirm("Delete this article? This cannot be undone.")) return;
        startTransition(async () => {
          const res = await fetch(`/api/admin/articles/${id}`, {
            method: "DELETE",
          });
          if (!res.ok) {
            alert(`Delete failed: ${await res.text()}`);
            return;
          }
          router.refresh();
        });
      }}
    >
      {pending ? "Deleting..." : "Delete"}
    </button>
  );
}
