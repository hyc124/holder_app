import React, { useEffect, useState } from 'react'
import moment from 'moment'
import { shallowEqual, useSelector } from 'react-redux'
import {
  findTaskLogForm,
  addTaskReport,
  taskReportDetail,
  findRelationUser,
  taskmodifyById,
} from './common/getReprt'
import { SelectMemberOrg } from '../../components/select-member-org/index'
import { Avatar, Slider, Input, Typography, message, Button, Rate } from 'antd'
import Summernote from '@/src/components/editor/index'
import EditorAt, { editorAtChange, getAtUsers, setOldEditorTxt } from '@/src/components/editor/editorAt'
import './DailySummary.less'
import { CheckboxOptionType } from 'antd/lib/checkbox'
import { ipcRenderer } from 'electron'
import { loadLocales } from '@/src/common/js/intlLocales'
import * as Maths from '@/src/common/js/math'
import { RenderUplodFile } from '../mettingManage/component/RenderUplodFile'
import ChatForwardModal from '@/src/components/chat-forward-modal'
import { getListAvatar } from '@/src/views/chatwin/component/ChatHeader'
import { HeartFilled } from '@ant-design/icons'
import { getAvatarEnums } from '../chatwin/getData/ChatHandle'
const { Title } = Typography
interface DailyItemProps {
  taskName: string
  startTime: string
  endTime: string
  process: number
  taskId: number
  relation: number
  status: number
  describe: string
  models: Array<any>
  executeTime: string
  finishTime: string
  flag: number
  approvalStatus: number
  subTaskCount: number
  objectiveProcess: number
  joinTeams: Array<number>
  teamList: any
  liableUsername: string
  processUsername?: string
  processStatus?: any
  planTreeType?: any
}
interface ShareRoomList extends CheckboxOptionType {
  belongOrg: string
  belongType: string
  belongTypeId: string
  id: string
  muc: string
  subject: string
  talkType: number
  toPerson: Array<string>
  icon?: string
  type?: string
}
interface ItemModel {
  id: number
  name: string
  warnText: string
  position: number
  isRequired: number
  content: string
  plans: null
  taskIds: null
  userModels: any
  editInput: boolean
}
interface ReportUserListProps {
  userId: number
  username: string
  profile: string
  forceReportUser: boolean
}

