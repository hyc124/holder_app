import { useEffect, useState, useReducer } from 'react'
import React from 'react'
import { Avatar, Select, message, Modal } from 'antd'
import { Button, Checkbox } from 'antd'
import { SelectMemberOrg } from '../../../components/select-member-org/index'
import MeetAddRoomSelect from './MeetAddRoomSelect'
import MeetCancle from './MeetCancle'
import * as Maths from '@/src/common/js/math'
import './MeetDetails.less'
import './MeetAdd.less'
import { ipcRenderer } from 'electron'
import { resetParamPage } from './MettingFilter'
import { arrObjDuplicate } from '@/src/common/js/common'
import { findAllCompanyApi } from '../../task/creatTask/getData'
import { RenderUplodFile } from './RenderUplodFile'
const initStates = {
  teamId: '', //团队ID
  name: '', //会议名称
  subjects: [
    {
      topic: '',
      goal: '',
      users: [],
      userIds: [],
    },
  ], //议题集合
  joinUsers: [], //参会人员id
  meetingFiles: [], //附件集合
  meetingRoom: {}, //会议室ID
  startTime: '', //开始时间
  endTime: '', //结束时间
  taskId: '', //任务ID
  userId: '', //当前用户ID
  noticeType: [], //通知类型
  mettingSource: {
    sourceName: '',
    sourceType: 1,
    sourceId: '',
    associationType: 2,
  },
}

// state初始化initStates参数 action为dispatch传参
const reducer = (state: any, action: { type: any; data: any }) => {
  switch (action.type) {
    case 'teamId':
      return { ...state, teamId: action.data }
    case 'name':
      return { ...state, name: action.data }
    case 'subjects':
      return { ...state, subjects: action.data }
    case 'joinUsers':
      return { ...state, joinUsers: action.data }
    case 'meetingFiles':
      return { ...state, meetingFiles: action.data }
    case 'meetingRoom':
      return { ...state, meetingRoom: action.data }
    case 'startTime':
      return { ...state, startTime: action.data }
    case 'endTime':
      return { ...state, endTime: action.data }
    case 'taskId':
      return { ...state, taskId: action.data }
    case 'userId':
      return { ...state, userId: action.data }
    case 'noticeType':
      return { ...state, noticeType: action.data }
    case 'mettingSource':
      return { ...state, mettingSource: action.data }
    default:
      return state
  }
}
interface RoomSelectInfo {
  meetingRoomId: string //会议室ID
  meetingRoomName: string //会议室NAME
  meetingRoomImage: string //会议室图片
  startTime: string //会议开始时间
  endTime: string //会议结束时间
}

