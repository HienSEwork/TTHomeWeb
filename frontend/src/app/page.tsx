import { redirect } from "next/navigation";

// shortcut: no public home yet, send visitors to sign-in; replace when the home page is built.
export default function Home() {
  redirect("/dang-nhap");
}
