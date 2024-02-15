import { getOrders as getMarketplaceOrders, getSales as getMarketplaceSales } from "./controllers/WildberriesController.js";
import { checkOrderInDatabase, putOrder, updateOrder } from "./model/OrderModel.js"; 
import { getDate, shortenUtc } from "./utils/DateTimeUtil.js";
import { initializeConnection } from "./firebase.js";
import { listen as listenWildberries } from "./listeners/WildberriesListener.js";
import { getProductPictureByArticle } from "./model/ProductModel.js";
import { formCancellationMessage, formOrdersMessage, formSalesMessage } from "./utils/MessagesUtil.js";
import { checkCancellationInDatabase, putCancellation } from "./model/CancellationModel.js";
import { checkSalesInDatabase, putSale, updateSale } from "./model/SalesModel.js";
import { EventEmitter } from "events";

import { Telegraf } from "telegraf";
import { checkRefundInDatabase, putRefund } from "./model/RefundModel.js";
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
    apiKey: "AIzaSyBtUtTtJjEF0kqnpYOlykjPbuOETy4a0aI",
    authDomain: "decorada-notifications-stage.firebaseapp.com",
    projectId: "decorada-notifications-stage",
    storageBucket: "decorada-notifications-stage.appspot.com",
    messagingSenderId: "581331281338",
    appId: "1:581331281338:web:fb5f40e460424f960b6983"
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
    let marketplaceSales = await getMarketplaceSales();
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

async function sendNotification(type, order) {
    let message = await getMessageByType(type, order);
    let pictureLink = await getProductPictureByArticle(order.nmId);


    let botLink = `https://api.telegram.org/bot6778620514:AAEV8vgFtR2usuNpyhnTOFMzp6_lx--NbEA/sendPhoto`;
    const { data } = await axios.post(botLink, {
        chat_id: '-4133152997',
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
    await listenWildberries(eventEmmiter, db, todayOrdersInMarket, todayCancelledInMarket, todayRefundsInMarket, todaySalesInMarket);
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