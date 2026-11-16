import { Suspense } from "react";
import { PageFrame } from "@/components/ui";
import { MetaCallbackClient } from "./callback-client";

export default function MetaCallbackPage() {
  return (
    <PageFrame title="Connecting a Facebook Page" intro="Meta has sent you back here.">
      <Suspense fallback={<p className="text-sm text-line">Reading Meta&apos;s answer…</p>}>
        <MetaCallbackClient />
      </Suspense>
    </PageFrame>
  );
}
