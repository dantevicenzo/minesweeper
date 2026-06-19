// Environment variables for React Native
// Copy this file to src/env.ts and fill in your values
// env.ts is gitignored and will NOT be committed

export const env = {
  SUPABASE_URL: 'https://your-project.supabase.co',
  SUPABASE_ANON_KEY: 'your-anon-key',
  API_URL: 'http://localhost:3001',
  SENTRY_DSN: 'your-sentry-dsn',
  GOOGLE_SIGN_IN_CLIENT_ID: 'your-google-client-id',
} as const
