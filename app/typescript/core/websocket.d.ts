import * as websocket from '@/core/websocket'
declare global {
  const $websocket: typeof websocket
  namespace NodeJS {
    interface Global {
      __$websocket: typeof $websocket
    }
  }
}
