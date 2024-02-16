import axios from "axios";
import { shortenUtc } from "../utils/DateTimeUtil.js";
import { getRefunds } from "../model/RefundModel.js";
import { sleep } from "../utils/ThreadUtil.js";


const ordersEndpoit = "https://statistics-api.wildberries.ru/api/v1/supplier/orders";
const salesEndpoit = "https://statistics-api.wildberries.ru/api/v1/supplier/sales";
const wbToken = "eyJhbGciOiJFUzI1NiIsImtpZCI6IjIwMjMxMjI1djEiLCJ0eXAiOiJKV1QifQ.eyJlbnQiOjEsImV4cCI6MTcyMzYwNzkyMSwiaWQiOiJlNGY4MWUyMC01NTU5LTQ2ZGEtOTA0OC00MzIxMWIwYzcxYjIiLCJpaWQiOjUzODE3NTY2LCJvaWQiOjIyMjEzNiwicyI6NTIsInNpZCI6IjUzNTlmM2FhLWNlNWUtNDA4Ni04MDliLTcxMDQ3NmIzN2QxYyIsInQiOmZhbHNlLCJ1aWQiOjUzODE3NTY2fQ.iO_7EsuWLLFZAWJitPl-0d6xxE_s-kmcbD3ENg2-2A79hf1oQcxwV40_rvKkHY2xNZOfZchNUiDYIbctPwG-IA";
const startDate = '2024-02-15';

export const getOrders = async () => {
    await sleep(60000);
    let orders;
    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: 'https://statistics-api.wildberries.ru/api/v1/supplier/orders?dateFrom=2024-02-15',
        headers: { 
          'Authorization': 'Bearer eyJhbGciOiJFUzI1NiIsImtpZCI6IjIwMjMxMjI1djEiLCJ0eXAiOiJKV1QifQ.eyJlbnQiOjEsImV4cCI6MTcyMzYwNzkyMSwiaWQiOiJlNGY4MWUyMC01NTU5LTQ2ZGEtOTA0OC00MzIxMWIwYzcxYjIiLCJpaWQiOjUzODE3NTY2LCJvaWQiOjIyMjEzNiwicyI6NTIsInNpZCI6IjUzNTlmM2FhLWNlNWUtNDA4Ni04MDliLTcxMDQ3NmIzN2QxYyIsInQiOmZhbHNlLCJ1aWQiOjUzODE3NTY2fQ.iO_7EsuWLLFZAWJitPl-0d6xxE_s-kmcbD3ENg2-2A79hf1oQcxwV40_rvKkHY2xNZOfZchNUiDYIbctPwG-IA'
        }
      };
    await axios.request(config)
        .then((response) => {
            orders = response.data;
        }).catch((error) => {
            console.error(error);
        });
    return orders;
}

export const getOrdersByDate = async (date) => {
    let result = [];
    await sleep(60000);
    let orders = await getOrders();
    orders.forEach(async order => {
        let orderDate = shortenUtc(order.date);
        let orderType = order.orderType;
        if (orderDate == date && orderType == 'Клиентский') result.push(order);
    });
    return result;
}

export const getCancellationsByDate = async (date) => {
    let result = [];
    let orders = await getOrders();
    orders.forEach(async order => {
        let orderDate = shortenUtc(order.date);
        let orderType = order.orderType;
        if (orderDate == date && orderType !== 'Клиентский') result.push(order);
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

export const getSales = async () => {
    await sleep(60000);
    let sales;
    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: 'https://statistics-api.wildberries.ru/api/v1/supplier/orders?dateFrom=2024-02-01',
        headers: { 
          'Authorization': 'Bearer eyJhbGciOiJFUzI1NiIsImtpZCI6IjIwMjMxMjI1djEiLCJ0eXAiOiJKV1QifQ.eyJlbnQiOjEsImV4cCI6MTcyMzYwNzkyMSwiaWQiOiJlNGY4MWUyMC01NTU5LTQ2ZGEtOTA0OC00MzIxMWIwYzcxYjIiLCJpaWQiOjUzODE3NTY2LCJvaWQiOjIyMjEzNiwicyI6NTIsInNpZCI6IjUzNTlmM2FhLWNlNWUtNDA4Ni04MDliLTcxMDQ3NmIzN2QxYyIsInQiOmZhbHNlLCJ1aWQiOjUzODE3NTY2fQ.iO_7EsuWLLFZAWJitPl-0d6xxE_s-kmcbD3ENg2-2A79hf1oQcxwV40_rvKkHY2xNZOfZchNUiDYIbctPwG-IA'
        }
      };
    await axios.request(config)
        .then((response) => {
            sales = response.data;
        }).catch((error) => {
            console.error(error);
        });
    return sales;
}

export const getRefundsByDate = async (date) => {
    let result = [];
    let refunds = await getRefunds();
    refunds.forEach(async refund => {
        let orderDate = shortenUtc(refund.date);
        let orderType = refund.orderType;
        if (orderDate == date && orderType !== 'Клиентский') result.push(refund);
    });
    return result;
}