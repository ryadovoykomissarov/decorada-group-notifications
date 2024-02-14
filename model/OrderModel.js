import { collection, getDocs, doc, setDoc, updateDoc, getDoc } from "firebase/firestore"

export const getOrders = async (db) => {
    try {
        let result = [];
        const ordersCollection = collection(db, 'orders');
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

export const putOrder = async (db, order) => {
    const orderDoc = doc(db, 'orders/' + order.srid);
    await setDoc(orderDoc, order)
        .then(() => {
            console.log('New order added to Firestore, orders collection.');
        }).catch((error) => {
            console.error(error);
        })
}

export const updateOrder = async (db, orderId, fieldName, fieldValue) => {
    await updateDoc(doc(db, 'orders', orderId), {
        [fieldName]: fieldValue
    })
}

export const checkOrderInDatabase = async (db, orderNumber) => {
    try {
        const docRef = doc(db, "orders", orderNumber);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return true;
        } else return false;
    } catch (e) {
        console.log(e);
        return null;
    }
}

export const getOrderByOrderNumber = async (db, orderNumber) => {
    try {
        const docRef = doc(db, "orders", orderNumber);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data();
        } else return null;
    } catch (e) {
        console.log(e);
        return null;
    }
}

export const checkIfNotified = async (db, orderNumber, orderData) => {
    let order = await getOrderByOrderNumber(db, orderNumber);
    if (order !== null) {
        let notified = orderData.notified;
        if (notified !== undefined) return notified;
    }
}

export const cutNotifiedOrders = async (orders) => {
    let result = [];
    orders.forEach(order => {
        if (order.notified == false) result.push(order);
    })
    return result;
}