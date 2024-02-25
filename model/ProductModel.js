import { collection, getDoc, getDocs } from "firebase/firestore";

export const getProductPictureByArticle = async (db, article) => {
    let imageLink;
    const productsCollection = collection(db, 'products');
    const productsSnapshot = await getDocs(productsCollection);
    productsSnapshot.forEach(product => {
        let productData = product.data();
        if(productData.article==article) {
            imageLink = productData.image;
            return imageLink;
        }
    })
    return imageLink;
}

export const getProductByArticle = async (db, article) => {
    let productName;
    const productsCollection = collection(db, 'products');
    const productsSnapshot = await getDocs(productsCollection);
    productsSnapshot.forEach(product => {
        productData = product.data();
    })
}

export const getProductLinkByArticle = async (db, article) => {
    let uri;
    const productsCollection = collection(db, 'products');
    const productsSnapshot = await getDocs(productsCollection);
    productsSnapshot.forEach(product => {
        let productData = product.data();
        if(productData.article==article) {
            uri = productData.uri;
            return uri;
        }
    })
    return uri;
}

export const getProducts = async (db) => {
    try {
        let result = [];
        const productsCollection = collection(db, 'products');
        const productsSnapshot = await getDocs(productsCollection).catch((error) => console.log(error));
        productsSnapshot.forEach(order => {
            result.push(order.data());
        })
        return result;
    } catch (e) {
        console.log(e);
        return null;
    }
}


export const putProduct = async (db, order) => {
    const orderDoc = doc(db, 'products/' + order.article);
    await setDoc(orderDoc, order)
        .then(() => {
            console.log('New product added to Firestore, products collection.');
        }).catch((error) => {
            console.error(error);
        })
}