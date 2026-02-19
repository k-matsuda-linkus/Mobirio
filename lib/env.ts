export function getEnv(key: string, fallback?: string): string {
  const value = process.env[key];
  if (!value && !fallback) throw new Error("Missing env: " + key);
  return value || fallback!;
}

export const env = {
  supabaseUrl: () => getEnv("NEXT_PUBLIC_SUPABASE_URL", ""),
  supabaseAnonKey: () => getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", ""),
  supabaseServiceKey: () => getEnv("SUPABASE_SERVICE_ROLE_KEY", ""),
  squareAccessToken: () => getEnv("SQUARE_ACCESS_TOKEN", ""),
  squareEnvironment: () => getEnv("SQUARE_ENVIRONMENT", "sandbox"),
  appUrl: () => getEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000"),
  cronSecret: () => getEnv("CRON_SECRET", ""),
};
