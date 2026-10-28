import { vi } from "vitest";

type Route = { method?: string; match: RegExp; status?: number; json?: unknown };

const EMPTY_PAGE = { items: [], page: 0, size: 20, total: 0 };

// Answers fetch by method and URL, first matching route wins; anything else gets an empty page.
export function mockFetch(routes: Route[]) {
  return vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    const hit = routes.find((r) => (r.method ?? "GET") === method && r.match.test(url));
    const status = hit?.status ?? 200;
    return new Response(status === 204 ? null : JSON.stringify(hit ? (hit.json ?? {}) : EMPTY_PAGE), { status });
  });
}

export const page = <T>(items: T[]) => ({ items, page: 0, size: 20, total: items.length });

export const callsTo = (spy: ReturnType<typeof mockFetch>, method: string, match: RegExp) =>
  spy.mock.calls.filter(([url, init]) => (init?.method ?? "GET") === method && match.test(String(url)));
