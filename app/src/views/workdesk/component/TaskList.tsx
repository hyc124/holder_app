import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import {
  Table,
  Avatar,
  Progress,
  Tooltip,
  Pagination,
  Dropdown,
  message,
  Slider,
  Row,
  Col,
  InputNumber,
} from 'antd'
import {
  getOrgProfileById,
  cancleTaskFollow,
  taskFollow,
  editTaskProgress,
  findOneTaskDetail,
  refreshDeskNums,
  getWorkingTeamTask,
} from '../getData'
import { quickCreateTask } from '../../task/taskComApi'
import { showSearchIcon } from '../WorkDeskModule'
import { setTagByStatus } from '../../task/task-com/TaskCom'
// import { detailModalHandle } from '@/src/views/task/taskDetails/detailModal'
import NoneData from '@/src/components/none-data/none-data'
import { useSelector } from 'react-redux'
import TaskListOpt from './TaskListOpt'
import $c from 'classnames'
import './TaskList.less'
import { ipcRenderer } from 'electron'
import { findNowTask, handleNowTask } from '../../task/taskManage/TaskManageList'
import * as Maths from '@/src/common/js/math'
import { deskParams } from '../workDeskStore'
import { refreshPage } from '../TaskListData'
import { queryModuleNum } from '../../myWorkDesk/workDeskModules'
// import { refreshModelFn } from '../SetModuleData'
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
  listType: number //????????????
  paginationChange: (pageNo: number, pageSize: number) => void
  refresh?: any
  detailModalRef?: any
}

export const ProgressColors = [
  ['#4DD0E2', '#F1F1F1'],
  ['#34a853', '#cdead5'],
  ['#fbbc05', '#fcecc5'],
  ['#ea4335', '#fad1ce'],
  ['#F1F1F1', '#F1F1F1'], //??????
]

