const routes: RouteConfig[] = [
  {
    key: 'DailySummary',
    path: '/DailySummary',
    windowOptions: {
      title: '任务汇报',
      width: 1200,
      height: 750,
      minWidth: 850,
      minHeight: 750,
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
