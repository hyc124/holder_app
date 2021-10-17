import { loadLocales } from '@/src/common/js/intlLocales'
import { Tooltip } from 'antd'
import { ipcRenderer } from 'electron'
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
// import { useSelector } from 'react-redux'
import OKRDetailCont from '../task/OKRDetails/okrDetailCont'
import './okrWindow.less'
/**
 * okr详情独立弹框
 */
const OkrDetailWindow = () => {
  //mindMapData:列表及卡片点击的参数
  const [state, setState] = useState<any>({
    id: '',
    refresh: 0,
    from: '',
    taskData: { from: 'apiInit' },
    callbackFn: null,
  })
  const headerRef = useRef<any>({})
  useEffect(() => {
    // 初始加载界面
    initFn({ init: 1 })
    // 初始化多语言配置
    loadLocales()
    // 窗口已打开情况下点击新的okr进入刷新时
    ipcRenderer.on('window-show', () => {
      initFn({ init: 2 })
    })
    // return () => {
    //   $store.dispatch({ type: 'OKRWINDOWINFO', data: { findId: '' } })
    // }
  }, [])

  /**
   * 初始化加载
   */
  const initFn = ({ init }: any) => {
    console.log('okrDetailWindow initFn:', init)
    const { okrWindowInfo } = $store.getState()
    const nowSelectOkr = okrWindowInfo.nowSelectOkr || {}
    console.log(okrWindowInfo)
    if (nowSelectOkr.findId) {
      setState({
        ...state,
        id: nowSelectOkr.findId,
        refresh: new Date().getTime().toString(),
        taskData: { from: 'apiInit', taskId: nowSelectOkr.findId },
      })
      if (headerRef.current) {
        const tabList = headerRef.current.getNewTabs({ nowTab: { ...nowSelectOkr }, init })
        headerRef.current.setNewTitle({ nowTab: { ...nowSelectOkr }, init, otherState: { tabList } })
      }
    }
  }

  /**
   * 查询下方详情
   */
  const queryDetail = ({ item }: { item: any }) => {
    setState({
      ...state,
      id: item.findId,
      refresh: state.refresh + 1,
      taskData: { from: 'apiInit', taskId: item.findId },
    })
  }
  return (
    <section className="okrDetailWindow h100 flex column">
      <OKRWindowHeader ref={headerRef} queryDetail={queryDetail} />
      <section className="okrDetailWindowContent flex-1">
        <OKRDetailCont
          from={'okrDetailWindow_OKR'}
          taskId={state.id}
          taskData={state.taskData}
          refresh={state.refresh}
          setModalState={setState}
          noCloseBtn={true}
          okrHeaderRef={headerRef}
        />
      </section>
    </section>
  )
}
/**
 * 头部标签组件
 */
