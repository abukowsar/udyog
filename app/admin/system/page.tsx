import type { Metadata } from "next";
import SystemView from "@/components/admin/SystemView";

export const metadata: Metadata = { title: "সিস্টেম" };

export default function SystemPage() {
  return <SystemView />;
}
