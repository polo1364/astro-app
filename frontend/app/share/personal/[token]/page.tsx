import type { Metadata } from "next";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8001";
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "星象觀測台";

export const dynamic = "force-dynamic";

interface ShareMeta {
  token: string;
  title: string;
  description: string;
  imageUrl: string;
  sharePageUrl: string;
}

async function fetchShareMeta(token: string): Promise<ShareMeta | null> {
  try {
    const res = await fetch(`${API_BASE}/share/personal-daily/${token}/meta`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const raw = await res.json();
    return {
      token: raw.token,
      title: raw.title,
      description: raw.description,
      imageUrl: raw.image_url,
      sharePageUrl: raw.share_page_url,
    };
  } catch {
    return null;
  }
}

type PageProps = {
  params: Promise<{ token: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  const meta = await fetchShareMeta(token);
  if (!meta) {
    return { title: "分享已過期" };
  }
  return {
    title: meta.title,
    description: meta.description,
    openGraph: {
      title: meta.title,
      description: meta.description,
      images: [
        {
          url: meta.imageUrl,
          width: 1080,
          height: 1350,
          alt: meta.title,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
      images: [meta.imageUrl],
    },
  };
}

export default async function PersonalSharePage({ params }: PageProps) {
  const { token } = await params;
  const meta = await fetchShareMeta(token);

  if (!meta) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 text-text-secondary bg-bg-base">
        <p>此分享連結已過期或不存在。</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg-base text-text-primary">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-6 sm:py-10 flex flex-col items-center gap-6 sm:gap-8">
        <figure className="w-full">
          <div className="rounded-xl overflow-hidden border border-border/80 bg-black shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
            <img
              src={meta.imageUrl}
              alt={meta.title}
              width={1080}
              height={1350}
              className="w-full h-auto block"
              loading="eager"
              decoding="async"
            />
          </div>
          <figcaption className="sr-only">{meta.title}</figcaption>
        </figure>

        <div className="w-full max-w-3xl text-center space-y-3">
          <p className="text-caption text-text-gold tracking-[0.2em]">{SITE_NAME}</p>
          <h1
            className="text-xl sm:text-2xl font-semibold text-text-primary"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {meta.title}
          </h1>
          <p className="text-sm sm:text-body text-text-secondary whitespace-pre-wrap leading-relaxed">
            {meta.description}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 text-caption text-text-muted">
          <span>Swiss Ephemeris · 個人化每日行運</span>
          <span className="hidden sm:inline text-border">|</span>
          <Link
            href="/"
            className="text-accent-natal hover:text-accent-natal/80 transition-colors"
          >
            前往 {SITE_NAME}
          </Link>
        </div>
      </div>
    </main>
  );
}
