import moment from "moment";
import { getOrders, getSales } from "../controllers/WildberriesController.js";
import { checkOrderInDatabase, putOrder } from "../model/OrderModel.js";
import { dInfo } from "../utils/Logger.js";

export const listen = async (eventEmitter) => {
    setInterval(() => iterate(), 120000);

    const iterate = async () => {
        dInfo('Started iteration');
        // duplicated in index.js
        let currentDate = moment().format();
        const requestFilter = currentDate.split('T')[0];
        let marketplaceData = await getOrders(requestFilter);
        let marketplaceSales = await getSales(requestFilter);

        const processDocument = async (data) => {
            let exists = await checkOrderInDatabase(data.srid);
            if (!exists) {
                await putOrder(data);
                eventEmitter.emit('new order', data);
                dInfo('New order-type event emitted. Order srid: ' + data.srid);
            }
        }

        const processDocumentWithTimeout = async (documents) => {
            let index = 0;
            for (const data of documents) {
                index++;
                console.log(`Processing orders with timeout of 1 minute. ${index}/${documents.length}`);
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

        let mathcingSales = [];
        marketplaceSales.forEach(async (sale) => {
            if(sale.date.split('T')[0] == requestFilter) {
                mathcingSales.push(sale);
            }
        })


        await processDocumentWithTimeout(matchingOrders);
        await processSaleWithTimeout(mathcingSales);
    }

    setInterval(() => monitorDate(), 1000);

    let currentDate = moment().format().split('T')[0];

    const monitorDate = async () => {
        // dInfo('Monitoring date change...');
        const newDate = moment().format().split('T')[0];
        if(newDate !== currentDate) {
            dInfo('System date has changed. Emitting counters reset and stats report');
            let previousDate = currentDate;
            currentDate = newDate;
            
            let ordersPerDayCount = 0;
            let gross = 0;
            let marketplaceOrders = await getOrders(previousDate);
            marketplaceOrders.forEach((order) => {
                if(order.orderType == 'Клиентский' && order.date.split('T')[0]) {
                    ordersPerDayCount++;
                    gross+= order.finishedPrice;

                    if(order.isCancel == 'true' || order.isCancel == true) {
                        gross = gross-order.finishedPrice;
                    }
                }
            });

            eventEmitter.emit('daily stats', previousDate, ordersPerDayCount, gross);
        }    
    }
};