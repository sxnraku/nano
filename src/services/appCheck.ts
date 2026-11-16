import type { FirebaseApp } from 'firebase/app';
import { initializeAppCheck, CustomProvider, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { Capacitor } from '@capacitor/core';
import { FirebaseAppCheck } from '@capacitor-firebase/app-check';

/**
 * Firebase App Check: proves requests come from the real Nano Verse app.
 * Required because App Check is enforced for Firebase AI Logic (Gemini).
 *
 * - Tester builds (CI / App Distribution): VITE_APPCHECK_DEBUG_TOKEN is set and the
 *   JS debug provider sends that token. The token must be registered in
 *   Firebase console > App Check > Apps > web app > Manage debug tokens.
 * - Android / iOS store builds: native Play Integrity / App Attest through
 *   @capacitor-firebase/app-check, bridged into the JS SDK.
 * - Web: reCAPTCHA Enterprise when VITE_RECAPTCHA_SITE_KEY is set.
 */
export async function initAppCheck(app: FirebaseApp): Promise<void> {
  const debugToken = import.meta.env.VITE_APPCHECK_DEBUG_TOKEN as string | undefined;
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined;

  try {
    if (debugToken) {
      // Must be set before initializeAppCheck; the provider below is then ignored.
      (self as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN?: string }).FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken;
      initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider(siteKey || 'debug-provider'),
        isTokenAutoRefreshEnabled: true,
      });
      return;
    }

    if (Capacitor.isNativePlatform()) {
      await FirebaseAppCheck.initialize({ isTokenAutoRefreshEnabled: true });
      initializeAppCheck(app, {
        provider: new CustomProvider({
          getToken: async () => {
            const { token, expireTimeMillis } = await FirebaseAppCheck.getToken();
            return { token, expireTimeMillis: expireTimeMillis ?? Date.now() + 30 * 60 * 1000 };
          },
        }),
        isTokenAutoRefreshEnabled: true,
      });
      return;
    }

    if (siteKey) {
      initializeAppCheck(app, { provider: new ReCaptchaEnterpriseProvider(siteKey), isTokenAutoRefreshEnabled: true });
      return;
    }

    console.warn('App Check not configured for this build: AI requests will be rejected while enforcement is on.');
  } catch (e) {
    console.error('App Check init failed', e);
  }
}
