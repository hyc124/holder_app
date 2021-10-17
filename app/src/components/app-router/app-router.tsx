import React from 'react'
import { remote } from 'electron'
import { HashRouter as Router, Route, Switch, Redirect, RouteComponentProps } from 'react-router-dom'
import { Provider } from 'react-redux'
import { asyncImport } from '../async-import'
import { beforeRouter } from './router-hooks'
import * as pageResource from '@/src/page-resource'
import AppSidebar from '../app-sidebar/app-sidebar'
import ForceReportTip from '@/src/views/task/forceReportTip/forceReportTip'
import { ChatWindowTip } from '@/src/views/task/ChatWindowTip/ChatWindowTip'
import HandleMessage from '../handle-message/handle-message'
import AppLoading from '../app-loading/appLoading'

interface AppRouterProps {
  routes: Map<string, RouteConfig>
  store: AppStore
  isMain: boolean | undefined
}

interface AppRouterState {
  readyToClose: boolean
  handleMessageStatus: boolean
  handleMessageData: any[]
  handleMessageCustom: any
  routeKey: any
}

const currentWindow = remote.getCurrentWindow()

export class AppRouter extends React.Component<AppRouterProps, AppRouterState> {
  static defaultProps = {
    routes: [],
  }

  noMatch?: JSX.Element
  routeElements: JSX.Element[]
  routeKey: any
  readonly state: AppRouterState = {
    readyToClose: false,
    handleMessageStatus: false,
    handleMessageData: [],
    handleMessageCustom: '',
    routeKey: '0',
  }

  constructor(props: AppRouterProps) {
    super(props)
    this.routeElements = this.createRoutes()
    this.routeKey = '0'
    // 保证组件正常卸载,防止 Redux 内存泄露
    window.onbeforeunload = () => {
      this.setState({ readyToClose: true })
    }
  }

  // componentDidMount() {
  //   window.addEventListener('resize', this.handelHeight)
  // }
  // componentWillUnmount() {
  //   window.removeEventListener('resize', this.handelHeight)
  // }
  // handelHeight() {
  //   //存储屏幕变化宽度
  //   const screenWidth = document.documentElement.clientWidth
  //   $store.dispatch({ type: 'SCREEN_WIDTH', data: { screenWidth: screenWidth } })
  // }

  render() {
    //isMain表示是否是主窗口
    const { store, isMain } = this.props
    const { readyToClose } = this.state
    //注释
    if (readyToClose) return null
    //showSide:是否显示侧边栏
    const { showSide, isLogin } = $store.getState()
    // console.log($store.getState())
    return (
      <Provider store={store}>
        <Router>
          {isMain && showSide ? (
            <>
              <AppSidebar
              // 更新routeKey，以点击当前导航及时刷新右侧路由界面
              // changeRouteKey={() => {
              //   const updateKey = new Date().getTime().toString()
              //   this.setState({ routeKey: updateKey })
              // }}
              />
              <ChatWindowTip />
            </>
          ) : (
            ''
          )}
          <Switch key={this.routeKey}>
            {this.routeElements}
            {this.noMatch ?? null}
          </Switch>
          {isLogin && isMain ? <ForceReportTip /> : ''}
          <HandleMessage />
          {/* 全局loading 组件*/}
          <AppLoading />
        </Router>
      </Provider>
    )
  }

  createRoutes() {
    const { routes } = this.props
    const res: JSX.Element[] = []

    routes.forEach((conf, key) => {
      const routeEl = this.creatRoute(conf, key)
      if (!routeEl) return
      if (conf.path) {
        res.push(routeEl)
      } else {
        this.noMatch = routeEl
      }
    })

    return res
  }

  creatRoute = (routeConfig: RouteConfig, key: string) => {
    const { path, exact = true, redirect, ...params } = routeConfig
    const routeProps: any = { key, name: key, path, exact }

    if (redirect) {
      routeProps.render = (props: RouteComponentProps) => <Redirect {...redirect} {...props} />
    } else {
      const resource = pageResource[key]
      if (!resource) return

      const Comp = resource.constructor === Promise ? asyncImport(resource, beforeRouter) : resource

      routeProps.render = (props: RouteComponentProps) => {
        const nextProps = {
          name: key,
          currentWindow,
          closeWindow: this.closeWindow,
          query: $tools.getQuery(props.location.search),
          ...props,
          ...params,
        }
        return <Comp {...nextProps} />
      }
    }

    return <Route {...routeProps} />
  }

  closeWindow = () => {
    this.setState({ readyToClose: true }, () => {
      currentWindow.close()
    })
  }
}
