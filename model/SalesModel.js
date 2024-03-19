import { collection, doc, getDoc, getDocs, setDoc, updateDoc } from "@firebase/firestore";

export const getSales = async (db) => {
    try {
        let result = [];
        const salesCollection = collection(db, 'sales');
        const salesSnapshot = await getDocs(salesCollection).catch((error) => console.log(error));
        salesSnapshot.forEach(async (order) => {
            await salesCache.set(order.data().srid, order.data());
            await dInfo(`Populated sales cache with document ${order.data().srid}.`);
            result.push(order.data());
        })
        return result;
    } catch (e) {
        console.log(e);
        return null;
    }
}

export const putSale = async (db, order) => {
    const saleDoc = doc(db, 'sales/' + order.srid);
    await setDoc(saleDoc, order)
        .then(() => {
            console.log('New sale added to Firestore, orders collection.');
        }).catch((error) => {
            console.error(error);
        })
}

export const updateSale = async (db, orderId, fieldName, fieldValue) => {
    await updateDoc(doc(db, 'sales', orderId), {
        [fieldName]: fieldValue
    })
}

export const checkSalesInDatabase = async (db, orderNumber) => {
    try {
        const docRef = doc(db, "sales", orderNumber);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return true;
        } else return false;
    } catch (e) {
        console.log(e);
        return null;
    }
}