import {
  app,
  Tray,
  ipcMain,
  Menu,
  globalShortcut,
  BrowserWindow,
  shell,
  screen,
  remote,
  // autoUpdater as electronUpdater,
} from 'electron'
import { autoUpdater } from 'electron-updater'
import { creatAppTray } from './tray'
import { windowList } from '@/core/tools'
import elog from 'electron-log'
// 默认的输出日志级别
elog.transports.console.level = false
elog.transports.console.level = 'silly'
//引入截图
import CaptureImg from '@root/assets/resources/screenshotcut/capture-main'
import fs from 'fs-extra'
import isElectronDev from 'electron-is-dev'
import path from 'path'
import axios from 'axios'
import AdmZip from 'adm-zip'
import devConfig from '@root/build/dev.config'
// NSIS处理打包的结果，比如添加一些注册表操作等，通不过electron-updater的sha校验
// 而electron-tiny-updater可以
import { exec, spawn } from 'child_process'
import { tinyUpdater } from '@/src/common/js/electron-tiny-updater/index'
// $tools.log.info(`Application <${$tools.APP_NAME}> launched.`)
// package.json配置
// const { npm_package_name: productName, npm_package_version: version } = process.env
const BUILD_ENV = process.env.BUILD_ENV === 'dev' ? 'dev' : 'prod'
const { UPGRADE_URL } = devConfig.env[BUILD_ENV]['variables']
// const plat = process.arch == 'x64' ? 'x64/' : 'x86/'
const oaUrl = UPGRADE_URL + 'x86/'
/** 储存你应用程序设置文件的文件夹 */
const USER_DATA_PATH: string = app.getPath('userData')
const downloadsPath: string = app.getPath('downloads')
let tray: Tray
app.allowRendererProcessReuse = false
// 忽略与证书相关的错误
app.commandLine.appendSwitch('ignore-certificate-errors')
// 禁用缓存(防止打开外部链接不刷新)
// app.commandLine.appendSwitch('--disable-http-cache')
// const isElectronDev = true
// 崩溃测试
// process.crash()
//隐藏菜单栏
const isMac = process.platform === 'darwin'
const template: any = [
  {
    label: app.name,
    submenu: [{ role: 'quit' }],
  },
  {
    label: 'File',
    submenu: [{ role: 'close' }],
  },
  {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
    ],
  },
  {
    label: 'Window',
    submenu: [
      { role: 'minimize' },
      { role: 'zoom' },
      { type: 'separator' },
      { role: 'front' },
      { type: 'separator' },
      { role: 'window' },
    ],
  },
]
/**
 * 注册快捷键 (globalShortcut全局注册方法)
 */
function doRegister(cmd: Electron.Accelerator, callback: { (): void; (): void }) {
  // const registed = globalShortcut.isRegistered(cmd)
  // if (registed) return
  globalShortcut.register(cmd, callback)
}
function registerShortcut() {
  doRegister('Alt+F12', function() {
    // console.log('Alt+F12')
    const win: any = BrowserWindow.getFocusedWindow()
    if (!win) return
    // console.log('toggleTools')
    win.toggleDevTools()
  })
  doRegister('Alt+Q', function() {
    // console.log('Alt+Q')
    CaptureImg().then(() => {
      windowList.get('ChatWin')?.webContents.send('show-capture-img')
    })
  })
  // mac中command+m窗口最小化
  isMac &&
    doRegister('command+m', function() {
      console.log('command+m')
      const win: any = BrowserWindow.getFocusedWindow()
      console.log(isMac)
      console.log(win)
      if (!win) return
      win?.minimize()
    })
  return
}
//单实例窗口
if (isMac) {
  app.on('ready', () => {
    elog.log('真的ready啦')
    tray = creatAppTray()
    $tools.createWindow('Home')
    registerShortcut()
  })
} else {
  const theLock = app.requestSingleInstanceLock()
  if (!theLock) {
    app.quit()
  } else {
    app.on('second-instance', (commandLine, workingDirectory) => {
      const win = windowList.get('Home')
      elog.log('second-instance----', win)
      if (win) {
        if (win.isMinimized()) win.restore()
        win.focus()
        win.show()
      }
    })
    app.on('ready', () => {
      elog.log('真的ready啦')
      tray = creatAppTray()
      $tools.createWindow('Home')
      registerShortcut()
    })
  }
}
// const templateWin: any = [
//   {
//     label: 'F12',
//     click: function() {
//       windowList.get('Home')?.webContents.openDevTools()
//     },
//   },
// ]
if (isMac) {
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
} else {
  // const winMenu = Menu.buildFromTemplate(templateWin)
  Menu.setApplicationMenu(null)
}
//窗口最小化
ipcMain.on('window_min', (_event, args) => {
  const winHash = args.winHash
  windowList.get(winHash)?.minimize()
})
//窗口最大化,向下恢复
ipcMain.on('window_restore', (_event, args) => {
  const winHash = args.winHash
  const win = windowList.get(winHash)
  if (win) {
    if (win.isMaximized()) {
      win.restore()
    } else {
      win.maximize()
    }
  }
})
//关闭窗口
ipcMain.on('win_close', (_event, args) => {
  const winHash = args.winHash
  windowList.get(winHash)?.hide()
  windowList.get(winHash)?.webContents.send('win_close_ed', args)
})
//关闭附件窗口
ipcMain.on('close_file_window', () => {
  windowList.get('fileWindow')?.hide()
  // windowList.delete('fileWindow')
})

//外部调用审批弹窗
ipcMain.on('open_approval_tab', (_event, args) => {
  windowList.get('Approval')?.webContents.send('open_approval_tab', args)
})

// 清空输入框值
ipcMain.on('clear_inp_val', (_event, args) => {
  windowList.get('Approval')?.webContents.send('clear_inp_val', args)
})

app.on('activate', () => {
  //只针对mac
  if (isMac && windowList) {
    windowList.get('Home')?.show()
  }
})

app.on('before-quit', () => {
  $tools.log.info(`Application <${$tools.APP_NAME}> has exited normally.`)
  globalShortcut.unregister('Alt+Q')
  globalShortcut.unregister('Alt+F12')
  if (process.platform === 'win32') {
    tray.destroy()
    app.exit()
  } else if (isMac) {
    app.exit(0)
  }
})
/**
 * 应用单实例
 */
