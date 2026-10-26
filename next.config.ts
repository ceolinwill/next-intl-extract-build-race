import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin({
  experimental: {
    extract: { path: "./messages" },
    messages: {
      format: "po",
      locales: "infer",
      path: "./messages",
      precompile: true,
      sourceLocale: "en",
    },
    srcPath: "./src",
  },
});

const nextConfig: NextConfig = {};

export default withNextIntl(nextConfig);
