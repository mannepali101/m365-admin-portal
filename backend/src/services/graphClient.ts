import { Client } from '@microsoft/microsoft-graph-client';
import 'isomorphic-fetch';

/**
 * Build an authenticated Graph client using a delegated access token.
 * The token is validated by Microsoft on every Graph API call.
 */
export function buildGraphClient(accessToken: string): Client {
  return Client.init({
    authProvider: (done) => done(null, accessToken),
    defaultVersion: 'v1.0',
  });
}
