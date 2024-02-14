import { collection, doc, getDoc, getDocs, setDoc, updateDoc } from "@firebase/firestore";

export const getDatabaseCancellations = async (db) => {
    try {
        let result = [];
        const ordersCollection = collection(db, 'cancellations');
        const ordersSnapshot = await getDocs(ordersCollection).catch((error) => console.log(error));
        ordersSnapshot.forEach(order => {
            result.push(order.data());
        })
        return result;
    } catch (e) {
        console.log(e);
        return null;
    }
}

export const putCancellation = async (db, order) => {
    const orderDoc = doc(db, 'cancellations/' + order.srid);
    await setDoc(orderDoc, order)
        .then(() => {
            console.log('New cancellation added to Firestore, orders collection.');
        }).catch((error) => {
            console.error(error);
        })
}

export const updateCancellation = async (db, orderId, fieldName, fieldValue) => {
    await updateDoc(doc(db, 'cancellations', orderId), {
        [fieldName]: fieldValue
    })
}

export const checkCancellationInDatabase = async (db, orderNumber) => {
    try {
        const docRef = doc(db, "cancellations", orderNumber);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return true;
        } else return false;
    } catch (e) {
        console.log(e);
        return null;
    }
}