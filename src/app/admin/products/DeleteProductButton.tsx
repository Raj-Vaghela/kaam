"use client";

import { useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { deleteProduct } from "@/app/actions";

export default function DeleteProductButton({
    productId,
    productName,
}: {
    productId: string;
    productName: string;
}) {
    const [pending, startTransition] = useTransition();
    const router = useRouter();

    const handleDelete = () => {
        if (!confirm(`Delete "${productName}"? This cannot be undone.`)) return;
        startTransition(async () => {
            const result = await deleteProduct(productId);
            if (!result.success) {
                alert("Failed to delete: " + (result.message ?? "unknown error"));
                return;
            }
            router.refresh();
        });
    };

    return (
        <button
            type="button"
            onClick={handleDelete}
            disabled={pending}
            className="p-2 text-ink-mute hover:text-rose hover:bg-rose/10 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label={`Delete ${productName}`}
        >
            {pending ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
        </button>
    );
}
