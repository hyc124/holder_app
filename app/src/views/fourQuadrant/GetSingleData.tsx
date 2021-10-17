import React, { useEffect, useState } from 'react'
import { Avatar, message, Dropdown, Input, Button } from 'antd'
import TaskDelayModal from '../workdesk/component/taskModule/taskDelayModal'
import { SupportModal } from '../../components/supportOKR/supportModal'
import moment from 'moment'
import { getAddprojectData } from '../workplan/addplanfu'
import { addprojectData } from '../okr-four/list-card-four/okr-addplanfu'
import { editOKRtask } from '../work-plan-mind/getData'
import { findOperationBtn, findContacts, getRelationList, sureRelation, cancelRelation } from './getfourData'
import { getTreeParam } from '../../common/js/tree-com'
import { ipcRenderer } from 'electron'
import DetailModal from '../task/taskDetails/detailModal'
import { OkrDateModule } from '@/src/components/okrDate/okrDate'
import { utf16toEntities, uncodeUtf16 } from './TableList'
import Evolveprogress from '../workdesk/okrKanban/Evolveprogress'
import { useContext } from 'react'
import { DetailContext, taskDetailContext, toOKRWindow } from '../task/taskDetails/detailRight'
import { refreshOkrKanban } from '../workdesk/okrKanban/okrKanban'
import { updateNodeApi } from '../workdesk/okrKanban/getData'
interface DataProps {
  data: TagItem //编辑数据
  mainId: string
  status: boolean //操作控制
  refreshTask: any //刷新控制
  personAuth: boolean //权限
  changeData: any //事件
  allLateNum: number //延迟数量统计
  periodList: any //周期列表
  createKRhtml: any
  nowHository: number
  sourceFrom?: string
}
interface TagItem {
  type: number
  endTime: string
  id: number
  name: string
  liableUsername: string
  liableUserProfile: string
  liableUser: any
  startTime: string
  typeId: string
  process: number
  mainId: string
  ascriptionId: number
  nodeText?: string
  status?: number
  icon?: string
  files?: number
  themes?: number
  day?: number
  ascriptionType?: number
  enterpriseId?: number | string
  weights?: number
  score?: number | string
  period?: any
  processStatus?: number
  update?: boolean
  processTimeStr?: string
}

interface ShowMouse {
  show: boolean
  type: number
  name: string
  aimlist: Array<any>
  bom: string
  relateList: Array<any>
}
let initStates: any = {
  type: 2,
  endTime: '',
  id: 0,
  name: '',
  liableUsername: '',
  liableUserProfile: '',
  startTime: '',
  typeId: '',
  process: 0,
  mainId: '',
  ascriptionId: 0,
  weight: 0, //权重
  score: 0, //打分
  period: {},
}

let clickFlag: any = null

