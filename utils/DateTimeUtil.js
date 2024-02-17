export const getDate = async () => {
    const now = new Date();
    const localizedDate = now.toLocaleString();
    let date = localizedDate.split(' ')[0];
    date = date.substring(0, date.length - 1);
    return date;
}

export const shortenUtc = (utcDateTime) => {
    let utcDate = utcDateTime.split('T')[0];
    let month = utcDate.split('-')[1];
    let day = utcDate.split('-')[2];
    let year = utcDate.split('-')[0];
    if (day[0] == '0') day.substring(1);
    if (month[0] == '0') month.substring(1);
    let orderDate = day + '.' + month + '.' + year;
    return orderDate;
}

// use dots when running locally
export const getDateWithDashes = async () => {
    let dateToSplit = await getDate();
    let month = dateToSplit.split('/')[0];
    if (month.length == 1) month = '0' + month;
    let day = dateToSplit.split('/')[1];
    if (day.length == 1) day = '0' + day;
    let year = dateToSplit.split('/')[2];
    let orderDate = year + '-' + month + '-' + day;
    return orderDate;
}

export const getDateTime = async () => {
    const now = new Date();
    const localizedDate = now.toLocaleString();
    return localizedDate;
}