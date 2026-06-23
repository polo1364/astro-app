import type { Metadata } from "next";
import Image from "next/image";

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
      <main className="min-h-screen flex items-center justify-center p-6 text-text-secondary">
        <p>此分享連結已過期或不存在。</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 gap-6 bg-bg-base text-text-primary">
      <div className="text-center max-w-lg">
        <p className="text-caption text-text-gold tracking-widest mb-2">{SITE_NAME}</p>
        <h1 className="text-2xl font-semibold mb-2" style={{ fontFamily: "var(--font-display)" }}>
          {meta.title}
        </h1>
        <p className="text-body text-text-secondary whitespace-pre-wrap">{meta.description}</p>
      </div>
      <div className="relative w-full max-w-md aspect-[1080/1350] rounded-lg overflow-hidden border border-border">
        <Image
          src={meta.imageUrl}
          alt={meta.title}
          fill
          className="object-contain bg-black"
          unoptimized
          priority
        />
      </div>
      <p className="text-caption text-text-muted">Swiss Ephemeris · 個人化每日行運</p>
    </main>
  );
}