const obj = {
  Mb: '??????',
  Ls: '??????',
  Zn: '??????',
  Xm: '??????',
  Rw: '??????',
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
// ??????map???
// const treeListMap: any = {}
const expandedRowKeys: any = {}
export const setExpandedRowKeys = ({ code }: any) => {
  expandedRowKeys[code] = []
}
/**
 * ????????????????????????????????????
 */
export const filterTaskType = (params: any) => {
  const { type, mType, screen, status } = params
  const sml = mType == 0 && !screen
  return (
    <span className="flex">
      {/* {type == 0 && renderToolTip('Mb', sml, status)}
      {type == 1 && renderToolTip('Ls', sml, status)}
      {type == 2 && renderToolTip('Zn', sml, status)}
      {type == 3 && renderToolTip('Xm', sml, status)} */}
      {type == 1 && renderToolTip('Rw', sml, status)}
      {type == 1 && renderToolTip('Xm', sml, status)}
    </span>
  )
}
/**
 * ????????????????????????
 */
export const renderRoleTip = (sml: boolean, status: number, code: number) => {
  let cName = ''
  let cTitl = ''
  if (code == 1) {
    cName = 'my_assign'
    cTitl = '????????????'
  } else if (code == 4) {
    cName = 'my_execute'
    cTitl = '????????????'
  } else if (code == 5) {
    cName = 'my_leader'
    cTitl = '????????????'
  } else if (code == 6) {
    cName = 'my_supervise'
    cTitl = '????????????'
  }
  return (
    <Tooltip title={sml ? '' : cTitl}>
      <span
        className={$c(`myTaskRoleBox ${cName}`, {
          disableImg: status === 2,
          dislargImg: status === 2 && !sml,
        })}
      >
        {sml ? cTitl : ''}
      </span>
    </Tooltip>
  )
}
export const setListRoleHtml = (paramObj: any) => {
  const { code, screen, mType, status } = paramObj
  const sml = mType == 0 && !screen
  return <span>{renderRoleTip(sml, status, code)}</span>
}

//??????????????????
export const getDividerLine = (index: number, len: any) => {
  if (index !== len - 1) {
    return '/'
  } else {
    return ''
  }
}
//????????????????????????????????????
export const refreshOpenPanle = (code: string) => {
  const deskModle = $('.workdesk-main').find('.desk-module-header')
  const deskModleActive = [...$(deskModle).find('.ant-tabs-tab-active')]
  const refCode = ['report_form', 'my_urge'] //???????????????????????????
  deskModleActive.forEach(element => {
    const module = $(element).find('.moduleElement')
    const dataCode = $(module).attr('data-code') || ''
    if (!refCode.includes(dataCode)) {
      $(element).click()
    }
  })
}
// ???????????????????????????
export const judeNoDataImg = (code: string) => {
  let imgSrc = $tools.asAssetsPath('/images/noData/no_task.png')
  let showTxt = ''
  switch (code) {
    case 'focus_task':
      imgSrc = $tools.asAssetsPath('/images/noData/no_follows_task.png')
      showTxt = '?????????????????????????????????~'
      break
    case 'draft_task':
      imgSrc = $tools.asAssetsPath('/images/noData/create.png')
      showTxt = '????????????????????????????????????~'
      break
    case 'archive_task':
      imgSrc = $tools.asAssetsPath('/images/noData/place-file.png')
      showTxt = '????????????????????????????????????~'
      break

    case 'transfer_tasks':
      imgSrc = $tools.asAssetsPath('/images/noData/transform.png')
      showTxt = '???????????????????????????????????????~'
      break
    case 'working_team_task':
      imgSrc = $tools.asAssetsPath('/images/noData/team.png')
      showTxt = '????????????????????????~'
      break
    case 'function_task':
    case 'all_task':
      imgSrc = $tools.asAssetsPath('/images/noData/team.png')
      showTxt = '??????~?????????????????????'
      break
    case 'responsible_task':
      imgSrc = $tools.asAssetsPath('/images/noData/implement.png')
      showTxt = '???????????????????????????????????????~'
      break
    case 'target_kanban':
      imgSrc = $tools.asAssetsPath('/images/noData/terget.png')
      showTxt = '????????????????????????????????????~'
      break
    case 'task_supervisor':
      imgSrc = $tools.asAssetsPath('/images/noData/supervise.png')
      showTxt = '????????????????????????????????????~'
      break
    case 'execute_task':
      imgSrc = $tools.asAssetsPath('/images/noData/leader.png')
      showTxt = '????????????????????????????????????~'
      break
    case 'temporary_work':
    case 'waitting_task':
      imgSrc = $tools.asAssetsPath('/images/noData/waitting.png')
      showTxt = '????????????????????????~'
      break
    case 'report_form':
      imgSrc = $tools.asAssetsPath('/images/noData/report_form.png')
      showTxt = '??????????????????????????????~'
      break
    default:
      break
  }
  return { imgSrc, showTxt }
}

/**
 * ??????????????????
 * @param code
 * @param type 0?????? 1?????????
 */
const refreshotherPanle = (code: string, type?: number) => {
  console.log('code====', code)
  //??????????????????
  const deskModle = $('.workdesk-main').find('.desk-module-header')
  const deskModleActive = [...$(deskModle).find('.ant-tabs-tab-active')]
  let refCode = ['report_form', 'my_urge'] //???????????????????????????
  if (type == 1) {
    refCode = [code]
  } else {
    refCode.push(code)
  }
  console.log('refCode', refCode, 'type:', type)
  console.log('deskModleActive:', deskModleActive)
  deskModleActive.forEach(element => {
    const module = $(element).find('.moduleElement')
    const dataCode = $(module).attr('data-code') || ''
    if ((!type && !refCode.includes(dataCode)) || (type == 1 && refCode.includes(dataCode))) {
      console.log('dataCode', dataCode)
      console.log('element:', element)
      $(element).click()
    }
  })
}

//?????? inputNumber ?????????????????????+2?????????
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

let refreshingInfo: any = {}
//??????????????????
const TaskList = forwardRef(
  (
    {
      modulePosition,
      elementPosition,
      TaskData,
      code,
      moduleType,
      screenVsible,
      currentPage,
      listType,
      paginationChange,
      detailModalRef,
    }: // refresh,
    TListProps,
    ref
  ) => {
    const [state, setState] = useState<any>({
      // tableData: tableListOut[code] ? tableListOut[code] : [],
      tableData: [],
      expandedRowKeys: [],
    }) //????????????
    const { nowUserId, loginToken } = $store.getState()

    useEffect(() => {
      ipcRenderer
        .removeListener('refresh_operated_task', refreshTasOkrIpc)
        .on('refresh_operated_task', refreshTasOkrIpc)
    }, [state.tableData])

    useEffect(() => {
      // if (expandedRowKeys[code] && expandedRowKeys[code].length > 0) {
      //   return
      // }
      refreshingInfo[code] = {}
      refreshingInfo[code].refreshNum = 0
      jQuery(window).resize()
      const contentData: globalInterface.TaskListProps[] = TaskData ? TaskData.content : []
      const newTableData: Array<DataItemProps> = []
      contentData.map((item: globalInterface.TaskListProps) => {
        newTableData.push({
          item: { ...item },
          key: item.id,
          id: item.id,
          childLevel: false,
          taskName: { ...item },
          liableUser: { name: item.executorUsername, profile: item.profile, executorId: item.executorUser },
          executeTime: item.executeTime,
          endTime: item.endTime,
          progress: { ...item.progress, executeTime: item.executeTime, taskId: item.id, flag: item.flag },
          subTaskCount: item.subTaskCount,
          handleBtn: { ...item },
          children: item.childrenData || [],
        })
        // treeListMap[code][item.id] = { ...item }
      })
      setState({ ...state, tableData: newTableData })
      return () => {
        setExpandedRowKeys(code)
      }
    }, [TaskData])

    useEffect(() => {
      return () => {
        refreshingInfo = {}
      }
    }, [])
    useImperativeHandle(ref, () => ({
      refreshTaskList,
    }))

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
          console.log('refreshingInfo setInterval====', code, refreshingInfo[code])
          refreshFn()
        }, 100)
      }
    }
    //???????????????
    const updateProgress = (value: any, taskId: number, callback?: () => void) => {
      editTaskProgress({
        operateUser: nowUserId,
        userId: nowUserId,
        taskId: taskId,
        process: value,
      }).then((data: any) => {
        // console.log(data)
        if (data.returnCode == 0) {
          message.success('??????????????????!')
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

    //???????????????????????????2
    const updateNowTaskData = (paramObj: {
      tableData: any
      taskId?: any
      updateIdList?: any
      dataArr: Array<DataItemProps> //?????????????????????
      optType: string
      code: string
      foceLogo?: any
      delDatas?: any
      addChild?: boolean //???????????????????????????
      [propName: string]: any
    }) => {
      const { updateIdList, tableData, taskId, dataArr, optType, code, foceLogo, delDatas, addChild } = paramObj
      console.log('?????????type', optType, code, foceLogo)
      const delDataList = delDatas || []
      //????????????item.children????????????0 ???????????????
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
          // ==========??????????????????========//
          for (const key in dataItemArr[0]) {
            const val = dataItemArr[0][key]
            // ??????????????????????????????children???????????????????????????????????????
            if (key != 'id' && key != 'key' && key != 'children') {
              paramObj.tableData[index][key] = val
            }
          }
          // ?????????????????????
          if (addChild && paramObj.newChilds && paramObj.newChilds.length > 0) {
            paramObj.newChilds.map((item: any) => {
              item.childLevel = true
              // ????????????id
              item.parentId = _item.id
            })
            tableData[index].children.push(...paramObj.newChilds)
          }
          if (moreType.includes(optType) && percent === 100 && codes.includes(code)) {
            console.log('??????????????????', code)
            //?????? ??????????????????????????????????????? ????????????????????????????????????
            if (typeof foceLogo != 'undefined') {
              _item.item.status = 2
              _item.taskName.status = 2
            } else {
              const thisTr = $(`.${code}_module`).find('[data-row-key=' + _item.key + ']')
              $(thisTr).fadeOut(1000, () => {
                delDataFn(index)
                //?????????????????????????????????????????????ID????????????????????????????????????
                const userMsg: any = localStorage.getItem('TASK_INFO_MSG')
                const userMsgInfo: any[] = JSON.parse(userMsg)
                if (userMsg) {
                  if (!storageHasUser(nowUserId, userMsgInfo)) {
                    ipcRenderer.send('task_finish_visble', 1) //??????????????????
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
          //?????? ?????? ????????????
          delDataFn(index)
          // if (
          //   optType === 'archive' ||
          //   optType === 'del' ||
          //   (optType === 'canclefollow' && code === 'focus_task')
          // ) {
          //   //?????? ?????? ????????????
          //   delDataFn(index)
          // }
        }
        if (_item.children && _item.children.length > 0) {
          // console.log('?????????????????????')
          updateNowTaskData({
            ...paramObj,
            tableData: _item.children,
            foceLogo: _item,
          })
        }
      })
    }

    //??????????????????????????????????????????????????????ID
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

    //???????????????????????????Input??????
    const RenderProgress = ({ pwidth, progress, taskId, type, flag, status }: ProgressProps) => {
      // ??????????????????????????????
      const processInpRef = useRef<any>({})
      const colorIndex = progress == 100 ? 4 : progress.color > 0 ? progress.color - 1 : progress.color
      //??????????????????
      const strokeColor =
        ProgressColors[colorIndex] && ProgressColors[colorIndex][0] ? ProgressColors[colorIndex][0] : ''
      //???????????????????????????
      const trailColor =
        ProgressColors[colorIndex] && ProgressColors[colorIndex][1] ? ProgressColors[colorIndex][1] : ''
      const [iVisble, setInput] = useState(false)
      // const [iptVal, setIptVal] = useState(progress.percent)
      const iptVal = progress.percent
      //?????????
      const [progressValue, setProgressValue] = useState(progress.percent)
      //?????????????????????????????????
      const afterChangeProgress = (value: any) => {
        updateProgress(value, taskId, () => {
          setProgressValue(value) //??????????????????
        })
      }
      /**
       * ??????????????????????????????
       */
      const ProcessInput = forwardRef((props: any, ref) => {
        const { iptVal, status } = props.param
        const [state, setState] = useState<any>({
          process: iptVal,
        })
        /**-
         * ??????????????????
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
          className={flag === 3 ? '' : 'ant_item_progress'}
          style={{ width: pwidth }}
          onClick={e => {
            e.stopPropagation()
            if (type == 'circle') {
              if (iptVal == 100) {
                return message.warning('??????????????????????????????????????????!')
              }
              if (flag === 1) {
                return message.warning('???????????????????????????????????????!')
              }
              if (flag === 3) {
                return message.warning('??????????????????????????????????????????!')
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
              disabled={progress.percent == 100 || flag === 1 || flag == 3 ? true : false}
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
      let text = '???????????????: '
      tool.forEach((item: any) => {
        switch (item) {
          case 2:
            text += '???????????? '
            break
          case -1:
            text += '???????????? '
            break
          case 1:
            text += '???????????? '
            break
          case 6:
            text += '???????????? '
            break
          default:
            break
        }
      })
      return text
    }

    //????????????????????????START ???????????????
    //1.??????????????????
    const ColumnTaskName = (record: globalInterface.TaskListProps) => {
      const orgId = useSelector((state: any) => state.selectTeamId)
      const selectTeamId = orgId == -1 || orgId == '' || isNaN(orgId) ? '' : orgId
      const isEtPerson = record.executorUser == nowUserId
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
                      style={{ marginRight: 10 }}
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
                {!isEtPerson && record.executorUsername && (
                  <span style={{ paddingRight: '12px' }}>
                    <Avatar size={24} src={record.profile} style={{ backgroundColor: '#4285f4', fontSize: 12 }}>
                      {record.executorUsername && record.executorUsername.substr(-2, 2)
                        ? record.executorUsername.substr(-2, 2)
                        : ''}
                    </Avatar>
                  </span>
                )}
                <span className="time">
                  <span>{record.endTime.split(' ')[0].substr(5, 9)}</span>
                  ??????
                </span>
                {filterTaskType({
                  type: record.type,
                  code: code,
                  mType: moduleType,
                  screen: screenVsible,
                  status: record.status,
                })}
                {setListRoleHtml({
                  code: record.maxRole,
                  mType: moduleType,
                  screen: screenVsible,
                  status: record.status,
                })}
                {record.tagList && record.tagList.length !== 0 && (
                  <div className="com-tag-content">
                    {record.tagList.map((item: TagItemProps, index: number) => (
                      <span key={index} className="com-list-tag">
                        {item.content}
                        {getDividerLine(index, record.tagList?.length)}
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
                    style={{ marginRight: 10 }}
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
                {setListRoleHtml({
                  code: record.maxRole,
                  mType: moduleType,
                  screen: screenVsible,
                  status: record.status,
                })}
                {record.tagList && record.tagList.length !== 0 && (
                  <div className="com-tag-content">
                    {record.tagList.map((item: TagItemProps, index: number) => (
                      <span key={index} className="com-list-tag">
                        {item.content}
                        {getDividerLine(index, record.tagList?.length)}
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
    //2.?????????
    const columnLiableUser = (liableUser: any) => {
      //????????????????????????
      const isEtPerson = liableUser.executorId == nowUserId
      if (isEtPerson || (moduleType == 0 && !screenVsible)) {
        return ''
      }
      if (!liableUser.executorId) {
        return ''
      }
      const showPerson = moduleType == 1 || screenVsible
      return (
        <div
          className={$c('ant_item_liableUser', { liableUserfinished: liableUser.status === 2 })}
          style={{ display: 'flex', alignItems: 'center' }}
        >
          <Avatar size={24} src={liableUser.profile} style={{ backgroundColor: '#4285f4', fontSize: 12 }}>
            {liableUser && liableUser.name && liableUser.name.substr(-2, 2)
              ? liableUser.name.substr(-2, 2)
              : ''}
          </Avatar>
          {showPerson && (
            <span style={{ paddingLeft: '5px' }} className="lbUser">
              {liableUser && liableUser.name && liableUser.name.substr(-2, 2)
                ? liableUser.name.substr(-2, 2)
                : ''}
            </span>
          )}
        </div>
      )
    }
    //3.????????????
    const ColumnEndTime = (item: any) => {
      //??????????????????
      const [taskOptShow, setTaskOptShow] = useState(false)
      const showTime = moduleType === 1 || screenVsible
      const key = Maths.uuid()

      return (
        <div className="ant_item_time_box">
          <div
            className="ant_item_time"
            style={
              item.status === 2
                ? { color: '#d7d7d9', fontSize: '12px' }
                : { color: '#9A9AA2', fontSize: '12px' }
            }
          >
            {showTime && item.endTime && (
              <div>
                <span style={{ paddingRight: '5px', height: '100%', lineHeight: '48px' }}>
                  {item.endTime.split(' ')[0].substr(5, 9)}
                </span>
                ??????
              </div>
            )}
          </div>
          {code !== 'archive_task' && (
            <div className="taskOptBtnGroup">
              <Tooltip title="??????">
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
              <Tooltip title="???????????????">
                <span
                  className={`add_child_icon ${item.flag != 3 ? '' : 'display_none'}`}
                  onClick={(event: any) => {
                    event.stopPropagation()
                    addChildShow(event, item)
                  }}
                ></span>
              </Tooltip>
              <Tooltip title={item.isFollow ? '????????????' : '??????'}>
                <span
                  className={$c('collect_icon', { nofollowIcon: item.isFollow, display_none: item.flag == 3 })}
                  onClick={e => {
                    e.stopPropagation()
                    // console.log('item===================', item)
                    if (item.isFollow) {
                      // console.log(childLevel)
                      cancleFollowTask(item) //????????????
                    } else {
                      // followTask(item.id, item.ascriptionId, $.trim(item.ascriptionName)) //????????????
                      followTask(item) //????????????
                      // console.log(childLevel)
                    }
                  }}
                ></span>
              </Tooltip>
              <Tooltip title="??????">
                <Dropdown
                  overlayClassName={`base-dropdown workDeskDrop workDeskDrop_${key}`}
                  className={`work_more_drop ${item.flag != 3 ? '' : 'display_none'}`}
                  visible={taskOptShow}
                  onVisibleChange={(flag: boolean) => {
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
                        // ???????????????????????????
                        if (param.optType == 'editTask') {
                          param.newChild = data.data
                          param.parentIdOld = data.parentIdOld || ''
                          if (data.parentId) {
                            param.parentId = data.parentId
                          }
                        }
                        contextMenuCallback(param)
                      }}
                      outVisible={taskOptShow} //??????????????????????????????
                      setVisible={(flag: boolean) => {
                        setTaskOptShow(flag)
                      }}
                      isWorkDeskIn={true}
                    />
                  }
                  trigger={['click']}
                >
                  <span className="more_icon"></span>
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
    //4.????????????
    const columnProgress = (progress: any) => {
      //?????????????????????
      const isSmallScreen = !screenVsible && moduleType == 0
      //???????????????
      const w = isSmallScreen ? '36px' : '100%'
      if (progress.executeTime) {
        return (
          <div className="ant_item_progress_wrap">
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
              <div className="ant_item_progress" style={{ width: w, textAlign: 'center' }}>
                <RenderProgress
                  pwidth={w}
                  progress={progress}
                  taskId={progress.taskId}
                  type="line"
                  flag={progress.flag}
                  status={progress.status}
                />
              </div>
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
          >
            {isSmallScreen && <Progress width={32} type="circle" percent={0} format={() => '-/-'} />}
            {!isSmallScreen && (
              <div className="ant_item_progress" style={{ width: w, textAlign: 'center' }}>
                <Progress percent={0} status="exception" />
              </div>
            )}
          </div>
        )
      }
    }

    //???????????????????????? ????????? ??????
    const getScreenInfo = () => {
      if (moduleType === 0 && !screenVsible) {
        return {
          columnW: [16, 2, 2, 4],
          showClass: true,
        }
      } else {
        return {
          columnW: [14, 3, 2, 5],
          showClass: false,
        }
      }
    }
    //????????????
    const RenderTaskItem = (record: globalInterface.TaskListProps) => {
      // console.log('????????????', record)
      //??????????????????
      const [taskOptShow, setTaskOptShow] = useState(false)
      const item = { ...record }
      const screenParam = getScreenInfo()
      const key = Maths.uuid()
      return (
        <>
          <Dropdown
            overlayClassName={`base-dropdown workDeskDrop workDeskDrop_${key}`}
            visible={taskOptShow}
            onVisibleChange={(flag: boolean) => {
              setTaskOptShow(flag)
            }}
            overlay={
              <TaskListOpt
                taskOptData={{
                  rowObj: record,
                  fromType: 'desk-working_team_task',
                }}
                code={code}
                callback={(data: any) => {
                  const param = { ...data }
                  // ???????????????????????????
                  if (param.optType == 'editTask') {
                    param.newChild = data.data
                    param.parentIdOld = data.parentIdOld || ''
                    if (data.parentId) {
                      param.parentId = data.parentId
                    }
                  }
                  contextMenuCallback(param)
                }}
                outVisible={taskOptShow} //??????????????????????????????
                outvisibleFalse={true}
                setVisible={(flag: boolean) => {
                  setTaskOptShow(flag)
                }}
                isWorkDeskIn={true}
              />
            }
            trigger={['contextMenu']}
          >
            <Row>
              <Col span={screenParam.columnW[0]}> {ColumnTaskName(record || {})}</Col>
              <Col span={screenParam.columnW[1]}>
                {columnLiableUser({
                  status: record.status,
                  name: record.executorUsername,
                  profile: record.profile,
                  executorId: record.executorUser,
                })}
              </Col>
              <Col span={screenParam.columnW[2]}>{ColumnEndTime(item)}</Col>
              <Col span={screenParam.columnW[3]} className={$c({ columnProgress: screenParam.showClass })}>
                {columnProgress({
                  ...record.progress,
                  executeTime: record.executeTime,
                  taskId: record.id,
                  flag: record.flag,
                  status: record.status,
                })}
              </Col>
            </Row>
          </Dropdown>
          <span hidden className={`dropHide dropHide_${key}`}>
            a
          </span>
        </>
      )
    }
    //?????????
    const columns = [
      {
        title: '????????????',
        dataIndex: 'taskName',
        key: 'taskName',
        render: (record: globalInterface.TaskListProps) => RenderTaskItem(record),
      },
    ]
    const contextMenuCallback = (params?: any) => {
      const { taskId, optType, code } = params
      console.log('????????????????????????', params)
      refreshTaskList({
        ...params,
        taskIds: taskId,
        optType,
        code,
        foceLogo: 'foceLogo',
      })
    }
    //????????????
    const cancleFollowTask = (item: any) => {
      cancleTaskFollow({
        taskId: item.id,
        userId: nowUserId,
      }).then(
        () => {
          message.success('?????????????????????')
          //????????????
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

    // ??????????????????????????????
    const packRowData = ({
      taskData,
      parentId,
      childLevel,
    }: {
      taskData: any
      parentId?: any
      childLevel?: boolean
    }) => {
      const dataItemArr: Array<DataItemProps> = taskData.map((item: globalInterface.TaskListProps) => {
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
     * ???????????????????????????
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
     * ??????id??????????????????
     */
    const findTaskById = ({ findIds, thisRow, parentId }: any) => {
      return new Promise(resolve => {
        // ????????????????????????????????????
        findOneTaskDetail({
          taskIds: findIds.join(','),
          loginUserId: nowUserId,
        }).then((data: any) => {
          const taskData = data.dataList || []
          // ??????????????????????????????
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
     * ????????????
     * taskIds:?????????????????????id??????
     * optType:????????????
     * childLevel:?????????????????????
     */

    //=================================?????????????????????????????????==============================//
    const refreshTaskList = async (paramObj: {
      rowData?: any
      taskIds: any
      optType?: any
      childLevel?: any
      parentId?: string //?????????????????????????????????id
      parentIdOld?: any //????????????????????????????????????????????????
      newChild?: any
      datas?: any
      code?: any
      foceLogo?: any
      teamId?: any
      [propName: string]: any
    }) => {
      const { taskIds, code, foceLogo, data, parentIdOld, process } = paramObj
      const newTaskIds = data || []
      const tableList = state.tableData
      const optType: string = paramObj.optType
      const newChild: any = paramObj.newChild
      let parentId: any = paramObj.parentId || ''
      let newChildPack: any = []
      // ?????????????????????id??????
      let findIdList: any = taskIds ? (typeof taskIds == 'number' ? [taskIds] : taskIds) : []
      // ?????????????????????id
      let updateIdList: any = []
      // ?????????????????????id
      let delDatas: any = []
      const nowTaskInfo: any = { item: null }
      // ????????????????????????
      let handExp = false
      // ???????????????????????????
      let addChild = false
      // ??????????????????????????????????????????
      let editParentTask = 0
      // ??????????????????????????????
      let editTask = 0
      // ?????????????????????
      // let delTask = false
      // ??????????????????
      findNowTask({
        dataList: tableList,
        findId: findIdList[0] || '',
        taskInfo: nowTaskInfo,
      })
      // ??????????????????????????????
      const thisTask: any = nowTaskInfo.item ? { ...nowTaskInfo.item } : {}
      // ?????????????????????
      // let thisTaskNew: any = { item: {} }
      console.log(thisTask)
      // ==========================1 ????????????????????????=====================//
      // if (optType === 'freeze' || optType === 'unfreeze' || optType == 'finish' || process == 100) {
      //   // ?????????????????????????????????????????????
      //   const findChilds = findChildNexts({
      //     dataList: [thisTask],
      //   })
      //   //???????????????????????????id
      //   findIdList = findChilds.idList || []
      // } else
      if (optType === 'archive' || optType === 'del') {
        //???????????????id
        findIdList = thisTask.parentId ? [thisTask.parentId] : []
        delDatas = [taskIds]
      } else if (optType == 'assign') {
        parentId = taskIds
        // ?????????????????????????????????????????????????????????children?????????????????????????????????????????????children???????????????
        if (state.expandedRowKeys.includes(parentId)) {
          // ??????????????????????????????????????????????????????????????????????????????
          findIdList = [parentId, ...newTaskIds]
          addChild = true
        } else {
          findIdList = [parentId]
          handExp = true
        }
      } else if (optType == 'editTask') {
        /**
         * ????????????????????????????????????
         */
        // ??????????????????????????????????????????????????????????????????
        if (parentIdOld != parentId) {
          findIdList = []
          newChildPack = packRowData({
            taskData: [newChild],
            parentId: undefined,
            childLevel: true,
          })
          // ==========1 ??????????????????==========//
          if (parentIdOld || (!parentIdOld && !thisTask.childLevel)) {
            // ??????????????????????????????
            parentIdOld && findIdList.push(parentIdOld)
            // ????????????????????????
            handleNowTask({
              dataList: tableList,
              findId: taskIds,
              taskInfo: nowTaskInfo,
              optType: 'del',
            })
          }
          // ==========2 ?????????????????????==========//
          // ?????????????????????????????????????????????????????????
          if (parentIdOld && !parentId) {
            editParentTask = 1
          }
          // ??????????????????????????????????????????????????????????????????????????????????????????
          else if (parentId && parentIdOld != parentId) {
            editParentTask = 2
            // ??????????????????????????????
            findIdList.push(parentId)
            // ??????????????????????????????????????????????????????children???????????????????????????
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
        // ?????????????????????????????????????????????????????????children?????????????????????????????????????????????children???????????????
        if (state.expandedRowKeys.includes(parentId)) {
          // ??????????????????????????????????????????????????????????????????????????????
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
      // ???????????????????????????
      if (optType == 'assign') {
        updateIdList = [taskIds]
      } else {
        updateIdList = findIdList
      }
      console.log(findIdList)

      /**
       * ?????????????????????
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
              // ??????????????????????????????
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

      // ==========================2 ??????????????????=====================//
      // ????????????
      let allRefresh = false
      // ?????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
      if (
        (optType === 'canclefollow' && code === 'focus_task' && !thisTask.childLevel) ||
        optType === 'freeze' ||
        optType === 'unfreeze' ||
        optType == 'finish' ||
        optType == 'unfinish' ||
        process == 100
      ) {
        allRefresh = true
      }
      console.log('optType:--------------', optType, allRefresh, process)

      if (allRefresh) {
        // ????????????????????????????????????
        // ????????????????????????
        refreshotherPanle(code, 1)
        if (optType == 'editProgress') {
          // ??????????????????
          refreshPage && refreshPage()
        }
      } else {
        let updateList: any = []
        // ??????????????????????????????
        if (editTask == 1) {
          const newList: any = await findListNew({ findParentId: parentId })
          // let findTaskParam = { findIds: [taskIds], thisRow: thisTask, parentId }
          // console.log('findTaskParam:', findTaskParam, 'newList:', newList)
          // ????????????????????????????????????????????????????????????????????????????????????????????????
          if (newList.isDel) {
            // findTaskParam.findIds = [parentId]
            updateIdList = thisTask.parentId ? [thisTask.parentId] : []
            delDatas = [taskIds]
            updateList = await findTaskById({ findIds: [parentId], thisRow: thisTask, parentId })
            // delTask = true
          } else {
            updateList = newList.taskDatas || []
          }
        } else {
          updateList = await findTaskById({ findIds: findIdList, thisRow: thisTask, parentId })
        }
        // console.log('updateList:', updateList)
        const dataItemArr = updateList || []
        // const findItem = dataItemArr[0] || {}
        // thisTaskNew = findItem || { item: {} }
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
          //????????????????????????
          const newChilds = dataItemArr.splice(1)
          refreshParam = { ...refreshParam, dataArr: [dataItemArr[0]], newChilds }
        }
        // console.log(optType, updateIdList, delDatas)
        // console.log('refreshParam:', refreshParam)
        //??????????????????????????????
        updateNowTaskData(refreshParam)
        if (editParentTask == 1) {
          newChildPack = packRowData({
            taskData: [newChild],
            parentId: undefined,
            childLevel: false,
          })
          newTable = [newChildPack[0], ...newTable]
        } else if (handExp) {
          // ??????????????????
          const expandedRows = [...state.expandedRowKeys]
          expandedRows.push(parentId)
          expandNode({
            expanded: true,
            row: { id: parentId },
            handExp: expandedRows,
          })
        } else if (optType == 'editTask') {
          //????????????
          // ?????????????????????
          if (delDatas.includes(thisTask.id) && !thisTask.childLevel) {
            // ??????tab??????
            queryModuleNum({ updateNum: true })
          }
        }
        console.log('refresh setState', newTable)
        setState({ ...state, tableData: [...newTable] })
      }
      // ======??????tab??????=======//
      // ????????????????????????????????????????????????
      if (
        ((optType === 'canclefollow' || optType === 'focus_task') && code === 'focus_task') ||
        optType == 'addChildTask' ||
        optType === 'archive' ||
        optType === 'del'
      ) {
        console.log('???????????????----------------------')
        // refreshDeskNums({})
        queryModuleNum({ updateNum: true })
      }
    }
    //??????
    // const followTask = (id: number, ascriptionId: number, ascriptionName: any) => {
    const followTask = (taskItem: any) => {
      const { id, ascriptionId, ascriptionName } = taskItem
      const { selectTeamId, selectTeamName } = $store.getState()
      // console.log('taskItem===', taskItem)
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
          message.success('???????????????')
          //????????????
          refreshTaskList({
            taskIds: id,
            childLevel: taskItem.childLevel,
            optType: 'focus_task',
            code: code,
            foceLogo: 'foceLogo', //?????????????????????????????????
          })
        },
        msg => {
          message.error(msg)
        }
      )
    }
    //?????????
    const setRowEvent = (record: any) => {
      return {
        onClick: (event: any) => {
          event.stopPropagation()
          // setTaskData(record.item)
          const className = event.target.className
          if (typeof className !== 'string') {
            return
          }
          if (className.includes('more_icon')) {
          } else if (
            jQuery(event.target).parents('.ant-table-row').length !== 0 &&
            !className.includes('ant-menu')
          ) {
            if (className.includes('ant-slider') || className.includes('ant_item_progress')) {
              return false
            }
            //??????????????????????????????
            if (record.isDraft !== 1) {
              // setTaskdetail(true)
              const param = detailParam({ visible: true, row: record.item })
              detailModalRef.current.setState(param)
            }
          }

          jQuery('.task_list_table').removeClass('need-select')
        },
      }
    }
    /**
     * ??????????????????????????????
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
    //???????????????
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
      // ????????????
      jQuery('#addChildTaskTr')
        .find('.sure_create_btn')
        .off()
        .on('click', (e: any) => {
          const newName =
            jQuery(e.target)
              .parents('td')
              .find('.addChildTaskInp')
              .val() + ''
          addChildTask(rowData, newName || '') //?????????
          //????????????F
          // console.log('???????????????', rowData, newName)
          // setState({ ...state, expandedRowKeys: [...state.expandedRowKeys, rowData.id] })
          // refreshotherPanle(code)
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
    //?????????????????????
    const addChildTask = (rowData: any, newName: string) => {
      quickCreateTask({
        ascriptionId: rowData.ascriptionId,
        ascriptionName: rowData.ascriptionName,
        parentId: rowData.id,
        name: newName,
        createType: 0, //0???????????? 1????????????
        type: 0, //??????????????????????????????????????????
      }).then((res: any) => {
        const childTaskData = res.data.data
        //????????????
        refreshTaskList({
          taskIds: rowData.id,
          childLevel: true,
          optType: 'addChildTask',
          code,
          newChild: childTaskData,
        })
        // const createChildArr: Array<DataItemProps> = childTaskData.map((item: globalInterface.TaskListProps) => {
        //   return {
        //     item: item,
        //     parentId: rowData.id,
        //     key: item.id,
        //     id: item.id,
        //     taskName: { ...item },
        //     liableUser: { name: item.executorUsername, profile: item.profile, executorId: item.executorUser },
        //     executeTime: item.executeTime,
        //     endTime: item.endTime,
        //     progress: { ...item.progress, executeTime: item.executeTime, taskId: item.id, flag: item.flag },
        //     subTaskCount: item.subTaskCount,
        //     handleBtn: { ...item },
        //     children: item.childrenData || [],
        //   }
        // })
        // const newTable: any = state.tableData.concat([])
        // createRowDataUpdate(newTable, rowData.id, createChildArr)
        // setState({ ...state, tableData: newTable })
      })
    }
    //???????????????
    const setRowClassName = (record: any) => {
      if (record.subTaskCount === 0) {
        return 'noExpandable'
      } else {
        return ''
      }
    }
    //??????????????????????????????
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
    //?????????????????????????????????
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
     * ??????????????????
     */
    const queryChildTask = ({
      findId,
      onlyFind,
    }: {
      findId: string
      row?: any
      onlyFind?: boolean
      operateId?: string //?????????????????????id
    }) => {
      const param = {
        taskId: findId,
        loginUserId: $store.getState().nowUserId,
        listType,
      }
      const nowTaskId = findId
      return new Promise((resolve: any) => {
        $api
          .request('/task/workbench/sub', param, {
            headers: { loginToken: loginToken },
            formData: true,
          })
          .then((res: any) => {
            // console.log('??????????????????????????????', res)
            if (res.returnCode === 0) {
              // ??????????????????
              // const newChilds = setTreeTableData({
              //   data: childData,
              //   childLevel: true,
              //   headerList: stateTmp.headerList,
              //   parentId: findId,
              // })
              const childTaskData = res.dataList
              const childDataItemArr: Array<DataItemProps> = childTaskData.map(
                (item: globalInterface.TaskListProps) => {
                  item.childLevel = true
                  item.parentId = findId
                  const newItem = {
                    item: item,
                    key: item.id,
                    id: item.id,
                    parentId: findId,
                    childLevel: true,
                    taskName: { ...item },
                    liableUser: {
                      name: item.executorUsername,
                      profile: item.profile,
                      executorId: item.executorUser,
                    },
                    executeTime: item.executeTime,
                    endTime: item.endTime,
                    progress: {
                      ...item.progress,
                      executeTime: item.executeTime,
                      taskId: item.id,
                      flag: item.flag,
                    },
                    subTaskCount: item.subTaskCount,
                    handleBtn: { ...item },
                    children: item.childrenData || [],
                  }
                  // treeListMap[code][newItem.key] = { ...newItem }
                  return { ...newItem }
                }
              )
              // ?????????????????????
              if (onlyFind) {
                resolve({ dataList: childDataItemArr })
                return
              }
              //???????????????????????????
              const newTable = state.tableData.concat([])
              updateTaskData(newTable, nowTaskId, childDataItemArr)
              resolve({ taskData: newTable || [] })
            } else {
              resolve(false)
            }
          })
      })
    }
    //?????? ?????????
    /**
     * ???????????????????????????
     * @param expanded
     * @param row
     * handExp:??????????????????
     */
    const expandNode = ({ expanded, row, handExp }: { expanded: any; row: any; handExp?: any }) => {
      const children = row.children || []
      if (!expanded || children.length > 0) {
        return
      }
      // console.log('row', row)
      queryChildTask({
        findId: row.id,
        row,
      }).then(({ taskData }: any) => {
        // ??????????????????
        if (handExp) {
          expandedRowKeys[code] = [...handExp]
          setState({ ...state, tableData: [...taskData], expandedRowKeys: handExp })
        } else {
          setState({ ...state, tableData: [...taskData], expandedRowKeys: expandedRowKeys[code] })
        }
      })
    }

    /**
     * ???????????????????????????
     * @param expandedRows
     */
    const onExpandedRowsChange = (expandedRows: any) => {
      console.log('??????????????????', expandedRows)
      expandedRowKeys[code] = [...expandedRows]
      setState({ ...state, expandedRowKeys: [...expandedRows] })
    }
    /**
     * ??????????????????
     */
    const tableExpandable: any = {
      //???????????????????????????
      expandIcon: ({ expanded, onExpand, record }: any) => {
        // if (record.key == '62963') {
        //   console.log('record.subTaskCount', record, record.subTaskCount)
        // }
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
    return (
      <div className={$c('task-wrap-container')}>
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
              tableLayout={'fixed'}
              showHeader={false}
              dataSource={state.tableData}
              rowClassName={setRowClassName}
              expandable={tableExpandable}
              // onExpand={expandedRow}
              onExpand={(expanded: boolean, row: any) => {
                // console.log('row,record', row)
                expandNode({
                  expanded: expanded,
                  row: row,
                  // ...state.expandedRowKeys,
                })
              }}
              expandedRowKeys={state.expandedRowKeys}
              onExpandedRowsChange={onExpandedRowsChange}
              onRow={setRowEvent}
            />
          )}
        </div>
        {screenVsible && state.tableData.length !== 0 && (
          <div
            style={{
              textAlign: 'center',
              position: 'absolute',
              bottom: '10px',
              width: '100%',
            }}
          >
            <Pagination
              showSizeChanger
              current={currentPage.pageNo + 1}
              total={TaskData.totalElements}
              pageSize={currentPage.pageSize}
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

export default TaskList
