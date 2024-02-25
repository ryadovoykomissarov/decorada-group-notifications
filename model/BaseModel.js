import { collection, doc, getDoc } from "firebase/firestore";
import { dError } from "../utils/Logger";

export const checkDocumentExists = async (db, collectionName, id) => {
    try{
        const docRef = doc(collection(db, collectionName), id);
        const docSnap = await getDoc(docRef);
        return docSnap.exists(); 
    } catch (error) {
        dError('Error checking document existence: ' + error);
        return false;
    }
}