import type { Metadata } from "next";
import ApplyForm from "@/components/apply/ApplyForm";

export const metadata: Metadata = {
  title: "অনলাইন আবেদন",
  description: "উদ্যোগ (UDYOG) কর্মসূচির অনলাইন আবেদন ফরম — বাংলাদেশ ব্যাংক।"
};

export default function ApplyPage() {
  return <div className="apply-page"><ApplyForm /></div>;
}
