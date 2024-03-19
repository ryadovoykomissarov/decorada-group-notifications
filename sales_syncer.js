import { getSales } from "./controllers/WildberriesController.js";
import { checkOrderInDatabase, putOrder } from "./model/OrderModel.js";
import moment from "moment";

async function matchSales() {
    let currentDate = moment().format();
    const requestFilter = currentDate.split('T')[0];
    let marketplaceData = await getSales(requestFilter);

    let matchingSales = [];
    marketplaceData.forEach(async (sale) => {
        if (sale.date.split('T')[0] == requestFilter) {
            matchingSales.push(sale);
        }
    });

    await processDocumentWithTimeout(matchingSales);
};

async function processDocument(data) {
    let exists = await checkOrderInDatabase(data.srid);
    if (!exists) {
        await putOrder(data);
        process.send(data);
    }
}

async function processDocumentWithTimeout(documents) {
    for (const data of documents) {
        console.log('Processing documents with timeout on startup.')
        await processDocument(data);
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
}

await matchSales();