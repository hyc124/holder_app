import React, {
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
  useMemo,
} from 'react'
import { useSelector } from 'react-redux'
import './okrKanban.less'
import { OKRTreeApi } from './getData'
import { useReducer } from 'react'
import { Pagination, Spin } from 'antd'
import NoneData from '@/src/components/none-data/none-data'
import WorkPlanMindModal from '@/src/views/work-plan-mind/addPlan'
import { ipcRenderer } from 'electron'
import { getTreeParam } from '@/src/common/js/tree-com'
import { remberPeriodApi } from '../../task/OKRDetails/okrDetailApi'
import { planContext } from '../../okr-four/list-card-four/okr-workplan'
import '@/src/common/js/okrKanban'
import { CreateObjectModal } from '../../task/creatTask/createObjectModal'
import { OkrTableList } from '../../okr-four/okrTableList/okrTableList'
import { queryModuleNum } from '../../myWorkDesk/workDeskModules'
import { getZone } from './common'
import { setOkrHeaderTotalFn } from '../../okr-four/list-card-four/okrHearder'

export interface DataItemProps {
  key: number
  taskName: globalInterface.WorkPlanTaskProps
  liableUser: { name: string; profile: string; type: number }
  progress: { percent: number; type: number; taskStatus: number; status: number; editProcess: boolean }
  subTaskCount: number
  typeId: number
  children: Array<DataItemProps> | any
  showInput: boolean
  showEdit: boolean
  showEditUser: boolean
  showProgress: boolean
  showWeight: boolean
  showScore: boolean
  KRprogress: boolean
  showType?: boolean
  parentId?: any
  hasAuth?: any
  isshowTask?: any
  ratingType?: any
  classline?: any
}

//刷新
let updateRefDatas: any = null
let updateRefDatasFocus: any = null

export const okrUpdateRefDataFn = (periodId: any, type?: string) => {
  if (type == 'focus_okr') {
    updateRefDatasFocus && updateRefDatasFocus()
  } else {
    updateRefDatas && updateRefDatas(periodId)
  }
}

let initStates: any = {
  loading: false,
  pageParams: {
    hasMorePage: true, //是否还有下一页，可滚动加载
    pageNo: 0, //滚动加载的分页
    totalElements: 0, //总页码
    fullPageSize: 10, //每页数量
  },
  filterMoules: null,
  periodId: null,
  datalist: [],
}

// let nameControl = false //判断是全屏状态才刷新

// 局部刷新okr看板
export let refreshOkrKanban: any = null

