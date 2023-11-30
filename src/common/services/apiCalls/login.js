import {apiRequest, apiRequestWithToken} from "@/common/utils/utils";
import {getApiUrl} from "@/common/utils/base";
import {stringify} from 'qs'
import {getAuthData} from "@/common/utils/auth";

const baseUrl = '/api'

export async function getLogin() {
    const token = getAuthData() != null ? getAuthData().token : null
    return apiRequestWithToken(`${getApiUrl()}${baseUrl}`+ "/welcome", 'GET', token)
}

export async function login(username, token){
    return apiRequest(`${getApiUrl()}${baseUrl}`+ "/login", 'POST', JSON.stringify({"username": username, "token": token}))
}



