// İstemci (tarayıcı) tarafı Firebase. Tembel başlatılır ki build sırasında hata vermesin.
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, GithubAuthProvider, signInWithPopup } from "firebase/auth";

function getFirebaseApp() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
  return getApps().length ? getApp() : initializeApp(config);
}

async function signIn(provider) {
  const auth = getAuth(getFirebaseApp());
  const cred = await signInWithPopup(auth, provider);
  return cred.user.getIdToken();
}

/** Google popup açar, giriş yapılınca Firebase ID token döndürür. */
export function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return signIn(provider);
}

/** GitHub popup açar, giriş yapılınca Firebase ID token döndürür. */
export function signInWithGitHub() {
  const provider = new GithubAuthProvider();
  provider.addScope("user:email");
  return signIn(provider);
}
