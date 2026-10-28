"use client";

import { useState } from "react";
import { errorMessage } from "@/lib/api";

// Wraps a form action: busy flag and a readable error.
export function useSubmit() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError(undefined);
    try {
      await fn();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return { busy, error, run };
}

export const form = (e: React.SyntheticEvent<HTMLFormElement>) => {
  e.preventDefault();
  return Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
};
