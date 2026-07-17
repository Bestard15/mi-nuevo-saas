"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

import { Button, type ButtonProps } from "@/components/ui/button";

/**
 * Submit button that reflects the parent form's pending state: shows a
 * spinner (and optional pending copy) and blocks double submissions. The
 * interface never feels frozen — something is always visibly happening.
 */
export function SubmitButton({
  children,
  pendingText,
  disabled,
  ...props
}: ButtonProps & { pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled} aria-busy={pending} {...props}>
      {pending ? (
        <>
          <Loader2 className="animate-spin" aria-hidden />
          {pendingText ?? children}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
