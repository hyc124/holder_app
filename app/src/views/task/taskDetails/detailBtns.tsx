import React, { useContext, useEffect, useState } from 'react'
import { Tooltip, Dropdown } from 'antd'
import TaskListOpt from '@/src/views/workdesk/component/TaskListOpt'
import { queryTaskBtnAuth } from '../taskComApi'
import {
  startTask,
  finishTask,
  unFinishTask,
  TransferTaskModal,
  AssignTaskModal,
  ReviewModal,
} from '@/src/views/task/taskOptCom/taskOptCom'
import { ipcRenderer } from 'electron'
import { DetailContext, detailTabUpdate, taskDetailContext } from './detailRight'
let refBtnAuth: any = null
// 详情按钮渲染方法
export let detailBtnExp: any = ''
export const refBtnAuths = () => {
  refBtnAuth()
}
/**
 * 任务详情头部按钮
 */
let taskDetailObj: DetailContext = {}
export const DetailBtns = ({
  param,
  callbackFn,
  setvisible,
  single,
  btnName,
  btnItem,
}: {
  param: any
  callbackFn?: any
  setvisible?: any
  single?: boolean //获取单个按钮
  btnName?: string //当前要渲染的单个按钮的名字
  btnItem?: any
}) => {
  const { taskData, from, isFollow } = param
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
  // 复盘弹框
  const [reviewParam, setReviewParam] = useState<any>({
    refresh: 0,
  })
  taskDetailObj = useContext(taskDetailContext)
  /**
   * 初始化监听
   */
  useEffect(() => {
    detailBtnExp = detailBtn
  }, [])

  /**
   * 监听任务id的变化
   */
  useEffect(() => {
    if (!single) {
      findBtnAuth()
      // 订阅刷新消息
      ipcRenderer.on('refresh_operated_task', (_: any, data: any) => {
        // refreshDetailFn({ sourceType: data.sourceType, optType: data.optType })
        if (data.optType == 'report') {
          const { taskIds } = data.data
          if (!taskIds) return
          // refreshDetailRight('2', taskIds[0])
          // console.log('refresh_operated_task')
          detailTabUpdate && detailTabUpdate({ taskId: taskIds[0], nowTab: '1' })
        }
      })
    }
  }, [taskData.id])
  //刷新右键权限
  refBtnAuth = () => {
    findBtnAuth()
  }
  /**
   * 刷新详情方法
   */
  const refreshDetailFn = ({
    optType,
    operateId,
    childIds,
  }: {
    sourceType?: string
    optType?: string
    operateId?: string
    childIds?: []
  }) => {
    if (optType != 'del' && optType != 'relKR') {
      // 刷新按钮
      findBtnAuth()
    } else {
      setvisible && setvisible(false)
    }
    callbackFn &&
      callbackFn({
        types: optType,
        childIds,
      })
  }
  /**
   * 获取按钮权限返回数据
   * @param res 右键接口后台返回的数据
   */
  const findBtnAuth = () => {
    if (!taskData.id) {
      return
    }
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
      const btns = detailBtnList({ btnList, taskData: { ...optTaskData, ...taskData, isFollow } })
      const infoObj: any = {
        ...detailBtns,
        // assign: btns[5].html,
        // transfer: btns[6].html,
      }
      if (btns[1]) {
        infoObj.start = btns[1].html
      }
      setDetailBtns(infoObj)
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
   * 右键外层的单个按钮
   */
  const detailBtn = ({ item, taskData }: any) => {
    let btn: any = ''
    const { status, isUse } = item
    const code = item.name
    const disable = isUse ? '' : 'disable'
    switch (code) {
      case 'EXECUTE': //开启
        // 开启
        let btnIcon = 'start_btn'
        let btnTxt = $intl.get('toStart')
        if (status == 2) {
          // 一键完成
          btnIcon = 'finish_btn'
          btnTxt = $intl.get('toFinish')
        } else if (status == 3) {
          // 取消完成
          btnIcon = 'nofinish_btn'
          btnTxt = $intl.get('toNotFinish')
        }
        btn = (
          <span
            key={code + '-' + status}
            className={`opt_btn start_status_btn ${btnIcon} ${disable}`}
            onClick={() => {
              taskOpt({
                btnAuth: item,
                taskData,
                detailFrom,
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
      case 'REPORT': //汇报
        btn = (
          <Tooltip title={btnName == 'progressRep' ? $intl.get('addProgressRep') : $intl.get('writeReport')}>
            <span
              key={code + '-' + status}
              className={`opt_btn ${
                btnName == 'progressRep' ? 'bgStyle progress_rep_Btn okr_auto_btn' : 'report_btn'
              }`}
              onClick={() => {
                taskOpt({
                  btnAuth: item,
                  taskData,
                  btnName,
                  callback: () => {
                    refreshDetailFn({ optType: 'report' })
                  },
                })
              }}
            >
              {btnName == 'progressRep' ? '添加进展' : '汇报'}
            </span>
          </Tooltip>
        )
        break
      case 'ASSIGN': //指派
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
      case 'TRANSFER': //移交
        btn = (
          <Tooltip title={$intl.get('transfer')}>
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
      case 'REVIEW': //复盘
        btn = (
          <span
            key={code + '-' + status}
            className="opt_btn review_btn"
            onClick={() => {
              setReviewParam({
                refresh: reviewParam.refresh + 1,
                visible: true,
                taskId: taskData.id,
                ascriptionId: taskData.ascriptionId,
                fromType: 'taskDetail',
                callback: () => {
                  refreshDetailFn({ optType: 'review', operateId: taskData.id })
                },
              })
            }}
          >
            {$intl.get('addReplay')}
          </span>
        )
        break
      default:
        break
    }
    return btn
  }

  return (
    <>
      {/* 右键菜单 */}
      {/* 任务详情类型 */}
      {!single && !taskData.workPlanType ? (
        <Dropdown
          overlayClassName="base-dropdown"
          visible={menuShow}
          onVisibleChange={(flag: boolean) => {
            setMenuShow(flag)
          }}
          overlay={
            <TaskListOpt
              taskOptData={{
                rowObj: { ...taskData },
                fromType: from + '_detail',
              }}
              callback={(data: any) => {
                const param: any = {
                  optType: data.optType,
                }
                if (data?.newTaskId) {
                  param.childIds = data.newTaskId
                }

                refreshDetailFn({ ...param })
                // 刷新列表
              }}
              // 催办-17 移交-6 指派-5 分享-20 关注任务-7 冻结-10 归档-9 复盘-8 设置：任务关注人-23、汇报设置-22  删除-19
              // btnSort={[17, 6, 5, 20, 7, 10, 9, 8, 23, 22, 19]}
              btnSort={[
                'URGE',
                'TRANSFER',
                'ASSIGN',
                'SHARE',
                'FOLLOW',
                'FREEZE',
                'ON_FILE',
                'REVIEW',
                'SET_FOLLOWER',
                'SET_REPORT',
                'DELETE',
              ]}
              btnSortType="name"
              outVisible={true} //外部控制菜单显示隐藏
              setVisible={(flag: boolean) => {
                setMenuShow(flag)
              }}
              reminderSet={true}
            />
          }
          trigger={['click']}
        >
          <Tooltip title={$intl.get('more')}>
            <span className="opt_btn more_opt_btn"> </span>
          </Tooltip>
        </Dropdown>
      ) : (
        ''
      )}
      {/* OKR详情类型 */}
      {!single && taskData.workPlanType ? (
        <Dropdown
          overlayClassName="base-dropdown"
          visible={menuShow}
          onVisibleChange={(flag: boolean) => {
            setMenuShow(flag)
          }}
          overlay={
            <TaskListOpt
              taskOptData={{
                rowObj: {
                  ...taskData,
                  datas: { ...taskData, id: taskData.workPlanId, typeId: taskData.id, mainId: taskData.mainId },
                },
                fromType: from + '_detail',
                iskr: true,
              }}
              callback={(data: any) => {
                refreshDetailFn({ optType: data.optType })
                // 刷新列表
              }}
              // 催办-17 移交-6 指派-5 分享-20 关注任务-7 冻结-10 归档-9 复盘-8 设置：任务关注人-23、汇报设置-22  删除-19
              // workPlanType == 2:O,3:KR
              btnSort={
                taskData.workPlanType == 2
                  ? ['FOLLOW', 'REVIEW', 'MODIFY_AUTH', 'SET_FOLLOWER', 'DELETE']
                  : ['REVIEW', 'DELETE']
              }
              // btnSort={taskData.workPlanType == 2 ? [7, 8, 25, 23, 19] : [8, 19]}
              // KR
              // btnSort={['REVIEW', 'DELETE']}
              btnSortType="name"
              outVisible={true} //外部控制菜单显示隐藏
              setVisible={(flag: boolean) => {
                setMenuShow(flag)
              }}
              sourceType="OKR"
            />
          }
          trigger={['click']}
        >
          <Tooltip title={$intl.get('more')}>
            <span className="opt_btn more_opt_btn" style={{ paddingLeft: 0 }}>
              {' '}
            </span>
          </Tooltip>
        </Dropdown>
      ) : (
        ''
      )}
      {/* ===外部单个按钮使用=== */}
      {single ? detailBtn({ item: btnItem, taskData }) : ''}
      {/* 移交弹框 */}
      {btnName == 'transfer' ? (
        <TransferTaskModal
          visible={transferVisble}
          setVisible={(flag: boolean) => {
            setTransferVisble(flag)
          }}
          param={transferParam}
        />
      ) : (
        ''
      )}
      {/* 指派弹框 */}
      {btnName == 'assign' ? (
        <AssignTaskModal
          visible={assignVisble}
          setVisible={(flag: boolean) => {
            setAssignVisble(flag)
          }}
          param={assignParam}
        />
      ) : (
        ''
      )}
      {/* 复盘弹框 */}
      {btnName == 'review' ? <ReviewModal param={{ ...reviewParam }} /> : ''}
    </>
  )
}

/**
 * 点击按钮操作
 */
export const taskOpt = ({
  btnAuth,
  taskData,
  detailFrom,
  callback,
  btnName,
}: {
  btnAuth: any
  taskData: any
  detailFrom?: any
  callback?: any
  btnName?: any
}) => {
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
      // 进展
      if (btnName == 'progressRep') {
        $store.dispatch({
          type: 'TASK_LIST_ROW',
          data: {
            handleBtn: {
              id,
              status: process == 100 ? 2 : 0,
              executorUsername: taskData.reportUserName,
              reportId: '',
              type: 0,
              time: Math.floor(Math.random() * Math.floor(1000)),
              types: 'okr',
              source: detailFrom,
              ascriptionId: taskData.ascriptionId,
            },
            type: 0,
            sourceType: detailFrom,
          },
        })
      } else {
        // 添加汇报
        $store.dispatch({
          type: 'TASK_LIST_ROW',
          data: {
            handleBtn: {
              id: id,
              status: process == 100 ? 2 : 0,
              executorUsername: taskData.reportUserName,
              reportId: taskData.reportId,
              type: taskData.type == 1 ? 1 : 0, //1--项目  0---任务
              time: Math.floor(Math.random() * Math.floor(1000)),
              ascriptionId: taskData.ascriptionId,
            },
            type: 0,
            sourceType: detailFrom,
          },
        })
      }

      $tools.createWindow('DailySummary')
      break
    default:
      break
  }
}
/**
 * 按钮列表渲染
 */
export const taskOptBtnsObj = ({ btnsList }: any) => {
  const btnAuths = {}
  btnsList.map((item: any) => {
    btnAuths[item.name] = item
  })
  return btnAuths
}
