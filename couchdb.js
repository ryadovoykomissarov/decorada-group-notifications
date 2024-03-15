import Nano from 'nano';
import config from './config.json' assert { type: "json" };
let nano = Nano(`${config.couch_url}`);

let ordersStorageName = config.orders_storage_name;
let salesStorageName = config.sales_storage_name;
let productsStorageName = config.products_storage_name;

export let ordersStorage = nano.use(ordersStorageName);
export let salesStorage = nano.use(salesStorageName);
export let productsStorage = nano.use(productsStorageName);

export let ordersWithDatesViewUri = 'http://admin:Vtkrjyju18!@195.58.54.86:5984/rnd-orders/_design/orders_doc/_view/id_date_view';
