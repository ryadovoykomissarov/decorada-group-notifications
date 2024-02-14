import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

export const initializeConnection = async (dbConfig) => {
    const app = initializeApp(dbConfig);
    return getFirestore(app);
}