import { remote } from 'electron'
import * as xmpp from '@/core/xmpp/im'
import * as websocket from '@/core/websocket/websocket'
// import jsMind from 'jsmind'
import * as api from './api'
import intl from 'react-intl-universal'
export function initRenderer() {
  global.__$tools = remote.getGlobal('__$tools')
  global.__$api = api
  // global.__$mainApi = api
  // global.__$api = remote.getGlobal('__$mainApi')
  global.__$mainApi = remote.getGlobal('__$mainApi')
  global.__$netApi = api
  global.__$store = remote.getGlobal('__$store')
  global.__$xmpp = xmpp
  global.__$websocket = websocket
  // global.__$jsMind = jsMind
  global.__$intl = intl
}
