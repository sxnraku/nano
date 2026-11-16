/**
 * Nano Verse — Cloud Functions that proxy every Gemini call.
 *
 * The Gemini API key lives only here (Secret Manager), never in the app bundle.
 * Each callable requires a signed-in user and is rate limited per user per day.
 */
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { onCall, HttpsError, type CallableRequest } from "firebase-functions/https";
import { defineSecret } from "firebase-functions/params";
import * as logger from "firebase-functions/logger";
import { GoogleGenAI } from "@google/genai";
import {
  SCAN_PROMPT,
  buildFusionPrompt,
  buildImagePrompt,
  sanitizeWarrior,
  type WarriorStyle,
  type FusionInput,
} from "./prompts.js";

initializeApp();
const db = getFirestore();

const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");

const TEXT_MODEL = "gemini-2.5-flash";
const IMAGE_MODEL = "gemini-2.5-flash-image";

/** Daily limits per user. Tune here; they are enforced server side. */
export const DAILY_LIMITS = {
  scan: 30,
  fusion: 30,
  image: 40,
} as const;
type QuotaKind = keyof typeof DAILY_LIMITS;

/** Max size of a base64 image we accept (~4 MB decoded). */
const MAX_IMAGE_BASE64_CHARS = 5_500_000;
const VALID_STYLES: WarriorStyle[] = ["Default", "Glitch", "Neon", "Cyber", "Dark", "Retro"];

const callableOpts = {
  secrets: [GEMINI_API_KEY],
  memory: "512MiB" as const,
  timeoutSeconds: 120,
  maxInstances: 20,
  // Turn on once App Check is configured in the Firebase console and the app.
  enforceAppCheck: false,
};

let ai: GoogleGenAI | null = null;
function client(): GoogleGenAI {
  if (!ai) ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY.value() });
  return ai;
}

function requireUid(req: CallableRequest): string {
  const uid = req.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Sign in required.");
  return uid;
}

/** Atomically counts a call against the user's daily quota (UTC day). */
async function consumeQuota(uid: string, kind: QuotaKind): Promise<void> {
  const day = new Date().toISOString().slice(0, 10);
  const ref = db.collection("ai_usage").doc(`${uid}_${day}`);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const used = (snap.get(kind) as number | undefined) ?? 0;
    if (used >= DAILY_LIMITS[kind]) {
      throw new HttpsError("resource-exhausted", `Daily ${kind} limit reached.`, { kind, limit: DAILY_LIMITS[kind] });
    }
    tx.set(ref, { uid, day, [kind]: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  });
}

function stripDataUrl(image: unknown): string {
  if (typeof image !== "string" || image.length === 0) {
    throw new HttpsError("invalid-argument", "image must be a base64 string.");
  }
  const base64 = image.includes(",") ? image.slice(image.indexOf(",") + 1) : image;
  if (base64.length > MAX_IMAGE_BASE64_CHARS) {
    throw new HttpsError("invalid-argument", "Image too large.");
  }
  return base64;
}

function parseJson(text: string | undefined): any {
  if (!text) throw new HttpsError("internal", "Empty AI response.");
  const clean = text.replace(/```json\n?|\n?```/g, "").trim();
  try {
    return JSON.parse(clean);
  } catch {
    throw new HttpsError("internal", "AI returned invalid JSON.");
  }
}

/** Scan: photo -> warrior metadata (no portrait). */
export const scanWarrior = onCall(callableOpts, async (req) => {
  const uid = requireUid(req);
  const image = stripDataUrl(req.data?.image);
  await consumeQuota(uid, "scan");

  try {
    const response = await client().models.generateContent({
      model: TEXT_MODEL,
      contents: { parts: [{ inlineData: { mimeType: "image/jpeg", data: image } }, { text: SCAN_PROMPT }] },
      config: { responseMimeType: "application/json" },
    });
    const data = parseJson(response.text);
    if (data?.error === "unsafe") {
      throw new HttpsError("failed-precondition", "UNSAFE_CONTENT");
    }
    return sanitizeWarrior(data);
  } catch (e) {
    if (e instanceof HttpsError) throw e;
    logger.error("scanWarrior failed", { uid, error: String(e) });
    throw new HttpsError("internal", "Scan failed.");
  }
});

/** Fusion: two warriors -> new warrior metadata (no portrait). */
export const fuseWarriors = onCall(callableOpts, async (req) => {
  const uid = requireUid(req);
  const { w1, w2, isPremium } = (req.data ?? {}) as { w1?: FusionInput; w2?: FusionInput; isPremium?: boolean };
  if (!w1 || !w2) throw new HttpsError("invalid-argument", "w1 and w2 are required.");
  await consumeQuota(uid, "fusion");

  try {
    const response = await client().models.generateContent({
      model: TEXT_MODEL,
      contents: { parts: [{ text: buildFusionPrompt(w1, w2, Boolean(isPremium)) }] },
      config: { responseMimeType: "application/json" },
    });
    return sanitizeWarrior(parseJson(response.text), { premium: Boolean(isPremium), fusion: true });
  } catch (e) {
    if (e instanceof HttpsError) throw e;
    logger.error("fuseWarriors failed", { uid, error: String(e) });
    throw new HttpsError("internal", "Fusion failed.");
  }
});

/** Portrait: visual prompt (+ optional reference photo) -> data URL image. */
export const generateWarriorImage = onCall(callableOpts, async (req) => {
  const uid = requireUid(req);
  const { visualPrompt, image, style } = (req.data ?? {}) as { visualPrompt?: unknown; image?: unknown; style?: unknown };
  if (typeof visualPrompt !== "string" || visualPrompt.length === 0 || visualPrompt.length > 4000) {
    throw new HttpsError("invalid-argument", "visualPrompt must be a string up to 4000 chars.");
  }
  const safeStyle: WarriorStyle = VALID_STYLES.includes(style as WarriorStyle) ? (style as WarriorStyle) : "Default";
  const reference = image === undefined || image === null ? undefined : stripDataUrl(image);
  await consumeQuota(uid, "image");

  const parts: any[] = [{ text: buildImagePrompt(visualPrompt, safeStyle) }];
  if (reference) parts.unshift({ inlineData: { mimeType: "image/jpeg", data: reference } });

  try {
    const response = await client().models.generateContent({ model: IMAGE_MODEL, contents: { parts } });
    for (const part of response.candidates?.[0]?.content?.parts ?? []) {
      if (part.inlineData?.data) {
        return { imageUrl: `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}` };
      }
    }
    throw new HttpsError("internal", "No image data in AI response.");
  } catch (e) {
    if (e instanceof HttpsError) throw e;
    logger.error("generateWarriorImage failed", { uid, error: String(e) });
    throw new HttpsError("internal", "Image generation failed.");
  }
});
