import React, {
  useEffect,
  useState,
  useImperativeHandle,
  forwardRef,
  useRef,
  useLayoutEffect,
  useContext,
} from 'react'
import { DatePicker, InputNumber, Slider, Tabs, Tooltip } from 'antd'
import moment from 'moment'
import TaskDynamic, { scrollToTop } from '../taskDynamic/taskDynamic'
import { editDetailApi, editProgressApi, queryTaskDetailApi } from './detailApi'
import { FilesList as DetailFileList } from '../fileDetail/fileDetail'
import { TaskSynergy, refreshTheme } from '../taskSynergy/taskSynergy'
import { refreshListFn as refreshTaskManageList } from '../taskManage/TaskManageList'
import { setSubTaskCount } from './detailOrg'
import { refreshFiles } from '../fileDetail/fileDetail'
import CheckEntry from '../creatTask/checkEntry'
import NoneData from '@/src/components/none-data/none-data'
import { AddRemarkModal, editMarkModalHandle } from '../../modals/addRemarkModal'
import './detail.less'
import OKRmind from '../../okr-list/okr-mind'
import { OKRDetailAttach } from '../OKRDetails/detailAttach'
import { OKRDetailHeader } from '../OKRDetails/detailHeader'
import FourQuadrant, { refreshFourQuadrantTask } from '../../fourQuadrant/fourQuadrant'
import { editOKRAffiliationApi, editOkrDetailApi, queryOKRTaskByIdApi } from '../OKRDetails/okrDetailApi'
import '../OKRDetails/okrDetail.less'
import * as Maths from '@/src/common/js/math'
import '@/src/common/js/jquery.resize'
import { refreshTwoQuadrantData } from '../../fourQuadrant/GetSingleData'
import { ipcRenderer } from 'electron'
import { DetailHeader } from './detailHeader'
import { TaskDetailAttach } from './detailAttach'
const { TabPane } = Tabs
export const taskDetailContext = React.createContext({})
//刷新
export let refreshDetailRight: any = null
//外部调用切换tab
export let tabChangeExp: any = null
//外部调用tab统计更新
export let detailTabUpdate: any = null
export interface DetailExp {
  setQuery?: any
  setDataState?: any
}
export interface DetailContext {
  editTaskDes?: any
  editAuth?: boolean
  [propName: string]: any
}
interface DetailQuery {
  id: number | string
  refresh: number
  nameShow?: boolean
  nowTab?: string
}
// 详情数据字段
interface DetailData {
  refresh: 0 //查询刷新任务
  id: string | number //任务ID
  name: string //任务名称
  approvalStatus?: number //
  ascriptionId: string | number //
  ascriptionName: string //
  teamLogo?: string //
  liable: {
    userId?: string
    username?: string
    profile?: string
    account?: string
    roleId?: string
    roleName?: string
    deptId?: string
    deptName?: string
  } //
  distribute?: any //
  endTime: string //
  property: number //
  status: number //
  flag: number //
  level: number //
  attach: {
    id?: string | number
    typeId?: string | number
    type?: number
    typeName?: string
    star?: number
    setType?: number
    profile?: string
    oldTaskId?: string | number
  } //
  process?: number //
  progress?: any
  subTaskCount?: number //
  subTaskLevels?: number //
  childCount?: number //O KR
  createUsername: string //
  taskStatus?: any
  detailMain?: any //后台返回的详情数据
  [propName: string]: any
}
// 编辑权限
let editAuth = true
// 缓存当前tab
let _tabActiveKey = '1'
// 全局缓存当前四象限/对齐视图/详情模式
export let _okrModeActive = '2'
export const setOkrModeActive = (key: string) => {
  _okrModeActive = key
}
// 全局存取当前详情id
// export let detailStateTmp: any = ''
// 当前操作来源
let optFrom = ''
/**
 * 任务详情内容
 */
