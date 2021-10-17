// /**
//  * 我的应用
//  */
// import React, { useEffect, useMemo, useState } from 'react'
// import { useSelector } from 'react-redux'
// import { Spin } from 'antd'
// import WebView from 'react-electron-web-view'
// import './my-app.less'

// const MyApp = () => {
//   //获取登录账号和选中企业id
//   const { nowAccount } = $store.getState()
//   const odooToken = useSelector((store: StoreStates) => store.odooToken)
//   const businessAddress = useSelector((store: StoreStates) => store.businessAddress)
//   const { selectTeamId } = $store.getState()

//   const webSrc = `${businessAddress}/goalgo_sync/auth/login?account=${nowAccount}&company_id=${selectTeamId}&odoo_token=${odooToken}`
//   //是否显示loading
//   const [loading, setLoading] = useState(false)
//   const loadstart = () => {
//     setLoading(true)
//   }
//   const loadstop = () => {
//     setLoading(false)
//   }
//   //监听webview加载
//   useEffect(() => {
//     const wb = document.querySelector('webview')
//     let isunmounted = false
//     if (businessAddress != '') {
//       if (!isunmounted) {
//         wb?.addEventListener('did-start-loading', loadstart)
//         wb?.addEventListener('did-stop-loading', loadstop)
//       }
//     }
//     return () => {
//       isunmounted = true
//       wb?.removeEventListener('did-start-loading', loadstart)
//       wb?.removeEventListener('did-stop-loading', loadstop)
//     }
//   }, [selectTeamId])

//   const RenderWebView = useMemo(() => {
//     if (!businessAddress) {
//       return null
//     }
//     return (
//       <WebView
//         src={webSrc}
//         id="odoo_app"
//         disablewebsecurity
//         allowpopups
//         style={{ width: '100%', height: '100%' }}
//       />
//     )
//   }, [webSrc])

//   if (!businessAddress) {
//     return (
//       <div className="odoo_app_blank_container" style={{ width: '100%', height: '100%', display: 'flex' }}>
//         <div style={{ alignSelf: 'center', textAlign: 'center', margin: 'auto' }}>
//           <img src={$tools.asAssetsPath('/images/my-app/blank.png')} />
//           <p>未开通应用!!!</p>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className="odoo_app_container" style={{ width: '100%', height: '100%' }}>
//       <Spin spinning={loading} tip="正在努力加载中，请耐心等待...">
//         {RenderWebView}
//         {/* <iframe src={webSrc} id="odoo_app" height="100%" width="100%" frameBorder="0"></iframe> */}
//       </Spin>
//     </div>
//   )
// }

// export default MyApp

/**
 * 我的应用
 */

import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { message, Spin, Tabs } from 'antd'
import './my-app.less'
import { requestApi } from '../../common/js/ajax'
import { ipcRenderer } from 'electron'
import './my-app.less'
const { TabPane } = Tabs
interface MyAppProps {
  appData: Array<any>
}
interface AppListProps {
  appName: string
  appUrl: string
  appKey: string
  description: any
}

