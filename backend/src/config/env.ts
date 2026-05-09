import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('4000'),
  FRONTEND_URL: z.string().url('FRONTEND_URL must be a valid URL'),
  AZURE_TENANT_ID: z.string().min(1, 'AZURE_TENANT_ID is required'),
  AZURE_CLIENT_ID: z.string().min(1, 'AZURE_CLIENT_ID is required'),
  AZURE_CLIENT_SECRET: z.string().min(1, 'AZURE_CLIENT_SECRET is required'),
  AZURE_REDIRECT_URI: z.string().url('AZURE_REDIRECT_URI must be a valid URL'),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),
  ENCRYPTION_KEY: z.string().min(32, 'ENCRYPTION_KEY must be at least 32 characters'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('\n❌  Missing or invalid environment variables:\n');
  const errors = parsed.error.flatten().fieldErrors;
  Object.entries(errors).forEach(([key, msgs]) => {
    console.error(`  ${key}: ${msgs?.join(', ')}`);
  });
  console.error('\nSee .env.example for required variables.\n');
  process.exit(1);
}

export const env = parsed.data;

export const GRAPH_SCOPES = [
  'https://graph.microsoft.com/User.ReadWrite.All',
  'https://graph.microsoft.com/Group.ReadWrite.All',
  'https://graph.microsoft.com/DeviceManagementManagedDevices.ReadWrite.All',
  'https://graph.microsoft.com/Reports.Read.All',
  'https://graph.microsoft.com/AuditLog.Read.All',
  'https://graph.microsoft.com/Directory.ReadWrite.All',
  'https://graph.microsoft.com/Sites.ReadWrite.All',
  'https://graph.microsoft.com/Team.ReadBasic.All',
  'offline_access',
  'openid',
  'profile',
  'email',
] as const;

export const MSAL_CONFIG = {
  auth: {
    clientId: env.AZURE_CLIENT_ID,
    clientSecret: env.AZURE_CLIENT_SECRET,
    authority: `https://login.microsoftonline.com/${env.AZURE_TENANT_ID}`,
  },
} as const;
