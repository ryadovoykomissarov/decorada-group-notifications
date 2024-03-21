import { getSales } from "./controllers/WildberriesController.js";
import { checkOrderInDatabase, putOrder } from "./model/OrderModel.js";
import moment from "moment";

async function matchSales() {
    console.log('PID: ' + process.pid + ' - started matchSales()')
    let currentDate = moment().format();
    const requestFilter = currentDate.split('T')[0];
    let marketplaceData = await getSales(requestFilter);

    let matchingSales = [];
    marketplaceData.forEach(async (sale) => {
        if (sale.date.split('T')[0] == requestFilter) {
            matchingSales.push(sale);
        }
    });

    console.log('PID: ' + process.pid + ' - sales matching will be performed for instances: ' + matchSales.length)
    await processDocumentWithTimeout(matchingSales);
};

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

console.log('Sales Syncer started. PID: ' + process.pid);
await matchSales();