import React, { useState, useEffect, useRef } from 'react'
import './WorkReport.less'
import { useSelector } from 'react-redux'
import { CaretDownOutlined, HeartFilled } from '@ant-design/icons'
import { SelectMemberOrg } from '../../components/select-member-org/index'
import SelectWeek from './component/selectWeek'
import SelectYear from './component/selectYear'
import SelectMonth, { getMonthDate } from './component/selectMonth'
import SelectQuarter, { quertQuater } from './component/selectQuarter'
import ChatForwardModal from '@/src/components/chat-forward-modal'
import Summernote from '@/src/components/editor/index'
import moment from 'moment'
import { ipcRenderer } from 'electron'
import * as Maths from '@/src/common/js/math'
import { loadLocales } from '@/src/common/js/intlLocales'
import {
  Button,
  Select,
  DatePicker,
  Avatar,
  Input,
  Modal,
  Checkbox,
  Tabs,
  List,
  Pagination,
  message,
  Spin,
  Rate,
} from 'antd'
import { useMergeState } from '../chatwin/ChatWin'
import {
  editReport,
  findRelationUser,
  findTemplate,
  getDataList,
  getReportTemplate,
  importLastReport,
  ListProps,
  // queryShareRoomList,
  ReportContentListProps,
  ReportUserListProps,
  sendAddWorkReport,
  ShareRoomList,
  getCurrentTime,
} from './getData'
import MeetDetails from '../mettingManage/component/MeetDetails'
import DetailModal from '@/src/views/task/taskDetails/detailModal'
import { findAllCompanyApi } from '../task/creatTask/getData'
import { RenderUplodFile } from '../mettingManage/component/RenderUplodFile'
import { getStatusOrTime, getTypeLogo, tagItemHtml } from '../okr-four/work-okr-mind/okr-list-org'
import { getListAvatar } from '@/src/views/chatwin/component/ChatHeader'
import { detailParam } from '../force-Report/create-force-Report'
import EditorAt, { editorAtChange, getAtUsers, setOldEditorTxt } from '@/src/components/editor/editorAt'
import { findAuthList, getAuthStatus } from '@/src/common/js/api-com'
import { NEWAUTH812 } from '@/src/components'
import { getAvatarEnums } from '../chatwin/getData/ChatHandle'
const { TabPane } = Tabs
const { TextArea } = Input
const { Option } = Select
const { Search } = Input

interface ImportListProps {
  data: []
  dataList: []
}
interface CopyUserListProps {
  userId: number
  username: string
  profile: string
}
interface RelationContentProps {
  totalPages: number
  totalElements: number
  content: []
}

export interface FileModelsItemProps {
  id: number
  fileName: string
  fileKey: string
  fileSize: number
  dir: string
  fromType: null
  fromName: null
  uploadUser: string
  uploadDate: string
  custom: null
  collectType: number
  profile: string
  url: string
  uid: number | string
  name: string
  size: number
  src: string
}
let fileModels: any = []
// ??????????????????
let reportAuthList: any = []
const dateFormat = 'YYYY/MM/DD'
export const getDateformat = (type: number, currentStamp: number) => {
  const currentTime = new Date(currentStamp)
  const defaltDate =
    currentTime.getFullYear() +
    '/' +
    (currentTime.getMonth() + 1 < 10 ? '0' + (currentTime.getMonth() + 1) : currentTime.getMonth() + 1)
  if (type === 0) {
    return defaltDate + '/' + (currentTime.getDate() < 10 ? '0' + currentTime.getDate() : currentTime.getDate())
  } else if (type === 1) {
    return defaltDate + '/01'
  }
  return defaltDate
}

