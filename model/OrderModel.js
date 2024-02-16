import { collection, getDocs, doc, setDoc, updateDoc, getDoc } from "firebase/firestore"
import { getDateTime } from "../utils/DateTimeUtil.js";
import { putError, putInfo } from "./LogModel.js";

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
        await putError(await getDateTime(),'Error while fetching document from Firebase. ' + e);
        return null;
    }
}

export const putOrder = async (db, order) => {
    const orderDoc = doc(db, 'orders/' + order.srid);
    await setDoc(orderDoc, order)
        .then(async () => {
            await putInfo(await getDateTime(), 'New order added to Firestore, orders collection. Document ID: ' + order.srid);
        }).catch(async (error) => {
            await putError(await getDateTime(), 'Error while creating document in Firebase. ' + error);
        })
}

export const updateOrder = async (db, orderId, fieldName, fieldValue) => {
    await updateDoc(doc(db, 'orders', orderId), {
        [fieldName]: fieldValue
    })
}

export const checkOrderInDatabase = async (db, orderNumber) => {
    let docRef = doc(db, "orders", orderNumber);

    let res = false;
    await docRef.get().then(docSnap => {
        if(docSnap.exists()) res = true;
    })
    return res;
}

export const getOrderByOrderNumber = async (db, orderNumber) => {
    try {
        const docRef = doc(db, "orders", orderNumber);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data();
        } else return null;
    } catch (e) {
        await putError(await getDateTime(), 'Error while fetching document from Firebase. ' + e);
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