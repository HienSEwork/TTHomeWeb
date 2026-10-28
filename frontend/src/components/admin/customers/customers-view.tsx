"use client";

import { useState } from "react";
import { PageHeader } from "@/components/admin/parts";
import { UnderlineTabs } from "@/components/admin/operations/controls";
import { useStaff } from "@/components/admin/operations/directory";
import { ConsultList } from "./consult-list";
import { CustomerList } from "./customer-list";

const VIEWS = [
  { value: "customers", label: "Khách hàng" },
  { value: "consults", label: "Yêu cầu tư vấn" },
];

export function CustomersView() {
  const [view, setView] = useState("customers");
  const [customerId, setCustomerId] = useState<string | null>(null);
  const staff = useStaff();

  return (
    <>
      <PageHeader title="Khách và tư vấn" />
      <UnderlineTabs label="Danh sách" options={VIEWS} value={view} onChange={(v) => { setView(v); setCustomerId(null); }} />
      <div className="mt-4">
        {view === "customers" ? (
          <CustomerList staff={staff} openId={customerId} onOpen={setCustomerId} />
        ) : (
          <ConsultList
            staff={staff}
            onOpenCustomer={(id) => {
              setCustomerId(id);
              setView("customers");
            }}
          />
        )}
      </div>
    </>
  );
}