const DetailRight = forwardRef(
  (
    {
      from,
      taskId,
      refresh,
      callbackFn,
      className,
      handleOkrList,
      refreshTaskTree,
      setModalState,
      leftOrgRef,
      noCloseBtn,
      okrHeaderRef,
      periodDisable,
      defaultActiveKey,
    }: {
      from?: string
      taskId?: string | number
      refreshTaskTree?: any
      refresh?: number
      callbackFn?: any
      className?: string
      handleOkrList?: (paramObj: any) => void
      setModalState?: any
      leftOrgRef?: any //左侧组织架构数据列表组件
      noData?: any
      noCloseBtn?: boolean
      okrHeaderRef?: any
      periodDisable?: any
      defaultActiveKey?: string
    },
    ref
  ) => {
    // 顶层来源
    const sourceFrom = from
    const { okrWindowInfo } = $store.getState()
    const okrTabsList = okrWindowInfo.tabsList || []
    // 其他state，查询时初始化的状态
    const [detailQuery, setQuery] = useState<DetailQuery>({
      id: '',
      refresh: 0,
      nameShow: false,
      nowTab: '1',
    })

    // 数据展示state
    const [dataState, setDataState] = useState<DetailData>({
      noData: false,
      refresh: 0, //查询刷新任务
      id: '', //任务ID
      name: '', //任务名称
      approvalStatus: 0, //
      ascriptionId: '', //
      ascriptionName: '', //
      teamLogo: '', //
      liable: {}, //执行人
      distribute: '', //指派人
      endTime: '', //
      property: 0, //私密属性
      status: 0, //
      flag: 0, //
      level: 1, //
      process: 0, //
      progress: { percent: 0 },
      subTaskCount: 0, // 子任务
      subTaskLevels: 0, //子任务层级
      childCount: 0, //O 、 KR 子任务层级
      createUsername: '', //
      opinionCount: 0, //备注数量
      type: '', //1---任务，5---项目
      taskStatus: {
        name: $intl.get('notOpen'),
        class: '',
        remianDays: 0,
      },
      attach: {
        //归属
        type: 0,
        star: 0,
        typeId: '',
      },
      cycleModel: { flag: 1 }, //循环
      detailMain: {},
      followList: [], //关注人
      tagList: [], //标签
      fileList: [], //附件
      joinTeams: [], //参与企业联系人
      btnsAuthObj: {}, //按钮权限对象集合
      // okr详情属性
      liableUser: '',
      liableUsername: '',
      krCount: 0, //KR数量
    })
    // 详情下方区域组件
    const detailBotRef = useRef<any>({})
    // 详情类型：
    const detailType: any = dataState.workPlanType && from?.includes('OKR') ? dataState.workPlanType : ''
    /**
     * 监听是否刷新
     */
    useEffect(() => {
      const findItem = okrTabsList.find((item: any) => item.findId == detailQuery.id)
      _tabActiveKey = '1'
      if (optFrom != 'in_detail') {
        // okr独立窗口选中进入前的模式状态
        _okrModeActive =
          from?.includes('okrDetailWindow') && findItem && findItem.okrModeActive ? findItem.okrModeActive : '2'
      }
      // 请求详情接口
      queryTaskDetail()
    }, [detailQuery.refresh])

    /**
     * 监听外部传入refresh情况下的刷新(用于兼容老版引入组件方式)
     */
    useEffect(() => {
      const findItem = okrTabsList.find((item: any) => item.findId == detailQuery.id)
      _tabActiveKey = '1'
      // _tabActiveKey = defaultActiveKey || '1'
      // okr独立窗口选中进入前的模式状态
      _okrModeActive =
        from?.includes('okrDetailWindow') && findItem && findItem.okrModeActive ? findItem.okrModeActive : '2'
      setQuery({
        ...detailQuery,
        refresh: detailQuery.refresh + 1,
        id: taskId ? taskId : '',
        nameShow: false,
        nowTab: '1',
      })
    }, [refresh])
    // 初始化监听
    useEffect(() => {
      // 外部传入初始tab激活项
      if (defaultActiveKey) _tabActiveKey = defaultActiveKey
      // 外部刷新详情方法
      refreshDetailRight = queryTaskDetail
      // 外部切换导航方法
      tabChangeExp = (key: any) => {
        setQuery({ ...detailQuery, nowTab: key })
      }
    }, [])
    // 节点加载完毕初始化监听
    useLayoutEffect(() => {
      OKRDetailEvent()
      setTimeout(() => {
        detailAttachScroll()
      }, 1500)
    }, [])
    // ***********************暴露给父组件的方法**************************//
    useImperativeHandle(
      ref,
      (): DetailExp => ({
        /**
         * 设置详情刷新字段，用于父组件对详情查询接口全局刷新
         * 不传id则查询当前任务
         */
        setQuery: ({ id }: { id?: any }) => {
          console.log('刷新右侧内容----------------------id:' + id, detailQuery.refresh, ++detailQuery.refresh)
          _tabActiveKey = '1'

          setQuery({
            ...detailQuery,
            refresh: ++detailQuery.refresh,
            id,
            nameShow: false,
            nowTab: '1',
          })
        },
        /**
         * 设置详情state字段，用于父组件对详情局部刷新
         */
        setDataState: (paramObj: any) => {
          setDataState({ ...dataState, ...paramObj })
        },
      })
    )

    /**
     * okr详情resize
     */
    const OKRDetailEvent = () => {
      // const detailDom: any = $('.OKRDetailContent')
      // const workPlanCon: any = $('.workPlanCon')
      // const okrDetailModal: any = $('.okrDetailModal')
      // const diffWid = className?.includes('okrWideDetail')
      //   ? workPlanCon.width() - workPlanCon.find('.okrListTable ').width()
      //   : okrDetailModal.width() - okrDetailModal.find('.okrListTable ').width()
      // if (diffWid <= 1000) {
      //   detailDom.addClass('okrDetailMinSreen')
      // } else {
      //   detailDom.removeClass('okrDetailMinSreen')
      // }
      $('.OKRDetailResize')
        .off('resize')
        .on('resize', (_: any) => {
          const optDom: any = $('.OKRDetailContent')
          if (optDom.width() <= 1000) {
            optDom.addClass('okrDetailMinSreen')
          } else {
            optDom.removeClass('okrDetailMinSreen')
          }
        })
    }
    /**
     * 查询详情
     */
    const queryTaskDetail = (paramObj?: any) => {
      return new Promise(resolve => {
        const infoObj = paramObj ? paramObj : {}
        // onlyGetData：只获取最新数据，不设置state
        const { onlyGetData } = infoObj
        const taskId = getQueryId({ taskId: infoObj.taskId, dataState: { id: detailQuery.id } })
        editAuth = true
        // 获取按钮权限 f
        // const param = {
        //   id: taskId,
        //   viewType: 2,
        // }
        let btnsAuth: any = {},
          btnsList: any = []
        if (taskId) {
          // if (!from?.includes('OKR')) {
          //   const res: any = await queryTaskBtnAuth(param)
          //   // 按钮权限列表
          //   btnsList = res.data.dataList || []
          // }
          queryTaskDetailApi({ id: taskId }).then((data: any) => {
            btnsList = data.obj || []
            btnsAuth = detailBtnsObj({ btnsList })
            const setData = setDetailData({ data: data.data || {}, btnsAuth, btnsList, onlyGetData })
            resolve(setData)
          })
        } else {
          setDataState({ ...dataState, noData: true })
          resolve(null)
        }
      })
    }
    /**
     * 任务状态
     * @param data
     */
    const getTaskStatus = (data: any) => {
      let _status = $intl.get('notOpen')
      let statusClass = 'nostart'
      if (data.executeTime == null) {
        _status = $intl.get('notOpen')
        statusClass = 'nostart'
      } else if (data.status == 1) {
        _status = $intl.get('haveInHand')
        statusClass = 'going'
      } else if (data.status == 2) {
        _status = $intl.get('finished')
        statusClass = 'finish'
      }
      if (data.status == 3) {
        _status = $intl.get('delay')
        statusClass = 'late'
      }
      if (data.flag == 3) {
        _status = $intl.get('archived')
        statusClass = 'freeze'
      } else if (data.flag == 1) {
        _status = $intl.get('frozen')
        statusClass = 'freeze'
      }
      return {
        statusTxt: _status,
        statusClass: statusClass,
      }
    }
    /**
     * 设置详情数据和展示
     */
    const setDetailData = ({
      data,
      btnsAuth,
      btnsList,
      onlyGetData,
    }: {
      data: any
      btnsAuth?: any
      btnsList: any
      onlyGetData?: boolean
    }) => {
      const mainData = data.MAIN ? data.MAIN : data || {}
      // 更新详情左侧组织架构的任务统计
      if (mainData.subTaskCount !== undefined && setSubTaskCount) {
        setSubTaskCount({ subTaskCount: mainData.subTaskCount || 0, level: mainData.level || 0 })
      }
      // 更新okr详情 左侧列表 kr/子任务 统计数量
      if (leftOrgRef && leftOrgRef.current) {
        leftOrgRef.current.updateChildNumFn({
          type: mainData.workPlanType || 1,
          subTaskCount: mainData.subTaskCount || 0, //任务显示子级数量
          level: mainData.level || 0, // 任务显示层级
          childCount: mainData.childCount, // O kr 显示子级数量
        })
      }
      // 后台返回startTime为undefined情况
      if (!mainData.startTime) {
        mainData.startTime = ''
      }
      //任务状态
      const statusObj = getTaskStatus(mainData)
      const statusTxt = statusObj.statusTxt
      const statusClass = statusObj.statusClass
      // 防止某些字段后台返回的是undefined，设置默认字段
      const mainDef = {
        liable: mainData.liable || {},
        execute: mainData.execute || {},
        distribute: mainData.distribute || {},
        supervisor: mainData.supervisor || {},
        endTime: mainData.endTime || '',
        executeTime: mainData.executeTime || '',
        status: mainData.status || 0,
        flag: mainData.flag || 0,
        level: mainData.level || 1,
        attach: mainData.attach || {},
        process: mainData.process || 0,
        subTaskCount: mainData.subTaskCount || 0,
        subTaskLevels: mainData.subTaskLevels || 0,
        childCount: mainData.childCount || 0,
        remainDays: mainData.remainDays || 0,
        type: mainData.type || 0,
        createUsername: mainData.createUsername || '',
        processUser: mainData.processUser || '',
        startTime: mainData.startTime || '',
        description: mainData.description || '',
        icon: mainData.icon || '',
        objectiveProcess: mainData.objectiveProcess || 0,
        liableUser: mainData.liableUser || '',
        liableUsername: mainData.liableUsername || '',
        liableUserProfile: mainData.liableUserProfile || '',
        workPlanType: mainData.workPlanType || '',
        pageUuid: Maths.uuid(),
      }
      // 合并详情main数据对象
      const detailMain = { ...mainData, ...mainDef }
      const supports = data.SUPPORTS ? data.SUPPORTS : {}
      // const direct = supports.direct || []
      // const indirect = supports.indirect || []
      const showObj = {
        taskStatus: {
          name: statusTxt,
          class: statusClass,
          remianDays: detailMain.remianDays || 0,
        },
        attach: detailMain.attach || {},
        liable: detailMain.liable || {},
        detailMain,
        followList: data.FOLLOW || [],
        tagList: data.TAG || [],
        fileList: data.FILES || [],
        joinTeams: data.JOIN_TEAMS || [],
        reportSets: data.REPORT_SET || [],
        targetList: data.TARGET || [], //状态指标
        cciList: data.CCI || [], //信心指数
        supports, //支撑
        btnsAuthObj: btnsAuth,
        btnsList,
      }
      // console.log('setDetail-------', mainData.id)
      // 无编辑权限和归档任务都不可编辑
      if ((btnsAuth['UPDATE'] && !btnsAuth['UPDATE'].isUse) || mainData.flag == 3) {
        editAuth = false
      }
      $store.dispatch({ type: 'TASK_DETAIL', data: mainData })
      const setData = {
        ...dataState,
        ...detailMain,
        ...showObj,
        refresh: dataState.refresh + 1,
        noData: false,
        editAuth,
      }

      // okr独立窗口设置企业名
      okrHeaderRef &&
        okrHeaderRef.current &&
        okrHeaderRef.current.setState({ teamName: detailMain.ascriptionName || '' })
      _fileCount = setData.fileCount
      if (!onlyGetData) {
        setDataState(setData)
      }
      return setData
    }

    // ***********************************编辑操作方法***********************************//

    /**
     * 编辑详情
     * noQuery:编辑完成后是否全局查询
     */
    const editTaskSave = (
      param: any,
      attachObj?: { noQuery?: number | boolean; optType?: string; refreshTree?: boolean }
    ) => {
      const infoObj = attachObj ? attachObj : {}
      const { noQuery, optType, refreshTree } = infoObj
      param.id = getQueryId({ dataState, from })
      return new Promise(resolve => {
        editDetailApi(param).then((res: any) => {
          if (res.success) {
            resolve(true)
          } else {
            resolve(res.data)
          }

          if (res.success && !noQuery) {
            refreshFn({ optType, refreshTree, from })
            //刷新附件列表
            if (param.fileModels && param.fileModels.length > 0) {
              _tabActiveKey = '3'
              refreshFiles && refreshFiles()
            }
            // 刷新汇报
            // if (param.reportListLength && param.reportListLength > 0) {
            //   refreshReports && refreshReports()
            // }
          }
        })
      })
    }

    /**
     * 刷新处理
     * refreshTree：刷新左侧子任务组织架构
     */
    const refreshFn = ({
      optType,
      refreshTree,
      newChild,
      from,
      taskId,
      parentId,
      itemData,
      childIds,
      isOnlyRefreshLeftTree,
      periodIds, //更改周期id 前者为旧 后者为新
    }: {
      optType?: string
      refreshTree?: any
      taskId?: any
      parentId?: any
      isOnlyRefreshLeftTree?: boolean //okr 详情时仅需要刷新左侧列表
      itemData?: any //当前操作数据
      [propName: string]: any
    }) => {
      // 四象限中点击okr行
      if ((from == 'fourQuadrant' && !optType) || optType == 'all') {
        return leftOrgRef && leftOrgRef.current && leftOrgRef.current.clickTheTask({ defFirst: true })
      }

      let queryId = getQueryId({ dataState, taskId, from })

      let refreshParam: any = { optType, from: 'taskDetail', taskIds: [queryId] }
      if (
        optType == 'addChildTask' ||
        optType == 'addKr' ||
        optType == 'addTask' ||
        optType == 'relateTask' ||
        optType == 'assign' ||
        optType == 'changeChildTask'
      ) {
        refreshParam = {
          optType,
          from: 'taskDetail',
          parentId: queryId,
          newChild,
          childIds,
          taskIds: [queryId || ''],
        }
      }
      // 删除 task/okr
      if (optType == 'del' || optType == 'delAllChain' || optType == 'relKR' || optType == 'cancelSupport') {
        // 如果是四象限操作删除 任务/Kr
        if (from == 'fourQuadrant') {
          refreshParam = {
            optType,
            from: 'fourQuadrant',
            taskIds: [queryId || ''],
            parentId,
          }
        }
        // okr独立窗口模式下 如果删除的是O 则关闭该OKR 头部tab
        if (okrHeaderRef && itemData && itemData.workPlanType == 2) {
          okrHeaderRef.current && okrHeaderRef.current.delTab({ from: 'handerDelO', item: itemData })
        }
      }

      // console.log('callbackFn：', callbackFn, queryId)
      // 刷新外部数据
      if (from?.includes('taskManage')) {
        //任务管理 刷新列表
        refreshTaskManageList(refreshParam)
      } else if (sourceFrom?.includes('okrDetailWindow')) {
        // okr独立窗口模式下刷新okr列表
        // 刷新概况预览数据
        if (optType == 'editProgress' || optType == 'addChildTask' || optType == 'del') {
          ipcRenderer.send('solve_okrList_generalView', {
            refresh: true,
          })
        }
      } else if (callbackFn) {
        const isModel = setModalState ? true : false

        if (isModel) {
          if (optType == 'distributeSingle' || optType == 'recallDistributeSingle') {
            // 派发单项/撤回单项派发： 如果是模态框展示详情，刷新Okr列表需要当前O id信息
            queryId = dataState.id
          }
          // 暂时四象限操作
        }

        callbackFn({
          findId: queryId,
          optType,
          newChildId: (childIds && childIds[0]) || '',
          periodIds,
          from,
        })
      }

      // 刷新左侧组织架构（任务管理宽详情没有组织架构）
      if (!from?.includes('wideDetail') || from?.includes('OKR')) {
        refreshTree && refreshTaskTree && refreshTaskTree(refreshParam)
      }
      // 编辑O周期，刷新四象限O支撑数据
      if (optType == 'editPeriodId' || optType == 'editName') {
        // 刷新四象限数据
        refreshTwoQuadrantData && refreshTwoQuadrantData({ taskIds: taskId || queryId })
        // 刷新右侧头部数据
      }

      // 对齐视图模式刷新对齐视图
      if (dataState.workPlanType == 2 && _okrModeActive == '1') {
        detailBotRef.current && detailBotRef.current.okrMindRefresh({ findId: queryId })
      }
      // 刷新详情(删除和归档任务不存在，故不刷新)
      if (
        isOnlyRefreshLeftTree ||
        optType == 'del' ||
        optType == 'archive' ||
        optType == 'relKR' ||
        (dataState.workPlanType == 2 && _okrModeActive == '0')
      )
        return
      // 刷新详情
      queryTaskDetail()
    }

    //  是否刷新左侧组织架构树列表   vlaue :1全刷
    const isReFreshOrgLeft = async (value: number | string, data?: any) => {
      console.log('isReFreshOrgLeft**************************************')
      let optType = data?.optType || ''
      let taskId: number | string = (data && data.typeId) || ''
      let parentId: number | string = ''
      const refreshTree = true
      let newChild = {}
      let itemData: any
      let childIds: any = []

      const isOnlyRefreshLeftTree = (data && data.isOnlyRefreshLeftTree) || false

      switch (Number(value)) {
        case 1:
          const { btnStatus } = data
          if (btnStatus == 2) {
            optType = 'finish'
          } else if (btnStatus == 3) {
            optType = 'unfinish'
          } else {
            optType = 'all'
          }
          break
        case 4: //修改责任人
          optType = 'editLiber'
          break
        case 6: // 移交任务
          optType = 'transfer'
          break
        case 28: //修改kr/task进度
        case 7: //修改O 的头部进度状态
          optType = 'editProgress'
          break
        case 9: //归档任务
          optType = 'archive'
          break
        case 5: //指派任务
        // optType = 'assign'
        case 8: //关联任务
        case 10: //新建子任务
          if (data) {
            optType = optType ? optType : value == 8 ? 'relateTask' : 'addChildTask'
            taskId = data.ParentTypeId
            parentId = data.ParentTypeId
            childIds = [data.typeId]
            // 查询任务最新数据 针对指派任务，存在指派查询多条数据
            await queryOKRTaskByIdApi({ taskIds: data.typeIds || [data.typeId] }).then((dataList: any) => {
              newChild = dataList
            })
          }

          break
        case 11: //交换KR位置
          optType = 'changeChildTask'
          if (data) {
            taskId = data.ParentTypeId
            childIds = [data.typeId]
            newChild = data.moveData
          }
          break
        case 105: //派发单项
          optType = 'distributeSingle'
          parentId = data?.parentId
          break
        case 106: //派发全链
          optType = 'distributeAll'
          if (data) {
            // 顶层为任务派发
            if (data.type == 1) {
              taskId = data.parentTypeId
              childIds = [data.typeId]
            }
          }

          break
        case 107: //撤回派发单链
          optType = 'recallDistributeSingle'
          parentId = data?.parentId
          // if (data) {
          //   parentId = data.parentTypeId
          // }
          break
        case 108: //撤回整链派发
          optType = 'recallDistributeAll'
          break
        case 112: //更改图标
          optType = 'updateIcon'
          break
        case 114: //删除单项任务
          optType = 'del'
          if (data) {
            parentId = data.parentId
            // console.log('删除父id：-------------' + data.parentId)
            taskId = data.typeId
            if (data.taskName) {
              itemData = data.taskName
              itemData.workPlanType = itemData.type
            }
          }
          break
        case 115: //删除整链任务
          optType = 'delAllChain'
          if (data) {
            taskId = data.typeId
            if (data.taskName) {
              itemData = data.taskName
              itemData.workPlanType = itemData.type
            }
          }

          break
        case 301: //更新状态指标
          optType = 'updateTagStatus'
          break
        case 302: //解冻、冻结
          optType = 'freeze'
          break
        case 303: //取消支撑
          optType = 'cancelSupport'
          parentId = data.parentId
          break
        case 3030: //向上支撑
          optType = 'upSupports'
          break
        case 3031: //取消对齐
          optType = 'cancleRelate'
          break
        case 304: //编辑任务
          optType = 'editorTask'
          break
        default:
          break
      }
      // 刷新详情和左侧列表
      refreshFn &&
        refreshFn({
          optType,
          refreshTree,
          parentId,
          newChild,
          from: 'fourQuadrant',
          taskId,
          itemData,
          isOnlyRefreshLeftTree,
          childIds,
        })
    }
    /**
     * 编辑任务名
     */
    const editTaskName = (name: any, callbackFn?: any) => {
      setQuery({ ...detailQuery, nameShow: false })
      if (name == dataState.name) {
        return
      }
      return new Promise(resolve => {
        if (!editAuth) {
          resolve(false)
          return
        }
        const param = {
          name,
        }
        editTaskSave(param, { optType: 'editTaskName', refreshTree: true }).then((res: any) => {
          resolve(res)
          // 编辑成功
          if (res) {
            callbackFn && callbackFn()
          }
        })
      })
    }
    /**
     * 编辑进度
     */
    const editProgress = (value: number) => {
      if (value == dataState.process) {
        return
      }
      editProgressApi({ taskId: detailQuery.id, process: value || 0 }).then((res: any) => {
        if (res.success) {
          dataState.process = value
          // 开启任务
          if (dataState.process == 0 && value > 0 && value < 100) {
            refreshFn({ optType: 'start', refreshTree: true })
          } else if (value == 100) {
            // 完成任务
            refreshFn({ optType: 'finish', refreshTree: true })
          } else {
            refreshFn({ optType: 'editProgress', refreshTree: true })
          }
        }
      })
    }
    /**
     * 编辑时间
     */
    const editTimes = (val: number, type: string) => {
      let times = ''
      if (!val) {
        times = ''
      } else {
        times = moment(val).format('YYYY/MM/DD HH:mm')
      }
      const param: any = {
        id: getQueryId({ dataState, from }),
        startTime: dataState.startTime,
        endTime: dataState.endTime,
      }
      if (type == 'startTime') {
        param.startTime = times
      } else if (type == 'endTime') {
        param.endTime = times
      }
      editTaskSave(param)
    }
    /**
     * 修改标签 优先级
     * @param datas
     * @param type
     */
    const editPriority = (datas: any) => {
      //优先级
      const param = {
        id: getQueryId({ dataState, from }),
        attach: {
          star: datas.data, //优先级等级
          type: dataState.attach.type, //0 个人任务  2企业任务  3部门任务
          typeId: dataState.attach.typeId, // 任务类型id
          oldTaskId: datas.oldTaskId || undefined,
        },
      }
      editTaskSave(param, { optType: 'editPriority', refreshTree: true })
    }
    /**
     * 修改任务描述
     */
    const editTaskDes = ({ description, noQuery }: any) => {
      return new Promise(resolve => {
        if (!editAuth) {
          resolve(false)
          return
        }
        const param = {
          id: getQueryId({ dataState, from }),
          description,
        }
        editTaskSave(param, { noQuery }).then((res: any) => {
          resolve(res)
        })
      })
    }
    /**
     * 修改关注人
     */
    const editFollowers = ({ followUsers }: any) => {
      return new Promise(resolve => {
        const param = {
          id: getQueryId({ dataState, from }),
          followUsers,
        }
        editTaskSave(param, { optType: 'editFollowers', refreshTree: true }).then((res: any) => {
          resolve(res)
        })
      })
    }

    /**
     * 修改责任人
     */
    const editLiable = ({ liable }: any) => {
      return new Promise(resolve => {
        const param = {
          liable,
        }
        editTaskSave(param, { optType: 'editLiable', refreshTree: true }).then((res: any) => {
          resolve(res)
        })
      })
    }

    /**
     * 修改人员
     */
    const editMembers = (param: any) => {
      return new Promise(resolve => {
        editTaskSave(param, { optType: 'editMembers', refreshTree: true }).then((res: any) => {
          resolve(res)
        })
      })
    }

    /**
     * 编辑标签
     */
    const editIcons = ({ tagIds, icon, types }: any) => {
      //标签
      return new Promise(resolve => {
        const param: any = {}
        if (types.includes('icon')) {
          param.icon = icon
        }
        if (types.includes('tag')) {
          param.tagList = tagIds
        }
        editTaskSave(param, { optType: 'editIcons', refreshTree: true }).then((res: any) => {
          resolve(res)
        })
      })
    }
    /**
     * 编辑附件
     */
    const editFiles = ({ temporaryId, fileGuidList }: any) => {
      return new Promise(resolve => {
        const param = {
          id: getQueryId({ dataState, from }),
          // fileModels,
          temporaryId,
          fileGuidList,
        }
        editTaskSave(param).then((res: any) => {
          resolve(res)
        })
      })
    }

    /**
     * 修改归属
     */
    const editAffiliation = ({ paramObj }: any) => {
      return new Promise(resolve => {
        const param = {
          ...paramObj,
        }
        editTaskSave(param, { optType: 'editAffiliation', refreshTree: true }).then((res: any) => {
          resolve(res)
        })
      })
    }
    /**
     * 修改支撑目标
     */
    const editSupports = ({ supports }: any) => {
      return new Promise(resolve => {
        const param = {
          supports,
        }
        editTaskSave(param, { optType: 'editSupports' }).then((res: any) => {
          resolve(res)
        })
      })
    }
    /**
     * 添加备注成功
     */
    const addMarksOk = () => {
      _tabActiveKey = '2'
      _okrModeActive = '2'
      optFrom = 'in_detail'
      setQuery({ ...detailQuery, nowTab: '2' })
      // if (refreshTheme) {
      //   refreshTheme()
      // } else {
      queryTaskDetailApi({ id: dataState.id || '' }).then((data: any) => {
        const { opinionCount, fileCount } = data.data.MAIN ? data.data.MAIN : data || {}
        _fileCount = fileCount
        dataState.opinionCount = opinionCount
        dataState.fileCount = fileCount
        setDataState({ ...dataState })
        refreshTheme && refreshTheme()
      })
      // }
    }
    /**
     * 修改check清单
     */
    const editCheckList = ({ checkList }: any) => {
      return new Promise(resolve => {
        const param = {
          checkList,
        }
        editTaskSave(param, { optType: 'editCheckList', noQuery: true }).then((res: any) => {
          resolve(res)
        })
      })
    }

    // ======内部使用版特有======//
    /**
     * 编辑循环
     */
    const editCycleModel = (datas: any) => {
      return new Promise(resolve => {
        const param = {
          cycleModel: datas,
        }
        editTaskSave(param, { optType: 'editCycleModel', refreshTree: true }).then((res: any) => {
          resolve(res)
        })
      })
    }
    /**
     * 编辑公开私密
     */
    const editPrivate = (property: number) => {
      return new Promise(resolve => {
        const param = {
          property,
        }
        editTaskSave(param, { optType: 'editPrivate', refreshTree: true }).then((res: any) => {
          resolve(res)
        })
      })
    }
    /**
     * 编辑企业联系人
     */
    const editJoinTeams = ({ teamList }: any) => {
      return new Promise(resolve => {
        const param = {
          teamList,
        }
        editTaskSave(param, { optType: 'editJoinTeams' }).then((res: any) => {
          resolve(res)
        })
      })
    }

    /**
     * 编辑Okr详情
     * noQuery:编辑完成后是否全局查询
     */
    const editOKRSave = (
      param: any,
      attachObj?: {
        noQuery?: number | boolean
        optType?: string
        refreshTree?: boolean
        periodIds?: number[]
        callBack?: () => void
      }
    ) => {
      const infoObj = attachObj ? attachObj : {}
      const { noQuery, optType, refreshTree, periodIds, callBack } = infoObj
      const { nowUserId } = $store.getState()
      const newParam: any = {
        id: dataState.workPlanId || '', //当前节点
        typeId: dataState.id || '', //任务id
        parentId: dataState.parentId || '', //父级元素id
        mainId: dataState.mainId || '', //根节点id
        operateUser: nowUserId, //操作人
        ...param,
      }
      return new Promise(resolve => {
        editOkrDetailApi(newParam).then((res: any) => {
          resolve(res)
          if (res && !noQuery) {
            if (
              optType == 'editName' ||
              optType == 'editHeart' ||
              optType == 'editDescription' ||
              optType == 'editOkrPercent'
            )
              callBack && callBack()
            refreshFn({ optType, refreshTree, taskId: dataState.id, periodIds })
          }
        })
      })
    }

    /**
     * 编辑Okr归属信息
     * noQuery:编辑完成后是否全局查询
     */
    const editOKRAffInfo = (
      param: {
        ascriptionId: any
        ascriptionType: any //归属类型0个人2企业 3部门
        deptId: any
        roleId: any
        userId: any
        account: any
        onlyUser: number
      },
      attachObj?: { noQuery?: number | boolean; optType?: string; refreshTree?: boolean }
    ) => {
      const infoObj = attachObj ? attachObj : {}
      const { noQuery, optType, refreshTree } = infoObj
      const { nowUserId, nowUser } = $store.getState()
      const newParam: any = {
        id: dataState.id || '', //任务id
        operateUser: nowUserId,
        operateUserName: nowUser,
        ...param,
      }
      return new Promise(resolve => {
        editOKRAffiliationApi(newParam).then((res: any) => {
          resolve(res)
          if (res && !noQuery) {
            refreshFn({ optType, refreshTree })
          }
        })
      })
    }

    /**
     * 局部刷新查询最新数据
     */
    const singleRefresh = async (paramObj?: any) => {
      const getData = await queryTaskDetail(paramObj)
      refreshFn(paramObj)
      return getData
    }
    // ***********************************上下文数据***********************************//
    const detailObj: DetailContext = {
      mainData: dataState.detailMain,
      detailData: dataState,
      editAuth,
      btnsAuthObj: dataState.btnsAuthObj,
      editTaskDes,
      editFollowers,
      editIcons,
      editFiles,
      editLiable,
      editMembers,
      editAffiliation,
      editSupports,
      editJoinTeams,
      editCheckList,
      editProgress,
      editTimes,
      queryTaskDetail,
      editOKRAffInfo,
      editOKRSave,
      handleOkrList,
      refreshFn,
      isReFreshOrgLeft,
      leftOrgRef,
      singleRefresh,
      defaultActiveKey,
      setModalState,
    }
    const normaNodelImg = $tools.asAssetsPath(`/images/noData/no_reproduce.png`)
    // okr无数据图标
    const okrNodelImg = $tools.asAssetsPath(`/images/noData/OKR-okr.png`)
    return (
      <taskDetailContext.Provider value={detailObj}>
        {dataState.noData && !periodDisable && (
          <div className="detailNoneDataCont flex flex-1 h100">
            <NoneData
              imgSrc={detailType ? okrNodelImg : normaNodelImg}
              showTxt={detailType ? $intl.get('noMyOKRMsg') : ''}
            />
          </div>
        )}
        {/* 未开启周期时 */}
        {periodDisable && (
          <div className="detailNoneDataCont flex flex-1 h100">
            <NoneData
              imgSrc={detailType ? okrNodelImg : normaNodelImg}
              showTxt={detailType ? 'OKR尚未启用，请联系管理员开启' : ''}
            />
          </div>
        )}
        {/* 详情区 */}
        {!dataState.noData && !periodDisable && (
          <section
            className={`taskDetailCont flex column flex-1 h100 ${className} ${
              getDetailWidthInit(className) < 1000 ? 'okrDetailMinSreen' : ''
            }`}
            data-typeid={dataState.id}
          >
            {detailType ? (
              <OKRDetailHeader
                dataState={dataState}
                detailQuery={detailQuery}
                setQuery={setQuery}
                refreshFn={refreshFn}
                from={from}
                detailBotRef={detailBotRef}
                callbackFn={callbackFn}
                editTaskName={editTaskName}
                editOKRAffInfo={editOKRAffInfo}
                editOKRSave={editOKRSave}
                setModalState={setModalState}
                editDataState={(data: any) => {
                  if (data) {
                    addMarksOk()
                  }
                }}
                areaName={className}
                noCloseBtn={noCloseBtn}
                refresh={dataState.refresh}
              />
            ) : (
              <DetailHeader
                dataState={dataState}
                detailQuery={detailQuery}
                setQuery={setQuery}
                refreshFn={refreshFn}
                from={from}
                callbackFn={callbackFn}
                editTaskName={editTaskName}
                editPriority={editPriority}
                editCycleModel={editCycleModel}
                editPrivate={editPrivate}
                setModalState={setModalState}
                noCloseBtn={noCloseBtn}
                editAuth={editAuth}
              />
            )}
            {/* 详情下方区域 */}
            <DetailBotCom
              ref={detailBotRef}
              dataState={dataState}
              editProgress={editProgress}
              editTimes={editTimes}
              editCheckList={editCheckList}
              from={from}
              // refresh={detailQuery.refresh}
            />
            {/* 编辑备注弹框 */}
            <AddRemarkModal
              from="detail"
              taskId={getQueryId({ dataState, from })}
              cycleMNum={dataState.cycleNum || 0}
              addMarksOk={addMarksOk}
              teamId={dataState.ascriptionId}
            />
          </section>
        )}
      </taskDetailContext.Provider>
    )
  }
)

