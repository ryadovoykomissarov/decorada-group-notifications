import { getOrders as getMarketplaceOrders, getSales as getMarketplaceSales } from "./controllers/StubController.js";
import { checkOrderInDatabase, putOrder, updateOrder } from "./model/OrderModel.js"; 
import { getDate, shortenUtc } from "./utils/DateTimeUtil.js";
import { initializeConnection } from "./firebase.js";
import { listen as listenStub } from "./listeners/StubListener.js";
import { getProductPictureByArticle } from "./model/ProductModel.js";
import { formCancellationMessage, formOrdersMessage, formSalesMessage } from "./utils/MessagesUtil.js";
import { checkCancellationInDatabase, putCancellation } from "./model/CancellationModel.js";
import { checkSalesInDatabase, putSale, updateSale } from "./model/SalesModel.js";
import { EventEmitter } from "events";

import { Telegraf } from "telegraf";
import { checkRefundInDatabase, putRefund } from "./model/RefundModel.js";
import { config } from "process";
import axios from "axios";

let bot_token = '6778620514:AAEV8vgFtR2usuNpyhnTOFMzp6_lx--NbEA';
const bot = new Telegraf(bot_token);

let todayOrdersInMarket = 0;
let todayCancelledInMarket = 0;
let todayRefundsInMarket = 0;
let todaySalesInMarket = 0;
let ordersIndexes = [];
let cancellationIndexes = [];
let salesIndexes = [];
let refundsIndexes = [];

const firebaseConfig = {
    "apiKey": 'AIzaSyBk-I4ITevoHDyQQmve99RbudflNE60qqA',
    "authDomain": 'decorada-bot-dev.firebaseapp.com',
    "projectId": 'decorada-bot-dev',
    "storageBucket": 'decorada-bot-dev.appspot.com',
    "messagingSenderId": '864697005920',
    "appId": '1:864697005920:web:6d0fa4eb3b53972d9fd005'
};

export const eventEmmiter = new EventEmitter();

export const db = await initializeConnection(firebaseConfig);

async function init() {
    console.log('Matching data on order startup');
    await matchData();
    console.log('Data has been matched, starting listeners');
}

async function matchData() {
    await matchOrders();
    await matchCancelled();
    await matchSales();
    await matchRefunds();
}

async function matchOrders() {
    let marketplaceOrders = await getOrdersByTypeFromStub('Клиентский');
    todayOrdersInMarket = await countTodayOrdersInMarket(marketplaceOrders, 'Клиентский');

    let newOrders = [];
    marketplaceOrders.forEach(async order => {
        let exists = await checkOrderInDatabase(db, order.srid);
        if (exists) newOrders.push(order);
    })

    newOrders.forEach(async order => {
        await sendNotification("Заказ - Клиентский", order);
        await putOrder(db, order);
        await updateOrder(db, order.srid, 'notified', true);
    });

    
    // let databaseOrdersIds = await getOrdersByTypeFromDb('Клиентский');
    // не цепляет новые заказы
    // let newOrders = await compareAndPutNewOrders(ordersIndexes, marketplaceOrders, databaseOrdersIds);

    // newOrders.forEach(async (order) => {
    //     await sendNotification("Заказ - Клиентский", order);
    //     await updateOrder(db, order.srid, 'notified', true);
    // })
}

async function matchCancelled() {
    let marketplaceOrders = await getOrdersByTypeFromStub('Отмена');
    todayCancelledInMarket = await countTodayOrdersInMarket(marketplaceOrders, 'Отмена');

    let newOrders = [];
    marketplaceOrders.forEach(async order => {
        let exists = await checkCancellationInDatabase(db, order.srid);
        if (exists) newOrders.push(order);
    });

    newOrders.forEach(async order => {
        await sendNotification('Заказ - Отмена', order);
        await updateOrder(db. order.srid, 'notified', true);
        await putCancellation(db, order);
    });
}

