import React, { useEffect, useState, useRef, useLayoutEffect } from 'react'
import { Menu, message, Modal, Radio } from 'antd'
import { getDistribute, cancelDistributePlan, deleteNodes } from '../../workplan/addplanfu'
import { spotMarkKR } from '../getfourData'
import { AssignTaskModal, TransferTaskModal } from '@/src/views/task/taskOptCom/taskOptCom'
import MovePlan from '../../work-plan-mind/movePlan'
import CreatTask from '../../task/creatTask/creatTask'
import Okrdetail from '../../work-plan-mind/okrdetail'
import Editor from '@/src/components/editor/index'
import { ShareToRoomModal } from '../../workplan/WorkPlanModal'
import { DelPlanModal } from '../../workplan/WorkPlanModal'
import DetailModal from '@/src/views/task/taskDetails/detailModal'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import { SelectMemberOrg } from '../../../components/select-member-org/index'
import { editOKRtask, affiliationApi } from '../../work-plan-mind/getData'
import {
  execute,
  finishTask,
  unFinish,
  TaskFileSave,
  FrozenTask,
  circulationFrozenTask,
  queryAlreadyfollowUser,
  savefollowUser,
  taskUrg,
  taskReplay,
} from '../../workdesk/component/taskOptData'
import TextArea from 'antd/lib/input/TextArea'
import { CreateTaskModal } from '../../task/creatTask/createTaskModal'
interface CodeItem {
  code: number
  status: number
  name: string
  isUse: number
}
interface DataItemProps {
  key: number
  taskName: globalInterface.WorkPlanTaskProps
  liableUser: { name: string; profile: string; type: number }
  progress: { percent: number; type: number; taskStatus: number; status: number; editProcess: boolean }
  subTaskCount: number
  mainId: string
  typeId: number
  handleBtn: globalInterface.WorkPlanTaskProps
  children: Array<DataItemProps>
  showInput: boolean
  KRprogress: boolean
}
interface NewItem {
  code: number
  status: number
  name: string
  isUse: number
  row: DataItemProps
}
interface DataProps {
  btnList: Array<NewItem>
  classData: any
}
const initStates = {
  btnList: [],
  classData: {},
}
// ????????????????????????
export let closeTaskDetails: any = null
const { SubMenu } = Menu
// const menuClick = (menuProp: any, item: any) => {
// }
// ????????????
//??????O??????????????????
let tasktypes = 0
const TaskMenu = (taskData: any) => {
  // const taskDetailObj: any = useContext(taskDetailContext)
  // const { refreshFn } = taskDetailObj
  const taskList = taskData || { taskinfo: {} }
  const nowcmyId = taskList.taskinfo.ascriptionId
  const nowcmyName = taskList.taskinfo.ascriptionName
  const { nowUserId, nowUser } = $store.getState()
  //??????????????????
  const [assignVisble, setAssignVisble] = useState(false)
  // ????????????????????????
  const [assignParam, setAssignParam] = useState<any>({})
  // ????????????
  const [transferVisble, setTransferVisble] = useState(false)
  const [transferParam, setTransferParam] = useState<any>({})
  const [listData, setTableData] = useState<DataProps>(initStates) //??????????????????????????????
  //OKR??????
  const [okrdetail, setokrDetail] = useState<any>()
  //??????????????????
  const [opencreattask, setOpencreattask] = useState(false)
  //????????????
  const [memberOrgShow, setMemberOrgShow] = useState(false)
  //????????????????????????
  const [selMemberOrg, setSelMemberOrg] = useState({})
  const fromPlanTotype = $store.getState().fromPlanTotype?.fromToType
  //????????????????????????
  const [opentaskdetail, setTaskdetail] = useState({
    visible: false,
    id: 0,
    taskData: {},
    editData: false,
    isaddtask: '',
    detailfrom: '',
  })
  const refComplete = useRef(null)
  //??????????????????
  const [replayVisble, setReplayVisble] = useState({
    nowVisble: false,
    deleteVisable: false,
    code: '',
    getData: {},
    isAll: 0,
  })
  //?????????????????????
  const [editorText, setEditorText] = useState<any>()
  //????????????
  const [taskinfo, setTaskinfo] = useState<any>()
  //?????????code
  const [taskcode, settaskcode] = useState<any>('')
  //??????Loading
  const [loading, setLoading] = useState(false)
  //?????????????????????
  const [urgVisble, setUrgVisble] = useState(false)
  //??????????????????
  const [urgParam, setUrgParam] = useState({
    urgeTeamName: '', // ??????????????????????????????
    urgeTaskName: '', // ????????????????????????
    urgeTaskId: 0, // ?????????????????????id
    urgeCookieName: '', // ???????????????cookie???????????????
  })
  //??????????????????
  const [moveplanshow, setMoveplanshow] = useState({
    type: false,
    id: 0,
    datas: {},
  })
  //????????????
  const [taskFileParams, setTaskFileParams] = useState({
    id: 0,
    name: '',
    ascriptionId: 0,
    ascriptionName: '',
    fromType: '',
    _level: 0,
  })
  //????????????
  const [frozenParam, setFrozenParam] = useState({
    id: 0,
    taskName: '',
    status: 0,
    attention: '',
    level: 0,
  })
  //??????
  const [iconGather, setIconGather] = useState([
    {
      name: 'face',
      number: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
      text: $intl.get('expression'),
      val: 0,
    },
    {
      name: 'direction',
      number: [1, 2, 3, 4, 5, 6, 7, 8],
      text: $intl.get('arrow'),
      val: 0,
    },
    {
      name: 'flag',
      number: [1, 2, 3, 4, 5, 6, 7, 8],
      text: $intl.get('flag'),
      val: 0,
    },
    {
      name: 'label',
      number: [1, 2, 3, 4],
      text: $intl.get('others'),
      val: 0,
    },
  ])
  //??????????????????
  const [icon, setIcon] = useState('')
  //????????????????????? (??????)
  let _resourceListInfo = []
  //????????????????????????????????????
  const [childLen, setChildLen] = useState(0)
  //????????????????????????
  const [shareToRoomParam, setShareToRoomParam] = useState<any>({})
  //????????????
  const [fileVisble, setFileVisble] = useState(false)
  //??????????????????
  const [frozenVisble, setFrozenVisble] = useState(false)
  //?????????????????????
  const [thawVisble, setThawVisble] = useState(false)
  //?????????????????????
  const [remarkValue, setRemarkValue] = useState('')
  //???????????????????????????
  const [taskName, setTaskName] = useState('')
  // ????????????????????????
  const createTaskRef = useRef<any>({})
  useEffect(() => {
    closeTaskDetails = () => {
      setTaskdetail({
        visible: false,
        id: 0,
        taskData: {},
        editData: false,
        isaddtask: '',
        detailfrom: '',
      })
    }
    return () => {
      closeTaskDetails = null
    }
  }, [])
  //loading
  useEffect(() => {
    if (taskList) {
      const contentData: CodeItem[] = taskList.btnList
      const newTableData: Array<NewItem> = []
      contentData.map((item: CodeItem) => {
        newTableData.push({
          code: item.code,
          status: item.status,
          name: item.name,
          isUse: item.isUse,
          row: taskList.classData.row,
        })
      })
      setTableData({
        btnList: newTableData,
        classData: taskList.classData,
      })
      setTaskinfo(taskList.classData.row.taskName)
    }
    showIcon(taskList)
    eliminate()
  }, [taskList])
  //??????????????????
  const eliminate = () => {
    setOpencreattask(false)
    setMemberOrgShow(false)
    setokrDetail(false)
  }
  // ???????????????o,KR????????????
  const solveDifferentItem = (listData: any, data: any, callBtn: any) => {
    let detailHtml: any
    const signHtml: any = []
    const distributeHtml: any = []
    const recallHtml: any = []
    const shareHtml: any = []
    const iconHtml: any = []
    let moveHtml: any
    const deleteHtml: any = []
    listData.map((item: CodeItem, index: number) => {
      if (item.name === 'DETAILS') {
        detailHtml = RigOptBtn(item, index, callBtn)
      } else if (
        item.name === 'SIGN_O' ||
        item.name === 'SIGN_KR' ||
        item.name === 'SIGN_SYNERGY' ||
        item.name === 'SIGN_CANCEL'
      ) {
        signHtml.push(item)
      } else if (item.name === 'DISTRIBUTE_SINGLE' || item.name === 'DISTRIBUTE_ALL') {
        distributeHtml.push(item)
      } else if (item.name === 'RECALL_SINGLE' || item.name === 'RECALL_ALL') {
        recallHtml.push(item)
      } else if (item.name === 'SHARE_PERSON' || item.name === 'SHARE_GROUP') {
        shareHtml.push(item)
      } else if (item.name === 'ICON') {
        iconHtml.push(item)
      } else if (item.name === 'MOVE') {
        moveHtml = RigOptBtn(item, index, callBtn)
      } else if (item.name === 'DELETE_SINGLE' || item.name === 'DELETE_ALL') {
        deleteHtml.push(item)
      }
    })
    return (
      <Menu style={data.sty} className="taskPlanMenu planListRightMenu">
        {detailHtml}
        <SubMenu
          title="??????"
          key="sub1"
          popupClassName="myDropMenu subMenu"
          icon={
            <img
              style={{ marginRight: 13, marginTop: -2 }}
              src={$tools.asAssetsPath('/images/workplan/OKR/dropdown-bj.png')}
            />
          }
        >
          {signHtml.map((item: CodeItem, index: number) => {
            return RigOptBtn(item, index, callBtn)
          })}
        </SubMenu>
        <SubMenu
          title={$intl.get('distributedFrom')}
          key="sub2"
          popupClassName="myDropMenu subMenu"
          icon={
            <img
              style={{ marginRight: 13, marginTop: -2 }}
              src={$tools.asAssetsPath('/images/workplan/OKR/dropdown-pf.png')}
            />
          }
        >
          {distributeHtml.map((item: CodeItem, index: number) => {
            return RigOptBtn(item, index, callBtn)
          })}
        </SubMenu>
        <SubMenu
          title={$intl.get('Recall')}
          key="sub3"
          popupClassName="myDropMenu subMenu"
          icon={<img style={{ marginRight: 27, marginTop: -2 }} src={''} />}
        >
          {recallHtml.map((item: CodeItem, index: number) => {
            return RigOptBtn(item, index, callBtn)
          })}
        </SubMenu>
        <Menu.Divider />
        {/* <SubMenu
          title="??????"
          key="sub4"
          popupClassName="myDropMenu subMenu"
          icon={<img style={{ marginRight: 27, marginTop: -2 }} src={''} />}
        >
          {shareHtml.map((item: CodeItem, index: number) => {
            return RigOptBtn(item, index, callBtn)
          })}
        </SubMenu>
        <Menu.Divider /> */}
        <SubMenu
          title={$intl.get('icon')}
          key="sub5"
          popupClassName="myDropMenu subMenu"
          icon={<img style={{ marginRight: 27, marginTop: -2 }} src={''} />}
        >
          {iconHtml.map((item: CodeItem, index: number) => {
            return RigOptBtn(item, index, callBtn)
          })}
        </SubMenu>
        {moveHtml}
        <Menu.Divider />
        <SubMenu
          title={$intl.get('delete')}
          key="sub6"
          popupClassName="myDropMenu subMenu"
          icon={<img style={{ marginRight: 27, marginTop: -2 }} src={''} />}
        >
          {deleteHtml.map((item: CodeItem, index: number) => {
            return RigOptBtn(item, index, callBtn)
          })}
        </SubMenu>
      </Menu>
    )
  }
  //??????????????????
  const showIcon = (taskList: any) => {
    const getData: any = taskList.classData.row.taskName
    if (getData.icon != '' && getData.icon) {
      const newArr = [...iconGather]
      newArr.map((item: any) => {
        if (getData.icon.includes(item.name)) {
          item.val = getData.icon.split('-')[1]
        }
      })
      setIcon(getData.icon)
      setIconGather(newArr)
    } else {
      const newArr = [...iconGather]
      newArr.map((item: any) => {
        item.val = 0
      })
      setIcon('')
      setIconGather(newArr)
    }
  }
  // ???????????????????????????
  const taskItemOpth = (listData: any, data: any, callBtn: any) => {
    let detailHtml: any
    let startHtml: any
    const distributeHtml: any = []
    const recallHtml: any = []
    let reportHtml: any
    const allHtml: any = []
    const shareHtml: any = []
    const iconHtml: any = []
    let settingHtml: any = []
    let moveHtml: any
    const deleteHtml: any = []
    listData.map((item: CodeItem, index: number) => {
      if (item.name === 'EXECUTE' && item.status != 0) {
        startHtml = RigOptBtn(item, index, callBtn)
      } else if (item.name === 'UPDATE' || item.name === 'DETAILS') {
        detailHtml = RigOptBtn(item, index, callBtn)
      } else if (item.name === 'DISTRIBUTE_SINGLE' || item.name === 'DISTRIBUTE_ALL') {
        distributeHtml.push(item)
      } else if (item.name === 'RECALL_SINGLE' || item.name === 'RECALL_ALL') {
        recallHtml.push(item)
      } else if (item.name === 'REPORT' && $('.work_plan_mind_content').length > 0) {
        reportHtml = RigOptBtn(item, index, callBtn)
      } else if (
        item.code == 5 ||
        item.code == 6 ||
        item.code == 8 ||
        item.code == 9 ||
        item.code == 10 ||
        item.code == 16 ||
        item.code == 17 ||
        item.code == 20
      ) {
        allHtml.push(item)
      } else if (item.name === 'SET_FOLLOWER') {
        settingHtml = RigOptBtn(item, index, callBtn)
      } else if (item.name === 'SHARE_PERSON' || item.name === 'SHARE_GROUP') {
        shareHtml.push(item)
      } else if (item.name === 'ICON') {
        iconHtml.push(item)
      } else if (item.name === 'MOVE') {
        moveHtml = RigOptBtn(item, index, callBtn)
      } else if (item.name === 'DELETE_SINGLE' || item.name === 'DELETE_ALL') {
        deleteHtml.push(item)
      }
    })
    return (
      <Menu style={data.sty} className="taskPlanMenu planListRightMenu" key="1">
        {detailHtml}
        <Menu.Divider />
        {startHtml}
        <SubMenu
          title={$intl.get('distributedFrom')}
          key="sub1"
          popupClassName="myDropMenu subMenu"
          icon={
            <img
              style={{ marginRight: 13, marginTop: -2 }}
              src={$tools.asAssetsPath('/images/workplan/OKR/dropdown-pf.png')}
            />
          }
        >
          {distributeHtml.map((item: CodeItem, index: number) => {
            return RigOptBtn(item, index, callBtn)
          })}
        </SubMenu>
        <SubMenu
          title={$intl.get('Recall')}
          key="sub2"
          popupClassName="myDropMenu subMenu"
          icon={<img style={{ marginRight: 27, marginTop: -2 }} src={''} />}
        >
          {recallHtml.map((item: CodeItem, index: number) => {
            return RigOptBtn(item, index, callBtn)
          })}
        </SubMenu>
        <Menu.Divider />
        {reportHtml}
        <SubMenu
          title={$intl.get('taskHandle')}
          key="sub3"
          popupClassName="myDropMenu subMenu"
          icon={
            <img
              style={{ marginRight: 13, marginTop: -2 }}
              src={$tools.asAssetsPath('/images/workplan/OKR/dropdown-rw.png')}
            />
          }
        >
          {allHtml.map((item: CodeItem, index: number) => {
            return RigOptBtn(item, index, callBtn)
          })}
        </SubMenu>
        {settingHtml}
        {/* <SubMenu
          title="??????"
          key="sub5"
          popupClassName="myDropMenu subMenu"
          icon={<img style={{ marginRight: 27, marginTop: -2 }} src={''} />}
        >
          {shareHtml.map((item: CodeItem, index: number) => {
            return RigOptBtn(item, index, callBtn)
          })}
        </SubMenu> */}
        <SubMenu
          title={$intl.get('icon')}
          key="sub7"
          popupClassName="myDropMenu subMenu"
          icon={<img style={{ marginRight: 27, marginTop: -2 }} src={''} />}
        >
          {iconHtml.map((item: CodeItem, index: number) => {
            return RigOptBtn(item, index, callBtn)
          })}
        </SubMenu>
        <Menu.Divider />
        {moveHtml}
        <SubMenu
          title={$intl.get('delete')}
          key="sub8"
          popupClassName="myDropMenu subMenu"
          icon={<img style={{ marginRight: 27, marginTop: -2 }} src={''} />}
        >
          {deleteHtml.map((item: CodeItem, index: number) => {
            return RigOptBtn(item, index, callBtn)
          })}
        </SubMenu>
      </Menu>
    )
  }
  //????????????????????????
  const getIcon = (btnStatus: any) => {
    if (btnStatus == 2) {
      return {
        title: $intl.get('oneClickFinish'),
        icon: $tools.asAssetsPath('/images/task/schtasks/finish-grey.png'),
      }
    } else if (btnStatus == 3) {
      return {
        title: $intl.get('toNotFinish'),
        icon: $tools.asAssetsPath('/images/task/schtasks/finish-green.png'),
      }
    } else if (btnStatus == 1) {
      return {
        title: $intl.get('startUp'),
        icon: $tools.asAssetsPath('/images/task/schtasks/start.png'),
      }
    }
  }
  // ??????????????????
  const RigOptBtn = (paramObj: any, num: number, callBtn: any) => {
    const getData: globalInterface.WorkPlanTaskProps = paramObj.row.taskName
    const gettaskData = taskList.taskinfo
    const mainId = taskList.mindId
    const index = paramObj.code
    switch (Number(paramObj.code)) {
      case 1:
        return (
          <Menu.Item
            key={index}
            className="opt_icon_div"
            disabled={paramObj.isUse ? false : true}
            onClick={() => {
              if (paramObj.status == 2) {
                //????????????
                finishTask(getData.typeId, getData.process).then(
                  () => {
                    message.success($intl.get('operateSuc'))
                    callBtn(paramObj.code, paramObj.status)
                  },
                  (data: any) => {
                    message.error(data.returnMessage)
                  }
                )
              } else if (paramObj.status == 3) {
                //????????????
                unFinish(getData.typeId).then(
                  () => {
                    message.success($intl.get('operateSuc'))
                    callBtn(paramObj.code, 3)
                  },
                  (data: any) => {
                    message.error(data.returnMessage)
                  }
                )
              } else {
                //??????
                execute(getData.typeId, 1).then(
                  () => {
                    message.success($intl.get('startTaskSuc'))
                    callBtn(paramObj.code, 1)
                  },
                  (data: any) => {
                    message.error(data.returnMessage)
                  }
                )
              }
            }}
          >
            <div className="myMenuItem" style={{ paddingLeft: '17px' }}>
              <img style={{ marginRight: 12, marginTop: -2 }} src={getIcon(paramObj.status)?.icon} />
              <span>{getIcon(paramObj.status)?.title}</span>
            </div>
          </Menu.Item>
        )
      case 2:
        // ??????
        return (
          <Menu.Item
            key={index}
            className="opt_icon_div"
            disabled={paramObj.isUse ? false : true}
            style={{ marginLeft: '13px' }}
            onClick={() => {
              // taskList.callbackFn(paramObj.code, getData)
              settaskcode(paramObj.code)
              //?????? --------------------
              openCreateTask({ createType: 'edit' })
            }}
          >
            <div className="myMenuItem">
              <span>{$intl.get('Edit')}</span>
            </div>
          </Menu.Item>
        )
      case 3:
        // ??????
        return (
          <Menu.Item
            key={index}
            className="opt_icon_div"
            disabled={paramObj.isUse ? false : true}
            onClick={() => {
              $store.dispatch({
                type: 'TASK_LIST_ROW',
                data: {
                  handleBtn: {
                    id: gettaskData.id,
                    ascriptionId: gettaskData.ascriptionId,
                    status: gettaskData.process == 100 ? 2 : 0,
                    executorUsername: '',
                    reportId: '',
                    type: 0,
                    time: Math.floor(Math.random() * Math.floor(1000)),
                  },
                  type: 0,
                },
              })
              $tools.createWindow('DailySummary')
              jQuery('.optBtnMoreList').hide()
            }}
          >
            <div className="myMenuItem">
              <span style={{ marginLeft: '42px' }}>{$intl.get('Report')}</span>
            </div>
          </Menu.Item>
        )
      case 5:
        // ??????
        return (
          <Menu.Item
            key={index}
            className="opt_icon_div"
            disabled={paramObj.isUse ? false : true}
            onClick={() => {
              setAssignParam({
                taskId: gettaskData.id,
                ascriptionId: gettaskData.ascriptionId,
                fromType: 'mind-map',
                callback: (data: any) => {
                  callBtn(paramObj.code, '')
                },
              })
              setAssignVisble(true)
              jQuery('.optBtnMoreList').hide()
            }}
          >
            <div className="myMenuItem">
              <span>{$intl.get('assign')}</span>
            </div>
          </Menu.Item>
        )
      case 6:
        // ??????
        return (
          <Menu.Item
            key={index}
            className="opt_icon_div"
            disabled={paramObj.isUse ? false : true}
            onClick={() => {
              setTransferVisble(true)
              setTransferParam({
                taskId: gettaskData.id,
                ascriptionType: gettaskData.ascriptionType,
                userName: gettaskData.username,
                userId: gettaskData.userId,
                ascriptionId: gettaskData.ascriptionId,
                ascriptionName: gettaskData.ascriptionName,
                fromType: 'taskDetail',
                callback: (value: any, useres: any) => {
                  callBtn(paramObj.code, useres)
                },
              })
            }}
          >
            <div className="myMenuItem">
              <span>{$intl.get('transfer')}</span>
            </div>
          </Menu.Item>
        )
      case 8:
        // ??????
        return (
          <Menu.Item
            key={index}
            className="opt_icon_div"
            disabled={paramObj.isUse ? false : true}
            onClick={() => {
              settaskcode(paramObj.code)
              replayVisble.nowVisble = true
              setReplayVisble({ ...replayVisble })
              jQuery('.optBtnMoreList').hide()
            }}
          >
            <div className="myMenuItem">
              <span>{$intl.get('replay')}</span>
            </div>
          </Menu.Item>
        )
      case 9:
        // ??????
        return (
          <Menu.Item
            key={index}
            className="opt_icon_div"
            disabled={paramObj.isUse ? false : true}
            onClick={() => {
              settaskcode(paramObj.code)
              taskFile(
                gettaskData.id,
                gettaskData.name,
                gettaskData.ascriptionId,
                nowcmyId,
                'mind-map',
                '',
                paramObj.code
              )
              jQuery('.optBtnMoreList').hide()
            }}
          >
            <div className="myMenuItem">
              <span>{$intl.get('placeOnFile')}</span>
            </div>
          </Menu.Item>
        )
      case 10:
        let btnTxts = $intl.get('freezeing')
        let flags = 0
        if (paramObj.status == 2) {
          btnTxts = $intl.get('unfreeze')
          flags = 1
        }
        // ??????
        return (
          <Menu.Item
            key={index}
            className="opt_icon_div"
            disabled={paramObj.isUse ? false : true}
            onClick={() => {
              settaskcode(paramObj.code)
              frozenThaw(gettaskData.id, gettaskData.name, flags, 'mind-map', gettaskData.level)
              jQuery('.optBtnMoreList').hide()
            }}
          >
            <div className="myMenuItem">
              <span>{btnTxts}</span>
            </div>
          </Menu.Item>
        )
      case 11:
        // ??????
        return (
          <Menu.Item key={index} className="opt_icon_div" disabled={paramObj.isUse ? false : true}>
            <div className="myMenuItem">
              <span>{$intl.get('copy')}</span>
            </div>
          </Menu.Item>
        )
      case 13:
        // ????????????
        return (
          <Menu.Item key={index} className="opt_icon_div" disabled={paramObj.isUse ? false : true}>
            <div className="myMenuItem">
              <span>????????????</span>
            </div>
          </Menu.Item>
        )
      case 12:
        // ????????????
        return (
          <Menu.Item key={index} className="opt_icon_div" disabled={paramObj.isUse ? false : true}>
            <div className="myMenuItem">
              <span>{$intl.get('kickOffMeeting')}</span>
            </div>
          </Menu.Item>
        )
      case 16:
        // ??????
        return (
          <Menu.Item key={index} className="opt_icon_div" disabled={paramObj.isUse ? false : true}>
            <div className="myMenuItem">
              <span>{$intl.get('Affair')}</span>
            </div>
          </Menu.Item>
        )
      case 17:
        // ??????
        return (
          <Menu.Item
            key={index}
            className="opt_icon_div"
            disabled={paramObj.isUse ? false : true}
            onClick={() => {
              settaskcode(paramObj.code)
              showUrgeModal(gettaskData.name, gettaskData.id, nowcmyId)
              jQuery('.optBtnMoreList').hide()
            }}
          >
            <div className="myMenuItem">
              <span>{$intl.get('urging')}</span>
            </div>
          </Menu.Item>
        )
      case 19:
        // ??????
        return (
          <Menu.Item key={index} className="opt_icon_div" disabled={paramObj.isUse ? false : true}>
            <div className="myMenuItem">
              <span>{$intl.get('delete')}</span>
            </div>
          </Menu.Item>
        )
      // case 20:
      //   // ??????
      //   return (
      //     <Menu.Item
      //       key={index}
      //       className="opt_icon_div"
      //       disabled={paramObj.isUse ? false : true}
      //       onClick={() => {
      //         $store.dispatch({
      //           type: 'WORKPLAN_MODAL',
      //           data: {
      //             sourceItem: gettaskData || {},
      //             shareFormType: 'workPlan',
      //           },
      //         })
      //         setShareToRoomParam({
      //           shareToRoomModalShow: true,
      //           titName: $intl.get('shareTask'),
      //           onOk: () => {
      //             message.success($intl.get('shareSuccess'))
      //           },
      //         })
      //         jQuery('.optBtnMoreList').hide()
      //       }}
      //     >
      //       <div className="myMenuItem">
      //         <span>{$intl.get('share')}</span>
      //       </div>
      //     </Menu.Item>
      //   )
      case 23:
        // ???????????????
        return (
          <Menu.Item
            key={index}
            className="opt_icon_div"
            disabled={paramObj.isUse ? false : true}
            onClick={() => {
              taskFollower(gettaskData.id, gettaskData.ascriptionId, 'mind-map', paramObj.code)
              jQuery('.optBtnMoreList').hide()
            }}
          >
            <div className="myMenuItem" style={{ paddingLeft: '41px' }}>
              <span>{$intl.get('setFocus')}</span>
            </div>
          </Menu.Item>
        )
      case 100: //??????
        return (
          <Menu.Item
            key={index}
            className="opt_icon_div "
            disabled={paramObj.isUse ? false : true}
            onClick={() => {
              // taskList.callbackFn(paramObj.code, getData)
              settaskcode(paramObj.code)
              opentaskdetail.isaddtask = ''
              opentaskdetail.detailfrom = ''
              //?????? --------------------
              if (getData.type == 2 || getData.type == 3) {
                //okr??????????????????????????????
                setokrDetail(true)
              } else {
                // ????????????
                if (getData.status == 1 && taskList.okrAuth) {
                  //????????????
                  openCreateTask({ createType: 'edit' })
                } else {
                  //????????????
                  opentaskdetail.visible = true
                  opentaskdetail.id = gettaskData.id
                  if (getData.status == 1 && !taskList.okrAuth) {
                    opentaskdetail.isaddtask = 'okr_draft'
                  }
                  opentaskdetail.taskData = {
                    id: gettaskData.id,
                    name: gettaskData.name,
                    ascriptionType: gettaskData.ascriptionType,
                    ascriptionId: gettaskData.ascriptionId,
                    ascriptionName: gettaskData.ascriptionName,
                    status: gettaskData.status,
                    flag: gettaskData.flag,
                    approvalStatus: gettaskData.approvalStatus,
                  }
                  opentaskdetail.editData = false
                  setTaskdetail({ ...opentaskdetail })
                }
              }
              jQuery('.optBtnMoreList').hide()
            }}
          >
            <div className="myMenuItem" style={{ paddingLeft: '17px' }}>
              <img
                style={{ marginRight: 11, marginTop: -2 }}
                src={$tools.asAssetsPath('/images/workplan/OKR/dropdown-xq.png')}
              />
              <span>{$intl.get('details')}</span>
            </div>
          </Menu.Item>
        )
      case 101:
        return (
          <Menu.Item
            key={index}
            className="opt_icon_div"
            disabled={paramObj.isUse ? false : true}
            onClick={() => {
              const data = {
                id: getData.id,
                parentId: taskList.parentId,
                mainId: mainId,
                type: 2,
                toTaskType: undefined,
                teamId: nowcmyId,
              }

              spotMarkKR(data).then((resData: any) => {
                if (resData.returnCode == 0) {
                  callBtn(paramObj.code, resData)
                } else {
                  jQuery('.optBtnMoreList').hide()
                }
              })
            }}
          >
            <div className="myMenuItem">
              <span>{$intl.get('markO')}</span>
            </div>
          </Menu.Item>
        )
      case 102:
        return (
          <Menu.Item
            key={index}
            className="opt_icon_div"
            disabled={paramObj.isUse ? false : true}
            onClick={() => {
              const data = {
                id: getData.id,
                parentId: taskList.parentId,
                mainId: mainId,
                type: 3,
                toTaskType: undefined,
                teamId: nowcmyId,
              }

              spotMarkKR(data).then((resData: any) => {
                if (resData.returnCode == 0) {
                  callBtn(paramObj.code, resData)
                } else {
                  jQuery('.optBtnMoreList').hide()
                }
              })
            }}
          >
            <div className="myMenuItem">
              <span>{$intl.get('markKR')}</span>
            </div>
          </Menu.Item>
        )
      case 103:
        return (
          <Menu.Item
            key={index}
            className="opt_icon_div"
            disabled={paramObj.isUse ? false : true}
            onClick={() => {
              if (!getData.nodeText) {
                setaffiliation(getData, mainId, paramObj.code, callBtn)
              } else {
                const data = {
                  id: getData.id,
                  parentId: taskList.parentId,
                  mainId: mainId,
                  type: 4,
                  toTaskType: undefined,
                  teamId: nowcmyId,
                }

                spotMarkKR(data).then((resData: any) => {
                  if (resData.returnCode == 0) {
                    callBtn(paramObj.code, resData)
                  } else {
                    jQuery('.optBtnMoreList').hide()
                  }
                })
              }
            }}
          >
            <div className="myMenuItem">
              <span>{$intl.get('markCollaborative')}</span>
            </div>
          </Menu.Item>
        )

      case 104:
        return (
          <Menu.Item
            key={index}
            className="opt_icon_div"
            disabled={paramObj.isUse ? false : true}
            onClick={() => {
              const data: any = {
                id: getData.id,
                parentId: taskList.parentId,
                mainId: mainId,
                type: 1,
                toTaskType: undefined,
                teamId: nowcmyId,
              }

              spotMarkKR(data).then((resData: any) => {
                if (resData.returnCode === 0) {
                  callBtn(paramObj.code, getData.typeId)
                } else {
                  if (resData.returnCode == 30095) {
                    //??????OKR?????????????????????????????????
                    tasktypes = 0
                    Modal.confirm({
                      title: $intl.get('operateTip'),
                      icon: <ExclamationCircleOutlined />,
                      content: (
                        <div>
                          <p>{$intl.get('cancelMarkSureTip')}</p>
                          <Radio.Group
                            key={1}
                            onChange={(value: any) => {
                              tasktypes = value.target.value
                            }}
                            defaultValue={0}
                          >
                            <Radio value={1}>{$intl.get('temporaryTask')}</Radio>
                            <Radio value={0}>{$intl.get('targetTask')}</Radio>
                            <Radio value={3}>{$intl.get('projectTask')}</Radio>
                            <Radio value={2}>{$intl.get('functionTask')}</Radio>
                          </Radio.Group>
                        </div>
                      ),
                      okText: $intl.get('sure'),
                      cancelText: $intl.get('cancel'),
                      onOk() {
                        data.toTaskType = tasktypes
                        data.teamId = nowcmyId

                        spotMarkKR(data).then((resData: any) => {
                          callBtn(paramObj.code, getData.typeId)
                        })
                      },
                    })
                  }
                  jQuery('.optBtnMoreList').hide()
                }
              })
            }}
          >
            <div className="myMenuItem">
              <span>{$intl.get('cancelMark')}</span>
            </div>
          </Menu.Item>
        )

      case 105:
        return (
          <Menu.Item
            key={index}
            className="opt_icon_div"
            disabled={paramObj.isUse ? false : true}
            onClick={() => {
              getDistribute({
                mainId: mainId, //?????????id
                operateUser: $store.getState().nowUserId, //?????????Id
                operateAccount: $store.getState().nowAccount, //???????????????
                teamId: nowcmyId,
                teamName: nowcmyName,
                typeIds: [getData.typeId], //??????????????????
                isWhole: 0, //1???????????? 0????????????
              }).then((resData: any) => {
                if (resData.returnCode === 0) {
                  callBtn(paramObj.code, resData)
                }
              })
            }}
          >
            <div className="myMenuItem">
              <span>{$intl.get('distributeItem')}</span>
            </div>
          </Menu.Item>
        )
      case 106:
        return (
          <Menu.Item
            key={index}
            className="opt_icon_div"
            disabled={paramObj.isUse ? false : true}
            onClick={() => {
              getDistribute({
                mainId: mainId, //?????????id
                operateUser: $store.getState().nowUserId, //?????????Id
                operateAccount: $store.getState().nowAccount, //???????????????
                teamId: nowcmyId,
                teamName: nowcmyName,
                typeIds: [getData.typeId], //??????????????????
                isWhole: 1, //1???????????? 0????????????
              }).then((resData: any) => {
                if (resData.returnCode === 0) {
                  callBtn(paramObj.code, resData)
                }
              })
            }}
          >
            <div className="myMenuItem">
              <span>{$intl.get('distributeChainTask')}</span>
            </div>
          </Menu.Item>
        )

      case 107:
        return (
          <Menu.Item
            key={index}
            className="opt_icon_div"
            disabled={paramObj.isUse ? false : true}
            onClick={() => {
              cancelDistributePlan({
                mainId: mainId, //?????????id
                operateUser: $store.getState().nowUserId, //?????????Id
                operateAccount: $store.getState().nowAccount, //???????????????
                teamId: nowcmyId,
                teamName: nowcmyName,
                typeIds: [getData.typeId], //??????????????????
                typeId: getData.typeId,
              }).then((resData: any) => {
                if (resData.returnCode === 0) {
                  callBtn(paramObj.code, resData)
                }
              })
            }}
          >
            <div className="myMenuItem">
              <span>{$intl.get('withdrawSingleDis')}</span>
            </div>
          </Menu.Item>
        )

      case 108:
        return (
          <Menu.Item
            key={index}
            className="opt_icon_div"
            disabled={paramObj.isUse ? false : true}
            onClick={() => {
              cancelDistributePlan({
                mainId: mainId, //?????????id
                id: getData.id,
                typeId: getData.typeId,
                operateUser: $store.getState().nowUserId, //?????????Id
                operateAccount: $store.getState().nowAccount, //???????????????
                teamId: nowcmyId,
                teamName: nowcmyName,
              }).then((resData: any) => {
                if (resData.returnCode === 0) {
                  callBtn(paramObj.code, resData)
                }
              })
            }}
          >
            <div className="myMenuItem">
              <span>{$intl.get('withdrawChainDis')}</span>
            </div>
          </Menu.Item>
        )
      case 110:
        return (
          <Menu.Item
            key={index}
            className="opt_icon_div"
            disabled={paramObj.isUse ? false : true}
            onClick={() => {
              $store.dispatch({
                type: 'WORKPLAN_MODAL',
                data: {
                  sourceItem: {
                    id: getData.id, //??????id
                    name: getData.name,
                    mainId: mainId,
                    typeId: getData.typeId,
                    teamId: nowcmyId,
                    teamName: nowcmyName,
                  },
                },
              })
              callBtn(paramObj.code, nowcmyId)
              // ??????????????????
            }}
          >
            <div className="myMenuItem">
              <span>{$intl.get('shareToUser')}</span>
            </div>
          </Menu.Item>
        )

      case 111:
        return (
          <Menu.Item
            key={index}
            className="opt_icon_div"
            disabled={paramObj.isUse ? false : true}
            onClick={() => {
              $store.dispatch({
                type: 'WORKPLAN_MODAL',
                data: {
                  sourceItem: {
                    id: getData.id, //??????id
                    name: getData.name,
                    mainId: mainId,
                    typeId: getData.typeId,
                    teamId: nowcmyId,
                    teamName: nowcmyName,
                  },
                  shareFormType: 'workPlan',
                },
              })
              setShareToRoomParam({
                shareToRoomModalShow: true,
                titName: $intl.get('sharedTasks'),
                onOk: () => {
                  message.success($intl.get('sharedSuc'))
                },
              })
              jQuery('.optBtnMoreList').hide()
            }}
          >
            <div className="myMenuItem">
              <span>{$intl.get('shareToGroup')}</span>
            </div>
          </Menu.Item>
        )
      case 112:
        return (
          <div key={index} className={`opt_icon_div ${paramObj.isUse ? '' : 'opt_disabled'}`}>
            <div
              className={`task_sign_icon_no ${icon == '' ? 'active' : ''}`}
              onClick={() => {
                const newArr = [...iconGather]
                newArr.map((item: any) => {
                  item.val = 0
                })
                setIconGather(newArr)
                setIcon('')
                selTaskSign('', getData.id, getData.typeId, taskList.mindId, taskList.parentId, paramObj.code)
              }}
            >
              {$intl.get('noWu')}
            </div>
            <ul className="taskSignIcons">
              {iconGather.map((item: any, index: number) => {
                return (
                  <li key={index}>
                    <p className="sign_icon_tit">{item.text}</p>
                    {item.number.map((items: any, indexs: number) => {
                      const bgUrl: any = $tools.asAssetsPath(`/images/task/${item.name}-${items}.png`)
                      return (
                        <i
                          key={indexs}
                          className={`${item.name}-${items} img_icon sign_icon_item ${
                            item.val > 0 && item.val == items ? 'active' : ''
                          }`}
                          onClick={() => {
                            selTaskSign(
                              `${item.name}-${items}`,
                              getData.id,
                              getData.typeId,
                              taskList.mindId,
                              taskList.parentId,
                              paramObj.code
                            )
                          }}
                          data-imgname={`${item.name}-${items + 1}`}
                        >
                          <img
                            src={bgUrl}
                            style={{
                              width: '100%',
                            }}
                          />
                        </i>
                      )
                    })}
                  </li>
                )
              })}
            </ul>
          </div>
        )
      case 113:
        return (
          <Menu.Item
            key={index}
            className="opt_icon_div"
            disabled={paramObj.isUse ? false : true}
            onClick={() => {
              settaskcode(paramObj.code)
              setMoveplanshow({
                type: true,
                id: getData.id,
                datas: {
                  fromCode: 0,
                  fromId: getData.id, //??????id
                  findId: getData.id,
                  fromName: getData.name,
                  fromTypeId: getData.typeId,
                  fromMainId: mainId,
                  teamId: nowcmyId,
                  teamName: nowcmyName,
                  genreStatus: getData.taskType,
                },
              })
              jQuery('.optBtnMoreList').hide()
            }}
          >
            <div className="myMenuItem">
              <span style={{ marginLeft: '42px' }}>{$intl.get('movePlan')}</span>
            </div>
          </Menu.Item>
        )
      //????????????
      case 114:
        return (
          <Menu.Item
            key={index}
            className="opt_icon_div"
            disabled={paramObj.isUse ? false : true}
            onClick={() => {
              const ifokrKanban = taskList.from == 'okrKanban' ? true : false
              const param = {
                id: getData.id, //????????????
                typeId: getData.typeId, //??????id
                mainId: mainId, //?????????id
                mainTypeId: ifokrKanban ? taskList.mindTypeId : taskList.taskinfo.id, //?????????typeid
                name: getData.name,
                operateUser: $store.getState().nowUserId, //?????????
                isDel: getData.type === 2 ? '1' : undefined, //????????????O?????????????????????
                firstId: taskList.parentId, //??????????????????ID
                isAll: 0,
              }
              if (getData.taskFlag != 2 || getData.type == 2 || getData.type == 3) {
                //??????????????????????????????????????? ???????????????????????????
                replayVisble.deleteVisable = true
                replayVisble.code = paramObj.code
                replayVisble.isAll = 0
                setReplayVisble({ ...replayVisble })
                jQuery('.optBtnMoreList').hide()
              } else {
                deleteNodes(param).then((resData: any) => {
                  if (resData.returnCode === 0) {
                    callBtn(paramObj.code, resData)
                  }
                })
              }
            }}
          >
            <div className="myMenuItem">
              <span>{$intl.get('delItem')}</span>
            </div>
          </Menu.Item>
        )
      //???????????????
      case 115:
        return (
          <Menu.Item
            key={index}
            className="opt_icon_div"
            disabled={paramObj.isUse ? false : true}
            onClick={() => {
              replayVisble.deleteVisable = true
              replayVisble.isAll = 1
              replayVisble.code = paramObj.code
              setReplayVisble({ ...replayVisble })
              jQuery('.optBtnMoreList').hide()
            }}
          >
            <div className="myMenuItem">
              <span>{$intl.get('delChain')}</span>
            </div>
          </Menu.Item>
        )
    }
  }
  //?????????????????????????????????????????????????????????
  const setaffiliation = (getData: any, mainId: any, code: any, callBtn: any) => {
    //?????????????????????????????????
    //??????????????????
    setSelMemberOrg({
      teamId: nowcmyId,
      selectList: [], //????????????????????????
      allowTeamId: [nowcmyId],
      checkboxType: 'radio',
      isDel: false, //?????????????????? true????????????
      permissionType: 3, //?????????????????????????????????
      checkableType: [0, 2, 3], //?????? ?????? ??????????????????
      onSure: (dataList: any) => {
        const getUser = dataList[0] || []
        if (getUser.length == 0) {
          jQuery('.optBtnMoreList').hide()
          return
        }
        const param = {
          id: getData.typeId, //??????id
          ascriptionId: getUser.curId, //??????Id
          ascriptionType: getUser.curType, //????????????0??????2?????? 3??????
          deptId: getUser.deptId, //??????Id
          roleId: getUser.roleId, //??????Id
          userId: getUser.userId || getUser.curId, //??????Id
          account: getUser.account, //??????
          operateUser: nowUserId,
          operateUserName: nowUser,
        }
        const url = '/task/transFer/workPlanTransferTask'
        affiliationApi(param, url).then((resData: any) => {
          const data = {
            id: getData.id,
            parentId: taskList.parentId,
            mainId: mainId,
            type: 4,
            toTaskType: undefined,
            teamId: nowcmyId,
          }

          spotMarkKR(data).then((resData: any) => {
            if (resData.returnCode == 0) {
              callBtn(code, {
                ...param,
                profile: getUser.profile,
                liableUserName: getUser.curName,
                roleName: getUser.curType == 0 ? getUser.roleName : getUser.curName,
              })
            } else {
              jQuery('.optBtnMoreList').hide()
            }
          })
        })
      },
    })
    setMemberOrgShow(true)
  }
  //dom????????????
  useLayoutEffect(() => {
    if (fromPlanTotype == 1) {
      // setTaskinfo(taskList.classData.row.taskName)
      return
    }
    let newpageY = listData.classData.pageY
    if (listData.classData.pageY > document.body.clientHeight / 3 + 50) {
      const dom: any = jQuery('.planListRightMenu')
      newpageY = listData.classData.pageY - dom.height()
      jQuery('.optBtnMoreList ul').css({ top: `${newpageY}px` })
    }
    // setTaskinfo(taskList.classData.row.taskName)
  }, [listData.classData.pageX])
  const tmpStyle: any = {
    position: 'fixed',
    left: `${listData.classData.pageX}px`,
    top: `${listData.classData.pageY}px`,
    display: 'block',
  }
  //??????????????????
  const editorChange = (html: string) => {
    setEditorText(html)
  }
  //????????????
  const selTaskSign = (name: any, id: any, typeId: any, mindId: any, parentId: any, code: any) => {
    const param = {
      id: id, //????????????
      parentId: parentId, //????????????id
      mainId: mindId, //?????????id
      typeId: typeId, //??????id
      operateUser: nowUserId, //?????????
      icon: name, //??????
    }
    editOKRtask(param).then((resdata: any) => {
      taskList.openMode(code, name)
    })
  }
  //??????
  const replaySure = () => {
    taskReplay({
      liableUser: nowUserId,
      liableUsername: nowUser,
      content: editorText,
      taskId: taskinfo.typeId,
    }).then((data: any) => {
      replayVisble.nowVisble = false
      setReplayVisble({ ...replayVisble })
      if (data.returnCode == 0) {
        taskList.openMode(taskcode, '')
        message.success($intl.get('addedSuc'))
      } else {
        message.error(data.returnMessage)
      }
    })
  }
  //==================??????START===================================
  const showUrgeModal = (taskName: string, taskId: number, teamName: string) => {
    setUrgParam({
      urgeTeamName: teamName,
      urgeTaskName: taskName,
      urgeTaskId: taskId,
      urgeCookieName: 'urge' + taskId,
    })
    //???????????????????????????
    setUrgVisble(true)
  }

  const urgConfrim = () => {
    setUrgVisble(false)
    setLoading(true)
    const { urgeTaskId, urgeTeamName, urgeTaskName } = urgParam
    taskUrg({
      taskId: urgeTaskId, //??????id
      orgName: urgeTeamName, //?????????????????????
      userId: nowUserId, //?????????id
      userName: nowUser, //???????????????
      taskName: urgeTaskName, //?????????
    }).then(
      (data: any) => {
        setLoading(false)
        if (data.returnCode == 0) {
          message.success($intl.get('urgeSucAgain5'))
        } else {
          message.error(data.returnMessage)
        }
      },
      err => {
        setLoading(false)
        message.error(err.returnMessage)
      }
    )
  }
  //==================??????END===============================
  //==================????????????START=====================================
  const taskFile = (
    id: number,
    name: string,
    ascriptionId: number,
    ascriptionName: string,
    fromType: string,
    _level: any,
    code: number
  ) => {
    setTaskFileParams({
      id: id,
      name: name,
      ascriptionId: ascriptionId,
      ascriptionName: ascriptionName,
      fromType: fromType,
      _level: _level,
    })
    // setFromMsg(fromType)
    if (childLen > 0) {
      setFileVisble(true) //?????????????????????
    }
    taskFileSure(id, name, ascriptionId, ascriptionName, fromType, _level, code)
  }
  const fileTaskSure = () => {
    const { id, name, ascriptionId, ascriptionName, fromType, _level } = taskFileParams
    taskFileSure(id, name, ascriptionId, ascriptionName, fromType, _level, taskcode)
  }
  const taskFileSure = (
    id: number,
    name: string,
    ascriptionId: number,
    ascriptionName: string,
    fromType: string,
    _level: number,
    code: number
  ) => {
    TaskFileSave({
      taskId: id,
      userId: nowUserId,
      operateUser: nowUserId,
      operateUserName: nowUser,
    }).then((data: any) => {
      const dataInfo = data.data || ''
      taskList.openMode(code, '')
      if (data.returnCode == 0 && dataInfo != '') {
        _resourceListInfo = dataInfo.resourceModelList || []
        if (_resourceListInfo.length > 0) {
        } else if (dataInfo.approvalEventName != null) {
        } else {
          message.success($intl.get('archivingTaskSuced'))
          taskList.openMode(code, '')
        }
      } else {
        message.error(data.returnMessage)
      }
    })
  }
  //==================????????????OVER=====================================
  //==================????????????START=====================================
  const frozenThaw = (id: number, taskName: string, status: number, attention: string, level: number) => {
    //status 1???????????? 2??????
    if (status == 1) {
      setThawVisble(true) //????????????????????????
    } else {
      setFrozenVisble(true)
    }
    setTaskName(taskName)
    setFrozenParam({
      id: id,
      taskName: taskName,
      status: status,
      attention: attention,
      level: level,
    })
  }
  //?????? ??????
  const frozenConfrim = () => {
    setFrozenVisble(false)
    setThawVisble(false)
    const { id, status, attention } = frozenParam
    // const username = electron.remote.getGlobal('sharedObject').userName
    // let userId = electron.remote.getGlobal('sharedObject').userId
    const Attention: any = attention
    let operateCode = ''
    const operateEnum = {
      ????????????: 1,
      ????????????: 2,
      ????????????: 3,
      ????????????: 4,
      ????????????: 5,
    }
    for (const i in operateEnum) {
      if (attention.includes(i)) {
        operateCode = operateEnum[i]
      }
    }
    if (Attention != 4) {
      FrozenTask({
        operateUser: nowUserId,
        id: id,
        operateUserName: nowUser,
        type: 1,
        flag: status,
        reason: remarkValue ? remarkValue : '',
        operateCode: status == 0 ? operateCode : undefined, //????????????
      }).then((data: any) => {
        if (data.returnCode == 0) {
          // let querytAttentionTask = electron.remote.getGlobal('task').isFollow
          // test = querytAttentionTask != '' ? querytAttentionTask : 'task'
          message.success(status == 1 ? $intl.get('unfreeTaskSuced') : $intl.get('frozenTaskSuced'))
          taskList.openMode(taskcode, status == 1 ? 0 : 1)
          setRemarkValue('')
        } else {
          message.error(data.returnMessage)
        }
      })
    } else {
      //??????????????????
      circulationFrozenTask({
        userId: nowUserId,
        taskId: id,
        username: nowUser,
      }).then((data: any) => {
        if (data.returnCode == 0) {
          message.success($intl.get('frozenTaskSuced'))
          taskList.openMode(taskcode, '')
          // attentionTask.workflowTask('exchangeTask')  (????????????)
          // attentionTask.attentionTaskList()(????????????)
        } else {
          message.error(data.returnMessage)
        }
      })
    }
  }
  //==================????????????OVER====================================
  //==================?????????????????????START==============================
  const taskFollower = (taskid: number, ascriptionId: number, fromType: string, code: any) => {
    //?????????????????????
    const selList: any = []
    queryAlreadyfollowUser({
      taskId: taskid,
    }).then((data: any) => {
      const datas = data.dataList
      for (let i = 0; i < datas.length; i++) {
        selList.push({
          curId: datas[i].userId,
          curName: datas[i].username,
        })
      }
      //??????????????????
      setSelMemberOrg({
        teamId: ascriptionId,
        selectList: selList,
        allowTeamId: [ascriptionId],
        checkboxType: 'checkbox',
        onSure: (dataList: any) => {
          const getUser = dataList || []
          // ???????????????????????????
          // if (getUser.length == 0) {
          //   return
          // }
          const newUsers: any = []
          getUser.map((item: any) => {
            newUsers.push(item.userId)
          })
          //???????????????
          savefollowUser({
            taskId: taskid,
            userIds: newUsers,
          }).then((data: any) => {
            if (data.returnCode === 0) {
              message.success($intl.get('setFocusSuc'))
              taskList.openMode(code, '')
            } else {
              message.error(data.returnMessage)
            }
          })
        },
      })
      setMemberOrgShow(true)
    })
  }
  //==================?????????????????????END===============================
  /**
   * ??????????????????
   */
  const openCreateTask = (infoObj: any) => {
    const param = {
      visible: true,
      from: 'work-plan', //??????
      createType: infoObj.createType || 'add',
      id: taskinfo.typeId, //??????id
      nowType: 0, //0???????????? 2???????????? 3????????????
      taskType: 0,
      callbacks: (paramObj: any) => {
        taskList.openMode(taskcode, paramObj)
      },
    }
    createTaskRef.current && createTaskRef.current.setState(param)
  }
  return (
    <div className="optBtnMoreList" ref={refComplete}>
      {listData.btnList && listData.btnList.length > 17
        ? taskItemOpth(listData.btnList, { list: listData.classData.row, sty: tmpStyle }, taskList.openMode)
        : solveDifferentItem(
            listData.btnList,
            { list: listData.classData.row, sty: tmpStyle },
            taskList.openMode
          )}
      {/* ???????????? */}
      <DelPlanModal
        props={{
          param: {
            delPlanModalShow: replayVisble.deleteVisable,
          },
          action: {
            setDelPlanModalShow: (flag: any) => {
              replayVisble.deleteVisable = flag
              setReplayVisble({ ...replayVisble })
            },
          },
        }}
        refreshData={(data: any) => {
          if (data) {
            taskList.openMode(replayVisble.code, data.data)
          }
        }}
        dataItem={{
          id: taskinfo ? taskinfo.id : '',
          mainId: taskList.mindId,
          name: taskinfo ? taskinfo.name : '',
          typeId: taskinfo ? taskinfo.typeId : '',
          isDel: taskinfo && taskinfo.type === 2 ? '1' : undefined, //????????????O?????????????????????
          firstId: taskList.parentId, //??????????????????ID
          mainTypeId:
            taskList.from == 'okrKanban' ? taskList.mindTypeId : taskList.taskinfo ? taskList.taskinfo.id : '', //?????????typeid
          isAll: replayVisble.isAll,
          type: taskinfo ? taskinfo.type : '2',
          hasChild: taskinfo ? taskinfo.hasChild : 0,
        }}
      />
      {/* ?????????????????? */}
      <AssignTaskModal
        visible={assignVisble}
        setVisible={(flag: boolean) => {
          setAssignVisble(flag)
        }}
        param={assignParam}
      />
      {/* ?????????????????? */}
      <TransferTaskModal
        visible={transferVisble}
        setVisible={(flag: boolean) => {
          setTransferVisble(flag)
        }}
        param={transferParam}
      />
      {/* ???????????? */}
      {opencreattask && (
        <CreatTask
          param={{ visible: opencreattask }}
          datas={{
            from: 'work-plan', //??????
            isCreate: 1, //??????0 ??????1
            taskid: taskinfo.typeId, //??????id
            nowType: 0, //0???????????? 2???????????? 3????????????
            teaminfo: '', //????????????
            taskFlag: taskinfo.taskFlag, //2????????????
          }}
          setvisible={(state: any) => {
            setOpencreattask(state)
          }}
          callbacks={(code: any) => {
            taskList.openMode(taskcode, code)
          }}
        ></CreatTask>
      )}
      <CreateTaskModal ref={createTaskRef} />
      {/* okr?????? */}
      {okrdetail && (
        <Okrdetail
          visible={okrdetail}
          datas={taskinfo}
          mindId={taskList.mindId}
          oId={taskList.parentId}
          setvisible={(start: any) => {
            setokrDetail(start)
          }}
          openMode={(resData: any) => {
            taskList.openMode(taskcode, resData)
          }}
        ></Okrdetail>
      )}
      <Modal
        title={$intl.get('replay')}
        centered
        visible={replayVisble.nowVisble}
        maskClosable={false}
        okText={$intl.get('sure')}
        cancelText={$intl.get('cancel')}
        onOk={() => replaySure()}
        onCancel={() => {
          replayVisble.nowVisble = false
          setReplayVisble({ ...replayVisble })
        }}
        width={840}
        bodyStyle={{ padding: '20px', height: '500' }}
      >
        <div>
          <Editor
            editorContent={editorText}
            editorChange={editorChange}
            height={365}
            className="replayEditor"
            previewArea=".replayEditor"
            showText={true}
          />
        </div>
      </Modal>
      <Modal
        title={$intl.get('operateTip')}
        centered
        visible={urgVisble}
        maskClosable={false}
        okText={$intl.get('Save')}
        cancelText={$intl.get('cancel')}
        onOk={() => urgConfrim()}
        onCancel={() => setUrgVisble(false)}
        width={400}
        bodyStyle={{
          padding: '20px',
          height: '192px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div className="urgTip">
          <p>{$intl.get('sureUrgeTask')}</p>
        </div>
      </Modal>
      {/* ???????????? */}
      {moveplanshow.type && (
        <MovePlan
          type={moveplanshow.type}
          id={moveplanshow.id}
          datas={moveplanshow.datas}
          setType={(state: any) => {
            setMoveplanshow({
              type: state,
              id: moveplanshow.id,
              datas: moveplanshow.datas,
            })
          }}
          openMode={(resData: any) => {
            taskList.openMode(taskcode, resData)
          }}
        />
      )}
      {/* ?????????????????? */}
      <ShareToRoomModal
        props={{
          param: { ...shareToRoomParam },
          action: {
            setShareToRoomModalShow: (flag: boolean) => {
              setShareToRoomParam({ ...shareToRoomParam, shareToRoomModalShow: flag })
            },
          },
        }}
        isclcallback={false}
        isclcallbackFn={() => {}}
      />
      <Modal
        title={$intl.get('operateTip')}
        centered
        visible={fileVisble}
        maskClosable={false}
        okText={$intl.get('sure')}
        cancelText={$intl.get('cancel')}
        onOk={() => fileTaskSure()}
        onCancel={() => setFileVisble(false)}
        width={400}
        bodyStyle={{
          padding: '20px',
          height: '192px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div className="fileTip">
          <p className="title">{$intl.get('archiveTaskAndSubtasks')}</p>
          <p className="title_span">({$intl.get('curTaskAndSubtasksOperateCare', { childLen })})</p>
        </div>
      </Modal>
      <Modal
        title={$intl.get('operateTip')}
        centered
        visible={thawVisble}
        maskClosable={false}
        okText={$intl.get('sure')}
        cancelText={$intl.get('cancel')}
        onOk={() => frozenConfrim()}
        onCancel={() => setThawVisble(false)}
        width={400}
        bodyStyle={{
          padding: '20px',
          height: '192px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div className="thawTip" style={{ width: '100%' }}>
          <p>{$intl.get('clickUnfreezeTask', { taskName: taskinfo && taskinfo.name })}</p>
          <p>{$intl.get('unfreecarefuleOperate')}</p>
        </div>
      </Modal>
      <Modal
        title={<span className="module_title">{$intl.get('forzenTasks')}</span>}
        closeIcon={<img src={$tools.asAssetsPath('/images/common/closeTeam.png')} />}
        centered
        visible={frozenVisble}
        maskClosable={false}
        okText={$intl.get('sure')}
        cancelText={$intl.get('cancel')}
        onOk={() => frozenConfrim()}
        onCancel={() => setFrozenVisble(false)}
        width={400}
        bodyStyle={{
          padding: '20px',
          height: '242px',
        }}
      >
        <div className="frozenTip">
          {childLen > 0 && <p>{$intl.getHTML('hasSubtasksfreezOprateCare', { childLen })}</p>}
          <TextArea
            style={{ marginTop: '20px', height: '300px' }}
            autoSize={{ minRows: 8, maxRows: 8 }}
            maxLength={300}
            placeholder={$intl.get('inputFreezeExplainHere')}
            value={remarkValue}
            onChange={e => setRemarkValue(e.target.value)}
          />
        </div>
      </Modal>
      {/* ???????????? */}
      {opentaskdetail.visible && (
        <DetailModal
          param={{
            visible: opentaskdetail.visible,
            from: 'work-plan',
            code: 'table',
            id: opentaskdetail.id,
            taskData: opentaskdetail.taskData,
            isaddtask: opentaskdetail.isaddtask,
          }}
          setvisible={(state: any) => {
            opentaskdetail.visible = state
            setTaskdetail({ ...opentaskdetail })
            if (opentaskdetail.editData) {
              taskList.openMode(taskcode, opentaskdetail.detailfrom)
            }
          }}
          callbackFn={(data: any) => {
            opentaskdetail.editData = true
            opentaskdetail.detailfrom = data.types
            setTaskdetail({ ...opentaskdetail })
          }}
        ></DetailModal>
      )}
      {/* ?????????????????? */}
      {memberOrgShow && (
        <SelectMemberOrg
          param={{
            visible: memberOrgShow,
            ...selMemberOrg,
          }}
          action={{
            setModalShow: setMemberOrgShow,
          }}
        />
      )}
    </div>
  )
}
export default TaskMenu