// const gotTheLock = app.requestSingleInstanceLock()
// const mainHome = windowList.get('Home')
// if (!gotTheLock) {
//   app.quit()
// } else {
//   app.on('second-instance', (event, commandLine, workingDirectory) => {
//     // 当运行第二个实例时,将会聚焦到mainHome这个窗口
//     if (mainHome) {
//       if (mainHome.isMinimized()) {
//         mainHome.restore()
//       } else {
//         mainHome.focus()
//       }
//     }
//   })
// }
// 打开开发者工具
ipcMain.on('openDevTools', () => {
  windowList.get('Home')?.webContents.openDevTools()
})

//截图
ipcMain.on('capture-screen', () => {
  CaptureImg().then(() => {
    windowList.get('ChatWin')?.webContents.send('show-capture-img')
  })
})

// 上传图片进度
ipcMain.on('upload_file_process', (_event, args) => {
  windowList.get('ChatWin')?.webContents.send('upload_file_process', args)
})

//隐藏沟通窗口后截图
ipcMain.on('hideChat-and-capture-screen', () => {
  windowList.get('ChatWin')?.minimize()
  setTimeout(() => {
    CaptureImg().then(() => {
      windowList.get('ChatWin')?.webContents.send('show-capture-img')
      windowList.get('ChatWin')?.show()
    })
  }, 150)
})

//消息发送失败
ipcMain.on('error-send-msg', (_event, args) => {
  windowList.get('ChatWin')?.webContents.send('error-send-msg', args)
})

// 更新即时消息
ipcMain.removeAllListeners('set_now_msg').on('set_now_msg', (_event, args) => {
  windowList.get('ChatWin')?.webContents.send('set_now_msg', args)
})

// 联网后重写请求聊天室的数据
ipcMain.removeAllListeners('connected_now_msg').on('connected_now_msg', (_event, args) => {
  windowList.get('ChatWin')?.webContents.send('connected_now_msg', args)
})

// xmpp连接异常时
ipcMain.removeAllListeners('connected_error').on('connected_error', (_event, args) => {
  windowList.get('ChatWin')?.webContents.send('connected_error', args)
})

// 聊天室失效提示
ipcMain.removeAllListeners('room_error_tips').on('room_error_tips', (_event, args) => {
  windowList.get('Home')?.webContents.send('room_error_tips', args)
})

// 更新聊天室列表简略消息
ipcMain.on('update_chat_room', (_event, args) => {
  windowList.get('Home')?.webContents.send('update_chat_room', args)
  windowList.get('Home')?.webContents.send('update_chatTip_room', args)
})

// 进入聊天室更新对方未读红点
ipcMain.on('enter_room_update_log', (_event, args) => {
  windowList.get('Home')?.webContents.send('enter_room_update_log', args)
})

// 关闭聊天窗口
ipcMain.on('close_chat_win', () => {
  windowList.get('ChatWin')?.hide()
  windowList.get('ChatHistory')?.close()
  windowList.get('ChatHistory')?.destroy()
  windowList.delete('ChatHistory')
})

/***
 * 任务栏高亮
 */
let goalgoTimer: any = null
ipcMain.on('flash_goalgo', (e, args) => {
  const win = args[1]
  const isFlash = args[0]
  const chatWin = windowList?.get('ChatWin')
  const homeWin = windowList?.get('Home')
  try {
    if (isFlash) {
      goalgoTimer && clearInterval(goalgoTimer)
      if (win === 'ChatWin' && (chatWin?.isMinimized() || !chatWin?.isVisible() || !chatWin?.isFocused())) {
        if (chatWin && chatWin?.flashFrame) {
          chatWin?.flashFrame(true)
        }
        goalgoTimer = setInterval(() => {
          if (chatWin && chatWin?.flashFrame) {
            chatWin?.flashFrame(true)
          }
        }, 5000)
      } else if (win === 'Home' && (homeWin?.isMinimized() || !homeWin?.isVisible() || !homeWin?.isFocused())) {
        if (homeWin && homeWin?.flashFrame) {
          homeWin?.flashFrame(true)
        }
        goalgoTimer = setInterval(() => {
          if (homeWin && homeWin?.flashFrame) {
            homeWin?.flashFrame(true)
          }
        }, 5000)
      }
    } else {
      if (win === 'ChatWin') {
        goalgoTimer && clearInterval(goalgoTimer)
        goalgoTimer = null
        windowList?.get?.('ChatWin')?.flashFrame && windowList?.get?.('ChatWin')?.flashFrame(false)
        windowList?.get?.('Home')?.flashFrame && windowList?.get?.('Home')?.flashFrame(false)
      } else if (win === 'Home') {
        goalgoTimer && clearInterval(goalgoTimer)
        goalgoTimer = null
        windowList?.get?.('Home')?.flashFrame && windowList?.get?.('Home')?.flashFrame(false)
      }
    }
  } catch (error) {
    elog.log('main进程错误:', error)
  }

  // const isFlash = args[0]
  // const chatWin = windowList.get('ChatWin')
  // const flashWin = !chatWin || !chatWin?.isVisible() ? windowList.get('Home') : chatWin
  // if (flashWin) {
  //   //情况一
  //   if (isFlash && (chatWin?.isMinimized() || !chatWin?.isVisible() || !chatWin?.isFocused())) {
  //     goalgoTimer && clearInterval(goalgoTimer)
  //     flashWin.flashFrame(true)
  //     goalgoTimer = setInterval(() => {
  //       flashWin.flashFrame(true)
  //     }, 5000)
  //   } else {
  //     clearInterval(goalgoTimer)
  //     goalgoTimer = null
  //     windowList.get('ChatWin')?.flashFrame(false)
  //     windowList.get('Home')?.flashFrame(false)
  //   }
  // }
})

/***
 * 取消任务栏高亮
 */
ipcMain.on('force_cancel_flash', () => {
  goalgoTimer && clearInterval(goalgoTimer)
  goalgoTimer = null

  windowList.get('ChatWin')?.flashFrame(false)
  windowList.get('Home')?.flashFrame(false)
})

