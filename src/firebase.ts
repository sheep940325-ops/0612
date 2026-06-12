import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  addDoc as firestoreAddDoc, 
  getDocFromServer 
} from "firebase/firestore";

// The user-provided Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCkC45MNFYmt3dzTV4ETNhlHSn7fqnn1PY",
  authDomain: "project-402184260335997740.firebaseapp.com",
  projectId: "project-402184260335997740",
  storageBucket: "project-402184260335997740.firebasestorage.app",
  messagingSenderId: "585042730499",
  appId: "1:585042730499:web:861934ebfd0345eaecf836",
  measurementId: "G-SE85P21Q5Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Connection test on initial boot
async function validateFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.error("[Firebase] Client is offline. Please check your Firebase configuration.");
    }
  }
}
validateFirestoreConnection();

// Error Handling Guidelines as per system instructions
export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error("Firestore Error Detailed: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Wrapped safe database API helpers
export async function safeGetDoc(docRef: any, pathStr: string) {
  try {
    return await getDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, pathStr);
  }
}

export async function safeGetDocs(queryRef: any, pathStr: string) {
  try {
    return await getDocs(queryRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, pathStr);
  }
}

export async function safeSetDoc(docRef: any, data: any, pathStr: string) {
  try {
    await setDoc(docRef, data);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, pathStr);
  }
}

export async function safeUpdateDoc(docRef: any, data: any, pathStr: string) {
  try {
    await updateDoc(docRef, data);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, pathStr);
  }
}

export async function safeDeleteDoc(docRef: any, pathStr: string) {
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, pathStr);
  }
}

export async function safeAddDoc(collRef: any, data: any, pathStr: string) {
  try {
    return await firestoreAddDoc(collRef, data);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, pathStr);
  }
}
