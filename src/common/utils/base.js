let API_URL = 'http://localhost:8080'
let WS_URL = 'ws://localhost:8080'
let LOGO_URL = 'https://i.ibb.co/fnfKddK/DALL-E-2023-11-20-11-35-35-A-modern-and-vibrant-logo-for-a-super-chat-application-called-Super-Conne.png'


if (typeof (window) !== 'undefined' && window.env) {
    API_URL = window.env.API_URL
    WS_URL = window.env.WS_URL
}

export function getLogoUrl() {
    return LOGO_URL
}

export function getApiUrl() {
    return API_URL
}

export function getWsUrl() {
    return WS_URL
}