/**
 * 详情下方区域容器
 */

const DetailBotCom = forwardRef(
  (
    {
      dataState,
      editProgress,
      editTimes,
      editCheckList,
      from,
    }: {
      dataState: any
      editProgress: any
      editTimes: any
      editCheckList: any
      from?: string
      refresh?: any
    },
    ref
  ) => {
    const okrMindRef = useRef<any>({})
    // 只有O才有切换模式按钮，其他类型固定展示详情区
    const detailType: any = dataState.workPlanType && from?.includes('OKR') ? dataState.workPlanType : ''
    const [state, setState] = useState<any>({
      nowContentTab: detailType == 2 ? _okrModeActive : '2',
      okrFliter: [1, 2],
      statusChoose: false,
      refresh: 0,
    })
    useEffect(() => {
      // 任务类型固定展示详情模式,okr类型默认展示四象限模式
      setState({ ...state, nowContentTab: detailType == 2 ? _okrModeActive : '2' })
      // 监听O名称变化，单条属性四象限O 名称 数据
      if (dataState && dataState.workPlanType == 2) {
        refreshFourQuadrantTask &&
          refreshFourQuadrantTask(27, {
            name: dataState.name,
            workPlanType: dataState.workPlanType,
            from: 'detailHeader',
          })
      }
    }, [dataState])
    /**-
     * 外部调用方法
     */
    useImperativeHandle(ref, () => ({
      setState: (paramObj: any) => {
        if (paramObj.refresh) {
          paramObj.refresh = ++state.refresh
        }
        setState({ ...state, ...paramObj })
      },
      /**
       * 刷新对齐视图
       */
      okrMindRefresh,
    }))
    /**
     * 刷新对齐视图
     */
    const okrMindRefresh = (paramObj: any) => {
      if (state.nowContentTab == '1' && okrMindRef.current && okrMindRef.current.okrMindRefresh) {
        okrMindRef.current.okrMindRefresh(paramObj)
      }
    }
    return (
      <section className="detailBotContainer flex-1">
        {state.nowContentTab == '2' && (
          <TaskDetailMid
            dataState={dataState}
            editProgress={editProgress}
            editTimes={editTimes}
            editCheckList={editCheckList}
            from={from}
          />
        )}
        {state.nowContentTab == '0' && (
          <FourQuadrant
            key={`okrDetailFourQuadrant_${from}`}
            id={dataState.workPlanId}
            typeId={dataState.id}
            status={state.statusChoose}
            planStateArr={state.okrFliter.toString()}
            settitStatus={() => {}}
            changeStatus={{}}
            teamId={dataState.ascriptionId || '963'}
            sourceFrom={from}
            // refresh={dataState.refresh}
            refresh={state.refresh}
          />
        )}
        {state.nowContentTab == '1' && <OKRmind id={dataState.workPlanId} ref={okrMindRef} />}
      </section>
    )
  }
)
/**
 * 详情中间内容组件
 */
