import React, { useEffect, useState, useImperativeHandle, useContext, useRef } from 'react'
import { Table, Avatar, Progress, Tag, Input, DatePicker, message, Tooltip } from 'antd'
import $c from 'classnames'
import moment from 'moment'
import { useDrag, useDrop, DragPreviewImage } from 'react-dnd'
import update from 'immutability-helper'
import { useSelector } from 'react-redux'
import { addTaskNode, findOperationBtn, findContacts, findWeightsScore, saveSupports } from './getfourData'
import { editOKRtask } from '../work-plan-mind/getData'
import { taskFollow, cancleTaskFollow } from '../workdesk/getData'
import DetailModal from '@/src/views/task/taskDetails/detailModal'
import { langTypeHandle } from '@/src/common/js/common'
import Evolveprogress from '../workdesk/okrKanban/Evolveprogress'
import { DetailContext, taskDetailContext } from '../task/taskDetails/detailRight'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { updateNodeApi } from '../workdesk/okrKanban/getData'
import { fourQuqdrantContext } from './fourQuadrant'
import { findNowTask } from '../okr-four/okrTableList/okrTableList'
import { ipcRenderer } from 'electron'
import { requestApi } from '@/src/common/js/ajax'

interface DataItemProps {
  key: number
  taskName: globalInterface.WorkPlanTaskProps
  progress: { percent: number; type: number; taskStatus: number; status: number; editProcess: boolean }
  subTaskCount: number
  typeId: number
  children: Array<DataItemProps>
  showInput: boolean
  tagTask: boolean
  weight: boolean //权重
  score: boolean //打分
}
/**
 * 根据不同状态返回任务列表标签
 */
export const setTagByStatus = (item: globalInterface.WorkPlanTaskProps) => {
  return (
    <>
      {item.property === 1 && (
        <Tag color={'#FAD1CE'} style={{ color: '#EA4335' }}>
          {$intl.get('priviate')}
        </Tag>
      )}
      {item.taskStatus === 3 && (
        <Tag color={'#FAD1CE'} style={{ color: '#EA4335' }}>
          {$intl.get('late')}
        </Tag>
      )}
      {item.taskFlag === 1 && <Tag color={'#CDCDCD'}>{$intl.get('freeze')}</Tag>}
      {item.taskFlag === 3 && <Tag color={'#CDCDCD'}>{$intl.get('archive')}</Tag>}
      {item.cycleNum === 0 && <Tag color={'#4285f4'}>{$intl.get('cycle')}</Tag>}
      {item.cycleNum > 0 && (
        <Tag color={'#4285f4'} style={{ width: 'auto' }}>
          {$intl.get('cycle')}
          {item.cycleNum}
        </Tag>
      )}
    </>
  )
}
export const ProgressColors = [
  ['#e9f2ff', '#e9f2ff'],
  ['#34a853', '#cdead5'],
  ['#fbbc05', '#fcecc5'],
  ['#ea4335', '#fad1ce'],
]

/**
 * 工作规划菜单
 * @param props
 * ptProps:父节点属性
 * attachObj：附加参数
 */
