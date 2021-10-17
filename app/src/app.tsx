import * as React from 'react'
import { ConfigProvider, message } from 'antd'
import zhCN from 'antd/es/locale/zh_CN'
import { AppRouter, AppLayout } from '@/src/components'

import routes from './auto-routes'
import { ipcRenderer } from 'electron'

interface AppProps {
  createConfig: CreateConfig
}

//统一处理发送消息
ipcRenderer.on('send_message_win', (event, args) => {
  const { selectItem } = $store.getState()
  if (selectItem.type === 3) {
    $xmpp.LoginXmpp.getInstance().sendPrivateToRoom(args) //私聊走这个逻辑
  } else {
    $xmpp.LoginXmpp.getInstance().sendMsgToRoom(args[0], args[1])
  }
})

ipcRenderer.on('flash_goalgo', (event, args) => {
  ipcRenderer.send('flash_goalgo', args)
})

export default class App extends React.Component<AppProps> {
  render() {
    const { isMain, showSidebar } = this.props.createConfig
    if (isMain && showSidebar) {
      $websocket.LoginWebSocket.getInstance()
    }
    window.localStorage.wmUserInfo = JSON.stringify({
      userId: $store.getState().nowUserId,
      projectVersion: '1.0.1',
    })
    return (
      <ConfigProvider locale={zhCN}>
        <AppLayout>
          <AppRouter routes={routes} store={$store} isMain={this.props.createConfig.isMain} />
        </AppLayout>
      </ConfigProvider>
    )
  }
}
