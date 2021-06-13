export function setOneTimeCookie(key: string, value: string, path: string = "/") {
    document.cookie = `${key}=${value};path=${path}`;
}

export function setCookie(key: string, value: string, expirationDays: number = 1, path: string = "/") {
    const date = new Date();
    date.setTime(date.getTime() + (expirationDays * 24 * 60 * 60 * 1000));
    document.cookie = `${key}=${value};expires=${date.toUTCString()};path=${path}`;
}

export function getCookie(key: string) {
    return document.cookie.match('(^|;)\\s*' + key + '\\s*=\\s*([^;]+)')?.pop() || '';
}
