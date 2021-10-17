const routes: RouteConfig[] = [
  {
    key: 'BusinessData',
    path: '/business-data',
    windowOptions: {
      title: '云台账',
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
      initRefresh: 'ipc',
    },
  },
]

export default routes
