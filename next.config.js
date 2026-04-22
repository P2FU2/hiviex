const { withSentryConfig } = require('@sentry/nextjs')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {},
}

const uploadSourceMaps =
  Boolean(process.env.SENTRY_AUTH_TOKEN) &&
  Boolean(process.env.SENTRY_ORG) &&
  Boolean(process.env.SENTRY_PROJECT)

module.exports = withSentryConfig(
  nextConfig,
  {
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    authToken: process.env.SENTRY_AUTH_TOKEN,
    silent: true,
    dryRun: !uploadSourceMaps,
  },
  {
    hideSourceMaps: true,
    widenClientFileUpload: true,
    tunnelRoute: '/monitoring',
    automaticVercelMonitors: false,
    disableLogger: true,
  }
)
