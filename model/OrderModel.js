import { collection, getDocs, doc, setDoc, updateDoc, getDoc, query, where } from "firebase/firestore"
import { getDate, getDateTime, shortenUtc } from "../utils/DateTimeUtil.js";
import { putError, putInfo } from "./LogModel.js";
import { dError, dWarn } from "../utils/Logger.js";

export const checkDocumentExists = async (db, collectionName, id) => {
    try{
        const docRef = doc(collection(db, collectionName), id);
        const docSnap = await getDoc(docRef);
        return docSnap.exists;
    } catch (error) {
        dError('Error checking document existence: ' + error);
        return false;
    }
}

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
        await putError(await getDateTime(), 'Error while fetching document from Firebase. ' + e);
        return null;
    }
}

export const getOrdersByDate = async (db, date) => {
    try {
        let result = [];
        let orders = await getOrders(db);
        orders.forEach(order => {
            let orderDate = order.date;
            if (orderDate) {
                orderDate = shortenUtc(orderDate);
                if (orderDate == date) {
                    result.push(order)
                }
            }
        })
        return result;
    } catch (e) {
        await putError(await getDateTime(), 'Error while filtering orders by date. ' + e);
        return resul;
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
        if (docSnap.exists()) res = true;
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