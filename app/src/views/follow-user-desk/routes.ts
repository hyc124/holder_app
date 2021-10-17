const routes: RouteConfig[] = [
  {
    key: 'FollowWorkDesk',
    path: '/FollowWorkDesk',
    windowOptions: {
      title: '关注人工作台',
      // width: 1500,
      // height: 840,
      // minWidth: 1500,
      // minHeight: 840,
    },
    createConfig: {
      openDevTools: true,
      single: false,
      showSidebar: false,
    },
  },
]

export default routes
