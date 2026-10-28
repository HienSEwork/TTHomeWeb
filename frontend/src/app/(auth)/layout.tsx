import Link from "next/link";
import { Building, Wordmark } from "@/components/building";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <main className="flex px-6 py-8 sm:px-12">
        <div className="mx-auto flex w-full max-w-md flex-col">
          <Link href="/" className="rise w-fit" aria-label="TTHome">
            <Wordmark />
          </Link>
          <div className="flex flex-1 flex-col justify-center py-10">{children}</div>
        </div>
      </main>
      <aside className="relative hidden flex-col overflow-hidden bg-gold pt-14 lg:flex">
        <p className="rise px-14 text-balance text-5xl font-extrabold leading-[1.05] tracking-tight" style={{ "--i": 3 } as React.CSSProperties}>
          Phòng trống, xem trong tuần.
        </p>
        <div className="relative mt-10 flex-1"><Building /></div>
      </aside>
    </div>
  );
}
