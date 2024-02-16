import { getCancellationsByDate, getOrdersByDate, getRefundsByDate, getSalesByDate } from "../controllers/WildberriesController.js";
import { db } from "../index.js";
import { checkCancellationInDatabase, putCancellation } from "../model/CancellationModel.js";
import { checkOrderInDatabase, putOrder } from "../model/OrderModel.js";
import { checkRefundInDatabase, putRefund } from "../model/RefundModel.js";
import { checkSalesInDatabase, putSale } from "../model/SalesModel.js";
import { getDate } from "../utils/DateTimeUtil.js";

export let emitter = null;
let ordersCount = 0;
let cancellationsCount = 0;
let salesCount = 0;
let refundsCount = 0;
let dbConn = null;
let currentDate;

export const listen = async (eventEmmiter, db, todayOrdersInMarketCount, todayCancellationsInMarketCount, todayRefundsInMarketCount, todaySalesInMarketCount) => {
    emitter = eventEmmiter;
    dbConn = db;
    currentDate = await getDate();
    ordersCount = todayOrdersInMarketCount;
    refundsCount = todayRefundsInMarketCount;
    cancellationsCount = todayCancellationsInMarketCount;
    salesCount = todaySalesInMarketCount;
    
    setInterval(resetOrdersCounters, 1000);
    setInterval(checkOrdersCount, 60*15*1000);
    // setInterval(checkCancellationsCount, 60*15*1000);
    // setInterval(checkSalesCount, 60*15*1000);
    // setInterval(checkRefundsCount, 30000);
}

const resetOrdersCounters = async () => {
    let date = await getDate()
    if(date!=currentDate) {
        currentDate = date;
        ordersCount = 0;
        refundsCount = 0;
        salesCount = 0;
    }
}

const checkOrdersCount = async () => {
    let todayInMarket =  await getOrdersByDate(currentDate);
    todayInMarket.forEach(async (order) => {
        let isInDatabase = await checkOrderInDatabase(dbConn, order.srid);
        if(!isInDatabase && isInDatabase!==null) {
            await putOrder(dbConn, order).then(() => {
                console.log('Order added to database. Id: ' + order.srid);
                emitter.emit('new order', order);
            }).catch(e => {
                console.log(e);
            });
            ordersCount++;
        }
    })
}

const checkCancellationsCount = async () => {
    let todayInMarket =  await getCancellationsByDate(currentDate);
    todayInMarket.forEach(async (order) => {
        let isInDatabase = await checkCancellationInDatabase(dbConn, order.srid);
        if(!isInDatabase && isInDatabase!==null) {
            await putCancellation(dbConn, order).then(() => {
                console.log('Cancellation added to database. Id: ' + order.srid);
                emitter.emit('new cancellation', order);
            }).catch(e => {
                console.log(e);
            });
            cancellationsCount++;
        }
    })
}

const checkSalesCount = async () => {
    let todayInMarket =  await getSalesByDate(currentDate);
    todayInMarket.forEach(async (order) => {
        let isInDatabase = await checkSalesInDatabase(dbConn, order.srid);
        if(!isInDatabase && isInDatabase!==null) {
            await putSale(dbConn, order).then(() => {
                console.log('Sale added to database. Id: ' + order.srid);
                emitter.emit('new sale', order);
            }).catch(e => {
                console.log(e);
            });
            salesCount++;
        }
    })
}

const checkRefundsCount = async () => {
    let todayInMarket =  await getRefundsByDate(currentDate);
    todayInMarket.forEach(async (order) => {
        let isInDatabase = await checkRefundInDatabase(db, order.srid);
        if(!isInDatabase && isInDatabase!==null) {
            await putRefund(db, order).then(() => {
                console.log('Refund added to database. Id: ' + order.srid);
                emitter.emit('new refund', order);
            }).catch(e => {
                console.log(e);
            });
            refundsCount++;
        }
    })
}