async function matchSales() {
    let marketplaceSales = await getSalesByTypeFromStub('Клиентский');
    todaySalesInMarket = await countTodaySalesInMarket(marketplaceSales, 'Клиентский');

    let newSales = [];
    marketplaceSales.forEach(async (sale) => {
        let exists = await checkSalesInDatabase(db, sale.srid);
        if (exists) newSales.push(sale)
    });

    newSales.forEach(async (sale) => {
        await sendNotification("Продажа - Клиентский", sale)
        await updateSale(db, sale.srid, 'notified', true);
        await putSale(db, sale);
    })
}

async function matchRefunds() {
    let marketplaceSales = await getSalesByTypeFromStub('Возврат');
    todaySalesInMarket = await countTodaySalesInMarket(marketplaceSales, 'Возврат');

    let newSales = [];
    marketplaceSales.forEach(async (sale) => {
        let exists = await checkRefundInDatabase(db, sale.srid);
        if (exists) newSales.push(sale);
    })

    newSales.forEach(async (sale) => {
        await sendNotification("Продажа - Возврат", sale)
        await updateSale(db, sale.srid, 'notified', true);
        await putRefund(db, sale);
    })
}

async function getOrdersByTypeFromStub(type) {
    let marketplaceOrders = await getMarketplaceOrders();

    if (type == 'Клиентский') {
        let orders = [];
        marketplaceOrders.forEach(order => {
            if (order.orderType == 'Клиентский') {
                orders.push(order);
            }
        })

        return orders;
    } else {
        let orders = [];
        marketplaceOrders.forEach(order => {
            if (order.orderType !== 'Клиентский') {
                orders.push(order);
            }
        })

        return orders;
    }
}

async function getSalesByTypeFromStub(type) {
    let marketplaceSales = await getMarketplaceSales()
    if (type == 'Клиентский') {
        let sales = [];
        marketplaceSales.forEach(sale => {
            if (sale.orderType == 'Клиентский') {
                sales.push(sale);
            }
        })
        return sales;
    } else {
        let sales = [];
        marketplaceSales.forEach(sale => {
            if (sale.orderType !== 'Клиентский') {
                sales.push(sale);
            }
        })
        return sales;
    }
}

async function countTodaySalesInMarket(marketplaceSales, type) {
    let currentDate = await getDate();

    if (type == 'Клиентский') {
        let res = 0;
        marketplaceSales.forEach(async (order, index) => {
            let orderDate = shortenUtc(order.date);
            if (orderDate == currentDate) {
                if (order.orderType == 'Клиентский') {
                    todaySalesInMarket++;
                    salesIndexes.push(index);
                }
            }
        });
        return res;
    } else {
        let res = 0;
        marketplaceSales.forEach(async (order, index) => {
            let orderDate = shortenUtc(order.date);
            if (orderDate == currentDate) {
                if (order.orderType !== 'Клиентский') {
                    todaySalesInMarket++;
                    refundsIndexes.push(index);
                }
            }
        });
        return res;
    }
}

async function countTodayOrdersInMarket(marketplaceOrders, type) {
    let currentDate = await getDate();

    if (type == 'Клиентский') {
        let res = 0;
        marketplaceOrders.forEach(async (order, index) => {
            let orderDate = shortenUtc(order.date);
            if (orderDate == currentDate) {
                if (order.orderType == 'Клиентский') {
                    ordersIndexes.push(index);
                    res++;
                }
            }
        });
        return res;
    } else {
        let res = 0;
        marketplaceOrders.forEach(async (order, index) => {
            let orderDate = shortenUtc(order.date);
            if (orderDate == currentDate) {
                if (order.orderType !== 'Клиентский') {
                    todayOrdersInMarket++;
                    cancellationIndexes.push(index);
                }
            }
        });
        return res;
    }
}

// async function getOrdersByTypeFromDb(type) {
//     if (type == 'Клиентский') {
//         let databaseOrdersIds = [];
//         let databaseOrders = await getDatabaseOrders(db);

//         databaseOrders.forEach(order => {
//             if (order.orderType == 'Клиентский') databaseOrdersIds.push(order.srid);
//         });
//         return databaseOrdersIds;
//     } else {
//         let databaseOrdersIds = [];
//         let databaseOrders = await getDatabaseCancellations(db);

