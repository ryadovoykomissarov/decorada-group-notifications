import { getOrdersByDate} from "../model/OrderModel.js";
import { getStocksByArticle } from "../controllers/WildberriesController.js";

const statsRange = 5;

export const countDailyStats = async (date) => {
    let savedOrders = await getOrdersByDate(date);
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

export const countStocks = async (date, article) => {
    let stockInformation = await getStocksByArticle(date, article);
    return stockInformation.length;
    // let datesRange = [];
    // let splittedDate = date.split('.');

    // for(let i = 0; i < statsRange; i++) {
        // let day = parseInt(splittedDate[0]) - (statsRange-i);
        // let date = day+'.'+splittedDate[1]+splittedDate[2];
        // datesRange.push(date);
    // }

    // let ordersInRange = await getOrdersInPeriod(db, datesRange);

} 
const countStatsByProducts = async (date) => {
    const savedOrders = await getOrdersByDate(date);
    const uniqueArticles = new Set(savedOrders.map(order => order.nmId));
    
    const toReturn = [];
    uniqueArticles.forEach(article => {
        // const product = await getPro
        const count = savedOrders.filter(order => order.nmId === article).length;
        if (count > 0) {
            toReturn.push({ orderArticle: article, orderCount: count });
        }
    });

    return toReturn;
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