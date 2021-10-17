import * as xmpp from '@/core/xmpp'
declare global {
  const $xmpp: typeof xmpp
  namespace NodeJS {
    interface Global {
      __$xmpp: typeof $xmpp
    }
  }
}
