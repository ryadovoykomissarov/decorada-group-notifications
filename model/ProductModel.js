import { collection, getDocs } from "firebase/firestore";
import { db } from "../index.js";

export const getProductPictureByArticle = async (article) => {
    let imageLink;
    const productsCollection = collection(db, 'products');
    const productsSnapshot = await getDocs(productsCollection);
    productsSnapshot.forEach(product => {
        let productData = product.data();
        console.log(article + ' article');
        console.log(productData.article + ' pd article');
        if(productData.article==article) {
            imageLink = productData.image;
            return imageLink;
        }
    })
    return imageLink;
}