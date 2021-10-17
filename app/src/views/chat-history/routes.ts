const routes: RouteConfig[] = [
  {
    key: 'ChatHistory',
    path: '/chat-history',
    windowOptions: {
      title: '',
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
