import React, { useEffect, useState, useReducer, useRef, useImperativeHandle } from 'react'
import { getSubLateCount, periodGetList, selectDateDisplay } from '../getfourData'
import { Tabs, Button, Dropdown } from 'antd'
import $c from 'classnames'
import TableList from '../TableList'
import InfiniteScroll from 'react-infinite-scroller'
import GetSingleData from '../GetSingleData'
import { ipcRenderer } from 'electron'
let getTableList = {
  twoPartList: {
    dataList: [],
    distribute: 0,
    key: 'oneTab',
  },
}
const { TabPane } = Tabs
const reducer = (state: any, action: { type: any; data: any }) => {
  switch (action.type) {
    //待处理
    case '2':
      return { ...state, twoPartList: action.data }
    default:
      return state
  }
}
let tableRef: any = null
const twoQuadrant = React.forwardRef((props: any, ref) => {
  // 表格刷新数据
  tableRef = useRef<any>(null)
  const { action, sourceFrom, useModule } = props
  const [initStates, setInitData] = useState({
    mainId: '',
    createPlan: {
      type: 2,
      endTime: '',
      id: 0,
      name: '',
      liableUsername: '',
      liableUserProfile: '',
      liableUser: 0,
      startTime: '',
      typeId: '',
      process: 0,
      mainId: '',
      ascriptionId: 0,
      enterpriseId: 0,
      score: 0,
      period: {},
    },
    scorRegular: 0,
    periodList: [],
    nowHository: 0,
    end: '',
    start: '',
    allLateNum: 0,
  }) //用来存储编辑后的数据
  const [getStates, setGetData] = useState({
    status: false,
    id: 0,
    typeId: 0,
    dataList: [],
    personAuth: false,
    planStateArr: '',
  })
  const [activePage, setActivePage] = useState(false)
  //设置创建KR，任务展示
  // const [stepCreate, setstepCreate] = useState(false)
  let isUnmounted = false
  // 监听进展汇报状态，刷新页面数据
  useEffect(() => {
    ipcRenderer.on('refresh_operated_task', (_: any, data: any) => {
      const { taskIds } = data.data
      if (!taskIds) return
      tableRef &&
        tableRef.current &&
        tableRef.current.refreshQuadrantTableData({
          taskIds: [...taskIds],
          optType: 'updateProgressStatus',
        })
    })
    return () => {
      getTableList = {
        twoPartList: {
          dataList: [],
          distribute: 0,
          key: 'oneTab',
        },
      }
      tableRef = null
      isUnmounted = true
    }
  }, [])

  useEffect(() => {
    isUnmounted = false
    if (props.initState.start) {
      dispatch({
        type: '2',
        data: {
          dataList: props.tableDataList.dataList,
          distribute: props.tableDataList.distribute || 0,
          key: 'oneTab',
        },
      })
      setInitData(props.initState)
      setGetData(props.getState)
    }
  }, [props.getState, props.tableDataList])
  //更改数据重新加载 1--界面数据增加更新
  const [state, dispatch] = useReducer(reducer, getTableList)
  //请求界面数据
  //滚动加载
  const srcollAllMenu = (status: number, type: string) => {
    let page = {
      typeId: '',
    }
    page = state.twoPartList.dataList[state.twoPartList.dataList.length - 1]
    const planStateArr = getStates.planStateArr
    if (page && page.typeId && planStateArr.length != 3) {
      action.changeData(status, type, page.typeId)
    }
  }
  const changeInitData = (data: any, type?: string) => {
    if (type == 'score') {
      initStates.createPlan.score = data
    } else if (type == 'date') {
      selectDateDisplay().then((res: any) => {
        initStates.nowHository = res.data.isClosed
        periodGetList({
          numDisplay: res.data.isClosed,
          id: initStates.createPlan.enterpriseId,
        }).then((res: any) => {
          if (!isUnmounted) {
            initStates.periodList = res.dataList
            setInitData({ ...initStates })
            // 款详情模式下 更新O状态数据，刷新左侧列表
          }
        })
      })
    } else {
      initStates.createPlan = data
    }
    setInitData({ ...initStates })
  }
  //父级控制子级刷新
  useImperativeHandle(ref, () => ({
    tableFresh: (value: number, data: any) => {
      if (value == 16) {
        tableRef.current.refreshQuadrantTableData({
          taskIds: data.nowData,
          optType: 'changePosition',
          newChildId: data.moveData,
        })
      } else if (value == 100 && data.type == 2) {
        initStates.createPlan = data
        setInitData({ ...initStates })
      } else {
        if (value == 26 || value == 27 || value == 28 || value == 29 || value == 30) {
          //26--关注 27--名字修改   28--进度  29--更改责任人  30-创建任务  31-kr创建任务
          if (value == 29 && data.taskName.type == 2) {
            changeInitData(data.taskName)
          } else if (tableRef.current) {
            tableRef.current.refreshBtnTable(value, data)
          } else {
            deletTable([data.taskName])
          }
        } else if (tableRef.current) {
          tableRef.current.refreshTable(value, data)
        } else if (value == 25 && !tableRef.current) {
          dispatch({
            type: '2',
            data: {
              dataList: [data.taskName],
              distribute: 0,
              key: 'oneTab',
            },
          })
        }
      }
    },
    //更新O的延迟统计
    chnageLateNum: () => {
      getSubLateCount(Number(getStates.id)).then((res: any) => {
        if (!isUnmounted) {
          initStates.allLateNum = res.data
          setInitData({ ...initStates })
        }
      })
    },
  }))
  const deletTable = (value?: any) => {
    action.changeData(114, value || [], 'delete')
  }
  const gtecreateKRhtml = (val: string, num: number) => {
    if (val == '2') {
      action.createKRhtml(val, num)
    } else {
      action.refreshTask(8, getStates)
    }
  }
  // {/* createType == 0：创建目标时，只显示okr当前状态 */}
  const createType = $store.getState().fromPlanTotype.createType
  return (
    <Tabs
      key="2"
      className={`quadrant-part part-now-status ${activePage ? 'maxpage' : ''} ${
        createType == 0 ? 'maxpage' : ''
      }`}
      data-type={2}
      renderTabBar={() => (
        <>
          <div className="flex center-v quadrant-header">
            <div className="quadrant-header-title">
              <h3>{$intl.get('statusOKR')}</h3>
            </div>
            <div className="quadrant-header-learn">
              <Button
                className="quadrant-header-okr"
                style={{ height: '22px', lineHeight: '22px' }}
                onClick={(e: any) => {
                  e.stopPropagation()
                  const { shell } = require('electron')
                  shell.openExternal('http://goalgo.cn/page-okr/okr.html?type=NaN')
                }}
              >
                {$intl.get('findOutOKR')}
                <i className="quadrant-btn-right"></i>
              </Button>
              <Dropdown
                className="quadrant-header-btn add_okr_dif"
                overlay={
                  <ul
                    style={{ left: '-10px' }}
                    className="quadrant-btn-list add_okr_dif_list"
                    // onMouseLeave={() => {
                    //   setstepCreate(false)
                    // }}
                  >
                    <li key="1" className="quadrant-btn-add">
                      <Button
                        onClick={(e: any) => {
                          e.stopPropagation()
                          action.createKRhtml('2', 3)
                        }}
                      >
                        <i></i>
                        {$intl.get('keyResult')}
                      </Button>
                    </li>
                    <li key="2" className="quadrant-btn-add">
                      <Button
                        onClick={(e: any) => {
                          e.stopPropagation()
                          action.createKRhtml('2', 1)
                        }}
                      >
                        <i></i>
                        {$intl.get('createTask')}
                      </Button>
                    </li>
                    <li key="3" className="quadrant-relate-btn" style={{ minWidth: '110px', height: '34px' }}>
                      <Button
                        onClick={(e: any) => {
                          e.stopPropagation()
                          action.refreshTask(8, getStates)
                        }}
                      >
                        <i></i>
                        {$intl.get('relateTask')}
                      </Button>
                    </li>
                  </ul>
                }
                // onMouseOver={() => {
                //   if (getStates.status || getStates.personAuth) {
                //     return false
                //   }
                //   setstepCreate(true)
                // }}
              >
                <div
                  style={
                    getStates.status
                      ? { display: 'none', height: '22px' }
                      : { height: '22px', lineHeight: '22px', margin: '0 12px' }
                  }
                >
                  <i></i>
                  <span>{$intl.get('createKR')}</span>
                </div>
              </Dropdown>
              <span
                className={`icon_part_page ${activePage ? 'maxpage' : ''}`}
                onClick={e => {
                  e.stopPropagation()
                  if (!activePage) {
                    srcollAllMenu(-1, '2')
                  }
                  setActivePage(!activePage)
                  // 全屏时设置不可滚动
                  const boxDom: any = $(e.currentTarget).parents('.fourQuadrant')
                  if (!activePage) {
                    boxDom.addClass('hasMaxPage').animate({ scrollTop: 0 }, 0)
                  } else {
                    boxDom.removeClass('hasMaxPage')
                  }
                }}
              >
                {activePage ? $intl.get('smallScreen') : $intl.get('bigScreen')}
              </span>
            </div>
          </div>
          <div className="quadrant-create">
            <GetSingleData
              sourceFrom={sourceFrom}
              data={initStates.createPlan}
              periodList={initStates.periodList}
              nowHository={initStates.nowHository}
              mainId={initStates.mainId}
              status={getStates.status}
              allLateNum={initStates.allLateNum}
              personAuth={getStates.personAuth}
              refreshTask={action.refreshTask}
              changeData={changeInitData}
              createKRhtml={gtecreateKRhtml}
            />
          </div>
        </>
      )}
      draggable={'false'}
    >
      <TabPane className={$c({ 'module-none-padding': false })}>
        <div className="module-content part-now-status-content">
          <div className="table-responsive taskListBox quadrantBordData 0000" data-type="2">
            <div className="task-list">
              {state.twoPartList.dataList.length == 0 && (
                <div className="show_none_data_container flex center column" style={{ height: '100%' }}>
                  <img src={$tools.asAssetsPath('/images/workplan/none-norm_2.png')} />
                  <div className="text_name" style={{ marginTop: '-4px' }}>
                    {$intl.get('setKeyResMsg')}
                  </div>
                  <div className="none_data_btn">
                    {($store.getState().fromPlanTotype.createType === 1 || getStates.id) &&
                    !getStates.status &&
                    !getStates.personAuth ? (
                      <Button onClick={() => action.createKRhtml('2')}>{$intl.get('keyResult')}</Button>
                    ) : (
                      <Button disabled>{$intl.get('keyResult')}</Button>
                    )}
                  </div>
                </div>
              )}
              {state.twoPartList.dataList.length > 0 && (
                <InfiniteScroll
                  initialLoad={false} // 不让它进入直接加载
                  pageStart={0} // 设置初始化请求的页数
                  hasMore={true} // 是否继续监听滚动事件 true 监听 | false 不再监听
                  loadMore={(page: number) => srcollAllMenu(-1, '2')} // 监听的ajax请求
                  useWindow={false} // 不监听 window 滚动条
                  threshold={10}
                >
                  <TableList
                    TaskData={state.twoPartList.dataList} //表格数据传入
                    useModule={useModule}
                    nonedeletTable={deletTable}
                    mainData={{
                      mainId: initStates.mainId, //项目O的mainId
                      personAuth: getStates.dataList, //权限操作限制
                      parentId: getStates.id, //项目O的id
                      parentTypeId: getStates.typeId, //项目O的typeId
                      endTime: initStates.createPlan.endTime,
                      type: '2',
                      scorRegular: initStates.scorRegular,
                      setMenuChange: changeInitData,
                    }}
                    getstatus={getStates}
                    refreshTask={action.refreshTask}
                    setChooseData={action.setChooseData}
                    createKRhtml={action.createKRhtml}
                    ref={tableRef}
                    sourceFrom={sourceFrom}
                  />
                </InfiniteScroll>
              )}
            </div>
          </div>
        </div>
      </TabPane>
    </Tabs>
  )
})
export default twoQuadrant