// 上线下线即时更新
ipcMain.on('user_online_or_offline', (_event, args) => {
  windowList.get('ChatWin')?.webContents.send('user_online_or_offline', args)
})

// 图标表态推送
ipcMain.on('take_icon_stand', (_event, args) => {
  windowList.get('ChatWin')?.webContents.send('take_icon_stand', args)
})

// 进入聊天室推送更新消息未读数
ipcMain.on('enter_room_userinfo', (_event, args) => {
  windowList.get('ChatWin')?.webContents.send('enter_room_userinfo', args)
})

//监听用户上下线
ipcMain.on('onAndoffLine', (_e, data) => {
  if (windowList != null && data) {
    windowList.get('ChatWin')?.webContents.send('onAndoffLine_info', data)
  }
})

//打开沟通对应聊天窗口
ipcMain.on('show_commuciate_muc', (_event, args) => {
  // // $tools.createWindow('ChatWin', { sendOptions: args })
  const ChatWin = windowList.get('ChatWin')
  if (ChatWin) {
    windowList.get('ChatWin')?.show()
    if (typeof args !== 'string') {
      setTimeout(() => {
        ChatWin.webContents.send('show_commuciate_muc', args)
      }, 200)
    }
  } else {
    $tools.createWindow('ChatWin', { sendOptions: args })
  }
})

ipcMain.on('IS_KNOW_TIME_STAMP', (_e, args) => {
  windowList.get('ChatWin')?.webContents.send('IS_KNOW_TIME_STAMP', args)
})

// 消息推送事件处理显示主窗口
ipcMain.on('show_home', () => {
  windowList.get('Home')?.show()
})

ipcMain.on('send_message', (_event, args) => {
  windowList.get('Home')?.webContents.send('send_message_win', args)
})

// 考勤推送
ipcMain.on('start_approval', (_event, args) => {
  windowList.get('Home')?.webContents.send('start_approval', args)
})

//打开代办消息窗口
ipcMain.on('show_notice_window', () => {
  // const noticeWin = windowList.get('SystemNoticeWin')
  setTimeout(() => {
    // if (noticeWin) {
    // 本行代码总是报错noticeWin对象已销毁
    //   noticeWin.close()
    //   $tools.createWindow('SystemNoticeWin')
    // } else {
    //   $tools.createWindow('SystemNoticeWin')
    // }
    $tools.createWindow('SystemNoticeWin')
  }, 10)
})

ipcMain.on('handle_report_model', (_event, args) => {
  windowList.get('Home')?.webContents.send('handle_report_modeles', args)
})

//关闭代办消息窗口
ipcMain.on('close_notice_window', () => {
  windowList.get('SystemNoticeWin')?.close()
  windowList.get('SystemNoticeWin')?.destroy()
  windowList.delete('SystemNoticeWin')
})

// 打开公告详情
ipcMain.on('open_notice_details_win', () => {
  const NoticeDetailWin = windowList.get('NoticeDetailWin')
  if (NoticeDetailWin) {
    $tools.activeWindow('NoticeDetailWin')
  } else {
    $tools.createWindow('NoticeDetailWin')
  }
})

// 关闭公告详情窗口
ipcMain.on('close_notice_details_win', () => {
  windowList.get('NoticeDetailWin')?.hide()
})

// 刷新规划列表
ipcMain.on('refresh_plan_list_main', (_event, args) => {
  windowList.get('Home')?.webContents.send('refresh_plan_list', args)
})

//关闭发起审批窗口-优化打开窗口速度：窗口隐藏不关闭
ipcMain.on('close_goalgo_execute', () => {
  windowList.get('ApprovalExecute')?.hide()
})
//关闭关注人窗口
ipcMain.on('close_goalgo_follow', () => {
  windowList.get('FollowWorkDesk')?.hide()
})
//关闭工作规划窗口
ipcMain.on('close_work_mind', () => {
  // windowList.get('workplanMind')?.minimize()
  windowList.get('workplanMind')?.hide()
})
//关闭工作规划窗口
ipcMain.on('close_work_mind_shut', () => {
  windowList.get('workplanMind')?.close()
  windowList.delete('workplanMind')
})
//关闭okr窗口
ipcMain.on('close_okr_mind', () => {
  windowList.get('okrFourquadrant')?.hide()
})
//处理okr列表概况统计更新
ipcMain.on('solve_okrList_generalView', (_event, args) => {
  windowList.get('Home')?.webContents.send('refresh_okrList_generalView', args)
})
//处理okr列表宽详情更新
ipcMain.on('solve_okrList_detail', (_event, args) => {
  windowList.get('Home')?.webContents.send('hanle_okrList_detail', args)
})

//关闭禅道窗口
ipcMain.on('close_chanDao_window', (_event, args) => {
  windowList.get('ChandaoWindow')?.close()
  windowList.delete('ChandaoWindow')
  console.log('close_chanDao_window-------------', args)
  if (args && args.createWindow) {
    $tools.createWindow('ChandaoWindow')
  }
})
//关闭公告弹窗
ipcMain.on('close_addModal_window', () => {
  windowList.get('AddModalWin')?.close()
  // windowList.delete('AddModalWin')
})
//关闭吾同体育窗口
ipcMain.on('close_wuTong_window', () => {
  windowList.get('WuTongWindow')?.close()
  windowList.delete('WuTongWindow')
})
//右下角弹窗事件处理
ipcMain.on('handle_messages', (_event, args) => {
  windowList.get('Home')?.webContents.send('handleMessage', args)
})
//右下角弹窗事件处理(事件操作后)
ipcMain.on('handle_messages_option', (_event, args) => {
  windowList.get('SystemNoticeWin')?.webContents.send('handleMessageOption', args)
})
//关闭发起汇报窗口
ipcMain.on('close_daily_summary', () => {
  windowList.get('DailySummary')?.hide()
})

ipcMain.on('close_see_win', () => {
  windowList.get('seeWin')?.hide()
})
//关闭发起报告窗口
ipcMain.on('close_work_report', (_event, args) => {
  windowList.get('WorkReport')?.close()
  windowList.delete('WorkReport')
})

//关闭微信扫码窗口
ipcMain.on('close_we_chat_scan', () => {
  windowList.get('WeChatScan')?.close()
  windowList.delete('WeChatScan')
})

