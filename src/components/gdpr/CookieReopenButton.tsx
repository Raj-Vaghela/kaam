"use client";

import { useConsent } from "@/context/ConsentContext";

/**
 * Small "Manage cookies" button for use in Footer and Privacy page.
 * Calls reopen() to show the consent banner again.
 */
export default function CookieReopenButton({
    className,
}: {
    className?: string;
}) {
    const { reopen } = useConsent();

    return (
        <button
            type="button"
            onClick={reopen}
            className={
                className ??
                "text-sm text-[#6b6355] underline underline-offset-2 hover:text-[#1a1a1a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b45309] rounded-sm transition-colors min-h-[44px] min-w-[44px] px-1"
            }
        >
            Manage cookies
        </button>
    );
}
