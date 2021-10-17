import React, { useState, memo, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Tabs, Badge, message, Button } from 'antd'
import SendApproval from './components/sendApproval'
import ApprovalDetail from './components/ApprovalDettail'
import ApprovalWorkFlow from '@/src/components/approval-workflow/ApprovalWorkFlow'
const { TabPane } = Tabs
import * as Maths from '@/src/common/js/math'
import './Approval.less'
import { ipcRenderer, remote } from 'electron'
import DownLoadFileFooter from '@/src/components/download-footer/download-footer'
import { loadLocales } from '@/src/common/js/intlLocales'
interface ToTabContent {
  name: string
  selectKey?: string
  unReadCount?: number
}

//动态引入tabpane
export const ToTabContent = memo((props: ToTabContent) => {
  const pages = {
    sendApproval: SendApproval,
    waitApproval: ApprovalDetail,
    triggerApproval: ApprovalDetail,
    noticeMeApproval: ApprovalDetail,
    mySendApproval: ApprovalDetail,
    approvaledList: ApprovalDetail,
    rejectApproval: ApprovalDetail,
  }
  //通过传入的name属性动态得到自己需要注入的组件
  const MyComponent = pages[props.name]
  return <MyComponent {...props} />
})

const panes = [
  {
    title: '发起审批',
    name: 'sendApproval',
  },
  {
    title: '待我审批',
    name: 'waitApproval',
  },
  {
    title: '等待发起',
    name: 'triggerApproval',
  },
  {
    title: '知会我的',
    name: 'noticeMeApproval',
  },
  {
    title: '我发起的',
    name: 'mySendApproval',
  },
  {
    title: '我已审批',
    name: 'approvaledList',
  },
  // {
  //   title: '驳回审批',
  //   name: 'rejectApproval',
  // },
  // {
  //   title: '触发审批',
  //   name: 'triggerApproval',
  // },
]

//查询审批未读数量
const getApprovalUnReadCount = () => {
  return new Promise<any>((resolve, reject) => {
    const { nowUserId, loginToken } = $store.getState()
    const param = {
      userId: nowUserId,
    }
    $api
      .request('/approval/approval/countApprovalAllTypeNum', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        resolve(resData.data)
      })
      .catch(() => {
        reject()
      })
  })
}

/**审批前端映射后台返回key */
const proxyApprovalTitle = {
  waitApproval: 0,
  noticeMeApproval: 2,
  rejectApproval: 4,
  triggerApproval: 7,
}
/**
 * 审批管理窗口
 */
