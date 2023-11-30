import {getAuthData} from "@/common/utils/auth";
import {apiRequestWithToken} from "@/common/utils/utils";
import {getApiUrl} from "@/common/utils/base";

const baseUrl = '/api'

export async function get() {
    const token = getAuthData() != null ? getAuthData().token : null
    return apiRequestWithToken(`${getApiUrl()}${baseUrl}`+ "/welcome", 'GET', token)
}