import React, { useState, useRef, useEffect, useContext } from 'react'
import { Avatar, Dropdown, Input, message, Tooltip, Rate } from 'antd'
import { cutName, setCaretEnd } from '@/src/common/js/common'
import { OkrDateModule } from '@/src/components/okrDate/okrDate'
import { SelectMemberOrg } from '@/src/components/select-member-org'
import { AddRemarkModal, editMarkModalHandle } from '../../modals/addRemarkModal'
import { getTaskBelong, TaskDesModal } from '../taskDetails/detailAttach'
import { DetailBtns } from '../taskDetails/detailBtns'
// import { detailModalHandle } from '../taskDetails/detailModal'
import { refreshTheme } from '../taskSynergy/taskSynergy'
import * as Maths from '@/src/common/js/math'
import '../taskDetails/detail.less'
import './detailHeader.less'
import { HeartFilled } from '@ant-design/icons'
import { queryPeriodApi } from './okrDetailApi'
import {
  DetailContext,
  getDetailWidthInit,
  setOkrModeActive,
  taskDetailContext,
  toOKRWindow,
  _okrModeActive,
} from '../taskDetails/detailRight'
import { getDistribute } from '../../okr-four/list-card-four/okr-addplanfu'
// import { statisticDistrApi } from '../../work-plan-mind/getData'
import { saveSupports, selectDateDisplay } from '../../fourQuadrant/getfourData'
import { useLayoutEffect } from 'react'
import CreatTask from '../creatTask/creatTask'
import { SupportModal } from '@/src/components/supportOKR/supportModal'
// import { refreshTwoQuadrantData } from '../../fourQuadrant/GetSingleData'
// import { refreshOkrKanban } from '../../workdesk/okrKanban/okrKanban'
import { ipcRenderer } from 'electron'
// import { updateNodeApi } from '../../workdesk/okrKanban/getData'
import { refreshDetails as refreshTaskLogDetails } from '../taskDynamic/taskDynamic'
import { CreateTaskModal } from '../creatTask/createTaskModal'
import TextArea from 'antd/lib/input/TextArea'
import { setStausNumberApi } from '../../work-plan-mind/getData'
/**
 * 详情头部组件
 */
