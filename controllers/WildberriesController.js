import axios from "axios";
import { shortenUtc } from "../utils/DateTimeUtil.js";
import { dError, dInfo } from "../utils/Logger.js";
import configuration from '../config.json' assert { type: "json" };

export const getOrders = async (date) => {
    let orders = [];
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 120000;

    const fetchData = async () => {
        const config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: `https://statistics-api.wildberries.ru/api/v1/supplier/orders?dateFrom=${date}`,
            headers: { 
                'Authorization': `Bearer ${configuration.wildberries_token}`
            }
        }

        try{
            const response = await axios.request(config);
            orders = response.data;
        } catch (error) {
            if (error.response && retryCount < maxRetries) {
                retryCount++;
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                await fetchData();
            } else {
                dError(error);
            }
        }
    }
    
    await fetchData();

    return orders;
}

export const getSales = async (date) => {
    let sales = [];
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 120000;

    const fetchData = async () => {
        const config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: `https://statistics-api.wildberries.ru/api/v1/supplier/sales?dateFrom=${date}`,
            headers: {
                'Authorization': `Bearer ${configuration.wildberries_token}`
            }
        }

        try{
            const response = await axios.request(config);
            sales = response.data;
        } catch (error) {
            if (error.response && retryCount < maxRetries) {
                retryCount++;
                dInfo(`Received ${error.response.status} error. Retrying (${retryCount})/(${maxRetries}). ${error.message}`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                await fetchData();
            } else {
                dError(error);
            }
        }
    }

    await fetchData();

    return sales;
}

export const getOrdersByDate = async (date) => {
    let result = [];
    let orders = await getOrders();
    orders.forEach(async order => {
        let orderDate = shortenUtc(order.date);
        let orderType = order.orderType;
        if (orderDate == date && orderType == 'Клиентский') result.push(order);
    });
    return result;
}

export const getChangedOrdersByDate = async (date) => {
    let result = [];
    let orders = await getOrders();
    orders.forEach(async order => {
        let orderChangeDate = shortenUtc(order.lastChangeDate);
        let orderType = order.orderType;
        if(orderChangeDate == date && orderType == 'Клиентский') result.push(order);  
    });
    return result;
}

export const getSalesByDate = async (date) => {
    let result = [];
    let sales = getSales();
    sales.forEach(async sale => {
        let orderDate = shortenUtc(sale.date);
        let orderType = sale.orderType;
        if (orderDate == date && orderType == 'Клиентский') result.push(sale);
    });
    return result;
}

export const getStocksByArticle = async (date, article) => {
    let allStocks = [];
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 120000;
    const config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: `https://statistics-api.wildberries.ru/api/v1/supplier/stocks?dateFrom=${date}`,
        headers: {
            'Authorization': `Bearer ${configuration.wildberries_token}`
        }
    }
    try {
        const response = await axios.request(config);
        allStocks = response.data;
    } catch (error) {
        if (error.response && retryCount < maxRetries) {
            retryCount++;
            console.log(`Received ${error.response.status} error. Retrying (${retryCount})/(${maxRetries}). ${error.message}`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            await getStocksByArticle(date, article);
        } else {
            console.error(error);
        }
    }
    
    const foundStock = allStocks.find(obj => obj.nmId === article);
    
    if (foundStock) {
        return foundStock;
    } else {
        console.log(`Stock for article ${article} not found`);
        return null; // or return a default value as needed
    }
}