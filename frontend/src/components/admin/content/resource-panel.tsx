"use client";

import { useId, useState } from "react";
import { adminApi, useAdminQuery } from "@/lib/admin-api";
import { Button, Field, Notice, Tabs, TextButton } from "@/components/ui";
import { useSubmit } from "@/components/use-submit";
import { Column, DataTable, Modal, PageHeader } from "@/components/admin/parts";

// A resource is described once; the panel turns it into a filtered list with a create/edit dialog.
export type Row = Record<string, string | number | boolean | string[] | null>;
type Page = { items: Row[]; page: number; size: number; total: number };

export type FieldDef = {
  name: string;
  label: string;
  kind?: "text" | "textarea" | "number" | "select" | "multi" | "checkbox" | "datetime";
  required?: boolean;
  initial?: string | boolean;
  hint?: string;
  max?: number;
  min?: number;
  step?: string;
  pattern?: string;
  rows?: number;
  inputType?: string;
  options?: [string, string][];
  source?: { path: string; label?: (row: Row) => string };
  numeric?: boolean; // a select whose value is sent as a number
  createOnly?: boolean; // sent and shown only when creating
};

export type Resource = {
  key: string;
  label: string;
  noun: string;
  path: string;
  rowId: (row: Row) => string;
  rowName: (row: Row) => string;
  columns: Column<Row>[];
  fields: FieldDef[];
  empty: string;
  paged?: boolean;
  pageSize?: number;
  search?: boolean;
  filters?: { name: string; label: string; options: [string, string][] }[];
  select?: (data: unknown) => Row[];
  create?: boolean; // default true
  edit?: boolean; // default true; false shows the fields read-only
  remove?: boolean; // default true
  statusActions?: [string, string][];
};

const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

type Values = Record<string, string | boolean | string[]>;

function initialValues(fields: FieldDef[], row: Row | null): Values {
  const out: Values = {};
  for (const f of fields) {
    const v = row?.[f.name];
    if (f.kind === "checkbox") out[f.name] = row ? Boolean(v) : Boolean(f.initial);
    else if (f.kind === "multi") out[f.name] = Array.isArray(v) ? v : [];
    else if (v === null || v === undefined) out[f.name] = typeof f.initial === "string" && !row ? f.initial : "";
    else out[f.name] = f.kind === "datetime" ? toLocalInput(String(v)) : String(v);
  }
  return out;
}

// Empty optional text becomes null: the backend patterns reject an empty string.
function requestBody(fields: FieldDef[], values: Values) {
  const body: Record<string, unknown> = {};
  for (const f of fields) {
    const v = values[f.name];
    if (f.kind === "checkbox" || f.kind === "multi") body[f.name] = v;
    else if (v === "") body[f.name] = null;
    else if (f.kind === "number" || f.numeric) body[f.name] = Number(v);
    else if (f.kind === "datetime") body[f.name] = new Date(String(v)).toISOString();
    else body[f.name] = typeof v === "string" ? v.trim() : v;
  }
  return body;
}

const control = "w-full rounded-xl border border-gold/60 bg-white px-4 text-base transition-colors duration-200 focus:border-gold-deep focus:outline-2 focus:outline-gold-deep/40";
const labelClass = "mb-1.5 block text-sm font-medium text-ink-soft";

function optionRows(data: unknown): Row[] {
  return Array.isArray(data) ? (data as Row[]) : ((data as Page | undefined)?.items ?? []);
}

