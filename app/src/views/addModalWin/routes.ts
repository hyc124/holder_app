const routes: RouteConfig[] = [
  {
    key: 'AddModalWin',
    path: '/addModalWin',
    windowOptions: {
      title: '公告窗口',
      width: 1400,
      height: 860,
      minWidth: 1400,
      minHeight: 860,
    },
    createConfig: {
      openDevTools: true,
      single: true,
      showSidebar: false,
      initRefresh: 'ipc',
      // forcedClose: true,
    },
  },
]

export default routes
