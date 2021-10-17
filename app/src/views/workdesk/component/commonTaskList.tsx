import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Table, Avatar, Progress, Tooltip, Pagination, Dropdown, message, Slider, Row, InputNumber } from 'antd'
import {
  getOrgProfileById,
  cancleTaskFollow,
  taskFollow,
  editTaskProgress,
  findOneTaskDetail,
  getWorkingTeamTask,
} from '../getData'
import { quickCreateTask } from '../../task/taskComApi'
import { showSearchIcon } from '../WorkDeskModule'
import { setTagByStatus } from '../../task/task-com/TaskCom'
import NoneData from '@/src/components/none-data/none-data'
import { useSelector } from 'react-redux'
import TaskListOpt from './TaskListOpt'
import $c from 'classnames'
import './TaskList.less'
import { ipcRenderer } from 'electron'
import { findNowTask, handleNowTask } from '../../task/taskManage/TaskManageList'
import * as Maths from '@/src/common/js/math'
import { deskParams, setDeskParams } from '../workDeskStore'
import { refreshPage } from '../TaskListData'
import SearchTaskCom from './search-task-com'
import { queryModuleNum } from '../../myWorkDesk/workDeskModules'
import { getAuthStatus } from '@/src/common/js/api-com'
import { NEWAUTH812 } from '@/src/components'
interface DataProps {
  totalElements: number
  totalPages: number
  content: Array<globalInterface.TaskListProps>
}
interface TagItemProps {
  content: string
  id: number
  rgb: string
}
interface ProgressProps {
  pwidth: string
  progress: any
  taskId: number
  type: string
  flag: number
  status?: number
}
interface DataItemProps {
  id: number
  key: number
  parentId?: any
  childLevel?: any
  taskName: globalInterface.TaskListProps
  liableUser: { name: string; profile: string; executorId: number }
  executeTime: string
  endTime: string
  progress: { percent: number; color: number; executeTime: string; taskId: number; flag: number }
  subTaskCount: number
  handleBtn: globalInterface.TaskListProps
  children: Array<DataItemProps>
  item?: any
}

interface TListProps {
  modulePosition: number
  elementPosition: number
  TaskData: DataProps
  code: string
  moduleType: number
  screenVsible: boolean
  currentPage: {
    pageNo: number
    pageSize: number
  }
  listType: number //模块类型
  paginationChange: (pageNo: number, pageSize: number) => void
  refresh?: any
  detailModalRef?: any
}

export const ProgressColors = [
  //进度的颜色控制
  ['#4DD0E2', '#F1F1F1'],
  ['#4DD0E2', '#F1F1F1'],
  ['#fbbc05', '#fcecc5'],
  ['#FF1515', '#F1F1F1'],
  ['#F1F1F1', '#F1F1F1'], //成功
]

// 数据map表
// const treeListMap: any = {}
const expandedRowKeys: any = {}
export const setExpandedRowKeys = ({ code }: any) => {
  expandedRowKeys[code] = []
}
/**
 * 列表根据类型渲染不同标识
 */
export const filterTaskType = (params: any) => {
  const { type, mType, screen, status } = params
  const sml = mType == 0 && !screen
  const obj = {
    //任务的类型
    Xm: '项目',
    Rw: '任务',
  }
  const renderToolTip = (t: string, s: boolean, st: number) => {
    const params = {
      taskTypeLabel: s,
      taglarg: !s,

      disableImg: st === 2,
      dislargImg: st === 2 && !s,
    }
    params[`board${t}`] = s
    params[`tagboard${t}`] = !s
    return (
      <Tooltip title={s ? '' : obj[t]}>
        <span className={$c(params)}>{s ? obj[t] : ''}</span>
      </Tooltip>
    )
  }
  return (
    <span className="flex">
      {type == 0 && renderToolTip('Rw', sml, status)}
      {type == 1 && renderToolTip('Xm', sml, status)}
    </span>
  )
}
/**
 * 任务列表角色渲染
 */
export const renderRoleTip = (sml: boolean, status: number, code: number) => {
  let cName = ''
  let cTitl = ''
  if (code == 1) {
    cName = 'my_assign'
    cTitl = '由我指派'
  } else if (code == 4) {
    cName = 'my_execute'
    cTitl = '由我执行'
  } else if (code == 5) {
    cName = 'my_leader'
    cTitl = '由我领导'
  } else if (code == 6) {
    cName = 'my_supervise'
    cTitl = '由我督办'
  }
  return (
    <Tooltip title={sml ? '' : cTitl}>
      <span
        className={$c(`myTaskRoleBox ${cName}`, {
          disableImg: status === 2,
          dislargImg: status === 2 && !sml,
        })}
      >
        {cTitl}
        {/* {sml ? cTitl : ''} */}
      </span>
    </Tooltip>
  )
}

//外部刷新工作台打开状态的模块
export const refreshOpenPanle = (code: string) => {
  const deskModle = $('.workdesk-main').find('.desk-module-header')
  const deskModleActive = [...$(deskModle).find('.ant-tabs-tab-active')]
  const refCode = ['report_form', 'my_urge'] //这些模块不触发刷新
  deskModleActive.forEach(element => {
    const module = $(element).find('.moduleElement')
    const dataCode = $(module).attr('data-code') || ''
    if (!refCode.includes(dataCode)) {
      $(element).click()
    }
  })
}
// 判断渲染无数据图片
export const judeNoDataImg = (code: string) => {
  let imgSrc = $tools.asAssetsPath('/images/noData/no_task.png')
  let showTxt = ''
  switch (code) {
    case 'focus_task':
      imgSrc = $tools.asAssetsPath('/images/noData/task_empty.png')
      showTxt = '目前没有你关注的任务哦~'
      break
    case 'draft_task':
      imgSrc = $tools.asAssetsPath('/images/noData/task_empty.png')
      showTxt = '目前你尚未创建任何任务哦~'
      break
    case 'archive_task':
      imgSrc = $tools.asAssetsPath('/images/noData/task_empty.png')
      showTxt = '目前你尚未归档任何任务哦~'
      break

    case 'transfer_tasks':
      imgSrc = $tools.asAssetsPath('/images/noData/task_empty.png')
      showTxt = '目前你尚未移交的任何任务哦~'
      break
    case 'working_team_task':
      imgSrc = $tools.asAssetsPath('/images/noData/task_empty.png')
      showTxt = '目前你尚无数据哦~'
      break
    case 'function_task':
    case 'all_task':
      imgSrc = $tools.asAssetsPath('/images/noData/task_empty.png')
      showTxt = '哦呜~暂时没有任务哦'
      break
    case 'distribute_task':
      imgSrc = $tools.asAssetsPath('/images/noData/task_empty.png')
      showTxt = '目前没有你需要指派的任务哦~'
      break
    case 'responsible_task':
      imgSrc = $tools.asAssetsPath('/images/noData/task_empty.png')
      showTxt = '目前没有你需要执行的任务哦~'
      break
    case 'target_kanban':
      imgSrc = $tools.asAssetsPath('/images/noData/task_empty.png')
      showTxt = '目前你尚未任何目标任务哦~'
      break
    case 'task_supervisor':
      imgSrc = $tools.asAssetsPath('/images/noData/task_empty.png')
      showTxt = '目前你尚未督办任何任务哦~'
      break
    case 'execute_task':
      imgSrc = $tools.asAssetsPath('/images/noData/task_empty.png')
      showTxt = '目前你尚未领导任何任务哦~'
      break
    case 'temporary_work':
    case 'waitting_task':
      imgSrc = $tools.asAssetsPath('/images/noData/task_empty.png')
      showTxt = '目前你尚未任务哦~'
      break
    case 'report_form':
      imgSrc = $tools.asAssetsPath('/images/noData/report_form.png')
      showTxt = '目前你尚未任何台账哦~'
      break
    default:
      break
  }
  return { imgSrc, showTxt }
}

