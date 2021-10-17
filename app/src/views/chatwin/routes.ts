const routes: RouteConfig[] = [
  {
    key: 'ChatWin',
    path: '/chatwin',
    windowOptions: {
      title: '沟通窗口',
      width: 1350,
      height: 850,
      minWidth: 1350,
      minHeight: 850,
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
