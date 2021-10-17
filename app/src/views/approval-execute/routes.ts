const routes: RouteConfig[] = [
  {
    key: 'ApprovalExecute',
    path: '/approval-execute',
    windowOptions: {
      title: '发起审批',
      width: 1500,
      height: 840,
      minWidth: 1500,
      minHeight: 840,
    },
    createConfig: {
      openDevTools: true,
      single: false,
      showSidebar: false,
      autoShow: true,
      //刷新方式：打开窗口时发送进程刷新页面
      initRefresh: 'ipc',
    },
  },
]

export default routes