const MyApp: React.FC<MyAppProps> = () => {
  const { nowUserId } = $store.getState()
  // 当前选中的企业id
  const selectTeamId = useSelector((state: StoreStates) => state.selectTeamId)
  // 应用列表
  const [list, setList] = useState<Array<AppListProps>>([])
  //是否显示loading
  const [loading, setLoading] = useState(true)
  /* eslint-disable */
  const imgs: any = {
    defaultIcon: $tools.asAssetsPath('/images/my-app/defaultIcon.png'), //默认图标
    crm: $tools.asAssetsPath('/images/my-app/crm.png'), //CRM
    operation_platform: $tools.asAssetsPath('/images/my-app/crm.png'), //运营平台
    // wutong_wechat_message: $tools.asAssetsPath('/images/my-app/wutong_wechat_message.png'), //微信公众号消息推送
    approval_management: $tools.asAssetsPath('/images/my-app/approval_management.png'), //审批管理
    wt_report: $tools.asAssetsPath('/images/my-app/wt_report.png'), //报表
    // wutong_purchase_management: $tools.asAssetsPath('/images/my-app/wutong_purchase_management.png'), //采购管理
    wutong_warehouse_management: $tools.asAssetsPath('/images/my-app/wutong_warehouse_management.png'), //进销存管理
    wutong_interaction: $tools.asAssetsPath('/images/my-app/wutong_interaction.png'), //师生互动
    evaluation_management: $tools.asAssetsPath('/images/my-app/wutong_interaction.png'), //师生互动
    store_filling: $tools.asAssetsPath('/images/my-app/store_filling.png'), //门店数据填报
    wutong_total: $tools.asAssetsPath('/images/my-app/wutong_total.png'), //梧桐体育
    wutong_payment_management: $tools.asAssetsPath('/images/my-app/wutong_payment_management.png'), //费用管理
    wutong_educational_management: $tools.asAssetsPath('/images/my-app/wutong_educational_management.png'), //教务管理
    wutong_campus_management: $tools.asAssetsPath('/images/my-app/wutong_campus_management.png'), //校区管理
    wutong_student_management: $tools.asAssetsPath('/images/my-app/wutong_student_management.png'), //学员管理
    // sale: $tools.asAssetsPath('/images/my-app/sale.png'), //Sales
    utility_management: $tools.asAssetsPath('/images/my-app/utility_management.png'), //水电气管理
    attendance_manage: $tools.asAssetsPath('/images/my-app/attendance_manage.png'), //考勤管理
    survey: $tools.asAssetsPath('/images/my-app/survey.png'), //survey调查
    // hr_appraisal: $tools.asAssetsPath('/images/my-app/hr_appraisal.png'), // Appraisal
    chandao: $tools.asAssetsPath('/images/my-app/chandao.png'), //禅道
    work_schedule: $tools.asAssetsPath('/images/my-app/work_schedule.png'), //精细化排班
    // oa: $tools.asAssetsPath('/images/my-app/oa.png'), //OA系统
    // website: $tools.asAssetsPath('/images/my-app/website.png'), //网站
    website_slides: $tools.asAssetsPath('/images/my-app/website_slides.png'), //在线学习
    point_of_sale: $tools.asAssetsPath('/images/my-app/point_of_sale.png'), //pos
    mrp: $tools.asAssetsPath('/images/my-app/mrp.png'), //制造
    repair: $tools.asAssetsPath('/images/my-app/repair.png'), //维修
    website_event: $tools.asAssetsPath('/images/my-app/website_event.png'), //活动
    hr_recruitment: $tools.asAssetsPath('/images/my-app/hr_recruitment.png'), //招聘
    hr_attendance: $tools.asAssetsPath('/images/my-app/hr_attendance.png'), //出勤
    hr_holidays: $tools.asAssetsPath('/images/my-app/hr_holidays.png'), //休息时间
    maintenance: $tools.asAssetsPath('/images/my-app/maintenance.png'), //维护
    hr_expense: $tools.asAssetsPath('/images/my-app/hr_expense.png'), //费用
    note: $tools.asAssetsPath('/images/my-app/note.png'), //备注
    hr: $tools.asAssetsPath('/images/my-app/hr.png'), //员工
    // discuss: $tools.asAssetsPath('/images/my-app/discuss.png'), //discuss
    calendar: $tools.asAssetsPath('/images/my-app/calendar.png'), //日历
    sale_management: $tools.asAssetsPath('/images/my-app/sale_management.png'), //销售
    fleet: $tools.asAssetsPath('/images/my-app/fleet.png'), //车队
    project: $tools.asAssetsPath('/images/my-app/project.png'), //项目
    stock: $tools.asAssetsPath('/images/my-app/stock.png'), //库存
    purchase: $tools.asAssetsPath('/images/my-app/purchase.png'), //采购
    account: $tools.asAssetsPath('/images/my-app/account.png'), //采购
  }

  useEffect(() => {
    requestApi({
      url: '/authority/findAppInfoList',
      param: { teamId: selectTeamId, userId: nowUserId },
    })
      .then((res: any) => {
        if (res.success) {
          const resData = res.data
          resData && setList(resData.dataList)
        }
      })
      .finally(() => {
        setLoading(false)
      })
  }, [selectTeamId])

  const getIntoApp = (dataUrl: string, dataKey: string) => {
    if (dataUrl) {
      // const timeStamp = new Date().getTime().toString()
      // const newUrl = dataUrl.includes('?') ? dataUrl + '&time=' + timeStamp : dataUrl + '?time=' + timeStamp
      ipcRenderer.send('open-outside-app', [dataKey, dataUrl])
    } else {
      message.info('暂未开通此应用')
    }
  }

  return (
    <div className="app_wrap">
      <div className="app_wrap_top">智慧办公 . 高效协作</div>
      <div className="app_wrap_center">
        <Tabs defaultActiveKey="1">
          <TabPane tab="全部" key="1">
            <Spin spinning={loading}>
              <div className="app_wrap_content">
                {list.map(item => {
                  return (
                    <div
                      key={item.appKey}
                      className="app_item"
                      onClick={() => getIntoApp(item.appUrl, item.appKey)}
                    >
                      <div className="app_item_l">
                        <img src={imgs[item.appKey] ? imgs[item.appKey] : imgs['defaultIcon']} />
                      </div>
                      <div className="app_item_r">
                        <span className="app_name">{item.appName}</span>
                        <span className="app_msg">{item.description}</span>
                      </div>
                      {/* <span className="line_b line_b_l"></span>
                      <span className="line_b line_b_r"></span> */}

                      {/* <span className="line_t line_b_l"></span>
                      <span className="line_t line_b_r"></span>

                      <span className="line_r line_r_t"></span>
                      <span className="line_r line_r_b"></span>

                      <span className="line_l line_r_t"></span>
                      <span className="line_l line_r_b"></span> */}
                    </div>
                  )
                })}
              </div>
            </Spin>
          </TabPane>
        </Tabs>
      </div>
    </div>
  )
}

export default MyApp
