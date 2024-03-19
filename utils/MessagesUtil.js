import { getSalesByDate} from "../controllers/WildberriesController.js";
import { getOrdersByDate } from "../model/OrderModel.js";
import { getProductLinkByArticle } from "../model/ProductModel.js";
import { shortenUtc } from "./DateTimeUtil.js";

export const formOrdersMessage = async (order) => {
    let date = shortenUtc(order.date);
    let header = '&#10133 Новый <b>заказ</b>. \n\n';

    let orderType = '<b>Тип заказа:</b> ' + order.orderType + "\n";
    let orderId = '<b>Идентификатор заказа:</b> ' + order.srid + "\n";
    let dateInMessage = '<b>Дата:</b> ' + date + "\n";

    let orderLink = await getProductLinkByArticle(order.nmId);

    let sellerArticle = '<b>Артикул продавца:</b> ' + order.supplierArticle + '\n';
    let nmId = '<b>Артикул Wildberries:</b> ' + `<a href="${orderLink}">${order.nmId}</a>` + '\n';
    let barcode = order.barcode ? '<b>Баркод: </b> ' + order.barcode + '\n\n' : 'Баркод: </b> -' + '\n\n';

    let shopLink = '';
    if (order.brand == 'RADA-decor') {
        shopLink = 'https://www.wildberries.ru/brands/rada-decor';
    } else if (order.brand == 'RADA-style') {
        shopLink = 'https://www.wildberries.ru/brands/rada-style-351956';
    }

    let shop = `<b>Магазин:</b> <a href="${shopLink}">${order.brand}</a>` + '\n';
    let category = '<b>Категория:</b> ' + order.category + '\n';


    let totalPrice = '<b>Цена без скидок:</b> ' + order.totalPrice + ' руб.\n'
    let discountPercent = '<b>Скидка продавца:</b> ' + order.discountPercent + '%\n'
    let spp = '<b>Скидка Wildberries:</b> ' + order.spp + '%\n'
    let finishedPrice = '&#128178 <b>Фактическая цена с учетом всех скидок</b> (к взиманю с покупателя): ' + order.finishedPrice + ' руб.\n'
    let priceWithDisc = '<b>Цена со скидкой продавца:</b> ' + order.priceWithDisc + ' руб.\n\n'

    let regions = '<b>Регион:</b> ' + order.countryName + ', ' + order.oblastOkrugName + ', ' + order.regionName + ' обл.\n<b>Склад отгрузки:</b> ' + order.warehouseName;
    return header +
        orderType +
        orderId +
        dateInMessage +
        sellerArticle +
        nmId +
        barcode +
        shop +
        category +
        totalPrice +
        discountPercent +
        spp +
        finishedPrice +
        priceWithDisc +
        regions;
}

export const formCancellationMessage = async (order) => {
    let date = shortenUtc(order.date);
    let header = '&#10134 <b>Отмена заказа</b>. \n\n';

    let orderType = '<b>Причина отмены:</b> ' + order.orderType + "\n";
    let dateInMessage = '<b>Дата:</b> ' + date + "\n\n";

    let todayCount = 0;
    let orders = await getOrdersByDate(date);
    orders.forEach((data) => {
        if (data.nmId == order.nmId && data.orderType !== 'Клиентский')
            todayCount++;
    });

    let orderLink = await getProductLinkByArticle(order.nmId);

    let sellerArticle = '<b>Артикул продавца:</b> ' + order.supplierArticle + '\n';
    let nmId = '<b>Артикул Wildberries:</b> ' + `<a href="${orderLink}">${order.nmId}</a>` + '\n';
    let barcode = order.barcode ? '<b>Баркод: </b> ' + order.barcode + '\n\n' : 'Баркод: </b> -' + '\n\n';

    let shopLink = '';
    if (order.brand == 'RADA-decor') {
        shopLink = 'https://www.wildberries.ru/brands/rada-decor';
    } else if (order.brand == 'RADA-style') {
        shopLink = 'https://www.wildberries.ru/brands/rada-style-351956';
    }

    let shop = `<b>Магазин:</b> <a href="${shopLink}">${order.brand}</a>` + '\n';
    let category = '<b>Категория:</b> ' + order.category + '\n';

    let regions = '<b>Регион:</b> ' + order.countryName + ', ' + order.oblastOkrugName + ', ' + order.regionName + ' обл.\n<b>Склад отгрузки:</b> ' + order.warehouseName;
    return header +
        orderType +
        dateInMessage +
        sellerArticle +
        nmId +
        barcode +
        shop +
        category +
        regions;
}

