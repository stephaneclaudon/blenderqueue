export const strippedPath = (path:string) => {
    let str = path;
    if (path.length > 80)
        str = path.slice(0, 30) + '......' + path.slice(-50)
    return str;
};

export const stripString = (s:string, length:number) => {
    let str = s;
    if (s.length > length)
        str = str.slice(0, length - 3) + '...';
    return str;
};