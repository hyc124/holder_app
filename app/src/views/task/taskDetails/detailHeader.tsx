import React, { useEffect, useState, useRef, useContext, useLayoutEffect } from 'react'
import { Avatar, Dropdown, Tooltip } from 'antd'
import * as Maths from '@/src/common/js/math'
import Priority from '../creatTask/priority'
import CreatTask from '../creatTask/creatTask'
import { cutName, setCaretEnd } from '@/src/common/js/common'
import LoopsTask, { loopTaskListDataShow } from '@/src/components/loop-task-date/loop-task-date'
import { DetailBtns } from './detailBtns'
import { TaskDesModal } from './detailAttach'
import { CreateTaskModal } from '../creatTask/createTaskModal'
import { TaskDetailRank } from '../creatTask/createTask'
import { DetailContext, loopsTaskInfo, taskDetailContext, toOKRWindow } from './detailRight'
import { cancelSupportApi } from './detailApi'
import { editMarkModalHandle } from '../../modals/addRemarkModal'
import { SupportModal } from '@/src/components/supportOKR/supportModal'
/**
 * 详情头部组件
 */
export const DetailHeader = ({
  dataState,
  refreshFn,
  from,
  callbackFn,
  editTaskName,
  editPriority,
  editCycleModel,
  editPrivate,
  editAuth,
  setModalState,
  noCloseBtn,
}: {
  dataState: any
  detailQuery: any
  setQuery: any
  refreshFn: any
  from: any
  callbackFn: any
  editTaskName: any
  editPriority: any
  editCycleModel: any
  editPrivate: any
  editAuth: boolean
  setModalState?: any
  noCloseBtn?: boolean
}) => {
  const taskDetailObj: DetailContext = useContext(taskDetailContext)
  const findId = getQueryId({ dataState, from })
  const [state, setState] = useState({
    priorityvis: false,
    opencreattask: false,
    openloop: false,
    nameShow: false,
  })
  // 创建任务弹框组件
  const createTaskRef = useRef<any>({})
  //任务描述窗口组件
  const taskDesModal = useRef<any>({})
  /**
   * 任务名编辑框
   */
  const TaskNameEdit = ({ name, nameShow }: { name: string; nameShow?: boolean }) => {
    // 使用Textarea设置光标移动末尾不生效，故换用div
    const nameRef = useRef<any>({})

    const [reload, setReLoad] = useState(false)

    useEffect(() => {
      if (reload) {
        setCaretEnd($('.taskNameInp'))
        setReLoad(false)
      }
    }, [reload])
    useLayoutEffect(() => {
      if (nameShow) {
        setCaretEnd($('.taskNameInp'))
      }
    }, [nameShow])
    return (
      <div
        contentEditable={true}
        dangerouslySetInnerHTML={{ __html: name }}
        ref={nameRef}
        className={`taskNameInp ${nameShow ? '' : 'forcedHide'}`}
        // defaultValue={name}
        onBlur={(e: any) => {
          if (name != e.target.innerText) {
            editTaskName(e.target.innerText || '', () => {
              setState({
                ...state,
                nameShow: false,
              })
            })
          }
          setState({ ...state, nameShow: false })
        }}
        onKeyUp={(e: any) => {
          if (e.keyCode == 13) {
            if (name != e.target.innerText) {
              editTaskName(e.target.innerText || '', () => {
                setState({
                  ...state,
                  nameShow: false,
                })
              })
            }
          }
          // 限制输入框字数100范围内
          if (e.target.innerText.length >= 100) {
            e.target.innerText = e.target.innerText.substring(0, 100)
            // 超过字数，促使组件重载
            setReLoad(true)
          }
        }}
      />
    )
  }

  //删除循环
  const delCycleModel = () => {
    editCycleModel({
      flag: 1,
    })
  }
  /**
   * 打开创建子任务
   */
  const openCreateTask = () => {
    // setState({ ...state, opencreattask: true })
    const param = {
      visible: true,
      from: 'taskdetail', //来源
      createType: 'addChild',
      id: findId,
      nowType: 0, //0个人任务 2企业任务 3部门任务
      teaminfo: '', //企业信息
      // taskType: dataState.type || 0,
      taskType: 0,
      parentTask: { parentId: dataState.id, parentTaskName: dataState.name },
      parentId: dataState.id,
      endTime: dataState.endTime,
      callbacks: (paramObj: any) => {
        const { data } = paramObj
        refreshFn({
          optType: 'addChildTask',
          from,
          parentId: findId,
          newChild: data,
          refreshTree: true,
        })

        if (from == 'work-plan') {
          callbackFn && callbackFn()
        }
      },
    }
    createTaskRef.current && createTaskRef.current.setState(param)
  }
  // 隐藏旧版支撑目标组件
  const supportShow = false
  return (
    <header className="taskDetailHeader pad_hor">
      <div className="header-content flex between">
        <div className="left_con">
          {supportShow && (
            <SupportMain supports={dataState.supports || {}} teamId={dataState.ascriptionId} taskId={findId} />
          )}
        </div>
        <div className="right_con flex center-v end">
          <div className="create_user_box flex center-v">
            {dataState.onFileTime ? (
              <>
                <span className="divider"></span>
                <span>{$intl.get('archivedAtTime', { time: dataState.onFileTime || '' })}</span>
              </>
            ) : (
              ''
            )}
          </div>
          {/* 关闭按钮 */}
          <span
            className={`img_icon del_item_icon cross close_btn ${
              from?.includes('wideDetail') || noCloseBtn ? 'forcedHide' : ''
            }`}
            onClick={() => {
              // detailModalHandle({ visible: false })
              setModalState({ visible: false })
            }}
          ></span>
        </div>
      </div>
      {/* 任务名称 */}
      <div className="taskNameBox">
        {/* <em className="support-icon"></em> */}
        <div className="flex between">
          <span
            className={`taskNameShow ${state.nameShow ? 'hide' : ''} ${!editAuth ? 'pointerText' : ''}`}
            onClick={() => {
              //编辑任务名称
              editAuth && setState({ ...state, nameShow: true })
            }}
          >
            {dataState.name}
          </span>
          <span className="create_user">
            {$intl.get('createdByUser', { userName: dataState.createUsername || '' })}
          </span>
        </div>
        <TaskNameEdit nameShow={state.nameShow || false} name={dataState.name} />
      </div>
      {/* 任务描述 */}
      <div
        className={`taskDescriptionShow ${dataState.description ? '' : 'no_des'}`}
        dangerouslySetInnerHTML={{
          __html: dataState.description
            ? dataState.description.replace(/<img [^>]*>/g, '[图片]')
            : '<span class="des_placeholder flex center-v">请添加任务描述</span>',
        }}
        onClick={() => {
          // console.log('编辑框内容', state.description)
          taskDesModal.current &&
            taskDesModal.current.setState({
              visible: true,
              description: dataState.description,
            })
        }}
      ></div>

      {/* 头部操作 */}
      <div className="headerOptBox flex between center-v">
        <div className="left_con flex center-v">
          {/* 任务类型 */}
          {/* <TaskTypeTag className="detailTaskType" type={dataState.type || 0} /> */}
          {/* 归属级别 */}
          <TaskDetailRank
            className="detailTaskRank opt_btn"
            taskContextObj={taskDetailObj}
            attach={dataState.attach}
            useFrom="taskDetail"
            authIn={true}
            editAuth={editAuth}
          />
          {/* 设置优先级 */}
          <Dropdown
            overlayClassName="selPriorityconetnt"
            visible={state.priorityvis}
            overlay={
              <Priority
                param={{
                  from: 'details',
                  teamId: dataState.attach.typeId,
                  deptId: dataState.attach.typeId,
                  roleId: dataState.attach.typeId,
                  initDatas: { data: dataState.attach.star, type: dataState.attach.type }, //用于反显的数据 0为清除
                  taskId: findId,
                  ascriptionType: dataState.attach.type,
                }}
                dropType="Dropdown"
                visible={state.priorityvis}
                onOk={(datas: any) => {
                  editPriority(datas)
                  setState({ ...state, priorityvis: false })
                }}
                setvisible={(type: any) => {
                  setState({ ...state, priorityvis: type })
                }}
              ></Priority>
            }
            placement="bottomRight"
            trigger={['click']}
            onVisibleChange={(flag: boolean) => {
              if (!editAuth) {
                setState({ ...state, priorityvis: false })
              } else {
                setState({ ...state, priorityvis: flag })
              }
            }}
          >
            <div className={`opt_btn set_pri_btn flex center-v ${!editAuth ? 'pointerDisable' : ''}`}>
              <span
                className="opt_txt"
                onClick={(e: any) => {
                  e.preventDefault()
                  setState({ ...state, priorityvis: true })
                }}
              >
                {dataState.attach.star ? dataState.attach.star + $intl.get('starNum') : $intl.get('Priority')}
              </span>
              <em className="img_icon tri_down no_hover"></em>
            </div>
          </Dropdown>
          {/* 设置循环 */}
          <Tooltip title={loopTaskListDataShow(dataState.cycleModel || {})}>
            <span
              className={`opt_btn set_loop_btn ${!editAuth ? 'pointerDisable' : ''}`}
              onClick={(e: any) => {
                e.preventDefault()
                setState({ ...state, openloop: true })
              }}
            >
              {[1].map(() => {
                let showTxt = '设置循环'
                if (dataState.cycleModel) {
                  const loopsTask = loopsTaskInfo({ cycleModel: dataState.cycleModel })
                  showTxt = loopsTask.showTxt
                }
                return (
                  <>
                    {showTxt}
                    {showTxt && (
                      <em
                        className={`img_icon del_item_icon hor ${dataState.cycleModel ? '' : 'forcedHide'}`}
                        onClick={(e: any) => {
                          e.stopPropagation()
                          delCycleModel()
                        }}
                      ></em>
                    )}
                  </>
                )
              })}
            </span>
          </Tooltip>

          {/* 设置公开私密 */}
          <span
            className={`opt_btn set_private_btn ${dataState.property ? 'private' : ''} ${
              !editAuth ? 'pointerDisable' : ''
            }`}
            onClick={(e: any) => {
              e.preventDefault()
              const property = dataState.property == 0 ? 1 : 0
              editPrivate(property)
            }}
          >
            {dataState.property ? '私密' : '公开'}
          </span>
        </div>
        <div className="right_con flex center-v">
          {/* 归档任务只有复盘按钮 */}
          {dataState.flag == 3 ? (
            // 复盘按钮
            <DetailBtns
              param={{
                taskData: {
                  ...dataState,
                },
                from: from + '_detail',
              }}
              callbackFn={() => {
                refreshFn({ optType: 'review', from })
              }}
              single={true}
              btnName="review"
              btnItem={dataState.btnsAuthObj['REVIEW'] || {}}
            />
          ) : (
            <>
              {/* 新增子任务 */}
              <Tooltip title="新增子任务">
                <span
                  className="opt_btn addchild_btn"
                  onClick={() => {
                    openCreateTask()
                  }}
                >
                  子任务
                </span>
              </Tooltip>

              {/* 写汇报 */}
              <DetailBtns
                param={{
                  taskData: {
                    ...dataState,
                  },
                  from: from + '_detail',
                }}
                callbackFn={({ types }: any) => {
                  refreshFn({ optType: types, refreshTree: true, from })
                }}
                single={true}
                btnName="report"
                btnItem={dataState.btnsAuthObj['REPORT'] || {}}
              />
              {/* 写备注 */}
              <Tooltip title="写备注">
                <span
                  className="opt_btn remark_btn"
                  onClick={() => {
                    editMarkModalHandle({ visible: true, uuid: Maths.uuid() })
                  }}
                >
                  {$intl.get('remark')}
                </span>
              </Tooltip>
              {/* 右键菜单 */}
              <DetailBtns
                param={{
                  taskData: {
                    ...dataState,
                    isFollow: dataState.followList && dataState.followList.length > 0 ? true : false,
                  },
                  from: from + '_detail',
                }}
                // setvisible={props.setvisible}
                callbackFn={({ types, childIds }: any) => {
                  refreshFn({
                    optType: types,
                    refreshTree: true,
                    from,
                    childIds,
                  })
                }}
              />
              {/* 开启按钮 */}
              <DetailBtns
                param={{
                  taskData: {
                    ...dataState,
                  },
                  from: from + '_detail',
                }}
                callbackFn={({ types }: any) => {
                  refreshFn({ optType: types, refreshTree: true, from })
                }}
                single={true}
                btnName="start"
                btnItem={dataState.btnsAuthObj['EXECUTE'] || {}}
              />
            </>
          )}
        </div>
      </div>
      {/* 创建子任务 */}
      {state.opencreattask && (
        <CreatTask
          param={{ visible: state.opencreattask }}
          datas={{
            from: 'taskdetail', //来源
            isCreate: 2, //创建0 编辑1 创建子任务2
            taskid: findId, //任务id
            taskdata: dataState.detailMain, //任务信息
            nowType: 0, //0个人任务 2企业任务 3部门任务
            teaminfo: '', //企业信息
          }}
          setvisible={(visible: any) => {
            setState({ ...state, opencreattask: visible })
          }}
          callbacks={(paramObj: any) => {
            const { data } = paramObj
            refreshFn({
              optType: 'addChildTask',
              from,
              parentId: findId,
              newChild: data,
              refreshTree: true,
            })

            if (from == 'work-plan') {
              callbackFn && callbackFn()
            }
          }}
        ></CreatTask>
      )}
      <CreateTaskModal ref={createTaskRef} />
      {/* ===内部版使用=== */}
      {/* 循环组件 */}
      {state.openloop && (
        <LoopsTask
          param={{
            visible: state.openloop,
            initdatas: dataState.cycleModel,
          }}
          action={{
            setModalShow: (flag: boolean) => {
              setState({ ...state, openloop: flag })
            },
            onOk: (datas: any) => {
              editCycleModel(datas)
            },
          }}
        ></LoopsTask>
      )}
      {/* 任务描述弹出层 */}
      <TaskDesModal ref={taskDesModal} taskDetailObj={taskDetailObj} />
    </header>
  )
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
 * 头部支撑组件
 * @param param0
 */
export const SupportMain = ({ supports, teamId, taskId }: { supports: any; teamId: any; taskId?: any }) => {
  const taskDetailObj: DetailContext = useContext(taskDetailContext)
  const { isReFreshOrgLeft } = taskDetailObj
  const directs = supports.direct || {}
  const directGroup = directs.group || []
  const indirects = supports.indirect || {}
  const directInfo = directs.info || []
  const indirectInfo = indirects.info || []
  //选择父级任务及选择支撑okr
  const [support, setSupport] = useState<any>({
    visible: false,
    selectList: [],
    directDrop: false, //直接支撑下拉框显示状态
    indirectDrop: false, //间接支撑下拉框显示状态
  })
  /**
   * 选择支撑目标
   */
  const selSupport = () => {
    const selectList: any = []
    const disableList: any = []
    directInfo?.map((item: any) => {
      selectList.push(item.id || '')
    })
    indirectInfo?.map((item: any) => {
      disableList.push(item.id || '')
    })
    setSupport({
      ...support,
      visible: true,
      selectList: [...selectList],
      disableList,
      onSure: (dataList: any, delList: any) => {
        // delList: 删除的集合
        if (delList.length > 0) {
          const newOkrList = pushOkrContentFn(dataList, delList)
          supportSure(newOkrList, [])
        } else {
          supportSure(dataList, [...directInfo])
        }
      },
    })
  }
  //取消选择的数据
  const pushOkrContentFn = (vaule: any, data?: any) => {
    const json1 = vaule || []
    const json2 = [...directInfo]
    const json = json1.concat(json2)
    let newJson = []
    for (const item1 of json) {
      let flag = true
      for (const item2 of newJson) {
        if (item1.id == item2.id) {
          flag = false
        }
      }
      if (flag) {
        newJson.push(item1)
      }
    }
    if (data.length > 0) {
      //取消的数据
      newJson = newJson.filter((item: any) => {
        const idList = data.map((v: any) => v.id)
        return !idList.includes(item.id)
      })
    }
    return newJson
  }
  /**
   * 支撑确认
   */
  const supportSure = (dataList: any, selectList: any) => {
    const supports: any = []
    selectList?.map((item: any) => {
      supports.push({
        mainId: item.mainId || '', //规划ID
        mainParentId: item.id || '', //规划支撑ID
        isExtends: false,
      })
    })
    dataList?.map((item: any) => {
      if (!selectList.includes(item.id)) {
        supports.push({
          mainId: item.mainId || '', //规划ID
          mainParentId: item.id || '', //规划支撑ID
          isExtends: false,
        })
      }
    })
    taskDetailObj.editSupports({
      supports,
    })
  }
  /**
   * 取消支撑
   */
  const cancleSupport = (item: any) => {
    setSupport({ ...support, directDrop: false, indirectDrop: false })
    cancelSupportApi({ taskId, planId: item.id }).then((res: any) => {
      if (res.success) {
        // 刷新数据
        isReFreshOrgLeft
          ? isReFreshOrgLeft(303, {
              //来自okr，刷新okr列表数据
              typeId: taskId,
              parentId: item.typeId,
              isOnlyRefreshLeftTree: true,
            })
          : taskDetailObj.queryTaskDetail() //任务，刷新任务列表数据
      }
    })
  }

  const editAuth = taskDetailObj.editAuth
  return (
    <div className="supportMain flex center-v">
      <span
        className={`support_btn ${editAuth ? '' : 'pointerDisable gray'}`}
        onClick={() => {
          selSupport()
        }}
      >
        {$intl.get('supportTarget')}
      </span>
      <Dropdown
        overlayClassName="directSupDrop"
        visible={support.directDrop}
        disabled={directGroup && directGroup.length > 0 ? false : true}
        overlay={
          <SupportList
            key={0}
            dataList={directInfo || []}
            taskId={taskId}
            editAuth={editAuth}
            cancelSup={true}
            title={$intl.get('supportTarget')}
            cancelHandle={cancleSupport}
          />
        }
        placement="bottomCenter"
        trigger={['hover']}
        onVisibleChange={(flag: boolean) => {
          setSupport({ ...support, directDrop: flag })
        }}
      >
        <div className="support_users">
          {directGroup?.map((item: any, i: number) => {
            let name: any = `${item.username || ''}(${item.count || 0})`
            if (i < directGroup.length - 1) {
              name += '、'
            }
            return <span key={i}>{name}</span>
          })}
        </div>
      </Dropdown>
      <em className="divider"></em>
      <Dropdown
        visible={support.indirectDrop}
        overlayClassName="indirectSupDrop"
        disabled={!indirects.count}
        overlay={
          <SupportList
            key={1}
            dataList={indirectInfo || []}
            taskId={taskId}
            title={$intl.get('indirectSupport')}
          />
        }
        placement="bottomCenter"
        trigger={['hover']}
        onVisibleChange={(flag: boolean) => {
          setSupport({ ...support, indirectDrop: flag })
        }}
      >
        <span className="ind_support_btn">
          {$intl.get('indirectSupport')}({indirects.count || 0})
        </span>
      </Dropdown>
      {/* 选择父级任务及选择支撑okr */}
      {support.visible && (
        <SupportModal
          param={{
            allowTeamId: [teamId], //组织架构的企业id
            contentType: 'okr',
            checkboxType: 'checkbox',
            disabTaskId: taskId ? [taskId] : [], //查询任务列表需要排除的任务id[后台禁用当前及子任务不能选择]
            isshowKR: true, //是否显示KR
            showType: 1, //1是父级任务列表，2是规划关联任务列表
            okrRelevanceType: 0,
            ...support,
          }}
          action={{
            setModalShow: (flag: boolean) => {
              setSupport({
                ...support,
                visible: flag,
              })
            },
          }}
        />
      )}
    </div>
  )
}
/**
 * 支撑
 */
export const SupportList = ({
  dataList,
  cancelSup,
  title,
  editAuth,
  cancelHandle,
  jumpHandle,
}: {
  dataList: any
  cancelSup?: boolean
  taskId?: any
  title?: string
  editAuth?: boolean
  cancelHandle?: any
  jumpHandle?: any
}) => {
  return (
    <div className="supportsDrop">
      <header className="support_tit">{title || '支撑目标'}</header>
      <table className="supportsTable">
        <tbody>
          {dataList?.map((item: any, i: number) => {
            let nameType = ''
            if (item.type == 2) {
              nameType = 'O'
            } else if (item.type == 3) {
              nameType = 'KR'
            }
            const avatarName = cutName(item.liableUsername || '', 2, -1) || ''
            const headDef: any = $tools.asAssetsPath('/images/workplan/head_def.png')
            const profile = !item.liableUserProfile && !avatarName ? headDef : item.liableUserProfile
            return (
              <tr key={i}>
                <td className="nameTd">
                  <div className="cellCont">
                    <Avatar className="oa-avatar" src={profile || ''}>
                      {avatarName}
                    </Avatar>
                    <span className="member_name text-ellipsis">{item.liableUsername || '?'}</span>
                  </div>
                </td>
                <td>
                  <div className="cellCont">
                    <span className="name_type flex_shrink_0">{nameType}</span>
                    <span
                      className={`goal_name flex-1 text-ellipsis ${item.view ? '' : 'disable'}`}
                      onClick={() => {
                        // 外部有回调处理的情况，使用外部方法
                        if (jumpHandle) {
                          jumpHandle({ item: item.detailsVo })
                        } else {
                          item.form = 'detail'
                          toOKRWindow(item.detailsVo)
                        }
                      }}
                    >
                      {item.name || ''}
                    </span>
                  </div>
                </td>
                {cancelSup ? (
                  <td>
                    <div className="cellCont">
                      <span
                        className={`support_act ${editAuth ? '' : 'disable'}`}
                        onClick={() => {
                          cancelHandle && cancelHandle(item)
                        }}
                      >
                        {$intl.get('cancelSupport')}
                      </span>
                    </div>
                  </td>
                ) : (
                  ''
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
