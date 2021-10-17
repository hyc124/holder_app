import React, { useEffect, useState, useReducer, useRef, useImperativeHandle } from 'react'
import { Tabs, Button } from 'antd'
import { getMainData } from '../getfourData'
import { getDistribute } from '../../workplan/addplanfu'
import $c from 'classnames'
import TableList from '../TableList'
import InfiniteScroll from 'react-infinite-scroller'
const getTableList = {
  onePartList: {
    dataList: [],
    distribute: 0,
    key: 'oneTab',
  },
}
const { TabPane } = Tabs
const reducer = (state: any, action: { type: any; data: any }) => {
  switch (action.type) {
    //待处理
    case '1':
      return { ...state, onePartList: action.data }
    default:
      return state
  }
}
const oneQuadrant = React.forwardRef((props: any, ref) => {
  // 表格刷新数据
  const tableRef = useRef<any>(null)
  const { initStates, action } = props
  const [getStates, setGetData] = useState({
    status: false,
    id: 0,
    typeId: 0,
    nowWeekStart: '',
    nowWeekEnd: '',
    dataList: [],
    personAuth: false,
  })
  const [state, dispatch] = useReducer(reducer, getTableList)
  const [activePage, setActivePage] = useState(false)
  useEffect(() => {
    if (props.getState.id) {
      initStates.pageId = ''
      setGetData(props.getState)
      getNowData(props.getState)
    }
  }, [props.getState])
  useEffect(() => {
    if (initStates.mainId) {
      if (activePage) {
        setActivePage(false)
      }
    }
  }, [initStates.mainId])
  const getNowData = (data?: any) => {
    if (data && !data.id) {
      dispatch({
        type: '1',
        data: {
          dataList: [],
          distribute: 0,
          key: 'oneTab',
        },
      })
      return
    }
    getMainData(
      data.mainId,
      data ? data.id : getStates.id,
      data ? data.typeId : getStates.typeId,
      activePage && !initStates.pageId ? 20 : initStates.pageSize,
      initStates.pageId,
      data ? data.nowWeekStart : getStates.nowWeekStart,
      data ? data.nowWeekEnd : getStates.nowWeekEnd,
      -1,
      props.getState.planStateArr
    ).then((resData: any) => {
      if (resData.dataList.length == 0 && initStates.pageId) {
        return false
      }
      if (initStates.pageId) {
        resData.dataList = state.onePartList.dataList.concat(resData.dataList)
      }
      dispatch({
        type: '1',
        data: {
          dataList: resData.dataList,
          distribute: 0,
          key: 'oneTab',
        },
      })
    })
  }
  //滚动加载
  const srcollAllMenu = () => {
    let page = {
      typeId: '',
    }
    page = state.onePartList.dataList[state.onePartList.dataList.length - 1]
    if (page && page.typeId) {
      initStates.pageId = page.typeId
      getNowData()
    }
  }
  //父级控制子级刷新
  useImperativeHandle(ref, () => ({
    tableFresh: (value: number, data: any) => {
      if (value == 26 || value == 27 || value == 28 || value == 29 || value == 30 || value == 31) {
        //26--关注 27--名字修改   28--进度  29--更改责任人  30-创建任务
        if (tableRef.current) {
          tableRef.current.refreshBtnTable(value, data)
        } else if (value == 31) {
          dispatch({
            type: '1',
            data: {
              dataList: [data.taskName],
              distribute: 0,
              key: 'oneTab',
            },
          })
        }
      } else if (tableRef.current) {
        tableRef.current.refreshTable(value, data)
      } else if (value == 25 && !tableRef.current) {
        dispatch({
          type: '1',
          data: {
            dataList: [data.taskName],
            distribute: 0,
            key: 'oneTab',
          },
        })
      }
    },
  }))
  const deletTable = () => {
    dispatch({
      type: '1',
      data: {
        dataList: [],
        distribute: 0,
        key: 'oneTab',
      },
    })
  }
  return (
    <Tabs
      key="1"
      className={`quadrant-part part-now-week ${activePage ? 'maxpage' : ''}`}
      data-type={1}
      renderTabBar={() => (
        <div className="flex center-v quadrant-header">
          <div className="quadrant-header-title">
            <h3>{$intl.get('taskWeek')}</h3>
            <h5
              data-start={getStates.nowWeekStart}
              data-end={getStates.nowWeekEnd}
              style={{ marginTop: '6px' }}
            >
              {$intl.get('MondayToSunday')}
            </h5>
          </div>
          <div className="module-btn-display">
            <span
              className={`icon_part_page ${activePage ? 'maxpage' : ''}`}
              onClick={e => {
                e.stopPropagation()
                if (!activePage && state.onePartList.dataList.length <= 10) {
                  srcollAllMenu()
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
            {state.onePartList.dataList.length > 0 && (
              <Button
                className="quadrant-header-btn creat_task_btn"
                style={getStates.status || getStates.personAuth ? { display: 'none' } : {}}
                onClick={(e: any) => {
                  e.stopPropagation()
                  action.createKRhtml('1')
                }}
              >
                <i></i>
                {$intl.get('createTask')}
              </Button>
            )}
            {state.onePartList.distribute > 0 && (
              <Button
                className="quadrant-header-btn quadrant-btn-send"
                style={getStates.status || getStates.personAuth ? { display: 'none' } : {}}
                onClick={() => {
                  const arrData: Array<number> = []
                  state.onePartList.dataList.forEach((index: any) => {
                    arrData.push(index.typeId)
                  })
                  getDistribute({
                    mainId: initStates.mainId, //根节点id
                    operateUser: $store.getState().nowUserId, //操作人Id
                    operateAccount: $store.getState().nowAccount, //操作人帐号
                    teamId: initStates.createPlan.enterpriseId,
                    teamName: initStates.createPlan.enterpriseName,
                    typeIds: arrData, //单点派发集合
                    isWhole: 1, //1象限派发 0选择派发
                  }).then((resData: any) => {
                    if (resData.returnCode === 0) {
                      action.refreshTask(1)
                    }
                  })
                }}
              >
                <i></i>
                {$intl.get('distributeTask') + '(' + state.onePartList.distribute + ')'}
              </Button>
            )}
          </div>
        </div>
      )}
      draggable={'false'}
    >
      <TabPane className={$c({ 'module-none-padding': false })}>
        <div className="module-content part-now-week-content">
          <div className="table-responsive taskListBox quadrantBordData" data-type="1">
            <div className="task-list">
              {state.onePartList.dataList.length === 0 && (
                <div
                  className="show_none_data_container flex center column"
                  style={{ height: '100%', paddingTop: '26px' }}
                >
                  <img src={$tools.asAssetsPath('/images/workplan/none-norm_1.png')} />
                  <div className="text_name">{$intl.get('importantThingTip')}</div>
                  <div className="none_data_btn">
                    {($store.getState().fromPlanTotype.createType === 1 || getStates.id) &&
                    !getStates.status &&
                    !getStates.personAuth ? (
                      <Button
                        onClick={() => {
                          action.createKRhtml('1')
                        }}
                      >
                        {$intl.get('createTask')}
                      </Button>
                    ) : (
                      <Button disabled>{$intl.get('createTask')}</Button>
                    )}
                  </div>
                </div>
              )}
              {state.onePartList.dataList.length > 0 && (
                <InfiniteScroll
                  initialLoad={false} // 不让它进入直接加载
                  pageStart={0} // 设置初始化请求的页数
                  hasMore={true} // 是否继续监听滚动事件 true 监听 | false 不再监听
                  loadMore={() => srcollAllMenu()} // 监听的ajax请求
                  useWindow={false} // 不监听 window 滚动条
                  threshold={10}
                >
                  <TableList
                    TaskData={state.onePartList.dataList}
                    mainData={{
                      mainId: initStates.mainId,
                      personAuth: getStates.dataList,
                      parentId: getStates.id,
                      type: '1',
                      scorRegular: initStates.scorRegular,
                    }}
                    nonedeletTable={deletTable}
                    getstatus={getStates}
                    refreshTask={action.refreshTask}
                    createKRhtml={action.createKRhtml}
                    ref={tableRef}
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
export default oneQuadrant
