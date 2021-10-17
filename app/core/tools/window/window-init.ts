// 记录提前创建的窗口key
export const windowsInitList: any = []
/**
 * 进入系统窗口初始化
 * 不传nameList则为刚进入系统需要创建的窗口，其他窗口或子级窗口可在需要的时机传入参数提前调用此方法创建窗口
 * @param nameList
 */
export const windowsInit = (nameList?: Array<RouterKey>) => {
  /**
   * 'DailySummary',//汇报
      'ChatWin',//沟通
      'Approval',//审批
      'ApprovalOnlyDetail',//审批详情
      'ApprovalExecute',//发起审批
      'FollowWorkDesk', //关注人看板
      'workplanMind',//工作规划脑图
      'BusinessData',//业务数据窗口
      'DownLoadHistory',//下载历史
      'createForceReport',//强制汇报
      'WorkReport',//工作报告
   */
  // 提升登陆页速度，初始界面不再创建空白窗口
  // const init = [
  //   'DailySummary',
  //   'ChatWin',
  //   'Approval',
  //   'FollowWorkDesk',
  //   'BusinessData',
  //   'DownLoadHistory',
  //   'createForceReport',
  //   'WorkReport',
  //   'ChatTipWin',
  //   'WeChatScan',
  //   'ChatHistory',
  //   'fileWindow',
  // ]
  // 初始
  const initList: any = nameList ? nameList : []
  initList.map((name: RouterKey) => {
    // 记录提前创建的窗口
    if (!windowsInitList.includes(name)) {
      windowsInitList.push(name)
    }
    $tools.createWindow(name, { createConfig: { autoShow: false, init: true } })
  })
}
