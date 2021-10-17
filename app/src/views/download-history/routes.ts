const routes: RouteConfig[] = [
  {
    key: 'DownLoadHistory',
    path: '/download-history',
    windowOptions: {
      title: '下载内容',
      width: 850,
      height: 620,
      minWidth: 850,
      minHeight: 620,
    },
    createConfig: {
      openDevTools: true,
      single: true,
      showSidebar: false,
    },
  },
]

export default routes
