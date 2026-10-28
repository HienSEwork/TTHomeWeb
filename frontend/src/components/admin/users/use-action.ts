"use client";

import { useState } from "react";
import { actionError } from "./model";

// Runs one mutation: busy flag, readable error, and whether it succeeded.
export function useAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  async function run(fn: () => Promise<void>): Promise<boolean> {
    setBusy(true);
    setError(undefined);
    try {
      await fn();
      return true;
    } catch (e) {
      setError(actionError(e));
      return false;
    } finally {
      setBusy(false);
    }
  }
  return { busy, error, run };
}
