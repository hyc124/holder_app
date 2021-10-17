import * as tools from './tools'
import { store } from './store'
import * as api from './api'

export async function initMain() {
  return new Promise(async (resolve: any) => {
    global.__$tools = tools
    global.__$mainApi = api
    global.__$store = store
    resolve()
  })
}