//根据code查询数据de
const getDataFromUrl = (code: string) => {
  let listType: any = ''
  if (!code) {
    listType = 119
    return listType
  }
  switch (code) {
    //关注任务
    case 'focus_task':
      listType = 8
      break
    //领导任务
    case 'execute_task':
      listType = 1
      break
    //所有任务
    case 'all_task':
      listType = 17
      break
    //创建的任务
    case 'draft_task':
      listType = 16
      break
    //派发任务
    case 'distribute_task':
      listType = 10
      break
    //协同任务
    case 'sygergy_task':
      listType = 11
      break
    //执行任务
    case 'responsible_task':
      listType = 2
      break
    //移交任务
    case 'transfer_tasks':
      listType = 3
      break
    //督办任务
    case 'task_supervisor':
      listType = 5
      break
    //项目任务
    case 'working_team_task':
      listType = 20
      break
    //临时任务
    case 'temporary_work':
      listType = 9
      break
    //职能任务
    case 'function_task':
      listType = 7
      break
    //归档任务
    case 'archive_task':
      listType = 14
      break
    //目标任务
    case 'target_kanban':
      listType = 22
      break
    //代办任务
    case 'waitting_task':
      listType = 21
      break
    case 'my_urge': //我催办的
    case 'check_task': //检查项
    case 'wait_receive': //待收汇报
    // case 'waitting_task': //待办任务
    // case 'target_kanban': //目标看板
    case 'okr': //OKR看板
    case 'focus_okr': //OKR关注看板
    case 'report_form': //台账
      // setListLoading(false)
      break
    default:
      listType = 119
      break
  }
  return listType
}
/**
 * 全局刷新面板
 * @param code
 * @param type 0其他 1本面板
 */
const refreshotherPanle = (code: string, type?: number, isFollow?: boolean) => {
  //刷新其他板块
  const deskModle = $('.workdesk-main').find('.desk-module-header')
  const deskModleActive = [...$(deskModle).find('.ant-tabs-tab-active')]
  let refCode = ['report_form', 'my_urge'] //这些模块不触发刷新
  if (type == 1) {
    refCode = [code]
  } else {
    refCode.push(code)
  }
  deskModleActive.forEach(element => {
    const module = $(element).find('.moduleElement')
    const dataCode = $(module).attr('data-code') || ''
    if ((!type && !refCode.includes(dataCode)) || (type == 1 && refCode.includes(dataCode))) {
      console.log('dataCode', dataCode)
      console.log('element:', element)
      $(element).click()
    }
  })
  queryModuleNum({ isFollow, updateNum: true })
}

