import type { Metadata } from "next";
import { PageHeader } from "@/components/page-parts";
import { CustomerBoard } from "./customer-board";

export const metadata: Metadata = { title: "Khách và tư vấn" };

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  return (
    <>
      <PageHeader title="Khách và yêu cầu tư vấn" description="Khách từ web, Zalo, hotline và Meey CRM được gộp theo số điện thoại." />
      <CustomerBoard initialTab={tab === "tu-van" ? "consults" : "customers"} />
    </>
  );
}
