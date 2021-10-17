import Axios, { AxiosRequestConfig } from 'axios'
import Qs from 'qs'
import path from 'path'

// axios 跨域请求携带 cookie
Axios.defaults.withCredentials = true

const DEFAULT_CONFIG = {
  method: 'POST',
  host: process.env.API_HOST,
  protocol: process.env.API_PROTOCOL,
  baseUrl: process.env.API_BASE_PATH,
  timeout: 30000,
  loading: false,
  errorType: 'message',
  checkStatus: true,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
  },
}

// const langParam = (lang: string) => {
//   const langType = lang == 'enUS' ? 'en_US' : 'zh_CN'
//   return langType
// }
// 默认传递的参数
const DEFAULT_PARAMS = {}

/**
 * 发起一个请求
 * @param apiPath
 * @param params
 * @param optionsSource
 */
export async function request(apiPath: string, params?: RequestParams, optionsSource?: RequestOptions) {
  const { loginOutInfo, loginOutFn } = $store.getState()
  // 登陆过期退出登录后不再请求接口，重新登录后打开
  if (
    loginOutInfo.isLoginOut &&
    !apiPath.includes('/login') &&
    !apiPath.includes('/createQRCode') &&
    !apiPath.includes('/team/user/find/account') &&
    !apiPath.includes('/team/enterpriseInfo/newQueryTeamList') &&
    !apiPath.includes('/team/enterpriseInfo/findEnterpriseList') &&
    !apiPath.includes('/team/weChatLogin/weChatLogin') &&
    !apiPath.includes('/team/register/findRegisterUser') &&
    !apiPath.includes('/team/register/find') &&
    !apiPath.includes('/team/register/reset') &&
    !apiPath.includes('/team/register/status') &&
    !apiPath.includes('/tools/verification/requestVerification') &&
    !apiPath.includes('/team/register/register') &&
    !apiPath.includes('/tools/verification/validateVerification') &&
    !apiPath.includes('/team/weChatLogin/bindWeChat') &&
    //
    !apiPath.includes('/task/follow/findFollowUserList') &&
    !apiPath.includes('/public/homeModule/countPersonalInformation') &&
    !apiPath.includes('/team/enterpriseInfo/findFollowUserOrg') &&
    !apiPath.includes('/public/thumbsUp/findUserThumbsUpPage') &&
    !apiPath.includes('/public/homeModule/countHomeByUser') &&
    !apiPath.includes('/team/rainbowFart/findUserRainBowFart') &&
    !apiPath.includes('/im-biz/workbench/count') &&
    !apiPath.includes('/team/invite/findAllInviteInfoModel') &&
    !apiPath.includes('/team/enterpriseInfo/getTradeInfo') &&
    !apiPath.includes('/team/enterpriseInfo/addEnterpriseInfo') &&
    !apiPath.includes('/team/invite/operation') &&
    !apiPath.includes('/approval/approval/baseForm/groupAndformSort')
  ) {
    return
  }
  const options: RequestOptions = Object.assign({}, DEFAULT_CONFIG, optionsSource)
  const { method, protocol, host, baseUrl, headers, checkStatus, formData } = options
  // 多语言参数
  // headers.languages = langParam(langType)
  const sendData: AxiosRequestConfig = {
    url: `${protocol}${path.join(host || '', baseUrl || '', apiPath || '')}`,
    method,
    headers,
    proxy: false,
  }

  const paramsData = Object.assign({}, DEFAULT_PARAMS, params)
  if (method === 'GET') {
    sendData.params = params
  } else if (formData) {
    //post请求不转json
    sendData.data = paramsData
    sendData.transformRequest = [
      function(data: any) {
        return Qs.stringify(data)
      },
    ]
  } else {
    //post请求json格式
    sendData.data = paramsData
    sendData.transformRequest = [
      function(data: any) {
        return JSON.stringify(data)
      },
    ]
  }
  return Axios(sendData)
    .then(res => {
      const data: any = res.data
      if (
        !checkStatus ||
        data.returnCode == 0 ||
        data.returnCode == 1941 ||
        data.returnCode == -999 ||
        data.returnCode == -911 ||
        data.returnCode == 12026 ||
        data.returnCode === 12038
      ) {
        if (data.returnCode === -999 || data.returnCode === -911) {
          // console.log('登陆过期', data.returnCode, loginOutFn)
          if (loginOutFn) {
            loginOutFn({ key: 'loginOut' })
          } else {
            window.location.replace('/')
          }
        }
        return data
      } else {
        return Promise.reject(data)
      }
    })

    .catch(async err => {
      const _err = { ...err }
      console.log('req catch:', sendData, _err)
      if (!_err.response && !_err.returnMessage) {
        console.log('网络异常，请检查网络连接后重新再试')
        return Promise.reject({
          ...err,
          path: apiPath,
          sendData,
          returnMessage: '网络异常，请检查网络连接后重新再试',
        })
      } else {
        console.log('其他异常')
        return Promise.reject({ ...err, path: apiPath, sendData, resData: err })
      }
      // await errorAction(err, sendData, options)
    })
}

/** - interface - split ------------------------------------------------------------------- */

declare global {
  /**
   * 网络请求参数
   */
  interface RequestParams {
    [key: string]: any
  }

  /**
   * 网络请求返回值
   */
  interface RequestRes {
    /** 状态码,成功返回 200 */
    code: number
    /** 错误消息 */
    message: string
    /** 返回数据 */
    data: any
  }

  /**
   * 请求选项
   */
  interface RequestOptions {
    /** 请求类型: [POST | GET] 默认: POST */
    method?: 'GET' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'POST' | 'PUT' | 'PATCH'
    /** 基本 url, 没有特殊需求无需传递 */
    baseUrl?: string
    /** 请求域名 */
    host?: string
    /** 协议 */
    protocol?: string
    /** 使用 formData 传递参数 */
    formData?: boolean
    /** 接口分组 */
    group?: string
    /** 超时时间,单位: ms */
    timeout?: number
    /** 请求过程中是否显示 Loading */
    loading?: boolean
    /** 发生错误时提示框类型, 默认: notification */
    errorType?: 'notification' | 'message' | 'modal' | false
    /** 自定义请求头 */
    headers?: any
    /** 类型动态设置 */
    responseType?: 'arraybuffer' | 'blob' | 'document' | 'json' | 'text' | 'stream' | undefined
    /**dataType */
    dataType?: string
    /** 是否校验请求状态 */
    checkStatus?: boolean
  }
}
