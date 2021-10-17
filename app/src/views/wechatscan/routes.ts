const routes: RouteConfig[] = [
  {
    key: 'WeChatScan',
    path: '/weChatScan',
    windowOptions: {
      title: '扫码登录',
      width: 1350,
      height: 850,
      minWidth: 1350,
      minHeight: 850,
    },
    createConfig: {
      openDevTools: true,
      single: false,
      showSidebar: false,
      //刷新方式：打开窗口时loadUrl
      initRefresh: 'loadUrl',
    },
  },
]

export default routes
