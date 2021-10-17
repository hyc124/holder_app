const winH: number = 5 * 60 + 150
const routes: RouteConfig[] = [
  {
    key: 'ChatTipWin',
    path: '/chat-Tip-Win',
    windowOptions: {
      width: 280,
      height: winH,
      minWidth: 280,
      minHeight: 100,
      maxHeight: winH,
      frame: false,
      transparent: true,
      focusable: true,
    },
    createConfig: {
      openDevTools: false,
      single: true,
      showSidebar: false,
      initRefresh: 'no',
    },
  },
]
export default routes
