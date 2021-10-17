const routes: RouteConfig[] = [
  {
    key: 'WuTongWindow',
    path: '/WuTongWindow',
    windowOptions: {
      title: '吾同体育',
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
