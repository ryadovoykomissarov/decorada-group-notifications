import { productsStorage } from "../couchdb.js";

export const getProductByArticle = async (article) => {
    let database = productsStorage;
    return await database.get(article);
}

export const getProductLinkByArticle = async (article) => {
    let product = await getProductByArticle(article); 
    return product.uri;
}

export const getProducts = async () => {
    let database = productsStorage;
    let result = [];
    const docsList = await database.list().then((body) => {
        body.rows.forEach((doc) => {
            result.push(doc);
        })
    })
    return result;
}

export const putProduct = async (product) => {
    let database = productsStorage;
    product._id = product.article;
    const response = await database.insert(product).catch((e) => console.error('error' + e));
}