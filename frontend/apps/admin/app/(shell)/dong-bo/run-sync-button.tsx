"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button, cn } from "@tthome/ui";
import { Toast } from "@/components/interactive";

export function RunSyncButton() {
  const [running, setRunning] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  return (
    <>
      <Button
        size="sm"
        disabled={running}
        onClick={() => {
          setRunning(true);
          setTimeout(() => {
            setRunning(false);
            setToast("Đã kéo xong thay đổi từ Meey CRM");
          }, 1400);
        }}
      >
        <RefreshCw aria-hidden className={cn(running && "animate-spin")} />
        {running ? "Đang đồng bộ" : "Đồng bộ ngay"}
      </Button>
      <Toast message={toast} onDone={() => setToast(null)} />
    </>
  );
}
