import React, { forwardRef, useContext, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Avatar, Button, Dropdown, Input, message, Spin, Table, Tag, Tooltip } from 'antd'
import { addOkrNodeApi, addOkrTaskApi, editOKRTask, queryOkrFollowUpListApi } from './okrTableListApi'
import './okrTableList.less'
import { cancelRelation, findContacts, saveSupports, sureRelation } from '../../fourQuadrant/getfourData'
import ChooseMenu from '../../fourQuadrant/components/chooseMenu'
import { addTaskNodeApi, OKRSubTree, okrtaskFollow, updateNodeApi } from '../../workdesk/okrKanban/getData'
import { SelectMemberOrg } from '@/src/components/select-member-org'
import Evolveprogress from '../../workdesk/okrKanban/Evolveprogress'
import TaskDelayModal from '../../workdesk/component/taskModule/taskDelayModal'
import DetailModal from '../../task/taskDetails/detailModal'
import { SupportModal } from '@/src/components/supportOKR/supportModal'
import TaskListOpt from '../../workdesk/component/TaskListOpt'
import { cancleTaskFollow, taskFollow } from '../../workdesk/getData'
import { ipcRenderer } from 'electron'
import { useLayoutEffect } from 'react'
import NoneData from '@/src/components/none-data/none-data'
import { planContext } from '../list-card-four/okr-workplan'
import { useDrag, useDrop, DragPreviewImage } from 'react-dnd'
import update from 'immutability-helper'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { requestApi } from '@/src/common/js/ajax'
import { changeInputVal, ShowAlignModel } from '../../workdesk/okrKanban/common'
import { PeriodDate } from '../../task/OKRDetails/PeriodDate'
import { editOKRAffiliationApi } from '../../task/OKRDetails/okrDetailApi'
import { addFastKr } from './common'
import { getStatusOrTime } from '../work-okr-mind/okr-list-org'

export const okrTableContext = React.createContext({})

/**
 * okr表格
 */
/**
 * okr表格
 */
const okrTableTmp: any = {
  columns: [],
  contentList: [],
  expandedRowKey: [],
  aimList: [],
  relateList: [],
  refAreaLine: false, // 是否需要更新okr区域选中线框
}

const tableSource: any = {}
export const setTableSource = ({ key, scrollLoad }: { key: string; scrollLoad?: boolean }) => {
  tableSource[key] = scrollLoad ? { ...tableSource[key] } : { ...okrTableTmp }
}

const okrTaskDetail = {
  visible: false,
  id: 0,
  taskData: {},
  editData: false,
  isaddtask: '',
  detailfrom: '',
  row: undefined,
}

// 点击按钮操作中
let btnOpting = false
let doubleClick: any = null

// 缓存当前列表归属数据
const ascriptionObj: any = {
  progressStatus: 0,
  findType: '',
}
let getNowCode: any = 0