const Approval = () => {
  // 获取窗口显示状态
  const [activeKey, setActiveKey] = useState('sendApproval')
  const [refreshKey, setRefreshKey] = useState('')
  //审批未读数量
  const [unreadCount, setUnreadCount] = useState({
    waitApproval: 0,
    noticeMeApproval: 0,
    rejectApproval: 0,
    triggerApproval: 0,
  })
  //切换导航
  const changeApprovalNav = (key: string) => {
    $store.dispatch({ type: 'SET_CREATE_APPROVAL_INFO', data: null })
    setActiveKey(key)
    setRefreshKey(Maths.uuid())
  }

  useEffect(() => {
    // 初始化多语言配置
    loadLocales()
  }, [])

  const refreshTabNum = (data: any) => {
    const waitApprovalNum = parseInt(data[proxyApprovalTitle['waitApproval']])
    const noticeMeApprovalNum = parseInt(data[proxyApprovalTitle['noticeMeApproval']])
    const triggerApprovalNum = parseInt(data[proxyApprovalTitle['triggerApproval']])
    return waitApprovalNum + noticeMeApprovalNum + triggerApprovalNum
  }

  useEffect(() => {
    //更新审批导航数量
    initFn()
    ipcRenderer.on('refresh_approval_count', (_ev, args) => {
      //查询审批未读数量
      getApprovalUnReadCount()
        .then(data => {
          setUnreadCount({
            waitApproval: data[proxyApprovalTitle['waitApproval']],
            noticeMeApproval: data[proxyApprovalTitle['noticeMeApproval']],
            rejectApproval: data[proxyApprovalTitle['rejectApproval']],
            triggerApproval: data[proxyApprovalTitle['triggerApproval']],
          })

          //当待我审批，知会我的，等待发起数量都为0 则更新工作台红点展示
          const numAll = refreshTabNum(data)
          if (numAll == 0) {
            //更新工作台
            ipcRenderer.send('update_unread_msg', ['approve_count'])
          }
          if (args && args === 'noFefreshList') {
            // noFefreshList 不刷新审批列表
            return
          }
          setRefreshKey(Maths.uuid())
        })
        .catch(() => {
          message.error('查询审批未读数量失败')
        })
    })
    //打开指定审批tab
    ipcRenderer.on('open_approval_tab', (event, args) => {
      console.log(args)
      if (args) {
        setActiveKey(args[0])
        setRefreshKey(Maths.uuid())
        $store.dispatch({ type: 'SET_CREATE_APPROVAL_INFO', data: args[1] })
      }
    })
    // 提前初始化审批详情、发起审批窗口
    $tools.windowsInit(['ApprovalOnlyDetail', 'ApprovalExecute'])

    //手动开启devtools
    window.addEventListener('keydown', e => {
      const { ctrlKey, altKey, keyCode } = e
      if (ctrlKey && altKey && keyCode === 71) {
        const cureentWindow = remote.getCurrentWindow()
        cureentWindow && cureentWindow.webContents.toggleDevTools()
        e.preventDefault()
      }
    })
    /**
     * 监听窗口显示时调用初始化方法刷新界面
     */
    ipcRenderer.on('window-show', () => {
      setActiveKey('sendApproval')
      setRefreshKey(Maths.uuid())
    })
    //添加title
    document.title = '审批管理'
  }, [])

  //状态管理选中tab
  useEffect(() => {
    $store.dispatch({ type: 'SET_SELECT_APPROVAL_TAB', data: activeKey })
    //查询审批未读数量
    getApprovalUnReadCount()
      .then(data => {
        setUnreadCount({
          waitApproval: data[proxyApprovalTitle['waitApproval']],
          noticeMeApproval: data[proxyApprovalTitle['noticeMeApproval']],
          rejectApproval: data[proxyApprovalTitle['rejectApproval']],
          triggerApproval: data[proxyApprovalTitle['triggerApproval']],
        })
        //当待我审批，知会我的，等待发起数量都为0 则更新工作台红点展示
        const numAll = refreshTabNum(data)
        if (numAll !== 0) {
          //更新工作台
          ipcRenderer.send('update_unread_msg', ['approve_count'])
        }
      })
      .catch(() => {
        message.error('查询审批未读数量失败')
      })
  }, [activeKey])

  /**
   * 初始化方法
   */
  const initFn = () => {
    const { saveTypeApprovalData } = $store.getState()

    // 设置当前选中
    if (saveTypeApprovalData && saveTypeApprovalData.noticeTypeId) {
      setActiveKey(saveTypeApprovalData.tabName)
      setRefreshKey(Maths.uuid())
      $store.dispatch({ type: 'SET_CREATE_APPROVAL_INFO', data: saveTypeApprovalData.noticeTypeId })
    }
  }

  /**
   * 自定义审批tab
   */
  const renderApprovalBar = (props: any, DefaultTabBar: any) => {
    return (
      <div className="approval-tab-header">
        <DefaultTabBar {...props} className="desk-tab-nav" style={{ margin: 0, border: 0 }} />
      </div>
    )
  }

  /**
   * 业务数据Button
   */
  const BusinessData = ({ name }: { name: string }) => {
    const [btnLoading, setBtnLoading] = useState(false)

    //点击打开业务数据窗口
    const openBusinessData = () => {
      setBtnLoading(true)
      $store.dispatch({ type: 'SET_BUSINESS_INFO', data: null })
      $tools.createWindow('BusinessData').finally(() => {
        setBtnLoading(false)
      })
    }
    return (
      <Button
        loading={btnLoading}
        style={{ marginRight: 10, display: name === 'sendApproval' ? 'block' : 'none' }}
        onClick={openBusinessData}
      >
        业务数据
      </Button>
    )
  }
  return (
    <div className="approval-conatainer">
      <Tabs
        className="approval-nav"
        activeKey={activeKey}
        onTabClick={changeApprovalNav}
        renderTabBar={renderApprovalBar}
        // tabBarExtraContent={<BusinessData name={activeKey} />}
      >
        {panes.map(item => (
          <TabPane
            tab={
              <span>
                {item.title}
                <Badge count={unreadCount[item.name] || 0} offset={[0, -20]} />
              </span>
            }
            key={item.name}
          >
            {item.name === activeKey && (
              <ToTabContent name={item.name} selectKey={refreshKey} unReadCount={unreadCount[item.name] || 0} />
            )}
          </TabPane>
        ))}
      </Tabs>
      <DownLoadFileFooter fromType="approval" />
    </div>
  )
}

export default Approval