//过滤 inputNumber 只能输入正整数+2位小数
const limitDecimals = (value: any): any => {
  const reg = /^(\-)*(\d+)\.(\d\d).*$/
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

let refreshingInfo: any = {}
//任务列表组件
const commonTaskList = forwardRef(
  (
    {
      modulePosition,
      elementPosition,
      nowStatus,
      refreshCode,
      code,
      moduleType,
      screenVsible,
      isFollow,
      detailModalRef,
      moduleCode,
    }: any,
    ref
  ) => {
    const [state, setState] = useState<any>({
      tableData: [],
      expandedRowKeys: [],
      totalElements: 0,
    }) //展开的行
    const { nowUserId, loginToken } = $store.getState()
    //任务查询参数
    const [serachParam, setSerachParam] = useState({
      status: [-4],
      startTime: '',
      endTime: '',
      keyword: '',
      tagKeyword: '',
      property: 0,
      pageNo: 0,
      pageSize: 20,
      listType: getDataFromUrl(code),
    })
    // const [loading, setListLoading] = useState(true)
    useEffect(() => {
      ipcRenderer
        .removeListener('refresh_operated_task', refreshTasOkrIpc)
        .on('refresh_operated_task', refreshTasOkrIpc)
    }, [state.tableData])
    //分页查询任务
    // useEffect(() => {
    //   getDataFromUrl(code)
    //   if (serachParam.listType !== 119 && loading) {
    //     setListLoading(false)
    //     if (!moduleCode || moduleCode == code) {
    //       changeTableData()
    //     }
    //   }
    // }, [serachParam.listType])
    /**
     * 初始化监听
     */
    useEffect(() => {
      if (code == refreshCode) {
        initFn()
      }
    }, [code])
    useEffect(() => {
      return () => {
        refreshingInfo = {}
      }
    }, [])

    /**
     * 初始化加载方法
     */
    const initFn = () => {
      ipcRenderer
        .removeListener('refresh_operated_task', refreshTasOkrIpc)
        .on('refresh_operated_task', refreshTasOkrIpc)
      // setListLoading(false)
      changeTableData()
    }
    //请求当前界面的表格数据
    const changeTableData = (paramObj?: any) => {
      const attachObj = paramObj ? paramObj : {}
      const { allRefresh } = attachObj
      // setListLoading(true)
      getWorkingTeamTask(serachParam, isFollow).then((resData: any) => {
        // 获取tab名
        // const getCodeName = deskCodeMap(serachParam.listType)

        const param = {
          ...serachParam,
          listType: getDataFromUrl(code), // 获取当前code 对应 listtype
        }
        //  119 为初始数据，不存在code
        if (param.listType == 119) {
          return
        }

        if (code !== '') {
          setDeskParams({ code: code, param })
        }
        // if (loading) {
        // setListLoading(true)
        // refreshObj[code] = new Date().getTime().toString()
        refreshingInfo[code] = {}
        refreshingInfo[code].refreshNum = 0
        jQuery(window).resize()

        // setTimeout(() => {
        //   let getclass = $('.task-wrap-container').parents('.workDeskModuleItem')
        //   getclass.css({
        //     padding: screenVsible ? '0 24px' : '0 8px',
        //   })
        //   getclass.find('.desk_module_header').css({
        //     padding: screenVsible ? '0px' : '0 8px',
        //   })
        // }, 500)
        const contentData: globalInterface.TaskListProps[] = resData ? resData.content : []
        const newTableData: Array<DataItemProps> = packRowData({
          taskData: contentData,
          childLevel: false,
        })
        state.totalElements = resData.totalElements
        setState({ ...state, tableData: newTableData })
        if (allRefresh) {
          setState({ ...state, tableData: newTableData, expandedRowKeys: [] })
        } else {
          setState({ ...state, tableData: newTableData })
        }
        return () => {
          setExpandedRowKeys(code)
        }
        // }
      })
    }
    useImperativeHandle(ref, () => ({
      refreshTaskList,
    }))
    //分页切换
    const paginationChange = (pageNo: number, pageSize: number) => {
      serachParam.pageNo = pageNo
      serachParam.pageSize = pageSize
      setSerachParam({
        ...serachParam,
      })
      changeTableData()
    }

    const refreshTasOkrIpc = (e: any, data: any) => {
      const refreshFn = () => {
        console.log('refresh_operated_task--', code, data, state.tableData)
        if (data.sourceType?.includes(code) && data.optType == 'report' && data.data?.process == 100) {
          refreshTaskList({
            taskIds: data.data.taskId,
            optType: 'finish',
            code,
          })
        } else {
          if (data.data.taskIds) {
            refreshTaskList({
              taskIds: data.data.taskIds,
              // optType: 'finish',
              code,
            })
          }
        }
      }
      if (refreshingInfo && refreshingInfo[code]) {
        refreshingInfo[code].refreshTimer && clearTimeout(refreshingInfo[code].refreshTimer)
        refreshingInfo[code].refreshTimer = setTimeout(() => {
          refreshFn()
        }, 100)
      }
    }
    //更新进度条
    const updateProgress = (value: any, taskId: number, callback?: () => void) => {
      editTaskProgress({
        operateUser: nowUserId,
        userId: nowUserId,
        taskId: taskId,
        process: value,
      }).then((data: any) => {
        // console.log(data)
        if (data.returnCode == 0) {
          message.success('修改任务进度成功!')
          if (callback) {
            callback()
          }
          // queryOneTask(taskId, 'editProgress', code)
          refreshTaskList({
            taskIds: taskId,
            optType: 'editProgress',
            code,
            foceLogo: '',
            process: value,
          })
        }
      })
    }

    //递归替换当前行数据2
    const updateNowTaskData = (paramObj: {
      tableData: any
      taskId?: any
      updateIdList?: any
      dataArr: Array<DataItemProps> //需要更新的任务
      optType: string
      code: string
      foceLogo?: any
      delDatas?: any
      addChild?: boolean //是否需要新增子任务
      [propName: string]: any
    }) => {
      const { updateIdList, tableData, taskId, dataArr, optType, code, foceLogo, delDatas, addChild } = paramObj
      console.log('当前的type', optType, code, foceLogo)
      const delDataList = delDatas || []
      //如果当前item.children的长度为0 则情况展开
      const delDataFn = (index: number) => {
        // let num: any = $(`.${code}_num`).text() //$(`.${code}_num`)text()|| ''
        // num = num.split(')')[0] || ''
        // num = num.split('(')[1] || ''
        // if (tableData[index].children && tableData[index].children.length > 0) {
        //   const len = tableData[index].children.length + 1
        //   const newNum = parseInt(num) - len
        //   $(`.${code}_num`).text(`(${newNum})`)
        // } else {
        //   $(`.${code}_num`).text(parseInt(num) - 1 ? `(${parseInt(num) - 1})` : '')
        // }
        tableData.splice(index, 1)
      }
      tableData.map((_item: DataItemProps, index: number) => {
        const taskIdList = updateIdList ? updateIdList : [taskId]
        if (taskIdList.includes(_item.key)) {
          // const type1 = ['unfinish', 'start', 'unfreeze', 'freeze']
          // const type2 = ['replay', 'changeBelong', 'edit', 'follower', 'transfer', 'assign', 'editTask']
          // const types = type1.concat(type2)
          const moreType = ['finish', 'editProgress']
          const codes = [
            'working_team_task',
            'temporary_work',
            'function_task',
            'responsible_task',
            'draft_task',
          ]
          const dataItemArr = dataArr.filter((newItem: any) => newItem.key === _item.key)
          const findItem = dataItemArr[0] || {}
          const { percent } = findItem.progress || { percent: 0 }
          // const { item, key, taskName, liableUser, executeTime, endTime, progress, handleBtn } = dataItemArr[0]
          // ==========更新任务数据========//
          for (const key in dataItemArr[0]) {
            const val = dataItemArr[0][key]
            // 排除不更新的健，更新children会导致子节点清空，故不更新
            if (key != 'id' && key != 'key' && key != 'children') {
              paramObj.tableData[index][key] = val
            }
          }
          // 新增一个子任务
          if (addChild && paramObj.newChilds && paramObj.newChilds.length > 0) {
            paramObj.newChilds.map((item: any) => {
              item.childLevel = true
              // 存储父级id
              item.parentId = _item.id
            })
            tableData[index].children.push(...paramObj.newChilds)
          }
          if (optType === 'freeze' || optType === 'unfreeze') {
            _item.item.flag = optType === 'freeze' ? 1 : 0
            // _item.taskName.status = optType === 'freeze' ? 1 : 0
            _item.taskName.flag = optType === 'freeze' ? 1 : 0
            updateNowList(tableData[index].children, _item.item.flag)
          }
          if (moreType.includes(optType) && percent === 100 && codes.includes(code)) {
            console.log('触发一键完成', code)
            //修改 目标，项目，临时，职能任务 需要将选项移除且给出提示
            if (typeof foceLogo != 'undefined') {
              _item.item.status = 2
              _item.taskName.status = 2
            } else {
              const thisTr = $(`.${code}_module`).find('[data-row-key=' + _item.key + ']')
              $(thisTr).fadeOut(1000, () => {
                delDataFn(index)
                //校验本地仓库是否存在当前登录人ID，如果不存在弹框引导提示
                const userMsg: any = localStorage.getItem('TASK_INFO_MSG')
                const userMsgInfo: any[] = JSON.parse(userMsg)
                if (userMsg) {
                  if (!storageHasUser(nowUserId, userMsgInfo)) {
                    ipcRenderer.send('task_finish_visble', 1) //提示引导弹框
                    userMsgInfo.push(nowUserId)
                    localStorage.setItem('TASK_INFO_MSG', JSON.stringify(userMsgInfo))
                  }
                } else {
                  localStorage.setItem('TASK_INFO_MSG', JSON.stringify([nowUserId]))
                }
              })
            }
          }
        }
        if (delDataList.includes(_item.key)) {
          //归档 关注 取消关注
          delDataFn(index)
          // if (
          //   optType === 'archive' ||
          //   optType === 'del' ||
          //   (optType === 'canclefollow' && code === 'focus_task')
          // ) {
          //   //归档 关注 取消关注
          //   delDataFn(index)
          // }
        }
        if (_item.children && _item.children.length > 0) {
          // console.log('子任务归档处理')
          updateNowTaskData({
            ...paramObj,
            tableData: _item.children,
            foceLogo: _item,
          })
        }
      })
    }
    //用于单项变化
    const updateNowList = (tableArr: any, type: any) => {
      if (tableArr && tableArr.length > 0) {
        tableArr.map((item: any) => {
          console.log(item)
          item.item.flag = type
          // item.taskName.status = type
          item.taskName.flag = type
          updateNowList(item.children, type)
        })
      }
    }
    //校验本地仓库是否存储了当前操作的任务ID
    const storageHasUser = (userId: any, userInfo: Array<any>) => {
      let hasUser = false
      for (let i = userInfo.length; i--; ) {
        if (userInfo[i] == userId) {
          hasUser = true
          break
        }
      }
      return hasUser
    }

    //渲染修改当前进度条Input组件
    const RenderProgress = ({ pwidth, progress, taskId, type, flag, status }: ProgressProps) => {
      // 进度百分比输入框组件
      const processInpRef = useRef<any>({})
      const colorIndex = progress == 100 ? 4 : progress.color > 0 ? progress.color - 1 : progress.color
      //进度条的色彩
      const strokeColor =
        ProgressColors[colorIndex] && ProgressColors[colorIndex][0] ? ProgressColors[colorIndex][0] : ''
      //未完成的分段的颜色
      const trailColor =
        ProgressColors[colorIndex] && ProgressColors[colorIndex][1] ? ProgressColors[colorIndex][1] : ''
      const [iVisble, setInput] = useState(false)
      const iptVal = progress.percent
      //进度条
      const [progressValue, setProgressValue] = useState(progress.percent)
      //拖动结束后修改任务进度
      const afterChangeProgress = (value: any) => {
        updateProgress(value, taskId, () => {
          setProgressValue(value) //成功之后设值
        })
      }
      /**
       * 进度百分比输入框组件
       */
      const ProcessInput = forwardRef((props: any, ref) => {
        const { iptVal, status } = props.param
        const [state, setState] = useState<any>({
          process: iptVal,
        })
        /**-
         * 外部调用方法
         */
        useImperativeHandle(ref, () => ({
          setState: (paramObj: any) => {
            setState({ ...state, ...paramObj })
          },
        }))

        const editPropress = () => {
          setInput(false)
          if (state.process == iptVal) {
            return false
          }
          updateProgress(state.process, taskId)
        }

        return (
          <InputNumber
            className="ant-input progress_input ckInput"
            min={0}
            max={100}
            autoFocus
            value={state.process || 0}
            disabled={status == 2 ? true : false}
            style={{ width: '36px', height: '32px' }}
            onChange={(value: any) => {
              setState({ ...state, process: value })
            }}
            formatter={limitDecimals}
            parser={limitDecimals}
            onPressEnter={editPropress}
            onBlur={editPropress}
          />
        )
      })
      return (
        <div
          className={flag === 3 ? '' : `ant_item_progress ${type === 'line' ? 'line flex-1' : ''}`}
          style={{ width: pwidth }}
          onClick={e => {
            if (isFollow) return
            e.stopPropagation()
            if (type == 'circle') {
              if (iptVal == 100) {
                return message.warning('已完成的任务无法修改任务进度!')
              }
              if (flag === 1) {
                return message.warning('冻结的任务无法修改任务进度!')
              }
              if (flag === 3) {
                return message.warning('已归档的任务无法修改任务进度!')
              }
              setInput(true)
            }
          }}
        >
          <Tooltip title={type == 'circle' ? `${iptVal}%` : ''}>
            <Progress
              className={$c({ 'ant-item-progress-line-defalt': type === 'line' })}
              strokeColor={strokeColor}
              trailColor={trailColor}
              type={type == 'line' ? 'line' : 'circle'}
              percent={iptVal}
              format={percent => (type == 'line' ? `${percent}%` : percent)}
              width={32}
              strokeWidth={12}
            ></Progress>
          </Tooltip>

          {type === 'line' && (
            <Slider
              className={$c('ant_item_progress_line_option', {
                isFullPress: screenVsible,
                noFullPress: !screenVsible,
              })}
              disabled={isFollow || progress.percent == 100 || flag === 1 || flag == 3 ? true : false}
              defaultValue={progressValue}
              onAfterChange={afterChangeProgress}
            ></Slider>
          )}
          {type === 'circle' && <div className="show_progress"></div>}
          {iVisble && <ProcessInput ref={processInpRef} param={{ iptVal, status }} />}
        </div>
      )
    }
    const getTooltipText = (tool: any) => {
      let text = '导入的任务: '
      tool.forEach((item: any) => {
        switch (item) {
          case 2:
            text += '我协同的 '
            break
          case -1:
            text += '我关注的 '
            break
          case 1:
            text += '我指派的 '
            break
          case 6:
            text += '我督办的 '
            break
          default:
            break
        }
      })
      return text
    }

    //表格右键操作优化START 列渲染抽离
    //1.任务名称模块
    const ColumnTaskName = (record: globalInterface.TaskListProps) => {
      const orgId = useSelector((state: any) => state.selectTeamId)
      const selectTeamId = orgId == -1 || orgId == '' || isNaN(orgId) ? '' : orgId
      if (moduleType == 0 && !screenVsible) {
        return (
          <div className="flex center-v text-ellipsis" style={{ padding: '10px 0 8px 0' }}>
            <div
              className={$c('task-list-item sml', {
                finishedTask: record.status === 2,
                finishedTaskColor: record.status === 2,
              })}
            >
              <div className="item_top">
                <span className="task-title text-ellipsis">
                  {!selectTeamId && (
                    <Avatar
                      size={16}
                      src={getOrgProfileById(record.ascriptionId)}
                      style={{ marginRight: 10, minWidth: 16 }}
                    ></Avatar>
                  )}
                  {record.icon && (
                    <img
                      className="boardTaskLabel"
                      src={$tools.asAssetsPath(`/images/task/${record.icon}.png`)}
                    />
                  )}
                  {record.name}
                </span>
                {setTagByStatus(record)}
                {record.importRole && record.importRole.length > 0 && (
                  <Tooltip title={getTooltipText(record.importRole)}>
                    <span className="import_icon"></span>
                  </Tooltip>
                )}
              </div>
              <div className="item_tag">
                {filterTaskType({
                  type: record.type,
                  code: code,
                  mType: moduleType,
                  screen: screenVsible,
                  status: record.status,
                })}
                {renderRoleTip(moduleType == 0 && !screenVsible ? true : false, record.status, record.maxRole)}

                {record.tagList && record.tagList.length !== 0 && (
                  <div className="com-tag-content">
                    {record.tagList.map((item: TagItemProps, index: number) => (
                      <span key={index} className="com-list-tag">
                        {item.content}
                        {index !== record.tagList?.length || 0 - 1 ? '/' : ''}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      } else {
        return (
          <div
            className={$c('flex center-v text-ellipsis')}
            style={{
              display: 'flex',
              height: '48px',
              paddingLeft: '0px',
            }}
          >
            <div className={$c('task-list-item larg', { finishedTask: record.status === 2 })}>
              <div className="item_top">
                {!selectTeamId && (
                  <Avatar
                    size={16}
                    src={getOrgProfileById(record.ascriptionId)}
                    style={{ marginRight: 10, minWidth: 16 }}
                  ></Avatar>
                )}
                {record.icon && (
                  <img
                    className="boardTaskLabel"
                    src={$tools.asAssetsPath(`/images/task/${record.icon}.png`)}
                  />
                )}
                <span className="task-title text-ellipsis">{record.name}</span>

                {setTagByStatus(record)}
                {record.importRole && record.importRole.length > 0 && (
                  <Tooltip title={getTooltipText(record.importRole)}>
                    <span className="import_icon"></span>
                  </Tooltip>
                )}
                {filterTaskType({
                  type: record.type,
                  code: code,
                  mType: moduleType,
                  screen: screenVsible,
                  status: record.status,
                })}
                {renderRoleTip(moduleType == 0 && !screenVsible ? true : false, record.status, record.maxRole)}
                {record.tagList && record.tagList.length !== 0 && (
                  <div className="com-tag-content">
                    {record.tagList.map((item: TagItemProps, index: number) => (
                      <span key={index} className="com-list-tag">
                        {item.content}
                        {index !== record.tagList?.length || 0 - 1 ? '/' : ''}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      }
    }
    //3.列表操作按钮
    const ColumnEndTime = (item: any) => {
      //右键是否展示
      const [taskOptShow, setTaskOptShow] = useState(false)
      const key = Maths.uuid()

      return (
        <div className="ant_item_time_box">
          {code !== 'archive_task' && !isFollow && (
            <div className="taskOptBtnGroup">
              <Tooltip title="汇报">
                <span
                  className="report_icon"
                  onClick={(e: any) => {
                    e.stopPropagation()
                    $store.dispatch({
                      type: 'TASK_LIST_ROW',
                      data: {
                        handleBtn: {
                          ...item,
                          time: Math.floor(Math.random() * Math.floor(1000)),
                        },
                        type: 0,
                        sourceType: 'workdesk_' + code,
                      },
                    })
                    $tools.createWindow('DailySummary')
                  }}
                ></span>
              </Tooltip>
              <Tooltip title="新增子任务">
                <span
                  className={`add_child_icon ${
                    (NEWAUTH812
                    ? item.flag != 3 && getAuthStatus('taskFind')
                    : item.flag != 3)
                      ? ''
                      : 'display_none'
                  }`}
                  onClick={(event: any) => {
                    event.stopPropagation()
                    addChildShow(event, item)
                  }}
                ></span>
              </Tooltip>
              <Tooltip title={item.isFollow ? '取消关注' : '关注'}>
                <span
                  className={$c('collect_icon', { nofollowIcon: item.isFollow, display_none: item.flag == 3 })}
                  onClick={e => {
                    e.stopPropagation()
                    // console.log('item===================', item)
                    if (item.isFollow) {
                      // console.log(childLevel)
                      cancleFollowTask(item) //取消关注
                    } else {
                      // followTask(item.id, item.ascriptionId, $.trim(item.ascriptionName)) //关注任务
                      followTask(item) //关注任务
                      // console.log(childLevel)
                    }
                  }}
                ></span>
              </Tooltip>
              <Tooltip title="更多">
                <Dropdown
                  overlayClassName={`base-dropdown workDeskDrop workDeskDrop_${key}`}
                  className={`work_more_drop ${item.flag != 3 ? '' : 'display_none'}`}
                  visible={taskOptShow}
                  onVisibleChange={(flag: boolean) => {
                    if (isFollow) return
                    setTaskOptShow(flag)
                  }}
                  overlay={
                    <TaskListOpt
                      taskOptData={{
                        rowObj: item,
                        fromType: 'desk-working_team_task',
                      }}
                      code={code}
                      callback={(data: any) => {
                        const param = { ...data }
                        // 选择了父任务的情况
                        if (param.optType == 'editTask') {
                          param.newChild = data.data
                          param.parentIdOld = data.parentIdOld || ''
                          if (data.parentId) {
                            param.parentId = data.parentId
                          }
                        }
                        contextMenuCallback(param)
                      }}
                      outVisible={taskOptShow} //外部控制菜单显示隐藏
                      setVisible={(flag: boolean) => {
                        if (isFollow) return
                        setTaskOptShow(flag)
                      }}
                      isWorkDeskIn={true}
                    />
                  }
                  trigger={['click']}
                >
                  <span
                    className="more_icon"
                    onClick={(e: any) => {
                      e.stopPropagation()
                    }}
                  ></span>
                </Dropdown>
              </Tooltip>
            </div>
          )}
          <span hidden className={`dropHide dropHide_${key}`}>
            a
          </span>
        </div>
      )
    }
    //4.任务进度
    const columnProgress = (progress: any) => {
      // console.log(progress)
      //是否显示进度条
      const isSmallScreen = !screenVsible && moduleType == 0
      //进度条宽度
      const w = isSmallScreen ? '32px' : 'calc(100% - 110px)'
      if (progress.executeTime) {
        return (
          <div className="ant_item_progress_wrap" style={isSmallScreen ? { padding: '15px 0px' } : {}}>
            <div
              className={$c('ant_item_liableUser', { liableUserfinished: progress.status === 2 })}
              style={{ display: 'flex', alignItems: 'center', height: '100%' }}
            >
              <Avatar size={24} src={progress.profile} style={{ backgroundColor: '#3949AB', fontSize: 12 }}>
                {progress.name && progress.name.substr(-2, 2) ? progress.name.substr(-2, 2) : ''}
              </Avatar>
            </div>
            <span className="time">
              <span>{progress.endTime.split(' ')[0].substr(5, 9)}</span>
              截止
            </span>
            {isSmallScreen && (
              <RenderProgress
                pwidth={w}
                progress={progress}
                taskId={progress.taskId}
                type="circle"
                flag={progress.flag}
              />
            )}
            {!isSmallScreen && (
              // <div className="ant_item_progress" style={{ width: w, textAlign: 'center' }}>
              <RenderProgress
                pwidth={w}
                progress={progress}
                taskId={progress.taskId}
                type="line"
                flag={progress.flag}
                status={progress.status}
              />
              // </div>
            )}
          </div>
        )
      } else {
        return (
          <div
            className={$c('ant_item_progress_wrap', {
              'ant-progress-none': isSmallScreen,
              'ant-line-none': !isSmallScreen,
            })}
            style={isSmallScreen ? { padding: '15px 0px' } : {}}
          >
            <div
              className={$c('ant_item_liableUser', { liableUserfinished: progress.status === 2 })}
              style={{ display: 'flex', alignItems: 'center', height: '100%' }}
            >
              <Avatar size={24} src={progress.profile} style={{ backgroundColor: '#3949AB', fontSize: 12 }}>
                {progress.name && progress.name.substr(-2, 2) ? progress.name.substr(-2, 2) : ''}
              </Avatar>
            </div>
            <span className="time">
              <span>{progress.endTime.split(' ')[0].substr(5, 9)}</span>
              截止
            </span>
            {isSmallScreen && (
              <Progress
                width={32}
                type="circle"
                percent={0}
                format={() => ' '}
                strokeWidth={12}
                trailColor={'rgb(241, 241, 241)'}
              />
            )}
            {!isSmallScreen && (
              <div className="ant_item_progress line flex-1" style={{ width: w, textAlign: 'center' }}>
                <Progress percent={0} status="exception" />
              </div>
            )}
          </div>
        )
      }
    }

    //当前是否处于全屏 半屏幕 小屏
    const getScreenInfo = () => {
      if (moduleType === 0 && !screenVsible) {
        return {
          columnW: [14, 2, 1, 9],
          showClass: true,
        }
      } else {
        return {
          columnW: [14, 2, 1, 9],
          showClass: false,
        }
      }
    }
    //单行数据
    const RenderTaskItem = (record: globalInterface.TaskListProps) => {
      const key = Maths.uuid()
      return (
        <>
          <Row className="task_content_all">
            {ColumnTaskName(record || {})}
            {ColumnEndTime(record || {})}
          </Row>
          <span hidden className={`dropHide dropHide_${key}`}>
            a
          </span>
        </>
      )
    }
    //行数据
    const columns = [
      // {
      //   title: '下拉菜单',
      //   dataIndex: 'endTime',
      //   key: 'endTime',
      //   width: 'auto',
      //   render: (record: globalInterface.TaskListProps) => <></>,
      // },
      {
        title: '任务名称',
        dataIndex: 'taskName',
        key: 'taskName',
        render: (record: globalInterface.TaskListProps) => RenderTaskItem(record),
      },
      {
        title: '任务名称',
        dataIndex: 'taskName',
        key: 'taskName',
        width: getScreenInfo().showClass ? '150px' : '500px',
        className: 'columnProgress',
        render: (record: any) =>
          columnProgress({
            ...record.progress,
            executeTime: record.executeTime,
            executorId: record.executorUser,
            profile: record?.profile || record?.liable?.profile,
            name: record.executorUsername,
            taskId: record.id,
            flag: record.flag,
            status: record.status,
            endTime: record.endTime,
          }),
      },
      // {
      //   title: '任务名称',
      //   dataIndex: 'handleBtn',
      //   key: 'handleBtn',
      //   width: '0px',
      //   render: (record: any) => ColumnEndTime(record),
      // },
    ]
    const contextMenuCallback = (params?: any) => {
      const { taskId, optType, code } = params
      console.log('工作台右键回调：', params)
      refreshTaskList({
        ...params,
        taskIds: taskId,
        optType,
        code,
        foceLogo: 'foceLogo',
      })
    }
    //取消关注
    const cancleFollowTask = (item: any) => {
      cancleTaskFollow({
        taskId: item.id,
        userId: nowUserId,
      }).then(
        () => {
          message.success('取消关注成功！')
          //列表刷新
          refreshTaskList({
            taskIds: item.id,
            // childLevel: taskItem.childLevel,
            optType: 'canclefollow',
            datas: item,
            code: code,
            foceLogo: 'foceLogo',
            teamId: item.ascriptionId,
          })
        },
        msg => {
          message.error(msg)
        }
      )
    }

    // 组装更新后的任务数据
    const packRowData = ({
      taskData,
      parentId,
      childLevel,
    }: {
      taskData: any
      parentId?: any
      childLevel?: boolean
    }) => {
      const dataItemArr: Array<DataItemProps> = taskData?.map((item: globalInterface.TaskListProps) => {
        item.childLevel = childLevel
        item.parentId = parentId
        return {
          item: item,
          key: item.id,
          id: item.id,
          childLevel,
          parentId,
          taskName: { ...item },
          liableUser: { name: item.executorUsername, profile: item.profile, executorId: item.executorUser },
          executeTime: item.executeTime,
          endTime: item.endTime,
          progress: { ...item.progress, executeTime: item.executeTime, taskId: item.id, flag: item.flag },
          subTaskCount: item.subTaskCount,
          handleBtn: { ...item },
          children: item.childrenData || [],
        }
      })
      return dataItemArr
    }

    /**
     * 数组中遍历当前数据
     * @param paramObj
     */
    const filterNowTask = ({ findId, dataList }: { findId: any; dataList: any }) => {
      let isDel = true,
        taskData = {}
      for (let i = 0; i < dataList.length; i++) {
        if (dataList[i].id == findId) {
          isDel = false
          taskData = dataList[i]
          break
        }
      }
      return {
        isDel,
        taskData,
      }
    }
    /**
     * 根据id查询多个任务
     */
    const findTaskById = ({ findIds, thisRow, parentId }: any) => {
      return new Promise(resolve => {
        // 查询任务最新数据进行更新
        findOneTaskDetail({
          taskIds: findIds.join(','),
          loginUserId: nowUserId,
        }).then((data: any) => {
          const taskData = data.dataList || []
          // 组装更新后的任务数据
          const dataItemArr: Array<DataItemProps> = packRowData({
            taskData,
            parentId,
            childLevel: thisRow ? thisRow.childLevel : false,
          })
          resolve(dataItemArr)
        })
      })
    }
    /**
     * 刷新列表
     * taskIds:查询多个任务的id数组
     * optType:操作类型
     * childLevel:是否是子级任务
     */

    //=================================刷新列表操作（待优化）==============================//
    const refreshTaskList = async (paramObj: {
      rowData?: any
      taskIds: any
      optType?: any
      childLevel?: any
      parentId?: string //新增子任务时需要父任务id
      parentIdOld?: any //编辑任务时更改父级任务前的父任务
      newChild?: any
      datas?: any
      code?: any
      foceLogo?: any
      teamId?: any
      [propName: string]: any
    }) => {
      const { taskIds, code, foceLogo, data, parentIdOld, process } = paramObj
      console.log(paramObj)
      const newTaskIds = data || []
      const tableList = state.tableData
      const optType: string =
        paramObj.optType && paramObj.optType.optType ? paramObj.optType.optType : paramObj.optType
      const newChild: any = paramObj.newChild
      let parentId: any = paramObj.parentId || ''
      let newChildPack: any = []
      // 需要查询的任务id列表
      let findIdList: any = taskIds ? (typeof taskIds == 'number' ? [taskIds] : taskIds) : []
      // 需要更新的任务id
      let updateIdList: any = []
      // 需要删除的任务id
      let delDatas: any = []
      const nowTaskInfo: any = { item: null }
      // 是否控制自动展开
      let handExp = false
      // 是否需要新增子任务
      let addChild = false
      // 编辑任务删除了父任务后的情况
      let editParentTask = 0
      // 编辑任务不同情况记录
      let editTask = 0
      // 是否删除了任务
      // let delTask = false
      // 查询当前任务
      findNowTask({
        dataList: tableList,
        findId: findIdList[0] || '',
        taskInfo: nowTaskInfo,
      })
      // 未更新前当前任务数据
      const thisTask: any = nowTaskInfo.item ? { ...nowTaskInfo.item } : {}
      // 当前任务更新后
      if (optType === 'archive' || optType === 'del') {
        //更新父任务id
        findIdList = thisTask.parentId ? [thisTask.parentId] : []
        delDatas = [taskIds]
      } else if (optType == 'assign') {
        parentId = taskIds
        // 父任务已经展开过的情况下更新父任务及其children数据，否则更新父任务后（不更新children）自动展开
        if (state.expandedRowKeys.includes(parentId)) {
          // 已展开则查询父任务和新增的任务，将新增任务插入父任务
          findIdList = [parentId, ...newTaskIds]
          addChild = true
        } else {
          findIdList = [parentId]
          handExp = true
        }
      } else if (optType == 'editTask') {
        /**
         * 判断是否更新了归属父任务
         */
        // 有更新才做一下处理，没有更新则只刷新当前任务
        if (parentIdOld != parentId) {
          findIdList = []
          newChildPack = packRowData({
            taskData: [newChild],
            parentId: undefined,
            childLevel: true,
          })
          // ==========1 移除当前任务==========//
          if (parentIdOld || (!parentIdOld && !thisTask.childLevel)) {
            // 查询并更新旧的父任务
            parentIdOld && findIdList.push(parentIdOld)
            // 移除当前操作任务
            handleNowTask({
              dataList: tableList,
              findId: taskIds,
              taskInfo: nowTaskInfo,
              optType: 'del',
            })
          }
          // ==========2 更新新的父任务==========//
          // 删除了归属父任务，则此任务移动到第一层
          if (parentIdOld && !parentId) {
            editParentTask = 1
          }
          // 存在父任务，则新增到父任务中，同时更改前的父任务移除当前任务
          else if (parentId && parentIdOld != parentId) {
            editParentTask = 2
            // 查询并更新新的父任务
            findIdList.push(parentId)
            // 新的父任务已经展开过的情况下直接更新children数据，否则自动展开
            if (state.expandedRowKeys.includes(parentId)) {
              addChild = true
            } else {
              handExp = true
            }
          }
        } else {
          editTask = 1
        }
      } else if (optType == 'addChildTask') {
        parentId = taskIds
        findIdList = [parentId]
        // 父任务已经展开过的情况下更新父任务及其children数据，否则更新父任务后（不更新children）自动展开
        if (state.expandedRowKeys.includes(parentId)) {
          // 已展开则查询父任务和新增的任务，将新增任务插入父任务
          addChild = true
          newChildPack = packRowData({
            taskData: [newChild],
            parentId: taskIds,
            childLevel: true,
          })
        } else {
          handExp = true
        }
      }
      // 指派后只更新父任务
      if (optType == 'assign') {
        updateIdList = [taskIds]
      } else {
        updateIdList = findIdList
      }
      console.log(findIdList)

      /**
       * 查询列表中数据
       */
      const findListNew = ({ findParentId }: any) => {
        return new Promise(resolve => {
          if (thisTask.childLevel) {
            queryChildTask({
              findId: findParentId,
              onlyFind: true,
              operateId: taskIds,
            }).then(({ dataList }: any) => {
              const { taskData, isDel }: any = filterNowTask({ dataList, findId: taskIds })
              resolve({ taskDatas: [taskData], isDel })
            })
          } else {
            const searchParam = deskParams[code]
            getWorkingTeamTask(searchParam, false, true).then(({ dataList }: any) => {
              const { taskData, isDel }: any = filterNowTask({ dataList, findId: taskIds })
              // 组装更新后的任务数据
              const taskDataPack = packRowData({
                taskData: [taskData] || [],
                parentId,
                childLevel: thisTask ? thisTask.childLevel : false,
              })
              resolve({ taskDatas: taskDataPack, isDel })
            })
          }
        })
      }

      // ==========================2 更新数据处理=====================//
      // 全局刷新
      let allRefresh = false
      // 由于标签配置新增了不展示已完成、延迟、冻结选项功能，所以以下操作后可能数据不存在，需要全局刷新
      if (
        (optType === 'canclefollow' && code === 'focus_task' && !thisTask.childLevel) ||
        // optType === 'freeze' ||
        // optType === 'unfreeze' ||
        optType == 'finish' ||
        optType == 'unfinish' ||
        process == 100
      ) {
        allRefresh = true
      }
      console.log('optType:--------------', optType, allRefresh, process)

      if (allRefresh) {
        // 顶层任务取消关注全局刷新
        // 全局刷新当前面板
        refreshotherPanle(code, 1, isFollow)
        changeTableData({ allRefresh: true })
        if (optType == 'editProgress') {
          // 刷新代办事项
          refreshPage && refreshPage()
        }
      } else {
        let updateList: any = []
        // 非编辑了父任务的情况
        if (editTask == 1) {
          const newList: any = await findListNew({ findParentId: parentId })
          // 查询到当前列表中不存在此任务，则需要更新父任务，否则更新当前任务
          if (newList.isDel) {
            updateIdList = thisTask.parentId ? [thisTask.parentId] : []
            delDatas = [taskIds]
            updateList = await findTaskById({ findIds: [parentId], thisRow: thisTask, parentId })
          } else {
            updateList = newList.taskDatas || []
          }
        } else {
          updateList = await findTaskById({ findIds: findIdList, thisRow: thisTask, parentId })
        }
        const dataItemArr = updateList || []
        let newTable = tableList.concat([])
        let refreshParam: any = {
          tableData: newTable,
          updateIdList,
          dataArr: dataItemArr,
          optType,
          code,
          foceLogo,
          delDatas,
          newChilds: [],
          addChild,
        }
        if (editParentTask == 2 || optType == 'addChildTask') {
          refreshParam.newChilds = newChildPack
        } else if (optType == 'assign') {
          //指派后新增子任务
          const newChilds = dataItemArr.splice(1)
          refreshParam = { ...refreshParam, dataArr: [dataItemArr[0]], newChilds }
        }
        //根据类型更新列表数据
        updateNowTaskData(refreshParam)
        if (paramObj.optType && paramObj.optType.optType == 'del') {
          detailModalRef.current.setState({ visible: false, from: 'workbench', code: code, id: '' })
        }
        if (editParentTask == 1) {
          newChildPack = packRowData({
            taskData: [newChild],
            parentId: undefined,
            childLevel: false,
          })
          newTable = [newChildPack[0], ...newTable]
        } else if (handExp) {
          // 自动展开节点
          const expandedRows = [...state.expandedRowKeys]
          expandedRows.push(parentId)
          expandNode({
            expanded: true,
            row: { id: parentId },
            handExp: expandedRows,
          })
        } else if (optType == 'editTask') {
          //编辑任务
          // 删除了顶层任务
          if (delDatas.includes(thisTask.id) && !thisTask.childLevel) {
            // 更新tab统计
            // refreshDeskNums({ isFollow })
            queryModuleNum({ isFollow, updateNum: true })
          }
        }
        console.log('refresh setState', newTable)
        setState({ ...state, tableData: [...newTable] })
      }
      // ======更新tab统计=======//
      // 关注、取消关注子级任务、归档、删除时更新统计
      if (
        optType === 'canclefollow' ||
        optType === 'focus_task' ||
        optType === 'archive' ||
        optType === 'del' ||
        optType == 'addChildTask'
      ) {
        queryModuleNum({ isFollow, updateNum: true })
      }
    }
    //关注
    const followTask = (taskItem: any) => {
      const { id, ascriptionId, ascriptionName } = taskItem
      const { selectTeamId, selectTeamName } = $store.getState()
      let teamId = selectTeamId
      let belongName: any = selectTeamName
      if (ascriptionId) {
        teamId = ascriptionId
        belongName = ascriptionName
      }
      taskFollow({
        belong: 'org',
        belongId: teamId,
        belongName: belongName,
        userId: nowUserId,
        followType: 'task',
        followId: id,
      }).then(
        () => {
          message.success('关注成功！')
          //列表刷新
          refreshTaskList({
            taskIds: id,
            childLevel: taskItem.childLevel,
            optType: 'focus_task',
            code: code,
            foceLogo: 'foceLogo', //单独处理关注和取消关注
          })
        },
        msg => {
          message.error(msg)
        }
      )
    }
    //行事件
    const setRowEvent = (record: any) => {
      return {
        onClick: (event: any) => {
          event.stopPropagation()
          // setTaskData(record.item)
          const className = event.target.className
          if (typeof className !== 'string') {
            return
          }
          if (jQuery(event.target).parents('.ant-table-row').length !== 0 && !className.includes('ant-menu')) {
            if (className.includes('ant-slider') || className.includes('ant_item_progress')) {
              return false
            }
            //草稿任务不能点击详情
            if (record.isDraft !== 1) {
              // setTaskdetail(true)
              const param = detailParam({ visible: true, row: record.item })
              detailModalRef.current.setState(param)
            }
          }

          jQuery('.task_list_table').removeClass('need-select')
        },
        rowData: record,
      }
    }
    /**
     * 处理详情弹框所需参数
     */
    const detailParam = ({ visible, row }: { visible: boolean; row: any }) => {
      const param = {
        visible,
        from: 'workbench',
        code: code,
        id: row.id,
        taskData: row,
        callbackFn: (params: any) => {
          let refreshParam: any = { foceLogo: 'foceLogo', taskIds: row.id, code }
          if (params && params.hasOwnProperty('types')) {
            refreshParam = {
              ...refreshParam,
              optType: params.types,
            }
          } else {
            refreshParam = {
              ...refreshParam,
              optType: params,
              foceLogo: '',
            }
          }
          refreshTaskList(refreshParam)
        },
      }
      return param
    }
    //新增子任务
    const addChildShow = (e: any, rowData: any) => {
      const thisTr = jQuery(e.target).parents('tr')
      const addTr = `<tr class="addChildTaskTr"  id="addChildTaskTr"><td class="taskNameTd">
    <div class="cellCont">
      <div class="boardTaskName">
        <input type="text" class="addChildTaskInp"/>
        <div class="create_task_btn_box">
          <div
          class="sure_create_btn"></div>
          <div
          class="cancel_create_btn"
          ></div>
        </div>
      </div>
    </div>
  </td></tr>`
      if (document.getElementById('addChildTaskTr')) {
        jQuery('#addChildTaskTr').remove()
      }
      thisTr.after(addTr)
      $('.addChildTaskInp').focus()
      // 事件绑定
      jQuery('#addChildTaskTr')
        .find('.sure_create_btn')
        .off()
        .on('click', (e: any) => {
          const newName =
            jQuery(e.target)
              .parents('td')
              .find('.addChildTaskInp')
              .val() + ''
          addChildTask(rowData, newName || '') //加节点
          //展开节点F
          jQuery(e.target)
            .parents('tr')
            .remove()
        })
      jQuery('#addChildTaskTr')
        .find('.cancel_create_btn')
        .off()
        .on('click', (e: any) => {
          jQuery(e.target)
            .parents('tr')
            .remove()
        })
    }
    //快速创建子任务
    const addChildTask = (rowData: any, newName: string) => {
      quickCreateTask({
        ascriptionId: rowData.ascriptionId,
        ascriptionName: rowData.ascriptionName,
        parentId: rowData.id,
        name: newName,
        createType: 0, //0快速创建 1弹窗创建
        type: 0, //子任务都是任务（包括项目类）
      }).then((res: any) => {
        const childTaskData = res.data.data
        //列表刷新
        refreshTaskList({
          taskIds: rowData.id,
          childLevel: true,
          optType: 'addChildTask',
          code,
          newChild: childTaskData,
        })
      })
    }
    //设置行名称
    // const setRowClassName = (record: any) => {
    //   if (record.subTaskCount === 0) {
    //     return 'noExpandable'
    //   } else {
    //     return ''
    //   }
    // }
    //新增子任务更新行数据
    const createRowDataUpdate = (tableData: any, parentId: number, childData: Array<DataItemProps>) => {
      tableData.map((item: DataItemProps) => {
        if (item.key === parentId) {
          item.children.push(childData[0])
          item.subTaskCount = item.subTaskCount + childData.length
        }
        if (item.children && item.children.length > 0) {
          createRowDataUpdate(item.children, parentId, childData)
        }
      })
    }
    //递归插入任务列表子元素
    const updateTaskData = (tableData: any, parentId: any, childData: Array<DataItemProps>) => {
      tableData.find((item: DataItemProps) => {
        if (item.key === parentId) {
          item.children = childData
          return [...tableData]
        }
        if (item.children && item.children.length > 0) {
          updateTaskData(item.children, parentId, childData)
        }
      })
    }
    /**
     * 查询子级任务
     */
    const queryChildTask = ({
      findId,
      onlyFind,
    }: {
      findId: string
      row?: any
      onlyFind?: boolean
      operateId?: string //当前操作的任务id
    }) => {
      const param = {
        taskId: findId,
        loginUserId: $store.getState().nowUserId,
        listType: serachParam.listType,
      }
      const nowTaskId = findId
      return new Promise((resolve: any) => {
        $api
          .request('/task/workbench/sub', param, {
            headers: { loginToken: loginToken },
            formData: true,
          })
          .then((res: any) => {
            if (res.returnCode === 0) {
              // 表格内容组装
              const childTaskData = res.dataList
              const childDataItemArr: Array<DataItemProps> = packRowData({
                taskData: childTaskData,
                parentId: findId,
                childLevel: true,
              })
              // 只查询数据情况
              if (onlyFind) {
                resolve({ dataList: childDataItemArr })
                return
              }
              //动态添加任务子任务
              const newTable = state.tableData.concat([])
              updateTaskData(newTable, nowTaskId, childDataItemArr)
              resolve({ taskData: newTable || [] })
            } else {
              resolve(false)
            }
          })
      })
    }
    //商推 展开行
    /**
     * 点击展开图标时触发
     * @param expanded
     * @param row
     * handExp:手动控制展开
     */
    const expandNode = ({ expanded, row, handExp }: { expanded: any; row: any; handExp?: any }) => {
      const children = row.children || []
      if (!expanded || children.length > 0) {
        return
      }
      queryChildTask({
        findId: row.id,
        row,
      }).then(({ taskData }: any) => {
        // 控制自动展开
        if (handExp) {
          expandedRowKeys[code] = [...handExp]
          setState({ ...state, tableData: [...taskData], expandedRowKeys: handExp })
        } else {
          setState({ ...state, tableData: [...taskData], expandedRowKeys: expandedRowKeys[code] })
        }
      })
    }

    /**
     * 展开的行变化时触发
     * @param expandedRows
     */
    const onExpandedRowsChange = (expandedRows: any) => {
      console.log('当前展开节点', expandedRows)
      expandedRowKeys[code] = [...expandedRows]
      setState({ ...state, expandedRowKeys: [...expandedRows] })
    }
    /**
     * 展开折叠参数
     */
    const tableExpandable: any = {
      //自定义展开折叠按钮
      expandIcon: ({ expanded, onExpand, record }: any) => {
        if ((record.children && record.children.length > 0) || record.subTaskCount > 0) {
          if (expanded) {
            return (
              <span
                className="ant-table-row-expand-icon ant-table-row-expand-icon-expanded"
                onClick={(e: any) => {
                  e.stopPropagation()
                  onExpand(record, e)
                }}
              ></span>
            )
          } else {
            return (
              <span
                className="ant-table-row-expand-icon ant-table-row-expand-icon-collapsed"
                onClick={(e: any) => {
                  e.stopPropagation()
                  onExpand(record, e)
                }}
              ></span>
            )
          }
        } else {
          return (
            <span
              className="treeTableIcon arrow_leaf"
              onClick={(e: any) => {
                e.stopPropagation()
              }}
            ></span>
          )
        }
      },
    }
    //将所有的td用tr替换统一
    const DragableBodyRow = (props: any) => {
      const { rowData, className, key, style, ...restProps } = props
      const [taskOptShow, setTaskOptShow] = useState(false)

      return (
        <Dropdown
          overlayClassName={`base-dropdown workDeskDrop workDeskDrop_${key}`}
          visible={taskOptShow}
          onVisibleChange={(flag: boolean) => {
            if (isFollow) return
            setTaskOptShow(flag)
          }}
          overlay={
            <TaskListOpt
              taskOptData={{
                rowObj: rowData.item,
                fromType: 'desk-working_team_task',
              }}
              code={code}
              callback={(data: any) => {
                const param = { ...data }
                // 选择了父任务的情况
                if (param.optType == 'editTask') {
                  param.newChild = data.data
                  param.parentIdOld = data.parentIdOld || ''
                  if (data.parentId) {
                    param.parentId = data.parentId
                  }
                }
                contextMenuCallback(param)
              }}
              outVisible={taskOptShow} //外部控制菜单显示隐藏
              outvisibleFalse={true}
              setVisible={(flag: boolean) => {
                if (isFollow) return
                setTaskOptShow(flag)
              }}
              isWorkDeskIn={true}
            />
          }
          trigger={['contextMenu']}
        >
          <tr
            key={rowData.key}
            className={`${className} ${rowData.subTaskCount === 0 ? 'noExpandable' : ''}`}
            style={{ ...style }}
            {...restProps}
          />
        </Dropdown>
      )
    }
    return (
      <div className={$c('task-wrap-container')}>
        {/* 筛选 */}
        <SearchTaskCom
          code={code}
          screenVsible={screenVsible}
          callback={(searcgData: any) => {
            serachParam.status = searcgData.status
            serachParam.startTime = searcgData.startTime
            serachParam.endTime = searcgData.endTime
            serachParam.keyword = searcgData.keyword
            serachParam.tagKeyword = searcgData.tagKeyword
            serachParam.property = searcgData.property
            serachParam.pageNo = 0
            setSerachParam({
              ...serachParam,
            })
            // 根据筛选条件更新表格数据
            changeTableData()
          }}
        ></SearchTaskCom>

        <div
          className={$c(
            'task-list',
            { executeTask: code == 'execute_task' },
            { noData: state.tableData.length == 0 }
          )}
          style={{
            paddingTop: `${(showSearchIcon(code) || code == 'execute_task') && screenVsible ? '30px' : ''}`,
          }}
        >
          {state.tableData.length === 0 && (
            <NoneData
              imgSrc={judeNoDataImg(code).imgSrc}
              showTxt={judeNoDataImg(code).showTxt}
              imgStyle={{ width: 74, height: 71 }}
            />
          )}
          {state.tableData.length !== 0 && (
            <Table
              key={'task_list_table'}
              className={$c('task_list_table', 'table_cus', {
                isFullScreen: screenVsible,
                'need-select': modulePosition === 0 && elementPosition === 0,
              })}
              columns={columns}
              pagination={false}
              components={{
                body: {
                  row: DragableBodyRow,
                },
              }}
              tableLayout={'fixed'}
              showHeader={false}
              dataSource={state.tableData}
              // rowClassName={setRowClassName}
              expandable={tableExpandable}
              onExpand={(expanded: boolean, row: any) => {
                expandNode({
                  expanded: expanded,
                  row: row,
                })
              }}
              expandedRowKeys={state.expandedRowKeys}
              onExpandedRowsChange={onExpandedRowsChange}
              onRow={setRowEvent}
            />
          )}
        </div>
        {screenVsible && state.tableData.length !== 0 && (
          <div className="contorl_page_pos">
            <Pagination
              showSizeChanger
              current={serachParam.pageNo + 1}
              total={state.totalElements}
              pageSize={serachParam.pageSize}
              pageSizeOptions={['5', '10', '20', '30', '50', '100']}
              onShowSizeChange={(current, size) => {
                paginationChange(current - 1, size)
              }}
              onChange={(page, pageSize: any) => {
                paginationChange(page - 1, pageSize)
              }}
            />
          </div>
        )}
      </div>
    )
  }
)

export default commonTaskList