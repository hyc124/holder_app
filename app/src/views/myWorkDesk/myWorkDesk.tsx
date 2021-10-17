import React, { useState, useEffect, useRef } from 'react'
import { WorkDeskModules } from './workDeskModules'
import { MyWorkDeskHeader } from './myWorkDeskHeader'
import './myWorkDesk.less'
// import { useSelector } from 'react-redux'
// import { findAuthList, getAuthStatus } from '@/src/common/js/api-com'
import { ipcRenderer, remote } from 'electron'
import devConfig from '@root/build/dev.config'
import { loadLocales } from '@/src/common/js/intlLocales'
import ChatList from './chat/ChatList'
import ChatSearch from './chat/ChatSearch'
import path from 'path'
import fs from 'fs'
import { getFunsAuth } from '@/src/components/app-sidebar/appCommonApi'
import { message } from 'antd'
// import { NEWAUTH812 } from '@/src/components/app-sidebar'
const app = remote.app
const userDataPath = app.getPath('userData')
const { BUILD_ENV } = process.env
const env = BUILD_ENV == 'dev' ? 'dev/' : ''
const localPath = path.join(userDataPath, env)
//获取当前任务所对应的企业ID
export const getTaskTeamId = (item: any) => {
  const { selectTeamId } = $store.getState()
  const selectOrgId = selectTeamId == -1 ? '' : selectTeamId
  if (item.hasOwnProperty('ascriptionId') && !!item.ascriptionId) {
    return item.ascriptionId
  } else if (item.hasOwnProperty('teamId') && !!item.teamId) {
    return item.teamId
  } else {
    return selectOrgId
  }
}
export let closeChatWork: any = null
/**
 * 新版工作台框架
 */