export const OkrTableList = forwardRef(
  (
    {
      initType,
      sourceKey,
      refreshTotalNums,
    }: { initType: string; sourceKey: string; refreshTotalNums?: Function },
    ref: any
  ) => {
    const { nowUser, nowUserId } = $store.getState()
    /**
     * 刷新外部okr列表
     */
    const { okrKanbanRef } = useContext(planContext)
    // 选人插件参数
    const [selMemberOrg, setSelMemberOrg] = useState({
      visible: false,
      teamId: 0,
      sourceType: 'shareToUser', //操作类型
      allowTeamId: [0],
      selectList: [], //选人插件已选成员
      checkboxType: 'checkbox',
      permissionType: 3, //组织架构通讯录范围控制
      showPrefix: false, //不显示部门岗位前缀
      checkableType: [0],
      isDel: false, //不可删除成员
      onSure: {},
    })
    const [delayModal, setDelayModal] = useState({
      visible: false,
      id: '',
      typeId: '',
    })
    //打开关联目标的弹窗
    const [modelHover, setModelHover] = useState<any>({
      show: false,
      hasAuth: false, //取消关联、对其权限
      type: 0, //0---对齐目标  1----关联目标
      name: $intl.get('relateObjective'),
      bom: '-150px',
      itemId: '',
      itemTypeId: '',
      aimlist: [], //向上支撑数据
      relateList: [], //支撑数据
    })
    // 选择支撑弹框
    const [support, setSupport] = useState<any>({
      visible: false,
      content: [],
      okrContent: [],
      type: 0, //0选择任务 1选择OKR
      mainParentId: '', //保存的当前O及KR的ID
      teamId: '',
      title: '', //弹窗标题
      periodId: '', //所属周期id
      row: {},
    })
    // 详情弹框
    const detailModalRef = useRef<any>({})

    /**
     * 初始化表格列
     */
    const columnsInit = [
      {
        title: '整合',
        dataIndex: 'gradeMergeCol',
        key: 'gradeMergeCol',
        width: '100%',
        render: (value: any, row: any, index: number) => {
          return renderCell({
            value,
            row,
            index,
            colName: 'gradeMergeCol',
          })
        },
      },
    ]
    const [state, setStateData] = useState<any>({
      ...tableSource[sourceKey],
      visible: true,
      loading: false,
      isFollowWorkDesk: false, //关注人工作台引用
      filterMoules: null, //过滤参数
      sourceFrom: 'okrFollowUp',
      // tableHeight: 'calc(100% - 10px)',
    })

    /**
     * state设置
     * @param paramObj
     */
    const setState = (paramObj: any, noColumns?: boolean) => {
      const { contentList } = paramObj
      // 更新列表时跟随更新列属性以重新render刷新节点
      if (contentList && !noColumns) {
        paramObj.columns = columnsInit
      }
      tableSource[sourceKey] = { ...tableSource[sourceKey], ...paramObj }
      setStateData({ ...state, ...tableSource[sourceKey] })
      if (contentList && tableSource[sourceKey]?.refAreaLine) {
        styleline({ boxNode: '.' + sourceKey })
      }
    }
    /**
     * 初始化监听(不使用ref初始化时调用)
     */
    useEffect(() => {
      if (initType != 'ref') {
        initFn()
      }
      ipcRenderer.on('refresh_operated_task', ipcOnFn)
      return () => {
        tableSource[sourceKey] = {}
      }
    }, [])
    // 监听展开状态变化时，添加当前okr区域边框
    useLayoutEffect(() => {
      setTimeout(() => {
        styleline({ boxNode: '.' + sourceKey })
      }, 200)
    }, [state.expandedRowKey])
    // 订阅进展汇报消息，刷新进展状态数据
    const ipcOnFn = (_: any, data: any) => {
      const { taskIds } = data.data
      if (!taskIds) return
      refreshTableData({
        taskIds: [...taskIds],
        optType: 'updateProgressStatus',
      })
    }
    /**
     * 渲染表格td内容
     * @param paramObj
     */
    const renderCell = (paramObj: any) => {
      const obj: any = {
        children: '',
        props: {},
      }
      obj.children = <RenderCellCom param={paramObj} toTaskDetail={toTaskDetail} index={paramObj.index} />
      return obj
    }
    /**
     * 拖动后更新源任务和目标任务 nowdata替换的元素 moveData拖动的元素
     */
    const dragUpdateTask = (nowdata: any, moveData: any, tableList: any) => {
      let removeI: any = null, //移除的位置
        targetI = 0 //原来的位置
      // 是否查询到需要移除的源节点
      // let isRemove = false
      for (let i = 0; i < tableList.length; i++) {
        const item = tableList[i]
        if (item.id == moveData.id) {
          removeI = i
          // isRemove = true
        }
        // 拖至首层,记录拖至位置，之后插入新数据
        if (item.id == nowdata.id) {
          targetI = i
        }
      }
      if (targetI == tableList.length - 1 || removeI == tableList.length - 1) {
        tableSource[sourceKey].refAreaLine = true
      }
      return update(tableList, {
        $splice: [
          [removeI, 1],
          [targetI, 0, moveData],
        ],
      })
    }

    /**
     * 选择支撑显示
     */
    const setSelSupport = (paramObj: any) => {
      setSupport({ ...support, ...paramObj })
    }
    /**
     * 初始化调用
     */
    const initFn = (paramObj?: any) => {
      // 初始table数据
      setTableSource({ key: sourceKey, scrollLoad: paramObj?.scrollLoad })
      const { nowUserId } = $store.getState()

      tableSource[sourceKey].refAreaLine = false
      setState({ loading: true })
      setModelHover({ ...modelHover, show: false })
      const infoObj = paramObj ? paramObj : {}
      const { status, findType, queryParam } = infoObj
      const { mySelf, teamId, periodId, ascriptionId, ascriptionType } = queryParam || {}
      // updateRate:按更新率查询 后者：按风险项
      const url =
        findType == 'updateRate'
          ? '/task/okrSummaryGraph/queryUpdateRateInside'
          : findType == 'state' //状态分布查询
          ? '/task/okrSummaryGraph/queryProcessStatusInside'
          : '/task/okrSummaryGraph/queryRiskItemInside'
      tableSource[sourceKey].columns = columnsInit
      let param: any = {}
      let json = false
      if (queryParam) {
        param = {
          pageNo: 0,
          pageSize: 10,
          ascriptionType,
          ascriptionId,
          teamId,
          status: queryParam.status,
          mySelf, //我负责的
          periodId, //周期 0-全部
          sortType: 0,
          grades: queryParam.grades,
          processStates: queryParam.processStates,
          scores: queryParam.scores,
          cci: queryParam.cci,
          sortField: 1,
          operateUser: nowUserId,
          option: status || 0,
        }
        json = true
      } else {
        param = {
          status: status || 0,
          userId: nowUserId,
        }
      }
      // 根据状态分布查询列表
      ascriptionObj.progressStatus = status
      ascriptionObj.findType = findType
      param.taskProcessStatus = status != undefined ? status : 1
      ascriptionObj.apiParam = param
      ascriptionObj.apiUrl = url
      // okr模态框
      if (findType == 'okrModule') {
        const list = paramObj?.dataList || []
        const packData = packTableList({ contentList: list, dataType: 'root' })

        // 需求不展开第一层数据
        // const delExpRow = packData.contentList[0]
        // if (delExpRow && delExpRow.hasChild > 0) {
        //   expandedRow({
        //     expanded: true,
        //     record: delExpRow,
        //     queryType: 'init',
        //     aimList: packData.newAimList,
        //     relateList: packData.newRelateList,
        //     expandedRowKey: [delExpRow.key],
        //   })
        // } else {
        // console.log('sourceKeydata---', tableSource[sourceKey])
        // 滚动加载数据
        if (paramObj?.scrollLoad) {
          tableSource[sourceKey].contentList = [...tableSource[sourceKey].contentList, ...packData.contentList]
          setStateData({ ...state, ...tableSource[sourceKey] })
        } else {
          tableSource[sourceKey].contentList = [...packData.contentList]
          setState(
            {
              ...tableSource[sourceKey],
              contentList: [...packData.contentList],
              // aimList: packData.newAimList,
              // relateList: packData.newRelateList,
              expandedRowKey: [],
              loading: false,
              isFollowWorkDesk: paramObj?.isFollowWorkDesk || false,
              filterMoules: paramObj?.filterMoules,
              sourceFrom: paramObj?.fromType,
            },
            true
          )
        }
      } else {
        queryOkrFollowUpListApi({ param, url, json }).then((data: any) => {
          let list = data.data?.content || []
          if (
            url.includes('queryUpdateRateInside') ||
            url.includes('queryRiskItemInside') ||
            url.includes('queryProcessStatusInside')
          ) {
            list = data.data || []
          }
          const packData = packTableList({ contentList: list, dataType: 'root' })
          tableSource[sourceKey].contentList = [...packData.contentList]
          // 需求不展开第一层数据
          // const delExpRow = packData.contentList[0]
          // if (delExpRow && delExpRow.hasChild > 0) {
          //   expandedRow({
          //     expanded: true,
          //     record: delExpRow,
          //     queryType: 'init',
          //     aimList: packData.newAimList,
          //     relateList: packData.newRelateList,
          //     expandedRowKey: [delExpRow.key],
          //   })
          // } else {
          setState(
            {
              ...tableSource[sourceKey],
              contentList: [...packData.contentList],
              // aimList: packData.newAimList,
              // relateList: packData.newRelateList,
              expandedRowKey: [],
              loading: false,
            },
            true
          )
          // }
        })
      }
    }

    /**
     * 打开任务详情
     * @param item
     */
    const toTaskDetail = (item: any, { from }: any) => {
      const nowItem = { ...item }

      // 过滤O 无用数据
      if (item?.type == 2 && item?.children?.length > 0) {
        nowItem.children = item.children.filter((item: any) => item.type != 31)
      }

      const params = {
        from: 'OKR_okrFollowUp',
        code: 'table',
        id: from == 'delayTask' ? item.id : item.typeId,
        taskData: { ...nowItem },
        // isaddtask: opentaskdetail.isaddtask,
        visible: true,
        taskType: '',
        callbackFn: ({
          optType,
          findId,
          newChildId,
          periodIds,
          from,
        }: {
          optType: any
          findId?: number
          newChildId?: number
          periodIds?: any
          from?: string
        }) => {
          console.log('types------------------:', optType, findId)
          // 刷新外部 okr列表数据
          // refreshOutList({
          //   optType,
          //   taskIds: [findId],
          //   newChildId,
          //   periodIds: periodIds,
          // })
          // 找出当前修改项 刷新该条数据
          let _nowEditdetail: any = null
          if (findId) {
            const findItem = {
              findItem: {},
            }
            findNowTask({ dataList: tableSource[sourceKey].contentList, findId, findItem })
            _nowEditdetail = findItem.findItem
          } else {
            _nowEditdetail = okrTaskDetail
          }
          console.log('_nowEditdetail', _nowEditdetail)

          // if (JSON.stringify(_nowEditdetail) == '{}') return

          if (Object.keys(_nowEditdetail)?.length == 0) return

          if (
            optType == 'del' || //删除 kr task
            optType == 'cancelSupport' || //取消支撑
            optType == 'recallDistributeAll' || //任务、kr 撤回整链
            optType == 'delAllChain' //任务、kr 删除整链
          ) {
            refreshTableData({
              optType,
              taskIds: [_nowEditdetail.typeId],
              parentId: _nowEditdetail.parentTypeId,
              delId: _nowEditdetail.typeId,
              from: from + '_detail',
            })
          } else if (
            optType == 'relKR' || // 删除O
            optType == 'editPeriodId' || //更改O周期
            optType == 'addChildTask' || ///添加子任务
            optType == 'relateTask' || ///关联任务
            optType == 'addTask' || ///添加子任务
            optType == 'addKr' || ///添加KR
            optType == 'distributeAll' //派发整链 顶层为Kr
          ) {
            refreshTableData({
              optType,
              taskIds: [_nowEditdetail.typeId],
              newChildId,
              parentId:
                optType == 'addChildTask' ||
                optType == 'addTask' ||
                optType == 'addKr' ||
                optType == 'relateTask'
                  ? _nowEditdetail.typeId
                  : '',
              from: from + '_detail',
            })
          } else if (optType == 'followTask') {
            okrFollowFn({ record: _nowEditdetail, from: 'other' })
          } else {
            if (_nowEditdetail) {
              refreshTableData({
                optType,
                taskIds: [findId ? _nowEditdetail.typeId : _nowEditdetail.row.typeId],
              })
            }
          }
        },
      }
      if (detailModalRef.current && detailModalRef.current.setState) {
        //函数组件
        detailModalRef.current.setState(params)
      }
    }

    /**
     * 暴露给父组件的方法
     */
    useImperativeHandle(ref, () => ({
      /**
       * 刷新方法
       */
      setState: (paramObj: any) => {
        setState({ ...state, ...paramObj })
      },
      // 初始内部表数据
      initFn: (paramObj: any) => {
        initFn(paramObj)
        // console.log(paramObj)
      },
      // 刷新table数据
      refreshTableData,
    }))

    // ================================表格相关方法================================//
    /**
     * 封装表格数据
     */
    const packTableList = ({
      contentList,
      parentId,
      parentTypeId,
      mainId,
      dataType,
      teamId,
      teamName,
      taskChild,
    }: any): any => {
      // const newAimList: any = []
      // const newRelateList: any = []
      const tableList: any = []
      contentList.map((item: globalInterface.WorkPlanTaskProps, index: number) => {
        let classline = ''
        if (item.hasChild == 0 || index != 0) {
          classline = 'selfline'
        } else {
          classline = 'firstline'
        }
        // if (dataType && dataType == 'root') {
        //   newAimList.push({
        //     id: item.id,
        //     list: item.countModel?.topRelation || {},
        //   })
        //   newRelateList.push({
        //     id: item.id,
        //     list: item.countModel?.bottomRelation || {},
        //   })
        // }

        // 添加父级id标识
        if (parentId) {
          item.parentId = parentId
        }
        if (parentTypeId) {
          item.parentTypeId = parentTypeId
        }
        if (!item.mainId && mainId) {
          item.mainId = mainId
        }
        if (!item.teamId && teamId) {
          item.teamId = teamId
        }
        if (!item.teamName && teamName) {
          item.teamName = teamName
        }
        // const children = item.hasChild || []
        const children = item.hasChild ? [] : undefined
        const newItem = {
          ...item,
          key: item.id + '',
          classline,
          taskChild,
          children,
        }
        tableList.push(newItem)
      })
      return { contentList: tableList }
      // return { contentList: tableList, newAimList, newRelateList }
    }

    //设置tr的class
    const setRowClassName = (record: any) => {
      let _classname = ''
      if (record.subTaskCount === 0) {
        _classname = 'noExpandable'
      } else {
        _classname = ''
      }
      if (record.type == 2) {
        _classname += ' o_content_tr'
      }
      if (record.type == 3) {
        _classname += ' kr_content_tr'
      }
      if (record.type == 1) {
        _classname += ' task_content_tr'
      }
      if (state.contentList.length > 0) {
        if (state.contentList[0].key == record.id) {
          _classname += ' pitch_on'
        }
      }
      // 关注工作台控制操作权限
      if (record.hasAuth == 0 || state.isFollowWorkDesk) {
        //没有操作权限
        _classname += ' okrNoAuth'
        if (record.type == 31) {
          _classname += ' add_kr_tr'
        }
      }

      if (record.classline) {
        _classname += ` ${record.classline}`
      }
      return _classname
    }

    //递归插入任务列表子元素
    const updateTaskData = ({
      tableData,
      parentId,
      childData,
    }: {
      tableData: any
      parentId: number
      childData: Array<any>
    }) => {
      tableData.find((item: any) => {
        if (item.id === parentId) {
          item.children = childData
          return tableData
        }
        if (item.children && item.children.length > 0) {
          updateTaskData({ tableData: item.children, parentId, childData })
        }
      })
    }
    /**
     * 查询子级
     * @param record
     * @param type
     * @param expandRow
     */
    const findSubOKRlist = ({ row, expandKeys, queryType, aimList, relateList }: any) => {
      setState({ loading: true })
      let taskChild = false
      if (row.type == 1) {
        //点击为当前节点为任务状态 子任务不需要展示Task标识
        taskChild = true
      }
      const nowTaskId = row.id
      const param = {
        typeId: row.typeId,
        userId: nowUserId,
        // isPlan: '1', //0任务 1规划
        // queryStatus: '1', //1：不查询归档任务
        // sortRule: 1, //0无 1 KR顺序且在任务之前
      }
      // const url = 'task/work/plan/findTree'
      const url = 'task/work/plan/relation/findKrTaskList'
      OKRSubTree(param, url).then((res: any) => {
        if (res.returnCode == 0) {
          let childTaskData = res.dataList || []
          /* 为其O添加kr入口标记*/
          if (row?.type == 2) childTaskData = addFastKr({ list: childTaskData, parentRow: row })

          const packData = packTableList({
            contentList: childTaskData,
            parentId: nowTaskId,
            parentTypeId: row.typeId,
            parentType: row.type,
            mainId: row.mainId,
            teamId: row.teamId,
            teamName: row.teamName,
            taskChild,
          })
          //动态添加任务子任务
          const newTable = tableSource[sourceKey].contentList.concat([])
          updateTaskData({ tableData: newTable, parentId: nowTaskId, childData: packData.contentList })
          const newexpandKeys = expandKeys ? expandKeys : tableSource[sourceKey].expandedRowKey
          // 初始默认加载第一层时
          if (queryType == 'init') {
            setState(
              {
                ...tableSource[sourceKey],
                contentList: [...tableSource[sourceKey]?.contentList],
                aimList,
                relateList,
                expandedRowKey: [...expandKeys],
                loading: false,
              },
              true
            )
          } else {
            setState(
              {
                contentList: newTable,
                pageNo: 0,
                pageSize: 20,
                expandedRowKey: [...newexpandKeys],
                loading: false,
              },
              true
            )
          }
          if (
            getNowCode &&
            getNowCode.parentRow &&
            (getNowCode.type == 'kr_task' || getNowCode.type == 'task_task')
          ) {
            addTaskChildren({ parentRow: getNowCode.parentRow, type: getNowCode.type })
            getNowCode = 0
          }
        }
      })
    }

    /**
     * 展开行
     */
    const expandedRow = ({
      expanded,
      record,
      queryType,
      aimList,
      relateList,
      expandedRowKey,
    }: {
      expanded: any
      record: any
      queryType?: string
      aimList?: any
      relateList?: any
      expandedRowKey?: any
    }) => {
      const expandedKeys: string[] =
        queryType == 'init' ? (expandedRowKey ? expandedRowKey : []) : tableSource[sourceKey].expandedRowKey
      let expandRow: any = []
      //查询子节点
      if (expanded) {
        if (!expandedKeys.includes(record.key)) {
          expandedKeys.push(record.key)
        }
        expandRow = [...expandedKeys]
        if (record.type == 2) {
          $('.okrListTable')
            .find(`.o_content_tr`)
            .removeClass('pitch_on')
          $('.okrListTable')
            .find(`.o_content_tr[data-row-key=${record.key}]`)
            .addClass('pitch_on')
        }
        // 有子级且未加载过数据则请求接口
        // if (!record.children || record.children.length == 0) {
        findSubOKRlist({ row: record, expandKeys: expandRow, queryType, aimList, relateList })
        // } else {
        //   if (
        //     getNowCode &&
        //     getNowCode.parentRow &&
        //     (getNowCode.type == 'kr_task' || getNowCode.type == 'task_task')
        //   ) {
        //     addTaskChildren({ parentRow: getNowCode.parentRow, type: getNowCode.type })
        //     getNowCode = 0
        //   } else {
        //     setState({ expandedRowKey: [...expandRow] })
        //   }
        // }
      } else {
        expandRow = expandedKeys.filter(RowKey => RowKey != record.key)
        setState({ expandedRowKey: [...expandRow] })
      }
    }

    // ================================表格内部操作相关方法================================//
    /**
     * 选择负责人确认
     */
    const selLiberOrgSure = ({ value, data, selectItem }: any) => {
      if (value == 1) {
        //更改责任人
        const param = {
          id: data.id, //任务id
          ascriptionId: data.liable.userId || data.liable.curId, //归属Id
          ascriptionType: 0, //归属类型0个人2企业 3部门
          deptId: data.liable.deptId, //部门Id
          roleId: data.liable.roleId, //岗位Id
          userId: data.liable.userId || data.liable.curId, //用户Id
          account: $store.getState().nowAccount, //帐号
          onlyUser: 1,
          operateUser: nowUserId,
          operateUserName: nowUser,
        }
        addTaskNodeApi(param, '/task/transFer/workPlanTransferTask').then((resData: any) => {
          if (resData.returnCode == 0) {
            message.success('修改成功')
          }
          refreshTableData({
            optType: 'editLiber',
            taskIds: [selectItem.typeId],
          })
        })
      } else if (value == 2) {
        const selectListCheck: any = []
        if (selectItem.liableUser) {
          selectListCheck.push({
            // cmyId: selectItem.teamId || selectItem.enterpriseId,
            cmyName: selectItem.teamName || selectItem.enterpriseName,
            ascriptionId: selectItem.liableUser,
            userId: selectItem.liableUser,
            userName: selectItem.liableUsername,
            curId: selectItem.liableUser,
            curName: selectItem.liableUsername,
            curType: 0,
            deptId: selectItem.deptId,
            deptName: selectItem.deptName,
            roleId: selectItem.roleId,
            roleName: selectItem.roleName,
            profile: selectItem.liableUserProfile || '',
          })
        }
        setSelMemberOrg({
          ...selMemberOrg,
          visible: true,
          selectList: selectListCheck,
          checkboxType: 'radio',
          sourceType: 'changeUser',
          allowTeamId:
            selectItem.teamId || selectItem.enterpriseId ? [selectItem.teamId || selectItem.enterpriseId] : [],
          teamId: selectItem.teamId || selectItem.enterpriseId,
          checkableType: [0],
          isDel: false,
          onSure: (dataList: any) => {
            selMemberSure(dataList, selectItem)
          },
        })
      } else if (value == 3) {
        // 选中归属
        const selectList: any = []
        const attachobj = selectItem.attach

        // const belongTxt = (attachobj.typeName ? attachobj.typeName + '-' : '') + selectItem.teamName
        const profile = attachobj.profile || ''
        // if (attachobj.type == 2) {
        //   //公司
        //   profile = attachobj.profile || ''
        // } else if (attachobj.type == 3) {
        //   //部门
        //   profile = attachobj.profile || ''
        // } else {
        //   //个人
        //   profile = attachobj.profile || ''
        // }

        if (attachobj.typeId && attachobj.typeId != -1) {
          selectList.push({
            curId: attachobj.type == 0 ? '' : attachobj.typeId,
            curName: attachobj.typeName,
            cmyName: selectItem.teamName,
            cmyId: selectItem.teamId,
            account: '',
            curType: attachobj.type || 0,
            profile,
          })
        }
        const memberOrg: any = {
          title: '选择归属',
          sourceType: 'taskBelong',
          addShowOkrText: 'okr',
          visible: true,
          selectList,
          allowTeamId: [selectItem.teamId || ''],
          checkboxType: 'radio',
          permissionType: 1, //组织架构通讯录范围控制
          checkableType: [0, 2, 3],
          isDel: false,
          noQueryProfile: true, //初始进入不查询头像
          onSure: (dataList: any) => {
            console.log('选项归属数据：', dataList)
            editMembers(dataList, selectItem.type, selectItem.typeId)
          },
        }
        setSelMemberOrg(memberOrg)
      }
    }
    /**
     *
     * @param dataList 人员选择弹出框确认的数据
     * @param type onlyUser为0
     * @param typeId O归属id
     * @returns
     */
    const editMembers = (dataList: any, type: number, typeId: number) => {
      if (dataList.length == 0) {
        return
      }
      const userObj = dataList[0] || {}
      const param = {
        id: typeId,
        operateUser: nowUserId,
        operateUserName: nowUser,
        ascriptionId: userObj.userId || userObj.curId,
        ascriptionType: userObj.curType || 0,
        deptId: userObj.deptId,
        roleId: userObj.roleId,
        userId: userObj.userId,
        account: userObj.account || '',
        onlyUser: type,
      }
      editOKRAffiliationApi(param).then((res: any) => {
        // 调取外部刷新列表
        refreshTableData({
          optType: 'changeBelong',
          taskIds: [typeId],
        })
      })
    }
    //确认责任人选择
    const selMemberSure = (dataList: any, selectedId: any) => {
      //派发走任务变更归属(调用任务变更属性接口) -----------------
      if ((selectedId.status == 4 || selectedId.status == 3) && selectedId.type != 2 && selectedId.type != 3) {
        //更改责任人
        const dataParam: any = {
          liable: {},
          attach: {
            star: '',
            type: selectedId.ascriptionType, //0 个人  2企业  3部门
            typeId: selectedId.ascriptionId,
          },
          id: selectedId.typeId,
          operateUser: nowUserId,
          operateUserName: nowUser,
          onlyUser: 1,
        }
        if (dataList[0].curType == 0) {
          dataParam.liable = {
            deptId: dataList[0].deptId,
            deptName: dataList[0].deptId,
            roleId: dataList[0].parentId,
            roleName: dataList[0].parentName,
            userId: dataList[0].userId || dataList[0].curId,
            username: dataList[0].curName,
          }
        }
        addTaskNodeApi(dataParam, '/task/modify/id').then((res: any) => {
          if (res.returnCode == 0) {
            message.success('修改成功')
          }
          refreshTableData({
            optType: 'editLiber',
            taskIds: [selectedId.typeId],
          })
        }) // 更改任务归属(需判断走审批状态)
      } else {
        //未派发
        const dataParam = {
          id: selectedId.typeId, //任务id
          ascriptionId: dataList[0].curId, //归属Id
          ascriptionType: dataList[0].curType, //归属类型0个人2企业 3部门
          deptId: dataList[0].deptId, //部门Id
          roleId: dataList[0].parentId, //岗位Id
          userId: dataList[0].userId || dataList[0].curId, //用户Id
          account: dataList[0].account, //帐号
          onlyUser: 1,
          operateUser: nowUserId,
          operateUserName: nowUser,
        }
        //未派发走任务变更归属(调用工作规划变更归属接口) -----------------
        addTaskNodeApi(dataParam, '/task/transFer/workPlanTransferTask').then((res: any) => {
          if (res.returnCode == 0) {
            message.success('修改成功')
          }
          refreshTableData({
            optType: 'editLiber',
            taskIds: [selectedId.typeId],
          })
        })
      }
    }

    //关联目标 对齐目标
    const pushOkrContentFn = ({ callbackData }: any) => {
      const row = support.row
      const json1 = callbackData || []
      let json2 = [...state.relateList]
      // 向上支撑
      if (support.supportDir == 0) {
        json2 = [...state.aimList]
      }
      const addIds: number[] = []
      const addTypeIds: number[] = []
      for (const item1 of json1) {
        let flag = true
        for (const item2 of json2) {
          if (item1.key == item2.planId) {
            flag = false
          }
        }
        if (flag) {
          addIds.push(item1.key)
          addTypeIds.push(item1.typeId)
        }
      }
      sureRelation(support.supportDir, row.id, addIds).then(() => {
        refreshTableData({
          taskIds: [row.typeId, ...addTypeIds],
          optType: 'upSupports',
        })
      })
    }

    /**
     * 关联任务
     */
    const pushTaskContentFn = ({ callbackData }: any) => {
      const row = support.row || {}
      saveSupports(callbackData[0].id, [
        {
          mainId: row?.mainId,
          mainParentId: row.id,
          isExtends: false,
        },
      ]).then((_: any) => {
        //局部刷新
        if (support.row) {
          refreshTableData({
            taskIds: [callbackData[0].id],
            optType: 'relateTask',
            newChildId: callbackData[0].id,
            parentId: row.typeId,
          })
        }
      })
    }

    //创建子任务及关键结果(kr)
    const addTaskChildren = ({ parentRow, type }: { parentRow: any; type?: any }) => {
      // const newParent = JSON.parse(JSON.stringify(parentRow))
      const item: any = {
        id: 0,
        name: '',
        key: '',
        ascriptionType: -1,
        ascriptionId: 0,
        taskType: 0,
        hasChild: 0,
        teamId: parentRow.teamId,
        teamName: parentRow.teamName,
        mainId: parentRow.mainId,
        endTime: parentRow.endTime,
        parentId: parentRow.id,
        parentTypeId: parentRow.typeId,
        parentType: parentRow.type,
        parentHasChild: parentRow.hasChild,
        isAdd: true,
      }
      if (type == 'kr') {
        //创建KR
        item.type = 3
      } else {
        item.type = 1
      }
      if (parentRow.children && parentRow.children.filter((element: any) => element.key == 0).length > 0) {
        return false
      }
      parentRow.children = parentRow.children || []
      let insertNum = 0
      let iskrnode = false
      const newChildren = {
        ...item,
        classline: item.classline,
      }
      if (type == 'kr') {
        //添加KR需要插入到KR最后一个
        if (parentRow.children.length > 0) {
          for (let i = 0; i < parentRow.children.length; i++) {
            if (parentRow.children[i].type == 1) {
              insertNum = i
              iskrnode = true
              break
            }
          }
          if (!iskrnode) {
            insertNum = parentRow.children.length
          }
          insertNum = insertNum - 1
        } else {
          insertNum = 0
        }
        parentRow.children.splice(insertNum, 0, newChildren)
      } else {
        //任务
        parentRow.children.push(newChildren)
      }
      parentRow.subTaskCount = parentRow.subTaskCount + 1
      parentRow.hasChild = parentRow.hasChild + 1
      tableSource[sourceKey].expandedRowKey.push(parentRow.key)
      setState({
        contentList: [...tableSource[sourceKey]?.contentList],
        expandedRowKey: [...tableSource[sourceKey]?.expandedRowKey],
      })
    }

    //OKR关注
    const okrFollowFn = ({ record }: { record: any; from?: string }) => {
      // console.log('record:', record, from)
      let _url = ''
      let isfollows = false
      if (record.type == 1) {
        if (record.isFollow && record.isFollow == 1) {
          cancleTaskFollow({ taskId: record.typeId, userId: nowUserId }).then(res => {
            message.success($intl.get('cancelFollowSuc'))
            refreshTableData({ optType: 'cancelFollow', taskIds: [record.typeId] })
          })
        } else {
          taskFollow({
            belong: 'org',
            belongId: record.ascriptionId,
            belongName: record.teamName,
            userId: nowUserId,
            followType: 'task',
            followId: record.typeId,
          }).then(_ => {
            message.success($intl.get('followSuc'))
            refreshTableData({ optType: 'cancelFollow', taskIds: [record.typeId] })
          })
        }
      } else {
        if (record.isFollow && record.isFollow == 1) {
          _url = '/task/work/plan/attention/cancel'
          isfollows = false
        } else {
          _url = '/task/work/plan/attention/add'
          isfollows = true
        }

        const param = {
          planId: record.id,
          userId: nowUserId,
        }
        okrtaskFollow(param, _url).then((res: any) => {
          if (res.returnCode == 0) {
            if (isfollows) {
              message.success($intl.get('followSuc'))
            } else {
              message.success($intl.get('cancelFollowSuc'))
            }
            refreshTableData({ optType: 'cancelFollow', taskIds: [record.typeId] })
          }
        })
      }
    }

    /**
     * 刷新公共数据方法
     */
    const refreshTableData = (paramObj: {
      taskIds: any[]
      optType?: string
      parentId?: any
      newChild?: any
      newChildId?: any //新增子级的id，用于查询新数据
      delId?: any
      from?: any
      // replaceNow:当前任务替换方式
      addType?: string
      nowRow?: any
    }) => {
      const { taskIds, optType, parentId, delId, newChildId, from, addType, nowRow } = paramObj

      // 四象限创建任务 为草稿任务，此列表无需显示
      if (from && from.includes('fourQuadrant') && optType == 'addTask') {
        return
      }
      // if (!from || (from && !from.includes('detail'))) {
      if (sourceKey != 'okrKanbanTable') {
        refreshOutList(paramObj)
      }

      let isSingele = 1
      // 需要查询的任务id列表
      let taskIdList: any = [...taskIds]
      const findItem: any = {
        findItem: {},
        isDel: false,
      }
      const replaceObj = {
        dataList: tableSource[sourceKey].contentList || [],
        taskIds: taskIdList,
        newDatas: [],
        finded: 0,
      }
      switch (optType) {
        case 'updateProgressStatus': //更新进展
        case 'changeBelong': //更新归属
          break
        case 'updateProgressStatusDel': //穿透列表更新进展后需要从当前移除
        case 'upPeriodId': //更新周期
        case 'relKR': //删除O
        case 'distributeSingle': // 派发单项
        case 'recallDistributeSingle': //取消派发单项
        case 'recallDistributeAll': //撤回整链派发
        case 'distributeAll': //整链派发
        case 'cancelFollow':
        case 'delAllChain': //删除整链
          // okr穿透列表更新进展需移除当前
          if (optType == 'updateProgressStatusDel' && sourceKey != 'okrFollowUpModalTable') {
            break
          }

          findNowTask({
            dataList: tableSource[sourceKey].contentList,
            findId: taskIdList[0],
            findItem,
            optType,
          })

          // 关闭当前O,促使重新加载子数据
          if (
            (optType == 'distributeSingle' ||
              optType == 'recallDistributeSingle' ||
              optType == 'recallDistributeAll' ||
              optType == 'distributeAll' ||
              optType == 'delAllChain') &&
            Object.keys(findItem.findItem)?.length > 0
          ) {
            tableSource[sourceKey].expandedRowKey = tableSource[sourceKey].expandedRowKey.filter(
              (item: any) => {
                const parentId = findItem.findItem?.parentId
                if (parentId) {
                  return item != findItem.findItem?.parentId
                } else {
                  return item != findItem.findItem?.key
                }
              }
            )
            taskIdList = []
            break
          }

          // console.log('findItem:', findItem)

          // 仅针对okr看板列表删除O刷新部分（刷新周期统计数量+ 工作台刷新tab O 统计数量）
          if (
            sourceKey == 'okrKanbanTable' &&
            (optType == 'relKR' || optType == 'upPeriodId' || optType == 'cancelFollow')
          ) {
            const filterPeriodId = state.filterMoules?.periodId

            // 针对周期(非全部+当前选择周期，需移除O)
            if (filterPeriodId !== 0 && Object.keys(findItem.findItem)?.length > 0) {
              const list = tableSource[sourceKey].contentList
              const findIdx = list.findIndex((item: any) => item?.key == findItem.findItem?.key)
              if (findIdx > -1) {
                list.splice(findIdx, 1)
              }
            }

            refreshTotalNums?.(paramObj)
          }

          // 没有找到可删除数据则无需刷新
          if (findItem.isDel && findItem.findItem) {
            //满足删除条件，则查询并更新父任务
            taskIdList = []
          }

          break
        // 给O添加KR关键结果
        case 'addKr':
        case 'addTask': // 添加子任务

        // 给O添加任务
        case 'relateTask':
          isSingele = 2
          break
        case 'del':
          findNowTask({ dataList: tableSource[sourceKey].contentList, findId: parentId, findItem })
          if (!findItem.isDel) {
            const findI = findItem.findItem?.children?.findIndex((item: any) => item.typeId == delId)
            if (findI > -1) {
              findItem.findItem.children.splice(findI, 1)
            }
          }
          // 更新被删除的父级
          if (findItem.findItem?.typeId) {
            taskIdList = [findItem.findItem.typeId]
          }
          isSingele = 1
          break
        case 'all':
          return
        default:
          break
      }

      replaceObj.taskIds = taskIdList
      // 新增子节点、删除后更新区域边框
      if (
        optType == 'addKr' ||
        optType == 'addTask' ||
        optType == 'relateTask' ||
        optType == 'del' ||
        optType == 'addChildTask'
      ) {
        tableSource[sourceKey].refAreaLine = true
      }
      // 不查询任务数据，直接更新遍历更改后的的数据
      if (taskIdList.length == 0) {
        setState({ contentList: [...tableSource[sourceKey]?.contentList] })
      } else {
        const params = {
          typeIds: taskIdList.join(','),
          loginUserId: nowUserId,
        }
        //更新单条刷新
        if (isSingele) {
          const findId = isSingele == 2 ? parentId : taskIdList[0]
          // 添加关键结果\关联任务
          if (
            optType == 'addKr' ||
            optType == 'relateTask' ||
            optType == 'addChildTask' ||
            optType == 'addTask'
          ) {
            if (addType != 'replaceNow') {
              findNowTask({ dataList: tableSource[sourceKey].contentList, findId, findItem })
            }
            addTaskRefresh({
              optType,
              data: addType == 'replaceNow' ? nowRow : findItem.findItem,
              newChildId,
              addType,
            })
          } else {
            updateNodeApi(params, '/task/work/plan/findTreeByIdIn').then((resDatas: any) => {
              const dataList = resDatas.dataList || []

              // 封装所查询数据项
              const packData = packTableList({
                contentList: dataList,
              })
              // 更新当前所查询数据项
              replaceFindTask({
                ...replaceObj,
                newDatas: [...packData.contentList],
                parentId: optType == 'del' ? parentId : '',
              })

              setState({
                contentList: [...tableSource[sourceKey]?.contentList],
                columns: [...columnsInit],
              })
            })
          }
          if (getNowCode && getNowCode.parentRow && (getNowCode.type == 'o_task' || getNowCode.type == 'kr')) {
            addTaskChildren({ parentRow: getNowCode.parentRow, type: getNowCode.type })
            getNowCode = 0
          }
        } else {
          setState({
            contentList: [...tableSource[sourceKey]?.contentList],
            columns: [...columnsInit],
          })
        }
      }
    }
    // 刷新okrkanban列表数据
    const refreshOutList = (paramObj: any) => {
      okrKanbanRef?.refreshTableData(paramObj)
    }

    /**
     * 外部新增kr或任务刷新
     * updateType：更新类型 replaceNow：直接替换当前这条数据 其他：在父节点中push
     */
    const addTaskRefresh = async ({ data, optType, newChildId, addType }: any) => {
      let parentRow = data || {}
      if (!data || Object.keys(data)?.length == 0) {
        return
      }

      let isExpandedRow = false
      // 当前任务替换方式
      if (addType == 'replaceNow') {
        const findObj = {
          dataList: tableSource[sourceKey].contentList,
          findId: data.parentTypeId,
          findItem: { findItem: {} },
          optType,
        }
        findNowTask(findObj)
        parentRow = findObj.findItem.findItem
        // 只有正在新增的任务则说明未展开过
        if (parentRow?.children?.length == 1 && parentRow?.children[0]?.isAdd) {
          parentRow.children = []
          isExpandedRow = true
        }
        // 未展开时主动展开子节点
      } else if (addType != 'replaceNow' && !tableSource[sourceKey].expandedRowKey.includes(data.key)) {
        isExpandedRow = true
      }
      if (isExpandedRow) {
        expandedRow({ expanded: true, record: parentRow })
        return
      }
      //没有外部传入的新增子级数据则查询一次
      const urls = '/task/work/plan/findTreeByIdIn'
      const params = {
        typeIds: newChildId,
        loginUserId: nowUserId,
      }
      const resData: any = await updateNodeApi(params, urls)
      const dataList = resData.dataList || []
      const packData = packTableList({
        contentList: dataList,
        parentId: parentRow.id,
        parentTypeId: parentRow.typeId,
        parentType: parentRow.type,
        mainId: parentRow.mainId,
        teamId: parentRow.teamId,
        teamName: parentRow.teamName,
      })
      const newChildren = packData.contentList[0] || {}
      // 把当前数据替换成新数据
      if (addType && addType == 'replaceNow') {
        // 空值后台可能不返，故依据最长字段的
        const findItem = { ...newChildren }
        for (const key in findItem) {
          const val = findItem[key]
          // 排除不更新的健，更新children会导致子节点清空，故不更新
          data[key] = val
        }
        // 创建完成更新创建状态
        data.isAdd = false
      } else {
        let insertNum = 0
        let iskrnode = false
        if (optType == 'addKr') {
          //添加KR需要插入到KR最后一个
          if (data.children.length > 0) {
            for (let i = 0; i < data.children.length; i++) {
              if (data.children[i].type == 1 || data.children[i]?.taskName?.type == 1) {
                insertNum = i
                iskrnode = true
                break
              }
            }
            if (!iskrnode) {
              insertNum = data.children.length
            }
            insertNum = insertNum - 1
          } else {
            insertNum = 0
          }
          data.children.splice(insertNum, 0, newChildren)
        } else {
          //任务
          data.children.push(newChildren)
        }

        data.subTaskCount = data.subTaskCount + 1
        data.hasChild = data.hasChild + 1
      }
      // 更新state的expandedRowKey
      tableSource[sourceKey].expandedRowKey.push(data.key)

      if (
        (getNowCode &&
          getNowCode.parentRow &&
          (getNowCode.type == 'kr_task' || getNowCode.type == 'task_task')) ||
        optType == 'addKr' ||
        optType == 'addChildTask'
      ) {
        let addChildObj = {
          parentRow: getNowCode?.parentRow,
          type: getNowCode?.type,
        }
        if (optType == 'addKr' || optType == 'addChildTask') {
          addChildObj = {
            type: optType == 'addKr' ? 'kr' : 'o_task',
            parentRow,
          }
        }

        // 继续创建 kr+task
        addTaskChildren(addChildObj)
        getNowCode = 0
      } else {
        setState({
          contentList: [...tableSource[sourceKey]?.contentList],
          expandedRowKey: [...tableSource[sourceKey]?.expandedRowKey],
        })
      }
    }
    //设置拖动数据
    const DragableBodyRow = (props: any) => {
      const { data, index, className, ...restProps } = props
      if (!data) {
        return <tr {...restProps} />
      }
      const record: any = data
      // 拖动移入后的hover样式
      const [dropClass, setDropClass] = useState({
        getclass: '',
        begin: true,
        rowData: {},
      })
      // 记录当前拖动放置位置 up目标上方 mid目标中间 down目标下方
      let targetNode: any = null
      const [{ isOver }, drop] = useDrop({
        accept: 'okrdragTable',
        collect: monitor => {
          const { index: dragIndex } = monitor.getItem() || {}
          if (dragIndex === index) {
            return {}
          }
          return {
            isOver: monitor.isOver(),
            dropClassName: dropClass,
          }
        },
        canDrop: (item: any, monitor: any) => {
          let drag = true
          if (
            item.rowData &&
            (item.rowData.mainId != $(dragRef.current).attr('data-mainid') ||
              item.rowData.id == $(dragRef.current).attr('data-row-key'))
          ) {
            drag = false
          }
          return drag
        },
        hover: (_: any, monitor: any) => {
          const item = monitor.getItem() || {}
          if (item.rowData && item.rowData.key === record.typeId) {
            dropClass.getclass = ''
            setDropClass({ ...dropClass })
            return {}
          }
          targetNode = dragRef.current
          targetNode.style.visibility = 'visible'
          let getdragPos = ''
          if (index < item.index) {
            getdragPos = 'up'
          } else {
            getdragPos = 'down'
          }
          dropClass.getclass = getdragPos == 'up' ? 'drop-over-upward' : 'drop-over-downward'
          setDropClass({ ...dropClass })
        },
        drop: (_: any, monitor: any) => {
          const sourceItem = monitor.getItem() || {}
          if (record.mainId == sourceItem.rowData.mainId) {
            requestApi({
              url: '/task/work/plan/krSort',
              param: {
                mainId: record.mainId,
                moveKrId: sourceItem.rowData.key,
                changedKrId: record.id,
              },
              json: true,
            }).then((res: any) => {
              if (res.success) {
                message.success('移动成功')
                tableSource[sourceKey].contentList.forEach((element: any) => {
                  if (element.mainId == record.mainId) {
                    element.children = dragUpdateTask(record, sourceItem.rowData, element.children)
                  }
                })
                setState({
                  contentList: [...tableSource[sourceKey]?.contentList],
                  columns: [...columnsInit],
                })
                refreshTableData({
                  taskIds: [sourceItem.rowData.typeId, record.typeId],
                  optType: 'changePosition',
                })
              } else {
                message.success('移动失败')
              }
            })
          }
        },
      })

      const dragRef: any = useRef(null)
      const [connect, drag, preview] = useDrag({
        item: { type: 'okrdragTable', rowData: data, sourceNode: dragRef, index: index }, //index: index, rowData: rowData,
        collect: (monitor: any) => ({
          isDragging: monitor.isDragging(),
        }),
        canDrag: () => {
          let drag = true
          if (
            $(dragRef.current)
              .find('.part_name_input')
              .is(':visible')
          ) {
            drag = false
          }
          return drag
        },
        begin: (monitor: any) => {
          dropClass.begin = true
          dropClass.rowData = record
          setDropClass({ ...dropClass })
        },
        end: () => {
          // 拖动到组织架构结束后移除所有hover效果
          dropClass.begin = false
          dropClass.rowData = {}
          setDropClass({ ...dropClass })
        },
      })
      if (record && record.type == 3) {
        drag(drop(dragRef))
      }
      const key = data ? data.key : 0
      return (
        <>
          <DragPreviewImage src={$tools.asAssetsPath('/images/okrList/okr-drag.png')} connect={preview} />
          <tr
            key={key}
            ref={dragRef}
            className={`${className} ${isOver ? dropClass.getclass : ''} ${
              connect.isDragging ? 'kr_dis_control' : ''
            }`}
            data-mainid={record.mainId}
            {...restProps}
          />
        </>
      )
    }
    // ***********************************上下文数据***********************************//
    const okrTableObj: any = {
      sourceFrom: state.sourceFrom,
      sourceKey,
      isFollowWorkDesk: state.isFollowWorkDesk,
      setTableState: setState,
      okrFollowFn,
      addTaskChildren,
      addTaskRefresh,
      setSelSupport,
      selLiberOrgSure,
      refreshTableData,
      initFn,
      toTaskDetail,
      setDelayModal,
    }
    // 处理单元格
    const RenderCellCom = ({ param, toTaskDetail, index }: any) => {
      const { colName } = param
      const row = param.row
      let tdHtm: any = ''

      switch (colName) {
        // okr名字
        case 'okrNameCol':
          tdHtm =
            row.type == 2 ? (
              <ONameCol key={row.id + '_0'} row={row} />
            ) : (
              <KrTaskNameCol key={row.id + '_0'} row={row} allDataList={state.contentList} index={index} />
            )
          break
        // 人名
        case 'userNameCol':
          tdHtm = <UserNameCol row={row} />
          break
        //   进展进度
        case 'progressCol':
          tdHtm = <div key={row.id + '_2'} className="cellCont"></div>
          break
        //   权重
        case 'weightCol':
          tdHtm = (
            <div key={row.id + '_3'} className="cellCont">
              <div className="okr_weight_box">
                <p>{$intl.get('weight')}</p>
                <p className="aggravate">{`${row.weights}`}%</p>
              </div>
            </div>
          )
          break
        //   打分
        case 'gradeCol':
          tdHtm = (
            <div key={row.id + '_4'} className="cellCont">
              <div className="okr_mark_box">
                <p>{$intl.get('grade')}</p>
                <p className="aggravate">{row.score}</p>
              </div>
            </div>
          )
          break
        //   进展进度、权重、打分合并列
        case 'gradeMergeCol':
          tdHtm = (
            <div
              // ref={getref}
              className={`cellCont flex between ${
                row.type == 31 && row.hasAuth == 0 ? 'noAuthAddKrCol' : 'hasAuthAddKrCol flex center'
              } ${row.type == 1 && row.taskStatus == 2 ? 'finishedTask' : ''} 
              `}
              data-type={row.type}
              onClick={() => {
                if (row.type == 31) {
                  const nowIndex = tableSource[sourceKey]?.contentList?.findIndex(
                    (elemt: any) => elemt.mainId == row.mainId
                  )
                  const parentRow = tableSource[sourceKey]?.contentList[nowIndex]
                  addTaskChildren({ parentRow, type: 'kr' })
                } else {
                  toTaskDetail(row, { from: '' })
                }
              }}
            >
              {/* 名字 */}
              {row.type != 31 ? (
                <>
                  <div className="cellLeft flex-1 nameCellLeft flex center-v">
                    {row.type == 2 ? (
                      <ONameCol key={row.id + '_0'} row={row} />
                    ) : (
                      <KrTaskNameCol
                        key={row.id + '_0'}
                        row={row}
                        allDataList={state.contentList}
                        index={index}
                      />
                    )}
                  </div>
                  {/* 创建kr或任务时 */}
                  {!row.isAdd ? (
                    <div className="cellRight flex">
                      {/* 责任人 */}
                      <UserNameCol row={row} />
                      {/* 简略信息 */}
                      <BriefCol row={row} />
                      {/* 最后一列 */}
                      <GradeMergeCol row={row} />
                    </div>
                  ) : (
                    ''
                  )}
                </>
              ) : row.hasAuth != 0 ? (
                <div
                  className="add_kr_ObjectLing"
                  onClick={(e: any) => {
                    e.stopPropagation()
                    const nowIndex = tableSource[sourceKey]?.contentList?.findIndex(
                      (elemt: any) => elemt.mainId == row.mainId
                    )
                    const parentRow = tableSource[sourceKey]?.contentList[nowIndex]
                    if ($('.okrListTable').find('.part_name_input').length > 0) {
                      getNowCode = {
                        type: 'kr',
                        parentRow: row,
                      }
                    } else {
                      addTaskChildren({ parentRow, type: 'kr' })
                    }
                  }}
                >
                  <i></i>
                  {$intl.get('createKR')}
                </div>
              ) : (
                ''
              )}
            </div>
          )
          break

        default:
          break
      }
      return tdHtm
    }

    return (
      <>
        {state.visible ? (
          <okrTableContext.Provider value={okrTableObj}>
            <Spin
              tip={$intl.get('loadingWait')}
              spinning={sourceKey == 'okrKanbanTable' ? false : state.loading}
            >
              <div className={`h100 w100  ${sourceKey + '_table'}`}>
                <DndProvider backend={HTML5Backend}>
                  {state.contentList && state.contentList.length > 0 && (
                    <Table
                      // scroll={{ y: state.tableHeight }}
                      scroll={{ y: sourceKey == 'okrFollowUpModalTable' ? 'calc(100% - 10px)' : '' }}
                      showHeader={false}
                      pagination={false}
                      columns={state.columns}
                      dataSource={state.contentList}
                      onExpand={(expanded: any, record: any) => {
                        expandedRow({ expanded, record })
                      }}
                      onRow={(row: any, index: any) => {
                        return {
                          onClick: (e: any) => {}, // 点击表头行
                          data: row,
                          index,
                        }
                      }}
                      expandedRowKeys={state.expandedRowKey}
                      rowClassName={setRowClassName}
                      rowKey={(record: any) => {
                        return record.id + ''
                      }}
                      className={`okrListTable h100 ${sourceKey}`}
                      components={{
                        body: {
                          row: DragableBodyRow,
                        },
                      }}
                    />
                  )}
                  {!state.contentList ||
                    (state.contentList.length == 0 && sourceKey == 'okrFollowUpModalTable' && (
                      <NoneData imgSrc={$tools.asAssetsPath(`/images/noData/no_task.png`)} />
                    ))}
                </DndProvider>
                {/* 共享到人 */}
                {selMemberOrg.visible && (
                  <SelectMemberOrg
                    param={{
                      ...selMemberOrg,
                    }}
                    action={{
                      setModalShow: (flag: boolean) => {
                        setSelMemberOrg({ ...selMemberOrg, visible: flag })
                      },
                    }}
                  />
                )}
                {/* 任务延迟列表弹窗 */}
                {delayModal.visible && (
                  <TaskDelayModal
                    param={{
                      masterTask: {
                        name: $intl.get('targetTask'),
                        planId: delayModal.id,
                        id: delayModal.typeId,
                      },
                      visible: delayModal.visible,
                      action: {
                        close: (state: any) => {
                          setDelayModal({ ...delayModal, visible: state })
                        },
                        openTaskDetail: (obj: any) => {
                          toTaskDetail(obj, { from: 'delayTask' })
                        },
                      },
                    }}
                  />
                )}
                {/* 任务详情弹框 */}
                <DetailModal ref={detailModalRef} param={{}} />

                {/* 对齐目标/关联目标 */}
                {support.visible && (
                  <SupportModal
                    param={{
                      visible: support.visible,
                      allowTeamId: [support.row.teamId],
                      contentType: support.type == 0 ? 'task' : 'okr',
                      checkboxType: support.type == 0 ? 'radio' : 'checkbox',
                      title: support.title,
                      periodId: support.row.periodId,
                      disableList: support.disableList || [],
                      selectList: support.selectList || [],
                      okrRelevanceType: 1, //关联对齐目标默认为1 (modelHover.type)
                      okrAimId: support.row.id, //工作规划id
                      workPlanType: support.type == 0 ? support.row.type || 2 : '',
                      workPlanId: support.type == 0 ? support.row.id : '',
                      showType: 2, //1是父级任务列表，2是规划关联任务列表
                    }}
                    action={{
                      setModalShow: (flag: boolean) => {
                        setSupport({ visible: flag })
                      },
                      onSure: (vaule: any) => {
                        if (vaule.length == 0) {
                          return
                        }
                        // 向上或被支撑
                        if (support.type == 1) {
                          pushOkrContentFn({ callbackData: vaule })
                        } else {
                          // 关联任务
                          pushTaskContentFn({ callbackData: vaule })
                        }
                      },
                    }}
                  />
                )}
              </div>
            </Spin>
          </okrTableContext.Provider>
        ) : (
          ''
        )}
      </>
    )
  }
)

