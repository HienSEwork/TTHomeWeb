import { ApiError } from "@/lib/api";

// Saves the Excel report of a period. The proxy keeps Content-Disposition, so the server names the file.
export async function downloadExcel(query: string) {
  const res = await fetch(`/api/admin/reports/overview.xlsx?${query}`);
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { code?: string };
    throw new ApiError(res.status, err.code ?? "UNKNOWN");
  }
  const name = /filename="?([^";]+)"?/.exec(res.headers.get("Content-Disposition") ?? "")?.[1] ?? "report.xlsx";
  const url = URL.createObjectURL(await res.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}