//关闭会议弹窗
ipcMain.on('clear_request', () => {
  windowList.get('WeChatScan')?.webContents.send('clear_request')
})

//关闭强制汇报窗口
ipcMain.on('close_force_report', () => {
  windowList.get('createForceReport')?.hide()
})

//监听强制汇报操作清空、删除数据
ipcMain.on('handerForceReport', (_e, data) => {
  if (windowList != null && data) {
    windowList.get('createForceReport')?.webContents.send('handerForceReport_info', data)
    windowList.get('Home')?.webContents.send('handerForceReport_info', data)
  }
})

//附件下载

// 任务操作后总体刷新
ipcMain.on('refresh_operated_task_main', (_event, args) => {
  windowList.get('Home')?.webContents.send('refresh_operated_task', args)
  windowList.get('workplanMind')?.webContents.send('refresh_operated_report', args)
  windowList.get('OkrDetailWindow')?.webContents.send('refresh_operated_task', args)
})

//关闭会议弹窗
ipcMain.on('close-meet-modal', () => {
  windowList.get('Home')?.webContents.send('close-meet-modal')
})

//新增聊天室
ipcMain.on('add_new_chat_room', (_event, args) => {
  windowList.get('Home')?.webContents.send('add_new_chat_room', args)
})

// 退出解散聊天室
ipcMain.on('remove_chat_room', (_event, args) => {
  windowList.get('Home')?.webContents.send('remove_chat_room', args)
})

//更新审批导航栏数量
ipcMain.on('refresh_approval_count', (e, args) => {
  windowList.get('Approval')?.webContents.send('refresh_approval_count', args)
})

//更新审批右侧提交备注附件信息
ipcMain.on('refresh_approval_handleFile', (e, args) => {
  windowList.get('Approval')?.webContents.send('refresh_approval_handleFile', args)
})

// 更新公告侧边栏数量
ipcMain.on('update_notice_count', () => {
  windowList.get('Home')?.webContents.send('update_notice_count')
})
// 打开外部应用窗口
const outSideAppWindowList: Map<RouterKey, BrowserWindow> = new Map()
ipcMain.on('open-outside-app', (_event, args) => {
  const dataKey = args[0]
  const dataUrl = args[1]
  const currentWin = outSideAppWindowList.get(dataKey)
  if (currentWin) {
    currentWin.show()
  } else {
    const win = new BrowserWindow({ width: 1920, height: 1080 })
    outSideAppWindowList.set(dataKey, win)
    win.loadURL(dataUrl)
    win.show()
    // 外部窗口alter后input无法获取焦点
    const isWindows = process.platform === 'win32'
    let needsFocusFix = false
    let triggeringProgrammaticBlur = false

    win.on('blur', () => {
      if (!triggeringProgrammaticBlur) {
        needsFocusFix = true
      }
    })

    win.on('focus', () => {
      if (isWindows && needsFocusFix) {
        needsFocusFix = false
        triggeringProgrammaticBlur = true
        setTimeout(function() {
          win.blur()
          win.focus()
          setTimeout(function() {
            triggeringProgrammaticBlur = false
          }, 100)
        }, 100)
      }
    })
    win.once('close', () => {
      outSideAppWindowList.get(dataKey)?.close()
      outSideAppWindowList.get(dataKey)?.destroy()
      outSideAppWindowList.delete(dataKey)
    })
  }
})

// 退出登录
ipcMain.on('close_all_window', () => {
  if (windowList) {
    windowList.forEach((_v: any, key: any) => {
      if (key != 'Home') {
        windowList.get(key)?.close()
        windowList.get(key)?.destroy()
        windowList.delete(key)
      }
    })
  }
  if (outSideAppWindowList) {
    outSideAppWindowList.forEach((_v: any, key: any) => {
      if (key != 'Home') {
        outSideAppWindowList.get(key)?.close()
        outSideAppWindowList.get(key)?.destroy()
        outSideAppWindowList.delete(key)
      }
    })
  }
  // 清空窗口缓存信息
  $store.dispatch({
    type: 'WINDOWS_INFO',
    data: {
      windowActive: {
        name: '',
        active: true,
      },
      loadedInfo: [],
    },
  })
})

//我发起的审批撤回更新列表和按钮状态
ipcMain.on('change_list_item_status', (ev, args) => {
  windowList.get('Approval')?.webContents.send('change_list_item_status', args)
})

// 更新侧边栏未读消息
ipcMain.on('update_unread_msg', (_event, args) => {
  windowList.get('Home')?.webContents.send('update_unread_msg', args)
})
//更新工作台数量展示
ipcMain.on('update_unread_num', (_event, args) => {
  windowList.get('Home')?.webContents.send('update_unread_num', args)
})
//公告回调刷新公告列表 publishSuccess
ipcMain.on('refresh_publish_success', (_event, args) => {
  windowList.get('Home')?.webContents.send('refresh_publish_success', args)
})
//监听任务完成提示框展示状态
ipcMain.on('task_finish_visble', (_event, args) => {
  windowList.get('Home')?.webContents.send('task_finish_visble', args)
})