/**
 * 目标O的名字列
 */
const ONameCol = ({ row }: any) => {
  const okrTableObj: any = useContext(okrTableContext)

  const {
    sourceFrom,
    setSelSupport,
    okrFollowFn,
    refreshTableData,
    isFollowWorkDesk,
    toTaskDetail,
  } = okrTableObj
  const [ONameState, setONameState] = useState({
    showInput: false,
    name: row.name,
  })
  // type:2--O 3--Kr 1--task
  const editAuth = row.hasAuth != undefined ? row.hasAuth : row.update
  useEffect(() => {
    setONameState({ ...ONameState, name: row.name, showInput: row.showInput })
  }, [row.name, row.showInput])
  /**
   * 编辑名字
   */
  const editName = ({ oldName, newName }: any) => {
    row.showInput = false
    if (newName != '' && newName != oldName) {
      const param = {
        id: row.id,
        parentId: row.id,
        mainId: row.mainId,
        typeId: row.typeId,
        name: newName,
      }
      editOKRTask(param).then((res: any) => {
        if (res) {
          setONameState({ ...ONameState, name: newName, showInput: false })
          refreshTableData({ taskIds: [row.typeId] })
        } else {
          setONameState({ ...ONameState, name: oldName, showInput: false })
        }
      })
    } else {
      setONameState({ ...ONameState, showInput: false })
    }
  }
  // 处理对齐/关联数据展示
  const getSuportUsers = (list: any) => {
    let nameList = ''
    const personArr: any = []
    for (let i = 0; i < list.length; i++) {
      let controlName = true
      personArr.forEach((item: any) => {
        if (item.userId == list[i].userId) {
          item.personNum++
          controlName = false
        }
      })
      if (controlName) {
        list[i].personNum = 1
        personArr.push(list[i])
      }
    }
    personArr.forEach((item: any) => {
      nameList += item.username + '(' + item.personNum + ')' + '<span class="cell-line">|</span>'
      // nameList += item.username + '(' + item.personNum + ')' + '|'
    })
    return nameList.slice(0, nameList.length - 1)
  }
  return (
    <div key={row.id + '_1'} className="cellContIn nameCol">
      {/* 置顶 */}
      {row.topId && <div className="item_top">{$intl.get('setTop')}</div>}
      <div className="item_support">
        <div className="part-now-add">
          <div className="flex ">
            {/* 点击添加对齐 */}
            <span
              className="quadrant-header-btn flex_shrink_0"
              onClick={e => {
                e.stopPropagation()
                if (!editAuth || isFollowWorkDesk) {
                  return
                }
                setSelSupport({
                  visible: true,
                  title: $intl.get('upSupport'),
                  type: 1,
                  row,
                  supportDir: 0,
                })
              }}
            >
              {/* <i className="add" style={{ marginTop: '2px', float: 'left' }}></i> */}
              {$intl.get('upSupport')}
            </span>
            {/* 移入添加对齐 */}

            {row.countModel?.topRelation?.list.length > 0 ? (
              <Dropdown
                className="aligin_dropdown"
                placement="topRight"
                overlay={
                  <ShowAlignModel
                    params={{
                      type: 0,
                      dataList: row.countModel?.topRelation?.list,
                      sourceFrom: sourceFrom,
                      hasAuth: editAuth,
                      cancelBtn: (planId: number) => {
                        if (isFollowWorkDesk) return
                        cancelRelation(row.id, planId, 0).then(() => {
                          // 刷新table 数据
                          refreshTableData({
                            taskIds: [row.typeId],
                            optType: 'cancleRelate',
                          })
                        })
                      },
                    }}
                  ></ShowAlignModel>
                }
              >
                <span
                  style={{
                    float: 'right',
                    marginLeft: '12px',
                    cursor: 'pointer',
                    height: '20px',
                  }}
                  className="getnowName text-ellipsis flex-1"
                  onClick={(e: any) => {
                    e.stopPropagation()
                  }}
                  dangerouslySetInnerHTML={{
                    __html:
                      row.countModel?.topRelation?.list.length > 0
                        ? getSuportUsers(row.countModel?.topRelation?.list || [])
                        : '',
                  }}
                ></span>
              </Dropdown>
            ) : (
              ''
            )}
          </div>
        </div>
      </div>
      {/* 名称 */}
      <div
        className="okr_names_box"
        onClick={e => {
          e.stopPropagation()

          //取消上次延时未执行的方法
          if (doubleClick) {
            doubleClick = clearTimeout(doubleClick)
          }

          doubleClick = setTimeout(() => {
            toTaskDetail(row, { from: '' })
          }, 300)
        }}
        onDoubleClick={e => {
          e.stopPropagation()

          //取消上次延时未执行的方法
          if (doubleClick) {
            doubleClick = clearTimeout(doubleClick)
          }

          if (!editAuth || isFollowWorkDesk) {
            return
          }
          setONameState({ ...ONameState, showInput: true })
        }}
      >
        {row.icon && (
          <span
            className="okr_icon"
            data-id={row.icon}
            style={{
              background: `url(../../../../assets/images/task/${row.icon}.png) no-repeat`,
            }}
          ></span>
        )}
        <span className={`isokr O_okr ${!row.id ? 'no_mind_forbid' : ''}`}></span>
        {!ONameState.showInput && !row.showInput && (
          <span className="okr_task_name o_name text-ellipsis">{ONameState.name}</span>
        )}
        {ONameState.showInput || row.showInput ? (
          <Input
            className="okr_task_name_inp"
            onChange={e => {
              setONameState({ ...ONameState, name: e.target.value })
            }}
            maxLength={100}
            onKeyUp={e => {
              if (e.keyCode == 13) {
                editName({
                  oldName: row.name,
                  newName: ONameState.name,
                })
              }
            }}
            onClick={e => {
              e.stopPropagation()
            }}
            onBlur={e => {
              editName({
                oldName: row.name,
                newName: e.target.value,
              })
            }}
            value={ONameState.name}
            autoFocus
          />
        ) : (
          ''
        )}
      </div>
      {/* 被支撑 */}
      <div className="item_align">
        {row?.countModel?.bottomRelation?.list?.length > 0 ? (
          <Dropdown
            className="aligin_dropdown"
            placement="topRight"
            overlay={
              <ShowAlignModel
                params={{
                  type: 1,
                  dataList: row?.countModel?.bottomRelation?.list || [],
                  sourceFrom: sourceFrom,
                  hasAuth: editAuth,
                  cancelBtn: (planId: number) => {
                    if (isFollowWorkDesk) return
                    cancelRelation(row.id, planId, 1).then(() => {
                      // 刷新table 数据
                      refreshTableData({
                        taskIds: [row.typeId],
                        optType: 'cancleRelate',
                      })
                    })
                  },
                }}
              ></ShowAlignModel>
            }
          >
            <span className="relevances">
              <span
                className="relevances_text"
                onClick={e => {
                  e.stopPropagation()
                  if (!editAuth || isFollowWorkDesk) {
                    return
                  }
                  setSelSupport({
                    visible: true,
                    title: $intl.get('supported'),
                    type: 1,
                    row,
                    supportDir: 1,
                  })
                }}
              >
                {/* <i></i> */}
                {$intl.get('supported')}({row?.countModel?.bottomRelation?.list?.length})
              </span>
            </span>
          </Dropdown>
        ) : (
          <span className="relevances">
            <span
              className="relevances_text"
              onClick={e => {
                console.log(row)
                e.stopPropagation()
                if (!editAuth || isFollowWorkDesk) {
                  return
                }
                setSelSupport({
                  visible: true,
                  title: $intl.get('supported'),
                  type: 1,
                  row,
                  supportDir: 1,
                })
              }}
            >
              {/* <i></i> */}
              {$intl.get('supported')}(0)
            </span>
          </span>
        )}
      </div>
      {/* 操作按钮 */}
      {ONameState.showInput || row.showInput ? (
        ''
      ) : (
        <RightOptList record={row} data={row} okrFollowFn={okrFollowFn} setSelSupport={setSelSupport} />
      )}
    </div>
  )
}
//判断输入框只能出现一个
const JudgeNameChange = (nowList: any) => {
  let nowData = false
  nowList.map((item: any) => {
    if (!item.key) {
      nowData = true
    }
    if (item.children && item.children.length > 0) {
      JudgeNameChange(item.children)
    }
  })
  return nowData
}
/**
 * kr和任务的名字列
 */
