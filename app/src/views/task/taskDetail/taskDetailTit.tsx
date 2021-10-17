import React, { useEffect, useState } from 'react'
import { Tooltip, Dropdown, Select } from 'antd'
import TaskListOpt from '@/src/views/workdesk/component/TaskListOpt'
import { queryTaskBtnAuth, editTaskApi } from '../taskComApi'
import { refreshDetails } from '../taskDetail/details'
const { Option } = Select
import {
  startTask,
  finishTask,
  unFinishTask,
  TransferTaskModal,
  AssignTaskModal,
} from '@/src/views/task/taskOptCom/taskOptCom'
import { refreshListFn as refreshTaskManageList } from '../taskManage/TaskManageList'
import { ipcRenderer } from 'electron'
import { refreshChildTree } from './taskTree'
import { refreshReport } from '../../workdesk/component/collectedReport'
let refBtnAuth: any = null
export const refBtnAuths = () => {
  refBtnAuth()
}
/**
 * 任务详情头部按钮
 */
export const TaskDetailTit = ({
  param,
  callbackFn,
  setvisible,
}: {
  param: any
  callbackFn: any
  setvisible: any
}) => {
  const { taskData, reminder, editAuth, from } = param
  // 详情from标识
  const detailFrom = from + '_detail'
  // 详情按钮
  const [detailBtns, setDetailBtns] = useState<any>({ start: '', report: '', assign: '', transfer: '' })
  // 移交弹框
  const [transferVisble, setTransferVisble] = useState(false)
  const [transferParam, setTransferParam] = useState<any>({})
  // 指派弹框
  const [assignVisble, setAssignVisble] = useState(false)
  const [assignParam, setAssignParam] = useState<any>({})
  // 右键菜单显示隐藏
  const [menuShow, setMenuShow] = useState(false)
  /**
   * 监听任务id的变化
   */
  useEffect(() => {
    findBtnAuth()
    // 订阅刷新消息
    // ipcRenderer.on('refresh_operated_task', (e: any, data: any) => {
    //   if (data.sourceType) {
    //     refreshDetailFn({ sourceType: data.sourceType, optType: data.optType })
    //   }
    //   console.log('refresh_operated_task')
    // })
  }, [taskData.id])
  //刷新右键权限
  refBtnAuth = () => {
    findBtnAuth()
  }
  /**
   * 刷新详情方法
   */
  const refreshDetailFn = ({
    sourceType,
    optType,
    operateId,
  }: {
    sourceType?: string
    optType?: string
    operateId?: string
  }) => {
    if (optType == 'finish') {
      // 任务完成，刷新工作台待收汇报
      refreshReport()
    }
    if (optType != 'del') {
      // 刷新按钮
      findBtnAuth()
      // 刷新详情内容
      refreshDetails && refreshDetails()
    } else {
      // $('.taskDetails')
      //   .parents('.ant-modal-root')
      //   .parent()
      //   .hide()
      setvisible(false)
    }

    const fromMsg = sourceType ? sourceType : from
    callbackFn &&
      callbackFn({
        types: optType,
      })
    // 刷新列表
    if (fromMsg.includes('taskManage')) {
      //任务管理
      refreshTaskManageList({ optType })
    }
    if (optType == 'assign' && refreshChildTree) {
      refreshChildTree({ type: 1, operateId: operateId })
    }
  }
  /**
   * 获取按钮权限返回数据
   * @param res 右键接口后台返回的数据
   */
  const findBtnAuth = () => {
    const param = {
      id: taskData.id,
      viewType: 2,
    }
    queryTaskBtnAuth(param).then((res: any) => {
      // console.log('列表按钮权限', res)
      // 当前任务
      const optTaskData = res.data.data || {}
      // 按钮权限列表
      const btnList = res.data.dataList || []
      // const btnAuth = btnList.filter((item: any) => item.code == 1)
      const btns = detailBtnList({ btnList, taskData: { ...optTaskData, ...taskData } })
      setDetailBtns({
        ...detailBtns,
        start: btns[1].html,
        report: btns[3].html,
        assign: btns[5].html,
        transfer: btns[6].html,
      })
    })
  }
  /**
   * 按钮列表渲染
   */
  const detailBtnList = ({ btnList, taskData }: any) => {
    const btnAuths = {}
    btnList.map((item: any) => {
      btnAuths[item.code] = {}
      btnAuths[item.code].html = detailBtn({
        item: item,
        taskData,
      })
    })
    return btnAuths
  }
  /**
   * 单个按钮
   */
  const detailBtn = ({ item, taskData }: any) => {
    let btn: any = ''
    const { status, isUse } = item
    const code = item.code
    const disable = isUse ? '' : 'disable'
    switch (code) {
      case 1: //开启
        // 开启
        let btnIcon = 'start_btn'
        let btnTxt = '开启'
        if (status == 2) {
          // 一键完成
          btnIcon = 'finishTaskGrey'
          btnTxt = '标记完成'
        } else if (status == 3) {
          // 取消完成
          btnIcon = 'finishTaskGreen'
          btnTxt = '取消完成'
        }
        btn = (
          <span
            key={code + '-' + status}
            className={`start_status_btn ${btnIcon} ${disable}`}
            onClick={() => {
              taskOpt({
                btnAuth: item,
                taskData,
                callback: () => {
                  refreshDetailFn({ optType: status == 2 ? 'finish' : '' })
                },
              })
            }}
          >
            {btnTxt}
          </span>
        )
        break
      case 3: //汇报
        btn = (
          <Tooltip title="汇报">
            <div
              key={code + '-' + status}
              className={`detail-icon-box ${disable}`}
              onClick={() => {
                taskOpt({
                  btnAuth: item,
                  taskData,
                  callback: () => {
                    refreshDetailFn({ optType: 'report' })
                  },
                })
              }}
            >
              <span className="img_icon report_icon"></span>
            </div>
          </Tooltip>
        )
        break
      case 5: //指派
        btn = (
          <Tooltip title="指派">
            <div
              className={`detail-icon-box ${disable}`}
              onClick={() => {
                setAssignParam({
                  taskId: taskData.id,
                  ascriptionId: taskData.ascriptionId,
                  fromType: 'taskDetail',
                  callback: () => {
                    refreshDetailFn({ optType: 'assign', operateId: taskData.id })
                  },
                })
                setAssignVisble(true)
              }}
            >
              <span className="img_icon assign_icon"></span>
            </div>
          </Tooltip>
        )
        break
      case 6: //移交
        btn = (
          <Tooltip title="移交">
            <div
              className={`detail-icon-box ${disable}`}
              onClick={() => {
                const liberObj = taskData.liable || {}
                const cmyName = $.trim(taskData.ascriptionName)
                setTransferVisble(true)
                setTransferParam({
                  taskId: taskData.id,
                  ascriptionType: taskData.ascriptionType,
                  userName: liberObj.username,
                  userId: liberObj.userId,
                  ascriptionId: taskData.ascriptionId,
                  ascriptionName: cmyName,
                  fromType: 'taskDetail',
                  callback: () => {
                    refreshDetailFn({ optType: 'transfer' })
                  },
                })
              }}
            >
              <span className="img_icon transfer_icon"></span>
            </div>
          </Tooltip>
        )
        break
      default:
        break
    }
    return btn
  }

  /**
   * 点击按钮操作
   */
  const taskOpt = ({ btnAuth, taskData, callback }: any) => {
    const { id, process } = taskData
    const { code, status } = btnAuth
    switch (code) {
      case 1:
        if (status == 2) {
          //一键完成
          finishTask({ id, process: process }).then(res => {
            if (callback) {
              callback(res)
            }
          })
        } else if (status == 3) {
          //取消一键完成
          unFinishTask({ id }).then(res => {
            if (callback) {
              callback(res)
            }
          })
        } else {
          //开启
          startTask({ id, status }).then(res => {
            if (callback) {
              callback(res)
            }
          })
        }
        break
      case 3: //汇报
        $store.dispatch({
          type: 'TASK_LIST_ROW',
          data: {
            handleBtn: {
              id: id,
              status: process == 100 ? 2 : 0,
              executorUsername: taskData.reportUserName,
              ascriptionId: taskData.ascriptionId,
              reportId: taskData.reportId,
              type: 0,
              time: Math.floor(Math.random() * Math.floor(1000)),
            },
            type: 0,
            sourceType: detailFrom,
          },
        })
        $tools.createWindow('DailySummary')
        break
      default:
        break
    }
  }

  /**
   * 修改提醒方式
   * @param value
   */
  const remindChange = (value: any) => {
    editTaskApi({
      taskId: taskData.id,
      infoArr: [
        {
          name: 'reminder',
          val: value,
        },
      ],
    }).then(() => {
      // 刷新详情内容
      refreshDetails && refreshDetails()
    })
  }
  return (
    <header className="taskDetailHead flex between">
      <div className="headerLeft"></div>
      <div className="headerMid"></div>
      <div className="headerRig flex center-v">
        {/* 提醒 */}
        <div className="taskRemindBox">
          <span className="taskRemindTit">任务结束前</span>
          <Select
            value={reminder + ''}
            dropdownClassName="taskRemindSel"
            onChange={remindChange}
            disabled={editAuth ? false : true}
          >
            <Option value="0">无提醒</Option>
            <Option value="1">0分钟提醒</Option>
            <Option value="2">5分钟提醒</Option>
            <Option value="3">15分钟提醒</Option>
            <Option value="4">30分钟提醒</Option>
            <Option value="5">1小时提醒</Option>
            <Option value="6">12小时提醒</Option>
            <Option value="7">1天提醒</Option>
            <Option value="8">1周提醒</Option>
          </Select>
        </div>

        {/* 操作按钮 */}
        <div className="detailIconBox">
          <div className="detailBtnOut">
            {detailBtns.report}
            {detailBtns.assign}
            {detailBtns.transfer}
          </div>
          <Tooltip title="更多">
            <Dropdown
              visible={menuShow}
              onVisibleChange={(flag: boolean) => {
                setMenuShow(flag)
              }}
              overlay={
                <TaskListOpt
                  taskOptData={{
                    rowObj: taskData || {},
                    fromType: 'taskManage_detail',
                  }}
                  callback={(data: any) => {
                    refreshDetailFn({ optType: data.optType })
                    // 刷新列表
                  }}
                  btnSort={[7, 8, 9, 10, 17, 20, 22, 23, 19]}
                  outVisible={true} //外部控制菜单显示隐藏
                  setVisible={(flag: boolean) => {
                    setMenuShow(flag)
                  }}
                />
              }
              trigger={['click']}
            >
              <div className="detail-icon-box more_icon_box">
                <span className="img_icon more_icon"></span>
              </div>
            </Dropdown>
          </Tooltip>
        </div>
        <div className="task_detail_start_box">{detailBtns.start}</div>
      </div>
      <TransferTaskModal
        visible={transferVisble}
        setVisible={(flag: boolean) => {
          setTransferVisble(flag)
        }}
        param={transferParam}
      />
      <AssignTaskModal
        visible={assignVisble}
        setVisible={(flag: boolean) => {
          setAssignVisble(flag)
        }}
        param={assignParam}
      />
    </header>
  )
}
