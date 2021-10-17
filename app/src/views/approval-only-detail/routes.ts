const routes: RouteConfig[] = [
  {
    key: 'ApprovalOnlyDetail',
    path: '/approval-only-detail',
    windowOptions: {
      title: '审批详情',
      width: 1500,
      height: 840,
      minWidth: 1500,
      minHeight: 840,
    },
    createConfig: {
      openDevTools: true,
      single: false,
      showSidebar: false,
      autoShow: true,
    },
  },
]

export default routes
