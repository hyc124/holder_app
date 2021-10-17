/**
 * 页面资源集合，请不要在主进程中引用
 */

// 设为 undefined 将不会创建路由，一般用于重定向页面
export const Home = undefined
export const MyWorkDesk = import('./views/myWorkDesk/myWorkDesk')
export const Login = import('./views/login/login')
export const ChatWin = import('./views/chatwin/ChatWin')
export const ChatHistory = import('./views/chat-history/chat-history')
export const ChatTipWin = import('./views/chat-Tip-Win/chat-Tip-Win')
export const Coordination = import('./views/coordination/coordination')
export const Announce = import('./views/announce/announce')
export const AddModalWin = import('./views/addModalWin/addModalWin')
export const WorkPlan = import('./views/workplan/workplan')
export const workplanMind = import('./views/work-plan-mind/work-plan-mind')
export const okrFourquadrant = import('./views/okr-four/work-okr-mind/work-okr-mind') //okr弹窗
export const OkrDetailWindow = import('./views/okrWindow/okrWindow') //okr详情独立弹窗
export const Approval = import('./views/approval/Approval')
export const seeFileWin = import('./views/seeFileWin/seeFileWin')
// export const fileWindow = import('./views/fileWindow/fileWindow') //附件窗口
export const fileWindow = import('./views/fileWindow/fileWindowNew') //附件窗口
export const SystemNoticeWin = import('./views/systemNotice/systemNotice')
// export const CloudDisk = import('./views/cloud-disk/cloud-disk')
export const CloudDisk = import('./views/no-match/no-match')
export const NoticeDetailWin = import('./views/NoticeDetailWin/NoticeDetailWin')
export const seeWin = import('./views/seeWin/seeWin')
export const WorkReport = import('./views/workReport/WorkReport')
export const OKR = import('./views/okr-four/list-card-four/okr-workplan')
export const TaskManage = import('./views/task/TaskManage')
export const AuthMannage = import('./views/authMannage/index')
export const ApprovalExecute = import('./views/approval-execute/ApprovalExecute')
export const NoMatch = import('./views/no-match/no-match')
export const systemnoticeinfo = import('./views/system-notice-info/system-notice-info') //系统通知
export const ChandaoWindow = import('./views/workdesk/component/chan-dao-window/chan-dao-window') //禅道详情
export const WuTongWindow = import('./views/workdesk/component/wu-tong-window/wu-tong-window') //吾同体育详情
export const FollowWorkDesk = import('./views/follow-user-desk/follow-user-desk') //关注人工作台
export const DailySummary = import('./views/DailySummary/DailySummary') //任务汇报
export const createForceReport = import('./views/force-Report/create-force-Report') //强制汇报
export const ApprovalOnlyDetail = import('./views/approval-only-detail/AppOnlyDetail') //触发审批详情
export const BusinessData = import('./views/business-data/business-data') //业务数据
export const MyApp = import('./views/my-app/my-app') //我的应用
export const AddressBook = import('./views/addressBook/addressBook') //通讯录
export const DownLoadHistory = import('./views/download-history/download-history')
export const WeChatScan = import('./views/wechatscan/wechatscan')
// export const TestPage = import('./views/workdesk/okrKanban/averageChart') //测试下新建窗口
// 空白页面loading界面
// export const AppLoading = import('./components/app-loading/appLoading')
// 新版工作规划
export const MyWorkPlan = import('./views/myWorkPlan/myWorkPlan')
// 新版工作台
export const WorkDesk = import('./views/myWorkDesk/myWorkDesk')
// 数据中心
export const DataControl = import('./views/dataControl/dataControl')

export const EnterpriseClouddisk = import('./views/EnterpriseClouddisk/EnterpriseClouddisk')
