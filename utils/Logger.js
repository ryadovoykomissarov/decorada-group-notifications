import {log, info, debug, warn, error, write} from 'firebase-functions/logger';
import { getDateTime } from './DateTimeUtil.js';




export const dLog = async (message) => {
    let ts = await getDateTime();
    log(ts + ": " + message)
}

export const dInfo = async (message) => {
    let ts = await getDateTime();
    info(ts + ": " + message)
}

export const dDebug = async (message) => {
    let ts = await getDateTime();
    debug(ts + ": " + message)
}

export const dWarn = async (message) => {
    let ts = await getDateTime();
    warn(ts + ": " + message)
}

export const dError = async (message) => {
    let ts = await getDateTime();
    error(ts + ": " + message)
}