const TaskDetailMid = ({
  dataState,
  editProgress,
  editTimes,
  editCheckList,
  from,
}: {
  dataState: any
  editProgress: any
  editTimes: any
  editCheckList: any
  from?: string
}) => {
  // 进度百分比输入框组件
  const processInpRef = useRef<any>({})
  // ***********************************内部小组件(拆出便于更改当前状态)***********************************//
  /**
   * 进度条拖动组件
   */
  const SliderBar = () => {
    const [state, setState] = useState<any>({
      process: dataState.process || 0,
    })
    useEffect(() => {
      setState({ ...state, processUser: dataState.processUser })
    }, [dataState.processUser])
    return (
      <Slider
        min={0}
        max={100}
        step={5}
        // defaultValue={dataState.process || 0}
        value={state.process || 0}
        disabled={state.process == 100 ? true : false}
        onChange={(value: any) => {
          // 右侧输入框跟随变化
          processInpRef.current && processInpRef.current.setState({ process: value })
          setState({ ...state, process: value })
        }}
        onAfterChange={(value: any) => {
          editProgress(value)
        }}
        tipFormatter={() => {
          return (
            <span>
              {state.processUser || ''}
              {$intl.get('assessProgressIs')}
              {state.process || 0}%
            </span>
          )
        }}
      />
    )
  }
  /**
   * 进度百分比输入框组件
   */
  const ProcessInput = forwardRef((_, ref) => {
    const [state, setState] = useState<any>({
      process: dataState.process || 0,
    })
    /**-
     * 外部调用方法
     */
    useImperativeHandle(ref, () => ({
      setState: (paramObj: any) => {
        setState({ ...state, ...paramObj })
      },
    }))

    // 节点加载完毕初始化监听
    // useLayoutEffect(() => {
    //   detailAttachScroll()
    // }, [])

    /**
     * 监听进度变化
     */
    // useEffect(() => {
    //   setState({ ...state, process: dataState.process })
    // }, [dataState.process])
    return (
      <InputNumber
        min={0}
        max={100}
        value={state.process || 0}
        disabled={dataState.status == 2 ? true : false}
        style={{ width: '32px', height: '28px' }}
        onChange={(value: any) => {
          setState({ ...state, process: value })
        }}
        formatter={limitDecimals}
        parser={limitDecimals}
        onPressEnter={(e: any) => {
          e.target.blur()
        }}
        onBlur={(e: any) => {
          editProgress(e.target.value)
        }}
      />
    )
  })
  const detailType: any = dataState.workPlanType && from?.includes('OKR') ? 'okr' : ''
  const progressShow = false
  return (
    <div className="taskDetailMid flex flex-1">
      {/* 左侧过程内容区 */}
      <div className="processCont flex-1 ">
        {/* 头部信息 进度 状态 开始结束时间等(进度已经转移到右侧，此处屏蔽) */}
        {!detailType && progressShow && (
          <section className="taskProgressSec flex between wrap">
            <div className={`task_status_box ${dataState.taskStatus.class || ''}`}>
              <span className="img_icon status_icon"></span>
              <div className="status_txt_box">
                <div className="status_txt">{dataState.taskStatus.name || ''}</div>
                <div className="task_surplus_time baseGrayColor">
                  ({$intl.get('remain')}
                  {dataState.remainDays || 0}
                  {$intl.get('day')})
                </div>
              </div>
            </div>
            <div className="progress_right">
              <div className="progress_mid">
                {/* 客观进度 */}
                {
                  <div className="objectiveDotBox">
                    <Tooltip title={`${$intl.get('objectiveProgress')}：${dataState.objectiveProcess || 0}%`}>
                      <span
                        className="impersonality_process"
                        style={{ left: `${dataState.objectiveProcess || 0}%` }}
                      ></span>
                    </Tooltip>
                  </div>
                }
                <SliderBar />
                <ProcessInput ref={processInpRef} />
                <span className="percentbai">%</span>
              </div>
              {/* 开始截至时间 */}
              <div className={`progress_bot flex between ${!editAuth ? 'pointerDisable' : ''}`}>
                <div className="task_start_time_box">
                  <span>{$intl.get('start')}:</span>
                  <DatePicker
                    showTime
                    placeholder={$intl.get('clickSet')}
                    bordered={false}
                    suffixIcon={<i></i>}
                    format={'YYYY/MM/DD HH:mm'}
                    value={dataState.startTime ? moment(dataState.startTime) : null}
                    onChange={(value: any) => {
                      editTimes(value, 'startTime')
                    }}
                  />
                </div>
                <div className="task_end_time_box">
                  <span className="tasknames-jz">{$intl.get('Deadline')}:</span>
                  <DatePicker
                    showTime
                    placeholder={$intl.get('clickSet')}
                    allowClear={false}
                    bordered={false}
                    suffixIcon={<i></i>}
                    value={dataState.endTime ? moment(dataState.endTime) : null}
                    format={'YYYY/MM/DD HH:mm'}
                    onChange={(value: any) => {
                      editTimes(value, 'endTime')
                    }}
                  />
                </div>
              </div>
            </div>
          </section>
        )}
        {/* 任务动态、备注、附件总览 */}
        <TabPaneCom dataState={dataState} editCheckList={editCheckList} from={from} />
        {/* </section> */}
      </div>
      {/* 右侧备查固定信息区 */}
      <section className="detailRightAttachOut">
        {detailType ? (
          <OKRDetailAttach dataState={dataState} from={from} />
        ) : (
          <TaskDetailAttach dataState={dataState} />
        )}
      </section>
      {/* 返回顶部按钮 */}
      <BackTop />
    </div>
  )
}
/**tab组件 */
let _fileCount = 0
const TabPaneCom = ({ dataState, editCheckList, from }: any) => {
  const taskDetailObj: DetailContext = useContext(taskDetailContext)
  const { defaultActiveKey, setModalState } = taskDetailObj
  const detailType: any = dataState.workPlanType || ''
  const queryId = getQueryId({ dataState, from })
  const [state, setState] = useState<any>({
    nowTab: _tabActiveKey,
    gettime: 0,
    refreshType: 'init',
    opinionCount: 0,
    fileCount: 0,
    idRefresh: 0, //标记根据Id刷新次数
  })
  useEffect(() => {
    return () => {
      _fileCount = 0
      detailTabUpdate = null
      _tabActiveKey = '1'
    }
  }, [])
  useEffect(() => {
    //解决模态框外部传入默认激活tab,初始问题（仅记录一次激活状态）
    _tabActiveKey = setModalState && state.idRefresh == 0 && defaultActiveKey ? defaultActiveKey : '1'
    setState({
      ...state,
      fileCount: dataState.fileCount,
      opinionCount: dataState.opinionCount,
      nowTab: _tabActiveKey,
      idRefresh: ++state.idRefresh,
    })
  }, [queryId])

  useEffect(() => {
    setState({
      ...state,
      nowTab: _tabActiveKey,
      opinionCount: dataState.opinionCount,
      fileCount: _fileCount || dataState.fileCount,
    })
  }, [dataState.opinionCount, dataState.fileCount, _tabActiveKey])

  // useEffect(() => {
  // nowTab 当前激活tab项
  detailTabUpdate = ({ taskId, nowTab }: any) => {
    const findId = getQueryId({ dataState, from, taskId })
    if (nowTab == '1') {
      refreshDetailRight({ taskId })
      setState({ ...state, nowTab })
    } else {
      queryTaskDetailApi({ id: findId }).then((data: any) => {
        const { opinionCount, fileCount } = data.data.MAIN ? data.data.MAIN : data || {}
        _fileCount = fileCount
        setState({ ...state, nowTab, opinionCount, fileCount })
      })
    }
  }
  // }, [])
  /**
   * tab切换
   */
  const tabsChange = (key: any) => {
    _tabActiveKey = key
    if (key == 4) {
      setState({
        ...state,
        fileCount: _fileCount || state.fileCount,
        opinionCount: dataState.opinionCount,
        nowTab: key,
        gettime: 0,
      })
    } else {
      setState({
        ...state,
        fileCount: _fileCount || state.fileCount,
        opinionCount: dataState.opinionCount,
        nowTab: key,
      })
    }
  }

  return (
    <Tabs
      className="detail_tabs"
      activeKey={state.nowTab || '1'}
      // defaultActiveKey={defaultActiveKey || '1'}
      onChange={tabsChange}
    >
      <TabPane
        tab={
          detailType
            ? $intl.get('Dynamic')
            : dataState.type == 1
            ? $intl.get('projectDynamic')
            : $intl.get('taskDynamic')
        } //type:1--任务；5--项目
        key="1"
      >
        {/* 任务动态组件 */}
        <TaskDynamic
          param={{
            taskDetail: dataState.detailMain,
          }}
        />
      </TabPane>
      {/* 任务不存在 detailType，只有任务类型才显示检查项*/}
      {!detailType && (
        <TabPane tab="Check清单" key="4">
          <CheckList
            taskId={queryId}
            ascriptionId={dataState.ascriptionId}
            ascriptionName={dataState.ascriptionName}
            cutkey={state.nowTab}
            date={state.gettime}
            editAuth={editAuth}
            flag={dataState.flag}
            // refreshType={state.refreshType}
            addCheckList={() => {
              setState({
                ...state,
                nowTab: '4',
                gettime: Date.parse(new Date().toString()),
                refreshType: 'add',
              })
            }}
            editCheckList={(param: any) => {
              setState({ ...state, nowTab: '4', refreshType: 'init' })
              return editCheckList(param)
            }}
          />
        </TabPane>
      )}

      <TabPane
        // {state.opinionCount || 0}
        tab={`${
          detailType
            ? $intl.get('remark')
            : dataState.type == 1
            ? $intl.get('projectRemark')
            : $intl.get('taskRemark')
        }(${state.opinionCount || 0})`}
        key="2"
      >
        <TaskSynergy
          param={{
            ...dataState.detailMain,
            cutkey: state.nowTab,
            workPlanType: dataState.workPlanType,
            from: from + '_detail',
            flag: dataState.flag,
            addRemark: () => {
              if (detailType) {
                editMarkModalHandle({ visible: true, source: 'okr', uuid: Maths.uuid() })
              } else {
                editMarkModalHandle({ visible: true, uuid: Maths.uuid() })
              }
            },
            updateTabsThemeNumber: () => {
              // 查询详情更新备注和附件统计
              const findId = getQueryId({ dataState, from })
              queryTaskDetailApi({ id: findId || '' }).then((data: any) => {
                const myData = JSON.parse(JSON.stringify(data.data.MAIN ? data.data.MAIN : data || {}))
                const { opinionCount, fileCount } = myData
                _tabActiveKey = '2'
                _fileCount = fileCount
                dataState.opinionCount = opinionCount
                state.fileCount = fileCount
                state.nowTab = '2'
                setState({ ...state })
              })
            },
          }}
        />
      </TabPane>
      <TabPane tab={`${$intl.get('filesOverview')}(${state.fileCount || 0})`} key="3">
        {state.nowTab == '3' ? (
          <DetailFileList
            param={{
              taskId: queryId || '',
              ascriptionId: dataState ? dataState.ascriptionId : '',
              fileCount: dataState.fileCount || 0,
            }}
            refresh={dataState.refresh}
          />
        ) : (
          ''
        )}
      </TabPane>
    </Tabs>
  )
}

