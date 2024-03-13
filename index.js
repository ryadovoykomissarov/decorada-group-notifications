import { getOrders as getMarketplaceOrders, getSales as getMarketplaceSales } from "./controllers/WildberriesController.js";
import { getOrders as getDbOrders, checkOrderInDatabase, putOrder, updateOrder, getOrdersByDate } from "./model/OrderModel.js";
import { listen as listenWildberries } from "./listeners/WildberriesListener.js";
import { getProductByArticle } from "./model/ProductModel.js";
import { formArticleReport, formCancellationMessage, formDailyReport, formOrdersMessage, formSalesMessage } from "./utils/MessagesUtil.js";
import { updateSale } from "./model/SalesModel.js";
import { EventEmitter } from "events";
import { Markup, Telegraf } from "telegraf";
import axios from "axios";
import axiosThrottle from "axios-request-throttle";
import express from 'express';
import moment from "moment";
import { getDate } from "./utils/DateTimeUtil.js";
import config from './config.json' assert { type: "json" };
export let ordersCache = undefined;
export let salesCache = undefined;

const app = express();
let bot_token = config.bot_token;
const bot = new Telegraf(bot_token);
axiosThrottle.use(axios, { requestsPerSecond: 1 });

export const eventEmmiter = new EventEmitter();

async function init() {
    await matchData();
}

async function matchData() {
    await matchOrders();
    // await matchSales();
}

async function matchOrders() {
    let currentDate = moment().format();
    const requestFilter = currentDate.split('T')[0];
    let marketplaceData = await getMarketplaceOrders(requestFilter);

    let matchingOrders = [];
    marketplaceData.forEach(async (order) => {
        if (order.date.split('T')[0] == requestFilter) {
            matchingOrders.push(order);
        }
    });

    await processDocumentWithTimeout(matchingOrders);
}

async function matchSales() {
    let currentDate = moment().format();
    const requestFilter = currentDate.split('T')[0];
    let marketplaceData = await getMarketplaceSales(requestFilter);

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
        eventEmmiter.emit('new order', data);
    }
}

async function processDocumentWithTimeout(documents) {
    for (const data of documents) {
        console.log('Processing documents with timeout on startup.')
        await processDocument(data);
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
}

async function sendNotification(type, order) {
    let message = await getMessageByType(type, order);
    let product = await getProductByArticle(order.nmId);
    let pictureLink = product.image;
    let botLink = config.bot_link;

    const keyboard = JSON.stringify({
        inline_keyboard: [
            [{ text: 'Статистика по артикулу', callback_data: order.nmId }]
        ]
    });

    const requestData = {
        chat_id: config.chat_id,
        photo: pictureLink,
        caption: message,
        parse_mode: 'HTML',
        reply_markup: keyboard
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
        try {
            await makeRequest(requestData);
        } catch (error) {
            if (error.response && error.response.status == 429) {
                retryQueue.push(requestData);
            } else {
                console.log('Notification has not been sent. Error code: ' + error.response.code);
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
        case 'Клиентский':
            return await formOrdersMessage(order);
        case 'Возврат Брака' || 'Принудительный возврат' || 'Возврат обезлички' || 'Возврат Неверного Вложения' || 'Возврат Продавца':
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
    await listenWildberries(eventEmmiter);
}

eventEmmiter.on('new order', async function (order) {
    await updateOrder(order.srid, 'notified', true);
    await sendNotification(order.orderType, order);
});

eventEmmiter.on('new cancellation', async function (order) {
    await sendNotification('Заказ - Отмена', order);
    await updateOrder(order.srid, 'notified', true);
});

eventEmmiter.on('new sale', async function (sale) {
    await sendNotification('Продажа - Клиентский', sale);
    await updateSale(sale.srid, 'notified', true);
});

eventEmmiter.on('new refund', async function (order) {
    await sendNotification('Продажа - Возврат', order);
    await updateOrder(order.srid, 'notified', true);
});

eventEmmiter.on('daily stats', async function (reportDate, ordersCount, gross) {
    let message = await formDailyReport(reportDate, ordersCount, gross);
    let botLink = config.bot_link;
    const { data } = await axios.post(botLink, {
        chat_id: config.chat_id,
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
});

await init();
await startListeners();
bot.launch();

bot.on('callback_query', async (ctx) => {
    ctx.answerCbQuery();
    try {
        let result = [];
        let date = await getDate()
        let ordersByArticle = await getOrdersByDate(date);
        ordersByArticle.forEach(order => {
            if (order.nmId == ctx.callbackQuery.data) result.push(order);
        });

        // let count = result.length;
        let count = 0;
        let gross = 0;
        result.forEach(order => {
            let forPay = parseFloat(order.finishedPrice);
            gross += forPay;
        })

        let message = await formArticleReport(date, ctx.callbackQuery.data, count, gross);

        let botLink = config.report_link;
        const { data } = await axios.post(botLink, {
            chat_id: config.chat_id,
            text: message,
            parse_mode: 'HTML'
        }, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
    } catch (e) {
        console.log(e);
    }
});

process.once('SIGINT', async () => {
    bot.stop('SIGINT')
});
process.once('SIGTERM', async () => {
    bot.stop('SIGTERM')
});