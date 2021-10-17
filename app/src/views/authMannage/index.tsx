import React, { useEffect } from 'react'
import { Tabs } from 'antd'
import './index.less'
import AuthList from './authList'
import ApplyRecord from './applyRecord'

function AuthManage() {
  useEffect(() => {
    document.title = '权限管理'
  }, [])
  return (
    <div className="authManageContent">
      <Tabs type="card" defaultActiveKey="AUTHMANAGE">
        <Tabs.TabPane tab="权限管理" key="AUTHMANAGE">
          <AuthList />
        </Tabs.TabPane>
        <Tabs.TabPane tab="权限申请记录" key="APPLYRECORD">
          <ApplyRecord />
        </Tabs.TabPane>
      </Tabs>
    </div>
  )
}

export default AuthManage
