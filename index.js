import { getOrders as getMarketplaceOrders, getSales as getMarketplaceSales } from "./controllers/WildberriesController.js";
import { getOrders, putOrder, updateOrder } from "./model/OrderModel.js";
import { getDate, getDateTime, shortenUtc } from "./utils/DateTimeUtil.js";
import { initializeConnection } from "./firebase.js";
import { listen as listenWildberries } from "./listeners/WildberriesListener.js";
import { getProductPictureByArticle } from "./model/ProductModel.js";
import { formCancellationMessage, formDailyReport, formOrdersMessage, formSalesMessage } from "./utils/MessagesUtil.js";
import { checkCancellationInDatabase, putCancellation } from "./model/CancellationModel.js";
import { checkSalesInDatabase, putSale, updateSale } from "./model/SalesModel.js";
import { EventEmitter } from "events";
import { Telegraf } from "telegraf";
import { checkRefundInDatabase, putRefund } from "./model/RefundModel.js";
import axios from "axios";
import axiosThrottle from "axios-request-throttle";
import { putError, putInfo } from "./model/LogModel.js";
import express from 'express';
import { stat } from "fs";
import { countDailyStats } from "./utils/StatsUtil.js";
import { dError } from "./utils/Logger.js";

const app = express();
let bot_token = '6778620514:AAEV8vgFtR2usuNpyhnTOFMzp6_lx--NbEA';
const bot = new Telegraf(bot_token);
axiosThrottle.use(axios, { requestsPerSecond: 1 });

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
    await putInfo(await getDateTime(), 'Matching data on order startup');
    await matchData();
    await putInfo(await getDateTime(), 'Data has been matched, starting listeners');
}

async function matchData() {
    await matchOrders();
    // await matchCancelled();
    // await matchSales();
    // await matchRefunds();
}

async function matchOrders() {
    let marketplaceOrders = await getOrdersByTypeFromStub('Клиентский');

    let marketplaceOrdersIds = [];
    marketplaceOrders.forEach(order => {
        marketplaceOrdersIds.push(order.srid);
    })

    todayOrdersInMarket = await countTodayOrdersInMarket(marketplaceOrders, 'Клиентский');

    let databaseOrders = await getOrders(db);
    for (let i = 0; i < databaseOrders.length; i++) {
        let dbId = databaseOrders[i].srid;
        if (marketplaceOrdersIds.indexOf(dbId) > -1) {
            let oldOrderId = marketplaceOrdersIds.indexOf(dbId);
            let oldOrder = marketplaceOrders[oldOrderId];
            marketplaceOrders.splice(marketplaceOrders.indexOf(oldOrder), 1)
        }
    }

    marketplaceOrders.forEach(async order => {
        await putOrder(db, order);
        await updateOrder(db, order.srid, 'notified', true);
        await sendNotification("Заказ - Клиентский", order);
    });
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
        await updateOrder(db.order.srid, 'notified', true);
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
            // let lastChangedDate = shortenUtc(order.lastChangeDate);
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
            let lastChangedDate = shortenUtc(order.lastChangeDate);
            if (orderDate == currentDate || lastChangedDate == currentDate) {
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
    let pictureLink = await getProductPictureByArticle(db, order.nmId);
    let botLink = `https://api.telegram.org/bot6778620514:AAEV8vgFtR2usuNpyhnTOFMzp6_lx--NbEA/sendPhoto`;

    const requestData = {
        chat_id: '-1001999915316',
        photo: pictureLink,
        caption: message,
        parse_mode: 'HTML'
    };

    const retryQueue = [];

    const makeRequest = async (requestData) => {
        return axios.post(botLink, requestData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
    };

    const sendRequest = async (requestData) => {
        try{
            await makeRequest(requestData);
        } catch (error) {
            if(error.response && error.response.status == 429) {
                retryQueue.push(requestData);
            } else {
                await dError('Notification has not been sent. Error code: ' + error.response.status);
            }
        }
    };

    await sendRequest(requestData);

    const retryRequest = async () => {
        while (retryQueue.length > 0) {
            const requestData = retryQueue.shift();
            await sendRequest(requestData);
            await new Promise(resolve => setTimeout(resolve, 20000));
        }
    };

    await retryRequest();
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
        case 'Отчет':
            return await formDailyReport(order);
    }
}

async function startListeners() {
    await putInfo(await getDateTime(), 'Starting listener: Wildberries');
    let date = await getDate();
    let botLink = `https://api.telegram.org/bot6778620514:AAEV8vgFtR2usuNpyhnTOFMzp6_lx--NbEA/sendMessage`;
    const { data } = await axios.post(botLink, {
        chat_id: '702801778',
        text: `Бот уведомлений Wilbdberries запущен, текущая дата: ${date}`,
        parse_mode: 'HTML'
    }, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });

    // console.log(data);
    await listenWildberries(eventEmmiter, db, todayOrdersInMarket, todayCancelledInMarket, todayRefundsInMarket, todaySalesInMarket);
}

eventEmmiter.on('new order', async function (order) {
    await updateOrder(db, order.srid, 'notified', true);
    await sendNotification('Заказ - Клиентский', order);
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

eventEmmiter.on('daily report', async function () {
    let stats = await countDailyStats(await getDate());
    let message = await formDailyReport(stats);
    let botLink = `https://api.telegram.org/bot6778620514:AAEV8vgFtR2usuNpyhnTOFMzp6_lx--NbEA/sendMessage`;
    const { data } = await axios.post(botLink, {
        chat_id: '-1001999915316',
        text: message,
        parse_mode: 'HTML'
    }, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });
});

app.get('/', (req, res) => {
    res.send('Hello');
});

const port = 3000;
app.listen(port, () => {
    console.log('App is running on port ' + port);
})
await init();
await startListeners();
bot.launch();

eventEmmiter.emit('daily report');

process.once('SIGINT', async () => {
    // let botLink = `https://api.telegram.org/bot6778620514:AAEV8vgFtR2usuNpyhnTOFMzp6_lx--NbEA/sendMessage`;
    // const { data } = await axios.post(botLink, {
    //     chat_id: '-1001999915316',
    //     text: "Сервис уведомлений Wilberries временно приостановлен - ведутся технические работы. Вы получите уведомление о возобновлении работы сервиса",
    //     parse_mode: 'HTML'
    // }, {
    //     headers: {
    //         'Content-Type': 'application/x-www-form-urlencoded'
    //     }
    // });

    // console.log(data);
    bot.stop('SIGINT')
});
process.once('SIGTERM', async () => {
    // let botLink = `https://api.telegram.org/bot6778620514:AAEV8vgFtR2usuNpyhnTOFMzp6_lx--NbEA/sendMessage`;
    // const { data } = await axios.post(botLink, {
    //     chat_id: '-1001999915316',
    //     text: "При попытке выполнить запрос произошла ошибка, но мы уже работаем над её устранением.",
    //     parse_mode: 'HTML'
    // }, {
    //     headers: {
    //         'Content-Type': 'application/x-www-form-urlencoded'
    //     }
    // });

    // console.log(data);
    bot.stop('SIGTERM')
});