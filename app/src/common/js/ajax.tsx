// import { loginExit } from '@/src/components'
import { setAppLoading } from '@/src/components/app-loading/appLoading'
import { message } from 'antd'

interface RequestParam {
  url: string //接口地址
  param: any //接口参数
  json?: boolean //是否转成json
  successMsg?: string //是否有成功提示，不传则没有提示，传0为后台提示，传文本则用自定义提示文字
  setLoadState?: ((flag: boolean) => void) | number //设置loading状态的回调
  apiType?: any //使用$api.request还是$mainApi.request；0或不传：$mainApi,1:$api
  headers?: any
}
export const requestApi = (rqParam: RequestParam) => {
  const params = rqParam.param
  const paramHeaders: any = rqParam.headers || {}
  const { apiType, setLoadState } = rqParam
  const headers = {
    loginToken: $store.getState().loginToken,
    ...paramHeaders,
  }
  if (rqParam.json) {
    headers['Content-Type'] = 'application/json; charset=UTF-8'
  }
  // 使用$mainApi时，可以解决有些组织架构数据崩溃的问题，部分传main
  const apiFn = apiType == 'main' ? $mainApi.request : $api.request
  if (setLoadState === 1 && setAppLoading) {
    setAppLoading(true)
  } else if (typeof setLoadState === 'function') {
    setLoadState(true)
  }
  return apiFn(rqParam.url, params, {
    headers: headers,
    formData: rqParam.json ? false : true,
  })
    .then((res: any) => {
      if (setLoadState === 1 && setAppLoading) {
        setAppLoading(false)
      } else if (typeof setLoadState === 'function') {
        setLoadState(false)
      }
      if (res.returnCode === 0) {
        if (rqParam.successMsg != undefined) {
          const msg = rqParam.successMsg === '0' ? res.returnMessage : rqParam.successMsg
          message.success(msg)
        }
        return {
          success: true,
          data: res,
        }
      } else {
        message.error(res.returnMessage)
        // if (res.returnCode === -999 || res.returnCode === -911) {
        //   // 登录过期，直接跳转登录页
        //   loginExit({ key: 'loginOut' })
        // }
        return {
          success: false,
          data: res,
        }
      }
    })
    .catch(function(res) {
      if (setLoadState === 1 && setAppLoading) {
        setAppLoading(false)
      } else if (typeof setLoadState === 'function') {
        setLoadState(false)
      }
      message.error(res.returnMessage)
      return {
        success: false,
        data: res,
      }
    })
}