export interface FileModelsItemProps {
  id: number
  fileName: string
  fileKey: string
  fileSize: number
  dir: number
  fromType: null
  fromName: null
  uploadUser: string
  uploadDate: string
  custom: null
  collectType: number
  profile: string
  url: string
  uid: number
  name: string
  size: number
}
interface MeetmodalProps {
  datas: any
  onHideAdd: (value: boolean) => void
}
// 会议发起
const MeetAdd = (props: MeetmodalProps) => {
  const { datas, onHideAdd } = props
  const [setChecked, setCheckedStatus] = useState<any>([])
  const { nowAccount, nowUserId, nowUser, loginToken } = $store.getState()
  const [state, dispatch] = useReducer(reducer, initStates)
  //新版附件需要的参数
  const [uploadVisible, setUploadVisible] = useState<boolean>(false)
  const [loadTime, setLoadTime] = useState<any>('')
  const [pageUuid, setPageUuid] = useState('')
  //是否是修改
  const [isEdit, setIsEdit] = useState(false)
  // 提醒方式
  const [remindType, serRemindType] = useState<any>([])
  const [nowOrgId, setNowOrgId] = useState<number>(0)
  const [memberOrgShow, setMemberOrgShow] = useState(false)
  const [roomSelectInfo, setRoomSelectInfo] = useState<RoomSelectInfo>({
    meetingRoomId: '', //会议室ID
    meetingRoomName: '', //会议室NAME
    meetingRoomImage: '', //会议室图片
    startTime: '', //会议开始时间
    endTime: '', //会议结束时间
  })

  // 选人插件参数
  const initSelMemberOrg: any = {
    teamId: nowOrgId,
    sourceType: '', //操作类型
    allowTeamId: [nowOrgId],
    selectList: [], //选人插件已选成员
    checkboxType: 'checkbox',
    permissionType: 3, //组织架构通讯录范围控制
    showPrefix: false, //不显示部门岗位前缀
  }
  const [selMemberOrg, setSelMemberOrg] = useState(initSelMemberOrg)

  // 选择会议室弹窗
  const [selectRoom, setSelectRoom] = useState(false)

  // 详情数据
  const [detailsList, setEditDetailsList] = useState<any>([])
  // 取消会议弹窗
  const [meetCanclePop, setMeetCanclePop] = useState(false)
  // 参会成员
  const [joinMeetUser, setJoinMeetUser] = useState([])

  //新版附件状态自定义
  const [normalFiles, setNormalFiles] = useState<Array<any>>([])
  const [normalDefaultFiles, setNormalDefaultFiles] = useState<Array<any>>([])
  const [delFileIds, setDelFileIds] = useState<Array<any>>([])
  //防止发送按钮多次点击
  const [buttonVsible, setButtonVisble] = useState(false)

  // 保密附件查阅人员
  const [fileUser, setFileUser] = useState<any>({
    fileUsers: [],
    users: [],
  })

  const [secrecyUserModal, setSecrecyUserModal] = useState(false)
  const [secrecyUser, setSecrecyUser] = useState<any>([])
  //选中的项（保密附件查阅人员）
  const [selectSecrecyUser, setSelectSecrecyUser] = useState<any>([])

  const hintTypeCheckBox = [
    { label: '应用内提醒', value: '0' },
    { label: '短信/邮件提醒', value: '1' },
  ]
  useEffect(() => {
    setPageUuid(Maths.uuid())
    ipcRenderer.on('close-meet-modal', () => {
      onHideAdd(false)
      message.success('发起会议成功')
      $store.dispatch({ type: 'REFRESH_MEET_LIST', data: { refreshMeetList: true } })
    })
  }, [])

  useEffect(() => {
    if (datas.teamId) {
      setNowOrgId(datas.teamId)
      dispatch({
        type: 'teamId',
        data: datas.teamId,
      })
      initialReducerState()
    }
  }, [datas.teamId])

  useEffect(() => {
    if (datas.visibleMeetAdd && datas.openType === 'create') {
      setIsEdit(false)
      // 发起会议 查询企业
      initialReducerState()
      findAllCompanyApi({
        type: -1,
        userId: nowUserId,
        username: nowAccount,
      }).then((data: any) => {
        setNowOrgId(data[0].id)
        dispatch({
          type: 'teamId',
          data: data[0].id,
        })
      })
    } else if (datas.visibleMeetAdd && datas.openType === 'start') {
      setIsEdit(true)
      // 我发起的，编辑会议
      queryInfo().then((datas: any) => {
        dispatch({
          type: 'teamId',
          data: datas.teamId,
        })
        setDetailsList(datas)
        setEditDetailsList(datas)
        getType()
      })
    }
  }, [datas.visibleMeetAdd])

  //收到的会议详情
  const queryInfo = () => {
    return new Promise(resolve => {
      const param = {
        type: 1,
        userId: nowUserId,
        meetingId: datas.meetId,
      }
      $api
        .request('/public/meeting/info', param, {
          headers: { loginToken: loginToken },
          formData: true,
        })
        .then((resData: any) => {
          // 关闭加载动画
          resolve(resData.data)
        })
        .catch(() => {
          // console.log('/public/meeting/info:', param)
        })
    })
  }
  // 设置数据
  const setDetailsList = (datas: any) => {
    if (datas.files && datas.files.length > 0) {
      $tools.getUrlByKey(datas.files[0].fileKey, 'meetingRoomFile').then((url: string) => {
        setRoomSelectInfo({
          meetingRoomId: datas.meetingRoomId, //会议室ID
          meetingRoomName: datas.meetingRoomName, //会议室NAME
          meetingRoomImage: url, //会议室图片
          startTime: datas.startTime, //会议开始时间
          endTime: datas.endTime, //会议结束时间
        })
      })
    } else {
      setRoomSelectInfo({
        meetingRoomId: datas.meetingRoomId, //会议室ID
        meetingRoomName: datas.meetingRoomName, //会议室NAME
        meetingRoomImage: '', //会议室图片
        startTime: datas.startTime, //会议开始时间
        endTime: datas.endTime, //会议结束时间
      })
    }

    const newArr: any = []
    const newList: any = []
    const fileUsers = datas.fileUsers || []
    for (let i = 0; i < fileUsers.length; i++) {
      newArr.push({
        userId: Number(fileUsers[i].id),
        username: fileUsers[i].username,
        curType: 0,
        profile: fileUsers[i].profile,
      })
      newList.push(Number(fileUsers[i].id))
    }
    setFileUser({
      users: newArr,
      fileUsers: newList,
    })
    const $normalFile = datas.fileReturnModels.filter((item: any) => item.isPrivacy === 0) //正常附件
    setNormalDefaultFiles($normalFile)
    setNowOrgId(datas.teamId)
    dispatch({
      type: 'teamId',
      data: datas.teamId,
    })
    dispatch({
      type: 'name',
      data: datas.name,
    })
    if (datas.subjects.length > 0) {
      const newArr = datas.subjects.map((item: any) => {
        const userIds: any = []
        if (item.users.length > 0) {
          item.users.map((uitem: any) => {
            userIds.push(Number(uitem.userId))
          })
        }
        return {
          ...item,
          userIds: userIds,
        }
      })
      dispatch({
        type: 'subjects',
        data: newArr,
      })
    }

    setJoinMeetUser(datas.joinUsers)
    datas.joinUsers?.map((item: any) => {
      const _userArr = {
        userId: Number(item.userId),
        username: item.username,
        curType: 0,
        profile: item.profile,
      }
      return _userArr
    })

    dispatch({
      type: 'meetingFiles',
      data: datas.meetingFileModels,
    })
    dispatch({
      type: 'meetingRoom',
      data: datas.meetingRoomId,
    })
    dispatch({
      type: 'startTime',
      data: datas.startTime,
    })
    dispatch({
      type: 'endTime',
      data: datas.endTime,
    })
    dispatch({
      type: 'userId',
      data: datas.originatorId,
    })
  }
  // 查询提醒
  const getType = () => {
    const param = {
      userId: nowUserId,
    }
    $api
      .request('public/scheduleRemind/getAllEnumsSelect', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        serRemindType(resData.data.endTimeSelect)
      })
  }

  // 打开添加会议室弹窗
  const selectMeetRoom = () => {
    setSelectRoom(true)
  }
  // 会议室选择
  const visibleSelectRoom = (type: boolean, changeStatus: boolean, param: any) => {
    setSelectRoom(type)
    if (changeStatus) {
      setRoomSelectInfo(param)
      dispatch({
        type: 'meetingRoom',
        data: param.meetingRoomId,
      })
      dispatch({
        type: 'startTime',
        data: param.startTime,
      })
      dispatch({
        type: 'endTime',
        data: param.endTime,
      })
    }
  }

  // 删除会议室
  const delRoomInfo = () => {
    setRoomSelectInfo({
      meetingRoomId: '', //会议室ID
      meetingRoomName: '', //会议室NAME
      meetingRoomImage: '', //会议室图片
      startTime: '', //会议开始时间
      endTime: '', //会议结束时间
    })
    dispatch({
      type: 'meetingRoom',
      data: '',
    })
    dispatch({
      type: 'startTime',
      data: '',
    })
    dispatch({
      type: 'endTime',
      data: '',
    })
  }
  // 更改数据
  const changeSubNmae = (e: any, type: string, idx?: number) => {
    const _val = e.target.value
    if (type === 'name') {
      // 会议名称
      dispatch({
        type: 'name',
        data: _val,
      })
    }
    if (type === 'topic' || type === 'goal') {
      //会议议题
      const newArr = [...state.subjects]
      for (let i = 0; i < newArr.length; i++) {
        if (idx == i) {
          if (type === 'topic') {
            newArr[i].topic = _val
          }
          if (type === 'goal') {
            newArr[i].goal = _val
          }
          break
        }
      }
      dispatch({
        type: 'subjects',
        data: newArr,
      })
    }
  }

  // 新增议题
  const addConfrence = () => {
    if (state.subjects.length >= 5) {
      message.error('议题个数不能超过五个')
      return
    }
    const newArr = [...state.subjects]
    newArr.push({
      topic: '',
      goal: '',
      users: [],
      userIds: [],
    })
    dispatch({
      type: 'subjects',
      data: newArr,
    })
  }

  // 删除议题
  const delConfren = (idx: number) => {
    const newArr: any = [...state.subjects]
    //删除
    for (let i = 0; i < newArr.length; i++) {
      if (idx == i) {
        newArr.splice(i, 1)
        i--
        break
      }
    }

    dispatch({
      type: 'subjects',
      data: newArr,
    })

    isSecrecyIn(newArr, fileUser.users)
  }

  // 删除会议议题时，看私密附件查阅人员是否有包含已被删除的成员
  const isSecrecyIn = (newarr: any, arr: any) => {
    const _subjectsUser: { userId: any; username: any; curType: number; profile: any }[] = []
    if (newarr.length > 0) {
      newarr.map((item: any) => {
        if (item.users.length > 0) {
          item.users.map((uitem: any) => {
            _subjectsUser.push({
              userId: Number(uitem.userId),
              username: uitem.username,
              curType: 0,
              profile: uitem.profile,
            })
          })
        }
      })
    }

    const newData = arrObjDuplicate([..._subjectsUser, ...joinMeetUser], 'userId')

    const newFileUser: any = fileUser.users
    const newFileUserList: any = fileUser.fileUsers
    arr?.map((item: any) => {
      if (!isSecrecySelectUserIn(newData, item.userId)) {
        //如果有已选成员被删除，则从fileUsers里面删除
        for (let j = 0; j < newFileUser.length; j++) {
          if (Number(item.userId) == Number(newFileUser[j].userId)) {
            newFileUser.splice(j, 1)
            newFileUserList.splice(j, 1)

            j--
            break
          }
        }
      }
    })
    setFileUser({
      users: newFileUser,
      fileUsers: newFileUserList,
    })
  }

  const isSecrecySelectUserIn = (arr: any, uid: number) => {
    let _isType = false
    for (let i = 0; i < arr.length; i++) {
      if (Number(uid) === Number(arr[i].userId)) {
        _isType = true
        i--
        break
      }
    }
    return _isType
  }

  // 添加列席成员
  const setSubjectUser = (type: string, i: number) => {
    let selectList
    let newList: any
    if (type === 'subjectUser') {
      newList = [...state.subjects]
      selectList = newList[i].users
    } else if (type === 'checkUser') {
      selectList = fileUser.users
    }
    if (selectList.length > 0) {
      selectList = selectList.map((item: any) => {
        return {
          curId: Number(item.userId),
          curName: item.username,
          curType: 0,
          profile: item.profile,
        }
      })
    }

    setSelMemberOrg({
      ...selMemberOrg,
      selectList: selectList,
      teamId: nowOrgId,
      allowTeamId: [nowOrgId],
      onSure: (dataList: any) => {
        if (type === 'checkUser') {
          fileUser.fileUsers = dataList.map((item: any) => {
            return item.curId
          })
          fileUser.users = dataList.map((item: any) => {
            const _userArr = {
              userId: Number(item.curId),
              username: item.curName,
              curType: 0,
              profile: item.profile,
            }
            return _userArr
          })
        } else {
          newList[i].userIds = dataList.map((item: any) => {
            return Number(item.curId)
          })
          newList[i].users = dataList.map((item: any) => {
            const _userArr = {
              userId: Number(item.curId),
              username: item.curName,
              curType: 0,
              profile: item.profile,
            }
            return _userArr
          })
          dispatch({
            type: 'subjects',
            data: newList,
          })
        }
      },
    })
    setMemberOrgShow(true)
  }
  // 删除列席成员
  const delSubMember = (idx: number, uid: number) => {
    const newArr: any = [...state.subjects]
    //删除
    for (let i = 0; i < newArr[idx].userIds.length; i++) {
      if (Number(uid) === Number(newArr[idx].userIds[i])) {
        newArr[idx].userIds.splice(i, 1)
        newArr[idx].users.splice(i, 1)
        i--
        break
      }
    }
    dispatch({
      type: 'subjects',
      data: newArr,
    })
    if (!checkUserIn(Number(uid), 'subjects')) {
      delSelectSecrecyUser(Number(uid))
    }
  }

  // 联动删除(私密附件查阅成员)
  const delSelectSecrecyUser = (uid: number) => {
    const newArr = fileUser.users
    const newList = fileUser.fileUsers

    for (let i = 0; i < newArr.length; i++) {
      if (Number(uid) == Number(newArr[i].userId)) {
        newArr.splice(i, 1)
        newList.splice(i, 1)
        i--
        break
      }
    }
    setFileUser({
      users: newArr,
      fileUsers: newList,
    })
  }

  // 删除私密附件查阅成员（已选择）
  const secrecySelUser = (uid: number) => {
    const checkSel = selectSecrecyUser.filter((item: any) => {
      if (Number(item.userId) !== Number(uid)) {
        return item
      }
    })
    setSelectSecrecyUser(checkSel)
  }

  // 添加参会成员
  const selJoinUser = () => {
    let newArr: any = [...joinMeetUser]
    const setList: any = []
    newArr.map((item: any) => {
      setList.push({
        curId: Number(item.userId),
        curName: item.username,
        curType: 0,
        profile: item.profile,
      })
    })
    setSelMemberOrg({
      ...selMemberOrg,
      selectList: setList,
      teamId: nowOrgId,
      allowTeamId: [nowOrgId],
      onSure: (dataList: any) => {
        newArr = dataList.map((item: any) => {
          const _userArr = {
            userId: Number(item.curId),
            username: item.curName,
            curType: 0,
            profile: item.profile,
          }
          return _userArr
        })
        setJoinMeetUser(newArr)
      },
    })
    setMemberOrgShow(true)
  }

  // 删除参会成员
  const delJoinMember = (uid: number, type: string) => {
    let newArr: any = []
    let newList: any = []
    if (type === 'joinUsers') {
      newArr = [...joinMeetUser]
    } else if (type === 'checkUsers') {
      newArr = fileUser.users
      newList = fileUser.fileUsers
    }
    //删除
    for (let i = 0; i < newArr.length; i++) {
      if (Number(uid) == Number(newArr[i].userId)) {
        newArr.splice(i, 1)
        if (type === 'checkUsers') {
          newList.splice(i, 1)
        }
        i--
        break
      }
    }
    for (let i = 0; i < selectSecrecyUser.length; i++) {
      if (Number(uid) == Number(selectSecrecyUser[i].userId)) {
        selectSecrecyUser.splice(i, 1)
        i--
        break
      }
    }
    if (type === 'checkUsers') {
      setFileUser({
        users: newArr,
        fileUsers: newList,
      })
    }

    if (type === 'joinUsers') {
      setJoinMeetUser(newArr)
    }

    if (!checkUserIn(Number(uid), 'joinUsers')) {
      delSelectSecrecyUser(Number(uid))
    }
  }

  // 删除参会成员和列席成员时校验（私密附件成员是否包含被删除的人）
  const checkUserIn = (uid: number, type: string) => {
    let _type = false
    if (type === 'subjects') {
      joinMeetUser.map((item: any) => {
        if (Number(item.userId) === uid) {
          _type = true
          return
        }
      })
    }

    // 会议议题成员遍历
    if (state.subjects.length > 0) {
      state.subjects.map((item: any) => {
        if (item.users.length > 0) {
          item.users.map((uitem: any) => {
            if (Number(uitem.userId) === uid) {
              _type = true
              return
            }
          })
        }
      })
    }

    return _type
  }
  const JoinUser = (params: any) => {
    const datas = params.datas
    return datas.users.map((item: any, i: number) => {
      return (
        <div className="user-div" key={i}>
          {datas.type === 'joinUsers' && (
            <Avatar className="oa-avatar" src={item.profile}>
              {item.username && item.username.length > 2 ? item.username.slice(-2) : item.username}
            </Avatar>
          )}
          <span className={`${datas.type !== 'joinUsers' ? 'common' : ''}`}>
            {item.username && item.username.length > 2 ? item.username.slice(-2) : item.username}
          </span>
          <span
            className="delBtn"
            onClick={() => {
              datas.type === 'subjects'
                ? delSubMember(datas.i, item.userId)
                : delJoinMember(item.userId, datas.type)
            }}
          ></span>
        </div>
      )
    })
  }

  // 提醒方式
  const remindNoticeType = (checkedValue: any) => {
    setCheckedStatus(checkedValue)
    dispatch({
      type: 'noticeType',
      data: checkedValue,
    })
  }

  // 设置提醒方式
  const onChangeType = (value: string, options: any) => {
    console.log(value, options)
  }

  const cancelSend = () => {
    onHideAdd(false)
  }
  // 打开取消会议弹窗
  const meetCancle = () => {
    setMeetCanclePop(true)
  }

  // 关闭取消会议弹窗
  const isVisibleMeetCancle = (type: boolean) => {
    setMeetCanclePop(type)
  }

  const selectSend = (type: string) => {
    setButtonVisble(true)
    // 会议室
    if (state.startTime === '' || state.endTime === '') {
      message.error('未选择会议室和会议时间！')
      setButtonVisble(false)
      return
    }
    // 会议名称
    if (state.name === '') {
      message.error('会议名称不能为空')
      setButtonVisble(false)
      return
    }
    // 议题内容
    for (const i in state.subjects) {
      if (state.subjects[i].topic === '') {
        message.error('会议议题不能为空')
        setButtonVisble(false)
        return false
      }
      if (state.subjects[i].goal === '') {
        message.error('达到目标不能为空')
        setButtonVisble(false)
        return false
      }
    }

    if (joinMeetUser.length === 0) {
      message.error('参会成员不能为空！')
      setButtonVisble(false)
      return
    }
    const newJoinUsers = [...joinMeetUser]
    state.joinUsers = newJoinUsers.map((item: any) => {
      return item.userId
    })

    const newSubjects = [...state.subjects]
    state.subjects = newSubjects.map((item: any) => {
      return { topic: item.topic, goal: item.goal, userIds: item.userIds }
    })
    const _noticeType = [...state.noticeType]
    if (_noticeType.length === 0) {
      state.noticeType = ['0']
    }

    state.meetingRoom = state.meetingRoom === -1 ? '' : state.meetingRoom
    let url = '/public/meeting/add'
    let txt = '发起会议成功！'
    let data: any = {}
    if (type === 'updateMeet') {
      url = '/public/meeting/update'
      txt = '修改会议成功！'
      // 过滤需要的参数
      data = (({ meetingFiles, joinUsers, meetingId, meetingRoom, name, startTime, endTime, subjects }) => ({
        meetingFiles,
        joinUsers,
        meetingId,
        meetingRoom,
        name,
        startTime,
        endTime,
        subjects,
      }))(state)
      data.meetingId = datas.meetId
    }
    state.fileUserIds = fileUser.fileUsers
    data.fileUserIds = fileUser.fileUsers

    //新版附件需要的参数
    state.temporaryId = pageUuid
    data.temporaryId = pageUuid
    state.fileGuidList = delFileIds
    data.fileGuidList = delFileIds
    $api
      .request(url, type === 'updateMeet' ? data : state, {
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          loginToken: loginToken,
        },
      })
      .then(async resData => {
        const dataInfo = resData.data
        if (dataInfo != '' && dataInfo.approvalEventId != null) {
          // 发起审批
          setButtonVisble(false)
          await $store.dispatch({
            type: 'SET_SEND_APPROVAL_INFO',
            data: {
              eventId: dataInfo.approvalEventId,
              teamId: dataInfo.teamId,
              teamName: dataInfo.teamName,
              approvalName: '【会议发起】',
              isMeetAdd: true,
              isEdit: false,
              spareId: dataInfo.meetingId,
              spareInfo: dataInfo,
              uuid: Maths.uuid(),
              isNextForm: false,
              isNextFormDatas: null,
              findByEventIdData: '',
            },
          })
          $tools.createWindow('ApprovalExecute')
        } else {
          // message.success('发起会议成功！')
          setButtonVisble(false)
          onHideAdd(false)
          message.success(txt)
          resetParamPage()
          $store.dispatch({ type: 'REFRESH_MEET_LIST', data: { refreshMeetList: true } })
        }
      })
      .catch(res => {
        message.error(res.returnMessage)
        setButtonVisble(false)
      })
  }

  // 关闭弹窗
  const onHideModal = () => {
    setSecrecyUserModal(false)
  }

  const initialReducerState = () => {
    dispatch({
      type: 'name',
      data: '',
    })
    dispatch({
      type: 'subjects',
      data: [
        {
          topic: '',
          goal: '',
          users: [],
          userIds: [],
        },
      ],
    })
    setJoinMeetUser([])
    dispatch({
      type: 'joinUsers',
      data: [],
    })
    dispatch({
      type: 'meetingFiles',
      data: [],
    })
    dispatch({
      type: 'meetingRoom',
      data: {},
    })
    dispatch({
      type: 'startTime',
      data: '',
    })
    dispatch({
      type: 'endTime',
      data: '',
    })
    dispatch({
      type: 'taskId',
      data: '',
    })
    dispatch({
      type: 'userId',
      data: nowUserId,
    })
    dispatch({
      type: 'noticeType',
      data: [],
    })
    dispatch({
      type: 'mettingSource',
      data: {
        sourceName: '',
        sourceType: 1,
        sourceId: '',
        associationType: 2,
      },
    })
    setRoomSelectInfo({
      meetingRoomId: '', //会议室ID
      meetingRoomName: '', //会议室NAME
      meetingRoomImage: '', //会议室图片
      startTime: '', //会议开始时间
      endTime: '', //会议结束时间
    })
  }
  const startGetStatus = (status: number, proceed: number, joinStatus: number) => {
    let newStatus = '未开始'
    let showInfo = 'none_start'
    if (proceed == 0) {
      newStatus = '审核中'
      showInfo = 'approval_ing'
    } else if (proceed == 2) {
      newStatus = '进行中'
      showInfo = 'starting_meet'
    } else if (proceed == 3) {
      newStatus = '已结束'
      showInfo = 'meet_finish'
    }
    if (joinStatus == 2) {
      //请假
      newStatus = '已请假'
      showInfo = 'qj_meet'
    }
    if (status == 0) {
      newStatus = '已终止'
      showInfo = 'shut_down_meet'
    }
    //审核中
    if (status == 2) {
      newStatus = '审核中'
      showInfo = 'approval_ing'
    }
    return <span className={`status_name_span ${showInfo}`}>{newStatus}</span>
  }
  const newchangeAttachMent = (list: any[], delGuid: string) => {
    if (delGuid !== '') {
      const normal = normalDefaultFiles.filter((item: any) => item.fileGUID !== delGuid)
      setNormalDefaultFiles(normal)
      const delInfo = [...delFileIds]
      delInfo.push(delGuid)
      setDelFileIds(delInfo)
    }
    if (list.length > 0) {
      const contentArr: string[] = list || []
      setNormalFiles(contentArr)
    } else {
      setNormalFiles([])
    }
  }
  const changeCheckBoxSel = (checkedValue: any) => {
    const _userids: any = []
    const checkSel = secrecyUser.filter((item: any) => {
      if (checkedValue.includes(Number(item.userId))) {
        _userids.push(Number(item.userId))
        return {
          item: item,
          id: Number(item.userId),
        }
      }
    })

    fileUser.users = checkSel
    fileUser.fileUsers = _userids
    setSelectSecrecyUser(checkSel)
  }
  const isSelectUsers = () => {
    fileUser.fileUsers = selectSecrecyUser.map((item: any, i: number) => {
      return Number(item.userId)
    })
    fileUser.users = selectSecrecyUser.map((item: any, i: number) => {
      const _userArr = {
        userId: Number(item.userId),
        username: item.username,
        curType: 0,
        profile: item.profile,
      }
      return _userArr
    })
  }
  const getDatas = () => {
    const _subjectsUser: { userId: any; username: any; curType: number; profile: any }[] = []
    if (state.subjects.length > 0) {
      state.subjects.map((item: any, i: number) => {
        if (item.users.length > 0) {
          item.users.map((uitem: any, i: number) => {
            _subjectsUser.push({
              userId: Number(uitem.userId),
              username: uitem.username,
              curType: 0,
              profile: uitem.profile,
            })
          })
        }
      })
    }

    const newData = arrObjDuplicate([..._subjectsUser, ...joinMeetUser], 'userId')
    setSecrecyUser(newData)
  }
  return (
    <div className="meet_details_box meet_details_content_box">
      <div className="meetDetailCont meet_details_content">
        {datas.openType === 'start' && (
          <div className="new_meeting_belong_box">
            <div className="depx_box">
              <div className="detail_meet_org belong_org_icon">
                <span></span>
                <p className="meet_org_name">{detailsList.teamName}</p>
              </div>
              <div className="detail_meet_org belong_dept_icon">
                <span></span>
                <p className="start_user_name">发起人：{detailsList.originator}</p>
              </div>
              <div className="detail_meet_org send_form_task">
                <p className="content_meet_task"></p>
              </div>
            </div>
            <div>{startGetStatus(detailsList.status, detailsList.proceed, detailsList.joinStatus)}</div>
          </div>
        )}
        <div className="custom-row custom-row-selectRoom">
          <div className="list list-detail required-param">
            <div className="title">
              <label
                className="tit"
                onClick={e => {
                  e.stopPropagation()
                  selectMeetRoom()
                }}
              >
                {datas.openType === 'create' ? '选择会议室' : '已选会议室'}
              </label>
              {datas.openType === 'create' && <span className="start_user">发起人：{nowUser}</span>}
            </div>
            <div className="content">
              {roomSelectInfo.meetingRoomName !== '' && (
                <div className="detail-room-name">
                  <Avatar
                    size={20}
                    shape="square"
                    className="oa-avatar"
                    src={
                      roomSelectInfo.meetingRoomImage === '' ||
                      roomSelectInfo.meetingRoomImage === undefined ||
                      roomSelectInfo.meetingRoomImage === null
                        ? $tools.asAssetsPath('/images/mettingManage/cmpDefault.svg')
                        : roomSelectInfo.meetingRoomImage
                    }
                  ></Avatar>
                  <span className="room_name">{roomSelectInfo.meetingRoomName}</span>
                  <span className="room_time">
                    （{roomSelectInfo.startTime} - {roomSelectInfo.endTime}）
                  </span>
                  <span className="room_del" onClick={delRoomInfo}></span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="custom-row custom-row-meetName">
          <div className="list list-detail required-param">
            <div className="title">
              <label className="tit">会议名称</label>
            </div>
            <div className="content detail-meet-name">
              <input
                type="text"
                className="select-items detail_meet_name_input"
                value={state.name}
                onChange={e => {
                  changeSubNmae(e, 'name')
                }}
              />
            </div>
          </div>
        </div>
        <div className="items-box detail-subject-container">
          <div className="subject-title">
            <label className="tit">会议议题</label>
          </div>
          {state.subjects.map((item: any, i: number) => {
            return (
              <div className="items-detail" key={i}>
                <div className="custom-row custom-row-subject">
                  <div className="list list-detail required-param">
                    <div className="title">
                      <label className="tit">议题名称</label>
                    </div>
                    <div className="content detail-meet-discuss">
                      <input
                        type="text"
                        className="discuss_item select-items"
                        value={item.topic}
                        onChange={e => {
                          changeSubNmae(e, 'topic', i)
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div className="custom-row custom-row-subject">
                  <div className="list list-detail required-param">
                    <div className="title">
                      <label className="tit">达到目标</label>
                    </div>
                    <div className="content detail-meet-goal">
                      <input
                        type="text"
                        maxLength={500}
                        className="goal_item select-items"
                        value={item.goal}
                        onChange={e => {
                          changeSubNmae(e, 'goal', i)
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div className="custom-row custom-row-subject">
                  <div className="list list-detail">
                    <div className="title">
                      <label className="tit">列席成员</label>
                    </div>
                    <div className="content add_user_box">
                      <div className="meet-user-div">
                        {item.users && item.users.length > 0 && (
                          <JoinUser datas={{ users: item.users, type: 'subjects', i }} />
                        )}
                      </div>
                      <div
                        className="add-user"
                        onClick={() => {
                          setSubjectUser('subjectUser', i)
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
                {i !== 0 && (
                  <div
                    className="del-confren-icon"
                    onClick={() => {
                      delConfren(i)
                    }}
                  ></div>
                )}
              </div>
            )
          })}

          <div className="add-btns">
            <button className="add-confrence-bt add-confrence-detail-bt" onClick={addConfrence}>
              新增议题
            </button>
          </div>
        </div>
        <div className="custom-row custom-row-joinUser">
          <div className="list list-detail confrenList required-param">
            <div className="title">
              <label className="tit">参会成员</label>
            </div>
            <div className="content add_user_box">
              <div className="meet-user-div">
                {joinMeetUser && joinMeetUser.length > 0 && (
                  <JoinUser datas={{ users: joinMeetUser, type: 'joinUsers' }} />
                )}
              </div>
              <div
                className="add-user"
                onClick={() => {
                  selJoinUser()
                }}
              ></div>
            </div>
          </div>
        </div>
        <div className="detail-meet-file">
          <div className="custom-row custom-row-fileBox">
            <div className="list list-detail">
              <div className="content up_file_box" style={{ paddingLeft: 0 }}>
                <div className=" fileTitle normal-attach-upload">
                  {/* <div
                    style={{ cursor: 'pointer', padding: '5px' }}
                    onClick={() => {
                      setUploadVisible(true)
                      setLoadTime(new Date().getTime())
                    }}
                  >
                    <span className="file_icon"></span>添加附件
                  </div> */}
                  <div className="title">
                    <label
                      className="tit"
                      onClick={() => {
                        setUploadVisible(true)
                        setLoadTime(new Date().getTime())
                      }}
                    >
                      添加附件
                    </label>
                  </div>

                  <RenderUplodFile
                    visible={uploadVisible}
                    leftDown={isEdit ? true : false}
                    canDel={true}
                    filelist={normalFiles || []}
                    teamId={state.teamId}
                    fileId={pageUuid}
                    defaultFiles={normalDefaultFiles || []}
                    setVsible={state => setUploadVisible(state)}
                    loadTime={loadTime}
                    fileChange={(list: any, delGuid?: string) => {
                      newchangeAttachMent(list, delGuid || '')
                    }}
                    isPrivacy={false}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="meetDetailFooterBox">
        {datas.openType === 'start' &&
          detailsList.proceed !== 3 &&
          datas.nowStatus !== 2 &&
          datas.nowStatus !== 0 && (
            <div className="meetDetailFooter meet_details_footer_box">
              <div className="zone_remind_box">
                <span className="zone_remind_type">提醒我</span>
                <div className="zone_remind_select">
                  <Select
                    className="select-type"
                    defaultValue={'无提醒'}
                    onChange={onChangeType}
                    style={{ width: 96 }}
                  >
                    {remindType.length != 0 &&
                      remindType.map((ritem: any) => {
                        return (
                          <Select.Option key={ritem.code} value={ritem.name}>
                            {ritem.name}
                          </Select.Option>
                        )
                      })}
                  </Select>
                </div>
                <div className="zone_hint_type">
                  <Checkbox.Group
                    defaultValue={setChecked}
                    options={hintTypeCheckBox}
                    onChange={remindNoticeType}
                  ></Checkbox.Group>
                </div>
              </div>
              <div className="sendBtn_box">
                <Button className="cancleSend" type="ghost" onClick={meetCancle}>
                  取消会议
                </Button>
                <Button
                  loading={buttonVsible}
                  className="submitSend"
                  type="primary"
                  onClick={() => {
                    selectSend('updateMeet')
                  }}
                >
                  保存修改
                </Button>
              </div>
            </div>
          )}
        {datas.openType === 'create' && (
          <div className="meetDetailFooter meet_details_footer_box">
            <div className="zone_remind_box">
              <span className="zone_remind_type" style={{ marginRight: '40px' }}>
                提醒方式
              </span>
              <div className="zone_hint_type">
                <Checkbox.Group
                  defaultValue={setChecked}
                  options={hintTypeCheckBox}
                  onChange={remindNoticeType}
                ></Checkbox.Group>
              </div>
            </div>
            <div className="sendBtn_box">
              <Button className="cancleSend" type="ghost" onClick={cancelSend}>
                取消
              </Button>
              <Button
                loading={buttonVsible}
                className="submitSend"
                type="primary"
                onClick={() => {
                  selectSend('createMeet')
                }}
              >
                发送
              </Button>
            </div>
          </div>
        )}
      </div>
      <SelectMemberOrg
        param={{
          visible: memberOrgShow,
          ...selMemberOrg,
        }}
        action={{
          setModalShow: setMemberOrgShow,
        }}
      />
      {selectRoom && (
        <MeetAddRoomSelect
          datas={{
            selectRoomVisible: selectRoom,
            startTime: roomSelectInfo.startTime,
            endTime: roomSelectInfo.endTime,
            meetingRoomId: roomSelectInfo.meetingRoomId,
            meetingRoomName: roomSelectInfo.meetingRoomName,
            meetingRoomImage: roomSelectInfo.meetingRoomImage,
            selOrgId: nowOrgId,
            meetingId: datas.meetId,
            openType: datas.openType,
          }}
          visibleSelectRoom={visibleSelectRoom}
        />
      )}
      {meetCanclePop && (
        <MeetCancle
          datas={{ meetId: datas.meetId, meetCanclePop: meetCanclePop }}
          onHideAdd={isVisibleMeetCancle}
        />
      )}
      {secrecyUserModal && (
        <Modal
          visible={secrecyUserModal}
          title="选择查阅成员"
          width={460}
          onCancel={onHideModal}
          maskClosable={false}
          className="metting-add-secrecy-modal"
          onOk={() => {
            isSelectUsers()
            setSecrecyUserModal(false)
          }}
        >
          <div>
            <div className="selected-member-list">
              <div className="left-select-word">已选择：</div>
              <div className="meet-user-div">
                {fileUser.users?.map((item: any, i: number) => {
                  return (
                    <div className="user-div" key={i}>
                      <span className="common">{item.username}</span>
                      <span
                        className="delBtn"
                        onClick={() => {
                          secrecySelUser(item.userId)
                        }}
                      ></span>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="room-member-list">
              <div className="normal-communi-person normal-confren-list">
                <Checkbox.Group
                  onChange={changeCheckBoxSel}
                  value={fileUser.users?.map((item: { userId: any }) => item.userId)}
                >
                  {secrecyUser.map((item: any, index: number) => (
                    <Checkbox key={index} value={Number(item.userId)} data-item={item}>
                      {item.username}
                    </Checkbox>
                  ))}
                </Checkbox.Group>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default MeetAdd
