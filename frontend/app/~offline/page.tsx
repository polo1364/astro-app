import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function OfflinePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12 text-center gap-4">
      <p className="text-sm text-text-secondary uppercase tracking-widest">離線模式</p>
      <h1
        className="text-2xl font-semibold text-text-primary"
        style={{ fontFamily: "var(--font-display)" }}
      >
        目前無法連線
      </h1>
      <p className="text-sm text-text-secondary max-w-sm leading-relaxed">
        請檢查網路連線後再試。已快取的頁面仍可在離線時開啟。
      </p>
      <Link href="/">
        <Button>返回首頁</Button>
      </Link>
    </main>
  );
}
