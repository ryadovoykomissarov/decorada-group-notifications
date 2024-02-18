import { getOrdersByDate } from "../model/OrderModel.js";
import { db } from "../index.js";

export const countDailyStats = async (date) => {
    let savedOrders = await getOrdersByDate(db, date);
    let totalFinishedPrice = 0;

    savedOrders.forEach(order => {
        totalFinishedPrice += calculateTotalFinishedPrice(order);
    });

    savedOrders.forEach(order => {
        totalFinishedPrice = adjustTotalFinishedPrice(order, totalFinishedPrice);
    });

    return {
        reportDate: date,
        orders: savedOrders.length,
        finishedPrice: totalFinishedPrice
    };
}

const calculateTotalFinishedPrice = (order) => {
    let finishedPrice = parseFloat(order.finishedPrice);
    return finishedPrice;
}

const adjustTotalFinishedPrice = (order, totalFinishedPrice) => {
    let isCancel;
    if (order.isCancel!==undefined && typeof(order.isCancel) !== 'boolean') {
        isCancel = order.isCancel.toLowerCase() === 'true';
    } else if (order.isCancel !== undefined) {
        isCancel = order.isCancel;
    }

    if (isCancel) {
        let finishePrice = parseFloat(order.finishePrice);
        totalFinishedPrice -= finishePrice;
    }

    return totalFinishedPrice;
}