const KrTaskNameCol = ({ row, allDataList, index }: any) => {
  const okrTableObj: any = useContext(okrTableContext)

  const {
    sourceKey,
    setTableState,
    addTaskChildren,
    okrFollowFn,
    refreshTableData,
    isFollowWorkDesk,
  } = okrTableObj
  // const { nowUserId, nowUser } = $store.getState()
  const [krNameState, setONameState] = useState({
    showInput: false,
    name: row.name,
    addName: '',
  })
  useEffect(() => {
    setONameState({ ...krNameState, name: row.name, showInput: row.showInput })
  }, [row.name, row.showInput])

  // type:2--O 3--Kr 1--task
  // const editAuth = row.type == 2 ? row.hasAuth : row.update
  /**
   * 编辑名字
   */
  const editName = ({ oldName, newName }: any) => {
    row.showInput = false
    if (newName != '' && newName != oldName) {
      const param = {
        id: row.id,
        parentId: row.id,
        mainId: row.mainId,
        typeId: row.typeId,
        name: newName,
      }
      editOKRTask(param).then((res: any) => {
        if (res) {
          setONameState({ ...krNameState, name: newName, showInput: false })
        } else {
          setONameState({ ...krNameState, name: oldName, showInput: false })
        }
      })
    } else {
      setONameState({ ...krNameState, showInput: false })
    }
  }
  /**
   * 创建Kr
   */
  const createDataKr = ({ newName, createType, row }: any) => {
    if (newName != '') {
      let optType = 'addChildTask'
      let params = {}
      // 创建任务
      if (createType.includes('task')) {
        if (createType == 'task_task') {
          //任务下创建任务
          params = {
            ascriptionId: row.teamId,
            ascriptionName: row.teamName,
            name: newName,
            parentId: row.parentTypeId, //typeId
            createType: 0, //0快速创建 1弹窗创建
            type: 0, //0任务 1项目
          }
        } else {
          // okr下创建任务
          params = {
            ascriptionId: row.teamId,
            ascriptionName: row.teamName,
            name: newName,
            endTime: row.endTime,
            supports: [
              {
                mainId: row.mainId, //规划ID
                mainParentId: row.parentId, //规划支撑ID
                isExtends: false,
              },
            ],
            createType: 0, //0快速创建 1弹窗创建
            type: 0, //0任务 1项目
          }
        }
        addOkrTaskApi({ params }).then((res: any) => {
          if (res) {
            btnOpting = false
            const resData = res.data || {}
            // 继续创建task
            addTaskChildren({ parentRow: row, type: 'o_task' })
            refreshTableData({
              optType,
              taskIds: [resData.typeId],
              newChildId: resData.id, //为typeId
              parentId: row.parentTypeId,
              addType: 'replaceNow',
              nowRow: row,
            })
          }
        })
      } else if (createType.includes('kr')) {
        params = {
          id: row.parentId, //当前父节点
          mainId: row.mainId, //根节点id
          position: 1, //添加方向 1右 2下 3左 4上
          teamId: row.teamId, //企业id
          typeId: row.typeId,
          teamName: row.teamName, //企业名称
          name: newName,
          type: row.type,
          endTime: row.endTime,
        }
        optType = 'addKr'
        addOkrNodeApi({ params }).then((res: any) => {
          if (res) {
            btnOpting = false
            const resData = res.data || {}
            // 继续创建kr
            // addTaskChildren({ parentRow: row, type: 'kr' })
            refreshTableData({
              optType,
              taskIds: [resData.typeId],
              newChildId: resData.typeId, //为typeId
              parentId: row.parentTypeId,
              addType: 'replaceNow',
              nowRow: row,
            })
          }
        })
      }
    } else {
      //没有名称则关闭输入框
      btnOpting = true
      cancelCreateKr({ row })
    }
  }
  /**
   * 取消创建
   */
  const cancelCreateKr = ({ row }: any) => {
    // 取消新增
    if (!row.id) {
      const findItem: any = { findItem: {}, isDel: false }
      findNowTask({
        dataList: tableSource[sourceKey].contentList,
        findId: row.parentTypeId,
        findItem,
      })
      if (!findItem.isDel) {
        const parentRow = findItem.findItem
        if (parentRow.hasChild && parentRow.hasChild > 0) {
          parentRow.hasChild--
        }
        if (!parentRow.hasChild) {
          parentRow.children = undefined
        } else {
          const findI = parentRow.children.findIndex((item: any) => item.isAdd)
          if (findI > -1) {
            parentRow.children.splice(findI, 1)
          }
        }
      }
      setTableState({ contentList: [...tableSource[sourceKey]?.contentList] })
    } else {
      setONameState({ ...krNameState, name: row.name, showInput: false })
    }
    btnOpting = false
  }

  /**
   * 根据不同状态返回任务列表标签
   */
  const setTagByStatus = (item: globalInterface.WorkPlanTaskProps) => {
    return (
      <>
        {item.taskStatus === 3 && <Tag className="tagicon">{$intl.get('late')}</Tag>}
        {item.taskFlag === 1 && <Tag className="tagicon">{$intl.get('freeze')}</Tag>}
        {item.taskFlag === 3 && <Tag className="tagicon">{$intl.get('archive')}</Tag>}
      </>
    )
  }

  // ==================数据处理=====================//
  let createType = ''
  if (row.parentType == 2) {
    if (row.type == 1) {
      createType = 'o_task'
    } else {
      createType = 'o_kr'
    }
  } else if (row.parentType == 3) {
    createType = 'kr_task'
  } else {
    createType = 'task_task'
  }

  return (
    <div className="cellContIn nameCol inline-flex">
      {/* 名称 */}
      <div
        className={`okr_names_box flex center-v ${row.isAdd ? 'forcedHide' : ''}`}
        onClick={e => {
          e.stopPropagation()
        }}
        onDoubleClick={e => {
          if (isFollowWorkDesk) return
          e.stopPropagation()

          let getNowInput = false
          allDataList.forEach((element: any) => {
            if (row.mainId == element.mainId) {
              getNowInput = JudgeNameChange(element.children)
            }
          })
          if (getNowInput) {
            return
          }
          setONameState({ ...krNameState, showInput: true })
        }}
      >
        {row.type == 3 && !row.isAdd && <span className="specail-show-type">KR{index + 1}</span>}
        {row.type == 0 && !row.taskChild && !row.showInput && <span className="specail-show-task">Task</span>}
        {row.type == 1 && !row.taskChild && !row.showInput && (
          <span className="specail-show-task">{sourceKey != 'okrKanbanTable' ? 'Project' : 'Task'}</span>
        )}
        {!krNameState.showInput && !row.showInput && (
          <span className="okr_task_name kr_name text-ellipsis">{krNameState.name || '.'}</span>
        )}
        {row.type != 3 && setTagByStatus(row)}
        {krNameState.showInput || row.showInput ? (
          <Input
            className="okr_task_name_inp"
            maxLength={100}
            onChange={e => {
              setONameState({ ...krNameState, name: e.target.value })
            }}
            onKeyUp={e => {
              if (e.keyCode == 13) {
                editName({
                  oldName: row.name,
                  newName: krNameState.name,
                })
              }
            }}
            onClick={e => {
              e.stopPropagation()
            }}
            onBlur={e => {
              editName({
                oldName: row.name,
                newName: e.target.value,
              })
            }}
            value={krNameState.name}
            autoFocus
          />
        ) : (
          ''
        )}
      </div>
      {/* 创建名称、双击改变名称 */}
      {row.isAdd && (
        // {true && (
        <div className="part_name_input">
          {row.type == 3 && <span className="specail-show-type">KR</span>}
          <Input
            maxLength={100}
            value={row.addName}
            autoFocus
            onChange={e => {
              setONameState({ ...krNameState, addName: e.target.value })
            }}
            onKeyUp={(e: any) => {
              if (e.keyCode == 13) {
                const getname: string = e.target.value

                //为空时不允许创建
                if (!getname) {
                  btnOpting = true
                  cancelCreateKr({ row })
                  return
                }

                if (btnOpting) {
                  btnOpting = false
                  return
                }
                createDataKr({
                  newName: krNameState.addName,
                  row,
                  createType,
                })
              }
            }}
            onBlur={e => {
              e.stopPropagation()
              const getname: string = e.target.value

              //为空时不允许创建
              if (!getname) {
                btnOpting = true
                cancelCreateKr({ row })
                return
              }

              if (btnOpting) {
                btnOpting = false
                return
              }
              createDataKr({ newName: getname, row, createType })
            }}
            onClick={e => {
              e.stopPropagation()
            }}
          />
          <div className={`create_task_btn_box`}>
            <div
              className="sure_create_btn"
              onClick={(e: any) => {
                e.stopPropagation()
              }}
              onMouseDown={(e: any) => {
                e.stopPropagation()
                btnOpting = true
                const _val = $(e.target)
                  .parents('.part_name_input')
                  .find('input')
                  .val()

                createDataKr({ newName: _val, row, createType })
              }}
            ></div>
            <div
              className="cancel_create_btn"
              onClick={(e: any) => {
                e.stopPropagation()
              }}
              onMouseDown={(e: any) => {
                btnOpting = true
                e.stopPropagation()
                cancelCreateKr({ row })
              }}
            ></div>
          </div>
        </div>
      )}
      {/* 操作按钮 */}
      {/* {krNameState.showInput || row.showInput ? '' : RightOptList({ record: row, data: row, okrFollowFn })} */}
      {krNameState.showInput || row.showInput ? (
        ''
      ) : (
        <RightOptList record={row} data={row} okrFollowFn={okrFollowFn} />
      )}
    </div>
  )
}