//         databaseOrders.forEach(order => {
//             if (order.orderType !== 'Клиентский') databaseOrdersIds.push(order.srid);
//         });
//         return databaseOrdersIds;
//     }
// }

// async function getSalesByTypeFromDb(type) {
//     if (type == 'Клиентский') {
//         let databaseSalesIds = [];
//         let databaseSales = await getDatabaseSales(db);

//         databaseSales.forEach(sale => {
//             if (sale.orderType == 'Клиентский') databaseSalesIds.push(sale.srid);
//         });
//         return databaseSalesIds;
//     } else {
//         let databaseSalesIds = [];
//         let databaseSales = await getDatabaseSales(db);

//         databaseSales.forEach(sale => {
//             if (sale.orderType !== 'Клиентский') databaseSalesIds.push(sale.srid);
//         });
//         return databaseSales;
//     }
// }

// async function compareAndPutNewOrders(ordersIndexes, marketplaceOrders, databaseOrdersIds) {
//     let res = [];
//     ordersIndexes.forEach(async i => {
//         let mpOrder = marketplaceOrders[i+1];
//         if (!databaseOrdersIds.includes(mpOrder.srid)) {
//             await putOrder(db, mpOrder);
//             res.push(mpOrder);
//         };
//     });
//     return res;
// }

// async function compareAndPutNewCancellations(cancellationsIndexes, marketplaceCancellation, databaseCancellationIds) {
//     cancellationsIndexes.forEach(async i => {
//         let mpOrder = marketplaceCancellation[i];
//         if (!databaseCancellationIds.includes(mpOrder.srid)) {
//             await putCancellation(db, mpOrder);
//         };
//     });
// }

// async function compareAndPutNewSales(salesIndexes, marketplaceSales, databaseSalesIds) {
//     salesIndexes.forEach(async i => {
//         let mpSale = marketplaceSales[i];
//         if (!databaseSalesIds.includes(mpSale.srid)) {
//             await putSale(db, mpSale);
//         };
//     });
// }

// async function compareAndPutNewRefunds(refundsIndexes, marketplaceRefund, databaseRefundsIds) {
//     refundsIndexes.forEach(async i => {
//         let mpSale = marketplaceRefund[i];
//         if (!databaseRefundsIds.includes(mpSale.srid)) {
//             await putRefund(db, mpSale);
//         };
//     });
// }

async function sendNotification(type, order) {
    let message = await getMessageByType(type, order);
    let pictureLink = await getProductPictureByArticle(order.supplierArticle);


    let botLink = `https://api.telegram.org/bot6778620514:AAEV8vgFtR2usuNpyhnTOFMzp6_lx--NbEA/sendPhoto`;
    const { data } = await axios.post(botLink, {
        chat_id: '702801778',
        photo: pictureLink,
        caption: message,
        parse_mode: 'HTML'
    }, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });

    console.log(data);
}

async function getMessageByType(type, order) {
    switch (type) {
        case 'Заказ - Клиентский':
            return await formOrdersMessage(order);
        case 'Заказ - Отмена':
            return await formCancellationMessage(order);
        case 'Продажа - Клиентский':
            return await formSalesMessage(order);
        case 'Продажа - Возврат':
            return await formRefundMessage(order);
    }
}

async function startListeners() {
    console.log('Starting listener: Stub');
    await listenStub(eventEmmiter, db, todayOrdersInMarket, todayCancelledInMarket, todayRefundsInMarket, todaySalesInMarket);
}

eventEmmiter.on('new order', async function (order) {
    await sendNotification('Заказ - Клиентский', order);
    await updateOrder(db, order.srid, 'notified', true);
});

eventEmmiter.on('new cancellation', async function (order) {
    await sendNotification('Заказ - Отмена', order);
    await updateOrder(db, order.srid, 'notified', true);
});

eventEmmiter.on('new sale', async function (sale) {
    await sendNotification('Продажа - Клиентский', sale);
    await updateSale(db, sale.srid, 'notified', true);
});

eventEmmiter.on('new refund', async function (order) {
    await sendNotification('Продажа - Возврат', order);
    await updateOrder(db, order.srid, 'notified', true);
});

await init();
await startListeners();
bot.launch();
console.log(bot.botInfo);

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));