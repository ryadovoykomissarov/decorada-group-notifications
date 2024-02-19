import moment from "moment";
import { getOrders } from "../controllers/WildberriesController.js";
import { checkDocumentExists, putOrder } from "../model/OrderModel.js";
import { dInfo } from "../utils/Logger.js";

export const listen = async (eventEmitter, database) => {
    setInterval(() => iterate(), 120000);

    const iterate = async () => {
        dInfo('Started iteration');
        // duplicated in index.js
        let currentDate = moment().format();
        const requestFilter = currentDate.split('T')[0];
        let marketplaceData = await getOrders(requestFilter);

        const processDocument = async (data) => {
            let exists = await checkDocumentExists(database, 'orders', data.srid);
            if (!exists) {
                await putOrder(database, data);
                eventEmitter.emit('new order', data);
                dInfo('New order event emitted. Order srid: ' + data.srid);
            }
        }

        const processDocumentWithTimeout = async (documents) => {
            for (const data of documents) {
                await processDocument(data);
                await new Promise(resolve => setTimeout(resolve, 60000));
            }
        };

        let matchingOrders = [];
        marketplaceData.forEach(async (order) => {
            if (order.date.split('T')[0] == requestFilter) {
                matchingOrders.push(order);
            }
        });

        await processDocumentWithTimeout(matchingOrders);
    }

    setInterval(() => monitorDate(), 1000);

    let currentDate = moment().format().split('T')[0];

    const monitorDate = async () => {
        const newDate = moment().format().split('T')[0];
        if(newDate !== currentDate) {
            dInfo('System date has changed. Emitting counters reset and stats report');
            let previousDate = currentDate;
            currentDate = newDate;
            
            let ordersPerDayCount = 0;
            let gross = 0;
            let marketplaceOrders = await getOrders(previousDate);
            marketplaceOrders.forEach((order) => {
                if(order.type == 'Клиентский' && order.date.split('T')[0 == previousDate] && order.isCancel !== 'true') {
                    ordersPerDayCount++;
                    gross+= order.finishedPrice;
                }
            });

            eventEmitter.emit('daily stats', previousDate, ordersPerDayCount, gross);
        }    
    }
};