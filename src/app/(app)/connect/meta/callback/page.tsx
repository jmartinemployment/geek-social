import { Suspense } from "react";
import { PageFrame } from "@/components/ui";
import { metaRedirectUri } from "@/lib/server/meta-redirect";
import { MetaCallbackClient } from "./callback-client";

export default function MetaCallbackPage() {
  return (
    <PageFrame title="Connecting a Facebook Page" intro="Meta has sent you back here.">
      <Suspense fallback={<p className="text-sm text-line">Reading Meta&apos;s answer…</p>}>
        {/* The same server-side address the connect start sent, so Meta and GeekAPI see one redirect address. */}
        <MetaCallbackClient redirectUri={metaRedirectUri()} />
      </Suspense>
    </PageFrame>
  );
}
