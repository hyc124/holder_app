import { Dropdown, Tooltip, message, Menu, Button } from 'antd'
import React, { useReducer } from 'react'
import { useState } from 'react'
import TaskListOpt from '../component/TaskListOpt'
import { cancleTaskFollow, taskFollow } from '../getData'
import { DataItemProps } from './okrKanban'
interface propsInt {
  propsParams: {
    record: globalInterface.WorkPlanTaskProps
    data: DataItemProps
    nowKrId?: any
    setCreatShowKr?: any
    fromSource: any
  }
}
export const RightOptList = (props: {
  propsParams?: any
  setCreatShowKr?: any
  addEvolveFn?: any
  okrFollowFn?: any
  contextMenuCallback?: any
  dispatch?: any
  getNowCode?: any
  addPrepareData?: any
  setsupportShow?: any
  setsupport?: any
  setrefParent?: any
}) => {
  const { fromSource, record, data, nowKrId } = props.propsParams
  const {
    setCreatShowKr,
    addEvolveFn,
    okrFollowFn,
    contextMenuCallback,
    dispatch,
    getNowCode,
    addPrepareData,
    setsupportShow,
    setsupport,
    setrefParent,
  } = props
  const [taskOptShow, setTaskOptShow] = useState(false)
  const [state, setState] = useState({
    showAdd: false,
  })
  const { nowUserId } = $store.getState()
  const taskrecord = {
    ...record,
    id: record.typeId,
    flag: record.taskFlag,
    ascriptionId: record.enterpriseId || record.teamId,
    ascriptionName: record.enterpriseName || record.teamName,
    endTime: record.endTime,
    progress: { percent: record.process, color: 0 },
    datas: data.taskName,
    showTop: fromSource == 'okr_module' ? true : false,
  }
  const personAuth = data.hasAuth == 1
  let getstyle = {}
  if (nowKrId == record.id) {
    if (record.type == 3) {
      getstyle = { height: 'calc(100% - 32px)' }
    } else {
      getstyle = { height: 'calc(100% - 32px)', top: '31px' }
    }
  }
  const menu = (
    <Menu>
      <Menu.Item key={1}>
        <span
          onClick={(e: any) => {
            e.stopPropagation()
            if ($('.okrKanban').find('.part_name_input').length > 0) {
              getNowCode({
                item: data,
                type: 'kr',
              })
            } else {
              getNowCode(0)
              addPrepareData(data, 'kr')
            }
          }}
        >
          <i></i>
          {$intl.get('createKR')}
        </span>
      </Menu.Item>
      <Menu.Item key={2}>
        <span
          onClick={(e: any) => {
            e.stopPropagation()
            if ($('.okrKanban').find('.part_name_input').length > 0) {
              getNowCode({
                item: data,
                type: 'o_task',
              })
            } else {
              getNowCode(0)
              addPrepareData(data, 'task', 'o_task')
            }
          }}
        >
          <i></i>
          {$intl.get('createChildTask')}
        </span>
      </Menu.Item>
      <Menu.Item key={3}>
        <span
          onClick={(e: any) => {
            e.stopPropagation()
            if (data.children == 0) {
              setrefParent({
                row: data,
                typeId: data.taskName.typeId,
                isRef: true,
              })
            }
            const initmainId = {
              id: record.mainId,
              typeId: record.mainTypeId,
              teamId: record.teamId,
            }
            dispatch({
              type: 'initmainId',
              data: { ...initmainId },
            })
            const support = {
              type: 0,
              title: $intl.get('relateTask'),
              row: data,
              periodId: data.taskName.periodId,
              teamId: record.teamId,
              mainParentId: record.id,
            }
            setsupport({ ...support })
            setsupportShow(true)
          }}
        >
          <i></i>
          {$intl.get('relateTask')}
        </span>
      </Menu.Item>
    </Menu>
  )
  return (
    <>
      {data.taskName.type == 2 && !data.showInput && (
        // true && (
        <div
          className="okrOptBtnGroup taskOptBtnGroup"
          style={{ height: '90px', width: '92px' }}
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
                  addEvolveFn(record, data)
                }}
              ></span>
            </Tooltip>
            <Dropdown
              overlay={menu}
              overlayClassName="add_o_dropdown"
              visible={state.showAdd}
              trigger={['click']}
              onVisibleChange={e => setState({ ...state, showAdd: e })}
            >
              <Tooltip title={'添加kr'}>
                <span className={`add_o_onlist`}></span>
              </Tooltip>
            </Dropdown>

            <Tooltip
              title={record.isFollow && record.isFollow == 1 ? $intl.get('cancelFollow') : $intl.get('follow')}
            >
              <span
                className={`collect_icon ${record.isFollow == 1 ? 'nofollowIcon' : ''}`}
                onClick={(e: any) => {
                  e.stopPropagation()
                  okrFollowFn(record)
                }}
              ></span>
            </Tooltip>
            {/* 右键菜单 */}
            <Dropdown
              overlayClassName="workDeskDrop"
              className="work_more_drop base-dropdown"
              visible={taskOptShow}
              onVisibleChange={(flag: boolean) => {
                setTaskOptShow(flag)
              }}
              overlay={
                <TaskListOpt
                  taskOptData={{
                    rowObj: taskrecord,
                    fromType: 'okrKanban',
                    iskr: 1,
                  }}
                  code={'okrKanban'}
                  callback={(params: any) => {
                    contextMenuCallback(params, data)
                  }}
                  outVisible={taskOptShow} //外部控制菜单显示隐藏
                  setVisible={(flag: boolean) => {
                    setTaskOptShow(flag)
                  }}
                  isWorkDeskIn={true}
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
      )}
      {data.taskName.type != 2 && !data.showInput && (
        <div
          className="okrOptBtnGroup taskOptBtnGroup"
          // style={getstyle}
          onClick={(e: any) => {
            e.stopPropagation()
          }}
        >
          {/* 任务右键 */}
          {record.type != 2 && record.type != 3 && (
            <>
              <Tooltip title="汇报">
                <span
                  className="report_icon"
                  onClick={(e: any) => {
                    e.stopPropagation()
                    addEvolveFn(record, data)
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
                    if (record.isFollow && record.isFollow == 1) {
                      cancleTaskFollow({ taskId: record.typeId, userId: nowUserId }).then(res => {
                        message.success($intl.get('cancelFollowSuc'))
                        record.isFollow = 0
                        dispatch({
                          type: 'datalist',
                          data: {},
                        })
                      })
                    } else {
                      taskFollow({
                        belong: 'org',
                        belongId: record.ascriptionId,
                        belongName: record.enterpriseName,
                        userId: nowUserId,
                        followType: 'task',
                        followId: record.typeId,
                      }).then(res => {
                        message.success($intl.get('followSuc'))
                        record.isFollow = 1
                        dispatch({
                          type: 'datalist',
                          data: {},
                        })
                      })
                    }
                  }}
                ></span>
              </Tooltip>
              <Tooltip title={$intl.get('createChildTask')}>
                <span
                  className={`${personAuth ? 'add_child_icon' : 'hide'}`}
                  onClick={(e: any) => {
                    e.stopPropagation()
                    if ($('.okrKanban').find('.part_name_input').length > 0) {
                      getNowCode({
                        item: data,
                        type: 'task',
                      })
                    } else {
                      getNowCode(0)
                      addPrepareData(data, 'task')
                    }
                  }}
                ></span>
              </Tooltip>
              {/* 任务 右键菜单 */}
              <Dropdown
                overlayClassName="workDeskDrop"
                className="work_more_drop base-dropdown"
                visible={taskOptShow}
                onVisibleChange={(flag: boolean) => {
                  setTaskOptShow(flag)
                }}
                overlay={
                  <TaskListOpt
                    taskOptData={{
                      rowObj: taskrecord,
                      fromType: 'okrKanban',
                    }}
                    code={'okrKanban'}
                    callback={(params: any) => {
                      contextMenuCallback(params, data)
                    }}
                    outVisible={taskOptShow} //外部控制菜单显示隐藏
                    setVisible={(flag: boolean) => {
                      setTaskOptShow(flag)
                    }}
                    isWorkDeskIn={true}
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
          {record.type == 3 && data.hasAuth == 1 && (
            <>
              <Tooltip title={'添加进展'}>
                <span
                  className={`add_evolve`}
                  onClick={(e: any) => {
                    e.stopPropagation()
                    addEvolveFn(record, data)
                  }}
                ></span>
              </Tooltip>
              <Tooltip title={$intl.get('relateTask')}>
                <span
                  className={`${personAuth ? 'relate_child_icon' : 'add_child_icon_disable'}`}
                  onClick={(e: any) => {
                    e.stopPropagation()
                    const initmainId = {
                      id: record.mainId,
                      typeId: record.mainTypeId,
                      teamId: record.enterpriseId,
                    }
                    dispatch({
                      type: 'initmainId',
                      data: { ...initmainId },
                    })
                    const support = {
                      teamId: record.enterpriseId,
                      type: 0,
                      title: $intl.get('relateTask'),
                      mainParentId: record.id,
                      periodId: record.periodId,
                      row: data,
                    }
                    setsupport({ ...support })
                    setsupportShow(true)
                  }}
                ></span>
              </Tooltip>
              <Tooltip title={$intl.get('createChildTask')}>
                <span
                  className={`${personAuth ? 'add_child_icon' : 'add_child_icon_disable'}`}
                  onClick={(e: any) => {
                    e.stopPropagation()
                    if ($('.okrKanban').find('.part_name_input').length > 0) {
                      getNowCode({
                        item: data,
                        type: 'kr_task',
                      })
                    } else {
                      getNowCode(0)
                      addPrepareData(data, 'task', 'kr_task')
                    }
                  }}
                ></span>
              </Tooltip>
              {/* 右键菜单 */}
              <Dropdown
                overlayClassName="workDeskDrop"
                className="work_more_drop base-dropdown"
                visible={taskOptShow}
                onVisibleChange={(flag: boolean) => {
                  setTaskOptShow(flag)
                }}
                overlay={
                  <TaskListOpt
                    taskOptData={{
                      rowObj: taskrecord,
                      fromType: 'okrKanban',
                      iskr: 2,
                    }}
                    code={'okrKanban'}
                    callback={(params: any) => {
                      contextMenuCallback(params, data)
                    }}
                    outVisible={taskOptShow} //外部控制菜单显示隐藏
                    setVisible={(flag: boolean) => {
                      setTaskOptShow(flag)
                    }}
                    isWorkDeskIn={true}
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
      )}
    </>
  )
}