/**
 * 返回顶部组件
 */
const BackTop = () => {
  /**
   * 返回顶部
   */
  const backTop = () => {
    scrollToTop('other')
  }
  return <span className="img_icon back_top_btn" onClick={backTop}></span>
}
/**
 * 按钮列表渲染
 */
const detailBtnsObj = ({ btnsList }: any) => {
  const btnAuths = {}
  btnsList.map((item: any) => {
    btnAuths[item.name] = item
  })
  return btnAuths
}
/**
 * 详情滚动事件
 */
export const detailScroll = () => {
  // 计算初始标签模块的位置
  const rightCon: any = $('.detailRightAttach')
  // 记录标签模块与顶部距离
  let taskTagTopDiff = 0
  // 记录滚动高度
  let preScrollTop = 0
  // let preScrollLeft = 0
  // 记录右侧固定位置时的滚动高度
  let fixedScrollTop = 0
  $('.taskDetailMid')
    .off('scroll')
    .on('scroll', (e: any) => {
      // 当前滚动节点
      const thisDom: any = $(e.currentTarget)
      const rightOutDom: any = $('.detailRightAttachOut')

      // 当前滚动距离
      const nowScrollTop = thisDom[0].scrollTop

      const thisTop = thisDom.offset().top
      // 上下滚动方向
      const deltaVer = nowScrollTop - preScrollTop

      /***********************************方法1 fixed窗口固定方法*************************** */
      /**
       *计算标签模块距离滚动容器顶部位置，刚好到顶部则固定右侧
       */
      /********1 获取当前标签模块所在位置top值********* */
      const taskTagTop = rightCon.find('.taskTagCont').offset().top
      /********2 滚动条在顶部第一次滚动时，记录下标签模块的offsetTop值********* */
      if (preScrollTop == 0 || nowScrollTop <= 0) {
        // 24是margin值
        taskTagTopDiff = taskTagTop - thisTop
      }

      /**************************************方法2 相对固定方法(相对固定的top值与滚动距离一致)**************************** */
      // a 内容高度未超出当前可见视图，则随着滚动变化top值，达到固定位置的效果
      if (preScrollTop && rightCon[0].clientHeight + 5 < rightOutDom[0].clientHeight) {
        rightCon.css({ position: 'absolute', top: nowScrollTop + 'px' })
      }
      // b 内容高度超出当前可见视图
      else {
        // 向下滚动时,判断标签模块刚好到顶部时，记录下滚动位置（24是保留的与顶部的margin值）
        if (deltaVer > 0 && taskTagTop - thisTop <= 24 && !fixedScrollTop) {
          fixedScrollTop = nowScrollTop
        }
        // 判断如果当前滚动在右侧固定滚动位置之上时，恢复默认非固定状态，在之下时随着滚动变化top值，达到固定位置的效果
        if (!fixedScrollTop || nowScrollTop <= fixedScrollTop) {
          rightCon.css({ position: 'static', top: 'auto' })
        } else {
          rightCon.css({ position: 'absolute', top: nowScrollTop - taskTagTopDiff + 'px' })
        }
      }
      preScrollTop = nowScrollTop
    })
}

