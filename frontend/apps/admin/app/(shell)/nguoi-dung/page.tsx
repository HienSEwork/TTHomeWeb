import type { Metadata } from "next";
import { PageHeader } from "@/components/page-parts";
import { UserBoard } from "./user-board";

export const metadata: Metadata = { title: "Người dùng và quyền" };

export default function UsersPage() {
  return (
    <>
      <PageHeader title="Người dùng và quyền" description="Khóa tài khoản khi có dấu hiệu lạm dụng. Mọi thay đổi vai trò đều được ghi vào nhật ký hoạt động." />
      <UserBoard />
    </>
  );
}