const MyWorkDesk = ({ isFollow }: any) => {
  //当前选中的企业ID
  // const selectTeamId = useSelector((state: StoreStates) => state.selectTeamId)
  // const orgId = selectTeamId == -1 ? '' : selectTeamId
  // const [state, setState] = useState({
  //   wuTongAuth: false,
  // })
  // 沟通模块显示隐藏
  const [chatPanelVisible, setChatPanelVisible] = useState(false)
  // 工作台模块区域组件
  const workDeskModulesRef = useRef<any>({})
  // 查询吾同体育入口权限
  // useEffect(() => {
  //   if (orgId !== '' && orgId != -1 && !NEWAUTH812) {
  //     // 查询企业下权限
  //     findAuthList({ typeId: orgId || '' }).then(res => {
  //       // 当前选中企业是否有吾同体育的权限
  //       const isWuTongAuth = getAuthStatus('/api/wuts/index', res || []) //添加企业任务权限
  //       setState({
  //         ...state,
  //         wuTongAuth: isWuTongAuth,
  //       })
  //     })
  //   }
  // }, [orgId])

  //手动打开控制台
  useEffect(() => {
    // 初始化多语言配置
    loadLocales()
    //新增聊天室，添加
    ipcRenderer.on('add_new_chat_room', (_ev, args) => {
      // const { nowAccount } = $store.getState()
      // const env = process.env.BUILD_ENV
      // const ROOM_SERVICE =
      //   env === 'dev'
      //     ? devConfig.env['dev']['variables']['ROOM_SERVICE']
      //     : devConfig.env['prod']['variables']['ROOM_SERVICE']
      // const IPSUFFIX =
      //   env === 'dev'
      //     ? devConfig.env['dev']['variables']['IPSUFFIX']
      //     : devConfig.env['prod']['variables']['IPSUFFIX']
      // // 发送<presence>元素，加入房间
      // const jid = nowAccount.replace('@', '') + IPSUFFIX
      // const mucRoom = args.split('@')[0]
      // const pres = $pres({
      //   from: jid,
      //   to: mucRoom + ROOM_SERVICE + '/' + jid.substring(0, jid.indexOf('@')),
      // }).c('x', { xmlns: 'http://jabber.org/protocol/muc' })
      // $xmpp.LoginXmpp.getInstance().connection.send(pres.tree())
    })
    // 解散退出群
    ipcRenderer.on('remove_chat_room', (_ev, args) => {
      // const { nowAccount } = $store.getState()
      // const env = process.env.BUILD_ENV
      // const ROOM_SERVICE =
      //   env === 'dev'
      //     ? devConfig.env['dev']['variables']['ROOM_SERVICE']
      //     : devConfig.env['prod']['variables']['ROOM_SERVICE']
      // const IPSUFFIX =
      //   env === 'dev'
      //     ? devConfig.env['dev']['variables']['IPSUFFIX']
      //     : devConfig.env['prod']['variables']['IPSUFFIX']
      // // 发送<presence>元素，加入房间
      // const jid = nowAccount.replace('@', '') + IPSUFFIX
      // const mucRoom = args.split('@')[0]
      // const pres = $pres({
      //   to: mucRoom + ROOM_SERVICE + '/' + jid.substring(0, jid.indexOf('@')),
      //   type: 'unavailable',
      // })
      // $xmpp.LoginXmpp.getInstance().connection.send(pres.tree())
    })
    // 开发者工具快捷键Ctrl+Alt+G
    window.addEventListener('keydown', e => {
      const { ctrlKey, altKey, keyCode } = e
      if (ctrlKey && altKey && keyCode === 71) {
        const curtWindow = remote.getCurrentWindow()
        curtWindow && curtWindow.webContents.toggleDevTools()
        e.preventDefault()
      }
    })
    //连接xmpp
    $('.WorkDesk')
      .off()
      .on('click', () => {
        ipcRenderer.send('update_unread_msg', []) //刷新左侧
      })
    //清除选中的Okr周期
    $store.dispatch({ type: 'OKRPERIODFILTER', data: {} })

    fs.readFile(`${localPath}/deskChat.txt`, function(error, data) {
      let getNowChae = false
      if (error) {
        getNowChae = true
        setChatPanelVisible(true)
      } else {
        const fileData = data.toString()
        const dataJson = JSON.parse(fileData)
        setChatPanelVisible(dataJson.chatPanelVisible)
        getNowChae = dataJson.chatPanelVisible
      }
      if (getNowChae) {
        $('.chat-window-tip .red-spot-icon').addClass('hide')
      } else {
        $('.chat-window-tip .red-spot-icon').removeClass('hide')
      }
    })
    closeChatWork = closeChatPanel

    ipcRenderer.removeAllListeners('room_error_tips').on('room_error_tips', (_ev, tips) => {
      message.error(tips || '你已不在本群!', 1)
    })
  }, [])

  const getStat = (filePath: string) => {
    return new Promise(resolve => {
      fs.stat(filePath, (err, stats) => {
        if (err) {
          resolve(false)
        } else {
          resolve(stats)
        }
      })
    })
  }

  // 打开关闭聊天面板
  const closeChatPanel = async () => {
    const file = path.resolve(localPath, './deskChat.txt')
    const data = {
      chatPanelVisible: !chatPanelVisible,
    }
    const isExists = await getStat(localPath)
    if (isExists) {
      // 异步写入数据到文件
      fs.writeFile(file, JSON.stringify(data), { encoding: 'utf8' }, err => {
        console.log(err)
      })
    } else {
      fs.mkdir(localPath, error => {
        if (error) {
          console.log(error)
        } else {
          console.log('创建目录成功')
        }
      })
    }
    if (chatPanelVisible) {
      $('.chat-window-tip .red-spot-icon').removeClass('hide')
    } else {
      $('.chat-window-tip .red-spot-icon').addClass('hide')
    }
    setChatPanelVisible(!chatPanelVisible)
  }

  /**
   * 调用模块初始化刷新方法
   */
  const getDeskModule = () => {
    workDeskModulesRef?.current.getDeskModule()
  }
  const chatAuth = getFunsAuth({ name: 'COMMUNICATION' })
  return (
    <section className="workDeskContainer flex column">
      <header className="workDeskHeader">
        {/* 此处放头部导航组件 */}
        <MyWorkDeskHeader
          updateNums={() => {}} //刷新方法
          isFollow={isFollow}
          // wuTongAuth={state.wuTongAuth}
          getDeskModule={getDeskModule}
          // closeChatPanel={closeChatPanel}
        ></MyWorkDeskHeader>
      </header>
      <main
        className={`workDeskMainContainer flex-1 flex between scrollbarsStyle ${
          !isFollow ? 'myWorkDesk' : 'followWorkDesk'
        }`}
      >
        <WorkDeskModules isFollow={isFollow} ref={workDeskModulesRef} />
        {/* 关注的人工作台不展示沟通 */}
        {!isFollow && chatAuth && (
          <aside className={`workDeskChatAside ${chatPanelVisible ? '' : 'closePannel'}`}>
            <div className="chatTitle">
              <span>沟通</span>
              <span className="closeBtn" onClick={closeChatPanel}></span>
            </div>
            <div className="left_chat_list flex column">
              {/* 查询聊天室 */}
              <ChatSearch />
              {/* 聊天室列表 */}
              <ChatList />
            </div>
          </aside>
        )}
      </main>
    </section>
  )
}

export default MyWorkDesk
