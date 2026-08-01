import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  Firestore
} from 'firebase/firestore';
import { Teacher, WorkScheduleDay, AttendanceLog } from '../types';
import { INITIAL_TEACHERS, DEFAULT_SCHEDULE, INITIAL_LOGS } from '../data/initialData';
import firebaseConfigJson from '../../firebase-applet-config.json';

// Safe environment variable accessor
const env = (import.meta as unknown as { env?: Record<string, string> }).env || {};

const firebaseConfig = {
  apiKey: firebaseConfigJson?.apiKey || env.VITE_FIREBASE_API_KEY || "AIzaSy_demo_key_placeholder",
  authDomain: firebaseConfigJson?.authDomain || env.VITE_FIREBASE_AUTH_DOMAIN || "mi-al-ihsan-soborejo.firebaseapp.com",
  projectId: firebaseConfigJson?.projectId || env.VITE_FIREBASE_PROJECT_ID || "mi-al-ihsan-soborejo",
  storageBucket: firebaseConfigJson?.storageBucket || env.VITE_FIREBASE_STORAGE_BUCKET || "mi-al-ihsan-soborejo.appspot.com",
  messagingSenderId: firebaseConfigJson?.messagingSenderId || env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: firebaseConfigJson?.appId || env.VITE_FIREBASE_APP_ID || "1:1234567890:web:abcdef123456"
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  const dbId = firebaseConfigJson?.firestoreDatabaseId;
  if (dbId && dbId !== '(default)') {
    db = getFirestore(app, dbId);
  } else {
    db = getFirestore(app);
  }
} catch (e) {
  console.warn("Firebase initialization warning:", e);
}

export { db };

/**
 * Real-time listener for attendance logs from Firestore
 */
export function subscribeAttendanceLogs(
  onUpdate: (logs: AttendanceLog[]) => void,
  onError?: (err: Error) => void
) {
  if (!db) return () => {};

  try {
    const logsCol = collection(db, 'attendance_logs');
    return onSnapshot(
      logsCol,
      (snapshot) => {
        if (snapshot.empty) {
          // Auto-seed initial logs if Firestore collection is empty
          INITIAL_LOGS.forEach((log) => {
            syncLogToFirestore(log);
          });
          onUpdate(INITIAL_LOGS);
          return;
        }

        const logs: AttendanceLog[] = [];
        snapshot.forEach((docSnap) => {
          logs.push(docSnap.data() as AttendanceLog);
        });
        // Sort descending by date & time
        logs.sort((a, b) => {
          if (a.date !== b.date) return b.date.localeCompare(a.date);
          return b.time.localeCompare(a.time);
        });
        onUpdate(logs);
      },
      (error) => {
        console.error("Firestore logs listener error:", error);
        if (onError) onError(error);
      }
    );
  } catch (e) {
    console.error("Failed to setup logs listener:", e);
    return () => {};
  }
}

/**
 * Real-time listener for teachers list from Firestore
 */
export function subscribeTeachers(
  onUpdate: (teachers: Teacher[]) => void
) {
  if (!db) return () => {};

  try {
    const teachersCol = collection(db, 'teachers');
    return onSnapshot(
      teachersCol,
      (snapshot) => {
        if (snapshot.empty) {
          // Auto-seed initial teachers if Firestore collection is empty
          syncTeachersToFirestore(INITIAL_TEACHERS);
          onUpdate(INITIAL_TEACHERS);
          return;
        }

        const teachers: Teacher[] = [];
        snapshot.forEach((docSnap) => {
          teachers.push(docSnap.data() as Teacher);
        });
        teachers.sort((a, b) => Number(a.id) - Number(b.id));
        onUpdate(teachers);
      },
      (error) => {
        console.error("Firestore teachers listener error:", error);
      }
    );
  } catch (e) {
    console.error("Failed to setup teachers listener:", e);
    return () => {};
  }
}

/**
 * Real-time listener for work schedule from Firestore
 */
export function subscribeSchedule(
  onUpdate: (schedule: WorkScheduleDay[]) => void
) {
  if (!db) return () => {};

  try {
    const scheduleCol = collection(db, 'schedule');
    return onSnapshot(
      scheduleCol,
      (snapshot) => {
        if (snapshot.empty) {
          // Auto-seed default schedule if Firestore collection is empty
          syncScheduleToFirestore(DEFAULT_SCHEDULE);
          onUpdate(DEFAULT_SCHEDULE);
          return;
        }

        const sched: WorkScheduleDay[] = [];
        snapshot.forEach((docSnap) => {
          sched.push(docSnap.data() as WorkScheduleDay);
        });
        const dayOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
        sched.sort((a, b) => dayOrder.indexOf(a.hari) - dayOrder.indexOf(b.hari));
        onUpdate(sched);
      },
      (error) => {
        console.error("Firestore schedule listener error:", error);
      }
    );
  } catch (e) {
    console.error("Failed to setup schedule listener:", e);
    return () => {};
  }
}

/**
 * Save single attendance log doc to Firestore
 */
export async function syncLogToFirestore(log: AttendanceLog): Promise<void> {
  if (!db) return;
  try {
    const docRef = doc(db, 'attendance_logs', String(log.id));
    await setDoc(docRef, log, { merge: true });
  } catch (err) {
    console.warn("Firestore sync log error:", err);
  }
}

/**
 * Delete attendance log from Firestore
 */
export async function deleteLogFromFirestore(logId: string): Promise<void> {
  if (!db) return;
  try {
    const docRef = doc(db, 'attendance_logs', String(logId));
    await deleteDoc(docRef);
  } catch (err) {
    console.warn("Firestore delete log error:", err);
  }
}

/**
 * Save teachers list to Firestore
 */
export async function syncTeachersToFirestore(teachers: Teacher[]): Promise<void> {
  if (!db) return;
  try {
    for (const t of teachers) {
      const docRef = doc(db, 'teachers', String(t.id));
      await setDoc(docRef, t, { merge: true });
    }
  } catch (err) {
    console.warn("Firestore sync teachers error:", err);
  }
}

/**
 * Save single teacher to Firestore
 */
export async function syncTeacherToFirestore(teacher: Teacher): Promise<void> {
  if (!db) return;
  try {
    const docRef = doc(db, 'teachers', String(teacher.id));
    await setDoc(docRef, teacher, { merge: true });
  } catch (err) {
    console.warn("Firestore sync single teacher error:", err);
  }
}

/**
 * Delete teacher from Firestore
 */
export async function deleteTeacherFromFirestore(teacherId: string): Promise<void> {
  if (!db) return;
  try {
    const docRef = doc(db, 'teachers', String(teacherId));
    await deleteDoc(docRef);
  } catch (err) {
    console.warn("Firestore delete teacher error:", err);
  }
}

/**
 * Save work schedule to Firestore
 */
export async function syncScheduleToFirestore(schedule: WorkScheduleDay[]): Promise<void> {
  if (!db) return;
  try {
    for (const s of schedule) {
      const docRef = doc(db, 'schedule', String(s.hari));
      await setDoc(docRef, s, { merge: true });
    }
  } catch (err) {
    console.warn("Firestore sync schedule error:", err);
  }
}