const OKRWindowHeader = forwardRef(({ queryDetail }: { queryDetail: any }, ref) => {
  const { okrWindowInfo } = $store.getState()
  const nowSelectOkr = okrWindowInfo.nowSelectOkr || {}
  // const { createType, fromToType } = fromPlanTotype || {}
  const teamName = nowSelectOkr.teamName
    ? nowSelectOkr.teamName
    : nowSelectOkr.ascriptionName
    ? nowSelectOkr.ascriptionName
    : ''
  const [state, setState] = useState<any>({
    tabList: [],
    teamName,
  })

  /**
   * 父组件使用方法
   */
  useImperativeHandle(ref, () => ({
    /**
     * 设置state
     */
    setState: (paramObj: any) => {
      setState({ ...state, ...paramObj })
    },
    /**
     * 设置当前表头数据
     */
    setNewTitle,
    /**
     * 设置当前表头
     */
    getNewTabs,
    // 删除当前Tab表头
    delTab,
  }))

  /**
   * 设置当前表头
   */
  const getNewTabs = ({ init, nowTab }: any) => {
    let tabList: any = [...state.tabList]
    // 组件初始化加载
    if (init == 1) {
      tabList = [{ ...nowTab, active: true }]
    } else if (init == 2) {
      const findArr = state.tabList.filter((item: any) => {
        if (item.findId != nowTab.findId) {
          item.active = false
        } else {
          item.active = true
        }
        return item.findId == nowTab.findId
      })
      // 不存在则push进数组
      if (findArr.length == 0) {
        // 已经打开窗口情况下再次刷新
        tabList = [...state.tabList, { ...nowTab, active: true }]
      }
    }
    return tabList
  }
  /**
   * 设置当前表头数据
   */
  const setNewTitle = (paramObj: any) => {
    const { nowTab, otherState, init } = paramObj
    const { okrWindowInfo } = $store.getState()
    const okrTabsList = okrWindowInfo.tabsList || []
    let newState = {
      ...state,
      teamName: nowTab.teamName ? nowTab.teamName : nowTab.ascriptionName ? nowTab.ascriptionName : '',
    }
    if (otherState !== undefined) {
      newState = { ...newState, ...otherState }
    }
    const storeState: any = {}
    if (otherState.tabList) {
      // 初始化时从全局store中获取数据，根据okrModeActive更新当前被点击的目标详情选中的模式（四象限、对齐视图、详情）
      const findItem = okrTabsList.find((item: any) => item.findId == nowTab.findId)
      if (findItem) {
        const findOtherI = otherState.tabList.findIndex((item: any) => item.findId == nowTab.findId)
        otherState.tabList[findOtherI].okrModeActive = findItem.okrModeActive
      }
      storeState.tabsList = [...otherState.tabList]
    }
    // 非初始化：点击标签等操作后，记录当前选中标签数据
    if (!init) {
      storeState.nowSelectOkr = { ...nowTab }
    }
    if (JSON.stringify(storeState) != '{}') {
      $store.dispatch({ type: 'OKRWINDOWINFO', data: storeState })
    }
    setState(newState)
  }

  /**
   * 删除表头tab
   */
  const delTab = ({ index, from, item }: any) => {
    let _index = index
    //操作删除目标O数据
    if (from && from == 'handerDelO') {
      _index = state.tabList.findIndex((sitem: any) => {
        return sitem.id == item.workPlanId
      })
      // 清除当前窗口OKR缓存数据
    }
    if (_index >= 0) {
      state.tabList.splice(_index, 1)
    }
    const findTab = state.tabList.filter((tab: any) => tab.active == true)
    // 删除当前选中标签后重新选中其他标签
    const defSel = state.tabList[0]
    if (findTab.length == 0 && defSel) {
      defSel.active = true
      queryDetail({ item: defSel })
    }
    // setNewTitle({ nowTab: { ...defSel }, otherState: { tabList: [...state.tabList] } })
    $store.dispatch({ type: 'OKRWINDOWINFO', data: { tabsList: [...state.tabList] } })
    setState({ ...state, tabList: [...state.tabList] })
    // 删除唯一标签后关闭窗口
    if (state.tabList.length == 0) {
      ipcRenderer.send('close_okrDetailWindow')
      return
    }
  }
  /**
   * 头部单个标签组件
   */
  const TabItem = ({ item, index, totalTab }: { item: any; index: number; totalTab: number }) => {
    let typeTxt = ''
    let typeClass = ''
    if (item.ascriptionType === 0) {
      typeTxt = `【${$intl.get('userRank')}】`
    } else if (item.ascriptionType == 3) {
      typeTxt = `【${$intl.get('deptRank')}】`
      typeClass = 'yes_disb'
    } else if (item.ascriptionType == 2) {
      typeTxt = `【${$intl.get('cmyRank')}】`
      typeClass = 'part_disb'
    } else {
      typeClass = 'none'
    }
    return (
      // maxWidth:按个数平分（减去所有右键距）
      <li
        className={`planTabItem ${item.active ? 'active' : ''}`}
        style={{ maxWidth: 100 / totalTab - 1 + '%' }}
        onClick={() => {
          state.tabList.map((tab: any) => {
            if (item.findId == tab.findId) {
              tab.active = true
            } else {
              tab.active = false
            }
          })
          setNewTitle({ nowTab: { ...item }, otherState: { tabList: [...state.tabList] } })
          queryDetail({
            item,
          })
        }}
      >
        <span className={`plan_tab_type ${typeClass}`}>{typeTxt}</span>
        <Tooltip title={item.name}>
          <span className="plan_name">{item.name}</span>
        </Tooltip>
        <em
          className="img_icon tab_del_icon"
          onClick={(ev: any) => {
            ev.stopPropagation()
            delTab({ index, item })
          }}
        ></em>
      </li>
    )
  }

  return (
    <div className="okrDetailWindowTitle">
      <header>
        <div className="headerLeft">
          <div className="org_name text-ellipsis">{state.teamName}</div>
          <ul className={`planTabBox flex center-v`}>
            {state.tabList.map((item: any, i: number) => {
              return <TabItem key={i} item={item} index={i} totalTab={state.tabList.length} />
            })}
          </ul>
        </div>
      </header>
    </div>
  )
})
export default OkrDetailWindow
