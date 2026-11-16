/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Tester builds only: App Check debug token registered in the Firebase console. */
  readonly VITE_APPCHECK_DEBUG_TOKEN?: string
  /** Web builds: reCAPTCHA Enterprise site key for App Check. */
  readonly VITE_RECAPTCHA_SITE_KEY?: string
}
