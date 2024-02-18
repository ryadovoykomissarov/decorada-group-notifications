import { doc, setDoc } from "firebase/firestore";
import { db } from "../index.js";
import { v4 } from "uuid";

export const putInfo = async (time, message) => {
    let logMessage = {
        'time': time,
        'message': message
    };
    console.log(JSON.stringify(logMessage));

    let id = v4();
    const logDoc = doc(db, 'logger', `logs/info/${id}`);
    await setDoc(logDoc, logMessage)
        .catch((e) => {}); 
}

export const putError = async (time, message) => {
    let logMessage = {
        'time': time,
        'message': message
    };
    console.log(JSON.stringify(logMessage));

    let id = v4();
    const logDoc = doc(db, 'logger', `/logs/error/${id}`);
    await setDoc(logDoc, logMessage)
        .catch((e) => {}); 
}

export const putDebug = async (time, message) => {
    let logMessage = {
        'time': time,
        'message': message
    };
    console.log(JSON.stringify(logMessage));

    const logDoc = doc(db, 'logger/logs/debug/');
    await setDoc(logDoc, logMessage)
        .catch((e) => {}); 
}

export const putWarn = async (time, message) => {
    let logMessage = {
        'time': time,
        'message': message
    };

    const logDoc = doc(db, 'logger/logs/warn/');
    await setDoc(logDoc, logMessage)
        .catch((e) => {}); 
}