export const formSalesMessage = async (sale) => {
    let date = shortenUtc(sale.date);
    let header = 'Новая <b>продажа</b>. \n\n';

    let orderType = '<b>Тип заказа:</b> ' + sale.orderType + "\n";
    let dateInMessage = '<b>Дата:</b> ' + date + "\n\n";

    let todayCount = 0;
    let orders = await getSalesByDate(date);
    orders.forEach((data) => {
        if (data.nmId == sale.nmId && data.orderType == 'Клиентский')
            todayCount++;
    });


    let sellerArticle = '<b>Артикул продавца:</b> ' + sale.supplierArticle + '\n';
    let nmId = '<b>Артикул Wildberries:</b> ' + `<a href="${orderLink}">${sale.nmId}</a>` + '\n';
    let barcode = sale.barcode ? '<b>Баркод: </b> ' + sale.barcode + '\n\n' : 'Баркод: </b> -' + '\n\n';

    let shopLink = '';
    if (sale.brand == 'RADA-decor') {
        shopLink = 'https://www.wildberries.ru/brands/rada-decor';
    } else if (sale.brand == 'RADA-style') {
        shopLink = 'https://www.wildberries.ru/brands/rada-style-351956';
    }

    let shop = `<b>Магазин:</b> <a href="${shopLink}">${sale.brand}</a>` + '\n';

    let totalPrice = '<b>Цена без скидок:</b> ' + sale.totalPrice + ' руб.\n'
    let discountPercent = '<b>Скидка продавца:</b> ' + sale.discountPercent + '%\n'
    let spp = '<b>Скидка Wildberries:</b> ' + sale.spp + '%\n'
    let finishedPrice = '<b>Фактическая цена с учетом всех скидок</b> (к взиманю с покупателя): ' + sale.finishedPrice + ' руб.\n'
    let priceWithDisc = '<b>Цена со скидкой продавца:</b> ' + sale.priceWithDisc + ' руб.\n\n'
    let forPay = '<b>К перечислению продавцу</b>: ' + sale.forPay + ' руб.\n'

    let regions = '<b>Регион:</b> ' + sale.countryName + ', ' + sale.oblastOkrugName + ', ' + sale.regionName + ' обл.\n<b>Склад отгрузки:</b> ' + sale.warehouseName;
    return header +
        orderType +
        dateInMessage +
        sellerArticle +
        nmId +
        barcode +
        shop +
        category +
        totalPrice +
        discountPercent +
        spp +
        finishedPrice +
        priceWithDisc +
        forPay +
        regions;
}

export const formRefundMessage = async (order) => {
    let date = shortenUtc(refund.date);
    let header = 'Новый <b>возврат</b>. \n\n';

    let orderType = '<b>Тип возврата:</b> ' + refund.orderType + "\n";
    let dateInMessage = '<b>Дата:</b> ' + date + "\n\n";

    let sellerArticle = '<b>Артикул продавца:</b> ' + refund.supplierArticle + '\n';
    let nmId = '<b>Артикул Wildberries:</b> ' + refund.nmId + '\n';
    let barcode = refund.barcode ? '<b>Баркод: </b> ' + refund.barcode + '\n\n' : 'Баркод: </b> -' + '\n\n';

    let category = '<b>Категория:</b> ' + refund.category + '\n';
    let brand = '<b>Бренд:</b> ' + refund.brand + '\n\n';

    let todayCount = 0;
    let orders = await getOrdersByDate(date);
    orders.forEach((data) => {
        if (data.nmId == order.nmId && data.orderType !== 'Клиентский')
            todayCount++;
    });

    let totalPrice = '<b>Цена без скидок:</b> ' + refund.totalPrice + ' руб.\n'
    let discountPercent = '<b>Скидка продавца:</b> ' + refund.discountPercent + '%\n'
    let spp = '<b>Скидка Wildberries:</b> ' + refund.spp + '%\n'
    let finishedPrice = '<b>Фактическая цена с учетом всех скидок</b> (к взиманю с покупателя): ' + refund.finishedPrice + ' руб.\n'
    let priceWithDisc = '<b>Цена со скидкой продавца:</b> ' + refund.priceWithDisc + ' руб.\n\n'
    let forPay = '<b>К перечислению продавцу</b>: ' + order.forPay + ' руб.\n'

    let regions = '<b>Регион:</b> ' + refund.countryName + ', ' + refund.oblastOkrugName + ', ' + refund.regionName + ' обл.\n<b>Склад отгрузки:</b> ' + refund.warehouseName;
    return header +
        orderType +
        dateInMessage +
        sellerArticle +
        nmId +
        barcode +
        shop +
        category +
        brand +
        totalPrice +
        discountPercent +
        spp +
        priceWithDisc +
        finishedPrice +
        forPay +
        regions;
}

export const formDailyReport = async (reportDate, ordersCount, gross) => {
    let header = '<b>Отчет за ' + reportDate + '</b>\n\n';
    let orders = 'Всего заказов за сутки: ' + ordersCount + '\n';
    let total = 'На сумму: ' + gross + ' руб.\n\n';

    return header + orders + total;
}

export const formArticleReport = async (date, article, orders, sales, cancellations, refunds) => {
    let header = `Статистика по артикулу <b>${article} на ${date}</b>\n\n`;

    let ordersCount = `Заказов за сутки: ${orders.count} шт.\n`;
    let ordersMoney = `На сумму: ${orders.money} руб.\n\n`;

    let salesCount = `Продаж за сутки: ${sales.count} шт.\n`;
    let salesMoney = `На сумму: ${sales.money} руб.\n\n`;

    let cancellationsCount = `Отмененных заказов за сутки: ${cancellations.count} шт.\n`;
    let cancellationsMoney = `На сумму: ${cancellations.money} руб.\n\n`;

    let refundsCount = `Возвратов товаров за сутки: ${refunds.count} шт.\n`;
    let refundsMoney = `На сумму: ${refunds.money} руб.\n\n`;
    return header + ordersCount + ordersMoney + salesCount + salesMoney + cancellationsCount + cancellationsMoney + refundsCount + refundsMoney;
}