function FieldInput({ def, value, onChange, excludeId }: { def: FieldDef; value: string | boolean | string[]; onChange: (v: string | boolean | string[]) => void; excludeId?: string }) {
  const id = useId();
  const { data } = useAdminQuery<unknown>(def.source ? def.source.path : null);
  const label = def.required || def.kind === "checkbox" ? def.label : `${def.label} (không bắt buộc)`;
  const hint = def.hint && <p className="mt-1.5 text-sm text-ink-soft">{def.hint}</p>;
  const sourced: [string, string][] = optionRows(data)
    .filter((r) => String(r.id) !== excludeId)
    .map((r) => [String(r.id), def.source?.label ? def.source.label(r) : String(r.name)]);
  const options = def.options ?? sourced;

  switch (def.kind) {
    case "textarea":
      return (
        <div>
          <label htmlFor={id} className={labelClass}>{label}</label>
          <textarea id={id} rows={def.rows ?? 4} required={def.required} maxLength={def.max} value={String(value)} onChange={(e) => onChange(e.target.value)} className={`${control} py-3`} />
          {hint}
        </div>
      );
    case "select":
      return (
        <div>
          <label htmlFor={id} className={labelClass}>{label}</label>
          <select id={id} required={def.required} value={String(value)} onChange={(e) => onChange(e.target.value)} className={`${control} h-12`}>
            {!def.required && <option value="">Không chọn</option>}
            {def.required && value === "" && <option value="" disabled>Chọn…</option>}
            {options.map(([v, text]) => <option key={v} value={v}>{text}</option>)}
          </select>
          {hint}
        </div>
      );
    case "multi": {
      const chosen = value as string[];
      return (
        <fieldset>
          <legend className={labelClass}>{label}</legend>
          <div className="max-h-36 overflow-y-auto rounded-xl border border-line bg-white p-3">
            {options.length === 0 && <p className="text-sm text-ink-soft">Chưa có lựa chọn nào.</p>}
            {options.map(([v, text]) => (
              <label key={v} className="flex min-h-9 items-center gap-3 text-[0.9375rem]">
                <input type="checkbox" checked={chosen.includes(v)} onChange={() => onChange(chosen.includes(v) ? chosen.filter((x) => x !== v) : [...chosen, v])} className="size-4 accent-gold-deep" />
                {text}
              </label>
            ))}
          </div>
          {hint}
        </fieldset>
      );
    }
    case "checkbox":
      return (
        <label className="flex min-h-10 items-center gap-3 text-[0.9375rem]">
          <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-gold-deep" />
          {label}
        </label>
      );
    default:
      return (
        <Field
          label={label}
          hint={def.hint}
          type={def.kind === "number" ? "number" : def.kind === "datetime" ? "datetime-local" : (def.inputType ?? "text")}
          required={def.required}
          maxLength={def.max}
          min={def.min}
          max={def.kind === "number" ? def.max : undefined}
          step={def.step}
          pattern={def.pattern}
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}

function display(def: FieldDef, row: Row) {
  const v = row[def.name];
  if (v === null || v === undefined || v === "") return "—";
  if (def.kind === "datetime") return new Date(String(v)).toLocaleString("vi-VN");
  if (def.kind === "checkbox") return v ? "Có" : "Không";
  return def.options?.find(([o]) => o === String(v))?.[1] ?? String(v);
}

function Editor({ res, row, onClose, onDone }: { res: Resource; row: Row | null; onClose: () => void; onDone: () => void }) {
  const creating = row === null;
  const editable = res.edit !== false;
  const id = row ? res.rowId(row) : "";
  const fields = res.fields.filter((f) => creating || !f.createOnly);
  const [values, setValues] = useState(() => initialValues(fields, row));
  const [confirming, setConfirming] = useState(false);
  const { busy, error, run } = useSubmit();

  const save = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    run(async () => {
      await adminApi(creating ? res.path : `${res.path}/${id}`, { method: creating ? "POST" : "PUT", body: requestBody(fields, values) });
      onDone();
    });
  };
  const remove = () => run(async () => {
    await adminApi(`${res.path}/${id}`, { method: "DELETE" });
    onDone();
  });
  const setStatus = (status: string) => run(async () => {
    await adminApi(`${res.path}/${id}/status`, { method: "PUT", body: { status } });
    onDone();
  });

  const title = creating ? `Thêm ${res.noun}` : editable ? `Sửa ${res.noun}` : `Chi tiết ${res.noun}`;
  return (
    <Modal title={title} onClose={onClose}>
      <div className="max-h-[65dvh] overflow-y-auto px-1 py-1">
        {editable ? (
          <form id="resource-form" onSubmit={save} className="grid gap-4">
            {fields.map((f) => (
              <FieldInput key={f.name} def={f} value={values[f.name]} excludeId={id} onChange={(v) => setValues((s) => ({ ...s, [f.name]: v }))} />
            ))}
          </form>
        ) : (
          <dl className="grid gap-3">
            {res.fields.map((f) => (
              <div key={f.name}>
                <dt className="text-sm text-ink-soft">{f.label}</dt>
                <dd className="whitespace-pre-wrap break-words">{display(f, row!)}</dd>
              </div>
            ))}
          </dl>
        )}

        {row && res.statusActions && (
          <section className="mt-6 border-t border-line pt-4">
            <p className="text-sm text-ink-soft">Đổi trạng thái, không sửa nội dung</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {res.statusActions.filter(([v]) => v !== row.status).map(([v, text]) => (
                <button key={v} type="button" disabled={busy} onClick={() => setStatus(v)} className="h-9 rounded-full border border-gold/60 px-4 text-sm font-semibold transition duration-150 hover:bg-cream active:scale-95 disabled:opacity-50">
                  {text}
                </button>
              ))}
            </div>
          </section>
        )}

        {row && res.remove !== false && editable && (
          <section className="mt-6 border-t border-line pt-4">
            {confirming ? (
              <div role="alertdialog" aria-label="Xác nhận xóa">
                <p className="text-[0.9375rem]">Xóa {res.noun} “{res.rowName(row)}”? Thao tác này không thể hoàn tác.</p>
                <div className="mt-3 flex gap-4">
                  <button type="button" disabled={busy} onClick={remove} className="h-9 rounded-full bg-danger px-5 text-sm font-semibold text-white transition duration-150 active:scale-95 disabled:opacity-50">
                    Xác nhận xóa
                  </button>
                  <TextButton onClick={() => setConfirming(false)}>Giữ lại</TextButton>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => setConfirming(true)} className="text-sm font-semibold text-danger underline-offset-4 hover:underline">
                Xóa {res.noun}
              </button>
            )}
          </section>
        )}
      </div>

      <div className="mt-4">
        <Notice>{error}</Notice>
      </div>
      <div className="mt-4 flex items-center justify-end gap-5">
        <TextButton onClick={onClose}>{editable ? "Hủy" : "Đóng"}</TextButton>
        {editable && (
          <div className="w-40">
            <Button type="submit" form="resource-form" busy={busy}>{creating ? "Thêm" : "Lưu"}</Button>
          </div>
        )}
      </div>
    </Modal>
  );
}

