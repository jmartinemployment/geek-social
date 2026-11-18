import type { MetadataRoute } from "next";

// Every page of this app is behind sign-in and none is ever indexable, before launch or after.
// The X-Robots-Tag header in next.config.ts says noindex; this tells crawlers not to fetch at all.
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } };
}
