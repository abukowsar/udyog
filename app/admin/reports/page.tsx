import type { Metadata } from "next";
import ReportsView from "@/components/admin/ReportsView";

export const metadata: Metadata = { title: "রিপোর্ট ও এক্সপোর্ট" };

export default function ReportsPage() {
  return <ReportsView />;
}
