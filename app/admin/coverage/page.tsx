import type { Metadata } from "next";
import CoverageView from "@/components/admin/CoverageView";

export const metadata: Metadata = { title: "এলাকাভিত্তিক অগ্রগতি" };

export default function CoveragePage() {
  return <CoverageView />;
}
