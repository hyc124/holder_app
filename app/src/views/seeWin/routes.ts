const routes: RouteConfig[] = [
  {
    key: 'seeWin',
    path: '/seeFile',
    windowOptions: {
      title: '查看文件',
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
    },
  },
]

export default routes