/**
 * 详情右侧滚动
 */
export const detailAttachScroll = () => {
  const rightCon: any = $('.detailRightAttachOut')
  // 绑定表格滚动事件
  rightCon.off('mousewheel').on('mousewheel', (e: any) => {
    // console.log('detailRightAttach mousewheel')
    // 下滚时隐藏回到顶部按钮
    if (e.originalEvent.wheelDelta <= 0) {
      rightCon
        .parents('.taskDetailMid')
        .find('.back_top_btn')
        .hide()
    } else {
      rightCon
        .parents('.taskDetailMid')
        .find('.back_top_btn')
        .show()
    }
  })
}
/**
 * 循环任务展示
 */
export const loopsTaskInfo = ({ cycleModel }: any) => {
  let cyctexts = ''
  if (JSON.stringify(cycleModel) != '{}' && cycleModel) {
    const types = cycleModel.cycleType
    if (types == 1) {
      cyctexts = $intl.get('everyDay')
    } else if (types == 2) {
      cyctexts = $intl.get('everyWeek')
    } else if (types == 3) {
      cyctexts = $intl.get('everyMonth')
    } else if (types == 4) {
      cyctexts = $intl.get('everyQuarterly')
    } else if (types == 5) {
      cyctexts = $intl.get('everyHalfYear')
    } else if (types == 6) {
      cyctexts = $intl.get('everyYear')
    } else if (types == 21) {
      cyctexts = $intl.get('everyOtherWeek')
    } else {
      cyctexts = $intl.get('Custom')
    }
  }
  return {
    showTxt: cyctexts,
  }
}

