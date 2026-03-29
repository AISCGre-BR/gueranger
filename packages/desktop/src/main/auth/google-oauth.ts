import { OAuth2Client, CodeChallengeMethod } from "google-auth-library";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { randomBytes, createHash } from "node:crypto";
import { shell } from "electron";
import { retrieveEncrypted, clearEncrypted } from "./safe-credentials";

// Google OAuth credentials for Desktop app.
// These are NOT truly secret — Google documents that "installed application"
// secrets are extractable. Security comes from the user authorizing in the
// browser + PKCE, not from these values being hidden.
// See: https://developers.google.com/identity/protocols/oauth2/native-app
const CLIENT_ID = "REDACTED_GOOGLE_CLIENT_ID";
const CLIENT_SECRET = "REDACTED_GOOGLE_CLIENT_SECRET";

const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

let authClient: OAuth2Client | null = null;

function generateCodeVerifier(): string {
  return randomBytes(32).toString("base64url");
}

function generateCodeChallenge(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

export function getAuthClient(): OAuth2Client | null {
  return authClient;
}

export async function startGoogleSignIn(): Promise<{
  accessToken: string;
  refreshToken: string;
  email: string;
  avatarUrl: string;
}> {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  return new Promise((resolve, reject) => {
    const server = createServer(
      async (req: IncomingMessage, res: ServerResponse) => {
        try {
          const url = new URL(req.url ?? "/", `http://127.0.0.1`);
          const error = url.searchParams.get("error");
          const code = url.searchParams.get("code");

          if (error) {
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end(
              "<html><body><h1>Sign-in cancelled</h1><p>You can close this window.</p></body></html>",
            );
            server.close();
            reject(new Error(`Google sign-in error: ${error}`));
            return;
          }

          if (code) {
            const port = (server.address() as { port: number }).port;
            const redirectUri = `http://127.0.0.1:${port}`;

            res.writeHead(200, { "Content-Type": "text/html" });
            res.end(
              "<html><body><h1>Signed in!</h1><p>You can close this window.</p></body></html>",
            );
            server.close();
            const client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, redirectUri);

            const { tokens } = await client.getToken({
              code,
              codeVerifier,
              redirect_uri: redirectUri,
            });
            client.setCredentials(tokens);

            const userInfoRes = await fetch(
              "https://www.googleapis.com/oauth2/v2/userinfo",
              {
                headers: {
                  Authorization: `Bearer ${tokens.access_token}`,
                },
              },
            );
            const userInfo = (await userInfoRes.json()) as {
              email: string;
              picture: string;
            };

            authClient = client;

            resolve({
              accessToken: tokens.access_token ?? "",
              refreshToken: tokens.refresh_token ?? "",
              email: userInfo.email,
              avatarUrl: userInfo.picture,
            });
          }
        } catch (err) {
          server.close();
          reject(err);
        }
      },
    );

    server.listen(0, "127.0.0.1", () => {
      const port = (server.address() as { port: number }).port;
      const redirectUri = `http://127.0.0.1:${port}`;
      const client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, redirectUri);

      const authUrl = client.generateAuthUrl({
        access_type: "offline",
        scope: SCOPES,
        code_challenge: codeChallenge,
        code_challenge_method: CodeChallengeMethod.S256,
        redirect_uri: redirectUri,
        prompt: "consent",
      });

      shell.openExternal(authUrl);
    });

    // 5-minute timeout
    setTimeout(() => {
      server.close();
      reject(new Error("Google sign-in timed out after 5 minutes"));
    }, 5 * 60 * 1000);
  });
}

export async function restoreSession(): Promise<{
  email: string;
  avatarUrl: string;
} | null> {
  const refreshToken = retrieveEncrypted("google-refresh-token");
  if (!refreshToken) return null;

  try {
    const client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET);
    client.setCredentials({ refresh_token: refreshToken });

    const { credentials } = await client.refreshAccessToken();
    client.setCredentials(credentials);

    const userInfoRes = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${credentials.access_token}`,
        },
      },
    );
    const userInfo = (await userInfoRes.json()) as {
      email: string;
      picture: string;
    };

    authClient = client;

    return { email: userInfo.email, avatarUrl: userInfo.picture };
  } catch (err) {
    console.error("[google-oauth] Failed to restore session:", err);
    clearEncrypted("google-refresh-token");
    clearEncrypted("google-access-token");
    authClient = null;
    return null;
  }
}

export async function signOut(): Promise<void> {
  clearEncrypted("google-refresh-token");
  clearEncrypted("google-access-token");
  authClient = null;
}
