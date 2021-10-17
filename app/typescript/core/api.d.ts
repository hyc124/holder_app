import * as api from '@/core/api'
declare global {
  const $api: typeof api
  const $mainApi: typeof api
  const $netApi: typeof api
  namespace NodeJS {
    interface Global {
      __$api: typeof $mainApi
      __$mainApi: typeof $mainApi
      __$netApi: typeof $netApi
    }
  }
}
