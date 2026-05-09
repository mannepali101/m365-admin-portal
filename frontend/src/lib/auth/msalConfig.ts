import { Configuration, LogLevel, PopupRequest, RedirectRequest } from '@azure/msal-browser';

// ── MSAL Public Client Configuration ──────────────────────────
export const msalConfig: Configuration = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_AZURE_CLIENT_ID!,
    authority: `https://login.microsoftonline.com/${process.env.NEXT_PUBLIC_AZURE_TENANT_ID}`,
    redirectUri: process.env.NEXT_PUBLIC_AZURE_REDIRECT_URI ?? 'http://localhost:3000/auth/callback',
    postLogoutRedirectUri: '/login',
    navigateToLoginRequestUrl: false,
  },
  cache: {
    // sessionStorage clears on tab close — safer for admin portals
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      logLevel: process.env.NODE_ENV === 'production' ? LogLevel.Error : LogLevel.Warning,
      loggerCallback: (level, message, containsPii) => {
        if (containsPii || process.env.NODE_ENV === 'production') return;
        const prefix = {
          [LogLevel.Error]: '[MSAL Error]',
          [LogLevel.Warning]: '[MSAL Warn]',
          [LogLevel.Info]: '[MSAL Info]',
          [LogLevel.Verbose]: '[MSAL Verbose]',
          [LogLevel.Trace]: '[MSAL Trace]',
        }[level];
        console.log(prefix, message);
      },
      piiLoggingEnabled: false,
    },
    allowNativeBroker: false,
  },
};

// ── Delegated permissions requested at login ──────────────────
export const loginRequest: RedirectRequest & PopupRequest = {
  scopes: [
    'openid',
    'profile',
    'email',
    'offline_access',
    'https://graph.microsoft.com/User.ReadWrite.All',
    'https://graph.microsoft.com/Group.ReadWrite.All',
    'https://graph.microsoft.com/DeviceManagementManagedDevices.ReadWrite.All',
    'https://graph.microsoft.com/Reports.Read.All',
    'https://graph.microsoft.com/AuditLog.Read.All',
    'https://graph.microsoft.com/Directory.ReadWrite.All',
    'https://graph.microsoft.com/Sites.ReadWrite.All',
    'https://graph.microsoft.com/Team.ReadBasic.All',
  ],
  prompt: 'select_account',
};

// ── Silent token request (no UI) ──────────────────────────────
export const silentRequest = {
  scopes: loginRequest.scopes,
};
