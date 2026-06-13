import { ScanFlow } from "@/components/ScanFlow";
import { SiteFooter } from "@/components/SiteFooter";
import { priceLabel, config } from "@/lib/config";

export const metadata = {
  title: "Scan Your Palm — PalmInsight",
};

export default function ScanPage() {
  return (
    <>
      <ScanFlow priceLabel={priceLabel()} baseUrl={config.baseUrl} />
      <SiteFooter />
    </>
  );
}
