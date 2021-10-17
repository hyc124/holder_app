import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { Modal, Button, Progress, message } from 'antd'
import { ipcRenderer, remote, shell } from 'electron'
import Axios from 'axios'
import './autoUpdate.less'
import devConfig from '@root/build/dev.config'
import elog from 'electron-log'
// import { downLoadFile } from '@/src/common/js/common'
// 这里配置你的远程文件服务器
const BUILD_ENV = process.env.BUILD_ENV === 'dev' ? 'dev' : 'prod'
const { UPGRADE_URL } = devConfig.env[BUILD_ENV]['variables']
const remoteYmlURL = devConfig.env[BUILD_ENV]['variables']['PART_UPDATE_URL'] + 'package.json'

let remoteExeJsonURL = UPGRADE_URL + 'x86/' + 'latest-win.json'
// mac系统
if (process.platform == 'darwin') {
  remoteExeJsonURL = UPGRADE_URL + 'x86/' + 'latest-mac.json'
}
// 下载远程压缩包并写入指定文件
function downloadFile(uri: any) {
  return new Promise<any>((resolve, reject) => {
    Axios({
      method: 'GET',
      url: uri.indexOf('?') == '-1' ? uri + '?_=' + new Date().getTime() : uri + '&_=' + new Date().getTime(),
    })
      .then((res: any) => {
        return resolve(res)
      })
      .catch((_: any) => {
        message.info('获取远程版本失败')
        elog.log('获取远程版本失败')
        // eslint-disable-next-line prefer-promise-reject-errors
        return reject('获取远程版本失败')
      })
  })
}
/**
 * 版本检测
 */
function checkVersion() {
  return new Promise(resolve => {
    const currentVersion = remote.app.getVersion()
    // const currentVersion = '5.0.7'
    // 获取最新版本号
    downloadFile(remoteYmlURL)
      .then(res => {
        const resData = res?.data || {}
        // updateUpgradeExe:是否需要下载修改版本号的exe程序
        const { updateUpgradeExe } = resData
        // 是否检查版本号
        const checkVersion = res.data.checkVersion
        // 主动控制更新方式,mac版升级方式控制：macUpdate
        const updateType =
          process.platform == 'darwin' && res.data.macUpdate ? res.data.macUpdate : res.data.update
        // 升级方式
        let upgradeType = 'part'
        // 版本号获取
        const remoteVersion =
          process.platform == 'darwin' && res.data.macVersion ? res.data.macVersion : res.data.version
        // 是否需要更新node_modules
        const updateNodeModules = res.data.updateNodeModules || false
        // 是否有单个版本单独升级的数组
        const equalList = res.data.equalList || []
        // 线上版本
        const remoteVersionArr: any = remoteVersion.split('.')
        // 当前版本
        const currentVersionArr: any = currentVersion.split('.')
        if (currentVersionArr.length < remoteVersionArr.length) {
          for (let c = 0; c < remoteVersionArr.length - currentVersionArr.length; c++) {
            currentVersionArr.push('0')
          }
        }
        // 0.1.1 Y和Z比较来开启增量更新  1.1.1 X比较来开启全量更新
        if (JSON.parse(remoteVersionArr.join('')) <= JSON.parse(currentVersionArr.join(''))) {
          elog.log('无版本变动，不更新')
          // 无更新
          return resolve({
            ...resData,
            type: 'no_upgrade_send',
            remoteVersion,
            currentVersion,
            name: res.data.name,
            updateNodeModules,
            updateUpgradeExe,
          })
        } else {
          if (process.platform == 'darwin') {
            // mac系统
            return resolve({
              ...resData,
              type: 'AppStore',
              remoteVersion,
              currentVersion,
            })
          }
          // 按版本号更新
          else if (updateType == 'byVersion') {
            // 先查询是否有单个版本单独升级的方式
            let isFind = false
            if (equalList.length > 0) {
              const finds = equalList.filter((item: any) => {
                return item.versionList.includes(currentVersion)
              })
              if (finds.length > 0) {
                upgradeType = finds[0].update
                isFind = true
              }
            }
            // 单独控制升级的数据中未查询到，则查询范围控制升级的数组集合
            if (!isFind && res.data.rangeObj && res.data.rangeObj.use) {
              const rangeObj = res.data.rangeObj || {}
              // 当前版本
              const rangeObjVersionArr: any = rangeObj.version.split('.')
              // 当前版本在小于定义版本号，则使用小于版本号时的更新方式，否则用大于版本号时的更新方式
              if (JSON.parse(currentVersionArr.join('')) < JSON.parse(rangeObjVersionArr.join(''))) {
                upgradeType = rangeObj.lessUpdate
              } else {
                upgradeType = rangeObj.greaterUpdate
              }
            }
            if (!upgradeType) {
              upgradeType = 'part'
            }
          } else if (
            ((!checkVersion || checkVersion == 'false') && updateType == 'all') ||
            Number(remoteVersionArr[0]) > Number(currentVersionArr[0])
          ) {
            upgradeType = 'all'
          } else if (
            ((!checkVersion || checkVersion == 'false') && updateType == 'part') ||
            Number(remoteVersionArr[1]) > Number(currentVersionArr[1]) ||
            Number(remoteVersionArr[2]) > Number(currentVersionArr[2])
          ) {
            upgradeType = 'part'
          }
          console.log('upgradeType:', upgradeType)
          // if (process.env.BUILD_ENV == 'dev') {
          //   return
          // }
          // 全量更新
          if (upgradeType == 'all') {
            elog.log('开启全量更新')
            // 开启全量更新
            return resolve({
              ...resData,
              type: 'OPEN_ALL_UPDATE',
              remoteVersion,
              currentVersion,
              name: res.data.name,
            })
          } else if (upgradeType == 'part') {
            elog.log('开启增量更新')
            // 开启增量更新
            return resolve({
              ...resData,
              type: 'OPEN_PART_UPDATE',
              remoteVersion,
              currentVersion,
              name: res.data.name,
              updateNodeModules,
              updateUpgradeExe,
            })
          }
        }
      })
      .catch(e => {
        elog.log('checkVersion 错误：', e)
      })
  })
}

