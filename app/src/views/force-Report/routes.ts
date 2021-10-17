const routes: RouteConfig[] = [
  {
    key: 'createForceReport',
    path: '/createForceReport',
    windowOptions: {
      title: ' 强制汇报',
      width: 1200,
      height: 750,
      minWidth: 850,
      minHeight: 750,
    },
    createConfig: {
      openDevTools: true,
      single: false,
      showSidebar: false,
      //刷新方式：打开窗口时发送进程刷新页面
      initRefresh: 'ipc',
    },
  },
]

export default routes
