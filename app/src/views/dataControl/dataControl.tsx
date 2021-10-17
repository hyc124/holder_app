import React, { useState, useEffect, useRef, useImperativeHandle, useMemo } from 'react'
import './dataControl.less'
import { Spin } from 'antd'
import ControlTypeLeft from './ControlTypeLeft'
import { queryDashboardUrl } from './dataControlApi'
import '@/src/common/js/jquery.resize'
import { forwardRef } from 'react'
// import cookie from 'react-cookies'
const METABASE_URL: any = process.env.METABASE_URL
// 嵌入的webView页面
const WebViewRight = forwardRef((props: any, ref) => {
  const url =
    process.env.BUILD_ENV == 'prod'
      ? 'https://metabase.goalgo.cn/dashboard'
      : 'https://reax-dev.holderzone.cn/auth/login'
  const [state, setState] = useState({
    // mainLoading: false,
    curNode: {
      curMarkId: 0, //当前选中仪表盘id
      curTeamId: 0, //当前选中企业id
      curTypeId: 0, //当前选中类型id
      dashboardName: '', //当前选中名称
    },
    ifraUrl: '',
    token: '',
    inited: false, //是否初始化加载完webview
  })
  // useEffect(() => {
  //   curNode.curMarkId && getQueryDashboardUrl(curNode)
  // }, [curNode.curMarkId])

  /**
   * 暴露给父组件的方法
   */
  useImperativeHandle(ref, () => ({
    /**
     * 刷新方法
     */
    getQueryDashboardUrl,
  }))
  useEffect(() => {
    // const webview = $('#dataCtrolView')
    // console.log(webview)
    // webview.on('did-start-loading', () => {
    //   console.log('开始')
    //   console.log(state.ifraUrl)
    // })
    // webview.on('did-stop-loading', () => {
    //   console.log('结束')
    //   state.inited = true
    //   setState({ ...state })
    //   const token = getQueryValue(state.token)
    //   console.log(token)
    //   console.log(state.inited)
    //   const id = state.curNode.curMarkId
    //   const msg = {
    //     type: 'toggleDashboard',
    //     data: { id: id.toString(), token },
    //   }
    //   console.log(msg)
    //   const webview: any = document.getElementById('dataCtrolView')
    //   webview.send(JSON.stringify(msg))
    //   // webview.contentWindow.postMessage(JSON.stringify(msg))
    // })
    // window.addEventListener('message', receiveMessage)
  }, [])
  // 获取webview的数据
  const receiveMessage = (e: any) => {
    console.log(e.data, e.origin, e.source)
  }
  // 截取token
  const getQueryValue = (url: string) => {
    const urlStr = '?' + url.split('?')[1]
    let token = ''
    if (urlStr.indexOf('?') != -1) {
      const str = urlStr.substr(1)
      const strs = str.split('&')
      for (let i = 0; i < strs.length; i++) {
        if (strs[i].split('=')[0] == 'token') {
          token = strs[i].split('=')[1]
        }
      }
    }
    return token
  }
  // 切换仪表盘
  const getQueryDashboardUrl = (param: {
    curMarkId: any
    curTeamId: any
    curTypeId: number
    dashboardName: string
  }) => {
    queryDashboardUrl({
      dashboardId: param.curMarkId,
      teamId: param.curTeamId,
      userId: $store.getState().userInfo.id,
    }).then((res: any) => {
      if (res && res.data) {
        const token = getQueryValue(res.data)
        state.token = token
        setState({ ...state, curNode: { ...param } })
        console.log(state.inited)
        // if (state.inited) {
        // const id = param.curMarkId
        // const msg = {
        //   type: 'toggleDashboard',
        //   data: { id: id.toString(), token },
        // }
        // console.log(msg)

        // const webview: any = document.getElementById('dataCtrolView')
        // webview.contentWindow.postMessage(JSON.stringify(msg))
        // }
        if (state.inited) {
          const v = document.getElementById('dataCtrolView') as HTMLIFrameElement
          console.log('点击后metabase切换', {
            type: 'toggleDashboard',
            data: {
              id: state.curNode.curMarkId,
              token: state.token,
            },
          })
          if (!v || !v.contentWindow) {
            return
          }
          const id = param.curMarkId
          v.contentWindow.postMessage(
            JSON.stringify({
              type: 'toggleDashboard',
              data: {
                id: id,
                token: state.token,
              },
            }),
            METABASE_URL
          )
        }

        // const webview: any = document.querySelector('webview')
        // setTimeout(() => {
        //   webview
        //     ?.getWebContents()
        //     .session.cookies.get({ url: res.data })
        //     .then((cookies: any) => {
        //       if (cookies[0]) {
        //         webview?.getWebContents().session.cookies.remove(res.data, cookies[0].name, () => {})
        //       }
        //       return false
        //     })
        // }, 3000)
      }
    })
  }

  return (
    <>
      {/* <webview
        id="dataCtrolView"
        className="dataCtrolIframe"
        nodeintegration
        src={`https://reax-dev.holderzone.cn/auth/login`}
        // src={'file:///C:/Users/huyanchun/Desktop/test.html'}
        onLoad={() => {
          console.log(1111111111111)
        }}
      ></webview> */}
      <iframe
        id="dataCtrolView"
        className="dataCtrolIframe"
        src={`${METABASE_URL}/auth/login`}
        sandbox="allow-scripts allow-same-origin allow-top-navigation allow-modals"
        onLoad={() => {
          state.inited = true
          setState({ ...state })
          const v = document.getElementById('dataCtrolView') as HTMLIFrameElement
          console.log('dataCtrolView loaded', v)
          if (!v || !v.contentWindow) {
            return
          }

          v.contentWindow.postMessage(
            JSON.stringify({
              type: 'toggleDashboard',
              data: {
                id: state.curNode.curMarkId,
                token: state.token,
              },
            }),
            METABASE_URL
          )
          console.log('初始化后', {
            type: 'toggleDashboard',
            data: {
              id: state.curNode.curMarkId,
              token: state.token,
            },
          })
        }}
      ></iframe>
    </>
  )
})

// 数据中主页面
const DataControl = () => {
  const rightView = useRef()
  const [state, setState] = useState<any>({
    mainLoading: false,
    // ifraUrl: '', //webView路径
    curNode: {
      curMarkId: 0, //当前选中仪表盘id
      curTeamId: 0, //当前选中企业id
      curTypeId: 0, //当前选中类型id
      dashboardName: '', //当前选中名称
    },
    time: new Date().getTime()?.toString(),
  })

  const orgAside = useMemo(() => {
    return (
      <ControlTypeLeft
        rightView={rightView}
        getQueryDashboardUrl={(param: {
          curMarkId: number
          curTeamId: number
          dashboardName: string
          curTypeId: number
        }) => {
          state.curNode = param
          setState({ ...state, curNode: param })
        }}
      />
    )
  }, [])

  const webViewRight = useMemo(() => {
    return (
      <>
        <header className="dashboar_hearder">{state.curNode.dashboardName}</header>
        <WebViewRight ref={rightView} curNode={state.curNode}></WebViewRight>
      </>
    )
  }, [state.curNode.curMarkId])
  return (
    <section className="secondPageContainer  dataControlContainer flex-1 flex scrollbarsStyle">
      {/* 左侧组织架构 */}
      <aside className={`orgLeftCon flex column `}>{orgAside}</aside>
      {/* 右侧仪表盘内容 */}
      <Spin spinning={state.mainLoading} wrapperClassName="rightConLoading flex-1">
        {webViewRight}
      </Spin>
    </section>
  )
}
export default DataControl