// 设置刘海头显示隐藏
export const setHeaderShowFn = (
  container: string,
  scrollContainer: string,
  // headerContainer: string,
  headerDom: any,
  containerRef: any,
  contentRef: any,
  headerRef: any
) => {
  $(container)
    .off('mousewheel')
    .on('mousewheel', scrollContainer, (e: any) => {
      if (
        !containerRef ||
        !contentRef ||
        !headerRef ||
        !containerRef.current ||
        !contentRef.current ||
        !headerRef.current
      )
        return
      // 如果可是区域小于滚动区域，则刘海头一直显示
      if (containerRef.current.offsetHeight >= contentRef.current.offsetHeight) return
      // 下滚加载分页
      if (e.originalEvent.wheelDelta <= 0) {
        hideShowHeader(headerDom, headerRef, 1)
      } else {
        hideShowHeader(headerDom, headerRef, 0)
      }
    })
}
// 隐藏、显示刘海头 type:0 显示  1 隐藏
export const hideShowHeader = (headerDom: any, headerRef: any, type: number) => {
  const hasClass = headerRef.current.classList.value.split(' ').includes('forcedHide')
  if (!headerDom) {
    return
  }
  // 隐藏
  if (type) {
    if (!hasClass) {
      headerDom
        .addClass('forcedHide')
        .next()
        .removeClass('pad_top_47')
    }
  } else {
    if (hasClass) {
      headerDom
        .removeClass('forcedHide')
        .next()
        .addClass('pad_top_47')
    } else {
      headerDom.next().addClass('pad_top_47')
    }
  }
}
// 如果可视区域小于滚动区域，则刘海头一直显示
export const isCheckHeaderShow = (
  containerRef: any,
  contentRef: any,
  dynamicHeaderDom: any,
  headerRef: any
) => {
  if (
    !containerRef ||
    !contentRef ||
    !headerRef ||
    !containerRef.current ||
    !contentRef.current ||
    !headerRef.current
  )
    return
  if (containerRef.current.offsetHeight >= contentRef.current.offsetHeight) {
    hideShowHeader(dynamicHeaderDom, headerRef, 0)
  }
}

