// Sunucu tarafı Firebase Admin. ID token'ı doğrulamak için kullanılır.
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

export function adminAuth() {
  if (!getApps().length) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
    if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT_B64 tanımlı değil");
    const serviceAccount = JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
    initializeApp({ credential: cert(serviceAccount) });
  }
  return getAuth();
}