export const OkrKanban = forwardRef(
  ({ params, okrPeriodFiltrateRef, periodEnable, refreshCode, refresh }: any, ref) => {
    // 创建目标弹框组件
    const createObjectRef = useRef<any>({})
    // 表格组件
    const okrTableRef = useRef<any>({})
    // state 初始化管理
    const reducer = (state: any, action: { type: any; data: any }) => {
      // 多数据合并处理
      if (typeof action.type == 'object') {
        const getState = { ...state }
        action.type.map((item: any) => {
          // item是要更改的参数，getState[item]是获取的state旧值,action.data[item]为新更新的值
          let getArr: any = []
          if (Array.isArray(action.data[item])) {
            getArr = [...action.data[item]]
            getState[item] = getArr
            initStates[item] = getArr
          } else {
            getState[item] = action.data[item]
            initStates[item] = action.data[item]
          }
        })
        return getState
      } else {
        switch (action.type) {
          case 'datalist':
            initStates.datalist = action.data
            return { ...state, datalist: action.data }
          case 'pageParams':
            initStates.pageParams = action.data
            return { ...state, pageParams: action.data }
          case 'loading':
            initStates.loading = action.data
            return { ...state, loading: action.data }
          default:
            return state
        }
      }
    }
    //当前的全屏模式
    // const modulePositon = useSelector((state: any) => state.modulePosition)
    //关注的人窗口的企业
    const followSelectTeadId = useSelector((state: StoreStates) => state.followSelectTeadId)
    //okr列表左侧组织架构
    const workokrTreeId = useSelector((state: StoreStates) => state.workokrTreeId)
    // 获取是否开启okr模块
    const getPeriodEnable = useSelector((state: StoreStates) => state.okrPeriodFilter?.periodEnable)
    //筛选参数
    // const queryParams = useSelector((state: any) => state.targetKanbanParams)
    // 获取当前选择企业信息
    // const queryParams = useSelector((state: any) => state.targetKanbanParams)
    const workDeskelectTeamId = useSelector((state: any) => state.selectTeamId)

    const planContextObj: any = useContext(planContext)
    //moduleType：0 二分配 1：通屏

    const { isFollow, fromType, fromSource } = params
    let { filterMoules } = params
    const { nowUserId, followUserInfo, okrPeriodFilter } = $store.getState()
    initStates.periodId = okrPeriodFilter.periodId
    let selectTeamId = $store.getState().selectTeamId
    //isFollow：是否点击关注窗口
    if (isFollow) {
      selectTeamId = followSelectTeadId
    } else {
      selectTeamId = workDeskelectTeamId
    }

    //全屏状态(true)显示分页
    let isFullScreen = params.isFullScreen
    if (fromSource == 'okr_module') {
      isFullScreen = true
      filterMoules = JSON.stringify(filterMoules)
    }
    initStates.filterMoules = filterMoules

    const [state, dispatch] = useReducer(reducer, { ...initStates })

    const [isShowAddPlan, setIsShowAddPlan] = useState(false)

    useEffect(() => {
      //创建okr刷新工作台tab统计、周期数量
      refreshOkrKanban = (paramObj: any) => {
        const { optType } = paramObj
        initDataTree(initStates.periodId || $store.getState().okrPeriodFilter.periodId)
        // 工作台刷新tab O 统计数量+刷新okr周期列表
        if (optType == 'creatOkr') {
          refreshTotalNums()
        }
      }

      return () => {
        updateRefDatas = null
        updateRefDatasFocus = null
        initStates = {
          loading: false,
          pageParams: {
            hasMorePage: true, //是否还有下一页，可滚动加载
            pageNo: 0, //滚动加载的分页
            totalElements: 0, //总页码
            fullPageSize: 10, //每页数量
          },
          filterMoules: null,
          periodId: null,
          datalist: [],
        }
        refreshOkrKanban = null
      }
    }, [])

    // useEffect(() => {
    //   initStates.datalist = []
    // }, [selectTeamId])

    // 检测 参数变化 、 页码变化、全屏、初始数据
    useEffect(() => {
      initStates.datalist = []
      // 手动刷新走下面的useEffect，不进入初始化方法
      if (refreshCode) {
        return
      }

      initClear()
      initDataTree(initStates.periodId)
      if (fromType == 'okr') {
        ipcRenderer.on('refresh_okrKaban_list', () => {
          const isWorkDesk = $('.side-menu .side-menu-item.active .WorkDesk')
          const _fromKey = $store.getState().mindMapOkrData.fromKey
          if (isWorkDesk.length > 0 && _fromKey == 'okr') {
            params.fromSource = 'okr_workbench'
            initClear()
            const historyPeriodId = $('.periodFilter_slide ul li.active').attr('data-id')
            initDataTree(historyPeriodId)
          }
        })
      }
    }, [selectTeamId, filterMoules, workokrTreeId, fromType])

    // 注意 关注人工作台切换企业刷新

    useEffect(() => {
      if (refreshCode && refreshCode == params.fromType) {
        initClear()
        initDataTree(initStates.periodId)
      }
    }, [refresh])

    if (fromType == 'okr') {
      //根据周期ID刷新界面【21.1.29版本必须根据周期查询】
      updateRefDatas = (periodId: any) => {
        initDataTree(typeof periodId != 'undefined' ? periodId : okrPeriodFilter.periodId)
      }
    }
    if (fromType == 'focus_okr') {
      updateRefDatasFocus = () => {
        initClear()
        initDataTree()
      }
    }

    //清除相关BUG
    const initClear = () => {
      initStates.pageParams.hasMorePage = true
      initStates.pageParams.pageNo = 0
      initStates.pageParams.fullPageSize = 10
    }
    // 检测全屏变化
    // useEffect(() => {
    //   // if (isFullScreen) {
    //   //   nameControl = false
    //   // }
    //   // const dataList: any = jQuery('.left-paine .fullScreen .desk-module-header')
    //   // for (let i = 0; i < dataList.length; i++) {
    //   //   if (dataList[i].dataset && dataList[i].dataset.itemdata) {
    //   //     const nowData = JSON.parse(dataList[i].dataset.itemdata)
    //   //     if (
    //   //       nowData &&
    //   //       nowData.moduleId == modulePositon &&
    //   //       nowData.elementModels &&
    //   //       nowData.elementModels.length > 0
    //   //     ) {
    //   //       nowData.elementModels.map((item: any) => {
    //   //         if (item.elementCode == 'okr') {
    //   //           nameControl = true
    //   //         }
    //   //       })
    //   //     }
    //   //   }
    //   // }
    //   // if (nameControl) {
    //   //   $store.dispatch({
    //   //     type: 'TARGET_KANBAN_QUERY',
    //   //     data: {
    //   //       ...queryParams,
    //   //       ascriptionId: '0',
    //   //       ascriptionType: '0',
    //   //       pageNo: 0,
    //   //       pageSize: 10,
    //   //     },
    //   //   })
    //   // }
    // }, [isFullScreen])

    // 监听是否开启了周期，下面set只是为了让页面刷新一遍以更新缺省图，其他set也可以
    useEffect(() => {
      dispatch({
        type: 'pageParams',
        data: {
          ...initStates.pageParams,
          hasMorePage: true,
          pageNo: 0,
          totalElements: 0,
          fullPageSize: 10,
        },
      })
    }, [getPeriodEnable])

    useLayoutEffect(() => {
      if (fromSource == 'okr_module') {
        // 绑定表格滚动事件
        $('.workPlanCon')
          .off('mousewheel')
          .on('mousewheel', '.okrModuleContainer', (e: any) => {
            // 下滚加载分页
            if (e.originalEvent.wheelDelta <= 0) {
              scrollOnLoad()
            }
          })
      }
      return () => {
        $('.workPlanCon').off('mousewheel')
      }
    }, [])

    /**-
     * 外部调用方法
     */
    useImperativeHandle(ref, () => ({
      refreshTableData: (paramObj: any) => {
        okrTableRef?.current?.refreshTableData?.(paramObj)
      }, //刷新组件内部数据
      // 滚动加载下一页数据
      scrollOnLoadOfOkrKanban: scrollOnLoad,
      // 刷新统计
      refreshTotalNums,
      // 获取当前统计
      getPeriodFilterMoules: () => {
        return filterMoules
      },
    }))
    // 刷新统计
    const refreshTotalNums = () => {
      // 刷新周期统计数量
      refreshPeriodListToal({ periodIds: [] })
      // 更新工作台统计
      fromSource == 'workdesk' && queryModuleNum({ isFollow, updateNum: true })
    }

    // 定义刷新周期统计
    const refreshPeriodListToal = ({ periodIds }: any) => {
      const refreshOkrPeriodListFn: any =
        fromSource == 'workdesk'
          ? (okrPeriodFiltrateRef &&
              okrPeriodFiltrateRef.current &&
              okrPeriodFiltrateRef.current.refreshOkrPeriodList) ||
            null
          : (planContextObj.okrPeriodFiltrateRef && planContextObj.okrPeriodFiltrateRef.refreshOkrPeriodList) ||
            null
      //更新周期统计问题
      refreshOkrPeriodListFn && refreshOkrPeriodListFn({ optType: 'okr_workbench', periodIds })
    }
    /**
     * 滚动加载
     */
    const scrollOnLoad = () => {
      if (!initStates.pageParams.hasMorePage) {
        return
      }
      // 监听表格滚动事件
      const scrollTable = jQuery('.workPlanCon .okrModuleContainer')
      const viewH = scrollTable.height() || 0 //可见高度
      const contentH = scrollTable[0].scrollHeight || 0 //内容高度
      const scrollTop = scrollTable.scrollTop() || 0 //滚动高度
      if (contentH - viewH - scrollTop <= 25) {
        // 防止多次触发，等本次加载完
        initStates.pageParams.hasMorePage = false
        initStates.pageParams.pageNo = ++initStates.pageParams.pageNo
        initDataTree(initStates.periodId, true)
      }
    }

    //初始查询列表
    /**
     *
     * @param periodId 周期id
     * @param scrollLoad 是否滚动加载
     * @returns
     */
    const initDataTree = (periodId?: any, scrollLoad?: boolean) => {
      //必须根据周期查询
      if (typeof periodId == 'undefined' && fromType != 'focus_okr') {
        return
      }
      let nowTeamId = $store.getState().selectTeamId
      //关注的人窗口的企业
      const followSelectTeadId = $store.getState().followSelectTeadId
      if (isFollow) {
        // nowUserId = followUserInfo.userId
        nowTeamId = followSelectTeadId
      }
      dispatch({
        type: 'loading',
        data: true,
      })

      let _ascriptionType: any = selectTeamId && selectTeamId != -1 ? 2 : 0
      let _ascriptionId: any = _ascriptionType == 0 ? nowUserId : selectTeamId
      let _operateUser: any = nowUserId
      let param: any = {}
      if (isFollow) {
        _ascriptionType = 0
        // _ascriptionId = nowUserId
        _ascriptionId = followUserInfo.userId
        param.loginUser = nowUserId
        _operateUser = _ascriptionId
      }
      let url = 'task/work/plan/relation/workbenchOkrList'
      if (scrollLoad) initStates.pageParams.fullPageSize = 10
      param = {
        ...param,
        operateUser: _operateUser,
        pageNo: initStates.pageParams.pageNo || 0,
        pageSize: initStates.pageParams.fullPageSize || 10,
        ascriptionType: _ascriptionType,
        ascriptionId: _ascriptionId,
        teamId: nowTeamId,
        status: [1, 2, 3, 4, 5],
        mySelf: 1, //我负责的
        periodId: periodId, //周期
      }

      if (fromType == 'focus_okr') {
        url = 'task/work/plan/attention/list'
        param = {
          operateUser: isFollow ? $store.getState().followUserInfo.userId : nowUserId,
          pageNo: initStates.pageParams.pageNo || 0,
          pageSize: initStates.pageParams.fullPageSize || 10,
          ascriptionType: 2,
          ascriptionId: nowTeamId,
          teamId: nowTeamId,
          status: [1, 2, 3, 4, 5],
        }
      }
      //okr模块筛选
      if (fromSource == 'okr_module') {
        const treeInfo = getTreeParam($store.getState().workokrTreeId)
        filterMoules = JSON.parse(initStates.filterMoules)
        url = '/task/work/plan/relation/myOkrList'
        param.mySelf = filterMoules.isMyPlan ? getZone() : '0' //1我的负责 3我创建的
        param.ascriptionId = filterMoules.isMyPlan ? '' : treeInfo.curId
        param.ascriptionType = filterMoules.isMyPlan ? '' : treeInfo.curType
        param.teamId = filterMoules.isMyPlan ? '' : treeInfo.cmyId
        // param.status = filterMoules.statusList.length == 0 ? [1, 2, 3, 4, 5] : filterMoules.statusList //筛选状态//新版筛选不需要
        param.sortType = filterMoules.sortType //升序 降序
        param.grades = filterMoules.grades //0:个人级，2：公司级，3.部门级
        param.processStates = filterMoules.processStates //进度状态 0:正常，1：有风险，2：超前，3：延迟
        param.scores = filterMoules.scores //(0.1-0.4)-0;(0.4-0.8)-1;(0.8-1.0)-2
        param.cci = filterMoules.cci //(1-4)-0 (5-8)-1 (9-10)-2
        param.sortField = 1 //创建时间
        param.keyword = filterMoules.searchTexe
        if (!filterMoules.isMyPlan && treeInfo.curType == 0) {
          param.deptId = treeInfo.parentId
          param.roleId = treeInfo.roleId
        }
        param.pageNo = initStates.pageParams.pageNo
        // 滚动加载分页请求
        if (!scrollLoad) {
          initStates.pageParams.hasMorePage = true
        }
      }
      // 记住所选周期
      if (typeof param.periodId != 'undefined' && !scrollLoad) {
        remberPeriodApi({ okrPeriodId: param.periodId, ascriptionId: param.teamId })
      }
      OKRTreeApi(param, url).then((res: any) => {
        if (res.returnCode == 0) {
          // console.log('okr列表数据--------', res)
          const newTableData: Array<DataItemProps> = res.data.content || []
          const objTotal: any = res?.obj || null
          const resTableData: any[] = scrollLoad ? [...initStates.datalist, ...newTableData] : [...newTableData]

          if (scrollLoad) {
            initStates.datalist = [...resTableData]
          } else {
            dispatch({
              type: 'datalist',
              data: [...resTableData],
            })
          }

          const total = (res.data && res.data.totalElements) || 0

          initStates.pageParams.totalElements = total

          // 列表模式下 是否还有分页数据
          if (fromSource == 'okr_module') {
            initStates.pageParams.hasMorePage = resTableData.length == total ? false : true
          }
          // 刷新统计nav
          if (objTotal) setOkrHeaderTotalFn?.(objTotal)

          okrTableRef?.current?.initFn?.({
            findType: 'okrModule',
            fromType,
            state: 0,
            dataList: newTableData,
            isFollowWorkDesk: isFollow,
            filterMoules: {
              periodId: param?.periodId,
            },
            scrollLoad, //滚动加载数据
            // tableHeight: fromSource == 'okr_module' ? '' : 'calc(100% - 20px)',
          })
        }
        dispatch({
          type: 'loading',
          data: false,
        })
      })
    }

    const OkrTableListMemo = useMemo(() => {
      return (
        <OkrTableList
          ref={okrTableRef}
          initType="ref"
          sourceKey={isFollow ? 'isFollowOkrKanbanTable' : 'okrKanbanTable'}
          refreshTotalNums={refreshTotalNums}
        />
      )
    }, [state.datalist])

    //无数据(创建KR)
    if (initStates.datalist == 0) {
      // 未开启Okr周期时图文提示 关注的okr 不渲染okr设置提示
      // if (fromType != 'focus_okr') {
      const isPeriodEnable = periodEnable !== undefined ? periodEnable : okrPeriodFilter.periodEnable
      if (!isPeriodEnable) {
        return (
          <NoneData
            className=""
            imgSrc={$tools.asAssetsPath(`/images/noData/OKR-okr.png`)}
            showTxt="OKR尚未启用，请联系管理员开启"
          />
        )
      } else if (
        (fromSource == 'okr_module' && JSON.parse(filterMoules).planTypeActive == 3) ||
        (fromSource != 'okr_module' && fromType == 'okr')
      ) {
        return (
          <>
            <NoneData
              className={`okr-model ${state.loading ? 'forcedHide' : ''}`}
              imgSrc={$tools.asAssetsPath('/images/noData/s_okr_people.svg')}
              showTxt={
                !isFollow && (
                  <div
                    className="create-btn"
                    onClick={() => {
                      const param = {
                        visible: true,
                        createType: 'add',
                        from: 'workbench',
                        nowType: 0, //0个人任务 2企业任务 3部门任务
                        callbacks: (param: any, code: any) => {
                          // const orgId = selectTeamId === -1 || isNaN(selectTeamId) ? '' : selectTeamId
                          // if (param.data.ascriptionId === selectTeamId || orgId == '') {
                          //   getDeskModule()
                          // }
                        },
                      }
                      createObjectRef.current && createObjectRef.current.getState(param)
                    }}
                  >
                    <div className="div-btn">{$intl.get('createObjective')}</div>OKR,体验高效协作
                  </div>
                )
              }
            />
            {/* 选择企业 */}
            {isShowAddPlan && (
              <WorkPlanMindModal
                visible={isShowAddPlan}
                from="okr_workbench"
                state={0}
                isShowAddPlan={(state: any) => {
                  setIsShowAddPlan(state)
                }}
              ></WorkPlanMindModal>
            )}
            {/* 创建目标模态框 */}
            <CreateObjectModal ref={createObjectRef} />
          </>
        )
      } else {
        return (
          <NoneData
            className={`threePosition`}
            imgSrc={$tools.asAssetsPath(`/images/noData/workdesk-focus-okr.svg`)}
            showTxt={fromType == 'focus_okr' ? $intl.get('noMyOKRMsgfollow') : $intl.get('noMyOKRMsg')}
            containerStyle={{ zIndex: 0, top: '50%' }}
          />
        )
      }
    }

    return (
      <>
        <Spin
          className={`${initStates.datalist == 0 ? 'forcedHide' : ''}`}
          tip={$intl.get('loadingWait')}
          spinning={state.loading}
          style={{ height: 'calc(100% - 230px)' }}
        >
          <div
            className={`okrKanban ${isFullScreen ? 'max_okrKanban' : ''} `}
            // ref={() => {
            //   initEvent()
            // }}
          >
            {OkrTableListMemo}
            {/* 全屏显示页码选择 */}
            {isFullScreen && fromSource != 'okr_module' && (
              <Pagination
                current={initStates.pageParams.pageNo + 1}
                showSizeChanger
                className="customPagination"
                total={initStates.pageParams.totalElements}
                pageSize={initStates.pageParams.fullPageSize}
                pageSizeOptions={['5', '10', '20', '30', '50', '100']}
                onChange={(page, size) => {
                  initStates.pageParams.pageNo = page ? page - 1 : 0
                  initStates.pageParams.fullPageSize = size || 0
                  initDataTree(initStates.periodId)
                }}
              />
            )}
          </div>
        </Spin>
      </>
    )
  }
)
