import { getOrders } from "./controllers/WildberriesController.js";
import { checkOrderInDatabase, putOrder } from "./model/OrderModel.js";
import moment from "moment";

async function matchOrders() {
    console.log('PID: ' + process.pid + ' - started matchOrders()')
    let currentDate = moment().format();
    const requestFilter = currentDate.split('T')[0];
    let marketplaceData = await getOrders(requestFilter);

    let matchingOrders = [];
    marketplaceData.forEach(async (order) => {
        if (order.date.split('T')[0] == requestFilter) {
            matchingOrders.push(order);
        }
    });

    console.log('PID: ' + process.pid + ' - orders matching will be performed for instances: ' + matchOrders.length)
    await processDocumentWithTimeout(matchingOrders);
}

async function processDocument(data) {
    console.log('PID: ' + process.pid + ' - started processDocument()')
    let exists = await checkOrderInDatabase(data.srid);
    if (!exists) {
        await putOrder(data);
        process.send(data);
    }
}

async function processDocumentWithTimeout(documents) {
    console.log('PID: ' + process.pid + ' - started processDocumentWithTimeout()')
    for (const data of documents) {
        console.log('PID: ' + process.pid + ' - Processing documents with timeout on startup.')
        await processDocument(data);
        console.log('PID: ' + process.pid + '- Sleeping for 5 seconds')
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
}
console.log('Orders Syncer started. PID: ' + process.pid);
await matchOrders();