import { Menu, Tray, nativeImage, app } from 'electron'
import electron from 'electron'
import { trayMenus } from '../menus'
import { windowList } from '@/core/tools'
// import devConfig from '@root/build/dev.config'

const { ICON_ICNS, TRAY_ICON_LIGHT, APP_NAME } = $tools
export interface AppIconConfig {
  menus?: any
  title?: string
  icon?: string
}
// 获取窗口显示状态
export function creatAppTray({ menus = trayMenus, title = APP_NAME }: AppIconConfig = {}): Tray {
  // const BUILD_ENV = process.env.BUILD_ENV === 'dev' ? 'dev' : 'prod'
  // const { PRODUCT_NAME } = devConfig.env[BUILD_ENV]['variables']
  let iconPath = TRAY_ICON_LIGHT
  if (process.platform === 'darwin') {
    iconPath = ICON_ICNS
  }
  const image = nativeImage.createFromPath(iconPath)
  image.isMacTemplateImage = true
  const tray = new Tray(image)
  tray.setToolTip(title + `(${app.getVersion()})`)
  if (process.platform !== 'darwin') {
    tray.setContextMenu(Menu.buildFromTemplate(menus))
  }

  //单击图标放大应用主窗口
  tray.on('click', () => {
    $tools.windowList.get('Home')?.show()
  })

  /**
   * 显示悬浮列表
   */
  let leaveInter: any = null
  let trayBounds: any = null
  let isLeave = true
  let timer: any = null
  const ipc = electron.ipcMain

  //tray mouse-move模拟鼠标移出
  const checkTrayLeave = () => {
    clearInterval(leaveInter)
    leaveInter = setInterval(function() {
      if (!isLeave) {
        trayBounds = tray.getBounds()
        const tipsWinBounds: any = windowList.get('ChatTipWin')?.getBounds()
        const ScreenPoint: any = electron.screen.getCursorScreenPoint()
        if (
          !(
            trayBounds &&
            ScreenPoint &&
            trayBounds.x < ScreenPoint.x &&
            trayBounds.y < ScreenPoint.y &&
            ScreenPoint.x < trayBounds.x + trayBounds.width &&
            ScreenPoint.y < trayBounds.y + trayBounds.height
          ) &&
          !(
            tipsWinBounds &&
            ScreenPoint &&
            tipsWinBounds.x < ScreenPoint.x &&
            tipsWinBounds.y < ScreenPoint.y &&
            ScreenPoint.x < tipsWinBounds.x + tipsWinBounds.width &&
            ScreenPoint.y < tipsWinBounds.y + tipsWinBounds.height
          )
        ) {
          const { unreadList } = $store.getState()
          if (unreadList && unreadList.length) {
            //触发mouse-leave
            clearInterval(leaveInter)
            isLeave = true
            windowList.get('ChatTipWin')?.hide()
          }
        }
      }
    }, 100)
  }

  //关闭未读消息
  ipc.on('hide_tips_window', () => {
    if (process?.platform === 'darwin') {
      return
    }
    windowList.get('ChatTipWin')?.close()
    isLeave = true
  })

  ipc.on('change_tray_icon', () => {
    if (process?.platform === 'darwin') {
      return
    }
    const picon = $tools.asAssetsPath('/images/tray/goamsg.ico')
    const aicon = $tools.asAssetsPath('/images/common/win_32.ico')

    const { unreadList } = $store.getState()
    if (unreadList && unreadList?.length && aicon && picon) {
      timer && clearInterval(timer)
      let count = 0
      timer = setInterval(function() {
        count++
        if (count % 2 == 0) {
          tray?.setImage?.(picon)
        } else {
          tray?.setImage?.(aicon)
        }
      }, 500)

      trayBounds = tray.getBounds()
      const electronScreen = require('electron').screen
      const size = electronScreen.getPrimaryDisplay().size
      const existHeight = 100 + unreadList.length * 57
      const winH: number = existHeight > 390 ? 390 : existHeight
      windowList
        .get('ChatTipWin')
        ?.setBounds({ x: trayBounds?.x - 130, y: size.height - winH - trayBounds?.height, height: winH })
    } else {
      timer && clearInterval(timer)
      timer = null
      if (aicon) tray?.setImage?.(aicon)
    }
  })

  //上移出现消息列表
  tray.on('mouse-move', () => {
    if (process.platform === 'darwin') {
      return
    }
    const { unreadList } = $store.getState()
    if (isLeave && unreadList?.length) {
      //触发mouse-enter
      isLeave = false
      checkTrayLeave()
      trayBounds = tray.getBounds()
      const electronScreen = require('electron').screen
      const size = electronScreen.getPrimaryDisplay().size
      const existHeight = 100 + unreadList.length * 57
      const winH: number = existHeight > 390 ? 390 : existHeight
      $tools.createWindow('ChatTipWin')
      windowList.get('ChatTipWin')?.show()
      windowList.get('ChatTipWin')?.focus()
      windowList
        .get('ChatTipWin')
        ?.setBounds({ x: trayBounds?.x - 130, y: size.height - winH - trayBounds?.height, height: winH })
    }
  })
  return tray
}
