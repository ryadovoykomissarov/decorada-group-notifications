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

export const getDateWithDashes = async () => {
    let dateToSplit = await getDate();
    let day = dateToSplit.split('.')[0];
    let month = dateToSplit.split('.')[1];
    let year = dateToSplit.split('.')[2];
    let orderDate = year + '-' + month + '-' + day;
    return orderDate;
}