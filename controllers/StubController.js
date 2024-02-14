import axios from "axios";
import { shortenUtc } from "../utils/DateTimeUtil.js";
import { getRefunds } from "../model/RefundModel.js";

//econnreset handling
export const getOrders = async () => {
    let orders;
    await axios.get('http://localhost:3000' + '/orders')
        .then(function (response) {
            orders = response.data;
        }).catch((error) => {
            console.error(error);
        });
    return orders;
}

export const getOrdersByDate = async (date) => {
    let result = [];
    let orders = await getOrders();
    orders.forEach(async order => {
        let orderDate = shortenUtc(order.date);
        let orderType = order.orderType;
        if (orderDate == date && orderType == 'Клиентский') result.push(order);
    });
    return result;
}

export const getCancellationsByDate = async (date) => {
    let result = [];
    let orders = await getOrders();
    orders.forEach(async order => {
        let orderDate = shortenUtc(order.date);
        let orderType = order.orderType;
        if (orderDate == date && orderType !== 'Клиентский') result.push(order);
    });
    return result;
}

export const getSalesByDate = async (date) => {
    let result = [];
    let sales = await getSales();
    sales.forEach(async sale => {
        let orderDate = shortenUtc(sale.date);
        let orderType = sale.orderType;
        if (orderDate == date && orderType == 'Клиентский') result.push(sale);
    });
    return result;
}

export const getSales = async () => {
    let sales;
    await axios.get('http://localhost:3000/sales')
        .then(function (response) {
            sales = response.data;
        }).catch((error) => {
            console.error(error);
        });
    return sales;
}

export const getRefundsByDate = async (date) => {
    let result = [];
    let refunds = await getRefunds();
    refunds.forEach(async refund => {
        let orderDate = shortenUtc(refund.date);
        let orderType = refund.orderType;
        if (orderDate == date && orderType !== 'Клиентский') result.push(refund);
    });
    return result;
}