//监听工作台汇报数量红点展示
ipcMain.on('report_content_read', (_event, args) => {
  windowList.get('Home')?.webContents.send('report_content_read', args)
})
//监听会议工作台会议,沟通红点
ipcMain.on('refresh_meet_connect', (_event, args) => {
  windowList.get('Home')?.webContents.send('refresh_meet_connect', args)
  windowList.get('Home')?.webContents.send('update_chatTip_room', args)
})
//禅道监听
ipcMain.on('open_chandao_window', (_event, args) => {
  windowList.get('Home')?.webContents.send('open_chandao_window', args)
})
//禅道吾同体育
ipcMain.on('open_wutong_window', (_event, args) => {
  windowList.get('Home')?.webContents.send('open_wutong_window', args)
})
//更新工作台模块数量
ipcMain.on('update_module_num', (_event, args) => {
  windowList.get('Home')?.webContents.send('update_module_num', args)
})
//工作台加载刷新当前模块
ipcMain.on('refresh_this_module', (_event, args) => {
  windowList.get('Home')?.webContents.send('refresh_this_module', args)
})
//刷新工作台侧边栏企业
ipcMain.on('refresh_desk_module', (_event, args) => {
  windowList.get('Home')?.webContents.send('refresh_desk_module', args)
})
// 刷新工作台关注的台账
ipcMain.on('refresh_standing_book', (_event, args) => {
  windowList.get('Home')?.webContents.send('refresh_standing_book', args)
})
// okr独立窗口关闭
ipcMain.on('close_okrDetailWindow', () => {
  windowList.get('OkrDetailWindow')?.close()
  windowList.delete('OkrDetailWindow')
})
//处理okr列表周期统计刷新
ipcMain.on('refresh_period_single_totals', (_event, args) => {
  windowList.get('Home')?.webContents.send('refresh_period_single_totals', args)
})
// *****************************自动更新************************//
// 下载远程压缩包并写入指定文件
function downloadFile(uri: string, filename: string) {
  // const filePath = path.resolve(filename)
  const writer = fs.createWriteStream(filename)
  return new Promise(resolve => {
    axios
      .get(uri, { responseType: 'stream' })
      .then((res: any) => {
        res.data.pipe(writer)
      })
      .catch((error: any) => {
        elog.log('downloadFile error:', error)
        resolve({ success: false, error })
      })
    writer.on('finish', (res: any) => {
      resolve({ success: true, res })
    })
    writer.on('error', (error: any) => {
      resolve({ success: false, error })
    })
  })
}

// 删除文件夹
function deleteDirSync(dir: string) {
  const files = fs.readdirSync(dir)
  // eslint-disable-next-line @typescript-eslint/prefer-for-of
  for (let i = 0; i < files.length; i++) {
    const newPath = path.join(dir, files[i])
    const stat = fs.statSync(newPath)
    if (stat.isDirectory()) {
      // 如果是文件夹就递归下去
      deleteDirSync(newPath)
    } else {
      // 删除文件
      fs.unlinkSync(newPath)
    }
  }
  fs.rmdirSync(dir) // 如果文件夹是空的，删除自身
}
/**
 * 删除文件
 */
export const deleteDirFile = (path: string) => {
  if (path && fs.existsSync(path)) {
    fs.unlinkSync(path)
  }
}
// 增量更新
ipcMain.on('checkForPartUpdates', async (_, res) => {
  // const isWin = process.platform === 'win32'
  const win = windowList.get('Home')
  elog.log('增量更新 init:', res)
  // updateNodeModules：是否需要更新node_modules
  const { updateNodeModules, updateUpgradeExe } = res || {}
  // 从服务端获取更改window控制面板程序版本号的程序名
  const upgradeExeName = updateUpgradeExe
    ? typeof updateUpgradeExe == 'string'
      ? updateUpgradeExe
      : 'upgrade.exe'
    : ''
  //线上更新地址
  const fetchUrl = devConfig.env[BUILD_ENV]['variables']['PART_UPDATE_URL']
  //触发增量更新
  let localresourcePath = ''
  let resourcePath = ''
  let appZipPath = ''
  let nodeModulePath = ''
  const remoteAppURL = fetchUrl + 'app.zip' // 你的远程文件服务器
  // 服务器上修改版本号等信息的程序
  const upgradeExeURL = `${fetchUrl}${upgradeExeName}`
  // 修改版本号等信息的程序
  let upgradeExePath = ''
  const appName = app.getName()
  elog.log('app.getName:', appName, isElectronDev)
  if (!isElectronDev && process.platform === 'win32') {
    // win平台
    localresourcePath = './resources/app/dist'
    resourcePath = './resources/app'
    appZipPath = './resources/app/app.zip'
    nodeModulePath = updateNodeModules ? './resources/app/node_modules' : ''
    upgradeExePath = updateUpgradeExe ? `./${upgradeExeName}` : ''
    console.log('appZipPath定义:', appZipPath)
  }
  // elog.log('resourcePath:', resourcePath)
  // asar包方式：windows位置resources下
  // if (!isElectronDev && process.platform === 'win32') {
  //   // win平台
  //   localresourcePath = './resources/dist'
  //   resourcePath = './resources'
  //   appZipPath = './resources/app.zip'
  // }
  if (!isElectronDev && isMac) {
    // mac平台 mac系统中应用的本地文件位置
    // const appName = app.getName()
    localresourcePath = `/Applications/holder.app/Contents/Resources/app/dist`
    resourcePath = `/Applications/holder.app/Contents/Resources/app`
    appZipPath = `/Applications/holder.app/Contents/Resources/app/app.zip`
    // nodeModulePath = updateNodeModules ? `/Applications/holder.app/Contents/Resources/app/node_modules` : ''
  }
  try {
    // 字体下载

    if (fs.existsSync(`${localresourcePath}.back`)) {
      // 删除主进程dist旧备份
      deleteDirSync(`${localresourcePath}.back`)
    }
    if (fs.existsSync(`${nodeModulePath}.back`)) {
      // 删除node_modules旧备份
      deleteDirSync(`${nodeModulePath}.back`)
    }
    if (fs.existsSync(localresourcePath)) {
      fs.renameSync(localresourcePath, `${localresourcePath}.back`) // 备份目录
    }
    if (nodeModulePath && fs.existsSync(nodeModulePath)) {
      fs.renameSync(nodeModulePath, `${nodeModulePath}.back`) // 备份node_modules
    }
    if (resourcePath && !fs.existsSync(resourcePath)) {
      fs.mkdirSync(resourcePath) // 创建app来解压用
    }
    if (localresourcePath && !fs.existsSync(localresourcePath)) {
      fs.mkdirSync(localresourcePath) // 创建dist
    }
    // 下载app.zip
    const appZipInfo: any = await downloadFile(remoteAppURL, appZipPath)
    // 下载upgrade.exe
    let upgradeExe: any = { success: true }
    // Windows系统：下载修改版本号的exe程序
    if (process.platform === 'win32' && upgradeExePath) {
      upgradeExe = await downloadFile(upgradeExeURL, upgradeExePath)
    }

    const appZipPathRv = path.resolve(appZipPath)
    elog.log('appZipInfo:', appZipInfo)
    elog.log('appZipPath:', appZipPathRv)
    if (!appZipInfo.success) {
      if (!appZipInfo.success) {
        elog.log('增量更新写入错误appZipInfo:', appZipInfo.error)
      }
      // 更新错误则弹框下载安装包
      win?.webContents.send('upgrade_error', {
        upgradeType: 'part',
        progressTxt: '系统更新错误！',
        progress: 0,
        errorMsg: !appZipInfo.success ? appZipInfo.error : '',
      })
      // 还原文件夹名
      if (fs.existsSync(`${localresourcePath}.back`)) {
        fs.renameSync(`${localresourcePath}.back`, localresourcePath)
      }
      if (nodeModulePath && fs.existsSync(`${nodeModulePath}.back`)) {
        fs.renameSync(`${nodeModulePath}.back`, nodeModulePath)
      }
      return
    }
    elog.log('app.zip下载完成')

    try {
      // 同步解压缩
      const unzip = new AdmZip(appZipPath)
      unzip.extractAllTo(resourcePath, true)
      elog.log('增量更新解压完成')
      win?.webContents.send('reload-app')
      // 删除压缩包
      deleteDirFile(appZipPath)

      // 字体下载
      // const downloadFontInfo: any = await downloadFont()
      // if (!upgradeExe.success) {
      elog.log('增量更新写入upgradeExe错误upgradeExeInfo:', upgradeExe.error)
      // }
      // 修改版本号的程序存在则静默运行-Windows系统才需要
      if (
        process.platform === 'win32' &&
        upgradeExePath &&
        fs.existsSync(upgradeExePath) &&
        upgradeExe.success
      ) {
        try {
          let execPath = path.resolve(upgradeExePath)
          if (isMac) {
            execPath = `open ${execPath}`
          }
          elog.log('upgradeExePath:', execPath)
          // spawn打开程序文件 /S：静默安装
          const child = spawn('cmd.exe', ['/c', execPath], {
            detached: true, //detached 为 true 可以使子进程在父进程退出后继续运行
            stdio: 'ignore', // ['ignore', process.stdout, process.stderr]
          })
          // 默认情况下，父进程将会等待被分离的子进程退出。 为了防止父进程等待 subprocess，使用 subprocess.unref() 方法。
          child.unref()
          // 等待进程
          child.on('close', function(code) {
            elog.log('进程close code : ' + code)
            setTimeout(() => {
              elog.log('relaunch重启开始')
              app.relaunch() // 重启
              app.exit(0)
            }, 1800)
          })
        } catch (error) {
          elog.log('upgradeExe 错误:', error)
          // if (!downloadFontInfo.success) {
          //   elog.log('字体下载 错误:', error)
          // }
        }
      } else {
        elog.log('app.zip解压完成，准备重启')
        setTimeout(() => {
          elog.log('relaunch重启开始')
          app.relaunch() // 重启
          app.exit(0)
        }, 1800)
      }
    } catch (error) {
      elog.log('extractAllToERROR:', error)
      // 更新错误则弹框下载安装包
      win?.webContents.send('upgrade_error', {
        upgradeType: 'part',
        progressTxt: '系统更新错误！',
        progress: 0,
        errorMsg: error,
      })
      if (fs.existsSync(`${localresourcePath}.back`)) {
        fs.renameSync(`${localresourcePath}.back`, localresourcePath)
      }
      if (nodeModulePath && fs.existsSync(`${nodeModulePath}.back`)) {
        fs.renameSync(`${nodeModulePath}.back`, nodeModulePath)
      }
    }
  } catch (error) {
    elog.log('checkForPartUpdatesERROR:', error)
    // 更新错误则弹框下载安装包
    win?.webContents.send('upgrade_error', {
      upgradeType: 'part',
      progressTxt: '系统更新错误！',
      progress: 0,
      errorMsg: error,
    })
    if (fs.existsSync(`${localresourcePath}.back`)) {
      fs.renameSync(`${localresourcePath}.back`, localresourcePath)
    }
    if (nodeModulePath && fs.existsSync(`${nodeModulePath}.back`)) {
      fs.renameSync(`${nodeModulePath}.back`, nodeModulePath)
    }
  }
})

