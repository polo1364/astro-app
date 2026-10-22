import type { Metadata } from "next";
import { ZiweiPage } from "@/features/ziwei/ZiweiPage";

export const metadata: Metadata = { title: "紫微斗數" };

export default function Page() {
  return <ZiweiPage />;
}
