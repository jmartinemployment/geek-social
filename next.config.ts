import type { NextConfig } from "next";

// Every page of this app is behind sign-in and none is ever indexable, before launch or after.
const NOINDEX = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];

const nextConfig: NextConfig = {
  // The live bridge's SignalR client loads `ws` with a runtime require, which a bundle would not find.
  serverExternalPackages: ["@microsoft/signalr", "ws"],
  async headers() {
    return [{ source: "/:path*", headers: NOINDEX }];
  },
};

export default nextConfig;
