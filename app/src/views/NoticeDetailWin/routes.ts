const routes: RouteConfig[] = [
  {
    key: 'NoticeDetailWin',
    path: '/NoticeDetail',
    windowOptions: {
      frame: false, //创建无边框窗口
      transparent: true, //窗口窗口
    },
    createConfig: {
      single: false,
    },
  },
]

export default routes