// 更新应用程序的state全局变量
let upgradeStateTmp: any = {
  visible: false,
  percentNum: 0,
  percentTxt: '',
  finish: false,
  updateType: false,
  updateTxt: '系统正在更新，请稍侯...',
  // 升级失败情况的弹框信息
  downloadVisible: false,
  // 当前更新失败类型
  upgradeFailType: '',
  // 是否从App Store下载，暂时用不上
  macAppStore: false,
}
let upgradeTimer: any = null
/**
 * 更新应用程序
 * disableInit:禁用初始化检测（ref方法可使用）
 */
export const AutoUpdateModal = forwardRef(
  ({ disableInit }: { visible?: boolean; setVisible?: any; disableInit?: boolean }, ref) => {
    const [state, setUpgradeState] = useState(upgradeStateTmp)

    const setState = (newState: any) => {
      upgradeStateTmp = { ...upgradeStateTmp, ...newState }
      setUpgradeState({ ...state, ...newState })
    }

    // ========退出===========//
    const quitOut = () => {
      setState({
        ...upgradeStateTmp,
        visible: false,
      })
      ipcRenderer.send('quitOut', true)
    }
    useEffect(() => {
      if (!disableInit) {
        initFn()
      }
      return () => {
        upgradeTimer && clearTimeout(upgradeTimer)
        upgradeTimer = null
        // 还原state缓存
        upgradeStateTmp = {
          visible: false,
          percentNum: 0,
          percentTxt: '',
          finish: false,
          updateType: false,
          updateTxt: '系统正在更新，请稍侯...',
          // 升级失败情况的弹框信息
          downloadVisible: false,
          macAppStore: false,
        }
      }
    }, [])

    /**
     * 暴露给父组件的方法
     */
    useImperativeHandle(ref, () => ({
      /**
       * 刷新方法
       */
      initFn,
    }))
    /**
     * 初始化方法
     */
    const initFn = (paramObj?: any) => {
      const { finishCallBack }: any = paramObj ? paramObj : {}
      const nowVersion = remote.app.getVersion()
      const getAppName = remote.app.getName()
      // mac系统跳转到App Store下载
      // 手动升级处点击触发
      if (process.platform == 'darwin' && disableInit) {
        downloadFile(remoteExeJsonURL).then((res: any) => {
          shell.openExternal(res.data?.appStoreUrl)
        })
        return
      }
      // 下面是window系统检测版本更新方式
      let progressTimer: any = null
      upgradeTimer = setTimeout(async () => {
        try {
          const res: any = await checkVersion()
          const { remoteVersion, currentVersion, name: productName } = res
          // mac系统登陆页检查到自动升级触发
          if (process.platform == 'darwin') {
            if (res && res.type === 'AppStore') {
              setState({
                ...upgradeStateTmp,
                downloadVisible: true,
                macAppStore: true,
                // 打开新网页下载
                downloadMacOnBrowser: () => {
                  downloadFile(remoteExeJsonURL).then((res: any) => {
                    shell.openExternal(res.data?.appStoreUrl)
                  })
                },
              })
            }
            return
          }

          //增量更新
          if (res && res.type === 'OPEN_PART_UPDATE') {
            setState({
              ...upgradeStateTmp,
              visible: true,
              updateType: true,
            })
            // ====显示进度变化====
            let progress = 0
            progressTimer = setInterval(() => {
              if (progress < 90) {
                progress += 10
                elog.log('增量更新进度：', progress)
                $('#autoUpdaterDownLoad')
                  .find('.progressBox .ant-progress-bg')
                  .css({ width: progress + '%' })
                $('#autoUpdaterDownLoad')
                  .find('.progressBox .ant-progress-text')
                  .html(progress + '%')
              } else {
                elog.log('增量更新进度-clearInterval')
                clearInterval(progressTimer)
              }
            }, 1000)
            elog.log('checkForPartUpdates send')
            ipcRenderer.send('checkForPartUpdates', res)
          }
          //全量更新
          if (res && res.type === 'OPEN_ALL_UPDATE') {
            // ipcRenderer.send('checkAllUpdates')
            if (navigator.onLine) {
              //发起更新请求
              elog.log('checkAllUpdates send')
              ipcRenderer.send('checkForUpdates', { remoteVersion, currentVersion, productName })
            }
          }
          // if (res && res.type == 'no_upgrade_send') {
          //   ipcRenderer.send('no_upgrade_send', res)
          // }
        } catch (error) {
          console.error('checkVersionERROR', error)
        }
      }, 500)
      // mac系统去App Store下载，不需要下面监听进程
      if (process.platform == 'darwin') {
        return
      }
      //增量更新监听
      ipcRenderer.on('update-progress', (_, txt, percent) => {
        if (percent >= 100) {
          progressTimer && clearInterval(progressTimer)
        }
        setState({
          ...upgradeStateTmp,
          percentNum: percent,
          percentTxt: txt,
        })
      })
      //更新完成
      ipcRenderer.on('reload-app', () => {
        progressTimer && clearInterval(progressTimer)
        setState({
          ...upgradeStateTmp,
          percentNum: 100,
          updateTxt: '更新已完成,即将重启...',
        })
        // 更新完成的回调
        finishCallBack && finishCallBack({ success: true })
      })

      //检查有更新包，显示更新窗口
      ipcRenderer.on('update-available', () => {
        $('#quitOut').hide()
        setState({
          ...upgradeStateTmp,
          visible: true,
        })
        elog.log('updateModal show')
      })

      //显示更新进度
      ipcRenderer.on('download-progress', (_, txt, percent) => {
        setState({
          ...upgradeStateTmp,
          percentNum: percent,
          percentTxt: txt,
        })
      })

      //全量更新下载完毕，显示重启按钮
      ipcRenderer.on('update-downloaded', (_, args: boolean | { logMessage: string }) => {
        const progressInfo: any = args || {}
        if (progressInfo.logMessage) {
          setState({
            ...upgradeStateTmp,
            percentNum: 100,
            percentTxt: progressInfo.logMessage,
            finish: true,
          })
          console.log('下载完毕，显示重启按钮 state', state)
        } else {
          setState({ ...upgradeStateTmp, finish: true })
        }
        // 更新完成的回调
        finishCallBack && finishCallBack({ success: true })
      })

      //更新失败
      ipcRenderer.on('update_error', () => {
        $('#quitOut').show()
      })
      // 升级错误提示
      ipcRenderer.on('upgrade_error', (_, args) => {
        const paramObj = args || {}
        const { upgradeType, appUrl, progressTxt, progress, errorMsg } = paramObj
        elog.log('upgrade_error args:', paramObj)
        progressTimer && clearInterval(progressTimer)
        // state新值参数
        const stateParam: any = {
          ...upgradeStateTmp,
          visible: true,
          downloadVisible: true,
          upgradeExeFail: upgradeType,
          errorMsg,
          // 全量更新方式下载
          downloadOnUpdate: () => {
            if (appUrl) {
              // const { shell } = require('electron')
              shell.openExternal(appUrl)
              // downLoadFile({ url: appUrl, fileName: appName })
            } else {
              //发起下载请求
              setState({
                ...upgradeStateTmp,
                visible: true,
                downloadVisible: false,
                updateType: false,
              })
              elog.log('下载安装包 send')
              ipcRenderer.send('checkForUpdates', { currentVersion: nowVersion, productName: getAppName })
            }
          },
          // 打开新网页下载
          downloadOnBrowser: () => {
            // const { shell } = require('electron')
            downloadFile(remoteExeJsonURL).then((res: any) => {
              shell.openExternal(res.data.url)
            })
          },
        }
        if (upgradeType == 'all') {
          $('#quitOut').show()
        }
        if (progressTxt !== undefined) {
          if (upgradeType == 'all') {
            stateParam.percentTxt = progressTxt
          } else {
            stateParam.updateTxt = progressTxt
          }
        }
        if (progress !== undefined) {
          stateParam.percentNum = progress
        }
        //更新错误，显示下载弹框
        setState(stateParam)
        // 更新完成的回调
        finishCallBack && finishCallBack({ success: false })
      })
      console.log(nowVersion, getAppName)
    }

    return (
      <>
        <Modal
          className="baseModal autoUpdaterModal"
          visible={state.visible}
          title={'正在下载更新包'}
          onCancel={() => {
            setState({
              ...upgradeStateTmp,
              visible: false,
            })
          }}
          width={500}
          centered={true}
          footer={null}
          maskClosable={false}
          keyboard={false}
        >
          <div className="download-div" id="autoUpdaterDownLoad">
            <div className="progressBox">
              {/* <div className="bar mint" data-percent="0"></div> */}
              {state.finish ? (
                ''
              ) : (
                <Progress percent={state.percentNum || 0} status="active" className="progressBar" />
              )}
            </div>
            {/* 下载完成图标 */}
            <div className={`download-finish ${state.finish ? '' : 'forcedHide'}`}>
              <img src={$tools.asAssetsPath('/images/common/download-finish.png')} />
            </div>
            {/* updateType为true是增量更新  updateTxt：进度上面的错误提示文本 */}
            {state.updateType && <p className="text-center-p progressTxtBox">{state.updateTxt}</p>}
            {/* 全量更新后操作按钮 */}
            {!state.updateType && (
              <>
                <p className="text-center-p progressTxtBox">
                  <label id="progress">{state.percentTxt || ''}</label>
                </p>
                <div className="btn_group">
                  <Button
                    key="submit"
                    id="quitAndInstall"
                    className={`btn resetBtn ${state.finish ? '' : 'pointerDisable disable'}`}
                    onClick={() => {
                      ipcRenderer.send('quitAndInstall', true)
                    }}
                  >
                    重新安装
                  </Button>
                  {state.finish ? (
                    ''
                  ) : (
                    <Button
                      key="submit"
                      type="primary"
                      id="quitOut"
                      className="btn quit-and-install"
                      onClick={quitOut}
                    >
                      退出
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        </Modal>

        {/* =========mac升级或window升级失败情况的下载弹框========== */}
        <Modal
          className="baseModal downloadUpdaterModal"
          visible={state.downloadVisible}
          title={state.macAppStore ? 'mac升级' : '升级失败'}
          onCancel={() => {
            setState({
              ...upgradeStateTmp,
              downloadVisible: false,
            })
          }}
          width={418}
          footer={null}
          maskClosable={false}
          keyboard={false}
        >
          {/* mac更新时去应用市场App Store下载 */}
          {state.macAppStore ? (
            <div className="download-div">
              <p>请点击跳转到App Store更新最新安装程序。</p>
              <div className="btn_group">
                <Button
                  key="submit"
                  type="primary"
                  className="btn downOnWindow"
                  onClick={state.downloadMacOnBrowser}
                >
                  去App Store
                </Button>
              </div>
            </div>
          ) : (
            <div className="download-div" style={{ overflow: 'auto', maxHeight: '300px' }}>
              <p>升级出现问题，请选择下载最新安装包的方式手动进行安装，为您带来不便，我们深表歉意。</p>
              <p>
                {state.errorMsg
                  ? typeof state.errorMsg == 'object'
                    ? state.errorMsg.stack
                    : state.errorMsg + ''
                  : ''}
              </p>
              <div className="btn_group">
                <Button
                  key="submit"
                  type="primary"
                  className="btn downOnWindow"
                  onClick={state.downloadOnBrowser}
                >
                  网页下载
                </Button>
                {/* mac增量更新失败时用网页下载 */}
                {process.platform == 'darwin' ? (
                  ''
                ) : (
                  <Button
                    key="submit"
                    type="primary"
                    className={`btn downOnUpdate ${state.upgradeExeFail == 'all' ? 'forcedHide' : ''}`}
                    onClick={state.downloadOnUpdate}
                  >
                    全量更新
                  </Button>
                )}
              </div>
            </div>
          )}
        </Modal>
      </>
    )
  }
)
