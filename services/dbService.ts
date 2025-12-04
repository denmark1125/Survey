import { db } from '../firebaseConfig';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { StudentProfile } from '../types';

const COLLECTION_NAME = 'students';

/**
 * Save a student's result to Firebase Cloud Firestore
 */
export const saveStudentResult = async (profile: StudentProfile): Promise<void> => {
  if (!db) {
    console.error("Database not initialized");
    return; // Fail gracefully
  }
  try {
    const colRef = collection(db, COLLECTION_NAME);
    // removing rawAnswers to save space if needed, or keep them if you want deep analytics
    const { id, ...dataToSave } = profile; 
    await addDoc(colRef, {
        ...dataToSave,
        createdAt: new Date().toISOString()
    });
    console.log("Document written with ID: ", profile.id);
  } catch (e) {
    console.error("Error adding document: ", e);
    // We suppress the error alert here to not scare the student if it's just a network blip,
    // but in a real app you might want a retry mechanism.
  }
};

/**
 * Fetch all students for the Teacher Dashboard
 */
export const fetchClassroomData = async (): Promise<StudentProfile[]> => {
  if (!db) {
      throw new Error("資料庫未連接");
  }
  try {
    const colRef = collection(db, COLLECTION_NAME);
    const snapshot = await getDocs(colRef);
    const students: StudentProfile[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data() as Omit<StudentProfile, 'id'>;
      students.push({ id: doc.id, ...data });
    });
    
    return students;
  } catch (e) {
    console.error("Error fetching documents: ", e);
    throw new Error("無法讀取雲端資料");
  }
};

/**
 * Clear all data (Dangerous!)
 */
export const clearDatabase = async (): Promise<void> => {
    if (!db) return;
    const colRef = collection(db, COLLECTION_NAME);
    const snapshot = await getDocs(colRef);
    const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, COLLECTION_NAME, d.id)));
    await Promise.all(deletePromises);
};