// 无需更新清空
ipcMain.on('no_upgrade_send', () => {
  // downloadFont()
  elog.log('no_upgrade_send： 无需更新')
})

//autoUpdate全量更新：electron-builder方法
export function updateHandle() {
  /**
   * 用户点击确定重启更新
   */
  ipcMain.on('quitAndInstall', () => {
    elog.log('quitAndInstall')
    autoUpdater.quitAndInstall()
  })
  /**
   * 监听渲染进程发起更新请求
   */
  ipcMain.on('checkForUpdates', () => {
    autoUpdater.checkForUpdates()
    elog.log('checkForUpdates')
  })

  /**
   * 正在检查更新
   */
  // autoUpdater.on("checking-for-update", () => {})

  /**
   * 更新可用, 可以通过通知系统告知用户有更新可用
   */
  autoUpdater.on('update-available', () => {
    const win = windowList.get('Home')
    if (win) {
      win.webContents.send('update-available', true)
    }
    elog.log('update-available')
  })

  /**
   * 下载进度
   */
  autoUpdater.on('download-progress', (progressObj: any) => {
    const win = windowList.get('Home')
    if (win) {
      let logMessage: any = '已下载: '
      if (progressObj.percent == 100) {
        logMessage = '已完成：'
      }
      logMessage =
        logMessage +
        progressObj.percent.toFixed(1) +
        '%' +
        ' (' +
        (progressObj.transferred / 1024 / 1024).toFixed(1) +
        'MB/' +
        (progressObj.total / 1024 / 1024).toFixed(1) +
        'MB)'
      win.webContents.send('download-progress', logMessage, progressObj.percent.toFixed(2))
    }
  })

  /**
   * 更新下载完成后, 可提示用户重启应用程序
   */
  autoUpdater.on('update-downloaded', () => {
    const win = windowList.get('Home')
    if (win) {
      win.webContents.send('update-downloaded', true)
      // autoUpdater.quitAndInstall()
    }
  })
  /**
   * 更新错误
   */
  autoUpdater.on('error', (e, error) => {
    elog.error('update_error', e, error)
    const win = windowList.get('Home')
    if (win) {
      win.webContents.send('update-available', true)
      win.webContents.send('download-progress', '更新安装包错误，请检查网络后重试！', -1)
      win.webContents.send('update_error', true)
    }
  })

  /**
   * 断网异常
   */
  process.on('uncaughtException', function(e) {
    const win = windowList.get('Home')
    if (win) {
      win.webContents.send('update-available', true)
      win.webContents.send('download-progress', '更新安装包失败，请检查网络后重试！', -1)
      win.webContents.send('update_error', true)
    }
    elog.log('uncaughtException', e)
  })

  /**
   * 没有新版本
   */
  // autoUpdater.on("update-not-available", () => {})

  /**
   * 更新失败退出
   */
  ipcMain.on('quitOut', (e, error) => {
    elog.log('quitOut', e, error)
    app.quit()
  })
}