/**
 * 责任人列
 */
const UserNameCol = ({ row }: any) => {
  const okrTableObj: any = useContext(okrTableContext)
  const { selLiberOrgSure, isFollowWorkDesk } = okrTableObj
  //选择责任人弹窗
  const [chooseMenuList, setChooseMenuList] = useState<any>({
    visible: false,
    classData: {
      display: 'none',
      pageX: 0,
      pageY: 0,
      row: {},
    },
    moreMenu: [],
  })

  //   O类型
  //更改责任人
  const changeMenuUser = ({ row }: any) => {
    findContacts(Number(row.teamId || row.enterpriseId)).then((res: any) => {
      setChooseMenuList({
        ...chooseMenuList,
        visible: true,
        classData: { ...chooseMenuList.classData, row },
        moreMenu: res.dataList || [],
      })
    })
  }

  // type:2--O 3--Kr 1--task
  const editAuth = row.hasAuth != undefined ? row.hasAuth : row.update
  const headDef: any = $tools.asAssetsPath('/images/workplan/head_def.png')
  const profile = row.liableUsername ? row.liableUserProfile : headDef
  // let colorControl = false
  // if (row.type == 3 || row.status != 1) {
  //   colorControl = true
  // }
  return (
    <div key={row.id + '_1'} className="cellContIn liableUserCol inline-flex center-v">
      {/* 头像 */}
      <div
        className="okr_portrait_box"
        onClick={(e: any) => {
          e.stopPropagation()
          if (!editAuth && isFollowWorkDesk) {
            return
          }
        }}
      >
        <p className="node_portrait_person flex center-v">
          <Avatar
            size={24}
            src={profile}
            className="oa-avatar"
            // style={row.liableUsername ? { fontSize: '11px' } : { fontSize: '11px', backgroundColor: 'inherit' }}
            style={{
              backgroundColor: row?.liableUsername && !profile ? '#3949ab' : 'inherit',
              fontSize: '11px',
            }}
          >
            {row.liableUsername ? row.liableUsername.substr(-2, 2) : ''}
          </Avatar>
          <span
            className="text-ellipsis"
            style={{
              marginLeft: '4px',
              maxWidth: '46px',
              minWidth: '46px',
              verticalAlign: '-6px',
              textAlign: 'left',
            }}
          >
            {row?.liableUsername || '未分配'}
          </span>
        </p>
        {editAuth ? (
          <Dropdown
            overlayClassName="chooseOrgMenuDrop"
            className="chooseOrgMenu"
            trigger={['click']}
            disabled={isFollowWorkDesk}
            visible={chooseMenuList.visible}
            onVisibleChange={(flag: boolean) => {
              if (editAuth && flag) {
                changeMenuUser({ row })
              } else {
                setChooseMenuList({ ...chooseMenuList, visible: false })
              }
            }}
            overlay={
              <ChooseMenu
                btnList={chooseMenuList.moreMenu}
                classData={{
                  ...chooseMenuList.classData,
                  row: chooseMenuList.classData.row,
                }}
                menuClick={(value: number, data: any) => {
                  selLiberOrgSure({ value, data, selectItem: chooseMenuList.classData.row })
                }}
              />
            }
          >
            <span className="edit_portrait"></span>
          </Dropdown>
        ) : (
          ''
        )}
      </div>
    </div>
  )
}

