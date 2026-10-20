import {
  collection,
  doc,
  setDoc,
  updateDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  limit,
  addDoc
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';
import { Dustbin, PublicReport, SystemAlert, SensorTelemetry } from '../types/waste';

export const isFirestoreAvailable = (): boolean => {
  return isFirebaseConfigured() && Boolean(db);
};

// 1. Sync dustbin to Firestore
export async function syncDustbinToFirestore(bin: Dustbin): Promise<void> {
  if (!isFirestoreAvailable() || !db) return;
  try {
    const binRef = doc(db, 'dustbins', bin.id);
    await setDoc(binRef, {
      ...bin,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.error('Error syncing dustbin to Firestore:', err);
  }
}

// 2. Real-time listener for dustbins from Firestore
export function listenToFirestoreDustbins(onUpdate: (bins: Dustbin[]) => void): () => void {
  if (!isFirestoreAvailable() || !db) return () => {};

  try {
    const q = query(collection(db, 'dustbins'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bins: Dustbin[] = [];
      snapshot.forEach(docSnap => {
        bins.push(docSnap.data() as Dustbin);
      });
      if (bins.length > 0) {
        onUpdate(bins);
      }
    }, (error) => {
      console.warn('Firestore snapshot error:', error);
    });
    return unsubscribe;
  } catch (err) {
    console.warn('Could not attach Firestore listener:', err);
    return () => {};
  }
}

// 3. Save incoming ESP32 telemetry packet to Firestore
export async function saveTelemetryToFirestore(telemetry: SensorTelemetry): Promise<void> {
  if (!isFirestoreAvailable() || !db) return;
  try {
    await addDoc(collection(db, 'telemetry'), {
      ...telemetry,
      serverTimestamp: new Date().toISOString()
    });

    // Also update the dustbin document in Firestore
    const binRef = doc(db, 'dustbins', telemetry.dustbin_id);
    await updateDoc(binRef, {
      fillLevel: telemetry.fill_level,
      status: telemetry.status,
      lastUpdated: telemetry.timestamp
    });
  } catch (err) {
    console.error('Error saving telemetry to Firestore:', err);
  }
}

// 4. Save public report to Firestore
export async function saveReportToFirestore(report: PublicReport): Promise<void> {
  if (!isFirestoreAvailable() || !db) return;
  try {
    await setDoc(doc(db, 'reports', report.id), report);
  } catch (err) {
    console.error('Error saving report to Firestore:', err);
  }
}

// 5. Save alert to Firestore
export async function saveAlertToFirestore(alert: SystemAlert): Promise<void> {
  if (!isFirestoreAvailable() || !db) return;
  try {
    await setDoc(doc(db, 'alerts', alert.id), alert);
  } catch (err) {
    console.error('Error saving alert to Firestore:', err);
  }
}