//electron-tiny-updater全量更新方法
export function autoUpdateHandle() {
  elog.log('autoUpdateHandle init')
  let execPath: any = ''
  // 服务器全量更新文件数据
  let latestJson: any = {}
  // let downloadPath = ''
  // 进度展示信息
  const getProgressInfo = ({ percent, total, transferred }: any) => {
    // 下载中
    let logMessage: any = '已下载: '
    if (percent == 100) {
      logMessage = '已完成：'
    }
    logMessage =
      logMessage +
      percent +
      '%' +
      ' (' +
      (transferred / 1024 / 1024).toFixed(1) +
      'MB/' +
      (total / 1024 / 1024).toFixed(1) +
      'MB)'
    return { logMessage }
  }
  /**
   * 用户点击确定重启更新
   */
  ipcMain.on('quitAndInstall', () => {
    // const batPath = path.join(downloadPath, 'goalgo.bat')
    elog.log('执行重新安装quitAndInstall', execPath)
    let commandInfo = execPath
    if (isMac) {
      commandInfo = `open ${execPath}`
      shell.openItem(execPath)
    } else {
      // exec打开程序文件
      exec(commandInfo, function(err: any) {
        elog.log('程序结束信息:', err)
      })
    }

    // spawn打开程序文件
    // const child = spawn('cmd.exe', ['/c', commandInfo], {
    //   detached: true, //detached 为 true 可以使子进程在父进程退出后继续运行
    //   stdio: 'ignore', // ['ignore', process.stdout, process.stderr]
    // })
    // 默认情况下，父进程将会等待被分离的子进程退出。 为了防止父进程等待 subprocess，使用 subprocess.unref() 方法。
    // child.unref()
    // process.exit()
  })
  process.on('message', function(e) {
    elog.log('process message', e)
  })
  /**
   * 监听渲染进程发起更新请求
   */
  ipcMain.on('checkForUpdates', (_event, args) => {
    elog.log('BUILD_ENV:', BUILD_ENV)
    elog.log('UPGRADE_URL:', UPGRADE_URL)
    elog.log('tinyUpdater checkForUpdates', args)
    // 进度
    let progressObj: any = {}
    const { currentVersion, productName } = args || {}
    // 下载安装包保存的路径,mac系统下userData指向~/Library/Application Support，而library隐藏，则打不开文件，故使用下载目录
    const filePath = path.resolve(isMac ? downloadsPath : USER_DATA_PATH, `${productName || 'goalgo'}-update`)
    if (!windowList) {
      return
    }
    const win = windowList.get('Home')
    win?.webContents.send('update-available', true)
    // 不存在则创建文件夹
    if (!fs.existsSync(filePath)) {
      fs.mkdirSync(filePath)
    }
    // const pkgFilename = `${productName || 'goalgo'}-${remoteVersion || currentVersion}.exe`
    // 请求yml文件查询安装包
    // const tinyUpdaterParam = {
    //   currentVersion, // 当前应用的版本号
    //   configType: 'yml',
    //   configUrl: oaUrl + 'latest-win.yml', // yml文件的url https://getup.xyl.gold/oa/x64/latest-win.yml
    //   configFilename: 'latest-win.yml',
    //   pkgFilename: `${productName || 'goalgo'}-${remoteVersion || currentVersion}.exe`, //下载后文件的名字
    //   // filePath: path.join(__dirname), // 下载文件保存的路径
    //   filePath, // 下载文件保存的路径
    // }
    const jsonFile = isMac ? 'latest-mac.json' : 'latest-win.json'
    // 请求json文件查询安装包
    const tinyUpdaterParam = {
      currentVersion, // 当前应用的版本号
      configType: 'json',
      configUrl: oaUrl + jsonFile, // yml文件的url https://getup.xyl.gold/oa/x64/latest-win.yml
      configFilename: jsonFile,
      filePath, // 下载文件保存的路径
      configResBack: (fileInfo: any) => {
        const { appFileName } = fileInfo
        latestJson = fileInfo
        execPath = path.join(filePath, appFileName)
      },
    }
    console.log('tinyUpdater param:', tinyUpdaterParam)
    elog.log('tinyUpdater param:', tinyUpdaterParam)
    const emitter = tinyUpdater(tinyUpdaterParam)

    emitter.on('download-progress', (total: any, length: any) => {
      const round: any = Number(length / total)
      const percent: any = length == total ? round * 100 : Number((round * 100).toFixed(1))
      progressObj = {
        total,
        transferred: length, //已下载大小
        percent,
      }
      if (win) {
        const progressInfo = getProgressInfo(progressObj)
        win.webContents.send('download-progress', progressInfo.logMessage, progressObj.percent)
        elog.log('tinyUpdater download-progress:', progressObj, progressInfo.logMessage)
      }
    })
    // 下载完成
    emitter.on('update-downloaded', ({ total }: any) => {
      const win = windowList.get('Home')
      if (win) {
        const progressInfo = getProgressInfo({
          total,
          transferred: total,
          percent: 100,
        })
        elog.log('tinyUpdater downloaded finish')
        win.webContents.send('update-downloaded', {
          logMessage: progressInfo.logMessage,
          percent: 100,
          total,
        })
      }
    })
    emitter.on('error', (e: any) => {
      elog.error('tinyUpdater更新error', e)
      const win = windowList.get('Home')
      if (win) {
        // win.webContents.send('update-available', true)
        // win.webContents.send('download-progress', '更新安装包错误，请检查网络后重试！', -1)
        // win.webContents.send('update_error', true)
        // 更新错误则弹框下载安装包
        const { appFileName: remoteFileName, url: remoteUrl, version: remoteVersion } = latestJson
        const appUrl = remoteUrl ? remoteUrl : oaUrl + 'holder-' + remoteVersion + '.exe'
        const appName = remoteFileName ? remoteFileName : 'holder-' + remoteVersion + '.exe'
        elog.log('remoteFileName:', remoteFileName, remoteVersion, appName)
        win?.webContents.send('upgrade_error', {
          appUrl,
          appName,
          upgradeType: 'all',
          progressTxt: '更新安装包错误，请检查网络后重试！',
          progress: 0,
          errorMsg: e,
        })
      }
    })

    /**
     * 断网异常
     */
    process.on('uncaughtException', function(e) {
      const win = windowList.get('Home')
      if (win) {
        win.webContents.send('update-available', true)
        win.webContents.send('download-progress', '更新安装包失败，请检查网络后重试！', -1)
        win.webContents.send('update_error', true)
      }
      elog.log('tinyUpdater uncaughtException', e)
    })
  })
  /**
   * 更新可用, 可以通过通知系统告知用户有更新可用
   */
  // electronUpdater.on('update-available', () => {
  //   const win = windowList.get('Home')
  //   if (win) {
  //     win.webContents.send('update-available', true)
  //   }
  //   elog.log('update-available')
  // })

  /**
   * 更新失败退出
   */
  ipcMain.on('quitOut', (e, error) => {
    elog.log('quitOut', e, error)
    app.quit()
  })
  /**
   * 升级失败显示下载安装包弹框
   */
  ipcMain.on('upgrade_error', (e, res) => {
    elog.log('upgrade_error', e, res)
    const win = windowList.get('Home')
    win?.webContents.send('upgrade_error', res)
  })
}
// elog.log('process.env', process.env)
if (process.env.BUILD_ENV != 'dev' && !isMac) {
  autoUpdateHandle()
}

