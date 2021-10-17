import path from 'path'
import { BrowserWindow, BrowserWindowConstructorOptions } from 'electron'
import routes from '@/src/auto-routes'
import electron from 'electron'
import { windowsInitList } from '@/core/tools'
const nodeUrl = require('url')
const { NODE_ENV, port, host } = process.env
import fs from 'fs'
/** 创建新窗口相关选项 */
export interface CreateWindowOptions {
  /** 路由启动参数 */
  params?: any
  /** URL 启动参数 */
  query?: any
  /** BrowserWindow 选项 */
  windowOptions?: BrowserWindowConstructorOptions
  /** 窗口启动参数 */
  createConfig?: CreateConfig
  /** 携带参数 */
  sendOptions?: any
}

/** 已创建的窗口列表 */
export const windowList: Map<RouterKey, BrowserWindow> = new Map()

/**
 * 通过 routes 中的 key(name) 得到 url
 * @param key
 */
export function getWindowUrl(key: RouterKey, options: CreateWindowOptions = {}): string {
  let routePath = routes.get(key)?.path

  if (typeof routePath === 'string' && options.params) {
    routePath = routePath.replace(/\:([^\/]+)/g, (_, $1) => {
      return options.params[$1]
    })
  }

  const query = options.query ? $tools.toSearch(options.query) : ''

  if (NODE_ENV === 'development') {
    return `http://${host}:${port}#${routePath}${query}`
  } else {
    // return `file://${path.join(__filename, '../../renderer/index.html')}#${routePath}${query}`
    return `http://localhost:8999/renderer/#${routePath}${query}`
  }
}
/**
 * 通过 routes 中的 key(name) 得到 url
 * @param key
 */
export function getLoadingUrl(key: RouterKey, options: CreateWindowOptions = {}): string {
  // let routePath = routes.get(key)?.path

  // if (typeof routePath === 'string' && options.params) {
  //   routePath = routePath.replace(/\:([^\/]+)/g, (_, $1) => {
  //     return options.params[$1]
  //   })
  // }

  // const query = options.query ? $tools.toSearch(options.query) : ''

  // if (NODE_ENV === 'development') {
  //   return `http://${host}:${port}#${routePath}${query}`
  // } else {
  //   return `file://${path.join(__filename, '../../renderer/loading.html')}#${routePath}${query}`
  // }

  return `file://${path.join(__filename, '../../../renderer/loading.html')}`
}

/**
 * 创建一个新窗口
 * @param key
 * @param options
 */