interface FileModelsItemProps {
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
let judgueText = false
let stepIndex = 1
// ??????????????????
const editors: any = []
//????????????
export const solveText = (text: string) => {
  if (!text) {
    return ''
  }
  let description = text
  description = description.replace(/(\n)/g, '')
  description = description.replace(/(\t)/g, '')
  description = description.replace(/(\r)/g, '')
  description = description.replace(/<\/?[^>]*>/g, '')
  description = description.replace(/\s*/g, '')
  description = description.replace(/&nbsp;/g, '')
  description = description.replace(/:::/g, '')
  return description
}
const getDifferImage = (value: number, status?: number) => {
  let srcimg = '/images/task/task_going.png'
  let srctext = '?????????'
  if (status == 1) {
    srcimg = '/images/task/task_going.png'
    srctext = '?????????'
  } else if (value === 0) {
    srcimg = '/images/task/task_nostart.png'
    srctext = '?????????'
  } else if (value === 100) {
    srcimg = '/images/task/task_finish.png'
    srctext = '?????????'
  }
  srcimg = $tools.asAssetsPath(srcimg)
  return {
    img: srcimg,
    text: srctext,
  }
}
// let fileModelss: any = []
// ?????????????????????????????? 0???????????? 2 ????????????  1 @??????
let teamId = ''
let selectType = 0
const DailySummary = () => {
  const handleBtnList = useSelector((state: StoreStates) => state.handleBtnList, shallowEqual)
  const getDiffType = useSelector((state: StoreStates) => state.getDiffType, shallowEqual) //0-??????  1-??????
  const sourceType = useSelector((state: StoreStates) => state.sourceType, shallowEqual) //0-??????  1-??????
  const taskdetail = useSelector((state: StoreStates) => state.taskdetail, shallowEqual) //????????????
  const [roomListSelCheck, setRoomListSelCheck] = useState<Array<ShareRoomList>>([])
  const [listData, setTableData] = useState<DailyItemProps>(Object) //??????????????????????????????
  // let teamId: any =
  // handleBtnList && handleBtnList.ascriptionId ? handleBtnList.ascriptionId : taskdetail.ascriptionId
  const [saveprocess, setProcess] = useState(0) //????????????
  const [textShow, setTextShow] = useState(false)
  const { selectTeamId } = $store.getState()
  const [memberOrgShow, setMemberOrgShow] = useState(false)
  //okr??????
  const [percents, setPercents] = useState(0)
  const [recently, setRecently] = useState(0)
  //okr??????
  const [evolvestart, setEvolvestart] = useState<any>({
    type: 0,
    text: '??????',
    classname: 'zc',
    heart: 2.5,
  })
  // ????????????
  const [reportUserList, setReportUserList] = useState<Array<ReportUserListProps>>([])
  //????????????
  const [CCUserList, setCCUserList] = useState<Array<ReportUserListProps>>([])
  //????????????
  // const [selectType, setSelectType] = useState(0) //0???????????? 1 ????????????
  // ???????????????????????????
  const [fileUserList, setFileUserList] = useState<Array<FileModelsItemProps>>([])
  //??????
  const [shareToRoomModalShow, setShareToRoomModalShow] = useState(false)
  // ??????????????????
  const initSelMemberOrg: any = {
    teamId: '',
    sourceType: 'report', //????????????
    allowTeamId: [''],
    selectList: [], //????????????????????????
    checkboxType: 'checkbox',
    permissionType: 3, //?????????????????????????????????
    showPrefix: false, //???????????????????????????
  }
  const [selMemberOrg, setSelMemberOrg] = useState(initSelMemberOrg)
  const [savedis, setSavedis] = useState(false)

  //???????????????????????????
  const [newFileList, setNewFileList] = useState<Array<any>>([])
  const [uploadVisible, setUploadVisible] = useState<boolean>(false)
  const [loadTime, setLoadTime] = useState<any>('')
  const [pageUuid, setPageUuid] = useState('')
  const [defaultFiles, setDefaultFiles] = useState<Array<any>>([])
  const [delFileIds, setDelFileIds] = useState<Array<any>>([])
  const $$hasBtn = handleBtnList && handleBtnList.ascriptionId
  const $$taskdetail = taskdetail && taskdetail.ascriptionId
  useEffect(() => {
    setPageUuid(Maths.uuid())
    if ($$hasBtn) {
      teamId = handleBtnList.ascriptionId
    }
    if ($$taskdetail) {
      teamId = taskdetail.ascriptionId
    }
  }, [])

  useEffect(() => {
    //??????????????????????????????????????????????????????
    ipcRenderer.on('window-show', () => {
      setPageUuid(Maths.uuid())
      if ($$hasBtn) {
        teamId = handleBtnList.ascriptionId
      }
      if ($$taskdetail) {
        teamId = taskdetail.ascriptionId
      }
    })
  }, [])

  const initEvent = () => {
    setRoomListSelCheck([])
    setReportUserList([])
    setCCUserList([])
    setFileUserList([])
    listData.models = []
    setTableData({ ...listData })
    setSavedis(false)
    // fileModelss = []
    setDefaultFiles([])
    setDelFileIds([])
    setNewFileList([])
    let nowtile = ''
    if (handleBtnList.types == 'okr') {
      nowtile = '????????????'
    } else {
      nowtile = '????????????'
    }
    if (getDiffType === 0) {
      setProcess(0)
      findRelationUser(handleBtnList.id).then((result: any) => {
        const dataAll = result.dataList
        dataAll.map((element: any) => {
          element.disable = true
        })
        setReportUserList(dataAll)
      })
      reQuestOrigin()
    } else if (getDiffType === 1) {
      taskReportDetail(handleBtnList.reportId, handleBtnList.type).then((res: any) => {
        if (res.data.fileReturnModels && res.data.fileReturnModels.length > 0) {
          setFileUserList(res.data.files || [])
          teamId = res.data.ascriptionId
          setDefaultFiles(res.data.fileReturnModels || [])
        }
        const ReportUserList: any[] = []
        const CCUserList: any[] = []
        const dataAll = res.data.reportUser
        dataAll.forEach((element: any) => {
          element.disable = true
          if (element.type === 0) {
            ReportUserList.push(element)
          } else if (element.type === 2) {
            CCUserList.push(element)
          }
        })

        setReportUserList([...ReportUserList])
        setCCUserList([...CCUserList])
        //todo
        const arrArray: any = res.data.models || []
        if (res.data.taskPlanModel && res.data.taskPlanModel.length > 0) {
          res.data.taskPlanModel.forEach((element: any) => {
            element.name = '???????????????'
            arrArray.push(element)
          })
        }
        reQuestOrigin(arrArray)
      })
    }
    $tools.windowList.get('DailySummary')?.setTitle(handleBtnList.type == 1 ? '????????????' : nowtile)
  }
  useEffect(() => {
    initEvent()
    loadLocales()
  }, [getDiffType, handleBtnList])
  const reQuestOrigin = (list?: any) => {
    const { handleBtnList } = $store.getState()
    findTaskLogForm(handleBtnList.id).then((resData: any) => {
      if (resData.data.models) {
        resData.data.models.map((item: any, index: number) => {
          if (list) {
            list.forEach((element: any) => {
              if (element.id === item.id) {
                item.content = element.content
              }
              if (element.name == '???????????????' && element.name == item.name) {
                item.content = element.content
              }
            })
          }
          if (index == 0) {
            item.editInput = true
          } else {
            item.editInput = false
          }
        })
      }
      $store.dispatch({ type: 'ROOM_ID_LIST', data: [] })
      if (resData.data.describe) {
        resData.data.describe = solveText(resData.data.describe)
      }
      setTableData(resData.data)
      setProcess(resData.data.process)
      setTextShow(false)
      if (handleBtnList.types == 'okr') {
        if (handleBtnList.okrprogress) {
          setPercents(handleBtnList.okrprogress.percents)
          evolvestart.heart = handleBtnList.okrprogress.cci
          setEvolvestartFn(handleBtnList.okrprogress.evolvestart)
        } else {
          setPercents(resData.data.process)
          setRecently(resData.data.process)
          if (resData.data.planTreeType == 3) {
            evolvestart.heart = resData.data.cci / 2
          }
          setEvolvestartFn(resData.data.processStatus)
        }
      }
    })
  }
  // ??????????????????
  const selReportUser = (type: number) => {
    //todo
    const setList: any = []
    if (type === 2) {
      //????????????
      CCUserList.map((item: any, i: number) => {
        setList.push({
          curId: item.userId,
          curName: item.username,
          curType: 0,
          profile: item.profile,
          disable: item.disable,
        })
      })
    } else if (type === 0) {
      //????????????
      reportUserList.map((item: any, i: number) => {
        setList.push({
          curId: item.userId,
          curName: item.username,
          curType: 0,
          profile: item.profile,
          disable: item.disable,
        })
      })
    }
    let arrList: any = []
    const orgBotList: any = []
    if (listData.joinTeams) {
      arrList = listData.joinTeams
    }
    if (listData.teamList) {
      listData.teamList.map((titem: any) => {
        orgBotList.push({
          curId: titem.userId,
          curName: titem.username,
          curType: 0,
          cmyId: titem.teamId,
          cmyName: titem.teamName,
          profile: titem.profile,
        })
      })
    }
    //??????????????????
    selMemberOrg.selectList = setList
    selMemberOrg.orgBotList = orgBotList
    selMemberOrg.allowTeamId = arrList
    selMemberOrg.sourceType = 'report'
    selMemberOrg.orgBotInfo = {
      type: 'joinTeam',
      title: '?????????????????????',
      titleSub: '??????????????????????????????????????????',
    }
    setSelMemberOrg({
      ...selMemberOrg,
    })
    setMemberOrgShow(true)
  }
  // ???????????????????????????
  const changeInputVal = (e: any) => {
    stepIndex = 1
    let textboxvalue = e.target.value
    if (textboxvalue.length == 1) {
      textboxvalue = e.target.value.replace(/[^0-9]/g, '')
    } else {
      textboxvalue = e.target.value.replace(/^\D*(\d*(?:\.\d{0,2})?).*$/g, '$1')
    }
    if (textboxvalue > 100) {
      textboxvalue = 100
    }
    if (handleBtnList.types == 'okr') {
      setPercents(textboxvalue)
    } else {
      setProcess(textboxvalue)
    }
  }
  const selMemberSure = (dataList: any, info: { sourceType: string }) => {
    const _datas: any = []
    dataList.map((item: any, i: number) => {
      _datas.push({
        userId: item.curId,
        username: item.curName,
        profile: item.profile,
        type: selectType,
        disable: item.disable,
      })
      if (selectType === 0) {
        setReportUserList(_datas)
      } else if (selectType === 2) {
        setCCUserList(_datas)
      }
    })
  }
  const shareTheRoom = () => {
    $store.dispatch({
      type: 'WORKPLAN_MODAL',
      data: {
        sourceItem: {},
        shareFormType: 'taskReport',
      },
    })
    setShareToRoomModalShow(true)
  }

  const packageShareData = () => {
    const _userids: any[] = []
    const _ids: any[] = []
    roomListSelCheck.map((item: any) => {
      if (item.type === 3) {
        _userids.push(item.userId)
      } else {
        _ids.push(item.id)
      }
    })
    const transposeMessageModel = {
      sendUserId: $store.getState().nowUserId,
      userIds: _userids,
      id: _ids,
    }
    return transposeMessageModel
  }

  //??????????????????
  const saveReportData = () => {
    const planList: any = []
    setSavedis(true)
    let isRequire = false
    listData.models.map((item: ItemModel) => {
      const userModels = getAtUsers({ content: item.content || '' })
      item.userModels = userModels
      if (item.name == '???????????????') {
        planList.push({
          content: item.content,
          userModels: userModels,
          sync: 1,
          startTime: '',
          endTime: '',
          userId: $store.getState().nowUserId,
        })
      }
      if (item.isRequired === 1) {
        if (item.content === '') {
          isRequire = true
        }
      }
    })
    if (!reportUserList || reportUserList.length == 0) {
      message.error('?????????????????????')
      setSavedis(false)
      return false
    }
    if (isRequire) {
      message.error('????????????????????????????????????')
      setSavedis(false)
      return false
    }
    const mucIds: any = []
    if ($store.getState().roomIdList.length > 0) {
      $store.getState().roomIdList.map((data: ShareRoomList) => {
        if (data.id) {
          mucIds.push(data.id)
        }
      })
    }
    const fileList: any = []
    fileUserList.forEach(file => {
      if (file) {
        const fileName = file.name
        const fileSuffix = fileName
          .toLowerCase()
          .split('.')
          .splice(-1)[0]
        fileList.push({
          id: file.id || '',
          fileKey: file.id ? file.fileKey : file.uid + '.' + fileSuffix,
          fileName: file.name,
          fileSize: file.size || file.fileSize,
          dir: 'taskReport',
        })
      }
    })
    const param: any = {
      taskId: handleBtnList.id,
      userId: $store.getState().nowUserId,
      reportUserModels: reportUserList,
      reportCopyUserModels: CCUserList, //????????????
      planModels: planList,
      process: saveprocess,
      processSpend: 1,
      files: fileList,
      models: listData.models,
      checkTime: moment(new Date()).format('YYYY/MM/DD HH:mm'),
      operateCode: '',
      mucIds: mucIds,
      isModify: '1',
      temporaryId: pageUuid, //?????????????????????uuid
      fileGuidList: delFileIds,
      transposeMessageModel: packageShareData(),
    }

    if (handleBtnList.types == 'okr') {
      //okr??????
      param.processStatus = evolvestart.type
      param.process = percents
      if (listData.planTreeType && listData.planTreeType == 3) {
        param.cci = evolvestart.heart * 2
      }
    }
    if (getDiffType == 0) {
      addTaskReport(param).then((res: any) => {
        if (res) {
          // ??????????????????????????????
          const backData = {
            optType: handleBtnList.types == 'okr' ? 'okr_report' : 'report',
            sourceType: sourceType,
            data: {
              taskId: handleBtnList.id,
              taskIds: [handleBtnList.id],
              process: saveprocess,
              cci: param.cci,
            },
          }
          ipcRenderer.send('refresh_operated_task_main', backData)
        }
        setTimeout(() => {
          ipcRenderer.send('close_daily_summary')
          setSavedis(false)
        }, 1000)
      })
    } else if (getDiffType == 1) {
      param.id = handleBtnList.reportId
      taskmodifyById(param).then((res: any) => {
        if (res) {
          if (sourceType == 'reportdetail') {
            ipcRenderer.send('handle_report_model', {
              optType: handleBtnList.types == 'okr' ? 'okr_report' : 'report',
              sourceType: sourceType,
              data: {
                taskId: handleBtnList.id,
                taskIds: [handleBtnList.id],
              },
            })
          } else {
            ipcRenderer.send('refresh_operated_task_main', {
              sourceType: sourceType,
              optType: handleBtnList.types == 'okr' ? 'okr_report' : 'report',
              data: {
                taskId: handleBtnList.id,
                taskIds: [handleBtnList.id],
              },
            })
          }
        }
        setTimeout(() => {
          ipcRenderer.send('close_daily_summary')
          setSavedis(false)
        }, 1000)
      })
    }
  }
  // const ShareRoomHtml = (props: any) => {
  //   const [roomListSelCheck, setRoomListSelCheck] = useState<Array<ShareRoomList>>([])
  //   useEffect(() => {
  //     setRoomListSelCheck(props.list)
  //   }, [props.list])
  //   const delShareItem = (id: string, name: string) => {
  //     roomListSelCheck.map((item: any, index: number) => {
  //       if (item.id == id) {
  //         return roomListSelCheck.splice(index, 1)
  //       }
  //     })
  //     setRoomListSelCheck([...roomListSelCheck])
  //     $store.dispatch({
  //       type: 'ROOM_ID_LIST',
  //       data: roomListSelCheck,
  //     })
  //   }
  //   return (
  //     <div className="shared_group_list">
  //       {roomListSelCheck.map((item: ShareRoomList, index: number) => (
  //         <div className="share_list_item" key={index}>
  //           {
  //             <Avatar
  //               className="oa-avatar"
  //               shape="square"
  //               size={20}
  //               src={item.icon || null}
  //               style={{ maxWidth: '20px', minWidth: '20px' }}
  //             >
  //               {item.subject && item.subject.length > 2 ? item.subject.slice(-2) : item.subject}
  //             </Avatar>
  //           }
  //           <span className="cmp_name">{item.subject}</span>
  //           <span
  //             className="icon_del"
  //             onClick={() => {
  //               delShareItem(item.id, item.subject)
  //             }}
  //           ></span>
  //         </div>
  //       ))}
  //     </div>
  //   )
  // }

  const delUser = (id: string, type: number) => {
    if (type === 0) {
      reportUserList.map((item: any, index: number) => {
        if (item.userId == id) {
          return reportUserList.splice(index, 1)
        }
      })
      setReportUserList([...reportUserList])
    } else if (type === 1) {
      CCUserList?.map((item: any, index: number) => {
        if (item.userId == id) {
          return CCUserList.splice(index, 1)
        }
      })
      setCCUserList([...CCUserList])
    }
  }
  //okr??????
  const setEvolvestartFn = (type: any, returnType?: string) => {
    let _classname = ''
    let _text = ''
    if (type == 0) {
      _classname = 'zc'
      _text = '??????'
    } else if (type == 1) {
      _classname = 'fx'
      _text = '?????????'
    } else if (type == 2) {
      _classname = 'cq'
      _text = '??????'
    } else if (type == 3) {
      _classname = 'yc'
      _text = '??????'
    }
    if (returnType == 'text') {
      return _text
    } else {
      evolvestart.type = type
      evolvestart.text = _text
      evolvestart.classname = _classname
      setEvolvestart({ ...evolvestart })
    }
  }

  const setSelectGroup = (dataValue: any) => {
    dataValue.forEach((item: any) => {
      item.subject = item.name
      item.icon = item.profile
      if (item.type === 3) {
        item.id = item.userId
      }
    })
    setRoomListSelCheck(dataValue)
    setShareToRoomModalShow(false)
  }

  const delShareItem = (id: string) => {
    const result = roomListSelCheck.filter((item: any) => {
      return item.id !== id
    })
    setRoomListSelCheck(result)
  }
  return (
    <div className="writeTaskReportModal flex-1 flex column">
      {/* ?????? */}
      {handleBtnList.types != 'okr' && (
        <div className="report_text_top">
          <Title level={4}>
            <span>{listData.taskName || ''}</span>
          </Title>
          <div className="report_des_box flex">
            <div className="report_des_peo_box flex column center">
              <Avatar
                size={34}
                style={{
                  marginBottom: 4,
                }}
                src={getDifferImage(saveprocess, listData.status).img}
              ></Avatar>
              <span>{getDifferImage(saveprocess, listData.status).text}</span>
            </div>
            <div className="report_des_cont_box flex-1">
              <div className="report_des_cont_Item">
                <span className="">????????????{listData.liableUsername}</span>
                <span className="time" style={{ marginLeft: '100px' }}>
                  ?????????{' '}
                  {listData.startTime ? listData.startTime.substring(listData.startTime.indexOf('/') + 1) : '/'}{' '}
                  -{listData.endTime && listData.endTime.substring(listData.endTime.indexOf('/') + 1)}
                </span>
              </div>
              <div className="report_des_cont_Item flex" style={{ margin: '6px 0px' }}>
                <span className="progress_text">?????????</span>{' '}
                <Slider
                  step={5}
                  tipFormatter={() => {
                    return `${saveprocess}%`
                  }}
                  min={0}
                  max={100}
                  className="flex-1"
                  style={{ height: '6px' }}
                  value={saveprocess}
                  disabled={handleBtnList.status == 2}
                  onChange={(value: any) => {
                    stepIndex = 5
                    setProcess(value)
                    // setTableData({ ...listData, process: value })
                  }}
                />
                <Input
                  min={0}
                  size="small"
                  max={100}
                  value={saveprocess}
                  onChange={changeInputVal}
                  onPressEnter={(e: any) => {
                    e.target.blur()
                  }}
                  disabled={handleBtnList.status == 2}
                />{' '}
                <span className="percent">%</span>
              </div>
              <div className="report_des_cont_Item flex">
                {handleBtnList.type == 1 ? '??????' : '??????'}?????????{' '}
                <div
                  className="report_des_ellipsis"
                  style={
                    textShow
                      ? {
                          overflow: 'visible',
                          display: 'inline-block',
                          wordWrap: 'break-word',
                          maxHeight: '60px',
                          overflowY: 'auto',
                        }
                      : {}
                  }
                >
                  {listData.describe}
                </div>
                <a
                  className="ant-typography-expand"
                  style={listData.describe && listData.describe.length > 51 ? {} : { display: 'none' }}
                  onClick={() => {
                    if (textShow) {
                      $('.report_des_cont_Item .report_des_ellipsis').scrollTop(0)
                    }
                    setTextShow(!textShow)
                  }}
                >
                  {textShow ? '??????' : '??????'}
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* OKR?????? */}
      {handleBtnList.types == 'okr' && (
        <div className="okr_report_text_top">
          <div className="report_title">
            <span className="report_title_icon"></span>
            <div>
              <p>{listData.taskName}</p>
              {recently != 0 && (
                <span>
                  ?????????????????????
                  <i>
                    {recently}%???{setEvolvestartFn(listData.processStatus, 'text')})
                  </i>
                  ??????{listData.processUsername}??????
                </span>
              )}
            </div>
          </div>
          <div className="okr_report_content">
            <div className="okr_conter">
              <p>??????</p>
              <div className="okr_conter_percent">
                <Slider
                  className={''}
                  value={percents}
                  onChange={(value: any) => {
                    setPercents(value)
                  }}
                ></Slider>
                <span>
                  <Input
                    min={0}
                    max={100}
                    value={percents}
                    onPressEnter={(e: any) => {
                      if (e.keyCode == 13) {
                        setPercents(e.target.value || 0)
                      }
                    }}
                    onFocus={(e: any) => {
                      e.stopPropagation()
                    }}
                    onBlur={(e: any) => {
                      setPercents(e.target.value || 0)
                    }}
                    onChange={changeInputVal}
                  />
                  <span className="percent">%</span>
                </span>
              </div>
            </div>
            <div className="okr_conter" style={{ paddingLeft: '60px' }}>
              <p>????????????</p>
              <ul>
                <li
                  className={`zc ed_trigger_labels ${evolvestart.type == 0 ? 'active' : ''}`}
                  onClick={() => {
                    setEvolvestartFn(0)
                  }}
                >
                  <i></i>??????<span></span>
                </li>
                <li
                  className={`fx ed_trigger_labels ${evolvestart.type == 1 ? 'active' : ''}`}
                  onClick={() => {
                    setEvolvestartFn(1)
                  }}
                >
                  <i></i>?????????<span></span>
                </li>
                <li
                  className={`cq ed_trigger_labels ${evolvestart.type == 2 ? 'active' : ''}`}
                  onClick={() => {
                    setEvolvestartFn(2)
                  }}
                >
                  <i></i>??????<span></span>
                </li>
                <li
                  className={`yc ed_trigger_labels ${evolvestart.type == 3 ? 'active' : ''}`}
                  onClick={() => {
                    setEvolvestartFn(3)
                  }}
                >
                  <i></i>??????<span></span>
                </li>
              </ul>
            </div>
            {listData.planTreeType && listData.planTreeType == 3 && (
              <div className="okr_conter_heart">
                <p>????????????</p>
                <Rate
                  allowHalf
                  className="okr_color_heart"
                  onHoverChange={(val: any) => {
                    if (val) {
                      $('.okr_conter_heart .okr_heart_num').text(val * 2)
                    } else {
                      $('.okr_conter_heart .okr_heart_num').text(evolvestart.heart * 2)
                    }
                  }}
                  character={
                    <HeartFilled
                      style={{
                        fontSize: '14px',
                      }}
                    />
                  }
                  value={evolvestart.heart}
                  onChange={(val: number) => {
                    if (val || (val == 0 && evolvestart.heart == 0.5)) {
                      evolvestart.heart = val
                      setEvolvestart({ ...evolvestart })
                    }
                  }}
                />
                <span className="okr_heart_num">{evolvestart.heart * 2}</span>
              </div>
            )}
          </div>
        </div>
      )}
      <div className="reportContent-container">
        <div className="reportTmpContainer">
          {listData.models &&
            listData.models.map((item: ItemModel, index: number) => (
              <div className="item_listBox flex" key={index}>
                <div className="icon_box">
                  <span className="icon_t icon_cont"></span>
                  {item.isRequired === 1 && <span className="required_param">*</span>}
                </div>
                <div className="content_box">
                  <div className="tit_box">
                    <span>{item.name}</span>
                  </div>
                  {!item.editInput && (
                    <div
                      className="cont_box"
                      contentEditable={false}
                      dangerouslySetInnerHTML={{
                        __html:
                          solveText(item.content) || (item.content && item.content.includes('img'))
                            ? item.content.split(':::').join('')
                            : '?????????????????????',
                      }}
                      placeholder={'?????????????????????'}
                      data-configid={item.id}
                      onClick={() => {
                        listData.models.forEach(element => {
                          if (element.editInput) {
                            element.editInput = false
                          }
                        })
                        item.editInput = true
                        setTableData({ ...listData })
                        judgueText = false
                      }}
                    ></div>
                  )}

                  {item.editInput && (
                    <Summernote
                      className="reportEditor"
                      previewArea=".reportEditor"
                      editorContent={item.content ? item.content.split(':::').join('') : ''}
                      placeholder={item.warnText}
                      editorChange={(e: any) => {
                        if (solveText(e) || e.includes('img')) {
                          item.content = e
                          judgueText = true
                          setTableData({ ...listData })
                        } else if (judgueText) {
                          item.content = e
                          setTableData({ ...listData })
                        }
                      }}
                      onKeyUp={(e: any) => {
                        editorAtChange({
                          editor: editors[index],
                          node: $(e.currentTarget),
                          conHtml: $(e.currentTarget).html(),
                          allowTeamId: listData.joinTeams || [],
                          joinMembers: listData.teamList || [],
                          sourceType: 'workreport',
                          itemData: {
                            item,
                            contentKey: 'content',
                          },
                        })
                      }}
                      editorOnInit={(note: any) => {
                        editors[index] = note
                      }}
                      onFocus={() => {
                        setOldEditorTxt(item.content ? item.content.split(':::').join('') : '')
                      }}
                      data-configid={item.id}
                      // noInitUpdate??????????????????????????????????????????????????????????????????????????????????????????insertText????????????????????????????????????html
                      noInitUpdate={getDiffType == 1}
                    />
                  )}
                </div>
              </div>
            ))}
        </div>
        <div className="list_item report_person_box">
          <div className="item_listBox">
            <div className="icon_box">
              <span className="icon_t icon_per"></span>
              <span className="required_param">*</span>
            </div>
            <div className="content_box">
              <div className="per_tit">
                <span>????????????</span>
              </div>
              <div className="per_list">
                <div className="list_box">
                  {reportUserList &&
                    reportUserList.length != 0 &&
                    reportUserList.map((item: any, i: number) => {
                      return (
                        <div className="reportUser" key={i}>
                          <Avatar className="oa-avatar" src={item.profile || ''}>
                            {item.username && item.username.length > 2
                              ? item.username.slice(-2)
                              : item.username}
                          </Avatar>
                          <span>
                            {item.username && item.username.length > 2
                              ? item.username.slice(-2)
                              : item.username}
                          </span>
                          {!item.disable && (
                            <div className="user-del-btn" onClick={() => delUser(item.userId, 0)}></div>
                          )}
                        </div>
                      )
                    })}
                  <div
                    className="add_btn"
                    onClick={() => {
                      selectType = 0 //??????????????????
                      selReportUser(0)
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="list_item report_person_box">
          <div className="item_listBox">
            <div className="icon_box">
              <span className="icon_t icon_per"></span>
              <span className="required_param"></span>
            </div>
            <div className="content_box">
              <div className="per_tit">
                <span>????????????</span>
              </div>
              <div className="per_list">
                <div className="list_box">
                  {CCUserList &&
                    CCUserList.length != 0 &&
                    CCUserList.map((item: any, i: number) => {
                      return (
                        <div className="reportUser" key={i}>
                          <Avatar className="oa-avatar" src={item.profile || ''}>
                            {item.username && item.username.length > 2
                              ? item.username.slice(-2)
                              : item.username}
                          </Avatar>
                          <span>
                            {item.username && item.username.length > 2
                              ? item.username.slice(-2)
                              : item.username}
                          </span>
                          {!item.disable && (
                            <div className="user-del-btn" onClick={() => delUser(item.userId, 1)}></div>
                          )}
                        </div>
                      )
                    })}
                  <div
                    className="add_btn"
                    onClick={() => {
                      selReportUser(2)
                      selectType = 2 //??????????????????
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {handleBtnList.types != 'okr' && (
          <div className="list_item report_shared_group">
            <div className="item_listBox">
              <div className="icon_box">
                <span className="icon_t icon_share"></span>
                <span className="required_param" style={{ visibility: 'hidden' }}>
                  *
                </span>
              </div>
              <div className="content_box">
                <div className="shared_group_tit">
                  <span className="shared_group_title" onClick={shareTheRoom}>
                    ???????????????
                  </span>
                </div>
                {/* {$store.getState().roomIdList && $store.getState().roomIdList.length > 0 && (
                  <ShareRoomHtml list={$store.getState().roomIdList} />
                )} */}
                <div className="shared_group_list">
                  {roomListSelCheck.map((item: any, index: number) => (
                    <div className="share_list_item" key={index}>
                      {item.type === 3 && (
                        <Avatar
                          className="oa-avatar"
                          // shape="square"
                          size={20}
                          src={item.icon || null}
                          style={{ maxWidth: '20px', minWidth: '20px' }}
                        >
                          {item.subject && item.subject.length > 2 ? item.subject.slice(-2) : item.subject}
                        </Avatar>
                      )}
                      {item.type !== 3 && (
                        <Avatar
                          className="oa-avatar"
                          // shape="square"
                          size={20}
                          src={
                            item.icon
                              ? $tools.htmlDecodeByRegExp(item.icon)
                              : getAvatarEnums(item.type, item.subject)
                          }
                          style={{ maxWidth: '20px', minWidth: '20px' }}
                        >
                          {item.subject && item.subject.length > 2 ? item.subject.slice(-2) : item.subject}
                        </Avatar>
                      )}
                      {/* <Avatar
                        size={32}
                        className="oa-avatar flex center"
                        icon={item.talkType !== 3 ? getListAvatar() : null}
                        src={item.profile}
                      >
                        {item.subject.substr(-2, 2)}
                      </Avatar> */}
                      <span className="cmp_name">{item.subject}</span>
                      <span
                        className="icon_del"
                        onClick={() => {
                          delShareItem(item.id)
                        }}
                      ></span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="list_item report_file_all">
          <div className="item_listBox">
            <div className="report_file_tit">
              {/* <span className="icon_t icon_file"></span>
              <UploadFile
                fileModels={fileModelss}
                fileChange={fileListRes => {
                  setFileUserList(fileListRes)
                }}
                dir="taskReport"
                showText="????????????"
                showIcon={false}
                showUploadList={true}
                windowfrom={'DailySummary'}
              /> */}
              <span style={{ display: 'flex', alignItems: 'center' }}>
                <span className="formIcon file"></span>
                <span
                  style={{ cursor: 'pointer', padding: '5px' }}
                  onClick={() => {
                    setUploadVisible(true)
                    setLoadTime(new Date().getTime())
                  }}
                >
                  ????????????
                </span>
              </span>
              <RenderUplodFile
                visible={uploadVisible}
                leftDown={false}
                canDel={true}
                filelist={newFileList || []}
                teamId={teamId}
                fileId={pageUuid}
                defaultFiles={defaultFiles || []}
                setVsible={state => setUploadVisible(state)}
                loadTime={loadTime}
                fileChange={(list: any, delGuid?: string) => {
                  if (delGuid !== '') {
                    const files = defaultFiles.filter((item: any) => item.fileGUID !== delGuid)
                    setDefaultFiles(files)
                    const delInfo = [...delFileIds]
                    delInfo.push(delGuid)
                    setDelFileIds(delInfo)
                  }
                  setNewFileList(list)
                }}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="reportFooter-container">
        <Button
          className="cancle"
          value="cancle"
          onClick={() => {
            ipcRenderer.send('close_daily_summary')
          }}
        >
          ??????
        </Button>
        <Button className="sunbmit" value="sure" onClick={saveReportData} disabled={savedis}>
          ??????
        </Button>
      </div>
      {/* ???????????? */}
      {/* {shareToRoomModalShow && (
        <ShareToRoomModal
          props={{
            param: { shareToRoomModalShow: shareToRoomModalShow },
            action: { setShareToRoomModalShow: setShareToRoomModalShow },
          }}
          isclcallback={false}
          isclcallbackFn={() => {}}
        />
      )} */}
      {shareToRoomModalShow && (
        <ChatForwardModal
          sendType="share"
          visible={shareToRoomModalShow}
          chatMsg={''}
          teamId={selectTeamId}
          nodeSelected={roomListSelCheck}
          onSelected={setSelectGroup}
          onCancelModal={() => {
            setShareToRoomModalShow(false)
          }}
          dataAuth={true}
          findType={0}
          permissionType={3}
          isQueryAll={1}
          pageSize={10}
          selectList={[]}
        />
      )}
      {/* ???????????? */}
      {memberOrgShow && (
        <SelectMemberOrg
          param={{
            visible: memberOrgShow,
            ...selMemberOrg,
          }}
          action={{
            setModalShow: setMemberOrgShow,
            // ????????????
            onSure: selMemberSure,
          }}
        />
      )}
      {/* ??????@?????????????????? */}
      {handleBtnList.types != 'okr' && <EditorAt />}
    </div>
  )
}
export default DailySummary
