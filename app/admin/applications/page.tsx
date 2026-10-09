import type { Metadata } from "next";
import { Suspense } from "react";
import ApplicationsView from "@/components/admin/ApplicationsView";

export const metadata: Metadata = { title: "আবেদনসমূহ" };

export default function ApplicationsPage() {
  return <Suspense fallback={<div className="adm-skel"><i /><i /></div>}><ApplicationsView /></Suspense>;
}