export function createWindow(key: RouterKey, options: CreateWindowOptions = {}): Promise<BrowserWindow> {
  return new Promise((resolve: any) => {
    // 获取窗口是否加载过路由界面的信息
    const { windowsInfo } = $store.getState()
    const { loadedInfo } = windowsInfo || []
    const routeConfig: RouteConfig | AnyObj = routes.get(key) || {}
    // 获取整合配置信息
    const configParam: CreateConfig = {
      ...$tools.DEFAULT_INITIAL_CONFIG,
      ...routeConfig.createConfig,
      ...options.createConfig,
    }
    // 获取自动显示状态
    const { autoShow, initRefresh } = configParam

    //获取传递参数
    const sendOptions = options.sendOptions

    let activeWin: BrowserWindow | boolean
    //如果窗口存在则直接打开
    if (windowList.get(key)) {
      const url = getWindowUrl(key, options)
      activeWin = activeWindow(key, autoShow)
      // 为了提升加载速度，一部分窗口首次进系统时提前创建了空白窗口，第二次打开才加载url
      const findIndex: any = loadedInfo.findIndex((v: any) => {
        return v.key == key
      })
      // 此处判断当前窗口提前创建过空白窗口，并且当前是第二次打开窗口，则重载(loadURL)页面
      if (windowsInitList.includes(key) && activeWin && findIndex == -1) {
        activeWin.loadURL(url)
        // 设置已加载界面标识，下次直接打开不重载路由url
        loadedInfo.push({ key, loadedUrl: true })
        $store.dispatch({
          type: 'WINDOWS_INFO',
          data: {
            loadedInfo,
          },
        })
        //首次进入审批跳转
        activeWin.webContents.on('dom-ready', () => {
          windowList.get(key)?.webContents.send('open_approval_tab', sendOptions)
        })
        // 闪烁消息点击进入沟通
      } else {
        if (autoShow) {
          console.log('存在窗口情况下的autoShow')
          // 打开窗口时，重新刷新页面
          // ipc:发送进程调用方法刷新：此方法不会空白加载等待，适用于初始化变量少，
          // 在同一个初始化方法即可完成设置所有初始状态变量的界面
          // no:不做任何刷新
          if (initRefresh == 'ipc') {
            // 设置图片预览窗口大小
            if (key == 'fileWindow') {
              const { imgWidthH } = $store.getState().fileObj
              //图片最大1300*730
              const width = imgWidthH?.width > 1300 ? 1300 : imgWidthH?.width
              const height = imgWidthH?.height > 730 ? 730 : imgWidthH?.height
              windowList.get('fileWindow')?.setSize(width, height)
              windowList.get('fileWindow')?.center()
            }
            windowList.get(key)?.webContents.send('window-show', sendOptions)
            windowList.get(key)?.webContents.send('open_approval_tab', sendOptions)
          } else if (initRefresh == 'loadUrl') {
            windowList.get(key)?.loadURL(url)
          } else if (initRefresh != 'no') {
            //重载
            windowList.get(key)?.webContents.reload()
          }
        } else {
          console.log('存在窗口情况下的loadURL')
          windowList.get(key)?.loadURL(url)
        }
      }
      resolve()
      return
    }
    let ownerOptions = {}
    if (key === 'SystemNoticeWin') {
      const size = electron.screen.getPrimaryDisplay().size
      const config = routeConfig.windowOptions
      ownerOptions = { x: size.width - config.width - 40, y: size.height - config.height - 70 }
    }
    if (key === 'ChatTipWin') {
      const size = electron.screen.getPrimaryDisplay().size
      const config = routeConfig.windowOptions
      const winH: number = 5 * 60 + 150
      ownerOptions = {
        x: size.width - config.width - 130,
        y: size.height - winH - 40,
        transparent: true,
        autoHideMenuBar: true, //自动隐藏菜单栏
        movable: false,
        alwaysOnTop: true,
        skipTaskbar: true,
        useContentSize: true,
        resizable: false,
        show: false,
      }
    }
    const isMac = process.platform == 'darwin'
    if (key == 'fileWindow') {
      // const { imgWidthH } = $store.getState().fileObj
      //图片最大1300*730
      // const width = imgWidthH?.width > 1300 ? 1300 : imgWidthH?.width
      // const height = imgWidthH?.height > 730 ? 730 : imgWidthH?.height
      ownerOptions = {
        // width,
        // height,
        frame: false, // 无边框窗口
        titleBarStyle: 'hiddenInset', // 隐藏标题栏, 但显示窗口控制按钮
        // maxWidth: isMac ? 1670 : 1300,
        // maxHeight: 730,
      }
    }
    // if (key == 'Home') {
    //   ownerOptions = {
    //     frame: false, // 无边框窗口
    //     // titleBarStyle: 'hidden', // 隐藏标题栏, 但显示窗口控制按钮
    //   }
    // }
    const windowOptions: BrowserWindowConstructorOptions = {
      ...$tools.DEFAULT_WINDOW_OPTIONS, // 默认新窗口选项
      ...routeConfig.windowOptions, // routes 中的配置的window选项
      ...options.windowOptions, // 调用方法时传入的选项
      ...ownerOptions,
      // 配置同源安全策略
      // webPreferences: {
      //   webSecurity: false,
      //   nodeIntegration: true,
      //   webviewTag: true, //启用webview标签
      // },
    }

    const createConfig: CreateConfig = {
      ...$tools.DEFAULT_INITIAL_CONFIG,
      ...routeConfig.createConfig,
      ...options.createConfig,
    }

    if (createConfig.single) {
      activeWin = activeWindow(key, autoShow)
      if (activeWin) {
        resolve(activeWin)
        return activeWin
      }
    }
    console.log(windowOptions)

    const win = new BrowserWindow(windowOptions)
    const url = getWindowUrl(key, options)

    windowList.set(key, win)
    // 禁用全屏（设置全屏不可用，mac上全屏后隐藏关闭窗口会黑屏）
    win.setFullScreenable(false)
    // 在窗口启动的时候，需要先用 loading 页面加载，防止出现白屏现象
    // const loadingUrl = getWindowUrl('AppLoading')
    // const loadingBrowserView = new BrowserView()
    if (autoShow) {
      console.log('初始创建时的loadURL')
      win.loadURL(url)
      // if (key === 'ChatWin') {
      // win.show()
      // fs.realpath(__dirname, '', function(err: any, resolvedPath: any) {
      //   if (err) throw err
      //   win.setBrowserView(loadingBrowserView)
      //   loadingBrowserView.setBounds({
      //     x: 0,
      //     y: 0,
      //     width: windowOptions.width || 1000,
      //     height: windowOptions.height || 1080,
      //   })
      //   loadingBrowserView.webContents.loadURL(getLoadingUrl('ChatWin', {}))
      //   const pathname = path.join(resolvedPath, '../../../renderer/loading.html')
      //   const urlTest = nodeUrl.format({
      //     pathname: pathname,
      //     protocol: 'file:',
      //   })
      //   win.loadURL(urlTest)
      // })
      // }
    }

    //打开开发者模式
    process.env.BUILD_ENV === 'dev' && key != 'fileWindow' && win.webContents.openDevTools()

    if (createConfig.saveWindowBounds) {
      const lastBounds = $tools.settings.windowBounds.get(key)
      if (lastBounds) win.setBounds(lastBounds)
    }

    if (createConfig.hideMenus) win.setMenuBarVisibility(false)
    if (createConfig.created) createConfig.created(win)

    // win.webContents.on('will-navigate', () => {
    //   win.setBrowserView(loadingBrowserView)
    //   console.log('set loadingBrowserView')
    // })
    win.webContents.on('dom-ready', () => {
      // if (key === 'ChatWin') {
      // win.removeBrowserView(loadingBrowserView)
      //   win.loadURL(url)
      // }
      win.webContents.send('dom-ready', createConfig)
    })

    win.webContents.on('did-finish-load', () => {
      if (createConfig.autoShow) {
        console.log(key, '--did-finish-load的win show')
        if (createConfig.delayToShow) {
          setTimeout(() => {
            win.show()
          }, createConfig.delayToShow)
        } else {
          const dataType = options.sendOptions
          // 登录后初始化沟通和图片预览窗口后不打开窗口
          if (!((key === 'ChatWin' || key === 'fileWindow') && dataType === 'login')) {
            win.show()
          }
        }
      }
      resolve(win)
    })

    win.once('ready-to-show', () => {
      process.env.BUILD_ENV === 'dev' && key != 'fileWindow' && win.webContents.openDevTools()

      // win.webContents.openDevTools()

      resolve()
    })

    win.once('show', () => {
      console.log(`Window <${key}:${win.id}> url: ${url} is opened.`)
    })

    win.on('close', (e: any) => {
      if (key === 'WeChatScan') {
        // 关闭微信扫码，二维码窗口时，清空二维码监听轮询
        windowList.get('Home')?.webContents.send('clear_wechat_request')
        // $store.dispatch({ type: 'WE_CHAT_SCAN_CLEAR_REQUEST', data: true })
      }
      if (key == 'okrFourquadrant') {
        // 刷新规划列表
        windowList.get('Home')?.webContents.send('refresh_okrKaban_list')
      }
      // 独立窗口预览文件
      if (key == 'fileWindow') {
        $store.dispatch({
          type: 'SET_FILE_OBJ',
          data: {
            fileType: '',
            fileList: [],
            photoIndexKey: '',
            pdfUrl: '',
          },
        })
      }
      // 优化打开窗口速度：关闭窗口时默认隐藏而不关闭，设置强制关闭(forcedClose)才关闭
      if (createConfig.forcedClose) {
        // 销毁win实例化
        win.destroy()
        windowList.delete(key)
        // 移除窗口打开状态的存取数据
        const findIndex: any = loadedInfo.findIndex((v: any) => {
          return v.key == key
        })
        if (findIndex > -1) {
          loadedInfo.splice(findIndex, 1)
          $store.dispatch({
            type: 'WINDOWS_INFO',
            data: {
              loadedInfo: [...loadedInfo],
            },
          })
        }
      } else {
        if (key === 'ChatWin') {
          // 沟通打开独立窗口数据闪烁问题（先清空数据再关闭窗口）
          windowList.get('ChatWin')?.webContents.send('chat-win-close')
        } else {
          win.hide()
        }
        e.preventDefault()
      }
      if (createConfig.saveWindowBounds && win) {
        $tools.settings.windowBounds.set(key, win.getBounds())
      }
      if (key == 'FollowWorkDesk') {
        $store.dispatch({
          type: 'FOLLOW_USER_INFO',
          data: {
            followStatus: false,
            userId: '',
            account: '',
            name: '',
            followOrgId: '',
          },
        })
        const { orgInfo, selectTeamId } = $store.getState()
        const selectTeam = orgInfo.find((item: any) => {
          return item.isLast === 1
        })
        const orgParam: any = selectTeam
        if (!selectTeamId) {
          $store.dispatch({
            //存储企业ID
            type: 'SET_SEL_TEAMID',
            data: { selectTeamId: orgParam ? orgParam.id : '' },
          })
          $store.dispatch({
            //存储企业名称
            type: 'SET_SEL_TEAMNAME',
            data: { selectTeamName: orgParam ? orgParam.name : '所有企业' },
          })
        }
      }
    })
    win.on('focus', () => {
      if (key === 'ChatWin') {
        windowList.get('Home')?.webContents.send('flash_goalgo', [false, 'ChatWin'])
      } else if (key === 'Home') {
        windowList.get('Home')?.webContents.send('flash_goalgo', [false, 'Home'])
      }
    })
  })
}

/**
 * 激活一个已存在的窗口, 成功返回 BrowserWindow 失败返回 false
 * @param key
 */
export function activeWindow(key: RouterKey, autoShow?: boolean): BrowserWindow | false {
  if (!windowList) {
    return false
  }
  const win: BrowserWindow | undefined = windowList.get(key)
  if (win) {
    if (autoShow) {
      win.show()
      console.log('activeWindow win show')
    }
    return win
  } else {
    return false
  }
}

declare global {
  namespace Electron {
    interface WebContents {
      /** 自定义事件: DOM 准备就绪 */
      send(channel: 'dom-ready', createConfig: CreateConfig): void
    }
  }
}