export function ResourcePanel({ res }: { res: Resource }) {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<Row | "new" | null>(null);

  const params = new URLSearchParams();
  const size = res.pageSize ?? 20;
  if (res.paged) {
    params.set("page", String(page));
    params.set("size", String(size));
  }
  for (const [k, v] of Object.entries(filters)) if (v) params.set(k, v);
  if (q) params.set("q", q);
  const query = params.toString();
  const { data, error, loading, reload } = useAdminQuery<unknown>(query ? `${res.path}?${query}` : res.path);

  const rows = data === undefined ? undefined : res.select ? res.select(data) : optionRows(data);
  const total = res.paged && data ? (data as Page).total : rows?.length;
  const columns = res.columns.map((c, i) =>
    i === 0 ? { ...c, render: (r: Row) => <button type="button" onClick={() => setEditing(r)} className="text-left font-medium hover:underline">{c.render(r)}</button> } : c,
  );
  const closeAndReload = () => {
    setEditing(null);
    reload();
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        {res.filters?.map((f) => (
          <label key={f.name} className="grid gap-1 text-sm text-ink-soft">
            {f.label}
            <select
              value={filters[f.name] ?? ""}
              onChange={(e) => {
                setFilters((s) => ({ ...s, [f.name]: e.target.value }));
                setPage(0);
              }}
              className="h-10 rounded-xl border border-gold/60 bg-white px-3 text-[0.9375rem] text-ink"
            >
              <option value="">Tất cả</option>
              {f.options.map(([v, text]) => <option key={v} value={v}>{text}</option>)}
            </select>
          </label>
        ))}
        {res.search && (
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              setQ(draft.trim());
              setPage(0);
            }}
            className="grid gap-1 text-sm text-ink-soft"
          >
            <label htmlFor={`${res.key}-q`}>Tìm kiếm</label>
            <input id={`${res.key}-q`} type="search" maxLength={100} value={draft} onChange={(e) => setDraft(e.target.value)} className="h-10 w-56 rounded-xl border border-gold/60 bg-white px-3 text-[0.9375rem] text-ink" />
          </form>
        )}
        {res.create !== false && (
          <div className="ml-auto w-44">
            <Button type="button" onClick={() => setEditing("new")}>Thêm {res.noun}</Button>
          </div>
        )}
      </div>

      {total !== undefined && !error && <p className="mb-1 text-sm text-ink-soft">{total.toLocaleString("vi-VN")} {res.noun}</p>}
      <DataTable rows={rows} columns={columns} rowKey={res.rowId} loading={loading} error={error} empty={res.empty} onRowClick={setEditing} />
      {error ? (
        <div className="mt-3"><TextButton onClick={reload}>Thử lại</TextButton></div>
      ) : (
        res.paged && total !== undefined && total > size && (
          <div className="mt-4 flex items-center justify-between text-sm text-ink-soft">
            <span className="tabular-nums">{page * size + 1}–{Math.min((page + 1) * size, total)} trong {total.toLocaleString("vi-VN")}</span>
            <span className="flex gap-5">
              <TextButton disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Trang trước</TextButton>
              <TextButton disabled={(page + 1) * size >= total} onClick={() => setPage((p) => p + 1)}>Trang sau</TextButton>
            </span>
          </div>
        )
      )}

      {editing && <Editor res={res} row={editing === "new" ? null : editing} onClose={() => setEditing(null)} onDone={closeAndReload} />}
    </div>
  );
}

export function ResourceScreen({ title, resources }: { title: string; resources: Resource[] }) {
  const [tab, setTab] = useState(resources[0].key);
  const res = resources.find((r) => r.key === tab) ?? resources[0];
  return (
    <div>
      <PageHeader title={title} />
      <div className="rise overflow-x-auto pb-1" style={{ "--i": 1 } as React.CSSProperties}>
        <div style={{ minWidth: `${resources.length * 7.5}rem` }}>
          <Tabs options={resources.map((r) => [r.key, r.label])} value={res.key} onChange={setTab} />
        </div>
      </div>
      <div role="tabpanel" className="mt-6">
        <ResourcePanel key={res.key} res={res} />
      </div>
    </div>
  );
}
