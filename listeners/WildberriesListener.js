import { getChangedOrdersByDate, getOrdersByDate } from "../controllers/WildberriesController.js";
import { db, eventEmmiter } from "../index.js";
import { putCancellation } from "../model/CancellationModel.js";
import { checkDocumentExists, getOrders, putOrder } from "../model/OrderModel.js";
import { getDate } from "../utils/DateTimeUtil.js";
import { dInfo } from "../utils/Logger.js";

let emitter = null;
let ordersCount = 0;
let cancellationsCount = 0;
let salesCount = 0;
let refundsCount = 0;
let dbConn = null;
let currentDate;

// Initialize the listener
export const listen = async (eventEmitter, database, ordersCount, cancellationsCount, refundsCount, salesCount) => {
    emitter = eventEmitter;
    dbConn = database;
    currentDate = await getDate();
    ordersCount = ordersCount;
    cancellationsCount = cancellationsCount;
    salesCount = salesCount;
    refundsCount = refundsCount;

    setInterval(resetCounters, 1000);
    setInterval(() => checkDataCount(getOrdersByDate, putOrder, 'new order'), 1 * 120 * 1000);
    // setInterval(() => checkDataCount(getOrdersByDate, putOrder, 'new order'), 1 * 120 * 1000);
    // Add similar setInterval calls for other data types
}

// Reset the counters and emit daily report if date changes
const resetCounters = async () => {
    let date = await getDate();
    if (date !== currentDate) {
        eventEmmiter.emit('daily report', currentDate);
        currentDate = date;
        ordersCount = 0;
        refundsCount = 0;
        salesCount = 0;
    }
}

// Check and process data count for a specific type
const checkDataCount = async (getDataByDate, putData, eventType) => {
    await dInfo('Listening circle started.');
    let dataInMarket = await getDataByDate(currentDate);
    let count = 0;

    const processDocument = async (data) => {
        let exists = await checkDocumentExists(db, 'orders', data.srid);
        if(!exists) {
            await putData(db, data);
            emitter.emit(eventType, data);
            dInfo('New order event emitted. Order srid: ' + data.srid);
            count++;
        }
    }

    const processDocumentWithTimeout = async (documents) => {
        for (const data of documents) {
            await processDocument(data);
            await new Promise(resolve => setTimeout(resolve, 60000));
        }
    };

    await processDocumentWithTimeout(dataInMarket);

    updateCount(eventType, count);
    await dInfo('Listening circle completed. New orders: ' + count);
}

// Update the count based on the processed data type
const updateCount = (eventType, count) => {
    switch (eventType) {
        case 'new order':
            ordersCount += count;
            break;
        case 'new refund':
            refundsCount += count;
            break;
        case 'new sale':
            salesCount += count;
            break;
        case 'new cancellation':
            cancellationsCount += count;
            break;
        default:
            break;
    }
}