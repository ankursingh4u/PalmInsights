import { GoogleSignin } from "@react-native-google-signin/google-signin";

// The Web OAuth client ID (safe to embed — it's public). The Android OAuth
// client (package live.bolddev.palminsight + release SHA-1) must also exist in
// the same Google Cloud project or sign-in fails with DEVELOPER_ERROR.
export const WEB_CLIENT_ID =
  "330242041192-h4ui503vdqdbrls30lqennt2lhceq3vi.apps.googleusercontent.com";

GoogleSignin.configure({ webClientId: WEB_CLIENT_ID });

/** Launch native Google Sign-In and return the ID token for the backend. */
export async function getGoogleIdToken(): Promise<string> {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const response = await GoogleSignin.signIn();
  // v13+: { type: "success", data: { idToken } }; older shape: { idToken }.
  const r = response as unknown as {
    type?: string;
    data?: { idToken?: string | null };
    idToken?: string | null;
  };
  if (r.type === "cancelled") throw new Error("Sign-in cancelled.");
  const idToken = r.data?.idToken ?? r.idToken ?? null;
  if (!idToken) throw new Error("Couldn't get a Google token. Try again.");
  return idToken;
}
