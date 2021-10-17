import React, { useState, forwardRef, useImperativeHandle, useRef } from 'react'
import { Modal } from 'antd'
import Avatar from 'antd/lib/avatar/avatar'
import './appSet.less'
import './aboutApp.less'
// import devConfig from '@root/build/dev.config'
import { AutoUpdateModal } from '@/src/components/auto-updater/autoUpdater'
import { remote } from 'electron'
const app = remote.app
/**
 * 用户设置中心
 */
const AppSet = forwardRef((_: any, ref) => {
  // const { appVersionInfo } = $store.getState()
  // const { remoteVersionNum, nowVersionNum } = appVersionInfo || {}
  // const needUpgrade = nowVersionNum < remoteVersionNum
  const navList = [
    {
      key: 'about_app',
      className: 'about_app',
      name: '关于掌控者',
    },
  ]
  const [state, setState] = useState({
    visible: false,
    navActive: 'about_app',
  })

  /**
   * 暴露给父组件的方法
   */
  useImperativeHandle(ref, () => ({
    /**
     * 刷新方法
     */
    setState: (paramObj: any) => {
      setState({ ...state, ...paramObj })
    },
  }))

  /**
   * 切换导航
   * @param key
   */
  const navChange = (key: string) => {
    setState({ ...state, navActive: key })
  }
  /**
   * 点击弹框自由关闭按钮关闭弹框
   */
  const handleCancel = () => {
    setState({ ...state, visible: false })
  }
  return (
    <Modal
      title="设置"
      visible={state.visible}
      width={850}
      bodyStyle={{ height: '564px' }}
      onCancel={handleCancel}
      footer={null}
      className="baseModal appSetUpModal"
      maskClosable={false}
    >
      {state.visible ? (
        <section className="appSetContainer h100 flex">
          <aside className="appSetAside h100">
            <ul className="h100 flex column">
              {navList.map((item: any) => {
                return (
                  <li
                    key={item.key}
                    className={`app_set_nav ${item.key}`}
                    onClick={() => {
                      navChange(item.key)
                    }}
                  >
                    {item.name}
                  </li>
                )
              })}
            </ul>
          </aside>
          <main className="appSetMain h100 flex-1">{state.navActive == 'about_app' ? <AboutApp /> : ''}</main>
        </section>
      ) : (
        ''
      )}
    </Modal>
  )
})
/**
 * 设置中心关于掌控者组件
 */
export const AboutApp = () => {
  const { appVersionInfo } = $store.getState()
  const { remoteVersionNum, nowVersionNum, content } = appVersionInfo || {}
  // 是否需要升级
  const needUpgrade = nowVersionNum < remoteVersionNum
  const holderLogo: any = $tools.asAssetsPath('/images/userInfo/upgrade_logo.svg')
  const [state, setState] = useState({
    autoUpdateVisible: false,
    // 正在升级中
    isUpgrading: false,
  })
  // 自动升级弹框组件
  const upgradeModalRef = useRef<any>({})
  const version = app.getVersion()
  return (
    <div className="aboutAppContainer h100 scrollbarsStyle">
      <div className="aboutAppContent flex column h100">
        <div className={`checkVersionBox flex center-v ${needUpgrade ? 'pad_bot' : ''}`}>
          <div className="flex-1 flex center-v">
            <Avatar className="oa-avatar" src={holderLogo} size={56} shape="square"></Avatar>
            <div>
              <p className="now_version_title">{needUpgrade ? '检测到新版本' : '当前已是最新版本'}</p>
              <p className="now_version_des">
                版本{version}(PC-{process.arch == 'x86' ? '32' : '64'}位)
              </p>
            </div>
          </div>
          <div>
            {needUpgrade && !state.isUpgrading ? (
              <span
                className="upgrade_btn primary-btn"
                onClick={() => {
                  if (needUpgrade) {
                    upgradeModalRef.current?.initFn({
                      finishCallBack: ({ success }: any) => {
                        // 更新失败则按钮还原，保证可继续点击升级
                        if (!success) {
                          setState({ ...state, isUpgrading: false })
                        }
                      },
                    })
                    // mac是跳转App Store下载，按钮不需要隐藏
                    if (process.platform != 'darwin') {
                      setState({ ...state, isUpgrading: true })
                    }
                  }
                }}
              >
                立即升级
              </span>
            ) : (
              ''
            )}
          </div>
        </div>
        {needUpgrade ? (
          <div className="updateContentBox flex-1">
            <p className="update_title">更新内容：</p>
            <pre className="update_content">{content}</pre>
          </div>
        ) : (
          ''
        )}
      </div>

      {/* 升级火箭背景图蒙版 */}
      {needUpgrade ? <div className="upgradeRocketMask"></div> : ''}
      <AutoUpdateModal disableInit={true} ref={upgradeModalRef} />
    </div>
  )
}
export default AppSet
