"use client";

import { Download } from "lucide-react";
import { Button } from "@tthome/ui";
import { toCsv } from "@/lib/filters";

/** Downloads the table as a CSV that Excel opens with Vietnamese text intact. */
export function ExportButton({ rows, filename }: { rows: (string | number)[][]; filename: string }) {
  return (
    <Button
      size="sm"
      variant="secondary"
      onClick={() => {
        const url = URL.createObjectURL(new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" }));
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      }}
    >
      <Download aria-hidden />
      Xuất Excel
    </Button>
  );
}
