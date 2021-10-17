const routes: RouteConfig[] = [
  {
    key: 'DataControl',
    path: '/dataControl',
    createConfig: {
      single: false,
    },
    windowOptions: {
      webPreferences: {
        webSecurity: false,
        allowRunningInsecureContent: true,
      },
    },
  },
]

export default routes
