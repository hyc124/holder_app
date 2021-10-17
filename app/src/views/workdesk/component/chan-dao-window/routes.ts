const routes: RouteConfig[] = [
  {
    key: 'ChandaoWindow',
    path: '/ChandaoWindow',
    windowOptions: {
      title: '禅道',
      width: 1500,
      height: 840,
      minWidth: 1500,
      minHeight: 840,
    },
    createConfig: {
      openDevTools: true,
      single: false,
      showSidebar: false,
      forcedClose: true, //真正关闭窗口
    },
  },
]

export default routes