/**
 * Check清单
 */
let checkHeaderDom: any
export const CheckList = ({
  taskId,
  ascriptionId,
  ascriptionName,
  cutkey,
  flag,
  editAuth,
  addCheckList,
}: any) => {
  // const { nowUserId } = $store.getState()
  //是否渲染检查项
  const [initcheck, setInitcheck] = useState({
    init: false,
    refreshType: '',
    enterType: '', //是否是enter新增
    farid: '', //enter新增子节点时父节点id
  })
  //判断输入框是否聚焦1
  // const [isfocus, setIsfocus] = useState(false)
  //检查项初始查询数据
  // const [initCheckData, setInitCheckData] = useState<any>([])
  const initCheckData: any = []
  const containerRef: any = useRef()
  const contentRef: any = useRef()
  const headerRef: any = useRef()
  const checkEntryRef = useRef<any>({})
  useLayoutEffect(() => {
    checkHeaderDom = $('.task-check-header')
    setHeaderShowFn('.detailCheck', '.checkEntry-content', checkHeaderDom, containerRef, contentRef, headerRef)
  }, [])

  useEffect(() => {
    if (cutkey == 4) {
      //   inquireCheck()
      setInitcheck({ ...initcheck, init: true })
      hideShowHeader(checkHeaderDom, headerRef, 0)
      isCheckHeaderShow(containerRef, contentRef, checkHeaderDom, headerRef)
    } else {
      setInitcheck({ ...initcheck, init: false })
    }
  }, [taskId, cutkey])

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <div
        ref={headerRef}
        className={`my-dynamic-header task-check-header flex between margin_20
  `}
      >
        <div className="left">
          <span>Check清单</span>
        </div>
        {flag != 3 && (
          <div className="right">
            <span
              className={`opt_btn mr0 ${editAuth ? '' : 'forcedHide'}`}
              onClick={() => {
                if (editAuth) {
                  setInitcheck({ ...initcheck, init: true })
                  addCheckList()
                  checkEntryRef.current && checkEntryRef.current.addCheckList()
                }
              }}
            >
              <span className="img_icon add_cross_icon"></span>
              <span className="opt_txt">创建check项</span>
            </span>
          </div>
        )}
      </div>
      <div className="taskSupervise pad_top_47" ref={containerRef}>
        <div className="detailCheck pad_hor" ref={contentRef}>
          <CheckEntry
            ref={checkEntryRef}
            initRefresh={initcheck}
            //   times={date}
            param={{
              from: 'details',
              isedit: true, //是否显示状态编辑 未完成 已完成 搁置
              teamId: ascriptionId, //企业id
              teamName: ascriptionName, //企业名称
              taskid: taskId,
              initData: initCheckData || [], //初始化数据
              cutkey: cutkey == '2' ? true : false, //切换tab刷新检查项
              isShowcomment: true, //是否显示评论回复
              iseditCheck: editAuth, //是否可以编辑检查项
              isshowNoneData: true, //无数据是否显示空白页
              containerRef,
              contentRef,
              checkHeaderDom,
              headerRef,
            }}
            getDatas={(datas?: any) => {
              _tabActiveKey = '4'
              // 更新详情tab统计
              detailTabUpdate && detailTabUpdate({ taskId, nowTab: '4' })
            }}
            getfocus={(datas: any) => {
              // setIsfocus(datas)
            }}
            setInitRefresh={() => {
              setInitcheck({ ...initcheck, init: true, refreshType: 'init', enterType: '', farid: '' })
            }}
          ></CheckEntry>
        </div>
      </div>
    </div>
  )
}

/**
 * 跳转到OKR详情
 * @param item 当前OKR单项数据
 */
export const toOKRWindow = (item: {
  id: any
  typeId: any
  name: string
  teamId: any
  teamName: string
  ascriptionType: number
  mainId?: string
  okrModeActive?: string //okr详情默认选中的模式
  [propName: string]: any
}) => {
  const { fromPlanTotype } = $store.getState()
  $store.dispatch({ type: 'FROM_PLAN_TYPE', data: { ...fromPlanTotype, createType: 1 } })
  // 四象限窗口
  if (item.winType == 1) {
    $store.dispatch({ type: 'DIFFERENT_OkR', data: 1 })
    $store.dispatch({ type: 'MINDMAPOKRDATA', data: item })
    $tools.createWindow('okrFourquadrant')
  } else {
    $store.dispatch({
      type: 'OKRWINDOWINFO',
      data: { nowSelectOkr: { ...item, findId: item.typeId }, tabsList: [{ ...item, findId: item.typeId }] },
    })
    $tools.createWindow('OkrDetailWindow')
  }
}

//过滤 inputNumber 只能输入正整数+2位小数
const limitDecimals = (value: any): any => {
  // return value.replace(/^(?!0+(?:\.0+)?$)(?:[1-9]\d*|0)(?:\.\d{1,2})?$/g, '')
  const reg = /^(\-)*(\d+)\.(\d\d).*$/
  // const reg = /^([1-9][0-9]*)(\.[0-9]{2})?$|^(0\.[0-9]{2})$/;
  let newVal = ''
  if (typeof value === 'string') {
    newVal = !isNaN(Number(value)) ? value.replace(reg, '$1$2.$3') : ''
  } else if (typeof value === 'number') {
    newVal = !isNaN(value) ? String(value).replace(reg, '$1$2.$3') : ''
  }
  if (newVal.split('.')[1] && newVal.split('.')[1] == '00') {
    newVal = newVal.split('.')[0]
  }
  return newVal
}
/**
 * 获取查询id
 */
const getQueryId = ({ dataState, taskId }: { dataState: any; taskId?: any; from?: string }) => {
  // 后台更换了typeId为id，前端无需处理了
  const findId = taskId ? taskId : dataState.id
  // if (from?.includes('OKR')) {
  //   findId = dataState.typeId || ''
  // }
  return findId
}
/**
 * 初始计算宽度
 * @param paramObj
 */
export const getDetailWidthInit = (className?: string) => {
  const workPlanCon: any = $('.workPlanCon')
  const okrDetailModal: any = $('.okrDetailModal')
  let diffWid = 1500
  if (className?.includes('OKRDetailContent')) {
    diffWid = className?.includes('okrWideDetail')
      ? workPlanCon.width() - workPlanCon.find('.okrListTable ').width()
      : okrDetailModal.width() - okrDetailModal.find('.okrListTable ').width()
  }

  return diffWid
}

export default DetailRight