// ??????????????????
const editors: any = []
const WorkReport = () => {
  const isReportType = useSelector((store: StoreStates) => store.wortReportType)
  const _editReportId = useSelector((store: StoreStates) => store.editWorkReportId)
  const _editReportUserId = useSelector((store: StoreStates) => store.editWorkReportUserId)
  const isImportReport = useSelector((store: StoreStates) => store.isImportReport)
  const [currentTimeStamp, setCurrentTimeStamp] = useState<number>(0)
  const { nowUser, nowAccount, nowUserId, selectTeamId } = $store.getState()
  //????????????
  const [memberOrgShow, setMemberOrgShow] = useState(false)
  const [typeList, setList] = useState<Array<ListProps>>([])
  const [cmpList, setCmpList] = useState<Array<any>>([])
  // ????????????
  const [reportContent, setReportContent] = useState<Array<ReportContentListProps>>([])
  // ????????????
  const [reportUserList, setReportUserList] = useState<Array<ReportUserListProps>>([])
  // ????????????
  const [copyUserList, setCopytUserList] = useState<Array<CopyUserListProps>>([])
  // ????????????????????????
  const [mandatoryReporter, setMandatoryReporter] = useState([])

  const [roomListSelCheck, setRoomListSelCheck] = useState<Array<ShareRoomList>>([])
  // ????????????????????????
  const [taskLst, setTaskList] = useState<Array<RelationContentProps>>([])
  // ??????????????????
  const [aprovalList, setAprovalList] = useState<Array<RelationContentProps>>([])
  // ??????????????????
  const [mettingList, setMettingList] = useState<Array<RelationContentProps>>([])
  // ??????OKR??????
  const [okrkList, setOKRList] = useState<Array<RelationContentProps>>([])
  // ????????????/????????????id
  const newRelationId = useRef<any>()
  //???????????????????????????loading
  const [loading, setLoading] = useState(false)
  //??????????????????loading
  const [sendBtnLoading, setSendBtnLoading] = useState(false)
  // ???????????????????????????id???
  const nowRelationTemp = useRef<any>()
  // ??????????????????????????????????????????
  const nowTabs = useRef<number>(1)
  // ???????????????
  const placeholerRel = useRef<string>('????????????')
  // ??????????????????
  const detailModalRef = useRef<any>({})
  const searchVal = useRef<string>('')
  //????????????
  const [reportState, setReportState] = useMergeState({
    visible: false, //????????????????????????
    reportOrgId: 0, //????????????id
    allowImportSet: 0,
    getTemplateId: 0, //??????id
    templateType: 0,
    reportOrgName: '', // ??????????????????
    selectTypeName: '', // ????????????
  })
  //???????????????
  const nowDates: string = getDateformat(0, currentTimeStamp)
  const [dateState, setDateState] = useMergeState({
    nowSelDay: nowDates, //?????????????????????????????????????????????
    nowMonth: nowDates, // ????????????????????????
    nowQuarter: nowDates, // ????????????????????????
    nowYears: nowDates, // ?????????????????????
    nowselectMonth: '',
    isNowMonth: false,
    nowSelMonth: getDateformat(2, currentTimeStamp),
    nowSelWeek: '', // ???????????????
    editSelTimeType: getDateformat(1, currentTimeStamp),
    nowYearsSingle: new Date(currentTimeStamp).getFullYear() + '', // ????????????????????????
  })

  //?????????????????????
  const [relationState, setRelationState] = useMergeState({
    typeTxt: '', // ????????????????????????
    visibleChatList: false, //??????????????????
    reportTotalElements: 10,
    okrTotalElements: 10, //??????okr O?????????
    activeTab: 'task_plan',
    loading: false,
    attach: [], // ?????? all
    pageNo: 0,
    pageSize: 10,
    total: 0,
    navList: [],
    authsObj: {},
  })

  // ?????????????????????????????????
  const [editReportUn, setEditReportUnChange] = useState({
    reportId: '',
    belongName: '',
    belongId: '',
    belongType: '',
    templateName: '',
    templateId: '',
    type: 0,
    allowImport: 1,
    userId: '',
    userName: '',
    reportStartTime: '',
    reportEndTime: '',
  })

  // ??????????????????
  const [selMemberOrg, setSelMemberOrg] = useState<any>({
    teamId: reportState.reportOrgId,
    sourceType: '', //????????????
    allowTeamId: [reportState.reportOrgId],
    selectList: [], //????????????????????????
    checkboxType: 'checkbox',
    permissionType: 3, //?????????????????????????????????
    showPrefix: false, //???????????????????????????
  })

  // ????????????
  const [addReportParam, setAddReportParam] = useState<any>({
    attach: [], //??????
    belongId: reportState.reportOrgId,
    belongName: reportState.reportOrgName,
    belongType: 2,
    contentModels: reportContent,
    reportTime: '',
    type: reportState.templateType,
    userAccount: nowAccount,
    userId: nowUserId,
    userName: nowUser,
    workReportUserModels: reportUserList, // ????????????
    copyUserModels: copyUserList, //????????????
    timingId: undefined, //?????????????????? ?????????
    timingDate: undefined, //?????????????????? ???????????????
    templateId: reportState.getTemplateId,
    projectGroupName: '',
    projectGroupIds: '',
    relationFile: [], //??????????????????
  })

  //???????????????????????????
  const [newFileList, setNewFileList] = useState<Array<any>>([])
  const [uploadVisible, setUploadVisible] = useState<boolean>(false)
  const [loadTime, setLoadTime] = useState<any>('')
  const [pageUuid, setPageUuid] = useState('')
  const [defaultFiles, setDefaultFiles] = useState<Array<any>>([])
  const [delFileIds, setDelFileIds] = useState<Array<any>>([])

  useEffect(() => {
    setPageUuid(Maths.uuid())
    // ????????????????????????
    loadLocales()
    //??????????????????????????????????????????????????????
    ipcRenderer.on('window-show', () => {
      setUploadVisible(false)
      // initReportParams()
    })
  }, [])
  // ??????????????????
  useEffect(() => {
    initReportParams()
    if (isReportType.wortReportType === 'create') {
      findAllCompanyApi({
        type: -1,
        userId: nowUserId,
        username: nowAccount,
      }).then((data: any) => {
        setCmpList(data)
        if (!isReportType.isEcho) {
          setReportState({
            reportOrgName: data[0].shortName,
            reportOrgId: data[0].id,
          })
        } else {
          data.map((item: any) => {
            if (item.id === isReportType.teamId) {
              setReportState({
                reportOrgName: item.shortName,
                reportOrgId: item.id,
              })
            }
          })
        }
      })
    } else if (isReportType.wortReportType === 'edit') {
      reportDetails(_editReportId, _editReportUserId)
    }
  }, [isReportType.wortReportTtime])

  // ?????????
  const initReportParams = () => {
    const spareContent = isReportType.spareContent
    // ?????????????????????????????????????????????????????????????????????
    if (typeof spareContent == 'undefined') {
      getCurrentTime().then((resData: number) => {
        initTime(resData)
      })
    } else {
      // ???????????????????????????????????????????????????????????????????????????????????????????????????
      //  ????????????json????????????????????????????????????????????????????????????
      if (!$tools.isJsonString(spareContent)) {
        getCurrentTime().then((resData: number) => {
          initTime(resData)
        })
      } else {
        // ???json?????????startTime???????????????
        const dataJson = JSON.parse(spareContent)
        initTime(new Date(dataJson.startTime).getTime())
      }
    }
    $store.dispatch({
      type: 'CHANGE_IS_IMPORT',
      data: { isImportReport: false },
    })
    // ????????????
    if (!NEWAUTH812) {
      const { authsObj, navList } = getNavMenu({ menuList: relateNavList })
      const matchObj = getMatchType(navList[0]?.key || 'task_plan')
      nowTabs.current = matchObj.current
      placeholerRel.current = matchObj.currentName
      setRelationState({
        attach: [],
        navList,
        authsObj,
        activeTab: navList[0]?.key,
      })
    }

    setReportContent([])
    setReportUserList([])
    setCopytUserList([])

    setRoomListSelCheck([])
    setReportState({
      reportOrgName: '',
      selectTypeName: '',
      reportOrgId: 0,
      templateType: 0,
      allowImportSet: 0,
      getTemplateId: 0,
    })
    fileModels = []
    setDefaultFiles([])
    setNewFileList([])
    setDelFileIds([])
  }

  function initTime(timeNum: number) {
    const currentTimeRes: any = getDateformat(0, timeNum)
    setCurrentTimeStamp(timeNum)
    setDateState({
      nowSelDay: currentTimeRes,
      nowMonth: currentTimeRes, // ????????????????????????
      nowQuarter: currentTimeRes, // ????????????????????????
      nowYears: currentTimeRes, // ?????????????????????
      nowselectMonth: '',
      isNowMonth: false,
      nowSelMonth: getDateformat(2, timeNum),
      nowSelWeek: '', // ???????????????
      editSelTimeType: getDateformat(1, timeNum),
      nowYearsSingle: new Date(timeNum).getFullYear() + '', // ????????????????????????
    })
  }

  // ??????????????????????????????
  const [detailsState, setDetailsState] = useState<any>({
    meetModalVisible: false, //????????????
    meetId: '',
    taskId: '',
    approvalId: '',
  })

  // ????????????
  const reportDetails = (rid: number, uid: number) => {
    editReport({
      reportId: rid,
      userId: uid,
      isMuc: 0,
    }).then((resData: any) => {
      const {
        belongName,
        belongType,
        userId,
        userName,
        reportId,
        belongId,
        templateName,
        type,
        allowImport,
        templateId,
        reportUsers,
        copyUsers,
        reportStartTime,
        reportEndTime,
        contentModels,
        files,
        fileReturnModels,
      } = resData.data
      setReportState({
        reportOrgName: belongName,
        reportOrgId: belongId,
        selectTypeName: templateName,
        templateType: type,
        allowImportSet: allowImport,
        getTemplateId: templateId,
      })
      // ???????????????????????????
      getMandatoryReporter(belongId, reportUsers)
      setCopytUserList(copyUsers)
      setRelationState({ attach: files })
      fileModels = files
      setDefaultFiles(fileReturnModels)
      setEditReportUnChange({
        reportId: reportId,
        belongName: belongName,
        belongId: belongId,
        belongType: belongType,
        templateName: templateName,
        templateId: templateId,
        type: type,
        allowImport: allowImport,
        userId: userId,
        userName: userName,
        reportStartTime: reportStartTime,
        reportEndTime: reportEndTime,
      })
      if (type === 0) {
        setDateState({
          nowSelDay: reportStartTime,
        })
      } else {
        setDateState({
          nowYearsSingle: reportStartTime.split('/')[0],
          editSelTimeType: reportStartTime,
        })
      }
      setRelationState({
        typeTxt: reportStartTime + '-' + reportEndTime,
      })
      setDateState({
        nowSelMonth: reportStartTime,
        nowSelWeek: reportStartTime + '-' + reportEndTime,
      })
      const StartTime = reportStartTime.split('/')
      const EndTime = reportEndTime.split('/')
      const _datas = StartTime[1] + '/' + StartTime[2] + ',' + EndTime[1] + '/' + EndTime[1]
      setDateState({ nowMonth: _datas })
      const _arr: any = []
      const importModel = contentModels.map((item: any, index: number) => {
        const newInfos = item.relationInfos.map((idx: any) => {
          _arr.push({
            configId: item.configId,
            relationId: idx.relationId,
            files: idx.files,
          })

          return {
            ...idx,
            relationId: idx.relationId,
            addRemark: idx.content ? true : false,
          }
        })
        return {
          ...item,
          hint: item.content?.replace($tools.regSpace1, ' '),
          newId: item.id,
          id: item.configId,
          title: item.configTitle,
          relationInfos: newInfos,
          editInput: index == 0 ? true : false,
        }
      })
      setReportContent(importModel)

      setAddReportParam({
        ...addReportParam,
        relationFile: _arr,
      })
    })
  }

  useEffect(() => {
    if (isReportType.wortReportType === 'create') {
      const reportTeamId = !isReportType.isEcho ? reportState.reportOrgId : isReportType.teamId
      if (reportTeamId != 0) {
        // ????????????????????????????????????
        getReportTemplate(reportTeamId).then(data => {
          setList(data)
          $store.dispatch({ type: 'WORKREPORT_ALLOWIMPORTSET', data: data[0].allowImport + '' })
          setRelationState({ attach: [] })
          // ?????????????????????????????????
          if (isReportType.isEcho) {
            data.map(item => {
              if (item.templateId === isReportType.reportTemplateId) {
                setReportState({
                  getTemplateId: item.templateId,
                  allowImportSet: item.allowImport,
                  selectTypeName: item.name,
                  templateType: item.type,
                })
              }
            })
          } else {
            setReportState({
              getTemplateId: data[0].templateId,
              allowImportSet: data[0].allowImport,
              selectTypeName: data[0].name,
              templateType: data[0].type,
            })
          }
          // ????????????id?????????????????????????????????????????????
          findRelationUser(
            reportTeamId,
            !isReportType.isEcho ? data[0].templateId : isReportType.reportTemplateId
          ).then(data => {
            const _datas: any = []
            data.map((item: any) => {
              _datas.push({
                userId: item.id,
                username: item.name,
                profile: item.profile,
                forceReportUser: true,
                disable: true,
                curId: item.id,
              })
            })
            // setMandatoryReporter(_datas)
            setReportUserList(_datas)
          })
        })
      }
    }
    if (NEWAUTH812 && reportState.reportOrgId) {
      getTeamAuthList({ typeId: reportState.reportOrgId })
    }
  }, [reportState.reportOrgId])

  // ????????????????????????????????????
  useEffect(() => {
    if (reportState.getTemplateId != 0 && isReportType.wortReportType === 'create') {
      findTemplate({
        reportOrgId: reportState.reportOrgId,
        templateType: reportState.templateType,
        getTemplateId: reportState.getTemplateId,
      }).then(data => {
        //??????????????????????????????
        setReportContent([])
        setReportState({ allowImportSet: data[0].templateModel.allowImport })
        const hasFirstArr = data.filter((item, index) => item.relationTask === 1 && index === 0)
        if (hasFirstArr.length !== 0) {
          setReportState({ visible: true })
          const matchObj = getMatchType(relationState.navList[0]?.key || 'task_plan')
          nowRelationTemp.current = hasFirstArr[0].id
          nowTabs.current = matchObj.current
          placeholerRel.current = matchObj.currentName
          queryRelationList()
        } else {
          setReportState({ visible: false })
        }
        // ??????????????????????????????????????????????????????
        const newData = data?.map((item: any, i: number) => {
          let isActive = false
          let isOpenList = false
          if (item.relationTask === 1 && i === 0) {
            isActive = true
            isOpenList = true
          }
          // placeholder ???????????????
          return {
            ...item,
            isActive: isActive,
            isOpenList: isOpenList,
            placeholder: item.hint,
            hint: '',
            editInput: i == 0 ? true : false,
          }
        })

        //??????????????????????????????  ?????????????????????????????????????????????
        let reportMsg: any
        if (isReportType.wortReportType == 'edit') {
          reportMsg = localStorage.getItem('WORK_REPORT_EDIT_INFO')
        } else {
          reportMsg = localStorage.getItem('WORK_REPORT_CREATE_INFO')
        }
        const storageReport = JSON.parse(reportMsg)
        const { isEdit, list } = checkIsEdit()
        if (reportMsg && storageReport.length > 0 && isEdit) {
          //????????????????????????????????????
          if (list.length === newData.length) {
            // relationTask required inputBox ??????????????????????????????????????????????????????????????????????????????????????????????????????
            checkModuleItem(list, newData)
            setReportContent(list)
          } else {
            const newList: Array<ReportContentListProps> = setNewTemp(list, newData) || []
            checkModuleItem(newList, newData)
            setReportContent(newList)
          }
        } else {
          setReportContent(newData)
        }
        $store.dispatch({ type: 'WORKREPORT_ALLOWIMPORTSET', data: data[0].templateModel.allowImport + '' })
      })
    } else if (reportState.getTemplateId != 0 && isReportType.wortReportType === 'edit') {
      const hasRelation = reportContent.filter((item, index) => item.relationTask === 1 && index === 0)
      if (hasRelation.length !== 0) {
        nowRelationTemp.current = hasRelation[0].id
        nowTabs.current = 1
        setReportState({ visible: true })
        queryRelationList()
      }
    }
  }, [reportState.getTemplateId])

  useEffect(() => {
    queryRelationList()
  }, [relationState.pageNo, relationState.pageSize, relationState.activeTab])

  const getMandatoryReporter = (id: any, val: any) => {
    // ????????????id????????????????????????
    findRelationUser(id, reportState.getTemplateId).then((data: any) => {
      const newData: any = [...val]
      const _data: any = data
      newData.forEach((item: any) => {
        item.disable = data.some((res: any) => res.id === item.userId)
      })
      _data.forEach((items: any) => {
        items.userId = items.id
        items.curId = items.id
      })
      setMandatoryReporter(_data)
      setReportUserList(newData)
    })
  }
  //?????????????????????????????????????????????????????????
  const checkIsEdit = () => {
    let isEdit = false
    let list: Array<ReportContentListProps> = []
    const reportMsg = getReportMsg()
    const storageReport = JSON.parse(reportMsg)
    if (reportMsg && storageReport.length > 0) {
      for (let i = storageReport.length; i--; ) {
        const { orgId, templateId, content, userId } = storageReport[i]
        if (
          orgId == reportState.reportOrgId &&
          templateId == reportState.getTemplateId &&
          userId == nowUserId
        ) {
          isEdit = true
          list = content
          break
        }
      }
    }
    return {
      isEdit: isEdit,
      list: list,
    }
  }
  // ???????????????????????????????????????
  const getTeamAuthList = async ({ typeId }: any) => {
    reportAuthList = await findAuthList({ typeId })
    const { authsObj, navList } = getNavMenu({ menuList: relateNavList })
    const matchObj = getMatchType(navList[0]?.key || 'task_plan')
    nowTabs.current = matchObj.current
    placeholerRel.current = matchObj.currentName
    setRelationState({
      attach: [],
      navList,
      authsObj,
      activeTab: navList[0]?.key,
    })
  }
  const checkModuleItem = (arr: Array<any>, ajaxData: Array<any>) => {
    arr.map(item => {
      const { state, required, inputBox, relationTask } = checkTempItem(ajaxData, item)
      if (state) {
        item.required = required
        item.inputBox = inputBox
        item.relationTask = relationTask
      }
    })
  }

  const getReportMsg = () => {
    //????????????localStorage????????????????????????????????????????????????
    //???????????????????????????????????????PUSH???????????????????????????
    let reportMsg: any = ''
    if (isReportType.wortReportType == 'edit') {
      reportMsg = localStorage.getItem('WORK_REPORT_EDIT_INFO')
    } else {
      reportMsg = localStorage.getItem('WORK_REPORT_CREATE_INFO')
    }
    return reportMsg
  }

  //?????????????????????????????????????????????????????? relationTask  required inputBox
  const checkTempItem = (data: Array<any>, lItem: any) => {
    let temp = false
    let relationTask = 0
    let required = 0
    let inputBox = 0
    for (let i = data.length; i--; ) {
      if (data[i].id === lItem.id) {
        if (
          lItem.relationTask !== data[i].relationTask ||
          lItem.required !== data[i].required ||
          lItem.inputBox !== data[i].inputBox
        ) {
        }
        temp = true //?????????????????????
        relationTask = data[i].relationTask
        required = data[i].required
        inputBox = data[i].inputBox
        break
      }
    }
    return {
      state: temp,
      required: required,
      inputBox: inputBox,
      relationTask: relationTask,
    }
  }
  //???????????????????????????
  const setNewTemp = (list: Array<any>, data: Array<any>) => {
    const reportMsg = getReportMsg()
    const storageReport: Array<any> = JSON.parse(reportMsg)
    //????????????????????????????????????
    let newList: Array<ReportContentListProps> = []
    storageReport.map((item: any) => {
      const { orgId, templateId, userId } = item
      const { reportOrgId, getTemplateId } = reportState
      if (orgId == reportOrgId && templateId == getTemplateId && nowUserId == userId) {
        if (data.length > list.length) {
          const newArr = []
          //?????????
          for (let i = 0; i < data.length; i++) {
            if (!checkIsIn(list, data[i].id)) {
              newArr.push(data[i])
            }
          }
          item.content = item.content.concat(newArr) //????????????????????????????????????
        } else {
          const _list = list
          for (let i = 0; i < _list.length; i++) {
            if (!checkIsIn(data, _list[i].id)) {
              _list.splice(i, 1)
            }
          }
          item.content = _list //????????????????????????????????????
        }
        newList = item.content
      }
    })

    if (isReportType.wortReportType == 'edit') {
      localStorage.setItem('WORK_REPORT_EDIT_INFO', JSON.stringify(storageReport))
    } else {
      localStorage.setItem('WORK_REPORT_CREATE_INFO', JSON.stringify(storageReport))
    }
    return newList
  }

  //??????????????????
  const checkIsIn = (list: Array<any>, id: any) => {
    let flag = false
    for (let i = list.length; i--; ) {
      if (id === list[i].id) {
        flag = true
        break
      }
    }
    return flag
  }
  //??????????????????????????????????????????
  const clearItemStorage = () => {
    const reportMsg = getReportMsg()
    // ???????????????????????????
    if (!reportMsg) {
      return
    }
    const storageReport: Array<any> = JSON.parse(reportMsg)
    for (let i = storageReport.length; i--; ) {
      const { orgId, templateId, userId } = storageReport[i]
      const { reportOrgId, getTemplateId } = reportState
      if (orgId == reportOrgId && templateId == getTemplateId && nowUserId == userId) {
        storageReport.splice(i, 1)
        break
      }
    }
    if (isReportType.wortReportType == 'edit') {
      localStorage.setItem('WORK_REPORT_EDIT_INFO', JSON.stringify(storageReport))
    } else {
      localStorage.setItem('WORK_REPORT_CREATE_INFO', JSON.stringify(storageReport))
    }
  }
  // ??????????????????
  const queryRelationList = (type?: string) => {
    return new Promise<RelationContentProps[]>(() => {
      const relationsIds: number[] = []
      let geturl = ''
      reportContent.map(item => {
        item.relationInfos?.map(idx => {
          relationsIds.push(idx.id || idx.relationId)
        })
      })

      const param: any = {
        keyWords: searchVal.current,
        pageNo: type === 'setPageNo' ? 0 : relationState.pageNo,
        pageSize: relationState.pageSize,
        relationIds: relationsIds,
        userId: nowUserId,
      }
      if (nowTabs.current === 1) {
        // ????????????????????????
        geturl = '/task/workReport/relevanceTasks'
        param.ascriptionId = reportState.reportOrgId
        param.ascriptionType = 2
        // setRelationState({ activeTab: 'task_plan' })
      } else if (nowTabs.current === 4) {
        // ????????????????????????
        param.belongId = reportState.reportOrgId
        geturl = '/approval/approval/workReportRelationApprovalPage'
      } else if (nowTabs.current === 2) {
        // ????????????????????????
        param.belongId = reportState.reportOrgId
        geturl = '/public/meeting/workReportRelationMeetingPage'
      } else if (nowTabs.current === 5) {
        // ??????OKR??????
        geturl = '/task/workReport/relevanceOkr'
        param.ascriptionType = 2
        param.ascriptionId = reportState.reportOrgId
      }

      if (newRelationId.current) {
        param.newRelationId = newRelationId.current
      }
      setRelationState({ loading: true })
      getDataList(geturl, param).then((resData: any) => {
        let content: any[] = []
        let totalElements = 0
        let okrTotalElements = 0
        if (nowTabs.current === 5) {
          content = resData.data.value.content
          okrTotalElements = resData.data.value.totalElements
          totalElements = resData.data.key
        } else {
          content = resData.data.content
          totalElements = resData.data.totalElements
        }
        if (nowTabs.current === 1) {
          setTaskList(content)
        } else if (nowTabs.current === 4) {
          setAprovalList(content)
        } else if (nowTabs.current === 2) {
          setMettingList(content)
        } else {
          setOKRList(content)
        }
        setRelationState({
          reportTotalElements: totalElements,
          okrTotalElements,
        })
        if (type === 'isRelation') {
          // ??????
          const relationData = resData.dataList.map((item: any) => {
            let relationName
            let id
            let username
            let borderClass
            let userprofile = item.userProfile
            const addRemark = false
            if (nowTabs.current === 1) {
              relationName = item.taskName
              id = item.taskId
              username = item.executorUsername
              userprofile = item.executorUserProfile
              borderClass = true
            } else if (nowTabs.current === 4) {
              relationName = item.approvalTitle
              id = item.approvalId
              username = item.userName
              userprofile = item.userProfile
            } else if (nowTabs.current === 2) {
              relationName = item.name
              id = item.id
              username = ''
              userprofile = ''
            } else if (nowTabs.current === 5) {
              // ??????okr??????
              relationName = item.taskName
              id = item.taskId
              username = item.userName
              userprofile = item.userProfile
              borderClass = true
            }
            return {
              relationId: id,
              relationName: relationName,
              userName: username,
              userProfile: userprofile,
              addRemark: addRemark,
              borderClass: borderClass,
              ...item,
            }
          })
          const newReportContent = reportContent.map(item => {
            if (item.id === nowRelationTemp.current) {
              item.relationInfos
                ? item.relationInfos.push({
                    ...relationData[0],
                    relationType: nowTabs.current,
                  })
                : (item.relationInfos = [
                    {
                      ...relationData[0],
                      relationType: nowTabs.current,
                    },
                  ])
            }
            return item
          })
          setReportContent(newReportContent)
        } else if (type === 'unRelation') {
          unRelation(param.newRelationId)
        } else if (type === 'changeRelationBtn') {
          // ??????????????????
          const newData = reportContent?.map((item: any) => {
            // let isActive = false
            if (item.id === nowRelationTemp.current && item.isActive) {
              item.isActive = false
              setReportState({ visible: false })
            } else if (item.id === nowRelationTemp.current && !item.isActive) {
              item.isActive = true
              setReportState({ visible: true })
            } else if (item.id !== nowRelationTemp.current) {
              item.isActive = false
            }
            return {
              isActive: item.isActive,
              isOpenList: item.isOpenList,
              ...item,
            }
          })
          setReportContent(newData)
        }

        //????????????
        setRelationState({
          loading: false,
          pageNo: type === 'setPageNo' ? 0 : relationState.pageNo,
          pageSize: relationState.pageSize,
          total: resData.data.totalElements || 0,
        })
      })
    })
  }

  //   ????????????
  const changeReportOrg = (value: string, option: any) => {
    setDateState({ nowSelDay: nowDates })
    setReportState({
      reportOrgName: value,
      reportOrgId: parseInt(option.key),
    })
    setRelationState({ activeTab: 'task_plan' })
    setCopytUserList([])
    $store.dispatch({ type: 'WORKREPORT_GET_TEAM_ID', data: option.key })
  }

  // ??????????????????
  const changeReportType = (val: string, option: any) => {
    const { type, value, key } = option
    $store.dispatch({ type: 'REPORTTYPE', data: type })
    $store.dispatch({ type: 'REPORTTYPENAME', data: value })
    $store.dispatch({ type: 'WORKREPORT_TEMPLATEID', data: key })
    setReportState({
      selectTypeName: val,
      getTemplateId: key,
      templateType: type,
    })
    setRelationState({ attach: [] })
    if (type == 5) {
      setDateState({ nowYears: nowDates })
    }
    if (type == 4) {
      setRelationState({
        typeTxt: dateState.nowYearsSingle + '/01/01-' + dateState.nowYearsSingle + '/12/31',
      })
    }
    // ????????????id????????????????????????
    findRelationUser(reportState.reportOrgId, key).then((data: any) => {
      const _datas: any = []
      data.map((item: any) => {
        _datas.push({
          userId: item.id,
          username: item.name,
          profile: item.profile,
          forceReportUser: true,
          disable: true,
          curId: item.id,
        })
      })
      setReportUserList(_datas)
    })
  }

  // ??????????????????
  const changeSendVal = (e: any, id: number) => {
    const _id = id
    const newArr = reportContent.map((item: any) => {
      if (item.id === Number(_id)) {
        item.hint = e
      }
      return item
    })
    setReportContent(newArr)
    const _localNewArr = reportContent.map((item: any) => {
      if (item.id === Number(_id)) {
        item.hint = e.replace($tools.regSpace1, '  ')
      }
      return item
    })
    const reportMsg = getReportMsg()
    const { isEdit } = checkIsEdit()
    const storageReport: any[] = JSON.parse(reportMsg)
    if (reportMsg) {
      if (storageReport.length > 0 && isEdit) {
        storageReport.forEach((item: any) => {
          if (
            item.orgId == reportState.reportOrgId &&
            item.templateId == reportState.getTemplateId &&
            item.userId == nowUserId
          ) {
            item.content = _localNewArr
          }
        })
      } else {
        storageReport.push({
          userId: nowUserId,
          orgId: reportState.reportOrgId,
          templateId: reportState.getTemplateId,
          content: _localNewArr,
        })
      }
      // localStorage.setItem('REPORT_USER', JSON.stringify(nowUserId))
      // localStorage.setItem('WORK_REPORT_INFO', JSON.stringify(storageReport))
      if (isReportType.wortReportType == 'edit') {
        localStorage.setItem('WORK_REPORT_EDIT_INFO', JSON.stringify(storageReport))
      } else {
        localStorage.setItem('WORK_REPORT_CREATE_INFO', JSON.stringify(storageReport))
      }
    } else {
      // localStorage.setItem('REPORT_USER', JSON.stringify(nowUserId))
      if (isReportType.wortReportType == 'edit') {
        localStorage.setItem(
          'WORK_REPORT_EDIT_INFO',
          JSON.stringify([
            {
              userId: nowUserId,
              orgId: reportState.reportOrgId,
              templateId: reportState.getTemplateId,
              content: _localNewArr,
            },
          ])
        )
      } else {
        localStorage.setItem(
          'WORK_REPORT_CREATE_INFO',
          JSON.stringify([
            {
              userId: nowUserId,
              orgId: reportState.reportOrgId,
              templateId: reportState.getTemplateId,
              content: _localNewArr,
            },
          ])
        )
      }
    }
  }

  useEffect(() => {
    const ele = document.getElementById('report_temp_container')
    ele?.addEventListener('click', showImg)
    return () => {
      window.removeEventListener('click', showImg)
    }
  }, [])
  const showImg = (e: any) => {
    if (e.target.className === 'img_box') {
      const targetSrc = e.target.getAttribute('datasrc')
      const ele = document.getElementsByClassName('img_box')
      const arr = []
      for (let i = 0; i < ele.length; i++) {
        const src = ele[i].getAttribute('datasrc')
        if (targetSrc === src) {
        }
        arr.push(src || '')
      }
    }
  }

  //??????????????????
  const timePickerChange = (_dates: any, date: any) => {
    setDateState({ nowSelDay: date })
  }
  // ??????????????????????????????????????????
  const disabledDate = (current: any) => {
    return current && current > moment().endOf('day')
  }

  const getShareRoomList = () => {
    setRelationState({ visibleChatList: true })
  }

  const setSelectGroup = (dataValue: any) => {
    setRelationState({ visibleChatList: false })
    dataValue.forEach((item: any) => {
      item.subject = item.name
      item.icon = item.profile
      if (item.type === 3) {
        item.id = item.userId
      }
    })
    setRoomListSelCheck(dataValue)
  }

  const delShareItem = (id: string) => {
    const result = roomListSelCheck.filter((item: any) => {
      return item.id !== id
    })
    setRoomListSelCheck(result)
  }

  const handleCancel = () => {
    setRelationState({ visibleChatList: false })
  }

  const hideImportPop = () => {
    $store.dispatch({ type: 'CHANGE_IS_IMPORT', data: { isImportReport: !isImportReport } })
  }

  const onSearchs = (value: any) => {
    searchVal.current = value
    queryRelationList()
  }

  const setListRoleHtml = (type: number) => {
    switch (Number(type)) {
      case 1:
        return <span className="myTaskRoleBox my_assign">????????????</span>
      case 4:
        return (
          <span className="myTaskRoleBox my_execute" style={{ display: 'flex', alignItems: 'center' }}>
            ????????????
          </span>
        )
      case 5:
        return <span className="myTaskRoleBox my_leader">????????????</span>
      case 6:
        return <span className="myTaskRoleBox my_supervise">????????????</span>
    }
  }

  const taskExcuteStatus = (type: number) => {
    switch (Number(type)) {
      case 0:
        // ?????????
        return <span className="set_bg status_gray">?????????</span>
      case 1:
        // ?????????
        return <span className="set_bg status_blue">?????????</span>
      case 2:
        // ??????
        return <span className="set_bg status_green">??????</span>
      case 3:
        // ?????????
        return <span className="set_bg status_red">?????????</span>
      case 4:
        // ?????????
        return <span className="set_bg status_yellow">?????????</span>
      default:
        return <span className="set_bg status_gray">??????</span>
    }
  }

  /**
   * ????????????
   * status
   *  0 ?????????
   *  1 ??????
   *  2 ??????
   *  3 ??????
   *  4 ??????
   *  5 ??????
   *  6 ????????????
   *  7 ????????????
   *  8 ????????????
   *  9 ????????????
   *  10 ????????????
   */
  const getApprovalStatus = (type: number) => {
    // ??????????????????
    switch (Number(type)) {
      case 0:
        return <span className="taskType status_yellow">?????????</span>
      case 1:
        return <span className="taskType status_green">???????????????</span>
      case 2:
        return <span className="taskType status_red">???????????????</span>
      case 3:
        return <span className="taskType status_blue">??????</span>
      case 4:
        return <span className="taskType status_red">?????????</span>
      case 5:
        return <span className="taskType status_red">??????</span>
      case 6:
        return <span className="taskType status_blue">????????????</span>
      case 7:
        return <span className="taskType status_yellow">????????????</span>
      case 8:
        return <span className="taskType status_blue">??????</span>
      case 9:
        return <span className="taskType status_blue">????????????</span>
      case 10:
        return <span className="taskType status_yellow">????????????</span>
    }
  }

  const getMeetingStatus = (proceed: number, joinStatus: number, status: number) => {
    //???????????? 0????????? 1????????? 2????????? 3?????????
    if (Number(proceed) == 0) {
      return <span className="status_yellow">?????????</span>
    } else if (Number(proceed) == 2) {
      return <span className="status_blue">?????????</span>
    } else if (Number(proceed) == 3) {
      return <span className="status_green">?????????</span>
    }
    if (Number(joinStatus) == 2) {
      //??????
      return <span className="status_yellow">?????????</span>
    }
    if (Number(status) == 0) {
      return <span className="status_red">?????????</span>
    }
    //?????????
    if (Number(status) == 2) {
      return <span className="status_yellow">?????????</span>
    }
  }

  const getMatchType = (tabCode: string) => {
    let current = 1,
      currentName = '????????????'
    switch (tabCode) {
      case 'task_plan':
        break
      case 'relation_approval':
        current = 4
        currentName = '????????????'
        break
      case 'relation_metting':
        current = 2
        currentName = '????????????'
        break
      case 'relation_okr':
        current = 5
        currentName = 'okr??????'
        break
    }
    return { current, currentName }
  }

  const tabChange = (tabCode: any) => {
    switch (tabCode) {
      case 'task_plan':
        nowTabs.current = 1
        placeholerRel.current = '????????????'
        break
      case 'relation_approval':
        nowTabs.current = 4
        placeholerRel.current = '????????????'
        break
      case 'relation_metting':
        nowTabs.current = 2
        placeholerRel.current = '????????????'
        break
      case 'relation_okr':
        nowTabs.current = 5
        placeholerRel.current = 'okr??????'
        break
    }
    setRelationState({
      activeTab: tabCode,
      pageNo: 0,
    })
  }

  // ????????????
  const onRelation = (value: any) => {
    const rid = value.target.id
    let _type = value.target.value
    newRelationId.current = rid
    let isRelationType = 'isRelation'
    if (value.target.checked) {
      isRelationType = 'isRelation'
    } else {
      isRelationType = 'unRelation'
    }
    if (_type == 'task_plan') {
      nowTabs.current = 1
    } else if (_type == 'relation_approval') {
      nowTabs.current = 4
    } else if (_type == 'relation_metting') {
      nowTabs.current = 2
    } else if ((_type = 'relation_okr')) {
      nowTabs.current = 5
    }
    queryRelationList(isRelationType)
  }

  // ????????????
  const unRelation = (newID: number) => {
    const newReportContent = reportContent.map(item => {
      const relationInfos: any[] = item.relationInfos || []
      relationInfos.map((idx: any, i: number) => {
        if (idx.relationId === newID) {
          relationInfos.splice(i, 1)
        }
      })
      return item
    })
    setReportContent(newReportContent)
  }
  // ?????????????????????????????????????????????
  const isChecked = (id: number) => {
    let isIn = false
    reportContent.map(item => {
      item.relationInfos?.map(idx => {
        if (idx.relationId === id) {
          isIn = true
          return false
        }
      })
    })
    return isIn
  }

  //?????????????????????
  const importLastreport = () => {
    setLoading(true)
    return new Promise<ImportListProps[]>(() => {
      const param: any = {
        teamId: reportState.reportOrgId,
        type: reportState.templateType,
        userId: nowUserId,
      }
      reportState.templateType === 5 ? (param.templateId = reportState.getTemplateId) : ''
      importLastReport(param).then(
        (resData: any) => {
          // ???????????????
          const _datas: any = []
          if (resData.data == null) {
            message.success('????????????')
            $store.dispatch({ type: 'CHANGE_IS_IMPORT', data: { isImportReport: !isImportReport } })
            setLoading(false)
            return false
          }
          if (resData.data) {
            resData.data.reportUserList?.map((item: any) => {
              _datas.push({
                userId: item.userId,
                username: item.username,
                profile: item.profile,
                forceReportUser: false,
                disable: mandatoryReporter.some((res: any) => res.userId === item.userId),
              })
            })
            setReportUserList(_datas)
            // ???????????????
            setCopytUserList(resData.data.copyUserList)
            // ??????????????????
            let importModel: any = []
            resData.dataList.map((item: any) => {
              importModel = reportContent.map((ritem: any) => {
                ritem.relationInfos = []
                if (ritem.id === item.configId) {
                  ritem.hint = item.content
                }
                return ritem
              })
            })
            // setReportContent(importModel)
            setRelationState({ attach: [] })
            fileModels = []
            setDefaultFiles([])
            setNewFileList([])
            setDelFileIds([])
            $store.dispatch({ type: 'CHANGE_IS_IMPORT', data: { isImportReport: !isImportReport } })
            setLoading(false)
            const reportMsg = getReportMsg()
            const storageReport = JSON.parse(reportMsg)
            const { isEdit, list } = checkIsEdit()
            // ????????????????????????????????????????????????
            if (reportMsg && storageReport.length > 0 && isEdit) {
              //????????????????????????????????????
              if (list.length === importModel.length) {
                // relationTask required inputBox ??????????????????????????????????????????????????????????????????????????????????????????????????????
                checkModuleItem(list, importModel)
              } else {
                const newList: Array<ReportContentListProps> = setNewTemp(list, importModel) || []
                checkModuleItem(newList, importModel)
              }
            }
            setReportContent(importModel)
            for (let i = importModel.length; i--; ) {
              changeSendVal(importModel[i].hint, importModel[i].id)
            }
          }
        },
        () => {
          setLoading(false)
        }
      )
    })
  }
  //??????????????????
  const lookTaskDetail = (item: any) => {
    //????????????????????????????????????????????????

    let isaddtask = ''
    if (item.status == 1) {
      isaddtask = 'okr_draft'
    }

    const param = detailParam({
      visible: true,
      taskId: item.taskId,
      taskType: item.planType ? 'okr' : '',
      taskData: { taskId: item.taskId, from: 'workReport' },
      isaddtask,
    })
    detailModalRef.current.setState(param)
  }

  const showDetails = (type: string, id: number | string, item?: any) => {
    setDetailsState({
      meetModalVisible: false, //????????????
      // taskModalVisible: false, //????????????
      meetId: '',
      taskId: '',
      approvalId: '',
    })

    if (type === 'task') {
      // setDetailsState({
      //   ...detailsState,
      //   taskModalVisible: true,
      //   taskId: id,
      // })
      lookTaskDetail(item)
    }
    if (type === 'meet') {
      setDetailsState({
        ...detailsState,
        meetModalVisible: true,
        meetId: id,
      })
    }

    if (type === 'approval') {
      //??????????????????
      $store.dispatch({
        type: 'SET_OPERATEAPPROVALID',
        data: { isQueryAll: false, ids: id },
      })
      $tools.createWindow('ApprovalOnlyDetail')
    }
  }
  // ??????????????????????????????
  // const showInputLine = (e: any) => {
  //   setBorderClass(true)
  // }
  // // ??????????????????????????????
  // const hideInputLine = (e: any) => {
  //   if (e.target.value != '') {
  //     setBorderClass(false)
  //     // ??????????????????
  //     e.target.blur()
  //   } else {
  //     setBorderClass(true)
  //   }
  // }

  const delUser = (type: number, userId: number) => {
    if (type === 0) {
      // ????????????
      reportUserList.forEach((item: any, i: number) => {
        if (item.userId === userId) {
          reportUserList.splice(i, 1)
        }
      })
      setReportUserList([...reportUserList])
    } else {
      // ????????????
      copyUserList.map((item: any, i: number) => {
        if (item.userId === userId) {
          copyUserList.splice(i, 1)
          return
        }
      })
      setCopytUserList([...copyUserList])
    }
  }

  const selReportUser = (type: number) => {
    const setList: any = []
    const unSelectUser: any = []
    const notInIds: any = []
    if (type === 0) {
      // ????????????
      reportUserList.map((item: any) => {
        setList.push({
          curId: item.userId,
          curName: item.username,
          curType: 0,
          disable: item.disable || false,
          profile: item.profile,
        })
      })
      copyUserList.map((item: any) => {
        unSelectUser.push({
          curId: item.userId,
          curName: item.username,
          curType: 0,
          disable: item.disable || false,
          profile: item.profile,
          userId: item.userId,
        })
      })
    } else {
      // ????????????
      copyUserList.map((item: any) => {
        setList.push({
          curId: item.userId,
          curName: item.username,
          curType: 0,
          disable: item.disable || false,
          profile: item.profile,
        })
        notInIds.push(item.userId)
      })
      reportUserList.map((item: any) => {
        unSelectUser.push({
          curId: item.userId,
          curName: item.username,
          curType: 0,
          disable: item.disable || false,
          profile: item.profile,
          userId: item.userId,
        })
        notInIds.push(item.userId)
      })
    }
    setSelMemberOrg({
      ...selMemberOrg,
      selectList: setList,
      teamId: reportState.reportOrgId,
      allowTeamId: [reportState.reportOrgId],
      sourceType: type == 0 ? 'report' : 'copy',
      disableList: unSelectUser,
      notInIds: notInIds,
      type: 0,
    })
    setMemberOrgShow(true)
  }
  const selMemberSure = (dataList: any, info: { sourceType: string }) => {
    const _datas: any = []
    dataList.map((item: any) => {
      if (info.sourceType != 'report' && item.disable) {
        return
      }
      _datas.push({
        userId: item.curId,
        username: item.curName,
        profile: item.profile,
        forceReportUser: item.forceReportUser ? item.forceReportUser : false,
        disable: item.disable || false,
      })
      if (info.sourceType == 'report') {
        setReportUserList(_datas)
      } else if (info.sourceType == 'copy') {
        setCopytUserList(_datas)
      }
    })
  }

  // ??????????????????????????????
  const changeRelationParam = (type: string, configId: number, relationId: string, value?: string | number) => {
    const newArr = reportContent.map((item: any, index: number) => {
      // ??????id
      if (item.id === configId) {
        const changeRelation = item.relationInfos.map((idx: any) => {
          // ??????id
          if (idx.relationId == Number(relationId)) {
            // ???????????????
            const lastProcess = idx.process
            // ?????????????????????
            const lastProcessStatus = idx.processStatus
            const lastCci = Number(idx.cci)

            if (type === 'process') {
              let _val = value
              if (Number(_val) > 100) {
                _val = '100'
                message.error('????????????100')
              }
              if (Number(_val) < 0) {
                _val = ''
              }
              idx.processNew = _val
              idx.lastProcess = lastProcess
            }
            if (type == 'processStatus') {
              idx.processStatusNew = value
              idx.lastProcessStatus = lastProcessStatus
            }
            if (type === 'content') {
              idx.content = value
            }
            if (type === 'remark') {
              idx.addRemark = true
            }
            if (type === 'cci') {
              idx.newCci = value
              idx.lastCci = lastCci
            }
            if (type === 'line') {
              if (value === '') {
                idx.borderClass = true
              } else {
                idx.borderClass = false
              }
            }
          }
          return idx
        })
        item.relationInfos = changeRelation
      }
      return item
    })
    setReportContent(newArr)
  }

  const delRemark = (configId: number, relationId: string) => {
    $.each(addReportParam.relationFile, (i, item) => {
      if (item.configId === configId && item.relationId === relationId) {
        addReportParam.relationFile.splice(i, 1)
        return false
      }
    })
    const newArr = reportContent.map((item: any) => {
      // ??????id
      if (item.id === configId) {
        const changeRelation = item.relationInfos.map((idx: any) => {
          // ??????id
          if (idx.relationId == Number(relationId)) {
            idx.content = ''
            idx.addRemark = false
            idx.files = []
          }
          return idx
        })
        item.relationInfos = changeRelation
      }
      return item
    })
    setReportContent(newArr)
  }

  // ??????????????????????????????
  const checkVal = (str: string) => {
    let num = 0
    let _val = str
    const reg = /<p>(&nbsp;|&nbsp;\s+)+<\/p>|<p>(<br>)+<\/p>/g
    while (num < _val.length && _val != '') {
      num++
      const k = _val.match(reg)
      if (k) {
        _val = _val.replace(k[0], '')
      }
    }
    return _val == ''
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
      sendUserId: nowUserId,
      userIds: _userids,
      id: _ids,
      // content: {
      //   message: '',
      //   subType: 8,
      //   quoteMsg: '',
      //   time: timestamp,
      // },
    }
    return transposeMessageModel
  }

  // ??????????????????
  const addWorkReport = () => {
    // ??????????????????
    const contentObj: any = []
    // ??????????????????
    for (const i in reportContent) {
      const _val = checkVal(reportContent[i].hint)
      if (reportContent[i].required === 1 && _val) {
        message.error('????????????????????????')
        return false
      }
    }
    // ???????????????
    if (reportUserList.length === 0) {
      message.error('?????????????????????')
      return false
    }
    // ????????????okr ????????????ids
    const relationOkrIds: number[] = []
    reportContent.map((item: any) => {
      const userModels = getAtUsers({ content: item.hint || '' })
      const _userId = []
      if (userModels && userModels.length > 0) {
        for (const i in userModels) {
          _userId.push(userModels[i].id)
        }
      }
      const modalData: any = {
        configId: item.id, //??????id
        configTitle: item.title, //????????????
        content: item.hint, //??????
        relationInfos: [],
        atUserIds: _userId,
      }
      if (item.hasOwnProperty('newId') && item.newId) {
        modalData.id = item.newId
      }
      const relationInfos: any = modalData.relationInfos
      item.relationInfos?.map((relation: any) => {
        const relationData: any = {
          content: relation.content ? relation.content : '',
          files: getRelationFiles(item.id, relation.relationId).file,
          temporaryId: getRelationFiles(item.id, relation.relationId).temporaryId,
          fileGuidList: getRelationFiles(item.id, relation.relationId).fileGuidList,
          lastProcess: relation.lastProcess ? relation.lastProcess : relation.process,
          process: relation.processNew ? relation.processNew : relation.process,
          lastProcessStatus: relation.lastProcessStatus ? relation.lastProcessStatus : relation.processStatus,
          processStatus:
            relation.processStatusNew !== undefined ? relation.processStatusNew : relation.processStatus,
          relationId: relation.relationId,
          relationType: relation.relationType,
          meetingRoomName: relation.relationName,
        }
        // ??????????????????
        if (relation.planType == 3) {
          relationData.cci = relation.newCci !== undefined ? relation.newCci : relation.cci
          relationData.lastCci = relation.lastCci !== undefined ? relation.lastCci : relation.cci
        }
        // ??????Okr/?????? ids
        if (relation.relationType == 1 || relation.relationType == 5) {
          relationOkrIds.push(relation.taskId)
        }

        if (relation.hasOwnProperty('id') && relation.id) {
          relationData.id = relation.id
        }
        relationInfos.push(relationData)
      })
      contentObj.push(modalData)
    })
    let reportTime = dateState.nowYears
    if (reportState.templateType === 0) {
      // ??????
      reportTime = dateState.nowSelDay
    } else if (reportState.templateType === 1) {
      // ??????
      reportTime = dateState.nowSelWeek.split('-')[0]
    } else if (reportState.templateType === 2) {
      //???????????????
      reportTime = dateState.nowYearsSingle + '/' + dateState.nowMonth.split(',')[0]
    } else if (reportState.templateType === 3) {
      reportTime = dateState.nowYearsSingle + '/' + dateState.nowQuarter.split(',')[0]
    } else if (reportState.templateType === 4) {
      reportTime = dateState.nowYearsSingle + '/01/01'
    } else if (reportState.templateType === 5) {
      reportTime = dateState.nowYears
    }
    // ????????????
    addReportParam.belongId = reportState.reportOrgId
    addReportParam.belongName = reportState.reportOrgName
    addReportParam.contentModels = contentObj
    addReportParam.type = reportState.templateType
    addReportParam.workReportUserModels = reportUserList
    addReportParam.copyUserModels = copyUserList
    addReportParam.reportTime = reportTime
    addReportParam.templateId = reportState.getTemplateId
    addReportParam.attach = relationState.attach
    addReportParam.temporaryId = pageUuid //?????????????????????uuid
    addReportParam.fileGuidList = delFileIds //???????????????????????????ID
    if (isReportType.wortReportType === 'edit') {
      // ???????????????????????????id
      addReportParam.id = _editReportId
    } else {
      if (addReportParam.hasOwnProperty('id')) {
        delete addReportParam.id
      }
    }
    // ??????????????????????????????
    addReportParam.transposeMessageModel = packageShareData()
    setSendBtnLoading(true)
    sendAddWorkReport(addReportParam).then(
      () => {
        initReportParams()
        clearItemStorage()
        $store.dispatch({ type: 'REFRESH_REPORT_LIST', data: true })
        setTimeout(() => {
          ipcRenderer.send('close_work_report')
          ipcRenderer.send('refresh_operated_task_main', {
            sourceType: 'workReport',
            data: {
              taskIds: relationOkrIds,
            },
          })
          setSendBtnLoading(false)
        }, 1000)
        //????????????????????????push  ????????????
        ipcRenderer.send('update_unread_num', [''])
        //??????push??????
        const noticeType = isReportType.noticeType ? isReportType.noticeType : 'work_report_remind'
        ipcRenderer.send('handle_messages_option', [
          'work_report_remind',
          isReportType.reportTemplateId,
          noticeType,
        ])
      },
      (res: any) => {
        setSendBtnLoading(false)
        message.error(res.returnMessage)
      }
    )
  }

  // ??????????????????????????????
  const getRelationFiles = (configId: any, relationId: any) => {
    let _file: any = []
    let temporaryId: any = ''
    let fileGuidList: any = []
    $.each(addReportParam.relationFile, (i, item) => {
      if (item.configId === configId && item.relationId === relationId) {
        _file = item.files
        temporaryId = item.temporaryId
        fileGuidList = item.fileGuidList
        return
      }
    })
    return {
      file: _file,
      temporaryId: temporaryId,
      fileGuidList: fileGuidList,
    }
  }
  const changeWeek = (value: string) => {
    setDateState({ nowSelWeek: value })
  }

  const changeMonth = (value: string, nowSMonth: string) => {
    const _newVal = value.split(',')
    setRelationState({
      typeTxt: dateState.nowYearsSingle + '/' + _newVal[0] + '-' + dateState.nowYearsSingle + '/' + _newVal[1],
    })
    setDateState({
      nowMonth: value,
      nowselectMonth: nowSMonth,
      nowSelMonth: dateState.nowYearsSingle + '/' + _newVal[0],
    })
  }

  const changeYear = (value: string) => {
    setDateState({ nowYearsSingle: value })
    let _nowMonth: any =
      new Date().getMonth() + 1 < 10 ? '0' + (new Date().getMonth() + 1) : new Date().getMonth() + 1
    const _nowYear = new Date().getFullYear() + ''
    // ?????????????????????
    const _getSelNowMonth = dateState.nowselectMonth.split('_')
    setDateState({
      nowSelMonth: dateState.nowYearsSingle + '/' + _getSelNowMonth[0] + '/01',
      editSelTimeType: dateState.nowYearsSingle + '/' + dateState.nowQuarter.split(',')[0],
    })
    if (String(value) === _nowYear && Number(_getSelNowMonth[0]) > Number(_nowMonth)) {
      setDateState({
        nowMonth: _nowMonth + '/01' + ',' + _nowMonth + '/' + _getSelNowMonth[1],
        nowSelMonth: dateState.nowYearsSingle + '/' + _nowMonth + '/01',
        isNowMonth: true,
      })
    }

    let _txt = ''
    let newDatas: any,
      setMonth: any,
      _isflag = false
    if (reportState.templateType == 4) {
      //??????
      _txt = value + '/01/01-' + value + '/12/31'
    } else if (reportState.templateType == 2) {
      newDatas = Number(dateState.nowMonth.split(',')[0].split('/')[0])
      setMonth =
        value + '/' + dateState.nowMonth.split(',')[0] + '-' + value + '/' + dateState.nowMonth.split(',')[1]
      if (Number(value) == new Date().getFullYear()) {
        // ?????????????????????????????????
        newDatas =
          new Date().getMonth() + 1 < 10 ? '0' + (new Date().getMonth() + 1) : new Date().getMonth() + 1
      }
      if (Number(dateState.nowMonth.split(',')[0].split('/')[0]) > newDatas) {
        // ???????????????eg:2019 --12??????2020 --09???
        const _day = getMonthDate(newDatas, value)
        setMonth = value + '/' + newDatas + '/01' + '-' + value + '/' + newDatas + '/' + _day
        // ??????????????????
        _isflag = true
        // setDateState({dateState.nowMonth:value + '/' + newDatas + '/01' + '-' + value + '/' + newDatas + '/' + _day})
      }
      //??????
      _txt =
        value + '/' + dateState.nowMonth.split(',')[0] + '-' + value + '/' + dateState.nowMonth.split(',')[1]
    } else if (reportState.templateType == 3) {
      //?????? "10/01,12/31"
      newDatas = Number(dateState.nowQuarter.split(',')[0].split('/')[0])
      setMonth =
        value +
        '/' +
        dateState.nowQuarter.split(',')[0] +
        '-' +
        value +
        '/' +
        dateState.nowQuarter.split(',')[1]
      if (Number(value) == new Date().getFullYear()) {
        // ?????????????????????????????????
        _nowMonth =
          new Date().getMonth() + 1 < 10 ? '0' + (new Date().getMonth() + 1) : new Date().getMonth() + 1
      }
      if (Number(_nowMonth) < Number(newDatas)) {
        // ???????????????eg:2019 --12??????2020 --09???
        const quartorNum = Math.ceil(_nowMonth / 3)
        const _quatar = quertQuater(quartorNum, value + '/' + _nowMonth + '/01').data
        setMonth = value + '/' + _quatar.split(',')[0] + '-' + value + '/' + _quatar.split(',')[1]
        // ??????????????????
        _isflag = true
        setDateState({ nowQuarter: _quatar })
      }
      _txt =
        value +
        '/' +
        dateState.nowQuarter.split(',')[0] +
        '-' +
        value +
        '/' +
        dateState.nowQuarter.split(',')[1]
    }
    setRelationState({ typeTxt: _isflag ? setMonth : _txt })
  }
  const changeQuarter = (value: string) => {
    const _newVal = value.split(',')
    setRelationState({
      typeTxt: dateState.nowYearsSingle + '/' + _newVal[0] + '-' + dateState.nowYearsSingle + '/' + _newVal[1],
    })
    setDateState({
      nowQuarter: value,
      editSelTimeType: dateState.nowYearsSingle + '/' + _newVal[0],
    })
  }

  const changeFiles = (arr: any) => {
    if (!isInArr(addReportParam.relationFile, arr[0])) {
      setAddReportParam({
        ...addReportParam,
        relationFile: [...addReportParam.relationFile, ...arr],
      })
    } else {
      addReportParam.relationFile.map((item: any, i: number) => {
        if (item.configId === arr[0].configId && item.relationId === arr[0].relationId) {
          addReportParam.relationFile[i].files = arr[0].files
          addReportParam.relationFile[i].temporaryId = arr[0].temporaryId
          addReportParam.relationFile[i].fileGuidList = arr[0].fileGuidList
        }
      })
    }
  }

  const isInArr = (arr: any[], val: any) => {
    let isIn = false
    $.each(arr, (i, item) => {
      if (item.configId == val.configId && item.relationId === val.relationId) {
        isIn = true
        return
      }
    })
    return isIn
  }
  const headDef: any = $tools.asAssetsPath('/images/workplan/head_def.png')

  return (
    <div className="work-report-container flex">
      {/* <Spin spinning={loading}> */}
      <div className="work-report-left" style={{ width: reportState.visible ? '78%' : '100%' }}>
        <div className="reportHead-container">
          <Select
            className="report-org-box"
            value={reportState.reportOrgName}
            onChange={changeReportOrg}
            suffixIcon={
              <CaretDownOutlined disabled={isReportType.wortReportType === 'create' ? false : true} />
            }
            disabled={isReportType.wortReportType === 'create' && !isReportType.isEcho ? false : true}
          >
            {isReportType.wortReportType === 'create' &&
              cmpList.map((item: any) => {
                return (
                  <Select.Option key={item.id} value={item.shortName}>
                    {item.shortName}
                  </Select.Option>
                )
              })}
            {isReportType.wortReportType === 'edit' && (
              <Option value={editReportUn.belongName}>{editReportUn.belongName}</Option>
            )}
          </Select>
          <div className="work-report-top-bov">
            <Select
              className="report-type-box"
              onChange={changeReportType}
              value={reportState.selectTypeName}
              disabled={isReportType.wortReportType === 'create' && !isReportType.isEcho ? false : true}
            >
              {isReportType.wortReportType === 'create' &&
                typeList.map((item: ListProps) => (
                  <Select.Option key={item.templateId} value={item.name} type={item.type}>
                    {item.name}
                  </Select.Option>
                ))}
              {isReportType.wortReportType === 'edit' && (
                <Option
                  key={editReportUn.templateId}
                  type={editReportUn.type}
                  value={editReportUn.templateName}
                >
                  {editReportUn.templateName}
                </Option>
              )}
            </Select>
            {reportState.templateType == 0 && (
              <DatePicker
                allowClear={false}
                defaultValue={moment(nowDates, dateFormat)}
                value={moment(dateState.nowSelDay, dateFormat)}
                format={dateFormat}
                onChange={timePickerChange}
                disabledDate={disabledDate}
                disabled={isReportType.isEcho === true ? true : false}
              />
            )}
            {reportState.templateType == 1 && (
              <SelectWeek
                changeWeek={changeWeek}
                selectWeek={dateState.editSelTimeType}
                disabled={isReportType.isEcho === true ? true : false}
              />
            )}
            {reportState.templateType == 2 && (
              <div className="selType">
                <SelectYear
                  changeYear={changeYear}
                  selectYear={dateState.nowYearsSingle}
                  disabled={isReportType.isEcho === true ? true : false}
                />
                <SelectMonth
                  changeMonth={changeMonth}
                  selectYear={dateState.nowYearsSingle}
                  changeDatas={dateState.isNowMonth}
                  nowSelMonth={dateState.nowSelMonth}
                  disabled={isReportType.isEcho === true ? true : false}
                />
              </div>
            )}
            {reportState.templateType == 3 && (
              <div className="selType">
                <SelectYear
                  changeYear={changeYear}
                  selectYear={dateState.nowYearsSingle}
                  disabled={isReportType.isEcho === true ? true : false}
                />
                <SelectQuarter
                  changeQuarter={changeQuarter}
                  selectYear={dateState.nowYearsSingle}
                  selectQuarter={dateState.editSelTimeType}
                  disabled={isReportType.isEcho === true ? true : false}
                />
              </div>
            )}
            {reportState.templateType == 4 && (
              <div className="selType">
                <SelectYear
                  changeYear={changeYear}
                  selectYear={dateState.nowYearsSingle}
                  disabled={isReportType.isEcho === true ? true : false}
                />
              </div>
            )}
            {reportState.allowImportSet == 1 && isReportType.wortReportType !== 'edit' && (
              <Button
                className="import_prev"
                onClick={() => {
                  $store.dispatch({
                    type: 'CHANGE_IS_IMPORT',
                    data: { isImportReport: !isImportReport },
                  })
                }}
              >
                ???????????????
              </Button>
            )}
          </div>
          <div className="report_title">
            ???????????????{reportState.selectTypeName}
            {reportState.templateType === 0 && dateState.nowSelDay}
            {reportState.templateType === 1 && dateState.nowSelWeek}
            {reportState.templateType === 2 && relationState.typeTxt}
            {reportState.templateType === 3 && relationState.typeTxt}
            {reportState.templateType === 4 && relationState.typeTxt}
            {reportState.templateType === 5 && dateState.nowYears}
            <span className="report_user">{nowUser}</span>
          </div>
        </div>
        <div className="reportContent-container">
          <div className="list_item report_temp_list_box" id="report_temp_container">
            {reportContent.map((item: ReportContentListProps, index: number) => (
              <div className="item_listBox" key={index}>
                <div className="icon_box">
                  <span className="icon_t icon_cont"></span>
                  {item.required == 1 && <span className="required_param">*</span>}
                </div>
                <div className="content_box">
                  <div className="tit_box">
                    <span>{item.title}</span>
                    {item.relationTask == 1 && (
                      <span
                        className={`relation_btn ${item.isActive ? 'active' : ''}`}
                        onClick={() => {
                          nowRelationTemp.current = item.id
                          queryRelationList('changeRelationBtn')
                        }}
                      >
                        ????????????
                      </span>
                    )}
                  </div>
                  {!item.editInput && item.inputBox === 1 && (
                    <div
                      className="cont_box"
                      contentEditable={false}
                      dangerouslySetInnerHTML={{
                        __html: item.hint ? item.hint.split(':::').join('') : '?????????????????????',
                      }}
                      placeholder={'?????????????????????'}
                      data-configid={item.id}
                      onClick={() => {
                        reportContent.forEach((element: any) => {
                          if (element.editInput) {
                            element.editInput = false
                          }
                        })
                        item.editInput = true
                        setReportContent([...reportContent])
                      }}
                    ></div>
                  )}

                  {item.editInput && item.inputBox === 1 && (
                    <Summernote
                      className="workReportEditor"
                      previewArea=".workReportEditor"
                      editorContent={item.hint}
                      placeholder={isReportType.wortReportType === 'create' ? item.placeholder : ''}
                      editorChange={e => {
                        changeSendVal(e, item.id)
                      }}
                      onKeyUp={(e: any) => {
                        editorAtChange({
                          editor: editors[index],
                          node: $(e.currentTarget),
                          conHtml: $(e.currentTarget).html(),
                          allowTeamId: [reportState.reportOrgId],
                          joinMembers: [],
                          sourceType: 'report',
                          itemData: {
                            item,
                            contentKey: 'hint',
                          },
                        })
                      }}
                      editorOnInit={(note: any) => {
                        editors[index] = note
                      }}
                      onFocus={() => {
                        setOldEditorTxt(item.hint ? item.hint.split(':::').join('') : '')
                      }}
                      data-configid={item.id}
                      // noInitUpdate??????????????????????????????????????????????????????????????????????????????????????????insertText????????????????????????????????????html
                      noInitUpdate={isReportType.wortReportType == 'edit'}
                    />
                  )}
                  {item.relationInfos?.length !== 0 && (
                    <div className="relation_list_box">
                      {item.relationInfos &&
                        item.relationInfos?.filter(ritem => ritem.relationType === 1).length > 0 && (
                          <div className="relation_task">
                            <div className="text_realtion">????????????</div>
                            {item.relationInfos
                              .filter(item => item.relationType === 1)
                              .map((itask: any, it: number) => {
                                return (
                                  <div className="relation_list" key={it}>
                                    <div
                                      className="delete-icon-btn"
                                      onClick={() => {
                                        unRelation(itask.relationId)
                                      }}
                                    ></div>
                                    <div className="relation_tit_box">
                                      <div className="relation_left_box">
                                        {
                                          <Avatar className="oa-avatar" src={itask.userProfile || ''}>
                                            {itask.userName && itask.userName.length > 2
                                              ? itask.userName.slice(-2)
                                              : itask.userName}
                                          </Avatar>
                                        }
                                      </div>
                                      <div className="relation_right_box">
                                        <div className="relation_tit_cont">
                                          <div className="relation_tit">
                                            <div className="tit_left">
                                              <span
                                                className="tit"
                                                onClick={() => {
                                                  showDetails('task', '', itask)
                                                }}
                                              >
                                                {itask.relationName}
                                              </span>
                                            </div>
                                            <div
                                              className="add-mark add-task-mark"
                                              onClick={() => {
                                                changeRelationParam('remark', item.id, itask.relationId)
                                              }}
                                            >
                                              ?????????
                                            </div>
                                          </div>
                                          <div className="relation_status">
                                            {setListRoleHtml(itask.maxRole)}
                                            {taskExcuteStatus(
                                              isReportType.wortReportType === 'edit'
                                                ? itask.state
                                                : itask.status
                                            )}
                                            <div className="tit_time">
                                              {isReportType.wortReportType === 'edit'
                                                ? itask.time
                                                  ? itask.time
                                                  : ''
                                                : (itask.startTime ? itask.startTime : '') +
                                                  '-' +
                                                  (itask.endTime ? itask.endTime : '')}
                                              {/* {itask.startTime}-{itask.endTime} */}
                                            </div>
                                          </div>
                                          <div className="relation_progoess">
                                            <div className="progress_now">
                                              ?????????
                                              {itask.relationType == 1 && itask.taskProceed
                                                ? itask.taskProceed
                                                : itask.process}
                                              %
                                            </div>
                                            <div className="progress_icon"></div>
                                            <div className="progress_last">
                                              <Input
                                                maxLength={5}
                                                min={0}
                                                max={100}
                                                // value={itask.processNew || itask.lastProcess}
                                                value={itask.processNew}
                                                onFocus={(e: any) => {
                                                  changeRelationParam(
                                                    'line',
                                                    item.id,
                                                    itask.relationId,
                                                    e.target.value
                                                  )
                                                }}
                                                onBlur={(e: any) => {
                                                  changeRelationParam(
                                                    'line',
                                                    item.id,
                                                    itask.relationId,
                                                    e.target.value
                                                  )
                                                }}
                                                onPressEnter={(e: any) => {
                                                  e.target.blur()
                                                  changeRelationParam(
                                                    'line',
                                                    item.id,
                                                    itask.relationId,
                                                    e.target.value
                                                  )
                                                }}
                                                className={
                                                  itask.borderClass ||
                                                  (!itask.processNew && itask.process != 100)
                                                    ? 'active'
                                                    : ''
                                                }
                                                disabled={itask.process != 100 ? false : true}
                                                onChange={e => {
                                                  let textboxvalue = e.target.value
                                                  if (textboxvalue.length == 1) {
                                                    textboxvalue = e.target.value.replace(/[^0-9]/g, '')
                                                  } else {
                                                    textboxvalue = e.target.value.replace(
                                                      /^\D*(\d*(?:\.\d{0,2})?).*$/g,
                                                      '$1'
                                                    )
                                                  }
                                                  if (Number(textboxvalue) > 100) {
                                                    textboxvalue = '100'
                                                  }
                                                  changeRelationParam(
                                                    'process',
                                                    item.id,
                                                    itask.relationId,
                                                    textboxvalue
                                                  )
                                                }}
                                              />
                                              %
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    {itask.addRemark && (
                                      <div className="report_mark_box">
                                        <div className="relation_contents relation_contents_report">
                                          <div className="report-cont">?????????</div>
                                          <div className="report-text">
                                            <TextArea
                                              className="input-box"
                                              placeholder="?????????????????????"
                                              rows={4}
                                              value={itask.content ? itask.content.replace(/<.*?>/g, '') : ''}
                                              onChange={e => {
                                                changeRelationParam(
                                                  'content',
                                                  item.id,
                                                  itask.relationId,
                                                  e.target.value
                                                )
                                              }}
                                            />
                                          </div>
                                          <div
                                            className="delete-report-btn"
                                            onClick={() => {
                                              delRemark(item.id, itask.relationId)
                                            }}
                                          ></div>
                                        </div>
                                        <div className="relation_contents relation_contents_file report_file_tit up_file_box">
                                          <div className="title fileTitle">
                                            {/* <span className="formIcon file"></span> */}
                                            <RelationUploadFiles
                                              changeFiles={changeFiles}
                                              datas={{
                                                belongId: reportState.reportOrgId,
                                                files: itask.fileReturnModels || [],
                                                configId: item.id,
                                                relationId: itask.relationId,
                                              }}
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                          </div>
                        )}
                      {item.relationInfos &&
                        item.relationInfos?.filter(item => item.relationType === 4).length > 0 && (
                          <div className="relation_approval">
                            <div className="text_realtion">????????????</div>
                            {item.relationInfos
                              .filter(item => item.relationType === 4)
                              .map((iapproval: any, ia: number) => {
                                return (
                                  <div className="relation_list" key={ia}>
                                    <div
                                      className="delete-icon-btn"
                                      onClick={() => {
                                        unRelation(iapproval.relationId)
                                      }}
                                    ></div>
                                    <div className="relation_tit_box s_down">
                                      <div className="relation_left_box">
                                        <Avatar className="oa-avatar" src={iapproval.userProfile || ''}>
                                          {iapproval.userName && iapproval.userName.length > 2
                                            ? iapproval.userName.slice(-2)
                                            : iapproval.userName}
                                        </Avatar>
                                      </div>
                                      <div className="relation_right_box">
                                        <div className="relation_tit_cont">
                                          <div className="relation_tit">
                                            <div className="tit_left">
                                              <span
                                                className="tit"
                                                onClick={() => {
                                                  showDetails('approval', iapproval.relationId)
                                                }}
                                              >
                                                {iapproval.relationName}
                                              </span>
                                            </div>

                                            <div
                                              className="add-mark add-approval-mark"
                                              onClick={() => {
                                                changeRelationParam('remark', item.id, iapproval.relationId)
                                              }}
                                            >
                                              ??????
                                            </div>
                                          </div>
                                          <div className="relation_status">
                                            {getApprovalStatus(iapproval.state)}
                                            <div className="tit_time">{iapproval.time}</div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    {iapproval.addRemark && (
                                      <div className="report_mark_box">
                                        <div className="relation_contents relation_contents_report">
                                          <div className="report-cont">?????????</div>
                                          <div className="report-text">
                                            <TextArea
                                              className="input-box"
                                              placeholder="?????????????????????"
                                              rows={4}
                                              value={iapproval.content}
                                              onChange={e => {
                                                changeRelationParam(
                                                  'content',
                                                  item.id,
                                                  iapproval.relationId,
                                                  e.target.value
                                                )
                                              }}
                                            />
                                          </div>
                                          <div
                                            className="delete-report-btn"
                                            onClick={() => {
                                              delRemark(item.id, iapproval.relationId)
                                            }}
                                          ></div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                          </div>
                        )}
                      {item.relationInfos &&
                        item.relationInfos?.filter(item => item.relationType === 2).length > 0 && (
                          <div className="relation_metting">
                            <div className="text_realtion">????????????</div>
                            {item.relationInfos
                              .filter(item => item.relationType === 2)
                              .map((imetting: any, im: number) => {
                                return (
                                  <div className="relation_list" key={im}>
                                    <div
                                      className="delete-icon-btn"
                                      onClick={() => {
                                        unRelation(imetting.relationId)
                                      }}
                                    ></div>
                                    <div className="relation_tit_box s_down">
                                      <div className="relation_right_box">
                                        <div className="relation_tit_cont">
                                          <div className="relation_tit">
                                            <div className="tit_left">
                                              <span
                                                className="tit"
                                                onClick={() => {
                                                  showDetails('meet', imetting.relationId)
                                                }}
                                              >
                                                {imetting.relationName}
                                              </span>
                                            </div>
                                          </div>
                                          <div className="relation_status">
                                            {getMeetingStatus(
                                              imetting.proceed,
                                              imetting.joinStatus,
                                              imetting.status
                                            )}
                                            <div className="tit_time">
                                              {isReportType.wortReportType === 'edit'
                                                ? imetting.time
                                                : imetting.startTime + '-' + imetting.endTime}
                                              {/* {imetting.startTime}-{imetting.endTime} */}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                          </div>
                        )}
                      {item.relationInfos &&
                        item.relationInfos?.filter(ritem => ritem.relationType === 5).length > 0 && (
                          <div className="relation_task relation_okr">
                            <div className="text_realtion">??????OKR</div>
                            {item.relationInfos
                              .filter(item => item.relationType === 5)
                              .map((itask: any, it: number) => {
                                const _processStatus = itask.hasOwnProperty('processStatusNew')
                                  ? itask.processStatusNew
                                  : itask.processStatus
                                return (
                                  <div className="relation_list" key={it}>
                                    <div
                                      className="delete-icon-btn"
                                      onClick={() => {
                                        unRelation(itask.relationId)
                                      }}
                                    ></div>
                                    <div className="relation_tit_box">
                                      <div className="relation_left_box">
                                        {
                                          <Avatar
                                            className="oa-avatar"
                                            src={itask.userName ? itask.userProfile : headDef}
                                          >
                                            {itask.userName && itask.userName.length > 2
                                              ? itask.userName.slice(-2)
                                              : itask.userName}
                                          </Avatar>
                                        }
                                      </div>
                                      <div className="relation_right_box">
                                        <div className="relation_tit_cont">
                                          <div className="relation_tit">
                                            <div className="tit_left">
                                              {getTypeLogo({ type: itask.planType })}
                                              <span
                                                className="tit my_ellipsis"
                                                onClick={() => {
                                                  showDetails('task', '', itask)
                                                }}
                                                style={{ width: 'calc(100% - 100px)' }}
                                              >
                                                {itask.relationName}
                                              </span>
                                            </div>
                                            <div
                                              className="add-mark add-task-mark"
                                              onClick={() => {
                                                changeRelationParam('remark', item.id, itask.relationId)
                                              }}
                                            >
                                              ????????????
                                            </div>
                                          </div>
                                          <div className="relation_status">
                                            {/* ?????? */}
                                            {itask.periodStr && (
                                              <span className="gl-period-text">
                                                <em className="period-icon"></em> {itask.periodStr}
                                              </span>
                                            )}
                                            {/* ?????? */}
                                            {RenderStatusTarget({ statusArr: itask.workPlanTargetResultList })}
                                          </div>
                                          <div className="relation_progoess">
                                            {/* ?????? */}
                                            <div className="progress_now">
                                              ?????????
                                              {itask.process || itask.process == 0
                                                ? itask.process
                                                : itask.taskProceed}
                                              %
                                            </div>
                                            <div className="progress_icon"></div>
                                            <div className="progress_last">
                                              <Input
                                                maxLength={5}
                                                min={0}
                                                max={100}
                                                // value={itask.processNew || itask.lastProcess}
                                                value={itask.processNew}
                                                onFocus={(e: any) => {
                                                  changeRelationParam(
                                                    'line',
                                                    item.id,
                                                    itask.relationId,
                                                    e.target.value
                                                  )
                                                }}
                                                onBlur={(e: any) => {
                                                  changeRelationParam(
                                                    'line',
                                                    item.id,
                                                    itask.relationId,
                                                    e.target.value
                                                  )
                                                }}
                                                onPressEnter={(e: any) => {
                                                  e.target.blur()
                                                  changeRelationParam(
                                                    'line',
                                                    item.id,
                                                    itask.relationId,
                                                    e.target.value
                                                  )
                                                }}
                                                className={
                                                  itask.borderClass ||
                                                  (!itask.processNew && itask.process != 100)
                                                    ? 'active'
                                                    : ''
                                                }
                                                disabled={itask.process != 100 ? false : true}
                                                onChange={e => {
                                                  let textboxvalue = e.target.value
                                                  if (textboxvalue.length == 1) {
                                                    textboxvalue = e.target.value.replace(/[^0-9]/g, '')
                                                  } else {
                                                    textboxvalue = e.target.value.replace(
                                                      /^\D*(\d*(?:\.\d{0,2})?).*$/g,
                                                      '$1'
                                                    )
                                                  }
                                                  if (Number(textboxvalue) > 100) {
                                                    textboxvalue = '100'
                                                  }
                                                  changeRelationParam(
                                                    'process',
                                                    item.id,
                                                    itask.relationId,
                                                    textboxvalue
                                                  )
                                                }}
                                              />
                                              %
                                            </div>
                                            {/* okr?????? */}
                                            <div className="okr_status flex" style={{ paddingLeft: '60px' }}>
                                              <p>??????:</p>
                                              <ul>
                                                <li
                                                  className={`zc ed_trigger_labels ${
                                                    _processStatus == 0 ? 'active' : ''
                                                  }`}
                                                  onClick={() => {
                                                    changeRelationParam(
                                                      'processStatus',
                                                      item.id,
                                                      itask.relationId,
                                                      0
                                                    )
                                                  }}
                                                >
                                                  <i></i>??????<span></span>
                                                </li>
                                                <li
                                                  className={`fx ed_trigger_labels ${
                                                    _processStatus == 1 ? 'active' : ''
                                                  }`}
                                                  onClick={() => {
                                                    changeRelationParam(
                                                      'processStatus',
                                                      item.id,
                                                      itask.relationId,
                                                      1
                                                    )
                                                  }}
                                                >
                                                  <i></i>?????????<span></span>
                                                </li>
                                                <li
                                                  className={`cq ed_trigger_labels ${
                                                    _processStatus == 2 ? 'active' : ''
                                                  }`}
                                                  onClick={() => {
                                                    changeRelationParam(
                                                      'processStatus',
                                                      item.id,
                                                      itask.relationId,
                                                      2
                                                    )
                                                  }}
                                                >
                                                  <i></i>??????<span></span>
                                                </li>
                                                <li
                                                  className={`yc ed_trigger_labels ${
                                                    _processStatus == 3 ? 'active' : ''
                                                  }`}
                                                  onClick={() => {
                                                    changeRelationParam(
                                                      'processStatus',
                                                      item.id,
                                                      itask.relationId,
                                                      3
                                                    )
                                                  }}
                                                >
                                                  <i></i>??????<span></span>
                                                </li>
                                              </ul>
                                            </div>
                                            {itask.planType == 3 && (
                                              <div className="heart_kr flex">
                                                <span style={{ margin: '8px 5px 0px 20px' }}>????????????:</span>
                                                <Rate
                                                  allowHalf
                                                  className="okr_color_heart"
                                                  character={
                                                    <HeartFilled
                                                      style={{
                                                        fontSize: '14px',
                                                      }}
                                                    />
                                                  }
                                                  onHoverChange={(val: any) => {
                                                    if (val) {
                                                      $('.heart_kr')
                                                        .find(`.okr_heart_num[data-id=${itask.relationId}]`)
                                                        .text(val * 2)
                                                    } else {
                                                      $('.heart_kr')
                                                        .find(`.okr_heart_num[data-id=${itask.relationId}]`)
                                                        .text(
                                                          itask.hasOwnProperty('newCci')
                                                            ? itask.newCci
                                                            : itask.cci
                                                        )
                                                    }
                                                  }}
                                                  value={
                                                    itask.hasOwnProperty('newCci')
                                                      ? itask.newCci / 2
                                                      : itask.cci / 2
                                                  }
                                                  onChange={(val: number) => {
                                                    const heart = itask.hasOwnProperty('newCci')
                                                      ? itask.newCci / 2
                                                      : itask.cci / 2
                                                    if (val || (val == 0 && heart == 0.5)) {
                                                      changeRelationParam(
                                                        'cci',
                                                        item.id,
                                                        itask.relationId,
                                                        val * 2
                                                      )
                                                    }
                                                  }}
                                                />
                                                <span
                                                  style={{ marginTop: '8px' }}
                                                  className="okr_heart_num"
                                                  data-id={itask.relationId}
                                                >
                                                  {itask.hasOwnProperty('newCci') ? itask.newCci : itask.cci}
                                                </span>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    {itask.addRemark && (
                                      <div className="report_mark_box">
                                        <div className="relation_contents relation_contents_report">
                                          <div className="report-cont">?????????</div>
                                          <div className="report-text">
                                            <TextArea
                                              className="input-box"
                                              placeholder="?????????????????????"
                                              rows={4}
                                              value={itask.content ? itask.content.replace(/<.*?>/g, '') : ''}
                                              onChange={e => {
                                                changeRelationParam(
                                                  'content',
                                                  item.id,
                                                  itask.relationId,
                                                  e.target.value
                                                )
                                              }}
                                            />
                                          </div>
                                          <div
                                            className="delete-report-btn"
                                            onClick={() => {
                                              delRemark(item.id, itask.relationId)
                                            }}
                                          ></div>
                                        </div>
                                        <div className="relation_contents relation_contents_file report_file_tit up_file_box">
                                          <div className="title fileTitle">
                                            {/* <span className="formIcon file"></span> */}
                                            <RelationUploadFiles
                                              changeFiles={changeFiles}
                                              datas={{
                                                belongId: reportState.reportOrgId,
                                                files: itask.fileReturnModels || [],
                                                configId: item.id,
                                                relationId: itask.relationId,
                                              }}
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                          </div>
                        )}
                    </div>
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
                              <div
                                className="user-del-btn"
                                onClick={() => {
                                  delUser(0, item.userId)
                                }}
                              ></div>
                            )}
                          </div>
                        )
                      })}
                    <div
                      className="add_btn"
                      onClick={() => {
                        selReportUser(0)
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="list_item copy_person_box">
            <div className="item_listBox">
              <div className="icon_box">
                <span className="icon_t icon_per"></span>
                {/* <span className="required_param">*</span> */}
              </div>
              <div className="content_box">
                <div className="per_tit">
                  <span>????????????</span>
                </div>
                <div className="per_list">
                  <div className="list_box">
                    {copyUserList &&
                      copyUserList.length != 0 &&
                      copyUserList.map((item: any, i: number) => {
                        return (
                          <div className="copyUser" key={i}>
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
                            <div
                              className="user-del-btn"
                              onClick={() => {
                                delUser(1, item.userId)
                              }}
                            ></div>
                          </div>
                        )
                      })}
                    <div
                      className="add_btn"
                      onClick={() => {
                        selReportUser(1)
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
                  <span className="shared_group_title" onClick={() => getShareRoomList()}>
                    ???????????????
                  </span>
                </div>
                {/* <Modal
                  className="shareToRoomModal report_share_pop"
                  centered
                  visible={relationState.visibleChatList}
                  title="??????"
                  onOk={setSelectGroup}
                  onCancel={handleCancel}
                >
                  <Checkbox.Group
                    onChange={seectRoomList}
                    value={roomListSel?.map(item => item.id)}
                    options={roomList}
                  />
                </Modal> */}
                {relationState.visibleChatList && (
                  <ChatForwardModal
                    sendType="share"
                    visible={relationState.visibleChatList}
                    chatMsg={''}
                    teamId={selectTeamId}
                    nodeSelected={roomListSelCheck}
                    onSelected={setSelectGroup}
                    onCancelModal={handleCancel}
                    dataAuth={true}
                    findType={0}
                    permissionType={3}
                    isQueryAll={1}
                    pageSize={10}
                    selectList={[]}
                  />
                )}
                <div className="shared_group_list">
                  {roomListSelCheck?.map((item: any, index: number) => (
                    <div className="share_list_item" key={index}>
                      {item.type === 3 && (
                        <Avatar
                          className="oa-avatar"
                          // shape="square"
                          size={20}
                          src={item.icon || ''}
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
          <div className="list_items report_file_all up_file_box">
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
              teamId={reportState.reportOrgId}
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
          <Modal
            visible={isImportReport}
            centered
            title="????????????"
            onOk={importLastreport}
            onCancel={hideImportPop}
            className="importLastreportPop"
            footer={[
              <Button key="back" onClick={hideImportPop}>
                ??????
              </Button>,
              <Button key="submit" type="primary" loading={loading} onClick={importLastreport}>
                ??????
              </Button>,
            ]}
          >
            <p>??????????????????????????????????????????????????????????????????</p>
          </Modal>
        </div>
        <div className="reportFooter-container">
          <Button
            loading={sendBtnLoading}
            className="sunbmit"
            type="primary"
            value="sure"
            onClick={() => {
              addWorkReport()
            }}
          >
            ??????
          </Button>
        </div>
      </div>
      {reportState.visible && (
        <Spin spinning={relationState.loading} size="small" wrapperClassName="workReport-handle-content">
          <div className="work-report-right">
            <div className="work-report-body-box">
              {/* <ReportContentRight onChange={consileThis} relationType={relationId} /> */}
              <div className="work-report-content-right-cont">
                {/* ?????? */}
                <Tabs className="tabMenu" activeKey={relationState.activeTab} onChange={tabChange}>
                  {/* ??????(ui?????????????????????????????????????????? --) */}
                  <div className="search_box">
                    <Search
                      placeholder={placeholerRel.current}
                      onSearch={(value: string) => onSearchs(value)}
                      className="search_input"
                      onKeyUp={(e: any) => {
                        searchVal.current = e.target.value
                      }}
                    />
                    <div className="is_relation">
                      ?????????<span>{relationState.reportTotalElements}</span>???
                    </div>
                  </div>
                  {relationState.authsObj.TASK && (
                    <TabPane tab="????????????" key="task_plan">
                      {/* <Spin spinning={loading}> */}
                      <div className="right-cont-box">
                        <List
                          className="list_box task_list"
                          itemLayout="vertical"
                          dataSource={taskLst}
                          renderItem={(item: any) => (
                            <List.Item key={item.taskId} className="flex relation-list-item">
                              <div className="list_cont_box">
                                <div className="tit_box flex center-v">
                                  <Checkbox
                                    onChange={onRelation}
                                    id={item.taskId}
                                    value={'task_plan'}
                                    checked={isChecked(item.taskId)}
                                  ></Checkbox>
                                  <Avatar className="oa-avatar" src={item.executorUserProfile || ''}>
                                    {item.executorUsername && item.executorUsername.length > 2
                                      ? item.executorUsername.slice(-2)
                                      : item.executorUsername}
                                  </Avatar>
                                  <span className="relation-name text-ellipsis">{item.taskName}</span>
                                </div>
                                <div className="flex status_box">
                                  {setListRoleHtml(item.maxRole)}
                                  {taskExcuteStatus(item.status)}
                                </div>
                                <div className="flex time_box">
                                  <div className="time_icon">{item.endTime}??????</div>
                                </div>
                              </div>
                            </List.Item>
                          )}
                        />
                      </div>
                      {/* </Spin> */}
                    </TabPane>
                  )}
                  {relationState.authsObj.APPROVAL && (
                    <TabPane tab="????????????" key="relation_approval">
                      {/* <Spin spinning={loading}> */}
                      <div className="right-cont-box">
                        <List
                          className="list_box approval_list"
                          itemLayout="vertical"
                          dataSource={aprovalList}
                          renderItem={(item: any) => (
                            <List.Item key={item.approvalId} className="flex relation-list-item">
                              <div className="list_cont_box">
                                <div className="tit_box flex center-v">
                                  <Checkbox
                                    onChange={onRelation}
                                    id={item.approvalId}
                                    value={'relation_approval'}
                                    checked={isChecked(item.approvalId)}
                                  ></Checkbox>
                                  <Avatar className="oa-avatar" src={item.userProfile || ''}>
                                    {item.userName && item.userName.length > 2
                                      ? item.userName.slice(-2)
                                      : item.userName}
                                  </Avatar>
                                  <span className="relation-name text-ellipsis">{item.approvalTitle}</span>
                                </div>
                                <div className="flex status_box">
                                  {getApprovalStatus(item.state)}
                                  <span className="time">{item.time}</span>
                                </div>
                              </div>
                            </List.Item>
                          )}
                        />
                      </div>
                      {/* </Spin> */}
                    </TabPane>
                  )}

                  {relationState.authsObj.MEETING && (
                    <TabPane tab="????????????" key="relation_metting">
                      {/* <Spin spinning={loading}> */}
                      <div className="right-cont-box">
                        <List
                          className="list_box metting_list"
                          itemLayout="vertical"
                          dataSource={mettingList}
                          renderItem={(item: any) => (
                            <List.Item key={item.id} className="flex relation-list-item">
                              <div className="list_cont_box">
                                <div className="tit_box flex center-v">
                                  <Checkbox
                                    onChange={onRelation}
                                    id={item.id}
                                    value={'relation_metting'}
                                    checked={isChecked(item.id)}
                                  ></Checkbox>
                                  <Avatar className="oa-avatar" src={item.originatorProfile || ''}>
                                    {item.originator && item.originator.length > 2
                                      ? item.originator.slice(-2)
                                      : item.originator}
                                  </Avatar>
                                  <span className="relation-name text-ellipsis">{item.name}</span>
                                </div>
                                <div className="flex status_box">
                                  {getMeetingStatus(item.proceed, item.joinStatus, item.status)}
                                  <span className="time">{item.endTime}??????</span>
                                </div>
                              </div>
                            </List.Item>
                          )}
                        />
                      </div>
                      {/* </Spin> */}
                    </TabPane>
                  )}

                  {relationState.authsObj.OKR && (
                    <TabPane tab="??????OKR" key="relation_okr">
                      <List
                        className="list_box okr_list"
                        itemLayout="vertical"
                        dataSource={okrkList}
                        renderItem={(record: any) => (
                          <RelationOkrItem param={{ record, onRelation, isChecked }}></RelationOkrItem>
                        )}
                      />
                    </TabPane>
                  )}
                </Tabs>

                {/* ?????? */}
                {relationState.reportTotalElements > 0 && (
                  <Pagination
                    className="flex report_page"
                    size="small"
                    total={
                      nowTabs.current == 5 ? relationState.okrTotalElements : relationState.reportTotalElements
                    }
                    current={relationState.pageNo + 1}
                    showSizeChanger
                    onChange={(page, pageSize) => {
                      setRelationState({
                        pageNo: page - 1,
                        pageSize: pageSize || 10,
                      })
                    }}
                    onShowSizeChange={(current, size) => {
                      setRelationState({
                        pageNo: current - 1,
                        pageSize: size,
                      })
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </Spin>
      )}
      {/* </Spin> */}
      <SelectMemberOrg
        param={{
          visible: memberOrgShow,
          ...selMemberOrg,
          // disableList: mandatoryReporter,
        }}
        action={{
          setModalShow: setMemberOrgShow,
          // ????????????
          onSure: selMemberSure,
        }}
      />

      {/* ?????????????????? */}
      {detailsState.meetModalVisible && (
        <MeetDetails
          datas={{
            queryId: detailsState.meetId,
            listType: 0,
            meetModal: detailsState.meetModalVisible,
          }}
          isVisibleDetails={() => {
            setDetailsState({
              meetModalVisible: false,
              meetId: '',
            })
          }}
          callback={() => {}}
        />
      )}
      {/* ???????????? */}
      <DetailModal
        ref={detailModalRef}
        param={{
          from: 'workReport',
        }}
      ></DetailModal>
      {/* )} */}
      {/* ??????@?????????????????? */}
      {<EditorAt />}
    </div>
  )
}

export default WorkReport
// ????????????
const relateNavList = [
  {
    code: 'TASK',
    key: 'task_plan',
    current: 1,
    authCode: 'taskFind',
  },
  {
    code: 'APPROVAL',
    key: 'relation_approval',
    current: 2,
    baseAuth: true,
  },
  {
    code: 'MEETING',
    key: 'relation_metting',
    current: 3,
    baseAuth: true,
  },
  {
    code: 'OKR',
    key: 'relation_okr',
    current: 4,
    authCode: 'okrSet',
  },
]
const RelationUploadFiles = ({ datas, changeFiles }: { datas: any; changeFiles: (value: string) => void }) => {
  //???????????????????????????
  const [newFileList, setNewFileList] = useState<Array<any>>([])
  const [uploadVisible, setUploadVisible] = useState<boolean>(false)
  const [loadTime, setLoadTime] = useState<any>('')
  const [pageUuid, setPageUuid] = useState('')
  const [defaultFiles, setDefaultFiles] = useState<Array<any>>(datas.files)
  const [delFileIds, setDelFileIds] = useState<Array<any>>([])
  useEffect(() => {
    setPageUuid(Maths.uuid())
  }, [])

  // ????????????????????????
  const changeAttachMent = (list: any[]) => {
    if (list.length > 0) {
      const fileList: any = []
      list.forEach(file => {
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
            fileSize: file.size ? file.size : file.fileSize,
            dir: 'workReport',
          })
        }
      })
      const _arr: any = [
        {
          configId: datas.configId,
          relationId: datas.relationId,
          files: fileList,
        },
      ]
      changeFiles(_arr)
    }
  }
  return (
    <>
      <span style={{ display: 'flex', alignItems: 'center' }}>
        <span
          className="formIcon file"
          onClick={() => {
            setUploadVisible(true)
            setLoadTime(new Date().getTime())
          }}
        ></span>
      </span>
      <RenderUplodFile
        visible={uploadVisible}
        leftDown={false}
        canDel={true}
        filelist={newFileList || []}
        teamId={datas.belongId}
        fileId={pageUuid}
        defaultFiles={defaultFiles || []}
        setVsible={state => setUploadVisible(state)}
        loadTime={loadTime}
        fileChange={(list: any, delGuid?: string) => {
          let fileGuidList: any = []
          if (delGuid !== '') {
            const files = defaultFiles.filter((item: any) => item.fileGUID !== delGuid)
            setDefaultFiles(files)
            const delInfo = [...delFileIds]
            delInfo.push(delGuid)
            fileGuidList = delInfo
            setDelFileIds(delInfo)
          }
          setNewFileList(list)
          const _arr: any = [
            {
              configId: datas.configId,
              relationId: datas.relationId,
              files: [],
              temporaryId: pageUuid,
              fileGuidList: fileGuidList,
            },
          ]
          changeFiles(_arr)
        }}
      />
    </>
  )
}
/**
 * ??????????????????
 */

//???????????????????????????
const expandIcon = ({ expanded, onExpand, record }: any) => {
  if ((record.children && record.children.length > 0) || (record.krModels && record.krModels.length > 0)) {
    if (expanded) {
      return (
        <span
          className="treeTableIcon square arrow_leaf img_icon expanded"
          onClick={(e: any) => {
            e.stopPropagation()
            onExpand({ record, e })
          }}
        ></span>
      )
    } else {
      return (
        <span
          className="treeTableIcon square arrow_leaf img_icon collapsed"
          onClick={(e: any) => {
            e.stopPropagation()
            onExpand({ record, e })
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
}
// ??????okr ??????
const RelationOkrItem = (param: any) => {
  const { record, onRelation, isChecked } = param.param
  const [expanded, setExpanded] = useState(true)
  // ??????????????????
  const onExpand = () => {
    setExpanded(!expanded)
  }
  return (
    <RenderListItem
      param={{ expanded, record, onExpand, onRelation, isChecked, RenderChildList }}
    ></RenderListItem>
  )
}
const RenderChildList = ({ krModels, onExpand, onRelation, isChecked }: any) => {
  return (
    <List
      className="list_box okr_list or_list"
      style={{ width: '100%' }}
      dataSource={krModels || []}
      renderItem={(record: any) => {
        return (
          <RenderListItem
            param={{ record, onExpand, onRelation, isChecked, isChildItem: true }}
          ></RenderListItem>
        )
      }}
    ></List>
  )
}
// ?????? okr?????????dom
const RenderListItem = (param: any) => {
  const { expanded, record, onExpand, onRelation, isChecked, isChildItem, RenderChildList } = param.param
  const headDef: any = $tools.asAssetsPath('/images/workplan/head_def.png')
  const hasChildItem = !!record.krModels

  return (
    <List.Item
      key={record.taskId}
      className={`"flex relation-list-item" ${
        hasChildItem ? 'parentModel ' : isChildItem ? 'childModel treeTableChild' : ''
      } ${hasChildItem ? (expanded ? 'expanded' : 'collapsed') : ''}`}
    >
      <div className="list_cont_box flex center between">
        <div className={`tit_box flex center-v`}>
          <Checkbox
            onChange={onRelation}
            id={record.taskId}
            value={'relation_okr'}
            checked={isChecked(record.taskId)}
          ></Checkbox>
          {expandIcon({ expanded: expanded, onExpand, record })}
          <Avatar
            className="oa-avatar"
            src={record.userName ? record.userProfile : headDef}
            style={{ backgroundColor: record.userName ? '' : 'transparent' }}
          >
            {record.userName && record.userName.length > 2 ? record.userName.slice(-2) : record.userName}
          </Avatar>
        </div>
        <div className="flex flex-1 column start info_box ">
          <div className="title_box flex">
            {getTypeLogo({ type: record.planType })}
            <span className="relation-name text-ellipsis">{record.taskName}</span>
          </div>
          <div className="flex" style={{ width: '100%' }}>
            {getStatusOrTime(1, record.processStatus)}
            {/* ?????? */}
            {record.periodStr && (
              <span className="gl-period-text my_ellipsis">
                <em className="period-icon"></em> {record.periodStr}
              </span>
            )}
            {/* ???????????? */}
            {RenderStatusTarget({
              statusArr: record.workPlanTargetResultList,
              renderIndex: 1,
            })}
          </div>
        </div>
        <div className="flex progress_box">{record.process}%</div>
      </div>
      {record.krModels &&
        record.krModels.length > 0 &&
        RenderChildList({ krModels: record.krModels, onExpand, onRelation, isChecked })}
    </List.Item>
  )
}

// ????????????dom
/*
 * renderIndex :?????????????????????
 * statusArr:??????????????????
 * label????????????label
 */
export const RenderStatusTarget = ({
  statusArr,
  renderIndex,
  label,
}: {
  statusArr: any[]
  renderIndex?: number
  label?: any
}) => {
  if (!statusArr || statusArr.length == 0) return
  // ??????????????????
  const conRenderIndex = renderIndex || statusArr.length
  return (
    <div className="okr_detail_tagList flex-1 my_ellipsis">
      {label}
      {statusArr.map((nowItem: any, index: number) => (
        <span
          className="tages text-ellipsis"
          style={{
            backgroundColor: tagItemHtml(nowItem).namebgcolor,
            color: nowItem.rgb,
            display: index < conRenderIndex ? 'inline-block' : 'none',
          }}
          key={index}
        >
          {nowItem.content}
        </span>
      ))}
    </div>
  )
}
/**
 * ?????????????????????????????????
 */
const getNavMenu = ({ menuList }: any) => {
  // ????????????
  const navList: any = []
  const authsObj: any = {}
  if (NEWAUTH812) {
    const authList = reportAuthList
    menuList.map((mItem: any) => {
      const hasAuth = mItem?.baseAuth || getAuthStatus(mItem.authCode, authList)
      if (hasAuth) {
        navList.push(mItem)
        authsObj[mItem.code] = hasAuth
      }
    })
  } else {
    const funsAuthList = $store.getState().funsAuthList || []

    menuList.map((mItem: any) => {
      const findItem = funsAuthList.find((item: any) => item.name == mItem.code && item.hasAuth)
      if (findItem) {
        navList.push(mItem)
        authsObj[findItem.name] = findItem
      }
    })
  }
  return {
    navList,
    authsObj,
  }
}
