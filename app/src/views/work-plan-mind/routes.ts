const routes: RouteConfig[] = [
  {
    key: 'workplanMind',
    path: '/workplanMind',
    windowOptions: {
      title: '工作规划',
      minWidth: 1150,
      minHeight: 700,
    },
    createConfig: {
      openDevTools: true,
      single: false,
      showSidebar: false,
      initRefresh: 'ipc',
    },
  },
]

export default routes
