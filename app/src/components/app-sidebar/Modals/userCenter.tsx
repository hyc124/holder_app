import React, { useState } from 'react'
import { Modal } from 'antd'
import BaseInfo from './baseInfo'
import LoginLog from './loginLog'
import './index.less'
import AccountSet from './accountSet'
import { AboutApp } from './appSet/appSet'

interface ModalProps {
  visible: boolean
  closeModal: () => void
}

function UserCenter({ visible, closeModal }: ModalProps) {
  const { appVersionInfo } = $store.getState()
  const { remoteVersionNum, nowVersionNum } = appVersionInfo || {}
  const isUpgrade = nowVersionNum < remoteVersionNum
  const [state, setState] = useState({
    navActive: 'baseInfo',
  })
  const navList = [
    {
      key: 'baseInfo',
      name: '基本设置',
    },
    {
      key: 'accountSet',
      name: '账号设置',
    },
    {
      key: 'loginLog',
      name: '登录轨迹',
    },
    {
      key: 'aboutApp',
      name: '关于掌控者',
    },
  ]
  /**
   * 切换导航
   * @param key
   */
  const navChange = (key: string) => {
    setState({ navActive: key })
  }
  return (
    <Modal
      title="设置"
      visible={visible}
      width={850}
      bodyStyle={{ height: '564px' }}
      onCancel={closeModal}
      onOk={closeModal}
      footer={null}
      className="userCenterContent appSetUpModal"
      maskClosable={false}
    >
      <div className="appSetContainer flex h100">
        <div className="tabs appSetAside">
          {/* <div className={state.navActive === 'baseInfo' ? 'active' : ''} onClick={() => navChange('baseInfo')}>
            基本设置
          </div>
          <div
            className={state.navActive === 'accountSet' ? 'active' : ''}
            onClick={() => navChange('accountSet')}
          >
            账号设置
          </div>
          <div className={state.navActive === 'loginLog' ? 'active' : ''} onClick={() => navChange('loginLog')}>
            登录轨迹
          </div>
          <div
            className={`${state.navActive === 'aboutApp' ? 'active' : ''} ${isUpgrade ? 'upgrade' : ''}`}
            onClick={() => navChange('aboutApp')}
          >
            关于掌控者
          </div> */}
          <ul className="h100 flex column">
            {navList.map((item: any) => {
              return (
                <li
                  key={item.key}
                  className={`app_set_nav ${item.key} ${state.navActive === item.key ? 'active' : ''} ${
                    item.key == 'aboutApp' && isUpgrade ? 'upgrade' : ''
                  }`}
                  onClick={() => {
                    navChange(item.key)
                  }}
                >
                  {item.name}
                </li>
              )
            })}
          </ul>
        </div>
        <main className="appSetMain h100 flex-1">
          {state.navActive === 'baseInfo' && <BaseInfo />}
          {state.navActive === 'accountSet' && <AccountSet />}
          {state.navActive === 'loginLog' && <LoginLog />}
          {state.navActive === 'aboutApp' && <AboutApp />}
        </main>
      </div>
    </Modal>
  )
}

export default UserCenter
