import { updateOrder, filterOrdersByDateViewResult } from "./model/OrderModel.js";
import { listen as listenWildberries } from "./listeners/WildberriesListener.js";
import { getProductByArticle } from "./model/ProductModel.js";
import { formArticleReport, formCancellationMessage, formDailyReport, formOrdersMessage, formRefundMessage, formSalesMessage } from "./utils/MessagesUtil.js";
import { updateSale } from "./model/SalesModel.js";
import { EventEmitter } from "events";
import { Telegraf } from "telegraf";
import axios from "axios";
import axiosThrottle from "axios-request-throttle";
import express from 'express';
import { getDate } from "./utils/DateTimeUtil.js";
import config from './config.json' assert { type: "json" };
import { fork } from "child_process";
export let ordersCache = undefined;
export let salesCache = undefined;

const app = express();
let bot_token = config.bot_token;
const bot = new Telegraf(bot_token);
axiosThrottle.use(axios, { requestsPerSecond: 1 });

export const eventEmmiter = new EventEmitter();

async function sendNotification(category, type, order) {
    let message = '';
    if (category == "order") {
        message = await getOrderMessageByType(type, order);
    } else if (category == "sale") {
        message = await getSaleMessageByType(type, order);
    }
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

async function getOrderMessageByType(type, order) {
    switch (type) {
        case 'Клиентский':
            return await formOrdersMessage(order);
        case 'Возврат Брака': 
        case 'Принудительный возврат': 
        case 'Возврат обезлички': 
        case 'Возврат Неверного Вложения': 
        case 'Возврат Продавца':  
            return await formCancellationMessage(order);
    }
}

async function getSaleMessageByType(type, order) {
    switch (type) {
        case 'Клиентский':
            return await formSalesMessage(order);
        case 'Возврат Брака': 
        case 'Принудительный возврат': 
        case 'Возврат обезлички': 
        case 'Возврат Неверного Вложения': 
        case 'Возврат Продавца':  
            return await formRefundMessage(order);
    }
}

async function startListeners() {
    await listenWildberries(eventEmmiter);
}

eventEmmiter.on('new order', async function (order) {
    await sendNotification("order", order.orderType, order);
    await updateOrder(order.srid, 'notified', true);
});

eventEmmiter.on('new sale', async function (sale) {
    await sendNotification("sale", sale.orderType, sale);
    await updateSale(sale.srid, 'notified', true);
});

app.get('/', (req, res) => {
    res.send('Hello');
});

const port = 3000;
app.listen(port, () => {
    console.log('App is running on port ' + port);
});

await startListeners();
bot.launch();

const ordersSyncer = fork("orders_syncer.js");
ordersSyncer.on('message', function (message) {
    eventEmmiter.emit("new order", message)
});

const salesSyncer = fork("sales_syncer.js");
ordersSyncer.on('message', function (message) {
    eventEmmiter.emit("new sale", message)
});

bot.on('callback_query', async (ctx) => {
    ctx.answerCbQuery(ctx.callbackQuery.id);
    try {
        let orders = [];
        let sales = [];
        let cancellations = [];
        let refunds = [];

        let date = await getDate()
        let ordersByArticle = await filterOrdersByDateViewResult(date);
        
        ordersByArticle.forEach(order => {
            if (order.nmId == ctx.callbackQuery.data) {
                if (order.orderType == 'Клиентский' && !('forPay' in order)) {
                    orders.push(order);
                } else if (order.orderType == 'Клиентский' && 'forPay' in order) {
                    sales.push(order);
                } else if (order.orderType !== 'Клиентский' && ('isCancel' in order)) {
                    cancellations.push(order);
                } else refunds.push(order);
            }
        });

        let ordersCount = orders.length;
        let salesCount = sales.length;
        let cancellationsCount = cancellations.length;
        let refundsCount = refunds.length;
        
        let ordersGross = 0;
        orders.forEach(order => {
            let forPay = parseFloat(order.finishedPrice);
            ordersGross += forPay;
        })

        let salesGross = 0;
        sales.forEach(order => {
            let forPay = parseFloat(order.forPay);
            salesGross += forPay;
        })

        let cancelledGross = 0;
        cancellations.forEach(order => {
            let forPay = parseFloat(order.finishedPrice);
            cancelledGross += forPay;
        })

        let refundsGross = 0;
        refunds.forEach(order => {
            let forPay = parseFloat(order.forPay);
            refundsGross += forPay;
        });

        let ordersStats = {count: ordersCount, money: ordersGross };
        let salesStats = {count: salesCount, money: salesGross };
        let cancelltionsStats = {count: cancellationsCount, money: cancelledGross };
        let refundStats = {count: refundsCount, money: refundsGross };

        let message = await formArticleReport(date, ctx.callbackQuery.data, ordersStats, salesStats, cancelltionsStats, refundStats);

        let botLink = config.report_link;
        const { data } = await axios.post(botLink, {
            chat_id: ctx.chat.id,
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