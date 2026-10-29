import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, MessageCircle, Phone, StickyNote, Users, RefreshCw, type LucideIcon } from "lucide-react";
import { APPOINTMENT_STATUS, APPOINTMENTS, CUSTOMER_SOURCE, CUSTOMER_STAGE, CUSTOMERS, staffName, type Interaction } from "@tthome/data";
import { Badge, buttonStyles, formatPriceShort } from "@tthome/ui";
import { PageHeader, Panel } from "@/components/page-parts";
import { fmt } from "@/lib/format";
import { NoteForm } from "./note-form";

type Props = { params: Promise<{ id: string }> };

const KIND: Record<Interaction["kind"], { icon: LucideIcon; label: string }> = {
  call: { icon: Phone, label: "Gọi điện" },
  zalo: { icon: MessageCircle, label: "Zalo" },
  meeting: { icon: Users, label: "Gặp mặt" },
  note: { icon: StickyNote, label: "Ghi chú" },
  stage_change: { icon: RefreshCw, label: "Cập nhật" },
};

export function generateStaticParams() {
  return CUSTOMERS.map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const c = CUSTOMERS.find((x) => x.id === id);
  return { title: c?.name ?? "Không tìm thấy khách" };
}

export default async function CustomerPage({ params }: Props) {
  const { id } = await params;
  const customer = CUSTOMERS.find((c) => c.id === id);
  if (!customer) notFound();
  const appointments = APPOINTMENTS.filter((a) => a.customer === customer.name);
  const stage = CUSTOMER_STAGE[customer.stage];

  return (
    <>
      <Link href="/khach-hang" className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink">
        <ChevronLeft aria-hidden className="size-4" />
        Khách và tư vấn
      </Link>
      <PageHeader
        title={customer.name}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            <Badge tone={stage.tone}>{stage.label}</Badge>
            <span>Từ {CUSTOMER_SOURCE[customer.source]}, tạo ngày {fmt.date(customer.createdAt)}</span>
          </span>
        }
        actions={
          <>
            <a href={`tel:${customer.phone.replace(/\s/g, "")}`} className={buttonStyles({ size: "sm" })}>
              <Phone aria-hidden />
              Gọi {customer.phone}
            </a>
            <a href={`https://zalo.me/${customer.phone.replace(/\s/g, "")}`} target="_blank" rel="noopener" className={buttonStyles({ variant: "secondary", size: "sm" })}>
              Nhắn Zalo
            </a>
          </>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_1.4fr]">
        <div className="space-y-4">
          <Panel title="Nhu cầu thuê">
            <dl className="divide-y divide-line text-sm">
              {[
                ["Khu vực", customer.wantedArea],
                ["Ngân sách", `Dưới ${formatPriceShort(customer.budgetMax)}/tháng`],
                ["Dọn vào", fmt.date(customer.moveIn)],
                ["Email", customer.email ?? "Chưa có"],
                ["Phụ trách", staffName(customer.staffId) ?? "Chưa giao"],
              ].map(([k, v]) => (
                <div key={k} className="grid grid-cols-[7rem_1fr] gap-3 px-5 py-2.5">
                  <dt className="text-muted">{k}</dt>
                  <dd className="text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          </Panel>
          <Panel title={`Lịch hẹn (${appointments.length})`}>
            {appointments.length ? (
              <ul className="divide-y divide-line">
                {appointments.map((a) => (
                  <li key={a.code} className="flex items-start justify-between gap-3 px-5 py-3 text-sm">
                    <span>
                      <span className="block font-semibold text-ink">
                        {a.roomName}, {a.projectName}
                      </span>
                      <span className="text-muted tabular">{fmt.dateTime(a.scheduledAt)}</span>
                    </span>
                    <Badge tone={APPOINTMENT_STATUS[a.status].tone}>{APPOINTMENT_STATUS[a.status].label}</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-4 text-sm text-muted">Khách chưa đặt lịch xem phòng nào.</p>
            )}
          </Panel>
        </div>

        <Panel title="Lịch sử chăm sóc">
          <NoteForm />
          <ol className="space-y-4 px-5 py-5">
            {customer.interactions.map((it, i) => {
              const k = KIND[it.kind];
              const Icon = k.icon;
              return (
                <li key={`${it.at}-${i}`} className="flex gap-3">
                  <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-wash text-ink-soft">
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 text-sm">
                    <p className="text-ink">{it.text}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {k.label}, {it.by}, {fmt.dateTime(it.at)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </Panel>
      </div>
    </>
  );
}
