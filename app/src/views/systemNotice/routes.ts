const routes: RouteConfig[] = [
  {
    key: 'SystemNoticeWin',
    path: '/systemNotice',
    windowOptions: {
      minWidth: 360,
      maxWidth: 360,
      width: 360,
      height: 104,
      minHeight: 104,
      maxHeight: 104,
      frame: false, //创建无边框窗口
      transparent: true, //透明窗口
      alwaysOnTop: true,
      skipTaskbar: true, //是否在任务栏显示窗口
      useContentSize: true, //窗口的大小是否包含边框的大小
      focusable: false,
    },
    createConfig: {
      openDevTools: false,
      single: false,
      showSidebar: false,
      forcedClose: true,
    },
  },
]

export default routes
