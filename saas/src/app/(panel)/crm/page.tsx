import CrmEmbedClient from "./CrmEmbedClient";
import { getViveCrmBaseUrl, getViveCrmEmbedUrl } from "@/lib/vive-crm";

export const dynamic = "force-dynamic";

export default function CrmPage() {
  const origin = getViveCrmBaseUrl();
  const embedUrl = getViveCrmEmbedUrl();

  return <CrmEmbedClient embedUrl={embedUrl} baseLabel={origin.replace(/^https?:\/\//, "")} />;
}
