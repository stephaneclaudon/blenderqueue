export const strippedPath = (path:string, length:number) => {
    let str = path;
    if (path.length > length)
        str = path.slice(0, Math.floor(length*0.35)) + '......' + path.slice(-Math.floor(length*0.65))
    return str;
};

export const stripString = (s:string, length:number) => {
    let str = s;
    if (s.length > length)
        str = str.slice(0, length - 3) + '...';
    return str;
};