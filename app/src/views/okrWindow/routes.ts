const routes: RouteConfig[] = [
  {
    key: 'OkrDetailWindow',
    path: '/OkrDetailWindow',
    windowOptions: {
      title: 'OKR',
      width: 1920,
      height: 1080,
      minWidth: 1334,
      minHeight: 945,
    },
    createConfig: {
      openDevTools: true,
      single: false,
      showSidebar: false,
      initRefresh: 'ipc',
      autoShow: true,
    },
  },
]

export default routes
