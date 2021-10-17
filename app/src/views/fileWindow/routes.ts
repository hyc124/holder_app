const routes: RouteConfig[] = [
  {
    key: 'fileWindow',
    path: '/fileWindow',
    windowOptions: {
      title: '查看文件',
      width: 1000,
      height: 740,
      minWidth: 450,
      minHeight: 490,
    },
    createConfig: {
      openDevTools: true,
      single: false,
      showSidebar: false,
      autoShow: true,
      initRefresh: 'ipc',
      delayToShow: 0,
    },
  },
]

export default routes