/**
 * 简略信息列
 */
const BriefCol = ({ row }: any) => {
  const okrTableObj: any = useContext(okrTableContext)
  const { isFollowWorkDesk, setDelayModal } = okrTableObj

  // type:2--O 3--Kr 1--task
  const editAuth = row.hasAuth != undefined ? row.hasAuth : row.update

  return (
    <div key={row.id + '_1'} className="cellContIn  BriefCol inline-flex center-v">
      {/* 头像 */}
      <div
        className="okr_brief_box"
        onClick={(e: any) => {
          e.stopPropagation()
          if (!editAuth && isFollowWorkDesk) {
            return
          }
        }}
      >
        <div className="evolve_start flex center">
          {/* O+kr 更新时间 */}
          {(row.type == 2 || row.type == 3) && (
            <span className="evolve_start_left">
              <span
                className={`leftline`}
                style={{
                  paddingRight: '8px',
                }}
              >
                {row?.processTimeStr ||
                (ascriptionObj.findType == 'updateRate' && ascriptionObj.progressStatus == 1)
                  ? '已更新'
                  : '尚未更新'}
              </span>
            </span>
          )}

          {/* o延迟任务统计 */}
          {row.type == 2 ? (
            <span
              className="evolve_start_right"
              onClick={e => {
                e.stopPropagation()
                setDelayModal({ visible: true, id: row.id, typeId: row.typeId })
              }}
            >
              延迟任务:{row?.lateCount || 0}
            </span>
          ) : (
            ''
          )}
          {/* 任务时间延迟 */}
          {row.type == 1 && (
            <div className="okr_specail_time flex center-v">
              <span className="task_day">
                {$intl.get('limitTo', { time: row?.endTime?.split(' ')[0].substr(5, 9) })}
              </span>
            </div>
          )}

          <span className={`evolve_star`}></span>
        </div>
      </div>
    </div>
  )
}
/**
 * 最后一列
 */
