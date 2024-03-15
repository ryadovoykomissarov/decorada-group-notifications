import { shortenUtc } from "../utils/DateTimeUtil.js";
import { ordersStorage, ordersWithDatesViewUri } from "../couchdb.js";
import axios from "axios";

export const getOrders = async () => {
    let database = ordersStorage;
    let result = [];
    const docsList = await database.list().then((body) => {
        body.rows.forEach((doc) => {
            result.push(doc);
        })
    });
    return result;
}

export const filterOrdersByDateViewResult = async (date) => {
    let uri = ordersWithDatesViewUri;
    const res = await axios.get(uri);

    let ids = [];

    for (let row of res.data.rows) {
        let utcDate = row.value;
        let id = row.id;
        let shortDate = shortenUtc(utcDate);
        if (shortDate == date) ids.push(id); 
    }

    let result = [];
    for (let id of ids) {
        result.push(await getOrderById(id));
    }

    return result;
}

export const getOrderById = async (id) => {
    let database = ordersStorage;
    return await database.get(id);
}

export const getOrdersByDate = async (date) => {
    let result = [];
    let orders = await getOrders();
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
}

export const getOrdersInPeriod = async (dates) => {
    let result = [];
    let orders = await getOrders();
    orders.forEach(order => {
        let orderDate = order.date;
        if (orderDate) {
            orderDate = shortenUtc(orderDate);
            dates.forEach(requiredDate => {
                if (orderDate == requiredDate) {
                    result.push(order)
                }
            })
        }
    })
    return result;
}

export const putOrder = async (order) => {
    let database = ordersStorage;
    order._id = order.srid;
    const response = await database.insert(order).catch((e) => console.error(e));
}

export const updateOrder = async (orderId, fieldName, fieldValue) => {
    let database = ordersStorage;
    let lastOrderRev = await getOrderByOrderNumber(orderId);
    lastOrderRev[fieldName] = fieldValue;
    const response = await database.insert(lastOrderRev).catch((e) => console.log('error' + e));;
}

export const checkOrderInDatabase = async (orderNumber) => {
    let database = ordersStorage;
    let result = await database.head(orderNumber).catch((e) => console.log('Order with number ' + orderNumber + ' is missing'));
    if(result && result.statusCode == 200) {
        return true;
    } else return false;
}

export const getOrderByOrderNumber = async (orderNumber) => {
    let database = ordersStorage;
    if (await checkOrderInDatabase(orderNumber)) {
        return await database.get(orderNumber);
    } else return null;
}

export const checkIfNotified = async (orderNumber) => {
    let order = await getOrderByOrderNumber(orderNumber);
    if (order !== null) {
        let notified = order.notified;
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