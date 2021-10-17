/**
 * electron-builder configuration
 * https://www.electron.build/configuration/configuration
 */

import path from 'path'
import { Configuration, CliOptions } from 'electron-builder'
import devConfig from './dev.config'
import elog from 'electron-log'
// 默认的输出日志级别
elog.transports.console.level = false
elog.transports.console.level = 'silly'
export const ICON_ICO = path.resolve(__dirname, '../assets/images/common/win.ico')
// const ICON_ICNS = path.resolve(__dirname, '../assets/images/common/mac.png')
const ICON_ICNS = path.resolve(__dirname, '../assets/Icon.icns')
const BUILD_ENV = process.env.BUILD_ENV === 'dev' ? 'dev' : 'prod'
const { UPGRADE_URL } = devConfig.env[BUILD_ENV]['variables']
// const plat = process.arch == 'x64' ? 'x64/' : 'x86/'
const oaUrl = UPGRADE_URL + 'x86/'
elog.log('oaUrl:', oaUrl, ' --- BUILD_ENV:', BUILD_ENV)
const {
  npm_package_name: productName,
  npm_package_buildVersion: buildVersion,
  npm_package_appId: appId,
  npm_package_version: version,
} = process.env
const config: Configuration = {
  // afterSign: './build/notarize.js',
  productName,
  buildVersion,
  copyright: 'Copyright ? 2017 Hp Ltd',
  appId,
  files: ['dist', 'assets', 'package.json'],
  asar: false, //是否压缩成asar
  nsis: {
    perMachine: true, //是否显示辅助安装程序的安装模式安装程序页面（选择按机器还是按用户）。或者是否始终按所有用户（每台计算机）安装。
    oneClick: false, //是创建一键安装程序还是辅助安装程序。
    allowElevation: true, // 允许请求提升。 如果为false，则用户必须使用提升的权限重新启动安装程序。
    allowToChangeInstallationDirectory: true, // 允许修改安装目录
    createDesktopShortcut: 'always', // 创建桌面图标
    createStartMenuShortcut: true, // 创建开始菜单图标
    // installerIcon: ICON_ICO, // 安装图标
  },
  compression: 'maximum', // "store" | "normal"| "maximum" 打包压缩情况(store 相对较快)，store 39749kb, maximum 39186kb
  directories: {
    buildResources: 'assets',
    output: path.join(devConfig.release, `${productName}-${version}`),
  },
  win: {
    artifactName: `${productName}-${version}.exe`,
    icon: ICON_ICO,
    target: [
      {
        target: 'nsis',
        arch: ['ia32'],
      },
    ],
    requestedExecutionLevel: 'asInvoker', //系统权限级别
    publish: [
      {
        provider: 'generic',
        url: oaUrl,
      },
    ],
    extraResources: [
      //静态资源复制
      {
        from: './node_modules/react-pdf/node_modules/pdfjs-dist/build/pdf.worker.js',
        to: 'app/dist/renderer/pdfjs-dist/pdf.worker.js',
      },
      {
        from: './node_modules/react-pdf/node_modules/pdfjs-dist/cmaps',
        to: 'app/dist/renderer/pdfjs-dist/cmaps',
      },
    ],
    verifyUpdateCodeSignature: false, //安装之前是否验证可用更新的签名
    signDlls: true, //是否对DLL文件进行签名
    signAndEditExecutable: true, //是否签名并将元数据添加到可执行文件
    // certificateFile: 'package.pfx',
    // certificatePassword: '111111',
    // additionalCertificateFile: 'package.pfx',
  },
  mac: {
    artifactName: `${productName}-${version}.dmg`,
    target: ['dmg', 'mas'],
    icon: ICON_ICNS,
    extendInfo: { ElectronTeamID: 'QJJN468932' },
    category: 'public.app-category.developer-tools',
    publish: [
      {
        provider: 'generic',
        url: oaUrl,
      },
    ],
    extraResources: [
      //静态资源复制
      {
        from: './node_modules/react-pdf/node_modules/pdfjs-dist/build/pdf.worker.js',
        to: 'app/dist/renderer/pdfjs-dist/pdf.worker.js',
      },
      {
        from: './node_modules/react-pdf/node_modules/pdfjs-dist/cmaps',
        to: 'app/dist/renderer/pdfjs-dist/cmaps',
      },
    ],
  },
  dmg: {
    // sign: false,
    icon: ICON_ICNS,
    contents: [
      { x: 130, y: 220 },
      { x: 410, y: 220, type: 'link', path: '/Applications' },
    ],
  },
  mas: {
    icon: ICON_ICNS,
    // 公证需要的配置
    provisioningProfile: './build/Holder_profiles.provisionprofile', //此文件包含了证书、App ID、设备，只有将这个打包都软件中，才能用真机调试。
    entitlements: './build/entitlements.mas.plist',
    entitlementsInherit: './build/entitlements.mas.inherit.plist',
    hardenedRuntime: false,
    gatekeeperAssess: false, //是否完整性检测以验证签名是否成功，macOs10.14.5后需要公证才会验证通过，所以此处不检查

    extendInfo: {
      ElectronTeamID: 'QJJN468932', //teamId
      ITSAppUsesNonExemptEncryption: false, //关闭出口证明
    },

    category: 'public.app-category.developer-tools',
  },
  linux: {
    icon: ICON_ICNS,
    target: ['deb', 'rpm', 'AppImage'],
    category: 'Development',
  },
}

const packageConfig: CliOptions = {
  config,
}

export default packageConfig
