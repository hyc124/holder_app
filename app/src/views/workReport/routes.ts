const routes: RouteConfig[] = [
  {
    key: 'WorkReport',
    path: '/workReport',
    windowOptions: {
      title: '工作报告',
      width: 1500,
      height: 840,
      minWidth: 1500,
      minHeight: 840,
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
