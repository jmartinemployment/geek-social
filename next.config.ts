import type { NextConfig } from "next";

// Every page of this app is behind sign-in and none is ever indexable, before launch or after.
const NOINDEX = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];

const nextConfig: NextConfig = {
  // The live bridge's SignalR client loads `ws` with a runtime require, which a bundle would not find.
  serverExternalPackages: ["@microsoft/signalr", "ws"],
  // The same client loads these at run time with a require that build tracing cannot see
  // (HttpConnection: ws, eventsource; FetchHttpClient: tough-cookie, fetch-cookie), so the deployed
  // live-updates function failed "Cannot find module 'ws'". Each is listed with its own dependencies.
  outputFileTracingIncludes: {
    "/api/live-updates": [
      "./node_modules/@microsoft/signalr/node_modules/ws/**",
      "./node_modules/eventsource/**",
      "./node_modules/fetch-cookie/**",
      "./node_modules/set-cookie-parser/**",
      "./node_modules/tough-cookie/**",
      "./node_modules/psl/**",
      "./node_modules/punycode/**",
      "./node_modules/universalify/**",
      "./node_modules/url-parse/**",
      "./node_modules/querystringify/**",
      "./node_modules/requires-port/**",
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: NOINDEX }];
  },
};

export default nextConfig;
