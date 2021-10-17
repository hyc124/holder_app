const routes: RouteConfig[] = [
  {
    key: 'Home',
    path: '/',
    redirect: {
      to: {
        pathname: '/login',
      },
    },
    windowOptions: {
      title: `掌控者-首页`,
      width: 1350,
      height: 850,
      minWidth: 1350,
      minHeight: 850,
    },
    createConfig: {
      openDevTools: true,
      isMain: true,
    },
  },
]

export default routes