// 字体下载
export const downloadFont = () => {
  // /**
  //  * 获取字体路径
  //  * 如果AppData不存在，就用根目录，如果根目录不存在，就用运行路径
  //  * @returns
  //  */
  // const getFontsPath = () => {
  //   let appdatapath = process.env.AppData
  //   if (appdatapath == undefined) {
  //     appdatapath = process.env.HOMEDRIVE ?? process.cwd()
  //   }
  //   return appdatapath
  // }
  // mac暂不走创建服务
  return new Promise(resolve => {
    if (!isMac) {
      const http = require('http')
      const url = require('url')
      const request = require('request')

      const server = http.createServer(function(req: any, res: any) {
        // 解析 url 参数
        const params = url.parse(req.url, true).query
        // const parentPath = path.join(getFontsPath(), 'holder-officeFonts')
        const parentPath = path.join(process.cwd(), 'officeFonts')
        const filePath = path.join(parentPath, params.fileName)
        try {
          if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath)
            res.writeHead(200, {
              'Content-Type': 'application/octet-stream',
              'Content-Disposition': 'attachment; filename=' + params.fileName,
              'Content-Length': stats.size,
              'Access-Control-Allow-Origin': '*',
              'Cache-Control': 'max-age=31536000',
            })
            fs.createReadStream(filePath).pipe(res)
          } else {
            // 在服务端请求字体文件并保存在本地
            const requet = request(
              `${process.env.API_FILE_HOST}/api/WebEditor/DownloadFonts?fontsName=${params.fileName}`
            )
            res.writeHead(200, {
              'Content-Type': 'application/octet-stream',
              'Access-Control-Allow-Origin': '*',
              'Cache-Control': 'max-age=31536000',
            })
            // 返回字体流给客户端
            requet.pipe(res)
            if (fs.existsSync(parentPath)) {
              const tmpPath = path.join(parentPath, new Date().getTime().toString())
              if (!fs.existsSync(tmpPath)) {
                fs.createFileSync(tmpPath)
              }
              const stream = fs.createWriteStream(tmpPath)
              requet.pipe(stream).on('close', function(err: any) {
                fs.renameSync(tmpPath, filePath)
                resolve({ success: true })
              })
            }
          }
        } catch (error) {
          elog.log('字体下载服务error:', error)
          resolve({ success: false })
        }
        resolve({ success: true })
      })
      server.listen(13312)
      server.on('error', function(err: any) {
        if (err.code === 'EADDRINUSE') {
          // 端口已经被使用
          console.log('13312端口已经被使用')
          elog.log('13312端口已经被使用')
        }
      })
    }
  })

  // setTimeout(function() {
  //   server.close(function() {
  //     console.log('server close')
  //   })
  // }, 3000)
}

/**
 * 窗口移动
 * @param win
 */
export function windowMove(win: any) {}

/**
 * 窗口移动事件
 */
// ipcMain.on('window-move-open', (events, args) => {
//   const canMoving = args[1]
//   const win: any = windowList.get('Home')
//   console.log(canMoving)
//   let winStartPosition = { x: 0, y: 0 }
//   let mouseStartPosition = { x: 0, y: 0 }
//   let movingInterval: any = null
//   if (canMoving) {
//     console.log('window-move-open')
//     elog.log(windowList.get('Home'))
//     // 读取原位置
//     const winPosition = win.getPosition()
//     winStartPosition = { x: winPosition[0], y: winPosition[1] }
//     mouseStartPosition = screen.getCursorScreenPoint()
//     // 清除
//     if (movingInterval) {
//       clearInterval(movingInterval)
//     }
//     // 新开
//     movingInterval = setInterval(() => {
//       // 实时更新位置
//       const cursorPosition = screen.getCursorScreenPoint()
//       const x = winStartPosition.x + cursorPosition.x - mouseStartPosition.x
//       const y = winStartPosition.y + cursorPosition.y - mouseStartPosition.y
//       console.log('window-move', y)
//       elog.log('window-move-open', y)
//       win.setPosition(x, y, true)
//     }, 20)
//   } else {
//     movingInterval && clearInterval(movingInterval)
//     movingInterval = null
//   }
// })

// http-server
const httpServer = require('http-server')

httpServer.createServer({ root: './resources/app/dist' }).listen(8999)
