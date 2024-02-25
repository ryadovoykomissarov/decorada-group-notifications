export const paginateArray = (array, pageSize) => {
    let sourceLength = array.length;
    let pagesCount = Math.ceil(sourceLength/pageSize);
    let pages = [];
    for (let i = 0; i < pagesCount; i++) {
        pages.push(array.slice(i*pageSize, (i+1)*pageSize));
    }
    return pages;
}