let clickFlag: any = null
let blurFlag: any = null
let nameEdit = false
let valueWidth = ''
let nowGetCode: any = 0
let isClick = true
// 缓存页面table数据
let _tableData: any = []
const TableList = React.forwardRef((TaskData: any, ref) => {
  const taskDetailObj: DetailContext = useContext(taskDetailContext)
  const { leftOrgRef, isReFreshOrgLeft } = taskDetailObj
  const { setsupportShow }: any = useContext(fourQuqdrantContext)
  // const { sourceFrom } = TaskData
  // 详情弹框
  const detailModalRef = useRef<any>({})
  const lang = langTypeHandle({ type: 0 })
  if (lang != 'zhCN') {
    valueWidth = '229px'
  } else {
    valueWidth = '207px'
  }
  if (TaskData.mainData.type == '2') {
    valueWidth = '240px'
  }
  let getnowData: any = null
  let getExistDdata = false
  const [tableData, setTableDatas] = useState<DataItemProps[]>([]) //用来存储编辑后的数据
  const { nowUserId, loginToken } = $store.getState()
  const [getProgress, setProgress] = useState({
    process: 0,
    weight: 0,
    score: 0,
  })
  const [expandedRowKey, setExpandedRowKey] = useState<string[]>([])
  //选择派发
  const distributeList = useSelector((store: StoreStates) => store.selectDistribute)
  const [selectedRowKeys, setSelectedRowKeys] = useState<any[]>([])
  //显示隐藏任务详情
  const [opentaskdetail, setTaskdetail] = useState({
    id: 0,
    taskData: {},
    isaddtask: '',
  })
  // 按钮菜单显示隐藏
  const [menuBtnShow, setIconBtnShow] = useState({
    classData: {
      display: 'none',
      pageX: 0,
      pageY: 0,
      row: {},
    },
    moreMenu: [],
  })
  let isUnmounted = false
  const setTableData = (dataList: any) => {
    _tableData = [...dataList]
    setTableDatas([...dataList])
  }
  // 名字输入框节点
  // const [nameRef, setNameRef] = useState(null)

  useEffect(() => {
    return () => {
      _tableData = []
      isUnmounted = true
    }
  }, [])
  useImperativeHandle(ref, () => ({
    //更新KR
    refreshTable: (value: number, data: any) => {
      if (data) {
        updateNowSatus(tableData, data, value)
        if (value == 25) {
          addInsertKrTask(data)
        }
      }
      setTableData([...tableData])
      if (value == 115 || value == 114) {
        if (tableData.length == 1 && tableData[0].taskName.type == 7) {
          tableData.splice(0, 1)
          TaskData.nonedeletTable()
        }
        if (data.type == 3) {
          changeAllKR()
        }
      }
    },
    refreshBtnTable: (value: any, data: DataItemProps) => {
      changSingleData(value, data, tableData)
      if (!getExistDdata && (value == 30 || value == 31)) {
        data.key = data.taskName.id
        tableData.push(data)
      }
      setTableData([...tableData])
    },
    // 外部调用单条刷新
    refreshQuadrantTableData: refreshTableData,
  }))
  // 刷新公共数据方法
  const refreshTableData = ({
    taskIds,
    optType,
    parentId,
    newChildId,
  }: {
    taskIds: any[]
    optType?: string
    parentId?: any
    newChildId?: any
  }) => {
    if (optType == 'changePosition') {
      tableData.forEach((item: any) => {
        if (newChildId.id == item.typeId) {
          dragUpdateTask(taskIds, item, tableData, 'changNow')
        }
      })
      return false
    }
    let isSingele = 1
    // 需要查询的任务id列表
    const taskIdList: any = [...taskIds]
    const findItem = {
      findItem: {},
      isDel: false,
    }
    const replaceObj = {
      dataList: _tableData,
      taskIds: taskIdList,
      newDatas: null,
      finded: 0,
    }
    switch (optType) {
      // 给O添加任务
      case 'relateTask':
        isSingele = 2
        break
      default:
        break
    }
    // 不查询任务数据，直接更新遍历更改后的的数据
    if (taskIdList.length == 0) {
      setTableData({ ...tableData })
    } else {
      const params = {
        typeIds: taskIdList.join(','),
        loginUserId: nowUserId,
      }
      if (isSingele) {
        const findId = isSingele == 2 ? parentId : taskIdList[0]
        findNowTask({ dataList: tableData, findId, findItem })
        addTaskRefresh({
          optType,
          data: findItem.findItem,
          newChildId,
        })
      }
      updateNodeApi(params, '/task/work/plan/findTreeByIdIn').then((resDatas: any) => {
        console.log(resDatas)
        console.log('replaceObj', replaceObj)
        if (!isUnmounted) {
          const dataList = resDatas.dataList

          replaceTask({
            ...replaceObj,
            newDatas: dataList,
          })

          setTableData([..._tableData])
          // console.log('_tableData', _tableData)
        }
      })
    }
  }
  /**
   * 外部新增kr或任务刷新
   * updateType：更新类型 replaceNow：直接替换当前这条数据 其他：在父节点中push
   */
  const addTaskRefresh = async ({ data, optType, newChildId, updateType }: any) => {
    let parentRow = data || {}
    if (!data || JSON.stringify(data) == '{}') {
      return
    }
    let isExpandedRow = false
    // 当前任务替换方式
    if (updateType == 'replaceNow') {
      const findObj = {
        dataList: tableData,
        findId: data.parentTypeId,
        findItem: { findItem: {} },
        optType,
      }
      findNowTask(findObj)
      parentRow = findObj.findItem.findItem
      // 只有正在新增的任务则说明未展开过
      if (parentRow.children.length == 1 && parentRow.children[0].isAdd) {
        parentRow.children = []
        isExpandedRow = true
      }
      // 未展开时主动展开子节点
    } else if (updateType != 'replaceNow' && !expandedRowKey.includes(data.key)) {
      isExpandedRow = true
    }
    if (isExpandedRow) {
      // 修改添加关联任务无展开符号问题
      if (optType == 'relateTask' && data.children.length == 0) {
        data.subTaskCount = data.subTaskCount + 1
        data.hasChild = data.hasChild + 1
      }
      expandedRow(true, parentRow)
      return
    }
    //没有外部传入的新增子级数据则查询一次
    const urls = '/task/work/plan/findTreeByIdIn'
    const params = {
      typeIds: newChildId,
      loginUserId: nowUserId,
    }
    // 查询最新数据项
    const resData: any = await updateNodeApi(params, urls)
    const dataList = resData.dataList || []
    const contentList = packTableList({
      contentList: dataList,
      parentId: parentRow.id,
      parentTypeId: parentRow.typeId,
      mainId: parentRow.mainId,
    })
    const newChildren = contentList[0] || {}
    // 把当前数据替换成新数据
    if (updateType && updateType == 'replaceNow') {
      // 空值后台可能不返，故依据最长字段的
      const findItem = { ...newChildren }
      for (const key in findItem) {
        const val = findItem[key]
        // 排除不更新的健，更新children会导致子节点清空，故不更新
        data[key] = val
      }
      // 创建完成更新创建状态
      data.isAdd = false
    } else if (optType == 'addKr' || optType == 'relateTask' || optType == 'addTask') {
      let insertNum = 0
      let iskrnode = false
      if (optType == 'addKr') {
        //添加KR需要插入到KR最后一个
        if (data.children.length > 0) {
          for (let i = 0; i < data.children.length; i++) {
            if (data.children[i].taskName.type == 1) {
              insertNum = i
              iskrnode = true
              break
            }
          }
          if (!iskrnode) {
            insertNum = data.children.length
          }
        } else {
          insertNum = 0
        }
        data.children.splice(insertNum, 0, newChildren)
      } else if (optType == 'relateTask' || optType == 'addTask') {
        //任务
        data.children.push(newChildren)
        // insertNum = data.children.length - 1
      }

      data.subTaskCount = data.subTaskCount + 1
      data.hasChild = data.hasChild + 1
      if (!expandedRowKey.includes(data.key)) {
        expandedRowKey.push(data.key)
        setExpandedRowKey([...expandedRowKey])
      }
      setTableData([...tableData])
    }
  }

  const addInsertKrTask = (data: any, type?: string) => {
    let getIndex = -1
    const existData = tableData.filter((data: any) => data.taskName.id == 0)
    for (let i = 0; i < tableData.length; i++) {
      if (tableData[i].taskName.type == 7) {
        getIndex = i
        break
      }
    }
    if (type) {
      data.taskName.name = ''
    }
    if ($('.fourQuadrant').find('.part_name_input').length > 0) {
      nowGetCode = data.taskName.type
      return false
    } else {
      nowGetCode = 0
    }
    console.log(nowGetCode)
    if (existData.length == 0) {
      getNowList(tableData)
      if (data.taskName.type == 3 && getIndex != -1) {
        tableData.splice(getIndex, 0, data)
      } else {
        tableData.push(data)
      }
    }
  }
  const changSingleData = (value: any, data: any, dataList: any) => {
    dataList.find((item: DataItemProps, index: number) => {
      if (item.taskName && item.taskName.id == data.taskName.id) {
        getExistDdata = true
        item.taskName = data.taskName
        if (value == 28) {
          item.progress = data.progress
        } else if (value == 30) {
          item.key = data.taskName.id
          if (data.children.length > 0 || (data.subTaskCount > 0 && data.children.length == 0)) {
            item.subTaskCount = 1
            item.children = data.children || []
            item.taskName.children = data.children || []
          }
        }
      } else if (item.children && item.children.length > 0) {
        changSingleData(value, data, item.children || [])
      }
    })
  }
  //递归插入任务列表子元素 9---归档  10---冻结 25--创建任务 100---编辑kr 112-图标  114 --删除单项   115 ---删除整链 5--指派
  const updateNowSatus = (dataList: any, data: any, value: number, parentData?: any) => {
    dataList.find((item: DataItemProps, index: number) => {
      if (value == 5) {
        if (!item.subTaskCount) {
          item.taskName.hasChild = 1
          item.subTaskCount = 1
        } else {
          const index = expandedRowKey.indexOf(item.taskName.id.toString())
          if (index >= 0) {
            TaskData.refreshTask(1)
          }
        }
      } else if (value == 114 || value == 115) {
        if (data.parentId && item.key == data.parentId) {
          if (item.subTaskCount > 0) {
            item.subTaskCount = item.subTaskCount - 1
          }
        } else if (item.taskName.id === data.id) {
          if (value == 114) {
            if (item.subTaskCount == 0) {
              dataList.splice(index, 1)
              if (dataList.length == 0 && parentData) {
                parentData.subTaskCount = 0
              }
              return dataList
            } else {
              TaskData.refreshTask(1)
            }
          } else if (value == 115) {
            dataList.splice(index, 1)
            if (dataList.length == 0 && parentData) {
              parentData.subTaskCount = 0
            }
            return dataList
          }
        }
      } else if ((value == 6 || value == 100) && item.taskName.id === data.taskName.id) {
        if (item.children.length == 0) {
          data.children = []
        } else {
          data.children = item.children
        }
        dataList[index] = data
        return dataList
      } else if (item.taskName.id === data.id) {
        if (value == 112) {
          item.taskName.icon = data.icon
          return dataList
        }
        if (value == 10 || value == 1) {
          if (value == 1) {
            item.taskName.taskStatus = data.taskStatus
            if (item.taskName.taskStatus == 2) {
              item.progress.percent = 100
            } else {
              item.progress.percent = 0
            }
          } else {
            item.taskName.taskFlag = data.taskFlag
          }
          if (item.taskName.taskFlag == 1 || item.taskName.taskStatus == 2) {
            item.taskName.update = false
          } else {
            item.taskName.update = true
          }
        } else if (value == 9) {
          dataList.splice(index, 1)
          if (parentData && dataList.length == 0) {
            parentData.subTaskCount = parentData.subTaskCount - 1
          }
          return dataList
        } else if (value == 103) {
          item.taskName.type = 4
          item.taskName.ascriptionType = data.ascriptionType
          item.taskName.nodeText = data.nodeText
          item.taskName.ascriptionId = data.ascriptionId
          if (data.ascriptionType == 0) {
            item.taskName.roleId = data.roleId
            item.taskName.liableUser = data.liableUser
            item.taskName.liableUsername = data.liableUsername
            item.taskName.liableUserProfile = data.liableUserProfile
          }
        } else if (value == 104) {
          item.taskName.type = 1
        } else if (value == 105 || value == 107 || value == 106 || value == 108) {
          item.taskName.taskStatus = data.taskStatus
          item.taskName.status = data.status
          item.taskName.taskFlag = data.taskFlag
        }
      } else if (
        parentData &&
        item.taskName.parentId == parentData.taskName.id &&
        data.parentId != item.taskName.id
      ) {
        if (value == 10 || (value == 1 && data.taskStatus == 2)) {
          if (value == 1) {
            item.progress.percent = 100
            item.taskName.taskStatus = data.taskStatus
          } else {
            item.taskName.taskFlag = data.taskFlag
          }
          if (item.taskName.taskFlag == 1 || item.taskName.taskStatus == 2) {
            item.taskName.update = false
          } else {
            item.taskName.update = true
          }
          if (
            (parentData.taskName.taskFlag == 1 || parentData.taskName.taskStatus == 2) &&
            item.taskName.status == 1
          ) {
            dataList.splice(index, 1)
            if (parentData && dataList.length == 0) {
              parentData.subTaskCount = parentData.subTaskCount - 1
            }
          }
        } else if (value == 106 || value == 108) {
          item.taskName.status = data.status
          item.taskName.taskFlag = data.taskFlag
        } else if (value == 103) {
          item.taskName.type = 4
        } else if (value == 104) {
          item.taskName.type = 1
        }
      }
      if (item.children && item.children.length > 0) {
        updateNowSatus(item.children, data, value, item)
      }
    })
  }

  //处理传入数据
  useEffect(() => {
    isUnmounted = false
    if (TaskData.TaskData.length != 0) {
      setExpandedRowKey([])
      setSelectedRowKeys([])
      const contentData: globalInterface.WorkPlanTaskProps[] = TaskData.TaskData
      const newTableData = packTableList({
        contentList: contentData,
        parentId: TaskData.mainData.parentId,
        parentTypeId: TaskData.mainData.parentTypeId,
        mainId: TaskData.mainData.mainId,
      })
      setTableData(TaskData.mainData.type == '2' ? addNowData(newTableData) : newTableData)
    }
  }, [TaskData.TaskData, TaskData.TaskData.length])

  //插入添加KR组件
  const addNowData = (tableArr: any) => {
    let getIndex = -1
    tableArr.filter((item: any) => item.taskName.type != 7)
    tableArr.map((item: any, index: number) => {
      if (item.taskName.type == 3) {
        getIndex = index
      }
    })
    if (getIndex != -1) {
      tableArr.splice(getIndex + 1, 0, {
        key: -1,
        taskName: { id: -1, type: 7 },
        progress: { type: 7 },
        tagTask: false,
        subTaskCount: 0,
        typeId: -1,
        children: [],
        showInput: false,
        weight: false,
        score: false,
      })
    } else if (tableArr.length > 0) {
      tableArr.unshift({
        key: -1,
        taskName: { id: -1, type: 7 },
        progress: { type: 7 },
        tagTask: false,
        subTaskCount: 0,
        typeId: -1,
        children: [],
        showInput: false,
        weight: false,
        score: false,
      })
    }
    return tableArr
  }

  /**
   * 封装表格数据
   */
  const packTableList = ({ contentList, parentId, parentTypeId, mainId }: any) => {
    const newTableData: Array<DataItemProps> = []
    contentList.map((item: globalInterface.WorkPlanTaskProps) => {
      if (parentId) {
        item.parentId = parentId
      }
      if (parentId) {
        item.parentTypeId = parentTypeId
      }
      if (mainId) {
        item.mainId = mainId
      }
      newTableData.push({
        key: item.id,
        taskName: { ...item },
        progress: {
          percent: item.process,
          type: item.type,
          taskStatus: item.taskStatus,
          status: item.status,
          editProcess: false,
        },
        tagTask: item.type != 3,
        subTaskCount: item.hasChild,
        typeId: item.typeId,
        children: item.children || [],
        showInput: item.id ? false : true,
        weight: false,
        score: false,
      })
    })
    return newTableData
  }
  //改变时间处理
  const onStartChange = (param: any, data: DataItemProps) => {
    const starttime = data.taskName.startTime
    const endtime = data.taskName.endTime
    if (param.weights || param.weights == 0) {
      if (param.weights == data.taskName.weights) {
        return false
      }
    }
    if (param.score || param.score == 0) {
      if (param.score == data.taskName.score) {
        return false
      } else {
        if (TaskData.mainData.scorRegular == 100) {
          param.score = Math.round(param.score / 10) * 10
        }
      }
    }
    editOKRtask(param).then((resData: any) => {
      if (resData.returnCode == 0) {
        message.success($intl.get('updateSuc'))
        if (param.process || param.process == 0) {
          if (param.processStatus || param.processStatus == 0) {
            data.taskName.processStatus = param.processStatus
          }
          data.progress.editProcess = false
          if (param.process == 100 && data.progress.percent != 100) {
            data.taskName.taskStatus = 2
            data.taskName.update = false
          }
          if (param.cci || param.cci == 0) {
            data.taskName.cci = param.cci
          }
          data.progress.percent = param.process
          TaskData.refreshTask(28, data)
          // 刷新左侧任务链
          isReFreshOrgLeft && isReFreshOrgLeft(28, data.taskName)
        } else if (param.name) {
          data.taskName.name = param.name
          data.showInput = false
          TaskData.refreshTask(27, data)
        } else if (param.startTime) {
          data.taskName.startTime = param.startTime
          TaskData.refreshTask(27, data)
        } else if (param.endTime) {
          const nowDate = moment(new Date()).format('YYYY/MM/DD') + ' 00:00'
          const runTime = Date.parse(param.endTime) - Date.parse(nowDate)
          if (Math.floor(runTime / 1000 / 60 / 60 / 24) >= 0) {
            data.taskName.day = Math.floor(runTime / 1000 / 60 / 60 / 24) + 1
          } else {
            data.taskName.day = 0
          }
          if (
            (Date.parse(TaskData.getstatus.nowWeekEnd + ' 23:59') < Date.parse(data.taskName.endTime) &&
              Date.parse(TaskData.getstatus.fourWeekEnd + ' 23:59') >= Date.parse(data.taskName.endTime) &&
              Date.parse(TaskData.getstatus.nowWeekEnd + ' 23:59') < Date.parse(param.endTime) &&
              Date.parse(TaskData.getstatus.fourWeekEnd + ' 23:59') >= Date.parse(param.endTime)) ||
            (Date.parse(TaskData.getstatus.nowWeekEnd + ' 23:59') >= Date.parse(data.taskName.endTime) &&
              Date.parse(TaskData.getstatus.nowWeekEnd + ' 23:59') >= Date.parse(param.endTime))
          ) {
            data.taskName.endTime = param.endTime
            TaskData.refreshTask(27, data)
          } else {
            data.taskName.endTime = param.endTime
            TaskData.refreshTask(1, data)
          }
        } else if (param.score || param.score == 0) {
          data.taskName.score = param.score
          findWeightsScore(TaskData.mainData.parentId).then((res: any) => {
            setTableData([...tableData])
            TaskData.mainData.setMenuChange(res.data, 'score')
          })
        } else if (param.weights || param.weights == 0) {
          data.taskName.weights = param.weights
          changeAllKR()
        }
      } else {
        if (param.startTime) {
          data.taskName.startTime = starttime || ''
        } else if (param.endTime) {
          data.taskName.endTime = endtime
        }
        setTableData([...tableData])
      }
    })
  }
  //改变kr的权重
  const changeAllKR = (nowCode?: any, nowKrData?: any) => {
    findWeightsScore(TaskData.mainData.parentId).then((res: any) => {
      tableData.forEach((element: any) => {
        res.dataList.map((item: any, index: any) => {
          if (item.filter((nowKey: any) => nowKey == element.taskName.id).length > 0) {
            element.taskName.weights = item[1]
          }
        })
      })
      if (nowCode && nowCode == 13) {
        const getNowData = JSON.parse(nowKrData)
        getNowData.children = []
        addInsertKrTask(getNowData, 'name')
      }
      setTableData([...tableData])
      TaskData.mainData.setMenuChange(res.data, 'score')
    })
  }
  //展示时间处理
  const addiconContent = (data: any, savememberJudge: boolean) => {
    const nodeData = data.taskName
    let isshow = false //任务起止时间
    // let isshow2 = false //任务归属
    let days = ''
    const _propertyTrue = nodeData.nodeText == '******' //他人派发且私密任务
    if (
      nodeData.property > 0 &&
      (nodeData.status == 4 || nodeData.status == 3 || nodeData.status == 5) &&
      _propertyTrue
    ) {
      //私密派发
      isshow = true
      // isshow2 = true
    }
    if (nodeData.type == 2 || nodeData.type == 3) {
      days = $intl.get('remain')
    } else {
      if (nodeData.status == 4 || nodeData.status == 3 || nodeData.status == 5) {
        //派发显示剩余 未派发显示共
        days = ' ' + $intl.get('remain')
      } else {
        days = ' ' + $intl.get('total')
      }
    }
    // let colorControl = false
    // if (nodeData.type == 2 || nodeData.type == 3 || nodeData.status != 1) {
    //   colorControl = true
    // }
    const control = TaskData.getstatus.status || !nodeData.id || !savememberJudge
    return (
      <span
        className={`okr_message ${nodeData.taskStatus == 2 && nodeData.type != 3 ? 'finishedTask' : ''}`}
        style={lang != 'zhCN' ? { marginLeft: '0px' } : {}}
      >
        <span style={{ display: isshow ? 'none' : 'inline-block' }} className="task_day">
          <DatePicker
            className="okr_startTime okr_four_time"
            style={{ width: '35px' }}
            bordered={false}
            showNow={false}
            showTime={{
              defaultValue: nodeData.startTime ? moment(new Date(nodeData.startTime), 'MM/DD') : undefined,
            }}
            value={nodeData.startTime ? moment(new Date(nodeData.startTime), 'MM/DD') : null}
            format="MM/DD HH:mm"
            placeholder="?"
            allowClear={false}
            disabled={control}
            inputReadOnly={true}
            onClick={e => {
              e.stopPropagation()
            }}
            onOk={e => {
              const param = {
                id: nodeData.id,
                parentId: nodeData.id,
                mainId: TaskData.mainData.mainId,
                typeId: nodeData.typeId,
                operateUser: $store.getState().nowUserId,
                startTime: moment(e).format('YYYY/MM/DD HH:mm'),
              }
              onStartChange(param, data)
            }}
          />
          <span>~</span>
          <DatePicker
            className="okr_endTime okr_four_time"
            bordered={false}
            showNow={false}
            showTime={{
              defaultValue: nodeData.endTime ? moment(new Date(nodeData.endTime), 'MM/DD') : undefined,
            }}
            value={moment(new Date(nodeData.endTime), 'MM/DD')}
            format="MM/DD HH:mm"
            placeholder="?"
            allowClear={false}
            showToday={false}
            inputReadOnly={true}
            disabled={control}
            onClick={e => {
              e.stopPropagation()
            }}
            onOk={e => {
              const param = {
                id: nodeData.id,
                parentId: nodeData.id,
                mainId: TaskData.mainData.mainId,
                typeId: nodeData.typeId,
                operateUser: $store.getState().nowUserId,
                endTime: moment(e).format('YYYY/MM/DD HH:mm'),
              }
              if (nodeData.type == 3 && Date.parse(param.endTime) > Date.parse(TaskData.mainData.endTime)) {
                message.error($intl.get('deadlineMustLessOfO'))
                return false
              }
              onStartChange(param, data)
            }}
          />
          <Tooltip title={nodeData.day > 100 ? nodeData.day.toString() : ''}>
            <span>
              {days}
              <span className="task_days getblue">{nodeData.day > 100 ? '99+' : nodeData.day || 0}</span>
              {$intl.get('day')}
            </span>
          </Tooltip>
        </span>
      </span>
    )
  }

  // 列表上右键事件
  const rightClick = (e: any, row: any) => {
    // document.addEventListener('click', hideAllMenu)
    if (
      e.target.parentNode.className === 'ant-picker-input' ||
      e.target.parentElement.className === 'ant-picker-panel' ||
      e.target.className.includes('okr_four_time')
    ) {
      TaskData.refreshTask(2, {
        rightMenuItem: { display: 'none', pageX: 0, pageY: 0, row: {} },
        moreMenu: [],
        taskinfo: {},
      })
      return false
    }
    const leftX = e.pageX + 220 - document.body.clientWidth
    if (e.pageX + 220 > document.body.clientWidth) {
      e.pageX = e.pageX - leftX
    }
    let heightY = 380
    if (row.taskName.type == 3) {
      heightY = 280
    }
    const topY = e.pageY + heightY - document.body.clientHeight
    if (topY > 0) {
      e.pageY = e.pageY - topY
    }
    const rightMenues = {
      display: 'block',
      pageX: e.pageX,
      pageY: e.pageY,
      row: row,
    }
    const param = {
      id: row.typeId,
      userId: $store.getState().nowUserId,
      viewType: 4,
      mainId: TaskData.mainData.mainId,
    }
    findOperationBtn(param).then((resData: any) => {
      if (resData.returnCode == 0) {
        TaskData.refreshTask(2, {
          rightMenuItem: rightMenues,
          moreMenu: resData.dataList,
          taskinfo: resData.data,
        })
      }
    })
  }
  // 隐藏菜单
  const hideAllMenu = () => {
    TaskData.refreshTask(2, {
      rightMenuItem: { display: 'none', pageX: 0, pageY: 0, row: {} },
      moreMenu: [],
      taskinfo: {},
    })
    document.removeEventListener('click', hideAllMenu)
  }

  //创建新规划/修改规划名称
  const createDataKr = (e: any, data: DataItemProps) => {
    let getname = e.target ? e.target.value : e
    const nowCode = e.keyCode
    if (getname == '') {
      getname = $intl.get('branchPlan')
    }
    if (getname == data.taskName.name) {
      data.showInput = false
      setTableData([...tableData])
      return false
    }
    if (!data.taskName.id) {
      //为空时不允许创建
      if (!getname) return

      addTaskNode(
        Number(data.taskName.parentId),
        data.typeId,
        data.taskName.mainId || TaskData.mainData.mainId,
        data.taskName.enterpriseId || data.taskName.teamId,
        data.taskName.enterpriseName || data.taskName.teamName,
        data.taskName.type,
        utf16toEntities(getname),
        data.taskName.endTime
      ).then((resData: any) => {
        // data.taskName.type==3:添加关键结果
        if (data.taskName.type != 3) {
          // 创建子任务刷新
          TaskData.refreshTask(10, {
            typeId: resData.typeId,
            ParentTypeId: data.typeId,
            type: 1,
            taskType: 3,
          }) //刷新title状态
        } else {
          const cache: any = []
          const getNowKRData: any = JSON.stringify(data, function(key, value) {
            if (typeof value === 'object' && value !== null) {
              if (cache.indexOf(value) !== -1) {
                return
              }
              cache.push(value)
            }
            return value
          })
          changeAllKR(nowCode, getNowKRData)
        }

        // 刷新左侧任务链
        isReFreshOrgLeft &&
          isReFreshOrgLeft(10, {
            typeId: resData.typeId,
            ParentTypeId: data.typeId,
            optType: data.taskName.type == 3 ? 'addKr' : 'addTask',
          })

        data.taskName.id = resData.id
        data.taskName.name = resData.name
        data.taskName.typeId = resData.typeId
        data.showInput = false
        data.typeId = resData.typeId
        data.key = resData.id
        let changeData: any = data
        if (data.taskName.parentId != TaskData.mainData.parentId) {
          addDelteTaskData(tableData, data.taskName.parentId)
          changeData = getnowData
        }
        setTableData([...tableData])
        if (Date.parse(TaskData.getstatus.nowWeekEnd + ' 23:59') >= Date.parse(changeData.taskName.endTime)) {
          if (
            TaskData.mainData.type == '2' &&
            data.taskName.type != 3 &&
            (data.taskName.parentId == TaskData.mainData.parentId || changeData.taskName.type == 3)
          ) {
            if (changeData.taskName.type == 3) {
              TaskData.refreshTask(31, data, '1') //象限1
            } else {
              TaskData.refreshTask(30, changeData, '1') //象限1
            }
          } else {
            TaskData.refreshTask(30, changeData)
          }
        } else if (
          Date.parse(TaskData.getstatus.nowWeekEnd + ' 23:59') < Date.parse(changeData.taskName.endTime) &&
          Date.parse(TaskData.getstatus.fourWeekEnd + ' 23:59') >= Date.parse(changeData.taskName.endTime)
        ) {
          if (
            TaskData.mainData.type == '2' &&
            data.taskName.type != 3 &&
            (data.taskName.parentId == TaskData.mainData.parentId || changeData.taskName.type == 3)
          ) {
            if (changeData.taskName.type == 3) {
              TaskData.refreshTask(31, data, '3') //象限3
            } else {
              TaskData.refreshTask(30, changeData, '3') //象限3
            }
          } else {
            TaskData.refreshTask(30, changeData)
          }
        } else {
          // TaskData.refreshTask(30, { ...changeData, isRefreshLeftTree: false })
          TaskData.refreshTask(30, { ...changeData })
        }
        if (nowCode && nowCode == 13 && data.taskName.type != 3) {
          if (data.taskName.parentId == TaskData.mainData.parentId) {
            TaskData.createKRhtml(TaskData.mainData.type, 1)
          } else {
            setTimeout(() => {
              addTaskChildren(getnowData)
            }, 300)
          }
        } else if (nowGetCode) {
          setTimeout(() => {
            if (!nowGetCode.key) {
              TaskData.createKRhtml('2', nowGetCode)
            } else {
              addTaskChildren(nowGetCode)
            }
            nowGetCode = 0
          }, 300)
        }
        // 创建成功后同步刷新工作台
        // refreshData({
        //   optType: data.taskName.type == 3 ? 'addKr' : 'addTask',
        //   item: data,
        //   newChild: data.taskName,
        // })
      })
    } else {
      const param = {
        id: data.taskName.id,
        parentId: data.taskName.id,
        mainId: data.taskName.mainId || TaskData.mainData.mainId,
        typeId: data.typeId,
        operateUser: $store.getState().nowUserId,
        name: utf16toEntities(getname),
      }
      onStartChange(param, data)
    }
  }

  /**
   * 选择支撑数据弹框
   */
  const selSupportModal = ({ record }: any) => {
    const row = record.taskName || {}
    setsupportShow({
      visible: true,
      dataInfo: row,
      onSure: (value: any) => {
        pushTaskContentFn({ callbackData: value, row, optType: 'relateTask' })
      },
    })
  }

  /**
   * 关联任务
   */
  const pushTaskContentFn = ({ callbackData, row }: any) => {
    saveSupports(callbackData[0].id, [
      {
        mainId: row.mainId || TaskData.mainData.mainId,
        mainParentId: row.id,
        isExtends: false,
      },
    ]).then((_: any) => {
      //内部数据局部刷新
      refreshTableData({
        taskIds: [callbackData[0].id],
        optType: 'relateTask',
        newChildId: callbackData[0].id,
        parentId: row.typeId,
      })
      // 创建成功后同步刷新工作台或其他外部列表
      isReFreshOrgLeft &&
        isReFreshOrgLeft(8, {
          typeId: callbackData[0].typeId || callbackData[0].id,
          ParentTypeId: row.typeId,
          newChildId: callbackData[0].typeId || callbackData[0].id,
        })
      // 创建成功后同步刷新工作台或其他外部列表
      // refreshData({
      //   optType: 'relateTask',
      //   typeId: callbackData[0].typeId || callbackData[0].id,
      //   newChildId: callbackData[0].typeId || callbackData[0].id,
      //   parentTypeId: row.typeId,
      // })
    })
  }

  //递归添加/删除子任务
  const addDelteTaskData = (nowDataList: any, parentId: any, type?: string) => {
    nowDataList.map((item: DataItemProps, numdata: number) => {
      if (item.taskName.id == parentId) {
        if (type) {
          item.children = item.children.filter(getdata => getdata.key != 0)
        } else {
          if (item.children.length == 1) {
            item.children = []
            const index = expandedRowKey.indexOf(parentId)
            if (index >= 0) {
              expandedRow(true, item)
              // expandedRowKey.splice(index, 1)
              // setExpandedRowKey([...expandedRowKey])
            }
          }
          item.subTaskCount = 1
          item.taskName.hasChild = 1
          getnowData = item
          return false
        }
      }
      if (item.children && item.children.length > 0) {
        addDelteTaskData(item.children, parentId)
      }
    })
  }
  //设置行名称
  const setRowClassName = (record: any) => {
    let className
    if (record.subTaskCount === 0) {
      className = 'noExpandable'
    } else {
      className = ''
    }
    if (
      record.taskName &&
      (record.taskName.status != 1 || record.taskName.type == 3 || !record.taskName.liableUser) &&
      TaskData.getstatus.status
    ) {
      className += ' selectRow'
    }
    if (TaskData.mainData.type == '2') {
      // const getkrList = eidtKrData().krList
      // const nowId = getkrList ? getkrList : tableData[0]
      let createpersonAuth = true
      if (TaskData.mainData.personAuth && TaskData.mainData.personAuth.length > 0) {
        if (TaskData.mainData.personAuth.filter((element: any) => element.id == nowUserId).length == 0) {
          createpersonAuth = false
        }
      }
      if (record.taskName?.type == 3 && createpersonAuth) {
        className += ' add_Kr_Event'
      }
      if (record.taskName?.type == 3) {
        className += ' kr_content_tr'
      }
      if (record.taskName?.type == 7) {
        className += ' add_object_kr'
      }
      if (record.taskName?.type == 1) {
        className += ' add_task_Event'
      }
      // const getNowName =
      //   $('.part-now-status table').find('.add_task_Event') || $('.part-now-status table').find('.add_Kr_Event')
      // if (getNowName.length > 0) {
      //   setTimeout(() => {
      //     const heig = getNowName.find('.table_text_right')
      //     if (Number(heig.height()) > 85) {
      //       heig.addClass('addHeight')
      //     } else if (heig.hasClass('addHeight')) {
      //       heig.removeClass('addHeight')
      //     }
      //     if (nowId.taskName.type != 3 && nowId.taskName.id) {
      //       heig.addClass('topHeight')
      //     } else if (heig.hasClass('topHeight')) {
      //       heig.removeClass('topHeight')
      //     }
      //   }, 500)
      // }
    }

    return className
  }

  //递归插入任务列表子元素
  const updateTaskData = (tableData: any, parentId: number, childData: Array<DataItemProps>) => {
    tableData.find((item: DataItemProps) => {
      if (item.taskName.id === parentId) {
        item.children = childData
        return tableData
      }
      if (item.children && item.children.length > 0) {
        updateTaskData(item.children, parentId, childData)
      }
    })
  }
  //展开行
  const expandedRow = (expanded: any, record: any) => {
    if (expanded) {
      if (expandedRowKey.filter(RowKey => RowKey == record.key).length == 0) {
        expandedRowKey.push(record.key)
        setExpandedRowKey([...expandedRowKey])
        record.taskName.mainId = TaskData.mainData.mainId
        // 四象限 联动 左侧列表展开
        TaskData.useModule &&
          TaskData.useModule.includes('twoQuarant') &&
          leftOrgRef &&
          leftOrgRef.current &&
          leftOrgRef.current.expandLeftTableNode({
            expanded: true,
            row: record.taskName,
            handExp: [record.key],
            outside: true,
          })
      }
    } else {
      const expandedRow = expandedRowKey.filter(RowKey => RowKey != record.key)
      setExpandedRowKey(expandedRow)
    }

    if (record.children && record.children.length > 0) {
      record.children.map((item: any) => {
        if (distributeList && distributeList.length > 0) {
          distributeList.forEach((element: any) => {
            if (item.typeId == element) {
              jQuery(`.fourQuadrant .ant-table-row[data-row-key='${item.key}']`)
                .find('.ant-checkbox')
                .addClass('ant-checkbox-checked')
            }
          })
        }
      })
      return
    }
    const nowTaskId = record.taskName.id
    const param = {
      operateUser: nowUserId,
      mainId: TaskData.mainData.mainId,
      id: nowTaskId,
      level: '',
      hasOther: '1',
      typeId: record.typeId,
      hasSelf: 1,
    }
    $api
      .request('/task/work/plan/queryTree', param, {
        headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
      })
      .then(resData => {
        const childTaskData = resData.data.children
        // const childDataItemArr: Array<DataItemProps> = childTaskData.map(
        //   (item: globalInterface.WorkPlanTaskProps) => {
        //     item.parentId = nowTaskId
        //     return {
        //       key: item.id,
        //       taskName: { ...item },
        //       progress: {
        //         percent: item.process,
        //         type: item.type,
        //         taskStatus: item.taskStatus,
        //         status: item.status,
        //         editProcess: false,
        //       },
        //       subTaskCount: item.hasChild,
        //       showInput: false,
        //       tagTask: record.taskName.type == 3,
        //       weight: false,
        //       score: false,
        //       typeId: item.typeId,
        //       children: item.children || [],
        //     }
        //   }
        // )
        const childDataItemArr = packTableList({
          contentList: childTaskData,
          parentId: nowTaskId,
          parentTypeId: record.taskName.typeId,
          mainId: record.taskName.mainId,
        })
        //动态添加任务子任务
        const newTable = tableData.concat([])
        updateTaskData(newTable, nowTaskId, childDataItemArr)
        setTableData(newTable)
        childDataItemArr.map((item: any) => {
          if (distributeList && distributeList.length > 0) {
            distributeList.forEach((element: any) => {
              if (item.typeId == element) {
                jQuery(`.fourQuadrant .ant-table-row[data-row-key='${item.key}']`)
                  .find('.ant-checkbox')
                  .addClass('ant-checkbox-checked')
              }
            })
          }
        })
      })
  }
  const addTaskChildren = (data: any) => {
    const item = Object.assign({}, data.taskName)
    item.type = 1
    item.parentId = data.taskName.id
    item.id = 0
    item.name = ''
    item.liableUsername = ''
    item.hasChild = 0
    item.status = 1
    item.taskStatus = 0
    item.taskFlag = 0
    item.property = 0
    item.cycleNum = -1
    item.nodeText = ''
    if (data.children && data.children.filter((element: any) => element.key == 0).length > 0) {
      return false
    }
    getNowList(tableData)
    if (!data.children) data.children = []
    data.children.push({
      key: item.id,
      taskName: { ...item },
      progress: {
        percent: item.process,
        type: item.type,
        taskStatus: item.taskStatus,
        status: item.status,
        editProcess: false,
      },
      subTaskCount: item.hasChild,
      // KRprogress: false,
      tagTask: data.taskName.type == 3,
      typeId: item.typeId,
      children: [],
      showInput: true,
      weight: false,
      score: false,
    })
    if (expandedRowKey.filter(RowKey => RowKey == data.key).length == 0) {
      expandedRowKey.push(data.key)
      setExpandedRowKey([...expandedRowKey])
    }
    setTableData([...tableData])
  }
  //处理多余的添加数据，当前只保留一个
  const getNowList = (nowData: any) => {
    nowData.map((item: any, itemIndex: any) => {
      if (item.key == 0) {
        return nowData.splice(itemIndex, 1)
      } else if (item.children && item.children.length > 0) {
        getNowList(item.children)
      }
    })
  }
  // 隐藏人员组织架构菜单
  const hideOrgMenu = () => {
    TaskData.refreshTask(4, {
      classData: { display: 'none', pageX: 0, pageY: 0, row: {} },
      moreMenu: [],
      taskinfo: {},
    })
    document.removeEventListener('click', hideOrgMenu)
  }
  // 选择人员组织架构菜单
  const menuBtnClick = (e: any, row: any) => {
    // document.addEventListener('click', hideOrgMenu)
    const getParData: any = $(e.target)
      .parents('.fourQuadrant')
      .offset()
    const scrolltop: any = $(e.target)
      .parents('.fourQuadrant')
      .scrollTop()
    const rightMenues = {
      display: 'block',
      pageX: e.pageX - getParData.left,
      pageY: e.pageY - getParData.top + scrolltop,
      row: row,
    }
    findContacts(Number(row.enterpriseId)).then((res: any) => {
      menuBtnShow.classData = rightMenues
      menuBtnShow.moreMenu = res.dataList || []
      setIconBtnShow({ ...menuBtnShow })
      TaskData.refreshTask(4, {
        classData: rightMenues,
        moreMenu: res.dataList || [],
        taskinfo: res.data,
      })
    })
  }
  //状态显示颜色
  const getstatusColor = (val: any) => {
    let color = ''
    let bgcolor = ''
    let text = ''
    if (val == 0) {
      color = '#4285F4'
      bgcolor = '#E9F2FF'
      text = $intl.get('normal')
    } else if (val == 1) {
      color = '#FFAA00'
      bgcolor = '#FFF6E1'
      text = $intl.get('hasRisks')
    } else if (val == 2) {
      color = '#34A853'
      bgcolor = '#E5F7E8'
      text = $intl.get('leading')
    } else if (val == 3) {
      color = '#EA4335'
      bgcolor = '#FEF3F2'
      text = $intl.get('delay')
    }
    return {
      color: color,
      bgcolor: bgcolor,
      text: text,
    }
  }
  const columns = [
    {
      title: $intl.get('taskName'),
      dataIndex: 'taskName',
      key: 'taskName',
      render: (record: globalInterface.WorkPlanTaskProps, data: DataItemProps, index: number) => {
        let colorControl = false
        if (record.type == 3 || record.status != 1) {
          colorControl = true
        }
        const personAuth = JudegAuth(record)
        const headDef: any = $tools.asAssetsPath('/images/workplan/head_def.png')
        const recordIcon: any = $tools.asAssetsPath(`/images/task/${record.icon}.png`)
        // const getkrList = eidtKrData().krList
        // const nowId = getkrList ? getkrList.key : tableData[0].key
        const profile = record.liableUsername ? record.liableUserProfile || '' : headDef
        let profileBackgroundColor = colorControl && record.liableUsername ? '#4285f4' : '#D7D7D9'
        if (profile) {
          profileBackgroundColor = ''
        }
        let createpersonAuth = true
        if (TaskData.mainData.personAuth && TaskData.mainData.personAuth.length > 0) {
          if (TaskData.mainData.personAuth.filter((element: any) => element.id == nowUserId).length == 0) {
            createpersonAuth = false
          }
        }
        const cancleCreateKr = () => {
          if (blurFlag) {
            //取消上次延时未执行的方法
            blurFlag = clearTimeout(blurFlag)
          }
          if (!data.taskName.id) {
            if (data.taskName.parentId == TaskData.mainData.parentId) {
              tableData.splice(
                tableData.findIndex(elemt => elemt.key == 0),
                1
              )
              if (tableData.length == 1 && tableData[0].taskName.type == 7) {
                tableData.splice(0, 1)
                TaskData.nonedeletTable()
              }
            } else {
              addDelteTaskData(tableData, data.taskName.parentId, 'del')
            }
          }
          data.showInput = false
          setTableData([...tableData])
          return
        }
        return (
          <>
            {TaskData.mainData.type == '2' &&
              !TaskData.getstatus.status &&
              createpersonAuth &&
              record.type == 7 && (
                <div
                  className="add_kr_ObjectLing"
                  onClick={(e: any) => {
                    e.stopPropagation()
                    if (
                      $(e.target)
                        .parents('.quadrantBordData')
                        .find('.part_name_input').length > 0
                    ) {
                      nowGetCode = 3
                    } else {
                      nowGetCode = 0
                      TaskData.createKRhtml('2', 3)
                    }
                  }}
                >
                  <i></i>
                  {$intl.get('createKR')}
                </div>
              )}
            {record.type != 7 && (
              <div
                className={$c('part_okr_content', { finishedTask: record.taskStatus == 2 && record.type != 3 })}
              >
                <div className="task-part-text">
                  {!data.showInput && (
                    <>
                      <div
                        className="part-text-content"
                        onDoubleClick={() => {
                          if (clickFlag) {
                            //取消上次延时未执行的方法
                            clickFlag = clearTimeout(clickFlag)
                          }

                          if (!TaskData.getstatus.status && personAuth && !JudgeNameChange(tableData)) {
                            data.showInput = true
                            setTableData([...tableData])
                          }
                        }}
                      >
                        {record.type == 3 && <span className="specail-show-type">KR{index + 1}</span>}
                        {/* 草稿任务不显示Task */}
                        {record.type == 1 && record.status != 1 && (
                          <span className={`specail-show-task ${colorControl ? 'getblue' : ''}`}>Task</span>
                        )}
                        {/* {record.type == 5 && record.status != 1 && (
                        <span className={`specail-show-task ${colorControl ? 'getblue' : ''}`}>Project</span>
                      )} */}
                        {record.type != 3 &&
                          record.status != 3 &&
                          record.status != 4 &&
                          record.status != 5 &&
                          record.taskStatus != 2 && (
                            <Tooltip title={$intl.get('draftDistribute')}>
                              <Tag style={{ color: '#9A9AA2', borderColor: '#9A9AA2' }}>
                                {$intl.get('myDraft')}
                              </Tag>
                            </Tooltip>
                          )}
                        {record.icon && (
                          <span className="okr_icon" data-id={record.icon}>
                            <img
                              src={recordIcon}
                              style={{
                                width: '100%',
                              }}
                            />
                          </span>
                        )}
                        <span className="text-ellipsis part-text-okr">{record.name}</span>
                        {record.type != 3 && setTagByStatus(record)}
                      </div>
                      {record.type != 3 && TaskData.mainData.type == '2' && (
                        <div className="name_Colum"> {addiconContent(data, personAuth)}</div>
                      )}
                    </>
                  )}
                  {(record.type == 4 || record.type == 41) && record.taskFlag != 0 && !data.showInput && (
                    <span className="specail-show specail-show-coor"></span>
                  )}
                  {(record.type == 4 || record.type == 41) && record.taskFlag == 0 && !data.showInput && (
                    <span className="specail-show specail-show-isdialogue"></span>
                  )}
                </div>
                {data.showInput && (
                  <div className="part_name_input">
                    {record.type == 3 && <span className="specail-show-type">KR</span>}
                    <Input
                      defaultValue={record.name}
                      autoFocus
                      maxLength={100}
                      onKeyUp={(e: any) => {
                        if (e.keyCode == 13) {
                          const value = e.target.value
                          //为空时不允许创建
                          if (!value) {
                            cancleCreateKr()
                            return
                          } else if (value == '' && data.taskName.id) {
                            data.showInput = false
                            setTableData([...tableData])
                            return false
                          } else {
                            if (isClick) {
                              isClick = false
                              createDataKr(e, data)
                              setTimeout(function() {
                                isClick = true
                              }, 1000)
                            }
                          }
                        }
                      }}
                      onBlur={e => {
                        e.stopPropagation()
                        nowGetCode = 0
                        const getname = e.target.value
                        //为空时不允许创建
                        if (!getname) {
                          cancleCreateKr()
                          return
                        }

                        // if (!data.taskName.id) {
                        // if (getname == '') {
                        //   getname = '分支计划'
                        // }
                        // }
                        // if (getname == '') {
                        //   data.showInput = false
                        //   setTableData([...tableData])
                        //   return
                        // }
                        // if (blurFlag) {
                        //   //取消上次延时未执行的方法
                        //   blurFlag = clearTimeout(blurFlag)
                        // }
                        blurFlag = setTimeout(() => {
                          createDataKr(getname, data)
                        }, 300) //延时300毫秒执行
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
                          const _val = $(e.target)
                            .parents('.part_name_input')
                            .find('input')
                            .val()
                          //为空时不允许创建
                          if (!_val) {
                            cancleCreateKr()
                            return
                          }

                          if (isClick) {
                            isClick = false
                            createDataKr(_val, data)
                            setTimeout(function() {
                              isClick = true
                            }, 1000)
                          }
                        }}
                      ></div>
                      <div
                        className="cancel_create_btn"
                        onClick={(e: any) => {
                          e.stopPropagation()
                          cancleCreateKr()
                          // 取消创建唯一一个则全局刷新
                          if (tableData.length == 0) {
                            // 创建子任务刷新
                            TaskData.refreshTask(1, {
                              typeId: data.typeId,
                              ParentTypeId: data.typeId,
                              type: 1,
                            }) //刷新title状态
                          }
                        }}
                      ></div>
                    </div>
                  </div>
                )}
                <div className={$c('part-person-kr', { finishedTask: record.taskStatus === 2 })}>
                  {!data.showInput && (
                    <>
                      <div
                        className="node_portrait_main"
                        onClick={(e: any) => {
                          e.stopPropagation()
                          if (!TaskData.getstatus.status && personAuth) {
                            menuBtnClick(e, record)
                          }
                        }}
                      >
                        <Avatar
                          size={24}
                          src={profile}
                          style={{
                            backgroundColor: profileBackgroundColor,
                            fontSize: '11px',
                          }}
                        >
                          {record.liableUsername ? record.liableUsername.substr(-2, 2) : ''}
                        </Avatar>
                        <span
                          className="text-ellipsis"
                          style={{
                            marginLeft: '4px',
                            maxWidth: '48px',
                            minWidth: '48px',
                            verticalAlign: '-6px',
                          }}
                        >
                          {record.liableUsername ? record.liableUsername : '未分配'}
                        </span>
                        <span className="edit_portrait"></span>
                      </div>
                      <Tooltip title={data.taskName.nodeText || ''}>
                        <div
                          className={`okr_affiliation ${colorControl ? 'getblue' : ''}`}
                          style={record.type != 3 && TaskData.mainData.type == '2' ? { width: '81px' } : {}}
                          onClick={(e: any) => {
                            e.stopPropagation()
                            if (TaskData.getstatus.status || !data.taskName.id || !personAuth) {
                              return false
                            }
                            TaskData.refreshTask(5, data.taskName)
                          }}
                        >
                          {data.taskName.nodeText || '?'}
                        </div>
                      </Tooltip>
                      {record.type != 3 && TaskData.mainData.type == '2' && addiconContent(data, personAuth)}
                    </>
                  )}
                </div>
              </div>
            )}
          </>
        )
      },
    },
    {
      title: $intl.get('taskProgress'),
      dataIndex: 'progress',
      width: valueWidth,
      key: 'progress',
      className: 'table_text_right',
      render: (progress: any, data: DataItemProps) => {
        const personAuth = JudegAuth(data.taskName)
        if (!progress) {
          return <></>
        }
        const colorIndex = 0
        //进度条的色彩
        const strokeColor = ProgressColors[colorIndex][0]
        //未完成的分段的颜色
        const trailColor = ProgressColors[colorIndex][1]
        let judgeProcs = false
        if (progress.type != 3 && (data.taskName.status === 1 || data.taskName.taskStatus == 0)) {
          judgeProcs = true
        }
        return (
          <>
            {progress.type != 3 && TaskData.mainData.type != '2' && addiconContent(data, personAuth)}
            {progress.type == 3 && !data.showInput && (
              <>
                <div
                  className="show_input_list"
                  style={{ height: '22px' }}
                  onClick={(e: any) => {
                    e.stopPropagation()
                  }}
                >
                  <span className="show_input_name" style={{ left: '-8px' }}>
                    信心指数
                  </span>
                  <span
                    className="name_blod_blue"
                    style={{ marginRight: '10px', marginTop: '3px', color: '#70707A' }}
                  >
                    <i></i>
                    {data.taskName.cci}
                  </span>
                  <span className="show_input_name" style={{ left: '57px' }}>
                    {$intl.get('nowStatus')}
                  </span>
                  <span
                    className="name_blod_blue"
                    style={{ height: '22px', padding: '0px', lineHeight: '13px' }}
                  >
                    <span
                      className="status_icon"
                      style={{
                        border: `1px solid ${getstatusColor(data.taskName.processStatus).color}`,
                        backgroundColor: `${getstatusColor(data.taskName.processStatus).bgcolor}`,
                      }}
                    >
                      <span
                        className="status_icon_color"
                        style={{ backgroundColor: `${getstatusColor(data.taskName.processStatus).color}` }}
                      ></span>
                    </span>
                    <span
                      className="status_icon_text"
                      style={{
                        color: `${getstatusColor(data.taskName.processStatus).color}`,
                        minWidth: 'auto',
                        padding: '0',
                      }}
                    >
                      {getstatusColor(data.taskName.processStatus).text}
                      <div
                        className="okr_evolve_box"
                        onClick={(e: any) => {
                          e.stopPropagation()
                        }}
                      >
                        <div className="evolve_progress">
                          <Evolveprogress
                            id={data.taskName.id}
                            type={data.taskName.type}
                            cci={data.taskName.cci}
                            typeId={data.taskName.typeId}
                            percent={data.taskName.process}
                            processStatus={data.taskName.processStatus}
                            hasAuth={data.taskName.update ? 1 : 0}
                            setcallbackFn={(value: any, evolvestart: any, cci: any) => {
                              //进度
                              const param: any = {
                                id: data.taskName.id,
                                mainId: data.taskName.mainId,
                                typeId: data.taskName.typeId,
                                operateUser: $store.getState().nowUserId,
                                process: value || 0,
                                processStatus: evolvestart,
                              }
                              if (data.taskName.type == 3) {
                                param.cci = cci
                              }
                              onStartChange(param, data)
                            }}
                          />
                        </div>
                      </div>
                    </span>
                  </span>
                </div>
                <div
                  className="show_input_list"
                  onClick={(e: any) => {
                    e.stopPropagation()
                    if (!TaskData.getstatus.status && personAuth) {
                      tableData.forEach((item: DataItemProps) => {
                        if (item.weight) {
                          item.progress.editProcess = false
                        }
                      })
                      progress.editProcess = true
                      setTableData([...tableData])
                      getProgress.process = progress.percent
                      setProgress({ ...getProgress })
                    }
                  }}
                >
                  <span className="show_input_name">{$intl.get('progress')}</span>
                  <span className="name_blod_blue">{progress.percent}%</span>
                  {progress.editProcess && (
                    <Input
                      min={0}
                      size="small"
                      max={100}
                      className="show_percent"
                      maxLength={5}
                      autoFocus={true}
                      value={getProgress.process}
                      onClick={(e: any) => {
                        e.stopPropagation()
                      }}
                      onChange={e => {
                        changeInputVal(e, 'progress')
                      }}
                      onKeyUp={(e: any) => {
                        if (e.keyCode == 13) {
                          if (Number(e.target.value) == progress.percent) {
                            data.progress.editProcess = false
                            setTableData([...tableData])
                            return false
                          }
                          const param = {
                            id: data.taskName.id,
                            parentId: data.taskName.id,
                            mainId: TaskData.mainData.mainId,
                            typeId: data.typeId,
                            operateUser: $store.getState().nowUserId,
                            process: Number(e.target.value.replace(/^[0]+/, '')),
                          }
                          onStartChange(param, data)
                        }
                      }}
                      onBlur={e => {
                        if (Number(e.target.value) == progress.percent) {
                          data.progress.editProcess = false
                          setTableData([...tableData])
                          return false
                        }
                        const param = {
                          id: data.taskName.id,
                          parentId: data.taskName.id,
                          mainId: TaskData.mainData.mainId,
                          typeId: data.typeId,
                          operateUser: $store.getState().nowUserId,
                          process: Number(e.target.value.replace(/^[0]+/, '')),
                        }
                        onStartChange(param, data)
                      }}
                    />
                  )}
                </div>
                <div
                  className="show_input_list"
                  onClick={e => {
                    e.stopPropagation()
                    if (
                      eidtKrData().taskid == data.taskName.id ||
                      (!eidtKrData().taskid && eidtKrData().preId == data.taskName.id)
                    ) {
                      return message.warning($intl.get('modifyOthersWeightOfKR'))
                    }
                    if (!TaskData.getstatus.status && personAuth) {
                      tableData.forEach((item: DataItemProps) => {
                        if (item.weight) {
                          item.weight = false
                        }
                      })
                      data.weight = true
                      getProgress.weight = data.taskName.weights
                      setProgress({ ...getProgress })
                      setTableData([...tableData])
                      // document.addEventListener('click', hideAllKR)
                    }
                  }}
                >
                  <span className="show_input_name">{$intl.get('weight')}</span>
                  <span className="name_blod_blue">{data.taskName.weights || 0}%</span>
                  {data.weight && (
                    <Input
                      min={0}
                      size="small"
                      className="show_percent"
                      max={100}
                      // ref={(el: any) => setNameRef(el)}
                      maxLength={5}
                      value={getProgress.weight}
                      autoFocus={true}
                      onClick={(e: any) => {
                        e.stopPropagation()
                      }}
                      onChange={e => {
                        changeWeightInputVal(e, 'weight')
                      }}
                      onKeyUp={(e: any) => {
                        if (e.keyCode == 13) {
                          data.weight = false
                          setTableData([...tableData])
                          const param = {
                            id: data.taskName.id,
                            parentId: data.taskName.id,
                            mainId: TaskData.mainData.mainId,
                            typeId: data.typeId,
                            operateUser: $store.getState().nowUserId,
                            weights: Number(e.target.value.replace(/^[0]+/, '')),
                          }
                          onStartChange(param, data)
                        }
                      }}
                      onBlur={e => {
                        data.weight = false
                        setTableData([...tableData])
                        const param = {
                          id: data.taskName.id,
                          parentId: data.taskName.id,
                          mainId: TaskData.mainData.mainId,
                          typeId: data.typeId,
                          operateUser: $store.getState().nowUserId,
                          weights: Number(e.target.value.replace(/^[0]+/, '')),
                        }
                        onStartChange(param, data)
                      }}
                    />
                  )}
                </div>
                <div
                  className="show_input_list"
                  onClick={e => {
                    e.stopPropagation()
                    if (!TaskData.getstatus.status && personAuth) {
                      tableData.forEach((item: DataItemProps) => {
                        if (item.score) {
                          item.score = false
                        }
                      })
                      data.score = true
                      getProgress.score = data.taskName.score
                      setProgress({ ...getProgress })
                      setTableData([...tableData])
                      // document.addEventListener('click', hideAllKR)
                    }
                  }}
                >
                  <span className="show_input_name">{$intl.get('grade')}</span>
                  <span className="name_blod_blue">{data.taskName.score || 0}</span>
                  {data.score && (
                    <Input
                      min={0}
                      size="small"
                      className="show_percent"
                      max={TaskData.mainData.scorRegular}
                      // ref={(el: any) => setNameRef(el)}
                      maxLength={5}
                      value={getProgress.score}
                      autoFocus={true}
                      onClick={(e: any) => {
                        e.stopPropagation()
                      }}
                      onChange={e => {
                        changeOKRInputVal(e, 'score')
                      }}
                      onKeyUp={(e: any) => {
                        if (e.keyCode == 13) {
                          // if (Number(e.target.value) == progress.percent) {
                          data.score = false
                          setTableData([...tableData])
                          const param = {
                            id: data.taskName.id,
                            parentId: data.taskName.id,
                            mainId: TaskData.mainData.mainId,
                            typeId: data.typeId,
                            operateUser: $store.getState().nowUserId,
                            score: Number(e.target.value.replace(/^[0]+/, '')),
                          }
                          onStartChange(param, data)
                          // }
                        }
                      }}
                      onBlur={e => {
                        data.score = false
                        setTableData([...tableData])
                        const param = {
                          id: data.taskName.id,
                          parentId: data.taskName.id,
                          mainId: TaskData.mainData.mainId,
                          typeId: data.typeId,
                          operateUser: $store.getState().nowUserId,
                          score: Number(e.target.value.replace(/^[0]+/, '')),
                        }
                        onStartChange(param, data)
                      }}
                    />
                  )}
                </div>
              </>
            )}
            {progress.type != 3 && !data.showInput && TaskData.mainData.type == '2' && progress.type != 7 && (
              <>
                <div
                  className="show_input_list"
                  onClick={e => {
                    e.stopPropagation()
                  }}
                >
                  <span className="show_input_name">{$intl.get('nowStatus')}</span>
                  <span>-</span>
                </div>
                <div
                  className="show_input_list"
                  onClick={(e: any) => {
                    e.stopPropagation()
                    if (!TaskData.getstatus.status && personAuth) {
                      progress.editProcess = true
                      setTableData([...tableData])
                      getProgress.process = progress.percent
                      setProgress({ ...getProgress })
                    }
                  }}
                >
                  <span className="show_input_name">{$intl.get('progress')}</span>
                  <span>{progress.percent}%</span>
                  {progress.editProcess && (
                    <Input
                      min={0}
                      size="small"
                      className="show_percent"
                      max={100}
                      maxLength={5}
                      // ref={(el: any) => setNameRef(el)}
                      value={getProgress.process}
                      autoFocus={true}
                      onClick={(e: any) => {
                        e.stopPropagation()
                      }}
                      onChange={e => {
                        changeInputVal(e, 'progress')
                      }}
                      onKeyUp={(e: any) => {
                        if (e.keyCode == 13) {
                          if (Number(e.target.value) == progress.percent) {
                            data.progress.editProcess = false
                            setTableData([...tableData])
                            return false
                          }
                          const param = {
                            id: data.taskName.id,
                            parentId: data.taskName.id,
                            mainId: TaskData.mainData.mainId,
                            typeId: data.typeId,
                            operateUser: $store.getState().nowUserId,
                            process: Number(e.target.value.replace(/^[0]+/, '')),
                          }
                          onStartChange(param, data)
                        }
                      }}
                      onBlur={e => {
                        if (Number(e.target.value) == progress.percent) {
                          data.progress.editProcess = false
                          setTableData([...tableData])
                          return false
                        }
                        const param = {
                          id: data.taskName.id,
                          parentId: data.taskName.id,
                          mainId: TaskData.mainData.mainId,
                          typeId: data.typeId,
                          operateUser: $store.getState().nowUserId,
                          process: Number(e.target.value.replace(/^[0]+/, '')),
                        }
                        onStartChange(param, data)
                      }}
                    />
                  )}
                </div>
                <div
                  className="show_input_list"
                  onClick={e => {
                    e.stopPropagation()
                  }}
                >
                  <span>-</span>
                </div>
                <div
                  className="show_input_list"
                  onClick={e => {
                    e.stopPropagation()
                  }}
                >
                  <span>-</span>
                </div>
              </>
            )}
            {progress.type != 3 && TaskData.mainData.type != '2' && (
              <div
                style={{ width: 32 }}
                className={`row_progress ${progress.editProcess ? 'active' : ''} ${judgeProcs ? 'notEdit' : ''}
              ${data.taskName.taskStatus == 2 && data.taskName.type != 3 ? 'finishedTask' : ''}`}
              >
                {judgeProcs ? (
                  // <Progress width={32} strokeWidth={12} type="circle" percent={0} format={() => '-/-'} />
                  <span className="process-disabled">-/-</span>
                ) : (
                  <Progress
                    strokeColor={strokeColor}
                    trailColor={trailColor}
                    type={'circle'}
                    format={() =>
                      `${progress.percent.toString().includes('.') ? progress.percent : progress.percent + '%'}`
                    }
                    percent={progress.percent}
                    width={32}
                    strokeWidth={12}
                  ></Progress>
                )}

                <div
                  className="show_progress "
                  onClick={e => {
                    e.stopPropagation()
                    if (!TaskData.getstatus.status && personAuth) {
                      progress.editProcess = true
                      setTableData([...tableData])
                      getProgress.process = progress.percent
                      setProgress({ ...getProgress })
                    }
                  }}
                >
                  {progress.editProcess && (
                    <Input
                      min={0}
                      size="small"
                      max={100}
                      className="show_percent"
                      maxLength={5}
                      autoFocus={true}
                      value={getProgress.process}
                      onClick={(e: any) => {
                        e.stopPropagation()
                      }}
                      // ref={(el: any) => setNameRef(el)}
                      onChange={e => {
                        changeInputVal(e, 'progress')
                      }}
                      onKeyUp={(e: any) => {
                        if (e.keyCode == 13) {
                          if (Number(e.target.value) == progress.percent) {
                            data.progress.editProcess = false
                            setTableData([...tableData])
                            return false
                          }
                          const param = {
                            id: data.taskName.id,
                            parentId: data.taskName.id,
                            mainId: TaskData.mainData.mainId,
                            typeId: data.typeId,
                            operateUser: $store.getState().nowUserId,
                            process: Number(e.target.value.replace(/^[0]+/, '')),
                          }
                          onStartChange(param, data)
                        }
                      }}
                      onBlur={e => {
                        if (Number(e.target.value) == progress.percent) {
                          data.progress.editProcess = false
                          setTableData([...tableData])
                          return false
                        }
                        const param = {
                          id: data.taskName.id,
                          parentId: data.taskName.id,
                          mainId: TaskData.mainData.mainId,
                          typeId: data.typeId,
                          operateUser: $store.getState().nowUserId,
                          process: Number(e.target.value.replace(/^[0]+/, '')),
                        }
                        onStartChange(param, data)
                      }}
                    />
                  )}
                </div>
              </div>
            )}
          </>
        )
      },
    },
    {
      title: $intl.get('optBtnGroup'),
      dataIndex: 'taskName',
      width: '0px',
      key: 'taskName',
      className: 'okrOptBtn_td',
      render: (record: globalInterface.WorkPlanTaskProps, data: DataItemProps) => {
        let personAuth = true
        if (TaskData.mainData.personAuth && TaskData.mainData.personAuth.length > 0) {
          if (TaskData.mainData.personAuth.filter((element: any) => element.id == nowUserId).length == 0) {
            personAuth = false
          }
        }
        return (
          !data.showInput &&
          record.type != 7 && (
            <div className="okrOptBtnGroup taskOptBtnGroup">
              {record.type != 2 && record.type != 3 && (
                <>
                  {record.status != 1 && (
                    <Tooltip
                      title={
                        record.isFollow && record.isFollow == 1
                          ? $intl.get('cancelFollow')
                          : $intl.get('follow')
                      }
                    >
                      <span
                        className={`collect_icon ${record.isFollow == 1 ? 'nofollowIcon' : ''}`}
                        onClick={(e: any) => {
                          e.stopPropagation()
                          if (TaskData.getstatus.status) {
                            return false
                          }
                          if (record.isFollow && record.isFollow == 1) {
                            cancleTaskFollow({ taskId: record.typeId, userId: nowUserId }).then(res => {
                              message.success($intl.get('cancelFollow') + $intl.get('success'))
                              record.isFollow = 0
                              if (record.type != 3) {
                                TaskData.refreshTask(26, data)
                              } else {
                                setTableData([...tableData])
                              }
                            })
                          } else {
                            taskFollow({
                              belong: 'org',
                              belongId: record.enterpriseId,
                              belongName: record.enterpriseName,
                              userId: nowUserId,
                              followType: 'task',
                              followId: record.typeId,
                            }).then(res => {
                              message.success($intl.get('follow') + $intl.get('success'))
                              record.isFollow = 1
                              if (record.type != 3) {
                                TaskData.refreshTask(26, data)
                              } else {
                                setTableData([...tableData])
                              }
                            })
                          }
                        }}
                      ></span>
                    </Tooltip>
                  )}
                  <Tooltip title={$intl.get('createChildTask')}>
                    <span
                      className={`${
                        personAuth && !TaskData.getstatus.status ? 'add_child_icon' : 'add_child_icon_disable'
                      }`}
                      onClick={(e: any) => {
                        e.stopPropagation()
                        if (personAuth && !TaskData.getstatus.status) {
                          if (
                            $(e.target)
                              .parents('.quadrantBordData')
                              .find('.part_name_input').length > 0
                          ) {
                            nowGetCode = data
                          } else {
                            nowGetCode = 0
                            addTaskChildren(data)
                          }
                          console.log(nowGetCode)
                        }
                      }}
                    ></span>
                  </Tooltip>
                  <Tooltip title={$intl.get('more')}>
                    <span
                      className="more_icon"
                      onClick={(event: any) => {
                        event.stopPropagation()
                        if (!TaskData.getstatus.status) {
                          rightClick(event, data)
                        }
                      }}
                    ></span>
                  </Tooltip>
                </>
              )}
              {record.type == 3 && (
                <>
                  <Tooltip title={$intl.get('relateTask')}>
                    <span
                      className={`${
                        personAuth && !TaskData.getstatus.status
                          ? 'relate_child_icon'
                          : 'relate_child_icon_disable'
                      }`}
                      style={{ width: '18px' }}
                      onClick={(e: any) => {
                        e.stopPropagation()
                        if (personAuth && !TaskData.getstatus.status) {
                          // TaskData.refreshTask(8, record)
                          selSupportModal({ record: data })
                        }
                      }}
                    ></span>
                  </Tooltip>
                  <Tooltip title={$intl.get('createChildTask')}>
                    <span
                      className={`${
                        personAuth && !TaskData.getstatus.status ? 'add_child_icon' : 'add_child_icon_disable'
                      }`}
                      onClick={(e: any) => {
                        e.stopPropagation()
                        if (personAuth && !TaskData.getstatus.status) {
                          if (
                            $(e.target)
                              .parents('.quadrantBordData')
                              .find('.part_name_input').length > 0
                          ) {
                            nowGetCode = data
                          } else {
                            nowGetCode = 0
                            addTaskChildren(data)
                          }
                          console.log(nowGetCode)
                        }
                      }}
                    ></span>
                  </Tooltip>
                  <Tooltip title={$intl.get('more')}>
                    <span
                      className="more_icon"
                      onClick={(event: any) => {
                        event.stopPropagation()
                        if (!TaskData.getstatus.status) {
                          rightClick(event, data)
                        }
                      }}
                    ></span>
                  </Tooltip>
                </>
              )}
            </div>
          )
        )
      },
    },
  ]
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
  //是否是最后一个KR
  const eidtKrData = () => {
    let id = 0
    let arrKrList: any
    let getIndex = -1
    tableData.forEach((element: any, index: any) => {
      if (element.taskName.type == 3) {
        id = element.taskName.id
        arrKrList = element
        if (!element.taskName.id) {
          getIndex = index - 1
        }
      }
    })
    return {
      taskid: id,
      krList: arrKrList,
      preId: !id ? tableData[getIndex]?.taskName.id : 0, //当新创建kr，返回的之前数据
    }
  }
  //获取kr下方最后一个task
  const getAddPOsition = (nowId: any) => {
    let nowIdes = 0
    nowId.map((item: any, itemKey: number) => {
      if (itemKey == nowId.length - 1) {
        if (item.children && item.children.length > 0) {
          getAddPOsition(item.children)
        } else {
          nowIdes = item.key
        }
      }
    })
    return nowIdes
  }
  const JudegAuth = (data: any) => {
    let personAuth = true
    if (data.type == 3 || data.status == 1) {
      if (TaskData.mainData.personAuth && TaskData.mainData.personAuth.length > 0) {
        if (TaskData.mainData.personAuth.filter((element: any) => element.id == nowUserId).length == 0) {
          personAuth = false
        }
      }
    } else {
      personAuth = data.update
    }
    return personAuth
  }
  const rowSelection = {
    selectedRowKeys,
    columnWidth: 26,
    onChange: (selectedRowKeys: any, selectedRows: any) => {
      setSelectedRowKeys([])
    },
    onSelect: (record: any, selected: any, selectedRows: any, nativeEvent: any) => {
      distributeList.forEach((element: any, index: number) => {
        if (element != record.typeId) {
          selectedRowKeys.push(element)
        }
      })
      if (selected && !nativeEvent.target.parentNode.className.includes('ant-checkbox-checked')) {
        selectedRowKeys.push(record.typeId)
        jQuery(`.fourQuadrant .ant-table-row[data-row-key='${record.key}']`)
          .find('.ant-checkbox')
          .addClass('ant-checkbox-checked')
      } else {
        jQuery(`.fourQuadrant .ant-table-row[data-row-key='${record.key}']`)
          .find('.ant-checkbox')
          .removeClass('ant-checkbox-checked')
      }
      setSelectedRowKeys([...selectedRowKeys])
      $store.dispatch({ type: 'SELECT_DISTRIBUTE_DATE', data: selectedRowKeys })
      if (jQuery('.okrCountDistrib').length > 0) {
        jQuery('.okrCountDistrib').text(`(${selectedRowKeys.length})`)
      } else {
        jQuery('.countDistribute').text(`(${selectedRowKeys.length})`)
      }
    },
    getCheckboxProps: (record: any) => ({
      disabled: record.taskName.status != 1 || record.taskName.type == 3 || !record.taskName.liableUser,
    }),
  }
  // 进度输入值控制整数
  const changeInputVal = (e: any, type: string) => {
    let textboxvalue = e.target.value
    if (textboxvalue.length == 1) {
      textboxvalue = e.target.value.replace(/[^0-9]/g, '')
    } else {
      textboxvalue = e.target.value.replace(/^\D*(\d*(?:\.\d{0,2})?).*$/g, '$1')
    }
    if (textboxvalue > 100) {
      textboxvalue = 100
    }
    getProgress.process = textboxvalue
    setProgress({ ...getProgress })
  }
  const changeWeightInputVal = (e: any, type: string) => {
    let textboxvalue = e.target.value
    if (textboxvalue.length == 1) {
      textboxvalue = e.target.value.replace(/[^0-9]/g, '')
    } else {
      textboxvalue = e.target.value.replace(/^\D*(\d*(?:\.\d{0,1})?).*$/g, '$1')
    }
    if (textboxvalue > 100) {
      textboxvalue = 100
    }
    getProgress.weight = textboxvalue
    setProgress({ ...getProgress })
  }
  //权重，打分规则
  const changeOKRInputVal = (e: any, type: string) => {
    let textboxvalue = e.target.value
    if (textboxvalue.length == 1) {
      textboxvalue = e.target.value.replace(/[^0-9]/g, '')
    } else {
      if (TaskData.mainData.scorRegular > 1) {
        textboxvalue = e.target.value.replace(/\D/g, '')
      } else {
        textboxvalue = e.target.value.replace(/^\D*(\d*(?:\.\d{0,1})?).*$/g, '$1')
      }
    }
    if (textboxvalue > TaskData.mainData.scorRegular) {
      textboxvalue = TaskData.mainData.scorRegular
    }
    getProgress.score = textboxvalue
    setProgress({ ...getProgress })
  }
  /**
   * 左侧自动选中
   * @param row
   */
  const leftOrgClick = (row: any) => {
    const personAuth = JudegAuth(row.taskName)
    // 点击草稿任务打开创建任务窗口
    if (row.taskName.type == 1 && row.taskName.status == 1 && personAuth) {
      TaskData.refreshTask(6, row.taskName) //打开任务详情
    } else {
      // 非草稿任务、okr点击行后刷新详情和左侧
      // 查询左侧okr列表中是否有当前点击项
      if (leftOrgRef && leftOrgRef.current) {
        leftOrgRef &&
          leftOrgRef.current &&
          leftOrgRef.current.clickTheTask({
            findId: row.typeId,
            noFindBack: () => {
              typeDetail(row)
            },
          })
      } else {
        typeDetail(row)
      }
    }
  }
  const setRowEvent = (row: any, index: any) => {
    return {
      onContextMenu: (event: any) => {
        if (!TaskData.getstatus.status && row.key) {
          rightClick(event, row)
        }
      },
      onClick: (e: any) => {
        e.stopPropagation()
        const _con = jQuery('.fourQuadrant .quadrantBordData .ant-table-tbody tr') // 设置目标区域
        if ((!_con.is(e.target) && _con.has(e.target).length === 0) || !row.key) {
          return false
        }
        const className = e.target.className
        if (typeof className !== 'string' || TaskData.getstatus.status || row.taskName.type == 7) {
          return
        }
        if (className.includes('okr_affiliation')) {
        } else if (className.includes('part-text-content') || className.includes('part-text-okr')) {
          if (clickFlag) {
            //取消上次延时未执行的方法
            clickFlag = clearTimeout(clickFlag)
          }
          clickFlag = setTimeout(function() {
            // 查询左侧okr列表中是否有当前点击项
            leftOrgClick(row)
          }, 300) //延时300毫秒执行
        } else if (className.includes('ant-picker-input')) {
        } else if (className.includes('eidt_Kr')) {
        } else {
          // 查询左侧okr列表中是否有当前点击项
          leftOrgClick(row)
        }
      },
      data: row,
      index,
    }
  }
  const typeDetail = (row: any) => {
    const personAuth = JudegAuth(row.taskName)
    // 款详情 四象限 模式下 ， 更新当前选择数据，联动到左侧任务链列表
    // if (planMode == 2 && handleOkrList) {
    //   return handleOkrList(row.taskName)
    // }
    if (row.taskName.type != 3 && (row.taskName.status != 1 || (row.taskName.status == 1 && !personAuth))) {
      opentaskdetail.id = row.typeId
      opentaskdetail.taskData = {
        id: row.typeId,
        name: row.taskName.name,
        ascriptionType: row.taskName.ascriptionType,
        ascriptionId: row.taskName.ascriptionId,
        ascriptionName: row.taskName.ascriptionName,
        status: row.taskName.taskstatus,
        flag: row.taskName.flag,
        approvalStatus: row.taskName.approvalStatus,
      }
      nameEdit = false
      if (row.taskName.status == 1 && !personAuth) {
        opentaskdetail.isaddtask = 'okr_draft'
      } else {
        opentaskdetail.isaddtask = ''
      }

      setTaskdetail({ ...opentaskdetail })
      detailModalRef.current &&
        detailModalRef.current.setState({
          from: 'work-plan', //来源
          id: opentaskdetail.id,
          taskData: opentaskdetail.taskData,
          visible: true,
        })
    } else if (row.taskName.type == 3) {
      TaskData.refreshTask(3, row.taskName) //打开kr详情
    } else if (row.taskName.type != 3 && row.taskName.status == 1 && personAuth) {
      TaskData.refreshTask(6, row.taskName) //打开任务详情
    }
  }
  /**
   * 拖动组件包装表格行
   */
  const DragableBodyRow = (props: any) => {
    const { data, index, className, ...restProps } = props
    if (!data) {
      return <tr {...restProps} />
    }
    const record: any = data.taskName
    // 拖动移入后的hover样式
    const [dropClass, setDropClass] = useState({
      getclass: '',
      begin: true,
      rowData: {},
    })
    // 记录当前拖动放置位置 up目标上方 mid目标中间 down目标下方
    let dragPos = ''
    // 绑定拖动放置
    let targetNode: any = null
    const [{ isOver }, drop] = useDrop({
      accept: 'dragFourRow',
      collect: monitor => {
        const item: any = monitor.getItem() || {}
        if (item.index == index) {
          return {}
        }
        return {
          isOver: monitor.isOver(),
          // dropClassName: dropClass,
        }
      },
      canDrop: (item: any, monitor: any) => {
        let drag = true
        if (
          (item.rowData && item.rowData.key == $(dragRef.current).attr('data-row-key')) ||
          $(dragRef.current).attr('data-row-key') == '0'
        ) {
          drag = false
        }
        return drag
      },
      hover: (_: any, monitor: any) => {
        const item: any = monitor.getItem() || {}
        if (item.index == index || !data.key) {
          dropClass.getclass = ''
          setDropClass({ ...dropClass })
          return {}
        }
        // // 目标节点
        targetNode = dragRef.current
        $(targetNode).css({ left: '0', right: '0px' })
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
        //asdjasss
        const sourceItem = monitor.getItem() || {}
        requestApi({
          url: '/task/work/plan/krSort',
          param: {
            mainId: TaskData.mainData.mainId,
            moveKrId: sourceItem.rowData.key,
            changedKrId: record.id,
          },
          json: true,
        }).then((res: any) => {
          if (res.success) {
            message.success('移动成功')
            dragUpdateTask(record, sourceItem.rowData, tableData)
          } else {
            message.success('移动失败')
          }
        })
      },
    })

    const dragRef: any = useRef(null)
    const [connect, drag, preview] = useDrag({
      item: { type: 'dragFourRow', rowData: data, sourceNode: dragRef, index: index },
      collect: (monitor: any) => ({
        isDragging: monitor.isDragging(),
      }),
      canDrag: () => {
        let drag = true
        if (
          $(dragRef.current)
            .find('.part_name_input')
            .is(':visible') ||
          $(dragRef.current).find('.show_percent').length > 0
        ) {
          drag = false
        }
        return drag
      },
      begin: () => {
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
    // key
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
          {...restProps}
        />
      </>
    )
  }

  /**
   * 拖动后更新源任务和目标任务 nowdata替换的元素 moveData拖动的元素
   */
  const dragUpdateTask = (nowdata: any, moveData: any, tableData: any, type?: string) => {
    let removeI: any = null, //移除的位置
      targetI = 0 //原来的位置
    // 是否查询到需要移除的源节点
    // let isRemove = false
    for (let i = 0; i < tableData.length; i++) {
      const item = tableData[i]
      if (item.typeId == moveData.typeId) {
        item.classline = ''
        removeI = i
        // isRemove = true
      }
      // 拖至首层,记录拖至位置，之后插入新数据
      if (item.typeId == nowdata.typeId) {
        item.classline = ''
        targetI = i
      }
    }
    tableData = update(tableData, {
      $splice: [
        [removeI, 1],
        [targetI, 0, moveData],
      ],
    })
    setTableData([...tableData])
    if (!type) {
      isReFreshOrgLeft &&
        isReFreshOrgLeft(11, {
          typeId: nowdata.typeId,
          ParentTypeId: TaskData.mainData.parentTypeId,
          moveData: moveData.taskName,
        }) //更新右侧
      if ($('.taskDetailCont').length == 0 || $('.okrDetailWindow').length > 0) {
        ipcRenderer.send('refresh_plan_list_main')
      }
    }
  }
  return (
    <>
      {' '}
      {/* 被拖拽的子元素需要被包裹在中 <DndProvider backend={HTML5Backend}>*/}
      <DndProvider backend={HTML5Backend}>
        <Table
          rowSelection={TaskData.getstatus.status ? { ...rowSelection } : undefined}
          columns={columns}
          tableLayout={'fixed'}
          pagination={false}
          showHeader={false}
          dataSource={tableData}
          onRow={setRowEvent}
          rowClassName={setRowClassName}
          components={{
            body: {
              row: DragableBodyRow,
            },
          }}
          onExpand={expandedRow}
          expandedRowKeys={expandedRowKey}
        />
      </DndProvider>
      {/* 任务类型弹框 */}
      <DetailModal
        ref={detailModalRef}
        param={{
          // visible: opentaskdetail.visible,
          from: 'work-plan', //来源
          id: opentaskdetail.id,
          taskData: opentaskdetail.taskData,
        }}
        setvisible={(state: any) => {
          if (nameEdit) {
            TaskData.refreshTask(1, '')
          }
        }}
        callbackFn={() => {
          nameEdit = true
          console.log(nameEdit)
        }}
      />
    </>
  )
})

export default TableList
/**
 * 递归查找当前任务进行替换
 */
const replaceTask = (paramObj: {
  dataList: any
  taskIds: any
  newDatas: any
  finded: number //记录匹配到的任务，匹配完毕停止递归遍历
  optType?: string
  newChild?: any
  e?: any
}) => {
  // 当前查询的id还是typeId
  const queryIdType = 'typeId'
  const taskIds = paramObj.taskIds
  const newDatas = paramObj.newDatas
  let finded = paramObj.finded || 0
  const optType = paramObj.optType
  for (let i = 0; i < paramObj.dataList.length; i++) {
    const item = paramObj.dataList[i]
    if (taskIds.includes(item[queryIdType])) {
      // 新的任务数据列表中匹配出当前任务进行替换更新
      const newDataItem = newDatas.filter((newItem: any) => newItem[queryIdType] === item[queryIdType])
      // 空值后台可能不返，故依据最长字段的
      const findItem = newDataItem[0]
      packDataItem({ data: paramObj.dataList[i], item: findItem })
      // 更新map表
      // treeListMap[findItem[queryIdType]] = { ...paramObj.dataList[i] }
      // 新增子任务
      if ((optType == 'addChildTask' || optType == 'assign') && paramObj.newChild) {
        if (!paramObj.dataList[i].children) {
          paramObj.dataList[i].children = []
        }

        paramObj.dataList[i].children.push(...paramObj.newChild)
      }
      finded++
    }
    // 匹配完毕即停止递归遍历
    if (finded < taskIds.length && item.children && item.children.length > 0) {
      replaceTask({
        ...paramObj,
        dataList: item.children,
        finded,
      })
    }
  }
}
/**
 * 修改单条数据
 */
const packDataItem = ({ data, item }: any) => {
  let _parentId: number | string = ''
  const _parentIdArr = String(item.parentId).includes('###')
    ? item.parentId.split('###').filter((item: any) => {
        return item
      })
    : []

  if (_parentIdArr.length > 0) {
    _parentId = Number(_parentIdArr[_parentIdArr.length - 1])
  }
  item.parentId = _parentId
  data.key = item.id
  data.taskName = { ...item }
  data.progress = {
    percent: item.process,
    type: item.type,
    taskStatus: item.taskStatus,
    status: item.status,
    editProcess: false,
  }
  data.tagTask = item.type != 3
  data.subTaskCount = item.hasChild
  data.typeId = item.typeId
  data.children = item.children || []
  data.showInput = item.id ? false : true
  data.weight = false
  data.score = false
}
//将表情转换成特殊字符
export const utf16toEntities = (str: any) => {
  const patt = /[\ud800-\udbff][\udc00-\udfff]/g // 检测utf16字符正则
  str = str.replace(patt, (char: any) => {
    let H, L, code
    if (char.length === 2) {
      H = char.charCodeAt(0) // 取出高位
      L = char.charCodeAt(1) // 取出低位
      code = (H - 0xd800) * 0x400 + 0x10000 + L - 0xdc00 // 转换算法
      return '&#' + code + ';'
    } else {
      return char
    }
  })
  return str
}
//将特殊字符转换成表情解析
export const uncodeUtf16 = (str: any) => {
  const reg = /\&#.*?;/g
  const result = str.replace(reg, function(char: any) {
    let H, L, code
    if (char.length == 9) {
      code = parseInt(char.match(/[0-9]+/g))
      H = Math.floor((code - 0x10000) / 0x400) + 0xd800
      L = ((code - 0x10000) % 0x400) + 0xdc00
      return unescape('%u' + H.toString(16) + '%u' + L.toString(16))
    } else {
      return char
    }
  })
  return result
}