export const OKRDetailHeader = ({
  dataState: dataStateOut,
  from,
  editOKRAffInfo,
  editOKRSave,
  detailBotRef,
  setModalState,
  areaName,
  noCloseBtn,
  refresh,
  editDataState,
}: {
  dataState: any
  detailQuery: any
  setQuery: any
  refreshFn: any
  from: any
  callbackFn: any
  editTaskName: any
  tabChange?: any
  [propName: string]: any
}) => {
  const taskDetailObj: DetailContext = useContext(taskDetailContext)
  const { refreshFn, mainData, editAuth, singleRefresh } = taskDetailObj

  const [state, setState] = useState({
    dataState: dataStateOut,
    priorityvis: false,
    opencreattask: false,
    setsupportShow: false,
    openloop: false,
    nameShow: false,
    liable: {},
    heart: dataStateOut.cci,
  })
  //选人插件
  const [selMemberOrg, setSelMemberOrg] = useState<any>({})
  // 创建任务弹框组件
  const createTaskRef = useRef<any>({})
  //任务描述窗口组件
  const taskDesModal = useRef<any>({})
  // state数据获取
  const { dataState } = state
  const affiliation = dataState.attach || {}
  // 归属、人员信息
  const belongObj = getTaskBelong(affiliation, mainData.ascriptionName)
  useEffect(() => {
    // 监听汇报修改KR信心指数刷新
    ipcRenderer.on('refresh_operated_task', (_: any, data: any) => {
      const { taskIds } = data.data
      console.log(111111)

      // 判断汇报变更是否包含当前O,不存在则右侧无数据，无需更新
      if (!taskIds || !taskIds.includes(dataStateOut.id)) return

      singleRefresh({ taskId: taskIds[0] }).then((resData: any) => {
        setState({ ...state, dataState: resData, heart: resData.cci / 2 })
        // 刷新动态日志
        refreshTaskLogDetails && refreshTaskLogDetails()
      })
    })
  }, [])
  useEffect(() => {
    setState({ ...state, heart: dataStateOut.cci / 2, dataState: dataStateOut })
  }, [dataStateOut.id, dataStateOut.cci, refresh])

  /**
   * 任务名编辑框
   */
  const TaskNameEdit = ({ name, nameShow, typeId }: { name: string; nameShow?: boolean; typeId: any }) => {
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
    /**
     * 编辑okr名字
     */
    const editName = (name: string) => {
      editOKRSave(
        { name },
        {
          optType: 'editName',
          refreshTree: true,
          callBack: () => {
            // 修改名称促使当前组件重刷，未及时更新名称问题
            dataState.name = name
            setSelMemberOrg({})
          },
        }
      )
    }
    return (
      <div
        contentEditable={true}
        dangerouslySetInnerHTML={{ __html: name }}
        ref={nameRef}
        className={`taskNameInp ${nameShow ? '' : 'forcedHide'}`}
        // defaultValue={name}
        onBlur={(e: any) => {
          if (name != e.target.innerText) {
            editName(e.target.innerText || '')
          }
          setState({ ...state, nameShow: false })
        }}
        onKeyUp={(e: any) => {
          if (e.keyCode == 13) {
            if (name != e.target.innerText) {
              editName(e.target.innerText || '')
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
  /**
   * 导航组件
   */
  const ContentTabs = ({ typeId }: any) => {
    const [state, setState] = useState({
      active: _okrModeActive,
    })
    useEffect(() => {
      if (state.active == '0') {
        $('.select_distribute,.distribute_to,.OKRDetailFliter').show()
      } else {
        $('.select_distribute,.distribute_to,.OKRDetailFliter').hide()
      }
    }, [])
    /**
     * 导航切换
     * @param key
     */
    const changeTabs = (key: string) => {
      // 只有四象限模式展示派发、筛选按钮
      if (key == '0') {
        $('.select_distribute,.distribute_to,.OKRDetailFliter').show()
      } else {
        $('.select_distribute,.distribute_to,.OKRDetailFliter').hide()
      }
      // 设置当前选中模式
      setOkrModeActive(key)
      setState({ ...state, active: key })
      detailBotRef.current && detailBotRef.current.setState({ nowContentTab: key })
      // okr独立窗口中切换模式后记录下来
      if (from?.includes('okrDetailWindow')) {
        const { okrWindowInfo } = $store.getState()
        const okrTabList = okrWindowInfo.tabsList || []
        okrTabList.map((item: any) => {
          if (item.findId == typeId) {
            item.okrModeActive = key
          }
        })
        $store.dispatch({ type: 'OKRWINDOWINFO', data: { tabsList: [...okrTabList] } })
      }
    }
    return (
      <ul className="tab_change_ul flex center-v">
        <Tooltip title={`${getDetailWidthInit(areaName) < 1000 ? '四象限' : ''}`}>
          <li
            className={`to_four_quadrant ${state.active == '0' ? 'active' : ''}`}
            data-mode="0"
            onClick={() => changeTabs('0')}
          >
            <em className="img_icon btn_icon"></em>
            <span className="btn_txt">四象限</span>
          </li>
        </Tooltip>
        <Tooltip title={`${getDetailWidthInit(areaName) < 1000 ? '对齐视图' : ''}`}>
          <li
            className={`to_map_view ${state.active == '1' ? 'active' : ''}`}
            onClick={() => changeTabs('1')}
            data-mode="1"
          >
            <em className="img_icon btn_icon"></em>
            <span className="btn_txt">对齐视图</span>
          </li>
        </Tooltip>
        <Tooltip title={`${getDetailWidthInit(areaName) < 1000 ? '详情' : ''}`}>
          <li
            className={`to_detail ${state.active == '2' ? 'active' : ''}`}
            onClick={() => changeTabs('2')}
            data-mode="2"
          >
            <em className="img_icon btn_icon"></em>
            <span className="btn_txt">详情</span>
          </li>
        </Tooltip>
      </ul>
    )
  }

  /**
   * 添加备注
   */
  const addMarksOk = () => {
    // if (!refreshTheme) {
    editDataState('2')
    // } else {
    //   refreshTheme && refreshTheme()
    // }
  }

  /**
   * 选择责任人
   */
  const selectLiable = () => {
    const selectList: any = []
    if (mainData.liableUser) {
      selectList.push({
        curId: mainData.liableUser || '',
        curName: mainData.liableUsername || '',
        account: '',
        curType: 0,
      })
    }
    const memberOrg: any = {
      visible: true,
      selectList,
      allowTeamId: [mainData.ascriptionId || ''],
      checkboxType: 'radio',
      isDel: false,
      permissionType: 3, //组织架构通讯录范围控制
      onSure: (dataList: any) => {
        console.log(dataList)
        editMembers(dataList, 1)
      },
    }
    setSelMemberOrg(memberOrg)
  }

  /**
   * 选择归属
   */
  const selectAffiliation = () => {
    const selectList: any = []
    const attachobj = mainData.attach || {}
    const headDef: any = $tools.asAssetsPath('/images/workplan/head_def.png')
    let profile = ''
    if (attachobj.type == 2) {
      profile = mainData.teamLogo || headDef
    } else if (attachobj.type == 3) {
      profile = ''
    } else {
      profile = attachobj.profile || ''
    }
    if (attachobj.typeId && attachobj.typeId != -1) {
      selectList.push({
        curId: attachobj.typeId || '',
        curName: belongObj.belongTxt || '',
        account: '',
        curType: attachobj.type || 0,
        profile,
      })
    }
    const memberOrg: any = {
      sourceType: 'taskBelong',
      visible: true,
      selectList,
      allowTeamId: [mainData.ascriptionId || ''],
      checkboxType: 'radio',
      permissionType: 1, //组织架构通讯录范围控制
      checkableType: [0, 2, 3],
      isDel: false,
      noQueryProfile: true, //初始进入不查询头像
      onSure: (dataList: any) => {
        console.log(dataList)
        editMembers(dataList, 0)
      },
    }
    setSelMemberOrg(memberOrg)
  }

  /**
   * 编辑人员
   */
  const editMembers = (dataList: any, type: number) => {
    if (dataList.length == 0) {
      return
    }
    const userObj = dataList[0] || {}
    const param = {
      ascriptionId: userObj.userId || userObj.curId,
      ascriptionType: userObj.curType || 0,
      deptId: userObj.deptId,
      roleId: userObj.roleId,
      userId: userObj.userId,
      account: userObj.account || '',
      onlyUser: type,
    }
    // 目标O的详情，当前是四象限模式下时，不查询详情全局刷新，要局部刷新
    if (dataState.workPlanType == 2 && _okrModeActive == '0') {
      const refreshParam = { optType: 'editBelong', refreshTree: true, noQuery: true }
      editOKRAffInfo(param, refreshParam).then((res: any) => {
        if (res) {
          singleRefresh({ ...refreshParam, taskId: dataState.id }).then((resData: any) => {
            setState({ ...state, dataState: { ...resData } })
          })
        }
      })
    } else {
      editOKRAffInfo(param, { optType: 'editBelong', refreshTree: true })
    }
  }
  // 编辑信心指数
  const editHeart = (heart: any) => {
    const refreshParam = {
      refreshTree: true,
      optType: 'editHeart',
      noQuery: true,
      // callBack: () => {
      //   message.success('编辑成功')
      // },
    }
    editOKRSave(
      { cci: heart * 2, process: dataState.process, processStatus: dataState.processStatus },
      refreshParam
    ).then(() => {
      singleRefresh({ ...refreshParam, taskId: dataState.id }).then((resData: any) => {
        message.success('编辑成功')
        setState({ ...state, dataState: { ...resData } })
      })
    })
  }

  /**
   * kr下打开创建子任务
   */
  const openCreateTask = () => {
    // setState({ ...state, opencreattask: true })
    const param = {
      from: 'taskdetailOkr', //来源
      visible: true,
      createType: 'addChild',
      id: '',
      nowType: 0, //0个人任务 2企业任务 3部门任务
      teaminfo: '', //企业信息
      taskType: dataState.type || 0, //0任务
      // parentTask: { parentId: dataState.id, parentTaskName: dataState.name },
      parentId: dataState.id,
      endTime: dataState.endTime,
      supportOkrList: [
        {
          typeId: dataState.id,
          name: dataState.name,
          id: dataState.workPlanId,
          type: dataState.type,
          mainId: dataState.mainId,
          createUser: dataState.createUser || '',
          liableUser: dataState.liableUser,
          liableUsername: dataState.liableUsername,
          liableUserProfile: dataState.liableUserProfile || '',
          endTime: dataState.endTime,
          createTime: dataState.startTime || '',
          process: dataState.process || 0,
        },
      ],
      parentType: 3, //3:Kr
      callbacks: (paramObj: any) => {
        const { data, supportsIds } = paramObj
        // 没有支撑 okr项，属于独立任务故不需要刷新
        if (supportsIds && supportsIds.length == 0) return
        const isHasNowKr = supportsIds.includes(dataState.detailMain.workPlanId)
        refreshFn({
          optType: isHasNowKr && supportsIds && supportsIds.length == 1 ? 'addChildTask' : 'all', // 如果支撑项大于过多，暂全刷处理，OMG 为难 --!!!
          parentId: isHasNowKr ? dataState.detailMain.id : '',
          childIds: [data.id],
          refreshTree: true,
        })
      },
    }
    createTaskRef.current && createTaskRef.current.setState(param)
  }

  // =============================数据处理=========================//

  // 责任人
  const liableObj: any = {
    userId: dataState.liableUser,
    username: dataState.liableUsername || '',
    profile: dataState.liableUserProfile,
  }
  const liableShow = cutName(liableObj.username || '', 2, -1) || ''
  const headDef: any = $tools.asAssetsPath('/images/workplan/head_def.png')
  let liableProfile = liableObj.profile || ''
  if (!liableProfile && !liableObj.username) {
    liableProfile = headDef
  }
  // 详情类型：2:O 3:KR
  const detailType: any = dataState.workPlanType && from?.includes('OKR') ? dataState.workPlanType : ''
  return (
    <header className="taskDetailHeader OKRDetailHeader pad_hor">
      <div className="headerTopCont flex between">
        <div className="left_con"></div>
        <div className="right_con flex center-v end">
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

      <div className="header_content flex between">
        <div className="left_con flex-1 flex center-v">
          <div>
            <em className={`img_icon ${detailType == 2 ? 'name_flag' : 'Krname_flag'}`}>
              {detailType == 3 ? 'KR' : ''}
            </em>
          </div>
          <div className="flex-1" style={{ width: 'calc(100% - 54px)' }}>
            {/* 任务名称 */}
            <div className="taskNameBox">
              <span
                className={`taskNameShow my_ellipsis ${state.nameShow ? 'hide' : ''} ${
                  !editAuth ? 'pointerDisable' : ''
                }`}
                style={{ width: '90%' }}
                onClick={() => {
                  //编辑任务名称
                  setState({ ...state, nameShow: true })
                }}
              >
                {dataState.name}
              </span>
              <TaskNameEdit nameShow={state.nameShow || false} name={dataState.name} typeId={dataState.id} />
            </div>
            {/* 归属信息 */}
            <div className="persionInfoRow flex center-v">
              {/* <PeriodDate
                dataState={dataState}
                from={from}
                refreshFn={refreshFn}
                editOKRSave={editOKRSave}
                typeId={dataState.id}
              /> */}
              {/* <span className="verLine14"></span>
              <div
                className={`persionInfoItem belongItem flex center-v text-ellipsis ${
                  !editAuth ? 'pointerDisable' : 'editHoverBlue'
                }`}
                onClick={() => {
                  selectAffiliation()
                }}
              >
                <span className="rank_name flex_shrink_0">
                  {belongObj.rangTxt ? belongObj.rangTxt + '-' : ''}
                </span>
                <Tooltip title={belongObj.belongTxt || ''}>
                  <span className="belong_info my_ellipsis">归属于{belongObj.belongTxt}</span>
                </Tooltip>
              </div>
              <span className="verLine14"></span> */}
              {/* 责任人 */}
              {/* <div
                className={`liableRow flex between center-v ${!editAuth ? 'pointerDisable' : ''}`}
                onClick={() => {
                  selectLiable()
                }}
              >
                <div className="memberItem">
                  <Tooltip title={'负责人'}>
                    <Avatar
                      key="liable"
                      className="oa-avatar"
                      src={liableProfile}
                      size={24}
                      style={{
                        width: '24px',
                        height: '24px',
                        marginRight: '4px',
                        backgroundColor: !liableObj.username ? 'inherit' : '#3949AB',
                      }}
                    >
                      {liableShow}
                    </Avatar>
                  </Tooltip>
                </div>
                <span className={`liable_name ${liableObj.username ? 'editHoverBlue' : ''}`}>
                  {liableObj.username ? liableObj.username.split(-2, 2) : ''}
                </span>
              </div> */}
              {/* {detailType == 3 && <span className="verLine14"></span>} */}
              {/* 信心指数 */}
              {/* {detailType == 3 && (
                <div className={`kr_heart_box`}>
                  <Rate
                    allowHalf
                    className="heard_heart"
                    character={
                      <HeartFilled
                        style={{
                          fontSize: '14px',
                        }}
                      />
                    }
                    defaultValue={2.5}
                    value={dataState.cci / 2}
                    onChange={(val: number) => {
                      if (val || (val == 0 && state.heart == 0.5)) {
                        editHeart(val)
                      }
                    }}
                    onHoverChange={(val: number) => {
                      console.log(val)
                      if (val) {
                        setState({ ...state, heart: val })
                      } else {
                        setState({ ...state, heart: dataState.cci / 2 })
                      }
                    }}
                  />
                  <span className="heartVal">{state.heart * 2}</span>
                </div>
              )} */}
            </div>
          </div>
        </div>
        <div className="right_con flex center-v end">
          <ScoreCom detailMain={dataState.detailMain} editOKRSave={editOKRSave} refreshFn={refreshFn} />
        </div>
      </div>
      {/* okr描述 */}
      {detailType != 3 && (
        <div
          className={`taskDescriptionShow okrDescription ${dataState.description ? '' : 'no_des'}`}
          dangerouslySetInnerHTML={{
            __html: dataState.description
              ? dataState.description.replace(/<img [^>]*>/g, '[图片]')
              : '<span class="des_placeholder flex center-v">目标描述Why now? 一些激励的话，阐述该目标为什么是现在去做</span>',
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
      )}
      {/* 头部操作 */}
      <div className="headerOptBox flex between center-v">
        <div className="left_con flex center-v">
          {/* 导航(O才有下面按钮) */}
          {detailType == 2 && <ContentTabs typeId={dataState.id} />}
          {/* okrDetailWindow：独立窗口中不需要再显示独立窗口打开 */}
          {from.indexOf('okrDetailWindow') == -1 && detailType == 2 && (
            <Tooltip title={'独立窗口打开'}>
              <div
                className="handleBtn another_win"
                onClick={(e: any) => {
                  // okr详情中id为以前的typeId,workPlanId 为以前的id
                  const detailMain = dataState.detailMain
                  // 获取当前选中模式
                  const newActive =
                    $(e.target)
                      .parents('.left_con')
                      .find('li.active')
                      .attr('data-mode') || ''
                  toOKRWindow({
                    ...detailMain,
                    typeId: detailMain.id,
                    id: detailMain.workPlanId,
                    // showType: 1,
                    okrModeActive: newActive,
                  })
                }}
              >
                <em className="img_icon another_win_icon"></em>
                <span className="btn_txt">{$intl.get('indepenWindow')}</span>
              </div>
            </Tooltip>
          )}
        </div>
        <div className="right_con flex center-v">
          {/* 筛选 */}
          {detailType == 2 && <OKRFliter detailBotRef={detailBotRef} typeId={dataState?.detailMain?.mainId} />}
          <span
            className="opt_btn remark_btn"
            onClick={() => {
              editMarkModalHandle({ visible: true, source: 'okr', uuid: Maths.uuid() })
            }}
          >
            备注
          </span>
          {/* 关联任务 */}
          {detailType == 3 && (
            <span
              className="opt_btn relateTask "
              onClick={() => {
                setState({ ...state, setsupportShow: true })
              }}
            >
              {$intl.get('relateTask')}
            </span>
          )}

          {/* ===右键菜单=== */}
          <DetailBtns
            param={{
              taskData: {
                ...dataState,
                // isFollow: dataState.followList && dataState.followList.length > 0 ? true : false,
              },
              from: from + '_detail',
            }}
            callbackFn={({ types }: any) => {
              // console.log(mainData)
              refreshFn({ optType: types, refreshTree: true, itemData: mainData })
            }}
          />
          {/* kr */}
          {detailType == 3 ? (
            <>
              {/* 添加子任务 */}
              <span
                className="opt_btn borderStyle addchild_btn add_task_btn"
                onClick={() => {
                  openCreateTask()
                }}
              >
                {$intl.get('createTask')}
              </span>
            </>
          ) : (
            ''
          )}
          {detailType == 2 ? (
            <>
              {/* ==派发任务按钮== */}
              <DistributesBtn refresh={dataState.refresh} mainData={mainData} detailBotRef={detailBotRef} />
            </>
          ) : (
            ''
          )}
          {/* 添加进展 */}
          <DetailBtns
            param={{
              taskData: {
                ...dataState,
              },
              from: from + '_detail',
            }}
            callbackFn={({ types }: any) => {
              refreshFn({ optType: types, refreshTree: true })
            }}
            single={true}
            btnName="progressRep"
            btnItem={dataState.btnsAuthObj['REPORT'] || {}}
          />
        </div>
      </div>
      {/* 编辑备注弹框 */}
      <AddRemarkModal
        from="hearder"
        taskId={dataState.id}
        cycleMNum={dataState.cycleNum || 0}
        addMarksOk={addMarksOk}
        teamId={dataState.ascriptionId}
      />
      {/* 选择人员弹框 */}
      {selMemberOrg.visible ? (
        <SelectMemberOrg
          param={{ ...selMemberOrg }}
          action={{
            setModalShow: (flag: boolean) => {
              setSelMemberOrg({ ...selMemberOrg, visible: flag })
            },
          }}
        />
      ) : (
        ''
      )}
      {/* kr 创建任务 */}
      {state.opencreattask && (
        <CreatTask
          param={{ visible: state.opencreattask }}
          datas={{
            from: 'taskdetailOkr', //来源
            isCreate: 2, //创建0 编辑1 创建子任务2
            taskid: '', //任务id
            taskdata: dataState.detailMain, //任务信息
            nowType: 0, //0个人任务 2企业任务 3部门任务
            teaminfo: '', //企业信息
          }}
          setvisible={(visible: any) => {
            setState({ ...state, opencreattask: visible })
          }}
          callbacks={(paramObj: any) => {
            const { data, supportsIds } = paramObj
            // 没有支撑 okr项，属于独立任务故不需要刷新
            if (supportsIds && supportsIds.length == 0) return
            const isHasNowKr = supportsIds.includes(dataState.detailMain.workPlanId)
            refreshFn({
              optType: isHasNowKr && supportsIds && supportsIds.length == 1 ? 'addChildTask' : 'all', // 如果支撑项大于过多，暂全刷处理，OMG 为难 --!!!
              parentId: isHasNowKr ? dataState.detailMain.id : '',
              childIds: [data.id],
              refreshTree: true,
            })
          }}
        ></CreatTask>
      )}
      <CreateTaskModal ref={createTaskRef} />
      {/* 关联任务 */}
      {/* {console.log(dataState.detailMain)} */}
      {state.setsupportShow && (
        <SupportModal
          param={{
            visible: state.setsupportShow,
            allowTeamId: [dataState.detailMain.ascriptionId],
            contentType: 'task',
            checkboxType: 'radio',
            title: $intl.get('relateTask'),
            workPlanType: dataState.detailMain.workPlanType || 2,
            periodId: dataState.periodId,
            workPlanId: dataState.detailMain.workPlanId,
            showType: 2, //1是父级任务列表，2是规划关联任务列表
          }}
          action={{
            setModalShow: (vaule: any) => {
              setState({ ...state, setsupportShow: vaule })
            },
            onSure: (vaule: any) => {
              const childIds: any[] = []
              vaule.forEach((item: any) => {
                childIds.push(item.id)
              })
              saveSupports(childIds[0], [
                {
                  mainId: dataState.detailMain.mainId,
                  mainParentId: dataState.detailMain.workPlanId,
                  isExtends: false,
                },
              ]).then((res: any) => {
                refreshFn({
                  optType: 'addChildTask',
                  parentId: dataState.detailMain.id,
                  childIds,
                  refreshTree: true,
                })
              })
            },
          }}
        />
      )}
      {/* 任务描述弹出层 */}
      <TaskDesModal
        from={'okrDetail'}
        ref={taskDesModal}
        taskDetailObj={taskDetailObj}
        setDescription={(val: any) => {
          dataState.description = val
          setState({ ...state })
        }}
      />
    </header>
  )
}
/**
 * 周期组件
 */
export const PeriodDate = ({
  dataState: dataStateOut,
  // refreshFn,
  editOKRSave,
}: // typeId,
{
  dataState: any
  from: string
  refreshFn: any
  editOKRSave: any
  typeId: any
}) => {
  const taskDetailObj: DetailContext = useContext(taskDetailContext)
  const { singleRefresh } = taskDetailObj

  const [state, setState] = useState({
    dataState: dataStateOut,
    periodList: [],
    periodId: '',
    nowHository: 1,
  })
  const { dataState } = state
  const { ascriptionId: teamId, attach, periodText, workPlanType, editAuth } = dataState
  useEffect(() => {
    queryPeriod()
  }, [dataStateOut.workPlanId, dataStateOut.periodText])

  const queryPeriod = () => {
    const { nowUserId } = $store.getState()
    const mySelf = '0'
    let ascriptionId = attach.typeId,
      ascriptionType = attach.type || ''
    if (ascriptionId < 0) {
      ascriptionId = ''
    }
    if (ascriptionType < 0) {
      ascriptionType = ''
    }
    // 查询周期是否显示历史周期
    selectDateDisplay().then((res: any) => {
      const nowHository = res.data.isClosed ? 1 : 0
      const param: any = {
        teamId,
        mySelf,
        ascriptionId: ascriptionId || nowUserId,
        ascriptionType: ascriptionType || 0,
        isClosed: nowHository,
      }
      // console.log('periodId:', periodId, state.dataState.periodId)
      // 查询周期列表
      queryPeriodApi(param).then((res: any) => {
        setState({
          ...state,
          dataState: dataStateOut,
          nowHository,
          periodList: res,
          periodId: state.dataState.periodId,
        })
      })
    })
  }

  /**
   * 编辑周期
   */
  const changePeriodId = ({ periodId }: any) => {
    //
    const refreshParam = { optType: 'editPeriodId', periodIds: [state.periodId, periodId], refreshTree: true }
    // 目标O的详情，当前是四象限模式下时，不查询详情全局刷新，要局部刷新
    if (dataState.workPlanType == 2 && _okrModeActive == '0') {
      editOKRSave({ periodId }, refreshParam).then((res: any) => {
        if (res) {
          singleRefresh({ ...refreshParam, taskId: dataState.id }).then((resData: any) => {
            // console.log('resData:', resData)
            state.dataState = { ...resData }
            state.periodId = periodId
            setState({ ...state })
          })
        }
      })
    } else {
      editOKRSave({ periodId }, refreshParam)
    }
  }

  // 详情类型：workPlanType 2:O 3:KR
  return (
    <Dropdown
      overlay={
        <OkrDateModule
          periodList={state.periodList}
          periodId={state.periodId}
          nowHository={state.nowHository}
          hideAllperiod={true}
          AfterchoseeData={(data: any) => {
            //更换周期选择
            // console.log('AfterchoseeData', data)
            if (data) {
              changePeriodId({ periodId: data.periodId })
            }
          }}
          changeListData={(val: any) => {
            console.log('changeListData', val)
            //历史周期查看
            // if (val) {
            //   refreshFn({ optType: 'changePeriodHository' })
            // }
          }}
          isEdit={true}
        />
      }
      placement="bottomCenter"
      // 只有O才有权限
      disabled={!editAuth || workPlanType != 2}
    >
      <div className={`time_filter ${editAuth && workPlanType == 2 ? 'editHoverBlue ' : ''}`}>
        <span className="time_filter_txt">{periodText}</span>
      </div>
    </Dropdown>
  )
}

/**
 * 派发按钮
 */
const DistributesBtn = ({
  mainData,
  detailBotRef,
  refresh,
}: {
  mainData: any
  detailBotRef: any
  refresh: any
}) => {
  const taskDetailObj: DetailContext = useContext(taskDetailContext)
  const { isReFreshOrgLeft, editAuth } = taskDetailObj
  const [state, setState] = useState({
    createType: 1,
    statusChoose: false,
    fromToType: 1,
  })
  useEffect(() => {
    setState({
      createType: 1,
      statusChoose: false,
      fromToType: 1,
    })
  }, [refresh])
  /**
   * 派发任务
   */
  const distributesTo = () => {
    const { nowUserId, nowAccount, selectDistribute } = $store.getState()
    // 四现象模式
    let param: any = {}

    if (state.statusChoose) {
      param = {
        mainId: mainData.mainId, //根节点id
        operateUser: nowUserId, //操作人Id
        operateAccount: nowAccount, //操作人帐号
        teamId: mainData.ascriptionId,
        teamName: mainData.ascriptionName,
        typeIds: selectDistribute, //单点派发集合
        isWhole: 0, //1象限派发 0选择派发
      }
    } else {
      //派发所有
      param = {
        mainId: mainData.mainId, //根节点id
        id: mainData.workPlanId, //节点Id
        typeId: mainData.id, //任务id
        operateUser: nowUserId, //操作人Id
        operateAccount: nowAccount, //操作人帐号
        teamId: mainData.ascriptionId,
        teamName: mainData.ascriptionName,
      }
    }
    if (state.statusChoose && param.typeIds.length == 0) {
      return message.warning($intl.get('noDistributeTask'))
    }
    getDistribute(param).then((resData: any) => {
      if (resData.returnCode === 0) {
        // setState({ ...state, statusChoose: false })
        // 刷新底部四象限
        detailBotRef.current && detailBotRef.current.setState({ statusChoose: false, refresh: 1 })
        // 刷新详情和左侧列表
        // refreshFn({ from: 'fourQuadrant' })
        isReFreshOrgLeft && isReFreshOrgLeft(105, { typeId: mainData.id })
      }
    })
  }
  //统计可派发得数量
  // const statisticDistr = () => {
  //   const param = {
  //     mainId: mainData.mainId, //根节点id
  //     id: mainData.workPlanId, //根节点ID
  //   }
  //   statisticDistrApi(param).then((res: any) => {
  //     $('.okrCountDistrib').text(`(${res || 0})`)
  //   })
  // }
  return (
    <>
      {/*breaking_distribute权限控制 !props.auth || (createType == 0 && fromToType == 1) ? 'mind_forbid' : '' */}
      <div
        className={`opt_btn borderStyle distribute_to okr_auto_btn noIcon  ${!editAuth ? 'disabledGray' : ''}`}
        onClick={() => {
          distributesTo()
        }}
      >
        <span className="distribute_plan_btn">
          {state.statusChoose && state.createType != 0
            ? $intl.get('distributeSelOption')
            : $intl.get('distributeTask')}
        </span>
        <span className="okrCountDistrib">
          {state.statusChoose && state.createType != 0
            ? `(${$store.getState().selectDistribute.length})`
            : '(0)'}
        </span>
      </div>

      <div
        className={`opt_btn borderStyle noIcon select_distribute okr_auto_btn ${
          !editAuth ? 'disabledGray' : ''
        }`}
        onClick={() => {
          // 四现象模式
          if (!state.statusChoose) {
            $store.dispatch({ type: 'SELECT_DISTRIBUTE_DATE', data: [] })
          }
          setState({ ...state, statusChoose: !state.statusChoose })
          // 刷新底部四象限
          detailBotRef.current && detailBotRef.current.setState({ statusChoose: !state.statusChoose })
        }}
      >
        <span>
          {state.statusChoose && state.createType != 0
            ? $intl.get('cancelSelect')
            : $intl.get('selectDistribute')}
        </span>
      </div>
    </>
  )
}
/**
 * 筛选按钮
 */
const OKRFliter = ({ detailBotRef, typeId }: any) => {
  const [state, setState] = useState({
    planClass: [1, 2],
    menuShow: false,
    finishCount: 0,
    unfinishedCount: 0,
  })
  useEffect(() => {
    if (!typeId) return
    const params = {
      mainId: typeId, //根节点id
    }
    setStausNumberApi(params).then((resdata: any) => {
      setState({
        ...state,
        finishCount: resdata.data.finishCount || 0,
        unfinishedCount: resdata.data.unfinishedCount || 0,
      })
    })
  }, [typeId])

  //状态设置
  const setStausMind = (type: number) => {
    let planClass: any = state.planClass
    if (type == 0) {
      planClass = [1, 2]
      $store.dispatch({ type: 'PLANOKRSTATEARR', data: [1, 2].toString() })
    } else {
      if (planClass.includes(type)) {
        if (planClass.length > 1) {
          planClass.splice(
            planClass.findIndex((item: number) => item === type),
            1
          )
          $store.dispatch({ type: 'PLANOKRSTATEARR', data: [...planClass].toString() })
        }
      } else {
        planClass.push(type)
        $store.dispatch({ type: 'PLANOKRSTATEARR', data: [...planClass].toString() })
      }
    }
    setState({ ...state, menuShow: false, planClass })
    detailBotRef.current && detailBotRef.current.setState({ okrFliter: planClass })
  }
  // 菜单显示隐藏
  const menuVisibleChange = (flag: boolean) => {
    setState({ ...state, menuShow: flag })
  }

  return (
    <Dropdown
      visible={state.menuShow}
      onVisibleChange={menuVisibleChange}
      overlay={
        <div className="planAccomplishMuem">
          <p>{$intl.get('filterByStatus')}：</p>
          <ul>
            <li
              className={`${state.planClass.includes(1) ? 'active' : ''}`}
              onClick={e => {
                e.preventDefault()
                setStausMind(1)
              }}
            >
              {$intl.get('notFinish')}({state.unfinishedCount})
            </li>
            <li
              className={`${state.planClass.includes(2) ? 'active' : ''}`}
              onClick={e => {
                e.preventDefault()
                setStausMind(2)
              }}
            >
              {$intl.get('finished')}({state.finishCount})
            </li>
            {/* <li
                    className={`${planClass.includes(3) ? 'active' : ''}`}
                    onClick={e => {
                      e.preventDefault()
                      setStausMind(3)
                    }}
                  >
                    归档
                  </li> */}
          </ul>
          <div className="reset">
            <span
              onClick={(e: any) => {
                e.preventDefault()
                setStausMind(0)
              }}
            >
              <i></i>
              {$intl.get('reset')}
            </span>
          </div>
        </div>
      }
      className="OKRDetailFliter"
      trigger={['click']}
      placement="bottomRight"
    >
      <span
        className={`opt_btn okr_filter ${state.planClass.length != 2 ? 'plan_subbt_active' : ''}`}
        onClick={e => {
          e.preventDefault()
          // setStausNumber()
        }}
      >
        {/* <em className="img_icon filter_icon"></em> */}
        <span>{$intl.get('filter')}</span>
      </span>
    </Dropdown>
  )
}
/**
 * 打分展示组件
 */
const ScoreCom = ({ detailMain, editOKRSave }: any) => {
  const taskDetailObj: DetailContext = useContext(taskDetailContext)
  const { editAuth } = taskDetailObj
  const { score, ratingType, workPlanType } = detailMain || {}
  const detailType: any = workPlanType || ''
  const [state, setState] = useState({
    showScore: score,
    editShow: false,
  })
  useEffect(() => {
    setState({ ...state, showScore: score, editShow: false })
  }, [score])
  /**
   * 编辑打分
   */
  const editScore = ({ newScore }: any) => {
    editOKRSave({ score: newScore }, { optType: 'editScore' }).then((res: any) => {
      // 保存失败则还原数据
      if (!res) {
        setState({ ...state, showScore: score })
      } else {
        setState({ ...state, editShow: false, showScore: newScore })
      }
    })
  }

  /**
   * 输入分值
   */
  const changeScore = (value: string) => {
    //权重和打分[分制为1:0-1的时候可以输入小数] 则可以输入小数后一位
    let newValue: any =
      ratingType == 1 ? value.replace(/^\D*(\d*(?:\.\d{0,1})?).*$/g, '$1') : value.replace(/\D/g, '')
    setState({ ...state, showScore: newValue })
  }
  return (
    <div className="grade_box">
      {!state.editShow && (
        <span
          className={`grade_num ${!editAuth ? 'pointerDisable' : ''}`}
          onClick={() => {
            // KR才可以打分
            if (detailType == 3) {
              setState({ ...state, editShow: true })
            }
          }}
        >
          {state.showScore}
        </span>
      )}
      {state.editShow && detailType == 3 && (
        <Input
          autoFocus
          type="text"
          min={0}
          max={ratingType == 100 ? 100 : 1}
          className="grade_num_inp"
          value={state.showScore}
          onChange={(e: any) => {
            changeScore(e.target.value)
          }}
          onBlur={(e: any) => {
            // 有变更才保存
            if (score != e.target.value) {
              let name = e.target.value
              if (ratingType == 100) {
                name = Math.round(Number(name) / 10) * 10
              }
              editScore({ newScore: name })
            }
          }}
        />
      )}
      <span className="grade_txt">{$intl.get('points')}</span>
    </div>
  )
}
