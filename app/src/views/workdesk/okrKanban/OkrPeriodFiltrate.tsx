import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  useContext,
} from 'react'
import '../okrKanban/oMenulist.less'
import { periodGetList, selectDateDisplay } from '../../fourQuadrant/getfourData'
import { getTreeParam } from '@/src/common/js/tree-com'
import { Avatar, Dropdown, Tag, Tooltip } from 'antd'
import { okrUpdateRefDataFn } from '../okrKanban/okrKanban'
import { useSelector } from 'react-redux'
import { OkrDateModule } from '@/src/components/okrDate/okrDate'
import moment from 'moment'
import { ipcRenderer } from 'electron'
import { workDeskContext } from '../../myWorkDesk/workDeskModules'
// import { remberPeriodApi } from '../../task/OKRDetails/okrDetailApi'
let isReflist = false
let upperiodStat: any = null
export const upperiodStatFn = () => {
  upperiodStat()
}

// 周期列表全局数据缓存
const periodsList: any = {}
const setKeyPeriodsList = ({ codeKey, newPeriodList }: any) => {
  periodsList[codeKey] = newPeriodList
}
//
let refreshTimer: any = null
const OkrPeriodFiltrate = forwardRef((poprs: any, ref) => {
  // 是否关注人工作台
  const isFollow = poprs.isFollow
  const codeKey = isFollow ? 'isFollow' : 'isMy'
  const [periodList, setPeriodList] = useState(poprs.periodList || [])
  //筛选参数
  // const queryParams = useSelector((state: any) => state.targetKanbanParams)
  const queryParams = useSelector((state: any) => state.selectTeam)
  let { filterMoules } = poprs
  const { periodEnable } = poprs
  filterMoules = JSON.stringify(filterMoules) || {}
  //滚动周期选中
  const [activeID, setActiveID] = useState()
  const refComplete = useRef(null)
  const [tmpStyle, setTmpStyle] = useState<any>({})
  //设置下拉选中
  const [periodItem, setperiodItems] = useState<any>({})
  //历史周期展示
  const [nowHository, setnowHository] = useState<any>(1)
  const workokrTreeId = $store.getState().workokrTreeId
  const selectTeamId = $store.getState().selectTeamName
  const selectTeam: any = $store.getState().selectTeam
  // console.log($store.getState())

  const historyPeriodId = $store.getState().okrPeriodFilter.periodId
  // 单个周期块长度
  const _itemW = 160
  // const [LeftNext, setLeftNext] = useState(false) //左侧控制置灰
  // const [RightNext, setRightNext] = useState(false) //右侧控制置灰
  const { updatePeriod, getDeskModule } = useContext(workDeskContext) as any

  // state
  const [state, setState] = useState({
    periodEnable: true,
    LeftNext: false,
    RightNext: false,
  })
  /**
   * 设置周期列表数据状态(包含全局数据)
   */
  const setPeriodsList = (newPeriodList: any) => {
    // console.log('isFollow:', isFollow, 'codeKey:', codeKey)
    setKeyPeriodsList({ codeKey, newPeriodList })
    // console.log(periodsList[codeKey])
    setPeriodList(periodsList[codeKey])
  }
  const setperiodItem = (item: any) => {
    setperiodItems(item)
  }

  useLayoutEffect(() => {
    setTmpStyle({ width: `${_itemW}px` })
  }, [refComplete.current])

  useEffect(() => {
    ipcRenderer.on('refresh_period_single_totals', (_: any, data: any) => {
      if (data) {
        refreshTimer && clearTimeout(refreshTimer)
        refreshTimer = setTimeout(() => {
          refreshPeriodList(data)
        }, 100)
      }
    })
    return () => {
      periodsList[codeKey] = []
      refreshTimer = null
    }
  }, [])

  useEffect(() => {
    initData()
    isReflist = true
    $('.periodFilter_slide ul').css({ left: '0px' })
  }, [selectTeamId, workokrTreeId])

  //工作台切换全屏小屏周期不变
  useEffect(() => {
    if (!isReflist) {
      refokrlist(historyPeriodId)
    }
    isReflist = false
  }, [queryParams])

  //更新统计数据
  upperiodStat = () => {
    initData('stat')
  }

  //查询状态
  const getZone = () => {
    const val = $('.workPlanListNav li.active').attr('data-type')
    return val
  }

  useEffect(() => {
    const newState = { ...state }
    // console.log('传入----', poprs.periodList, poprs.filterMoules)
    if (poprs.periodList && poprs.periodList.length != 0) {
      setPeriodsList(poprs.periodList)
      $store.dispatch({ type: 'OKRPERIODLIST', data: periodList || [] })
      setTimeListFn(poprs.periodList || [])
      newState.LeftNext = false
      newState.RightNext = false
      // okr是否开启
      if (periodEnable !== undefined) {
        newState.periodEnable = periodEnable
      }
      setState(newState)
    }

    if (poprs.filterMoules) {
      const num = poprs.filterMoules?.nowHository ? 1 : 0
      setnowHository(num)
    }
  }, [poprs.periodList, filterMoules])

  useEffect(() => {
    // okr是否开启
    if (periodEnable !== undefined) {
      setState({ ...state, periodEnable })
    }
  }, [periodEnable])

  useImperativeHandle(ref, () => ({
    // 外部调用刷新数据
    refreshOkrPeriodList: refreshPeriodList,
  }))
  // 更新当前周期数据
  const refreshPeriodList = ({ optType, periodIds, periodIdNum }: any) => {
    console.log('refreshPeriodList====================')
    if (periodsList[codeKey].length == 0) return

    let cmyId: any = ''
    let mySelf: any = '0'
    let ascriptionId: any = ''
    let ascriptionType: any = ''
    let status: any = []
    let loginUser: any
    if (poprs.from == 'okr_module') {
      //okr列表
      cmyId = getTreeParam($store.getState().workokrTreeId).cmyId
      if (poprs.isMyPlan) {
        mySelf = getZone()
        ascriptionType = ''
        ascriptionId = ''
      } else {
        const treeInfo = getTreeParam($store.getState().workokrTreeId)
        mySelf = '0'
        ascriptionId = treeInfo.curId
        ascriptionType = treeInfo.curType
      }
    } else if (poprs.from == 'okr_workbench') {
      //工作台
      cmyId = $store.getState().selectTeamId
      mySelf = '1'
      ascriptionType = '0'
      ascriptionId = isFollow ? $store.getState().followUserInfo.userId : $store.getState().nowUserId
      status = [1, 2, 3, 4]
      if (isFollow) loginUser = $store.getState().followUserInfo.userId
    }
    periodGetList({
      numDisplay: nowHository,
      id: cmyId,
      mySelf,
      ascriptionId,
      ascriptionType,
      status,
      loginUser,
    }).then((res: any) => {
      if (res.returnCode == 0) {
        const dataList = res.dataList || []
        console.log('外部调用刷新----', dataList)
        setPeriodsList([...dataList])
      }
    })
  }

  //查询周期
  const initData = (type?: any) => {
    let cmyId: any = ''
    let mySelf: any = '0'
    let ascriptionId: any = ''
    let ascriptionType: any = ''
    let status: any = []
    let loginUser: any
    // console.log('okrPeriod init------------------:')
    if (poprs.from == 'okr_module') {
      //okr列表
      cmyId = getTreeParam($store.getState().workokrTreeId).cmyId
      if (poprs.isMyPlan) {
        mySelf = getZone()
        ascriptionType = ''
        ascriptionId = ''
      } else {
        const treeInfo = getTreeParam($store.getState().workokrTreeId)
        mySelf = '0'
        ascriptionId = treeInfo.curId
        ascriptionType = treeInfo.curType
      }
    } else if (poprs.from == 'okr_workbench') {
      //工作台
      cmyId = $store.getState().selectTeamId
      mySelf = '1'
      ascriptionType = '0'
      ascriptionId = isFollow ? $store.getState().followUserInfo.userId : $store.getState().nowUserId
      status = [1, 2, 3, 4]
      if (isFollow) {
        loginUser = $store.getState().followUserInfo.userId
      }
    }
    if (!poprs.periodList || type == 'stat') {
      selectDateDisplay().then((res: any) => {
        // setnowHository(res.data.isClosed ? true : false)
        setnowHository(res.data.isClosed)
        periodGetList({
          numDisplay: res.data.isClosed,
          id: cmyId,
          mySelf,
          ascriptionId,
          ascriptionType,
          status,
          loginUser,
        }).then((res: any) => {
          if (res.returnCode == 0) {
            // 是否开启了周期
            if (res.data) {
              setState({
                ...state,
                LeftNext: false,
                RightNext: false,
                periodEnable: res.data === false ? false : true,
              })
              // console.log('init查询周期----', res.dataList)
              setPeriodsList(res.dataList || [])
              $store.dispatch({ type: 'OKRPERIODLIST', data: res.dataList || [] })
              setTimeListFn(res.dataList || [], type, res.data === false ? false : true)
              // 根据权限控制创建目标按钮是否屏蔽
              $('.workdesk-header-right .create_object_btn').show()
            } else {
              $store.dispatch({ type: 'OKRPERIODLIST', data: [] })
              setState({ ...state, periodEnable: res.data === false ? false : true })
              // 设置okr是否开启全局变量
              $store.dispatch({
                type: 'OKRPERIODFILTER',
                data: { periodEnable: res.data === false ? false : true },
              })
              // 根据权限控制创建目标按钮是否屏蔽
              $('.workdesk-header-right .create_object_btn').hide()
            }
          } else {
            console.log('periodGetList error')
            $store.dispatch({ type: 'OKRPERIODLIST', data: [] })
            setState({ ...state, periodEnable: false })
            // 设置okr是否开启全局变量
            $store.dispatch({
              type: 'OKRPERIODFILTER',
              data: { periodEnable: false },
            })
            // 根据权限控制创建目标按钮是否屏蔽
            $('.workdesk-header-right .create_object_btn').hide()
          }
        })
      })
    }
  }
  //设置默认显示周期
  const setTimeListFn = (dataList: any, type?: any, periodEnable?: boolean) => {
    const obj: any = []
    // let num: number = 0
    dataList.map((item: any, index: number) => {
      if (!obj[item.startYear]) {
        // num++
        obj[item.startYear] = [item]
      } else {
        obj[item.startYear].push(item)
      }
      if (item.startYear != item.endYear) {
        if (!obj[item.endYear]) {
          // num++
          obj[item.endYear] = [item]
        } else {
          obj[item.endYear].push(item)
        }
      }
    })
    //默认显示的具体周期时间段
    setdefaultTimes(dataList, poprs.periodItem || {}, type, periodEnable)
  }
  //设置默认具体周期时间段
  const setdefaultTimes = (dataList: any, _period: any, type?: any, periodEnable?: boolean) => {
    // let data: any = new Date()
    // let _period: any = {}
    if (dataList.length > 0) {
      // for (let i = 0; i <= dataList.length; i++) {
      //   if (Date.parse(data) <= Date.parse(dataList[i].endTime)) {
      //     _period = dataList[i]
      //     break
      //   }
      // }
      let filterObj: any = {}
      if (JSON.stringify(_period) == '{}') {
        // 获取默认选中
        const selectItem = dataList.filter((item: any) => {
          return item.isSelected == true
        })
        // 获取上次记住的周期
        const itemRember = dataList.filter((item: any) => {
          return item.isRemember == 1
        })

        // 优先选取上次记住周期，否则选默认
        const itemSelected: any = itemRember.length > 0 ? itemRember : selectItem
        // 改变是否显示历史周期时，记住新选中的周期
        // if (type == 'stat') {
        //   remberPeriodApi({
        //     okrPeriodId: itemSelected[0].periodId,
        //     ascriptionId: $store.getState().selectTeamId,
        //   })
        // }
        // console.log('itemRember:', itemRember)
        setActiveID(itemSelected[0].periodId)
        setperiodItem(itemSelected[0])
        filterObj = itemSelected[0] || {}
        filterObj.periodEnable = periodEnable
        $store.dispatch({ type: 'OKRPERIODFILTER', data: filterObj })
        //更新OKR列表
        refokrlist(itemSelected[0].periodId)
        const _index = dataList.findIndex((item: any) => {
          return itemSelected[0].periodId == item.periodId
        })
        setScrollPosition(itemSelected[0].periodId, _index)
      } else {
        setActiveID(_period.periodId)
        setperiodItem(_period)
        filterObj = _period || {}
        filterObj.periodEnable = periodEnable
        $store.dispatch({ type: 'OKRPERIODFILTER', data: filterObj })
        //更新OKR列表
        refokrlist(_period.periodId)
        const _index = dataList.findIndex((item: any) => {
          return _period.periodId == item.periodId
        })
        setTimeout(() => {
          setScrollPosition(_period.periodId, _index)
        }, 500)
      }
    }
  }
  //设置时间周期
  const savePeriod = (item: any) => {
    const { okrPeriodFilter } = $store.getState()
    $store.dispatch({ type: 'OKRPERIODFILTER', data: { ...item, periodEnable: okrPeriodFilter.periodEnable } })
    if (poprs.periodIChange) {
      poprs.periodIChange(item)
    }
    // 更新当前选择周期类型
    setperiodItem(item)

    //更新OKR列表
    refokrlist(item.periodId)
    setActiveID(item.periodId)
    getDeskModule && getDeskModule()
  }
  //设置滚动位置
  const setScrollPosition = (periodId: any, index?: any) => {
    let _index: any = $($(`.periodFilter_slide ul li[data-id=${periodId}]`)).attr('data-index') || 0
    const itemlen = $(`.periodFilter_slide ul li`).length
    // if (index || index == 0) {
    //   _index = index - 1
    // }
    // if (_index == -1 || _index == 1) {
    //   _index = 0
    // }
    // if (itemlen - 1 == Number(_index)) {
    //   _index = Number(_index) - 1
    // }
    if (periodEnable != undefined) {
      state.periodEnable = periodEnable
    }
    if (itemlen == 1) {
      setTmpStyle({ width: `${_itemW}px` })
      setState({ ...state, LeftNext: true, RightNext: true })
      _index = 0
    } else {
      setTmpStyle({ width: `${_itemW}px` })
    }
    const leftN = _itemW * Number(_index)
    $('.periodFilter_slide ul').animate({ left: `${-leftN}px` }, 200)
  }
  //更新列表
  const refokrlist = (periodId: any) => {
    if (poprs.from == 'okr_module') {
      const _filterMoule = JSON.parse(filterMoules)
      if (_filterMoule.planMode == 1) {
        okrUpdateRefDataFn(periodId)
      }
    } else {
      okrUpdateRefDataFn(periodId)
    }
    // console.log('刷新okr列表数据-------2222222222222222')
  }
  //左右滑动
  let leftval: any = 0
  let isclick = true
  const slideFn = (type: string) => {
    leftval = $('.periodFilter_slide ul')[0].offsetLeft || 0
    if (isclick) {
      isclick = false
      const _dom = $('.periodFilter_slide ul')[0]
      const offsetLefts = $('.periodFilter_slide ul')[0].offsetLeft
      const stateSet: any = { ...state }
      if (type == 'left') {
        stateSet.RightNext = false
        if (offsetLefts >= 0) {
          isclick = true
          stateSet.LeftNext = true

          // message.warning('没有更多数据了')
          setState(stateSet)
          return
        } else {
          state.RightNext = false
        }
        leftval += _itemW
        // $('.periodFilter_slide ul').animate({ left: `${leftval}px` }, 200)
        $('.periodFilter_box .go_right')
          .removeClass('disabled')
          .siblings('.periodFilter_slide')
          .children('.periodFilter_slide_ul')
          .animate({ left: `${leftval}px` }, 200)
      } else {
        stateSet.LeftNext = false
        if (leftval <= -(_dom.clientWidth - _itemW)) {
          isclick = true
          stateSet.RightNext = true

          // message.warning('没有更多数据了')
          setState(stateSet)
          return
        } else {
          state.LeftNext = false
        }

        leftval -= _itemW
        // $('.periodFilter_slide ul').animate({ left: `${leftval}px` }, 200)
        $('.periodFilter_box .go_left')
          .removeClass('disabled')
          .siblings('.periodFilter_slide')
          .children('.periodFilter_slide_ul')
          .animate({ left: `${leftval}px` }, 200)
      }
      setTimeout(function() {
        isclick = true
      }, 500) //一秒内不能重复点击
    }
  }

  return (
    <>
      {state.periodEnable ? (
        <>
          {/* {periodList.map((item: any, index: number) => {
            return (
              index < 1 && (
                <div
                  className={`all-period-btn ${activeID == item.periodId ? 'active' : ''}`}
                  data-id={item.periodId}
                  data-index={index}
                  onClick={() => {
                    savePeriod(item)
                  }}
                >
                  {item.periodText}
                </div>
              )
            )
          })} */}
          <div className="periodFilter" ref={refComplete}>
            <div className="periodFilter_content">
              <div className={`periodFilter_box ${activeID == 0 ? 'noCheck' : ''}`}>
                <span
                  className={`${state.LeftNext ? 'disabled' : ''} go_left`}
                  onClick={() => {
                    slideFn('left')
                  }}
                ></span>
                <div className="periodFilter_slide" style={tmpStyle}>
                  <ul className="periodFilter_slide_ul" style={{ width: `${_itemW * periodList.length}px` }}>
                    {periodList.map((item: any, index: any) => {
                      let periodUrl = ''
                      // let periodAvaTxt = ''
                      if (item.periodId) {
                        //具体周期
                        periodUrl = item.profile ? item.profile : ''
                        // periodAvaTxt = item.company
                      } else {
                        //全部周期
                        periodUrl = $tools.asAssetsPath('/images/common/period_all.svg')
                        // selectTeam.id && selectTeam.logo
                        //   ? selectTeam.logo
                        //   : $tools.asAssetsPath('/images/common/period_all.svg')
                        // periodAvaTxt = selectTeam.shortName
                      }
                      return (
                        // index > 0 && (
                        <li
                          className={`${activeID == item.periodId ? 'active' : ''}`}
                          key={item.periodId}
                          data-id={item.periodId}
                          data-index={index}
                          onClick={() => {
                            savePeriod(item)
                          }}
                        >
                          {/* {!selectTeam.id && !item.periodId && (
                            <Avatar
                              size={16}
                              src={item.profile || $tools.asAssetsPath('/images/common/company_default.png')}
                              className="oa-avatar"
                            ></Avatar>
                          )} */}
                          {!item.periodId ? (
                            <Avatar size={16} src={periodUrl} className="oa-avatar">
                              {/* {periodAvaTxt && periodAvaTxt.substr(0, 1)} */}
                            </Avatar>
                          ) : (
                            <Avatar
                              size={16}
                              src={periodUrl || $tools.asAssetsPath('/images/common/company_default.png')}
                              className="oa-avatar"
                            >
                              {/* {periodAvaTxt && periodAvaTxt.substr(0, 1)} */}
                            </Avatar>
                          )}

                          <Tooltip title={`${item.periodText}(${item.count || 0})`}>
                            <span>
                              {`${item.periodText}(${item.count || 0})`}
                              {getPeriodTag(item)}
                            </span>
                          </Tooltip>
                        </li>
                        // )
                      )
                    })}
                  </ul>
                </div>
                <span
                  className={`${state.RightNext ? 'disabled' : ''} go_right`}
                  onClick={() => {
                    slideFn('right')
                  }}
                ></span>
              </div>
              <Dropdown
                overlay={
                  <OkrDateModule
                    periodList={periodList}
                    periodId={periodItem.periodId}
                    nowHository={nowHository}
                    AfterchoseeData={(data: any) => {
                      if (data) {
                        const { okrPeriodFilter } = $store.getState()

                        $store.dispatch({
                          type: 'OKRPERIODFILTER',
                          data: { ...data, periodEnable: okrPeriodFilter.periodEnable },
                        })
                        if (poprs.periodIChange) {
                          poprs.periodIChange(data)
                        }
                        setActiveID(data.periodId)
                        //更新OKR列表
                        refokrlist(data.periodId)
                        setScrollPosition(data.periodId)
                        setperiodItem(data)
                        getDeskModule && getDeskModule()
                      }
                      console.log(data)
                    }}
                    changeListData={(val: any) => {
                      if (val) {
                        if (poprs.setChange) {
                          poprs.setChange(1)
                        } else {
                          initData('stat')
                        }
                      }
                    }}
                  />
                }
                trigger={['click']}
                placement="bottomCenter"
              >
                <span className="periodFilter_more"></span>
              </Dropdown>
            </div>
          </div>
        </>
      ) : (
        ''
      )}
    </>
  )
})
//显示当前
export const getPeriodTag = (val: any) => {
  const tagList: any = []
  const nowDate = moment(new Date()).format('YYYY/MM/DD') + ' 00:00'
  const runTime = Date.parse(nowDate) - Date.parse(val.endTime)
  const startTime = Date.parse(nowDate) - Date.parse(val.startTime)
  let getNOw = false
  if (startTime >= 0 && runTime <= 0) {
    getNOw = true
  }
  // 失效
  if (val.status == 1) {
    tagList.push(<Tag className="invalid_tag">失效</Tag>)
  } else if (getNOw) {
    tagList.push(<Tag>{$intl.get('current')}</Tag>)
  }
  return tagList
}
export default OkrPeriodFiltrate
