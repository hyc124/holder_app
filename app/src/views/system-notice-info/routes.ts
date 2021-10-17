const routes: RouteConfig[] = [
  {
    key: 'systemnoticeinfo',
    path: '/systemnoticeinfo',
    windowOptions: {
      title: '系统通知',
      width: 1500,
      height: 840,
      minWidth: 1500,
      minHeight: 840,
    },
    createConfig: {
      openDevTools: true,
      single: false,
      showSidebar: false,
    },
  },
]

export default routes
