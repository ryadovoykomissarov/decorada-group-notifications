import { collection, doc, getDoc, getDocs, setDoc, updateDoc } from "@firebase/firestore";

export const getRefunds = async (db) => {
    try {
        let result = [];
        const refundsCollection = collection(db, 'refunds');
        const refundsSnapshot = await getDocs(refundsCollection).catch((error) => console.log(error));
        refundsSnapshot.forEach(refund => {
            result.push(refund.data());
        })
        return result;
    } catch (e) {
        console.log(e);
        return null;
    }
}

export const putRefund = async (db, order) => {
    const refundDoc = doc(db, 'refunds/' + order.srid);
    await setDoc(refundDoc, order)
        .then(() => {
            console.log('New refund added to Firestore, orders collection.');
        }).catch((error) => {
            console.error(error);
        })
}

export const updateRefund = async (db, orderId, fieldName, fieldValue) => {
    await updateDoc(doc(db, 'refunds', orderId), {
        [fieldName]: fieldValue
    })
}

export const checkRefundInDatabase = async (db, orderNumber) => {
    try {
        const docRef = doc(db, "refunds", orderNumber);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return true;
        } else return false;
    } catch (e) {
        console.log(e);
        return null;
    }
}