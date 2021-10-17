import { app, BrowserWindowConstructorOptions } from 'electron'
import { asAssetsPath } from './paths'
/** 应用名称 */
export const APP_NAME = app.name

/** 应用版本 */
export const APP_VERSION = app.getVersion()

/** 应用标题 */
export const APP_TITLE = 'Electron Antd'

/** 应用主图标 (桌面) */
export const APP_ICON = asAssetsPath('app-icon/app-icon@256.png')

/** 亮色风格托盘图标 标准尺寸 16*16, 系统会自动载入 @2x 和 @3x */
// export const TRAY_ICON_LIGHT = asAssetsPath('tray-icon/win.ico')
export const TRAY_ICON_LIGHT = asAssetsPath('images/common/win_32.ico')
/** 暗色风格托盘图标 (仅 macOS) */
// export const TRAY_ICON_DARK = asAssetsPath('tray-icon/tray-icon-dark.png')
export const TRAY_ICON_DARK = asAssetsPath('images/common/win.ico')
export const ICON_ICO: any = asAssetsPath('images/common/win_32.ico')
export const ICON_ICNS = asAssetsPath('images/common/mac_32.icns')
/** 创建新窗口时默认加载的选项 */
export const DEFAULT_WINDOW_OPTIONS: BrowserWindowConstructorOptions = {
  icon: ICON_ICO,
  minWidth: 1024,
  minHeight: 768,
  width: 1920,
  height: 1080,
  show: false,
  hasShadow: true,
  webPreferences: {
    nodeIntegration: true,
    scrollBounce: true,
    webSecurity: false,
    webviewTag: true,
  },
  autoHideMenuBar: true,
  // titleBarStyle: 'hidden', // 隐藏标题栏, 但显示窗口控制按钮
  // frame: process.platform === 'darwin' ? true : false, // 无边框窗口
  // frame: false, // 无边框窗口
  skipTaskbar: false, // 是否在任务栏中隐藏窗口
  // backgroundColor: '#fff',
  // transparent: true, // 窗口是否透明
  // titleBarStyle: 'default',
  // vibrancy: 'selection', // 毛玻璃效果
}

export const DEFAULT_INITIAL_CONFIG: CreateConfig = {
  autoShow: true,
  delayToShow: 10,
  single: true,
}