const GradeMergeCol = ({ row }: any) => {
  const okrTableObj: any = useContext(okrTableContext)

  const { sourceKey, refreshTableData, selLiberOrgSure, isFollowWorkDesk } = okrTableObj
  // type:2--O 3--Kr 1--task
  const editAuth = row.hasAuth != undefined ? row.hasAuth : row.update
  //单元格state
  const [cellState, setCellState] = useState<any>({
    showAddBtns: false,
    showWeightInp: false,
    showScoreInp: false,
    weights: row.weights || 0,
    score: row.score || 0,
    process: row.process || 0,
    showProcessInp: false,
  })

  //设置部门名称显示
  const getDepartmentName = (listData: any) => {
    let names: any = ''
    const type = listData.attach.type
    if (type == 2) {
      names = `${$intl.get('companyObject')}`
    } else if (type == 3) {
      names = `${listData.attach.typeName || ''}-${$intl.get('departObject')}`
    } else {
      names = ` ${$intl.get('personObject')}`
    }

    return names
  }

  //设置进度权重
  const setOkrProgress = (e: any, data: any, type: string) => {
    let param: any = {}
    if (type == 'taskschedule') {
      // 任务进度
      param = {
        id: data.id,
        mainId: data.mainId,
        typeId: data.typeId,
        process: parseFloat(e.target.value || 0),
      }
    } else if (type == 'updateProgressStatus') {
      //okr进度
      param = {
        id: data.id,
        mainId: data.mainId,
        typeId: data.typeId,
        process: e.value || 0,
        processStatus: e.evolvestart,
      }
      if (data.type == 3) {
        param.cci = e.cci
      }
    } else if (type == 'weight') {
      //权重
      param = {
        id: data.id,
        mainId: data.mainId,
        typeId: data.typeId,
        weights: parseFloat(e.target.value || 0), //分值，为空则不改
      }
    } else if (type == 'score') {
      let scoreNum: any = ''
      scoreNum = parseFloat(e.target.value || 0)
      if (data.ratingType == 100 && e.target.value.length <= 2) {
        let num1 = Number(e.target.value.substring(0, 1))
        const num2 = Number(e.target.value.substring(1, 2))
        if (num2 >= 5) {
          num1 = num1 + 1
        }
        num1 = num1 * 10
        scoreNum = num1
      }
      //分值
      param = {
        id: data.id,
        mainId: data.mainId,
        typeId: data.typeId,
        score: scoreNum, //分值，为空则不改
      }
    }

    editOKRTask(param).then((res: any) => {
      const optType = type
      const taskIds = [data.typeId]
      if (res) {
        if (type == 'updateProgressStatus') {
          progressStatusCheck({ data, param, checkType: 0 })
        } else {
          refreshTableData({
            taskIds,
            optType,
          })
        }
      }
    })
  }

  /**
   * 更新进度状态处理
   * checkType:0--查询接口进行判断(建议使用)，1--前端遍历已有数据判断（当O未展开时判断会有问题）
   */
  const progressStatusCheck = async ({ data, param, checkType }: any) => {
    const { apiParam, apiUrl, findType, progressStatus } = ascriptionObj
    let optType = 'updateProgressStatus'
    let taskIds = [data.typeId]
    let parentRow = data
    if (checkType == 1) {
      // 与后台progressStatus一致：0正常 1有风险 2超前 3延迟
      let newProgressStatus = [1]
      // 风险项进入穿透列表的导航
      if (findType == 'risk') {
        // 全部状态包括有风险、延迟
        if (progressStatus == 0) {
          newProgressStatus = [1, 3]
        } else {
          newProgressStatus = progressStatus == 2 ? [1] : progressStatus == 3 ? [3] : [1]
        }
      }
      // 状态分布进入穿透列表的导航
      else if (findType == 'state') {
        newProgressStatus = [progressStatus]
      }

      /**
       * 比较与当前状态是否一致
       */
      const compareStatus = ({ item }: any) => {
        let flag = false
        // -----风险项穿透列表导航----
        if (findType == 'risk') {
          const isCci = progressStatus == 1
          // 全部状态：信心指数低于5或者状态相同(排除当前正在更改的项)
          if (progressStatus == 0) {
            if (item.cci < 5 || newProgressStatus.includes(item.processStatus)) {
              flag = true
            }
          } else if ((isCci && item.cci < 5) || (!isCci && newProgressStatus.includes(item.processStatus))) {
            // 单个状态：信心指数低于5或者状态相同(排除当前正在更改的项)
            flag = true
          }
        }
        // ------从状态分布进入-------
        else if (findType == 'state' && newProgressStatus.includes(item.processStatus)) {
          flag = true
        }
        return flag
      }
      // 记录与当前状态一致的数据条数
      let commonNum = 0

      // 从风险项进入
      if (findType == 'risk') {
        // 1 ======当前数据修改后是否与导航下状态一致=====//
        if (compareStatus({ item: param })) {
          commonNum++
        }
        // 2 ==========查询O下的所有kr状态===========//
        // KR类型状态修改
        let childs = []
        if (data.type == 3) {
          const findItem: any = { findItem: {} }
          findNowTask({
            dataList: tableSource[sourceKey].contentList,
            findItem,
            findId: data.parentTypeId,
          })
          parentRow = findItem.findItem || {}
          childs = findItem.findItem.children || []
        } else if (data.type == 2) {
          childs = data.children || []
        }
        childs.filter((item: any) => {
          // 信心指数低于5或者状态相同(排除当前正在更改的项)
          if (item.type == 3 && item.typeId != data.typeId && compareStatus({ item })) {
            commonNum++
          }
        })
        // 3 =====查询O的状态（当前操作的是Kr的时候需要）========//
        if (data.type == 3 && compareStatus({ item: parentRow })) {
          commonNum++
        }
        // O和O下的Kr都与当前导航状态不一致则需要移除O
        if (commonNum == 0) {
          taskIds = [parentRow.typeId]
        }
      }
      // 从状态分布进入（只针对O的状态变化进行判定是否需要从列表移除）
      else if (ascriptionObj.findType == 'state') {
        if (data.type == 2 && compareStatus({ item: param })) {
          commonNum++
        }
        // O与当前导航状态不一致则需要移除O
        if (commonNum == 0) {
          taskIds = [data.typeId]
        }
      }
      if ((findType == 'risk' || findType == 'state') && commonNum == 0) {
        optType = 'updateProgressStatusDel'
      }
    } else {
      // 是否不删除当前O
      let isDel = false
      // -----风险项穿透列表导航----
      if (findType == 'risk' || (findType == 'state' && data.type == 2)) {
        if (findType == 'risk' && data.type == 3) {
          const findItem: any = { findItem: {} }
          findNowTask({
            dataList: tableSource[sourceKey]?.contentList,
            findItem,
            findId: data.parentTypeId,
          })
          parentRow = findItem.findItem || {}
        }
        const resData: any = (await queryOkrFollowUpListApi({ param: apiParam, url: apiUrl, json: true })) || {}
        const dataList = resData.data || []
        const finds = dataList.filter((item: any) => item.typeId == parentRow.typeId)
        if (finds.length == 0) {
          isDel = true
        }
        if ((ascriptionObj.findType == 'risk' || ascriptionObj.findType == 'state') && isDel) {
          taskIds = [parentRow.typeId]
          optType = 'updateProgressStatusDel'
        }
      }
    }
    refreshTableData({
      taskIds,
      optType,
    })
  }
  /**
   * 编辑权重
   */
  const editWeight = ({ oldVal, newVal }: any) => {
    if (newVal != '' && newVal != oldVal) {
      const param = {
        id: row.id,
        parentId: row.id,
        mainId: row.mainId,
        typeId: row.typeId,
        weights: newVal,
      }
      editOKRTask(param).then((res: any) => {
        if (res) {
          setCellState({ ...cellState, weights: newVal, showWeightInp: false })
          const taskIds = [row.typeId]

          const nowIndex = tableSource[sourceKey]?.contentList?.findIndex(
            (elemt: any) => elemt.mainId == row.mainId
          )
          const parentRow = tableSource[sourceKey]?.contentList[nowIndex]
          if (parentRow?.children?.length > 0) {
            let insertNum = 0
            let iskrnode = false
            for (let i = 0; i < parentRow.children.length; i++) {
              if (parentRow.children[i].type == 31 || parentRow.children[i].type == 1) {
                insertNum = i
                iskrnode = true
                break
              }
            }
            if (!iskrnode) {
              insertNum = parentRow.children.length
            }
            insertNum = insertNum - 1
            taskIds.push(parentRow.children[insertNum].typeId)
          }

          refreshTableData({ taskIds })
        } else {
          setCellState({ ...cellState, weights: oldVal, showWeightInp: false })
        }
      })
    } else {
      setCellState({ ...cellState, showWeightInp: false })
    }
  }

  // 查询最后一个kr位置

  /**
   * 编辑打分
   */
  const editScore = ({ oldVal, newVal }: any) => {
    if (newVal != '' && newVal != oldVal) {
      const param = {
        id: row.id,
        parentId: row.id,
        mainId: row.mainId,
        typeId: row.typeId,
        score: newVal,
      }
      editOKRTask(param).then((res: any) => {
        if (res) {
          const taskIds = [row.typeId]
          setCellState({ ...cellState, score: newVal, showScoreInp: false })
          const nowIndex = tableSource[sourceKey]?.contentList?.findIndex(
            (elemt: any) => elemt.mainId == row.mainId
          )
          const parentRow = tableSource[sourceKey]?.contentList[nowIndex]

          if (parentRow) {
            taskIds.push(parentRow?.typeId)
          }

          refreshTableData({ taskIds })
        } else {
          setCellState({ ...cellState, score: newVal, showScoreInp: false })
        }
      })
    } else {
      setCellState({ ...cellState, showScoreInp: false })
    }
  }
  /**
   * 编辑进度
   */
  const editProcess = ({ oldVal, newVal }: any) => {
    if (newVal != '' && newVal != oldVal) {
      const param = {
        id: row.id,
        parentId: row.id,
        mainId: row.mainId,
        typeId: row.typeId,
        process: newVal,
      }
      editOKRTask(param).then((res: any) => {
        if (res) {
          setCellState({ ...cellState, process: newVal, showProcessInp: false })
          refreshTableData({ taskIds: [row.typeId] })
        } else {
          setCellState({ ...cellState, process: newVal, showProcessInp: false })
        }
      })
    } else {
      setCellState({ ...cellState, showProcessInp: false })
    }
  }
  return (
    <div key={row.id + '_5'} className="cellContIn lastCol" data-type={row.type}>
      {/* 新增按钮、归属信息 */}
      {row.type == 2 ? (
        <div className="flex end trO_top_right">
          {/* <span className="org_message_box">{getDepartmentName(row)}</span> */}
          <div className="org_message_box flex  center-v">
            {/* 归属 */}
            {/* {!selectTeam.id && !okrPeriodFilter.periodId && ( */}
            <Avatar
              size={16}
              style={{ marginRight: '4px' }}
              src={row.teamProfile || $tools.asAssetsPath('/images/common/company_default.png')}
              // className="oa-avatar"
            ></Avatar>
            {/* )} */}
            <span
              onClick={e => {
                e.stopPropagation()
                if (isFollowWorkDesk || !editAuth) return
                selLiberOrgSure({ value: 3, data: row.typeId, selectItem: row })
              }}
              className="org_message_type"
            >
              {row?.attach?.typeId && getDepartmentName(row)}
            </span>
            {/* 分割线 */}
            <em className="line_h"></em>
            {/* 周期 */}
            {/* <span className="org_message_periodText">{listData.periodText}</span> */}

            <PeriodDate
              dataParam={{
                attach: row?.attach,
                teamId: row?.teamId,
                periodText: row?.periodText,
                periodId: row?.periodId,
                id: row?.id,
                typeId: row?.typeId,
                parentId: row?.parentId,
                mainId: row?.mainId,
                disabled: isFollowWorkDesk || !editAuth,
              }}
              changePeriodIdHandle={(val: any) => {
                // refreshHandle(val, data, 'periodId')
                refreshTableData({
                  taskIds: [row?.typeId],
                  optType: 'upPeriodId',
                })
                console.log('更改周期--------------', val)
              }}
            ></PeriodDate>
          </div>
        </div>
      ) : (
        ''
      )}
      {/* ===okr(type:3)展示进展条，任务(type:1)展示进度和时间 ==*/}
      {row.type == 1 ? (
        <div className="flex end">
          <div className="cell-width flex-1"></div>
          <div className="task_progress_info_box flex between">
            {/* 任务进度 */}
            <div className="okr_schedule_box">
              {!cellState.showProcessInp && (
                <p
                  className={`aggravate ${editAuth ? 'hover_border' : ''}`}
                  onClick={(e: any) => {
                    e.stopPropagation()
                    if (!editAuth || cellState.process == 100 || isFollowWorkDesk) {
                      return
                    }
                    setCellState({ ...cellState, showProcessInp: true })
                  }}
                >
                  {cellState.process || 0}%
                </p>
              )}
              {cellState.showProcessInp && (
                <Input
                  autoFocus
                  min={0}
                  max={100}
                  value={cellState.process}
                  onChange={e => {
                    setCellState({ ...cellState, process: changeInputVal(e, 'percent') })
                  }}
                  onKeyUp={e => {
                    if (e.keyCode == 13) {
                      editProcess({
                        oldVal: row.process,
                        newVal: cellState.process,
                      })
                    }
                  }}
                  onClick={e => {
                    e.stopPropagation()
                  }}
                  onBlur={e => {
                    editProcess({
                      oldVal: row.process,
                      newVal: changeInputVal(e, 'percent'),
                    })
                  }}
                />
              )}
            </div>
          </div>

          {/* 权重(任务只展示'-') */}
          <div className="okr_weight_box">
            <p className="col_title">{row.type == 1 ? '-' : $intl.get('grade')}</p>
          </div>
          {/* 打分(任务只展示'-') */}
          <div className="okr_mark_box">
            <p className="col_title">{row.type == 1 ? '-' : $intl.get('grade')}</p>
          </div>
        </div>
      ) : (
        <div className="flex end">
          {/* 进展 evolveStyle2:工作台样式*/}
          <div className="flex center progress-slider-box">
            {/* kr信心指数 */}
            {row.type == 3 && (
              <span className={`leftline star_show`} style={{ color: '#FFC100' }}>
                <i></i>
                {row?.cci}
              </span>
            )}
            {getStatusOrTime(1, row?.processStatus)}
            <div
              className="okr_evolve_box "
              onClick={(e: any) => {
                e.stopPropagation()
              }}
            >
              {/* 进展进度 */}
              <div className="evolve_progress">
                <Evolveprogress
                  id={row.id}
                  typeId={row.typeId}
                  percent={row.process}
                  processStatus={row.processStatus}
                  hasAuth={editAuth}
                  cci={row.cci}
                  teamId={row.teamId}
                  type={row.type}
                  isFollowWorkDesk={isFollowWorkDesk}
                  setcallbackFn={(value: any, evolvestart: any, cci: any) => {
                    setOkrProgress(
                      {
                        value,
                        evolvestart,
                        cci,
                      },
                      row,
                      'updateProgressStatus'
                    )
                  }}
                />
              </div>
            </div>
          </div>
          {/* 进度 */}
          <div className="okr_weight_box">
            <p className="col_title">进度</p>
            <p className={`aggravate`}>{row.process}%</p>
          </div>
          {/* 权重 (任务只展示'-')*/}
          <div className="okr_weight_box">
            <p className="col_title">{row.type == 1 ? '-' : $intl.get('weight')}</p>
            {!cellState.showWeightInp && (
              <p
                className={`aggravate ${editAuth && row.type == 3 ? 'hover_border' : ''}`}
                onClick={(e: any) => {
                  // KR才可编辑权重
                  if (editAuth && row.type == 3 && !isFollowWorkDesk) {
                    e.stopPropagation()
                    const getNextTrData: any = $(e.target)
                      .parents('tr')
                      .next()
                    let isLast = getNextTrData.find('.cellCont').attr('data-type')
                    const _index = isLastNodes(row, sourceKey)
                    if (_index == 1) {
                      isLast = '1'
                    }
                    if (
                      !editAuth ||
                      row.type == 1 ||
                      isLast != '3' ||
                      (isLast == '3' && getNextTrData.attr('data-row-key') == '0')
                    ) {
                      if (isLast != '3' || (isLast == '3' && getNextTrData.attr('data-row-key') == '0')) {
                        message.warning($intl.get('modifyOthersWeightOfKR'))
                      }
                      return
                    }
                    setCellState({ ...cellState, showWeightInp: true })
                  }
                }}
              >
                {`${cellState.weights}`}%
              </p>
            )}
            {/* 权重输入框 */}
            {cellState.showWeightInp && (
              <Input
                autoFocus
                min={0}
                max={100}
                maxLength={4}
                value={cellState.weights}
                disabled={isFollowWorkDesk}
                onChange={e => {
                  setCellState({ ...cellState, weights: changeInputVal(e, 'weight', row) })
                }}
                onKeyUp={e => {
                  if (e.keyCode == 13) {
                    editWeight({
                      oldVal: row.weights,
                      newVal: cellState.weights,
                    })
                  }
                }}
                onClick={e => {
                  e.stopPropagation()
                }}
                onBlur={e => {
                  editWeight({
                    oldVal: row.weights,
                    newVal: changeInputVal(e, 'weight', row),
                  })
                }}
              />
            )}
          </div>
          {/* 打分(任务只展示'-') */}
          <div className="okr_mark_box">
            <p className="col_title">{row.type == 1 ? '-' : $intl.get('grade')}</p>
            {!cellState.showScoreInp && (
              <p
                className={`aggravate ${editAuth && row.type == 3 ? 'hover_border' : ''}`}
                onClick={(e: any) => {
                  // KR才可编辑打分
                  if (editAuth && row.type == 3) {
                    e.stopPropagation()
                    setCellState({ ...cellState, showScoreInp: true })
                  }
                }}
              >
                {cellState.score}
              </p>
            )}
            {/* 打分输入框 */}
            {cellState.showScoreInp && (
              <Input
                autoFocus
                min={0}
                size="small"
                max={row.ratingType == 1 ? 10 : 100}
                disabled={isFollowWorkDesk}
                value={cellState.score}
                onChange={e => {
                  setCellState({ ...cellState, score: changeInputVal(e, 'score', row) })
                }}
                onKeyUp={e => {
                  if (e.keyCode == 13) {
                    editScore({
                      oldVal: row.score,
                      newVal: cellState.score,
                    })
                  }
                }}
                onClick={e => {
                  e.stopPropagation()
                }}
                onBlur={e => {
                  editScore({
                    oldVal: row.score,
                    newVal: changeInputVal(e, 'score', row),
                  })
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
/**
 * 计算是否是父级O的最后一个子级
 * @param data
 */
const isLastNodes = (data: any, sourceKey: string) => {
  let isitemIndex = 0
  function jsonRecursionChild(items: any) {
    for (let i = 0; i < items.length; i++) {
      if (data.parentId == items[i].id) {
        isitemIndex = items[i].children.length
      }
      if (
        items[i].children != undefined &&
        items[i].children != '' &&
        items[i].children != null &&
        items[i].children instanceof Array
      ) {
        jsonRecursionChild(items[i].children)
      }
    }
  }
  jsonRecursionChild(tableSource[sourceKey]?.contentList)
  return isitemIndex
}

/**
 * 右键菜单
 */
const RightOptList = ({
  record,
}: {
  record: any
  data: any
  nowKrId?: any
  setSelSupport?: any
  [propsName: string]: any
}) => {
  // const { nowUser, nowUserId } = $store.getState()
  // type:1 任务
  const editAuth = record.hasAuth != undefined ? record.hasAuth : record.update
  const {
    sourceKey,
    addTaskChildren,
    setSelSupport,
    refreshTableData,
    setTableState,
    initFn,
    okrFollowFn,
    isFollowWorkDesk,
  }: any = useContext(okrTableContext)
  const [taskOptShow, setTaskOptShow] = useState(false)
  const taskrecord = {
    ...record,
    id: record.typeId,
    flag: record.taskFlag,
    ascriptionId: record.enterpriseId || record.teamId,
    ascriptionName: record.enterpriseName || record.teamName,
    endTime: record.endTime,
    progress: { percent: record.process, color: 0 },
    datas: record,
    showTop: true,
  }
  /**
   *
   * @param record 行数据
   * @param data 组装行数据
   */
  const addEvolveFn = ({ record }: any) => {
    $store.dispatch({
      type: 'TASK_LIST_ROW',
      data: {
        handleBtn: {
          id: record.typeId,
          ascriptionId: record.teamId,
          status: record.process == 100 ? 2 : 0,
          executorUsername: '',
          reportId: '',
          type: 0,
          time: Math.floor(Math.random() * Math.floor(1000)),
          types: record.type != 1 ? 'okr' : '',
          source: record.type != 1 ? 'okr_list' : '',
        },
        type: 0,
      },
    })
    $tools.createWindow('DailySummary')
  }

  //右键回调
  const contextMenuCallback = ({ callbackData, row }: any) => {
    // const { nowUserId } = $store.getState()
    const { optType } = callbackData
    if (optType == 'relKR') {
      // O类型
      if (row.type == 2) {
        refreshTableData({
          optType: 'relKR',
          taskIds: [row.typeId],
        })
      } else {
        refreshTableData({
          optType: 'del',
          taskIds: [row.typeId],
          parentId: row.parentTypeId,
          delId: row.typeId,
        })
      }
    } else if (optType == 'del' || optType == 'archive') {
      refreshTableData({
        optType: 'del',
        taskIds: [row.typeId],
        parentId: row.parentTypeId,
        delId: row.typeId,
      })
    } else if (optType == 'rechristen') {
      //重命名
      row.showInput = true
      setTableState({ contentList: [...tableSource[sourceKey]?.contentList] })
    } else if (optType == 'stick') {
      //置顶/取消置顶 全局刷新
      initFn()
    } else {
      refreshTableData({
        optType,
        taskIds: [row.typeId],
      })
    }
  }

  // 目标O类型
  if (record.type == 2) {
    return (
      <>
        {!record.isAdd && !isFollowWorkDesk ? (
          <div
            className="okrOptBtnGroup taskOptBtnGroup"
            style={{ height: '100px' }}
            onClick={(e: any) => {
              e.stopPropagation()
            }}
          >
            {/* O右键 */}
            <>
              <Tooltip title={'添加进展'}>
                <span
                  className={`add_evolve`}
                  onClick={(e: any) => {
                    e.stopPropagation()
                    addEvolveFn({ record })
                  }}
                ></span>
              </Tooltip>
              {editAuth ? (
                <Tooltip title={'添加KR'}>
                  <Dropdown
                    trigger={['click']}
                    disabled={isFollowWorkDesk || !editAuth}
                    overlay={
                      <div
                        className={`quadrant-header-btn add_kr_drop_btn o_add_kr_drop_btns `}
                        style={{ backgroundColor: 'inherit', position: 'relative' }}
                      >
                        <ul onClick={() => {}} className="quadrant-btn-list">
                          <li key="1" className="quadrant-btn-add active">
                            <Button
                              onClick={(e: any) => {
                                e.stopPropagation()
                                if ($('.okrListTable').find('.part_name_input').length > 0) {
                                  getNowCode = {
                                    type: 'kr',
                                    parentRow: record,
                                  }
                                } else {
                                  addTaskChildren({ parentRow: record, type: 'kr' })
                                }
                              }}
                            >
                              {/* <i className="add"></i> */}
                              {$intl.get('createKR')}
                            </Button>
                          </li>
                          <li key="2" className="quadrant-btn-add">
                            <Button
                              onClick={(e: any) => {
                                e.stopPropagation()
                                if ($('.okrListTable').find('.part_name_input').length > 0) {
                                  getNowCode = {
                                    type: 'o_task',
                                    parentRow: record,
                                  }
                                } else {
                                  addTaskChildren({ parentRow: record, type: 'o_task' })
                                }
                              }}
                            >
                              {/* <i className="add"></i> */}
                              {$intl.get('createChildTask')}
                            </Button>
                          </li>
                          <li key="3" className="quadrant-relate-btn">
                            <Button
                              onClick={(e: any) => {
                                e.stopPropagation()
                                if (!editAuth) {
                                  return
                                }
                                setSelSupport({
                                  visible: true,
                                  title: $intl.get('relateTask'),
                                  type: 0,
                                  row: record,
                                  supportDir: 0,
                                })
                              }}
                            >
                              {/* <i className="relate"></i> */}
                              {$intl.get('relateTask')}
                            </Button>
                          </li>
                        </ul>
                        {/* // )} */}
                      </div>
                    }
                  >
                    <span
                      className={`add_o_onlist`}
                      onClick={(e: any) => {
                        e.stopPropagation()
                      }}
                    ></span>
                  </Dropdown>
                </Tooltip>
              ) : (
                <></>
              )}
              <Tooltip
                title={
                  record.isFollow && record.isFollow == 1 ? $intl.get('cancelFollow') : $intl.get('follow')
                }
              >
                <span
                  className={`collect_icon ${record.isFollow == 1 ? 'nofollowIcon' : ''}`}
                  onClick={(e: any) => {
                    e.stopPropagation()
                    okrFollowFn({ record })
                  }}
                ></span>
              </Tooltip>
              {/* 右键菜单 */}
              <Dropdown
                overlayClassName="okrFollowUpDrop"
                className="base-dropdown"
                visible={taskOptShow}
                onVisibleChange={(flag: boolean) => {
                  setTaskOptShow(flag)
                }}
                overlay={
                  <TaskListOpt
                    taskOptData={{
                      rowObj: taskrecord,
                      fromType: 'okrFollowUp',
                      iskr: 1,
                    }}
                    callback={(params: any) => {
                      contextMenuCallback({ callbackData: params, row: record })
                    }}
                    btnSort={['REVIEW', 'SET_FOLLOWER', 'MODIFY_AUTH', 'RENAME', 'DELETE']}
                    btnSortType="name"
                    outVisible={taskOptShow} //外部控制菜单显示隐藏
                    setVisible={(flag: boolean) => {
                      setTaskOptShow(flag)
                    }}
                  />
                }
                trigger={['click']}
              >
                <Tooltip title={$intl.get('more')}>
                  <span className="more_icon"></span>
                </Tooltip>
              </Dropdown>
            </>
          </div>
        ) : (
          <></>
        )}
      </>
    )
  } else {
    // let getstyle = {}
    // if (nowKrId == record.id) {
    //   if (record.type == 3) {
    //     getstyle = { height: 'calc(100% - 32px)' }
    //   } else {
    //     getstyle = { height: 'calc(100% - 32px)', top: '31px' }
    //   }
    // }

    return (
      <>
        {!record.isAdd && !isFollowWorkDesk ? (
          <div
            className={`okrOptBtnGroup taskOptBtnGroup ${record.type == 3 && !editAuth ? 'forcedHide' : ''}`}
            // style={getstyle}
            onClick={(e: any) => {
              e.stopPropagation()
            }}
          >
            {/* 任务右键 */}
            {record.type == 1 && (
              <>
                <Tooltip title="汇报">
                  <span
                    className="report_icon"
                    onClick={(e: any) => {
                      e.stopPropagation()
                      addEvolveFn({ record })
                    }}
                  ></span>
                </Tooltip>
                <Tooltip
                  title={
                    record.isFollow && record.isFollow == 1 ? $intl.get('cancelFollow') : $intl.get('follow')
                  }
                >
                  <span
                    className={`collect_icon ${record.isFollow == 1 ? 'nofollowIcon' : ''}`}
                    onClick={(e: any) => {
                      e.stopPropagation()
                      okrFollowFn({ record })
                    }}
                  ></span>
                </Tooltip>
                <Tooltip title={$intl.get('createChildTask')}>
                  <span
                    className={`${editAuth ? 'add_child_icon' : 'hide'}`}
                    onClick={(e: any) => {
                      e.stopPropagation()
                      if ($('.okrListTable').find('.part_name_input').length > 0) {
                        getNowCode = {
                          type: 'task_task',
                          parentRow: record,
                        }
                      } else {
                        addTaskChildren({ parentRow: record, type: 'task_task' })
                      }
                    }}
                  ></span>
                </Tooltip>
                {/* 任务 右键菜单 */}
                <Dropdown
                  overlayClassName="okrFollowUpDrop"
                  className="okrFollowUpMoreDrop base-dropdown"
                  visible={taskOptShow}
                  onVisibleChange={(flag: boolean) => {
                    setTaskOptShow(flag)
                  }}
                  overlay={
                    <TaskListOpt
                      taskOptData={{
                        rowObj: taskrecord,
                        fromType: 'okrFollowUp',
                      }}
                      callback={(params: any) => {
                        contextMenuCallback({ callbackData: params, row: record })
                      }}
                      outVisible={taskOptShow} //外部控制菜单显示隐藏
                      setVisible={(flag: boolean) => {
                        setTaskOptShow(flag)
                      }}
                    />
                  }
                  trigger={['click']}
                >
                  <Tooltip title={$intl.get('more')}>
                    <span className="more_icon"></span>
                  </Tooltip>
                </Dropdown>
              </>
            )}
            {/* KR右键 */}
            {record.type == 3 && editAuth && (
              <>
                <Tooltip title={'添加进展'}>
                  <span
                    className={`add_evolve`}
                    onClick={(e: any) => {
                      e.stopPropagation()
                      addEvolveFn({ record })
                    }}
                  ></span>
                </Tooltip>
                <Tooltip title={$intl.get('relateTask')}>
                  <span
                    className={`${editAuth ? 'relate_child_icon' : 'add_child_icon_disable'}`}
                    onClick={(e: any) => {
                      e.stopPropagation()
                      setSelSupport &&
                        setSelSupport({
                          visible: true,
                          title: $intl.get('relateTask'),
                          type: 0,
                          row: record,
                          supportDir: 0,
                        })
                    }}
                  ></span>
                </Tooltip>
                <Tooltip title={$intl.get('createChildTask')}>
                  <span
                    className={`${editAuth ? 'add_child_icon' : 'add_child_icon_disable'}`}
                    onClick={(e: any) => {
                      e.stopPropagation()
                      if ($('.okrListTable').find('.part_name_input').length > 0) {
                        getNowCode = {
                          type: 'kr_task',
                          parentRow: record,
                        }
                      } else {
                        addTaskChildren({ parentRow: record, type: 'kr_task' })
                      }
                    }}
                  ></span>
                </Tooltip>
                {/* 右键菜单 */}
                <Dropdown
                  overlayClassName="okrFollowUpDrop"
                  className="okrFollowUpMoreDrop base-dropdown"
                  visible={taskOptShow}
                  onVisibleChange={(flag: boolean) => {
                    setTaskOptShow(flag)
                  }}
                  overlay={
                    <TaskListOpt
                      taskOptData={{
                        rowObj: taskrecord,
                        fromType: 'okrFollowUp',
                        iskr: 2,
                      }}
                      callback={(params: any) => {
                        contextMenuCallback({ callbackData: params, row: record })
                      }}
                      outVisible={taskOptShow} //外部控制菜单显示隐藏
                      setVisible={(flag: boolean) => {
                        setTaskOptShow(flag)
                      }}
                    />
                  }
                  trigger={['click']}
                >
                  <Tooltip title={$intl.get('more')}>
                    <span className="more_icon"></span>
                  </Tooltip>
                </Dropdown>
              </>
            )}
          </div>
        ) : (
          <></>
        )}
      </>
    )
  }
}

/**
 * 从表格数据中递归查询当前任务
 */
export const findNowTask = (paramObj: {
  dataList: any
  findId: any
  isFind?: boolean
  findItem?: any
  optType?: string
  findIdType?: string
}): any => {
  const { dataList, findId, isFind, optType, findIdType, findItem } = paramObj
  // 当前查询的id还是typeId
  const queryIdType = findIdType || 'typeId'
  // let getItem = findItem ? findItem : {}
  let isFinded = isFind ? isFind : false
  for (let i = 0; i < dataList.length; i++) {
    const item = dataList[i]
    if (findId == item[queryIdType]) {
      findItem.findItem = item
      isFinded = true
      // 1删除任务，2归档 删除任务
      if (
        optType == 'del' ||
        optType == 'archive' ||
        optType == 'relKR' ||
        optType?.includes('Del') ||
        optType == 'cancelFollow'
      ) {
        findItem.isDel = true
        dataList.splice(i, 1)
        i--
      }
      // console.log('find', paramObj.findItem)
    }
    if (item.children && item.children.length > 0 && !isFinded) {
      findNowTask({ ...paramObj, dataList: item.children, findId, isFind: isFinded, optType })
    }
  }
  // return getItem
}
/**
 * 递归查找当前任务进行替换
 */
const replaceFindTask = (paramObj: {
  dataList: any
  taskIds: any
  newDatas: any
  finded: number //记录匹配到的任务，匹配完毕停止递归遍历
  optType?: string
  newChild?: any
  findIdType?: string
  parentId?: any
}) => {
  const { taskIds, newDatas, findIdType, parentId } = paramObj
  // 当前查询的id还是typeId
  const queryIdType = findIdType || 'typeId'
  let finded = paramObj.finded || 0
  // const optType = paramObj.optType
  for (let i = 0; i < paramObj.dataList.length; i++) {
    const item = paramObj.dataList[i]
    if (taskIds.includes(item[queryIdType])) {
      // 新的任务数据列表中匹配出当前任务进行替换更新
      const newDataItem = newDatas.filter((fItem: any) => fItem[queryIdType] === item[queryIdType])
      const newItem = { ...item, ...newDataItem }
      // 空值后台可能不返，故依据最长字段的
      const findItem = newItem[0]
      for (const key in findItem) {
        const val = newItem[0][key]
        // 排除不更新的健，更新children会导致子节点清空，故不更新
        if (!parentId && key != queryIdType && key != 'key' && key != 'children') {
          paramObj.dataList[i][key] = val
        }
        // 传了parentId则正在更新父级，父级没有子节点时则更新children
        if (key == 'children' && parentId && parentId == item[queryIdType] && !findItem.hasChild) {
          paramObj.dataList[i].children = undefined
        }
      }
      finded++
    }
    // 匹配完毕即停止递归遍历
    if (finded < taskIds.length && item.children && item.children.length > 0) {
      replaceFindTask({
        ...paramObj,
        dataList: item.children,
        finded,
      })
    }
  }
}

//计算线条样式
const styleline = ({ boxNode }: any) => {
  const boxDom = boxNode || '.okrListTable'
  $(boxDom)
    .find('tbody tr td')
    .removeAttr('style')
  const selectlineArr: any = []
  selectlineArr.push($(boxDom).find('tbody tr.pitch_on')[0])
  const nextAllNode = $(boxDom)
    .find('tbody tr.pitch_on')
    .nextAll()
  const lineColor = '1px solid #a2c3fa'
  if (nextAllNode.length > 0) {
    for (let i = 0; i < nextAllNode.length; i++) {
      const islastling: any = $(nextAllNode[i]).hasClass('o_content_tr')
      if (!$(nextAllNode[i]).hasClass('o_content_tr')) {
        selectlineArr.push(nextAllNode[i])
      }
      if (islastling) {
        break
      }
    }
  }
  // 同一目标O链条区域内的所有行
  if (selectlineArr.length > 1) {
    if (
      $(boxDom)
        .find('tbody')
        .find('.task_content_tr .add_kr_ObjectLing').length > 0
    ) {
      $(boxDom)
        .find('tbody')
        .find('.task_content_tr .add_kr_ObjectLing')
        .prev()
        .css({
          marginTop: '50px',
        })
    } else {
      $(boxDom)
        .find('tbody')
        .find('.task_content_tr .ant-table-row-expand-icon')
        .removeAttr('style')
    }
    for (let i = 0; i < selectlineArr.length; i++) {
      const thisRow = $(selectlineArr[i])
      const islitch: any = thisRow.hasClass('pitch_on')
      // 区域内每个tr的第一个td
      thisRow.find('td:first-of-type').css({
        borderLeft: lineColor,
        // borderRight: lineColor,
        borderBottom: 'none',
        borderTop: 'none',
      })
      // 区域内每个tr的最后一个td
      thisRow.find('td:last-of-type').css({
        borderRight: lineColor,
        borderBottom: 'none',
        borderTop: 'none',
      })
      // 区域内的第一行
      if (i == 0 && islitch) {
        // 第一个tr的其他td
        thisRow.find('td').css({
          borderTop: lineColor,
          borderBottom: 'none',
          borderRadius: '0',
        })

        if (thisRow.find('td').length > 1) {
          // 第一个tr的第一个td
          thisRow.find('td:first-of-type').css({
            borderRadius: '8px 0 0',
          })
          // 第一个tr的最后一个td
          thisRow.find('td:last-of-type').css({
            borderRadius: '0 8px 0 0',
          })
        } else {
          thisRow.find('td:first-of-type').css({
            borderRadius: '8px 8px 0 0',
          })
        }
      }
      // 区域内的最后一行
      if (i == selectlineArr.length - 1) {
        // 最后一个tr的其他td
        thisRow.find('td').css({
          borderBottom: lineColor,
          borderTop: 'none',
          borderRadius: '0',
        })
        if (thisRow.find('td').length > 1) {
          // 最后一个tr的第一个td
          thisRow.find('td:first-of-type').css({
            borderRadius: '0 0 0 8px',
          })
          // 最后一个tr的最后一个td
          thisRow.find('td:last-of-type').css({
            borderRadius: '0 0 8px 0',
          })
        } else {
          // 最后一个tr的第一个td
          thisRow.find('td:first-of-type').css({
            borderRadius: '0 0 8px 8px',
          })
        }

        break
      }
    }
  }
  // else {
  //   $(selectlineArr[0])
  //     .find('td')
  //     .css({
  //       border: lineColor,
  //       borderRadius: '8px',
  //     })
  // }
}