export let refreshTwoQuadrantData: any = null
// 新增菜单
const GetSingleData = (props: DataProps) => {
  const { sourceFrom } = props
  const taskDetailObj: DetailContext = useContext(taskDetailContext)
  const { isReFreshOrgLeft } = taskDetailObj
  const [listData, setTableDatas] = useState<TagItem>(initStates) //用来存储编辑后的数据
  const [dbtitle, setDbtitle] = useState(false)
  const [nowHository, setnowHository] = useState<any>(false)
  //设置进度步长
  const [stepCreate, setstepCreate] = useState(false)
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
  const [nameRef, setNameRef] = useState(null)
  //选择父级任务及选择支撑okr
  const [supportShow, setsupportShow] = useState(false)
  const [support, setsupport] = useState<any>({
    content: [],
    iscontentEdit: false,
    isokrContentEdit: false,
    okrContent: [],
    type: 0, //0选择任务 1选择OKR
  })
  const [modelHover, setModelHover] = useState<ShowMouse>({
    show: false,
    type: 0, //0---向上支撑  1----被支撑
    name: $intl.get('supported'),
    bom: '-150px',
    aimlist: [], //--向上支撑
    relateList: [], //被支撑
  })
  const [nowCheck, setNowCheck] = useState(false)
  const [periodList, setPeriodList] = useState<any>(null)
  const [delayModal, setDelayModal] = useState(false) //延迟弹窗
  //显示隐藏任务详情
  const [opentaskdetail, setTaskdetail] = useState({
    visible: false,
    id: 0,
    taskData: {},
    editData: false,
    isaddtask: '',
  })
  const setTableData = (paramObj: any) => {
    initStates = { ...paramObj }
    setTableDatas({ ...paramObj })
  }
  //loading
  let isUnmounted = false
  // 监听进展汇报进展状态，刷新页面数据
  useEffect(() => {
    ipcRenderer.on('refresh_operated_task', (_: any, data: any) => {
      if (data.data && data.data.taskIds && data.data.taskIds[0] == initStates.typeId) {
        refreshSingeleData({ taskIds: data.data.taskIds[0] })
      }
    })
    refreshTwoQuadrantData = refreshSingeleData
    return () => {
      refreshTwoQuadrantData = null
      isUnmounted = true
    }
  }, [])

  const refreshSingeleData = ({ taskIds }: any) => {
    const { nowUserId } = $store.getState()
    // 更新当前O数据
    const params = {
      typeIds: taskIds,
      loginUserId: nowUserId,
    }
    updateNodeApi(params, '/task/work/plan/findTreeByIdIn').then((resDatas: any) => {
      if (!isUnmounted) {
        const dataList = resDatas.dataList[0]
        modelHover.aimlist = dataList.countModel.topRelation.list || []
        modelHover.relateList = dataList.countModel.bottomRelation.list || []
        setModelHover({ ...modelHover })
        setTableData({ ...initStates, ...dataList })
      }
    })
  }

  useEffect(() => {
    isUnmounted = false
    if (props.data.endTime) {
      setstepCreate(false)
      if (supportShow) {
        setsupportShow(false)
      } else if (delayModal) {
        setDelayModal(false)
      }
      if (opentaskdetail.visible) {
        opentaskdetail.visible = false
        setTaskdetail({ ...opentaskdetail })
      }
      props.data.mainId = props.mainId
      if (!props.data.id) {
        setDbtitle(true)
        setTableData(props.data)
      } else if (props.data.id && $store.getState().fromPlanTotype.createType == 1) {
        setDbtitle(false)
        setTableData(props.data)
      }
    }
  }, [
    props.data.endTime,
    props.data.mainId,
    props.data.id,
    props.data.score,
    props.data.liableUser,
    props.data.period,
  ])
  useEffect(() => {
    if (props.data.id && $store.getState().fromPlanTotype.createType == 1) {
      getObjectList(props.data.id, 0)
      getObjectList(props.data.id, 1)
    }
  }, [props.data.id])
  useEffect(() => {
    isUnmounted = false
    setnowHository(props.nowHository ? true : false)
    setPeriodList(props.periodList || [])
  }, [props.periodList, props.nowHository])
  //获取输入框焦点
  useEffect(() => {
    isUnmounted = false
    const ref: any = nameRef
    // 获取焦点
    if (ref) {
      ref.focus()
    }
  }, [nameRef])
  // 前往任务详情页
  const toTaskDetail = (item: any) => {
    item.typeId = item.id
    item.taskFlag = item.status
    opentaskdetail.visible = true
    opentaskdetail.id = item.id
    opentaskdetail.taskData = {
      id: item.id,
      name: item.name,
      ascriptionType: item.ascriptionType,
      ascriptionId: item.ascriptionId,
      ascriptionName: item.ascriptionName,
      status: item.taskstatus,
      flag: item.flag,
      approvalStatus: item.approvalStatus,
    }
    opentaskdetail.editData = false
    setTaskdetail({ ...opentaskdetail })
  }
  // 获取对齐/关联的列表 0---向上支撑  1----被支撑
  const getObjectList = (id: any, type: number) => {
    getRelationList(id, type).then((res: any) => {
      if (!isUnmounted) {
        if (type == 0) {
          modelHover.aimlist = res.dataList
          setModelHover({ ...modelHover })
        } else if (type == 1) {
          modelHover.relateList = res.dataList
          setModelHover({ ...modelHover })
        }
      }
    })
  }
  //输入框blur创建项目O
  const handelChange = (e: any) => {
    if (e.target.value == listData.name && listData.id) {
      setDbtitle(false)
      return false
    }
    if (e.target.value != '') {
      const param = {
        name: utf16toEntities(e.target.value),
        type: 2,
        endTime: listData.endTime,
        startTime: '',
      }
      if (listData.id) {
        const param = {
          id: listData.id,
          parentId: listData.id,
          mainId: props.mainId,
          typeId: listData.typeId,
          operateUser: $store.getState().nowUserId,
          name: utf16toEntities(e.target.value),
        }
        onTimeChange(param)
      } else {
        const getplan = $store.getState()
        //获取组织结构
        let getplanTree = getTreeParam(getplan.workplanTreeId)
        //是否入口为我的规划
        let isMyplan = getplan.planMainInfo.isMyPlan
        if ($('.work_okr_mind_content').length > 0 || $('.okrQuadrantModal').length > 0) {
          $store.dispatch({ type: 'DIFFERENT_OkR', data: 1 })
          getplanTree = getTreeParam(getplan.workokrTreeId)
          isMyplan = getplan.planOkrMainInfo.isMyPlan
          addprojectData(
            listData.period.periodId,
            getplanTree,
            {},
            isMyplan,
            1,
            param,
            $store.getState().planMainInfo.nowFolderId
          ).then((resData: any) => {
            message.success($intl.get('createSuc'))
            // 刷新规划列表
            ipcRenderer.send('refresh_plan_list_main')
            // =======刷新okr周期统计========//
            ipcRenderer.send('refresh_period_single_totals', {
              optType: 'changeTotals',
            })
          })
        } else {
          $store.dispatch({ type: 'DIFFERENT_OkR', data: 0 })
          getAddprojectData(
            getplanTree,
            getplan.myPlanOrg,
            isMyplan,
            1,
            param,
            $store.getState().planMainInfo.nowFolderId,
            listData.period.periodId
          ).then((resData: any) => {
            message.success($intl.get('createSuc'))
            // 刷新规划列表
            ipcRenderer.send('refresh_plan_list_main')
          })
        }
      }
    } else {
      if (listData.id) {
        setDbtitle(false)
      }
    }
  }
  // 列表上右键事件
  const rightClick = (e: any) => {
    if (
      e.target.parentNode.className === 'ant-picker-input' ||
      e.target.parentElement.className === 'ant-picker-panel' ||
      e.target.className.includes('okr_four_time')
    ) {
      props.refreshTask(2, {
        rightMenuItem: { display: 'none', pageX: 0, pageY: 0, row: {} },
        moreMenu: [],
      })
      return false
    }
    const leftX = e.pageX + 220 - document.body.clientWidth
    if (e.pageX + 220 > document.body.clientWidth) {
      e.pageX = e.pageX - leftX
    }
    const rightMenues = {
      display: 'block',
      pageX: e.pageX,
      pageY: e.pageY,
      row: {
        taskName: props.data,
        mainId: props.mainId,
      },
    }
    const param = {
      id: props.data.typeId,
      userId: $store.getState().nowUserId,
      viewType: 4,
      mainId: props.mainId,
    }
    findOperationBtn(param).then((resData: any) => {
      if (resData.returnCode == 0) {
        props.refreshTask(2, {
          rightMenuItem: rightMenues,
          moreMenu: resData.dataList,
          taskinfo: resData.data,
        })
      }
    })
  }
  // 隐藏菜单
  const hideAllMenu = () => {
    document.removeEventListener('click', hideAllMenu)
  }
  //改变时间处理
  const onTimeChange = (param: any, val?: string) => {
    editOKRtask(param).then((resData: any) => {
      if (resData.returnCode == 0) {
        message.success($intl.get('updateSuc'))
        if (param.endTime) {
          listData.endTime = param.endTime
        } else if (param.startTime) {
          listData.startTime = param.startTime
        } else if (param.name) {
          if (jQuery('.okrQuadrantModal  .fourQuadrant').length > 0) {
            ipcRenderer.send('solve_okrList_detail', param)
          }
          listData.name = param.name
          setDbtitle(false)
          props.refreshTask(9, listData)
        } else if (param.process || param.process == 0) {
          if (param.processStatus || param.processStatus == 0) {
            listData.processStatus = param.processStatus
          }
          if (jQuery('.okrQuadrantModal  .fourQuadrant').length > 0) {
            ipcRenderer.send('solve_okrList_detail', param)
          }
          if (param.process == 100 || jQuery('.plan_tab_sign').hasClass('finish')) {
            props.refreshTask(7)
          }
          listData.process = param.process
          setTableData({ ...listData })
          setDbtitle(false)
        }
        if (param.endTime) {
          const newDate = moment(new Date()).format('YYYY/MM/DD')
          const endTime = moment(new Date(param.endTime)).format('YYYY/MM/DD')
          let days = (new Date(endTime).getTime() / 1000 - new Date(newDate).getTime() / 1000) / 60 / 60 / 24
          if (newDate == endTime) {
            days = 1
          } else {
            days = days < 0 ? 0 : days + 1
          }
          listData.day = days
        } else if (param.periodId) {
          listData.period = val
          modelHover.aimlist = []
          modelHover.relateList = []
          setModelHover({ ...modelHover })
          if (jQuery('.okrQuadrantModal  .fourQuadrant').length > 0) {
            ipcRenderer.send('solve_okrList_detail', param)
          }
          // =======刷新okr周期统计========//
          ipcRenderer.send('refresh_period_single_totals', {
            optType: 'changeTotals',
            periodIds: [param.periodIdOld, param.periodId],
          })
          setTableData({ ...listData })
        }
        // O状态修改 刷新左侧任务链
        isReFreshOrgLeft && isReFreshOrgLeft(7, listData)
      }
    })
  }

  const menuBtnClick = (e: any) => {
    const rightMenues = {
      display: 'block',
      pageX: e.pageX,
      pageY: e.pageY,
      row: props.data,
    }
    const teamId: any = props.data.enterpriseId
    findContacts(teamId).then((res: any) => {
      menuBtnShow.classData = rightMenues
      menuBtnShow.moreMenu = res.dataList || []
      setIconBtnShow({ ...menuBtnShow })
      props.refreshTask(4, {
        classData: rightMenues,
        moreMenu: res.dataList || [],
      })
    })
  }
  const headDef: any = $tools.asAssetsPath('/images/workplan/head_def.png')
  //保存选择的支撑OKR
  const pushOkrContentFn = (vaule: any, item: any) => {
    const json1 = vaule || []
    let json2 = [...modelHover.relateList]
    if (modelHover.type == 0) {
      json2 = [...modelHover.aimlist]
    }
    const newJson = [...json2]
    const addIds = []
    for (const item1 of json1) {
      let flag = true
      for (const item2 of json2) {
        if (item1.key == item2.planId) {
          flag = false
        }
      }
      if (flag) {
        newJson.push({
          planId: item1.key,
          userId: item1.liableUser || 0,
          username: item1.liableUsername || $intl.get('others'),
          profile: item1.liableUserProfile || '',
          name: item1.taskName,
        })
        addIds.push(item1.key)
      }
    }
    if (addIds.length == 0) {
      return false
    }
    sureRelation(modelHover.type, listData.id, addIds).then(() => {
      if (modelHover.type == 0) {
        modelHover.aimlist = newJson
      } else {
        modelHover.relateList = newJson
      }
      setModelHover({ ...modelHover })
      // 操作后刷新
      // refreshData({ optType: 'upSupports', item })
      // 刷新左侧任务链
      isReFreshOrgLeft && isReFreshOrgLeft(3030, { ...item, optType: 'upSupports' })
    })
  }
  // 处理对齐/关联数据展示
  const getnameList = (list: any) => {
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
      nameList += item.username + '(' + item.personNum + ')' + '、'
    })
    return nameList.slice(0, nameList.length - 1)
  }
  const UserSetingMenu = () => {
    const nowDataList: any = modelHover.type == 0 ? modelHover.aimlist : modelHover.relateList
    return (
      <div className="model_Hover">
        <i>{modelHover.name}</i>
        <ul className="model_Hover_list">
          {nowDataList &&
            nowDataList.length > 0 &&
            nowDataList.map((item: any, index: number) => (
              <li className="model_Hover_item" key={index}>
                <span className="getnowName text-ellipsis">
                  <Avatar
                    size={24}
                    src={item.userId ? item.profile : headDef}
                    className="oa-avatar"
                    style={{ fontSize: '11px' }}
                  >
                    {item.userId ? item.username.substr(-2, 2) : '?'}
                  </Avatar>
                  {item.userId ? item.username : '?'}
                </span>
                <p
                  className="okr_name text-ellipsis"
                  onClick={() => {
                    if (props.personAuth || props.status) {
                      return false
                    }
                    item.form = sourceFrom
                    item.id = item.planId
                    item.okrModeActive = '2' //默认选中详情
                    toOKRWindow(item)
                  }}
                >
                  {item.name}
                </p>
                <span
                  style={{ color: props.personAuth || props.status ? '#70707A' : '#4285F4', cursor: 'pointer' }}
                  onClick={e => {
                    e.stopPropagation()
                    if (props.personAuth || props.status) {
                      return false
                    }
                    setNowCheck(false)
                    // 取消对齐
                    cancelAlign({ listData, item, modelHover, index })
                  }}
                >
                  {modelHover.type == 0 ? $intl.get('cancelAlign') : $intl.get('cancelRelate')}
                </span>
              </li>
            ))}
        </ul>
      </div>
    )
  }
  // 取消对齐
  const cancelAlign = ({ listData, item, modelHover, index }: any) => {
    cancelRelation(listData.id, item.planId, modelHover.type).then(() => {
      if (modelHover.type == 0) {
        modelHover.aimlist.splice(index, 1)
      } else {
        modelHover.relateList.splice(index, 1)
      }
      setModelHover({ ...modelHover })
      // 刷新工作台
      // if (
      //   sourceFrom &&
      //   (sourceFrom?.indexOf('workbench_OKR') > -1 || sourceFrom?.indexOf('okrKanban_OKR') > -1)
      // ) {
      // 刷新左侧任务链
      isReFreshOrgLeft && isReFreshOrgLeft(3031, { ...listData, optType: 'cancleRelate' })
      // }
    })
  }

  /**
   * 操作后刷新（okr看板没有写创建刷新，5.1后改）
   */
  const refreshData = ({ optType, item }: any) => {
    // 刷新工作台
    if (
      sourceFrom &&
      (sourceFrom?.indexOf('workbench_OKR') > -1 || sourceFrom?.indexOf('okrKanban_OKR') > -1)
    ) {
      refreshOkrKanban && refreshOkrKanban({ optType, taskIds: [item.typeId] })
    }
  }
  return (
    <>
      <div
        className="root part-okr-quadrant ant-table-row"
        onContextMenu={event => {
          if (!props.status && props.data.id) {
            rightClick(event)
          }
          document.addEventListener('click', hideAllMenu)
        }}
        onClick={(e: any) => {
          if (props.status || !props.data.id) {
            return false
          }
          e.stopPropagation()
          const _con = jQuery('.fourQuadrant .part-now-status .part-okr-quadrant') // 设置目标区域
          if (
            (!_con.is(e.target) && _con.has(e.target).length === 0) ||
            e.target.className.includes('isokr_nameClen')
          ) {
            return false
          } else if (e.target.className.includes('okr_task_name')) {
            if (clickFlag) {
              //取消上次延时未执行的方法
              clickFlag = clearTimeout(clickFlag)
            }
            clickFlag = setTimeout(function() {
              props.refreshTask(3, listData)
            }, 300) //延时300毫秒执行
          } else if (!e.target.className.includes('ant-picker-input')) {
            props.refreshTask(3, listData)
          }
        }}
      >
        <div className="taskTagListBox">
          <span
            className="quadrant-header-btn"
            style={{ backgroundColor: 'inherit', position: 'relative' }}
            onMouseOver={() => {
              if (props.status || props.personAuth) {
                return false
              }
              setstepCreate(true)
            }}
          >
            <i style={{ backgroundPositionY: 'bottom' }}></i>
            {$intl.get('addKR')}
            <i className="quadrant-header-select"></i>
            {stepCreate && (
              <ul
                onClick={() => {}}
                className="quadrant-btn-list"
                onMouseLeave={() => {
                  setstepCreate(false)
                }}
              >
                <li key="1" className="quadrant-btn-add">
                  <Button
                    onClick={(e: any) => {
                      e.stopPropagation()
                      props.createKRhtml('2', 3)
                    }}
                  >
                    <i></i>
                    {$intl.get('keyResult')}
                  </Button>
                </li>
                <li key="2" className="quadrant-btn-add">
                  <Button
                    onClick={(e: any) => {
                      e.stopPropagation()
                      props.createKRhtml('2', 1)
                    }}
                  >
                    <i></i>
                    {$intl.get('createTask')}
                  </Button>
                </li>
                <li key="3" className="quadrant-relate-btn" style={{ minWidth: '110px', height: '34px' }}>
                  <Button
                    onClick={(e: any) => {
                      e.stopPropagation()
                      props.createKRhtml('8', 1)
                    }}
                  >
                    <i></i>
                    {$intl.get('relateTask')}
                  </Button>
                </li>
              </ul>
            )}
          </span>
          <div
            className="task_okr_btn"
            onClick={(e: any) => {
              e.stopPropagation()
            }}
          >
            <Dropdown
              overlayClassName={'count_date_show'}
              overlay={
                <OkrDateModule
                  periodList={periodList}
                  periodId={listData.period.periodId}
                  nowHository={nowHository}
                  AfterchoseeData={(data: any) => {
                    if (data) {
                      const param = {
                        id: listData.id,
                        parentId: listData.id,
                        mainId: props.mainId,
                        typeId: listData.typeId,
                        operateUser: $store.getState().nowUserId,
                        periodId: data.periodId,
                        periodIdOld: listData.period?.periodId,
                        teamId: listData.enterpriseId,
                      }
                      onTimeChange(param, data)
                    }
                  }}
                  changeListData={(val: any) => {
                    if (val) {
                      if (jQuery('.okrQuadrantModal .fourQuadrant').length > 0) {
                        ipcRenderer.send('solve_okrList_detail', { date: 'date', typeId: listData.typeId })
                      } else {
                        props.changeData('', 'date')
                      }
                    }
                  }}
                />
              }
              placement="bottomCenter"
              disabled={props.status || props.personAuth || !props.data.id ? true : false}
            >
              <span className="okr_message">
                <i className="node_time nodeaffiliation"></i>
                <span style={{ width: 'auto' }}> {$intl.get('period')}:</span>
                <span
                  className={`okr_message_aff text-ellipsis ${
                    listData.type == 2 || listData.type == 3 || listData.status != 1 ? 'getblue' : ''
                  }`}
                >
                  {listData.period && listData.period.periodText}
                </span>
                <i className="nodeaffiliation node_select"></i>
              </span>
            </Dropdown>

            <span className="okr_mess_line"></span>
            <span
              className="okr_message"
              onClick={(e: any) => {
                e.stopPropagation()
                if (props.status || props.personAuth) {
                  return false
                }
                props.refreshTask(5, listData)
              }}
            >
              <i className="nodeaffiliation"></i>
              <span style={{ width: 'auto' }}>{$intl.get('affiliation')}:</span>
              <span
                className={`okr_message_aff text-ellipsis ${
                  listData.type == 2 || listData.type == 3 || listData.status != 1 ? 'getblue' : ''
                }`}
              >
                {listData.nodeText || '?'}
              </span>
              <i className="nodeaffiliation node_select"></i>
            </span>
          </div>
        </div>
        <div className="part-now-add">
          <span>
            <Dropdown
              overlay={<UserSetingMenu />}
              onVisibleChange={() => {
                if (props.status || !props.data.id) {
                  return false
                }
                if (menuBtnShow.classData.display == 'block') {
                  props.refreshTask(4, {
                    classData: {
                      display: 'none',
                      pageX: 0,
                      pageY: 0,
                      row: props.data,
                    },
                    moreMenu: [],
                  })
                }
                modelHover.name = $intl.get('upSupport')
                modelHover.type = 0
                setModelHover({ ...modelHover })
              }}
            >
              <span
                style={{
                  float: 'right',
                  marginLeft: '12px',
                  cursor: 'pointer',
                  height: '21px',
                  marginTop: '-1px',
                }}
                className="getnowName"
                onClick={(e: any) => e.stopPropagation()}
              >
                {modelHover.aimlist.length > 0 ? getnameList(modelHover.aimlist) : ''}
              </span>
            </Dropdown>
            <Button
              className="quadrant-header-btn"
              onClick={e => {
                e.stopPropagation()
                if ((listData.ascriptionId == -1 && !props.data.id) || props.status || props.personAuth) {
                  if (listData.ascriptionId == -1 && !props.data.id) {
                    message.info($intl.get('upSupport'))
                  }
                  return false
                }
                setsupportShow(true)
                const getArrIds: any = []
                const getNowIds: any = []
                modelHover.relateList.forEach((element: any) => {
                  getArrIds.push(element.planId)
                })
                modelHover.aimlist.forEach((element: any) => {
                  getNowIds.push(element.planId)
                })
                setsupport({
                  ...support,
                  type: 1,
                  disableList: getArrIds,
                  selectList: getNowIds,
                })
                modelHover.type = 0
                setModelHover({ ...modelHover })
              }}
            >
              <i></i>
              {$intl.get('upSupport')}
            </Button>
          </span>
        </div>
        <div className="okr_text_content ant-table-cell" data-type={listData.type} data-name={listData.name}>
          <div
            className="okr_text_Box text_Box_okr"
            data-toggle="tooltip"
            data-original-title={$intl.get('doubleCEdit')}
            data-container="body"
          >
            <span
              className="okr_task_name"
              style={{ color: ' #191f25' }}
              onDoubleClick={e => {
                e.stopPropagation()
                if (clickFlag) {
                  //取消上次延时未执行的方法
                  clickFlag = clearTimeout(clickFlag)
                }
                if (props.status || props.personAuth) {
                  return false
                }
                setDbtitle(true)
              }}
            >
              <span className={`isokr O_okr ${!listData.id ? 'no_mind_forbid' : ''}`}></span>
              {!dbtitle && (
                <span className="isokr_nameClen">
                  {listData.icon && (
                    <span
                      className="okr_icon"
                      data-id={listData.icon}
                      style={{
                        background: `url(../../../../assets/images/task/${listData.icon}.png) no-repeat`,
                      }}
                    ></span>
                  )}
                  {uncodeUtf16(listData.name) || '.'}
                </span>
              )}
            </span>
            <div className="okr_column_peredit flex">
              <div className="node_portrait_chose">
                <p
                  className="node_portrait_person"
                  onClick={(e: any) => {
                    e.stopPropagation()
                    if (props.status || props.personAuth) {
                      return false
                    }
                    menuBtnClick(e)
                  }}
                >
                  <Avatar
                    size={24}
                    src={listData.liableUsername ? listData.liableUserProfile : headDef}
                    className="oa-avatar"
                    style={
                      listData.liableUsername
                        ? { fontSize: '11px' }
                        : { fontSize: '11px', backgroundColor: 'inherit' }
                    }
                  >
                    {listData.liableUsername ? listData.liableUsername.substr(-2, 2) : ''}
                  </Avatar>
                  <span style={{ marginLeft: '4px', maxWidth: '48px' }} className="text-ellipsis">
                    {listData.liableUsername ? listData.liableUsername : '?'}
                  </span>
                </p>
              </div>
              <div className="okr_column_title flex" style={{ width: '310px' }}>
                {/* ===进展进度 新=== */}
                <div
                  className="okr_evolve_box"
                  onClick={(e: any) => {
                    e.stopPropagation()
                  }}
                >
                  <div className="evolve_progress">
                    {!dbtitle && (
                      <Evolveprogress
                        id={listData.id}
                        typeId={listData.typeId}
                        percent={listData.process}
                        processStatus={listData.processStatus}
                        hasAuth={listData.update ? 1 : 0}
                        setcallbackFn={(value: any, evolvestart: any) => {
                          //进度
                          const param = {
                            id: listData.id,
                            mainId: listData.mainId,
                            typeId: listData.typeId,
                            operateUser: $store.getState().nowUserId,
                            process: value || 0,
                            processStatus: evolvestart,
                          }
                          onTimeChange(param)
                        }}
                      />
                    )}
                  </div>
                  <div className="evolve_start">
                    <span className="evolve_start_left">
                      <span>{listData.process || 0}% </span>
                      <span className={`leftline ${listData.processTimeStr ? '' : 'hide'}`}>
                        {' '}
                        {listData.processTimeStr}
                      </span>
                    </span>
                    <span
                      className="evolve_start_right"
                      onClick={e => {
                        e.stopPropagation()
                        if (props.status || !props.allLateNum) {
                          return false
                        }
                        setDelayModal(true)
                      }}
                    >
                      <span>{$intl.get('latedTask')}：</span>
                      <span>{props.allLateNum || 0}</span>
                    </span>
                  </div>
                </div>
                <div className="okr_column_item">
                  <span>{$intl.get('weight')}</span>
                  <span className="blod_blue">{listData.weights}%</span>
                </div>
                <div className="okr_column_item">
                  <span>{$intl.get('grade')}</span>
                  <span className="blod_blue">{listData.score}</span>
                </div>
              </div>
            </div>
            {/* {!dbtitle && listData.files ? <span className="specail-show-file"></span> : ''} */}
            {dbtitle && (
              <Input
                id="okr_task_name"
                itemID="okr_task_name"
                ref={(el: any) => setNameRef(el)}
                maxLength={100}
                onKeyUp={e => {
                  if (e.keyCode == 13) {
                    handelChange(e)
                  }
                }}
                onClick={e => {
                  e.stopPropagation()
                }}
                onBlur={e => handelChange(e)}
                defaultValue={uncodeUtf16(listData.name)}
                autoFocus={true}
              />
            )}
          </div>

          <div className="part_relate_task">
            <Dropdown
              overlay={<UserSetingMenu />}
              disabled={modelHover.relateList.length > 0 ? false : true}
              onVisibleChange={(flag: any) => {
                setNowCheck(flag)
                if (menuBtnShow.classData.display == 'block') {
                  props.refreshTask(4, {
                    classData: {
                      display: 'none',
                      pageX: 0,
                      pageY: 0,
                      row: props.data,
                    },
                    moreMenu: [],
                  })
                }
                modelHover.name = $intl.get('supported')
                modelHover.type = 1
                setModelHover({ ...modelHover })
              }}
              visible={nowCheck}
            >
              <i
                className="getnowName"
                onClick={e => {
                  e.stopPropagation()
                  if ((listData.ascriptionId == -1 && !props.data.id) || props.status || props.personAuth) {
                    if (listData.ascriptionId == -1 && !props.data.id) {
                      message.info($intl.get('addNameMsg'))
                    }
                    return false
                  }
                  setsupportShow(true)
                  const getArrIds: any = []
                  const getNowIds: any = []
                  modelHover.aimlist.forEach((element: any) => {
                    getArrIds.push(element.planId)
                  })
                  modelHover.relateList.forEach((element: any) => {
                    getNowIds.push(element.planId)
                  })
                  setsupport({
                    ...support,
                    type: 1,
                    disableList: getArrIds,
                    selectList: getNowIds,
                  })
                  modelHover.type = 1
                  setModelHover({ ...modelHover })
                }}
              >
                {$intl.get('supported')}({modelHover.relateList.length})
              </i>
            </Dropdown>
            <div className="node_portrait_chose">
              <p
                className="node_portrait_person"
                onClick={(e: any) => {
                  e.stopPropagation()
                  if (props.status || props.personAuth) {
                    return false
                  }
                  menuBtnClick(e)
                }}
              >
                <Avatar
                  size={24}
                  src={listData.liableUsername ? listData.liableUserProfile : headDef}
                  className="oa-avatar"
                  style={
                    listData.liableUsername
                      ? { fontSize: '11px' }
                      : { fontSize: '11px', backgroundColor: 'inherit' }
                  }
                >
                  {listData.liableUsername ? listData.liableUsername.substr(-2, 2) : ''}
                </Avatar>
                <span style={{ marginLeft: '4px', maxWidth: '48px' }} className="text-ellipsis">
                  {listData.liableUsername ? listData.liableUsername : '?'}
                </span>
              </p>
            </div>
            <div
              className="part_relate_line"
              style={{ marginLeft: '8px' }}
              onClick={e => {
                e.stopPropagation()
                if (props.status || !props.allLateNum) {
                  return false
                }
                setDelayModal(true)
              }}
            >
              {$intl.get('latedTask')}:
              {props.allLateNum ? (
                <span style={{ marginRight: '3px' }}>{props.allLateNum}</span>
              ) : (
                <span style={{ marginRight: '3px' }}>0</span>
              )}
            </div>
          </div>
          <span className="icon_up_head"></span>
        </div>
      </div>
      {/* 向上支撑/被支撑 */}
      {supportShow && (
        <SupportModal
          param={{
            visible: supportShow,
            allowTeamId: [listData.enterpriseId || listData.ascriptionId],
            contentType: support.type == 0 ? 'task' : 'okr',
            checkboxType: support.type == 0 ? 'radio' : 'checkbox',
            okrAimId: listData.id,
            disableList: support.disableList || [],
            selectList: support.selectList || [],
            okrRelevanceType: 1,
            title: modelHover.type ? $intl.get('supported') : $intl.get('upSupport'),
            showType: 2, //1是父级任务列表，2是规划关联任务列表
            periodId: listData.period ? Number(listData.period.periodId) : 0,
          }}
          action={{
            setModalShow: setsupportShow,
            onSure: (vaule: any) => {
              pushOkrContentFn(vaule, listData)
            },
          }}
        />
      )}
      {/* 任务延迟列表弹窗 */}
      {delayModal && (
        <TaskDelayModal
          param={{
            masterTask: { name: $intl.get('targetTask'), planId: listData.id, id: listData.typeId },
            visible: delayModal,
            action: {
              close: (state: any) => {
                setDelayModal(state)
              },
              openTaskDetail: (obj: any) => {
                toTaskDetail(obj)
              },
            },
          }}
        />
      )}
      {/* 任务详情 */}
      {opentaskdetail.visible && (
        <DetailModal
          param={{
            visible: opentaskdetail.visible,
            from: 'work-plan', //来源
            id: opentaskdetail.id,
            taskData: opentaskdetail.taskData,
          }}
          setvisible={(state: any) => {
            setTaskdetail({ ...opentaskdetail, visible: state })
            if (opentaskdetail.editData) {
              props.refreshTask(1, '')
            }
          }}
          callbackFn={() => {
            opentaskdetail.editData = true
            setTaskdetail({ ...opentaskdetail })
          }}
        />
      )}
    </>
  )
}
export default GetSingleData
