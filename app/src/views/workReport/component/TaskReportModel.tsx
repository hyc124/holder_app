import React, { useEffect, useState, useRef, useLayoutEffect } from 'react'
import './TaskReportModel.less'
import {
  Modal,
  Avatar,
  Progress,
  Row,
  Col,
  Radio,
  Tabs,
  message,
  Spin,
  Button,
  List,
  Comment,
  Tooltip,
} from 'antd'
import PrintModal from '@/src/components/print-modal/PrintModal'

// import { ShareToRoomModal } from '../../workplan/WorkPlanModal'
import ChatForwardModal from '@/src/components/chat-forward-modal'
import { PdfDownload } from '../../../common/js/PdfDownload'
import NoneData from '@/src/components/none-data/none-data'
// import Summernote from '@/src/components/editor/index'
import { ApprovalcommentEditor } from '@/src/views/approval/components/ApprovalcommentEditor'
import {
  getTaskDetail,
  getTaskListDays,
  findReportGroup,
  findAcceptMind,
  getPlanList,
  setReprtMind,
  sendViewComm,
  findCommentMessages,
} from '../../../views/DailySummary/common/getReprt'
import moment from 'moment'
import { ipcRenderer } from 'electron'
import ReportHistoryModel from '../../DailySummary/component/ReportHistoryList'
import FileList from '../../../components/file-list/file-list'
import { RenderPreImgs, PhotosPreview } from '@/src/components/normal-preview/normalPreview'
import { RenderFileList } from '../../mettingManage/component/RenderUplodFile'
import { getTaskTeamId } from '../../myWorkDesk/myWorkDesk'

interface ResListData {
  name: string
  ascriptionId: number
  ascriptionName: string
  liableUsername: string
  liableUserProfile: null
  executorUserName: null
  startTime: null
  endTime: string
  executeTime: string
  finishTime: null
  description: string
  status: number
  percent: number
  spend: number
  approvalStatus: number
  flag: number
  id: number
  newstReportId: number
}
interface PersonType {
  userId: number
  username: string
  type: number
  userRead: number
  profile: string
}
interface ResDeatilData {
  time: string
  datalist: any
}
const { TabPane } = Tabs
const getDifferImage = (value: number) => {
  let srcimg = '/images/task/task_going.png'
  // let srcimg = '../../../../../assets/images/task/task_going.png'
  let srctext = '?????????'
  if (value === 0) {
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

// ??????????????????
let scrollInfo = {
  pageNo: 0,
  hasMorePage: true,
}
let reportRightftListTmp: any = []
/******
 * props-----type:0??????  1??????
 */

const TaskReportModel = (props: any) => {
  const photosRef = useRef<any>(null)
  const [reportLefftList, setReportLefftList] = useState<ResListData | null>(null)
  const [reportRightftList, setReportRightList] = useState<ResDeatilData[]>([])
  const [reportPlanList, setreportPlanList] = useState<ResDeatilData[]>([])
  const [acceptMind, setAcceptMind] = useState(0)

  //   ????????????
  const [quoteMsg, setQuoteMsg] = useState({
    id: '',
    name: '',
    type: '',
    title: '',
    val: '',
    reportId: '',
  })
  //????????????????????????
  const [shareToRoomParam, setShareToRoomParam] = useState<any>({})
  // ?????????????????????
  const [shareCon, setShareCon] = useState<any>('')
  //????????????????????????
  const [visiblePrint, setVisiblePrint] = useState(false)
  const [detailHistory, setDetailHistory] = useState({
    visible: false,
    data: {},
  })
  const [loading, setLoading] = useState(false)
  const [btnDataList, setBtnData] = useState({
    content: '',
    rootId: '',
    parentId: '',
    accout: 0,
    userId: '',
    placeText: '',
    editInput: false,
  })
  const { nowUser, nowUserId, nowAccount, userInfo, selectTeamId } = $store.getState()
  const [replay] = useState<any>({ replayTip: '???Ta??????' })
  //??????????????????
  const [status, setStatus] = useState<any>()
  //??????@??????
  const [atUserIds, setAtUserIds] = useState<any>([])
  //?????????????????????
  const [addFiles, setAddFiles] = useState<any>([])
  const [fileModelss] = useState<any>([])
  //?????????????????????????????????UUID
  const [fileId, setFileId] = useState('')
  // ???????????????????????????
  // const [inputValue, setInpVal] = useState('')
  const editorRef = useRef<any>(null)
  // const [commentMessage, setCommentMessage] = useState<any>([])
  useEffect(() => {
    if (props.param.visible && props.param.data.taskId) {
      setLoading(true)
      getTaskDetail(props.param.data.taskId).then((resData: any) => {
        resData.content = ''
        setReportLefftList(resData)
        setQuoteMsg({
          id: resData.id,
          name: resData.name ? resData.name.replace(/<\/?.+?\/?>/g, '') : '',
          type: 'report',
          reportId: resData.newstReportId ? resData.newstReportId.toString() : '',
          title: '????????????',
          val: '',
        })
      })
      requireReportData()
      if (props.param.type === 1) {
        findAcceptMind(props.param.data.taskId).then((resData: any) => {
          setAcceptMind(resData)
        })
      }
    }
  }, [props.param])

  useEffect(() => {
    if (status) {
      setBtnData({ ...btnDataList, content: status })
    }
    // setInpVal(status)
  }, [status])

  /**
   * ??????????????????
   */
  useLayoutEffect(() => {
    // setTbodyH()
    // ????????????????????????
    $('#taskReportContent')
      .off('mousewheel')
      .on('mousewheel', '.report_right_content', (e: any) => {
        // ??????????????????
        if (e.originalEvent.wheelDelta <= 0) {
          scrollOnLoad()
        }
      })
    return () => {
      scrollInfo = {
        pageNo: 0,
        hasMorePage: true,
      }
      reportRightftListTmp = []
    }
  }, [])

  const setReportRightftList = (dataList: any) => {
    reportRightftListTmp = [...dataList]
    setReportRightList(dataList)
  }

  /**
   * ????????????
   */
  const scrollOnLoad = () => {
    if (!scrollInfo.hasMorePage) {
      return
    }
    // ????????????????????????
    const scrollTable = $('#taskReportContent .report_right_content')
    const viewH = scrollTable.height() || 0 //????????????
    const contentH = scrollTable[0].scrollHeight || 0 //????????????
    const scrollTop = scrollTable.scrollTop() || 0 //????????????
    if (contentH - viewH - scrollTop <= 5) {
      // ???????????????????????????????????????
      scrollInfo.hasMorePage = false
      scrollInfo.pageNo = scrollInfo.pageNo + 1
      requireReportData({ pageNo: scrollInfo.pageNo, scrollLoad: true })
    }
  }

  /**
   * ??????????????????
   */
  const requireReportData = (paramObj?: any) => {
    setLoading(true)
    const infoObj = paramObj ? paramObj : {}
    const { pageNo, scrollLoad } = infoObj
    getTaskListDays({
      taskId: props.param.data.taskId,
      onlyReport: 1,
      page: pageNo !== undefined ? pageNo : 0,
      pageSize: 5,
    }).then((resData: any) => {
      if (resData.content && resData.content.length > 0) {
        findReportGroup({
          taskId: props.param.data.taskId,
          startTime: resData.content[resData.content.length - 1],
          endTime: resData.content[0],
          orderBy: 1,
          userId: $store.getState().nowUserId,
          onlyReport: 1,
        }).then((list: any) => {
          const arrList: any = []
          let newList: any = []
          const contentList = resData.content
          contentList.map((data: string) => {
            const datalist: any = []
            list.content.map((item: any) => {
              item.editInput = false
              if (item.createDate.indexOf(data) != -1) {
                datalist.push(item)
              }
            })
            arrList.push({
              time: data,
              datalist: datalist,
            })
          })
          if (contentList.length > 0) {
            scrollInfo.hasMorePage = true
          } else {
            scrollInfo.hasMorePage = false
          }
          // ????????????????????????????????????
          if (scrollLoad) {
            newList = [...reportRightftListTmp, ...arrList]
          } else {
            newList = arrList
          }
          setReportRightftList(newList)
        })
        getPlanList({
          taskId: props.param.data.taskId,
          startTime: resData.content[resData.content.length - 1],
          endTime: resData.content[0],
          pageNo: 0,
          pageSize: 10,
          orderBy: 1,
          userId: $store.getState().nowUserId,
          onlyReport: 1,
        }).then((list: any) => {
          const arrList: any = []
          resData.content.map((data: string) => {
            const datalist: any = []
            list.content.map((item: any) => {
              item.editInput = false
              item.commentMessages = item.nextPlanModel ? item.nextPlanModel.commentMessages : []
              item.content = item.nextPlanModel.content
              item.name = '???????????????'
              if (item.createTime.indexOf(data) != -1) {
                datalist.push(item)
              }
            })
            arrList.push({
              time: data,
              datalist: datalist,
            })
          })
          setreportPlanList(arrList)
        })
      }
      setLoading(false)
      if (props.param.data.noticeType && props.param.data.noticeType == 'close_now_system') {
        ipcRenderer.send('handle_messages_option', [
          'task_report_at_me',
          props.param.data.noticeTypeId,
          props.param.data.noticeType,
        ])
      }
    })
  }
  ipcRenderer.on('handle_report_modeles', (_event, args) => {
    getTaskDetail(args.data.taskId).then((resData: any) => {
      resData.content = ''
      setReportLefftList(resData)
    })
    requireReportData()
  })
  //????????????
  const handleCancel = () => {
    props.setvisible(false)
  }
  // ????????????????????????
  const changeAuthVal = (type: number) => {
    setReprtMind(props.param.data.taskId, type).then((resData: any) => {
      if (resData.returnCode == 0) {
        message.success('????????????')
      }
    })
  }
  //????????????type---1:????????????  2:???????????????
  const viewList = (data: any, type: number, msg: any) => {
    const conentList: any = []
    msg?.map((item: any) => {
      conentList.push({
        avatar: (
          <Avatar src={item.profile || ''} style={{ background: '#4285f4' }}>
            {item.username && item.username.substr(-2, 2)}
          </Avatar>
        ),
        content: (
          <div className="commment_view_all">
            {/* <span style={{ color: '#757577' }}>{item.username}:</span> */}
            <div
              // contentEditable={false}
              // dangerouslySetInnerHTML={{
              //   __html: ,
              // }}
              onClick={(e: any) => {
                inputViewShow(type)
                data.editInput = true
                if (type == 1) {
                  setReportRightftList([...reportRightftList])
                } else if (type == 2) {
                  setreportPlanList([...reportPlanList])
                }
                btnDataList.editInput = true
                btnDataList.content = ''
                btnDataList.rootId = item.id
                btnDataList.parentId = item.id
                btnDataList.accout = item.userAccount
                btnDataList.userId = item.userId
                btnDataList.placeText = '@' + item.username
                setBtnData({ ...btnDataList })
              }}
            >
              <RenderPreImgs
                content={`<div class="callUser" id="${item.id}" rootId="${item.id}" dataName="${item.username}" userId="${item.userId}" useraccout="${item.userAccount}">${item.username}:${item.content}</div>`}
                photosRef={photosRef}
                parentNode={true}
              />
              {item.fileReturnModels && item.fileReturnModels.length != 0 && (
                <div className="attr-box">
                  <RenderFileList list={item.fileReturnModels || []} large={true} teamId={data.ascriptionId} />
                </div>
              )}
            </div>
            {item.childComments && (
              <div
                onClick={(e: any) => {
                  inputViewShow(type)
                  data.editInput = true
                  if (type == 1) {
                    setReportRightftList([...reportRightftList])
                  } else if (type == 2) {
                    setreportPlanList([...reportPlanList])
                  }
                  btnDataList.editInput = true
                  if (e.target.id) {
                    btnDataList.content = ''
                    btnDataList.rootId = e.target.attributes['data-rootid'].value
                    btnDataList.parentId = e.target.id
                    btnDataList.accout = Number(e.target.attributes['data-useraccout'].value)
                    btnDataList.userId = e.target.attributes['data-userId'].value
                    btnDataList.placeText = '@' + e.target.attributes['data-dataname'].value
                  } else if (e.target.parentNode.id) {
                    btnDataList.content = ''
                    btnDataList.rootId = e.target.parentNode.attributes['data-rootid'].value
                    btnDataList.parentId = e.target.parentNode.id
                    btnDataList.accout = Number(e.target.parentNode.attributes['data-useraccout'].value)
                    btnDataList.userId = e.target.parentNode.attributes['data-userId'].value
                    btnDataList.placeText = '@' + e.target.parentNode.attributes['data-dataname'].value
                  }
                  setBtnData({ ...btnDataList })
                }}
              >
                <AddChildComment
                  params={{
                    data: item.childComments,
                    parentName: item.username,
                    rootId: item.id,
                    ascriptionId: data.ascriptionId,
                  }}
                />
              </div>
            )}
          </div>
        ),
        datetime: (
          <>
            <span style={{ color: '#757577' }}> {moment(item.createTime).format('YYYY-MM-DD HH:mm:ss')}</span>
          </>
        ),
      })
    })

    return conentList
  }
  /**??????????????? */
  const AddChildComment = (props: any) => {
    const { data, parentName, rootId, ascriptionId } = props.params
    return (
      <>
        {data.map((item: any, index: number) => (
          <>
            <RenderRow key={index} item={item} rootId={rootId} parentName={parentName} />
            {item.childComments && item.childComments.length != 0 && (
              <AddChildComment
                params={{
                  data: item.childComments,
                  parentName: item.username,
                  rootId: rootId,
                  ascriptionId: ascriptionId,
                }}
              />
            )}
            {item.fileReturnModels && item.fileReturnModels.length != 0 && (
              <div className="attr-box">
                <RenderFileList list={item.fileReturnModels || []} large={true} teamId={ascriptionId} />
              </div>
            )}
          </>
        ))}
      </>
    )
  }

  const RenderRow = (props: any) => {
    const { item, rootId, parentName } = props
    return (
      <>
        <div
          className="callUser"
          id={item.id}
          data-rootid={rootId}
          data-dataName={item.username}
          data-userId={item.userId}
          data-useraccout={item.userAccount}
        >
          <span>{item.username}</span>????????? <span>{parentName}</span>???
          <span style={{ color: 'black' }} dangerouslySetInnerHTML={{ __html: item.content }}></span>
        </div>
        <div>
          <em style={{ fontStyle: 'inherit' }}>{item.createTime}</em>
        </div>
      </>
    )
  }

  const inputViewShow = (type: number) => {
    let oneName = false
    let twoName = false
    reportRightftList.map((item: ResDeatilData) =>
      item.datalist.forEach((data: any) => {
        if (data.editInput) {
          data.editInput = false
          oneName = true
        }
      })
    )
    reportPlanList.forEach((item: any) => {
      item.datalist.forEach((data: any) => {
        if (data.editInput) {
          data.editInput = false
          twoName = true
        }
      })
    })
    if (oneName && type != 1) {
      setReportRightftList([...reportRightftList])
    }
    if (twoName && type != 2) {
      setreportPlanList([...reportPlanList])
    }
  }

  const getInfo = (params: any) => {
    const { reportId, ascriptionId } = params
    return new Promise(resolve => {
      findCommentMessages(reportId, ascriptionId).then((sucessData: any) => {
        if (sucessData.returnCode == 0) {
          resolve(sucessData.dataList)
        }
      })
    })
  }

  /**
   * type:  1?????????????????? 2?????????????????????
   *
   */
  const addViewContent = (e: any, data: any, type: number) => {
    let pushContent = ''
    if (!data.rootId || !data.parentId) {
      pushContent = nowUser + '??????????????????????????????' + reportLefftList?.name + '???:' + btnDataList.content
    } else {
      pushContent = nowUser + '??????????????????????????????' + reportLefftList?.name + '???:' + btnDataList.content
    }
    let ascriptionId = data.ascriptionId
    let ascriptionName = data.ascriptionId
    let ascriptionType = data.ascriptionId
    let reportId = data.reportId
    let types = 0
    if (type == 2) {
      ascriptionId = data.belongId
      ascriptionName = data.belongName
      ascriptionType = data.belongType
      reportId = data.id
      types = 10
    }
    const _txt = editorRef.current.getEditor().current.innerHTML || ''
    if (_txt == '') {
      message.error('?????????????????????')
      return false
    }
    const param = {
      typeId: reportId,
      belongId: ascriptionId,
      belongName: ascriptionName,
      belongType: ascriptionType,
      content: _txt,
      type: types,
      parentId: btnDataList.parentId,
      rootId: btnDataList.rootId,
      userIds: btnDataList.userId && Number(btnDataList.userId) != nowUserId ? [btnDataList.userId] : [],
      userNames: btnDataList.accout && btnDataList.userId != nowAccount ? [btnDataList.accout] : [],
      pushContent: pushContent,
      atUserIds: atUserIds,
      temporaryId: fileId,
      taskId: data.taskId,
    }
    sendViewComm(param).then((res: any) => {
      findCommentMessages(reportId, ascriptionId).then((resData: any) => {
        if (resData.returnCode == 0) {
          // setCommentMessage(resData.dataList)
          data.editInput = false
          btnDataList.editInput = false
          setAddFiles([])
          data.commentMessages = resData.dataList
          if (type == 1) {
            setReportRightftList([...reportRightftList])
          } else if (type == 2) {
            setreportPlanList([...reportPlanList])
          }
          //??????????????????
          ipcRenderer.send('close_notice_window')
        }
      })
    })
  }
  //??????
  const unique = (arr: any) => {
    //????????????
    const hash = {}
    const newArray = arr.reduce((item: any, next: any) => {
      hash[next.userId] ? '' : (hash[next.userId] = true && item.push(next))
      return item
    }, [])
    return newArray
  }
  // ????????????????????????
  const getSolveList = (nodeData: ResDeatilData, getKey: number) => {
    let _commMsg: any
    if (!nodeData) {
      return <div></div>
    }
    if (nodeData.datalist[0].reportId !== 0) {
      getInfo({
        reportId: nodeData.datalist[0].reportId,
        ascriptionId: nodeData.datalist[0].ascriptionId,
      }).then(data => {
        _commMsg = data
      })
    }
    return (
      <div key={getKey} className={`${reportRightftList.length == 1 ? 'name_line_control' : ''}`}>
        <div className="process_date_title" data-title="2020/08/07">
          {nodeData.time}
        </div>
        <div className="process_date_conts_box">
          {nodeData.datalist &&
            nodeData.datalist.length > 0 &&
            nodeData.datalist.map((item: any, index: number) => (
              <div key={index}>
                <div className="process_normal_title submit_infos_tit">
                  <div className="submit_infos">
                    <span className="title_name getblue">{item.reportUserName}</span>
                    <span style={{ marginRight: '20%' }}>???{item.createDate.split(' ')[1]}??????</span>
                    <span className="getblue">{item.lastProcess}%</span>
                    <i></i>
                    <span className="getblue"> {item.process}%</span>
                    <span className="spend">??????????????????{item.spendTimes}??????</span>
                    <span
                      className="show_report_btn"
                      onClick={() => {
                        detailHistory.visible = true
                        detailHistory.data = {
                          taskId: item.taskId,
                          reportId: item.reportId,
                          reportUser: item.reportUserId,
                        } //reportUser ?????????
                        setDetailHistory({ ...detailHistory })
                      }}
                    ></span>
                    {props.param.type === 0 && (
                      <span
                        className="edit_report_btn"
                        onClick={() => {
                          $store.dispatch({
                            type: 'TASK_LIST_ROW',
                            data: {
                              handleBtn: {
                                id: item.taskId,
                                status: item.process == 100 ? 2 : 0,
                                executorUsername: item.reportUserName,
                                reportId: item.reportId,
                                type: 0,
                                time: Math.floor(Math.random() * Math.floor(1000)),
                                ascriptionId: getTaskTeamId(item),
                              },
                              sourceType: 'reportdetail',
                              type: 1,
                            },
                          })
                          $tools.createWindow('DailySummary')
                        }}
                      ></span>
                    )}
                  </div>
                </div>
                <div className="process_normal_content">
                  {item.models.map((data: any, num: number) => (
                    <div className="problem_box" key={num}>
                      <div className="problem_title">{data.name}</div>
                      <div
                        className="problem_cont"
                        // contentEditable={false}
                        // dangerouslySetInnerHTML={{
                        //   __html: data.content ? data.content.split(':::').join('') : '',
                        // }}
                      >
                        <RenderPreImgs
                          content={data.content ? data.content.split(':::').join('') : ''}
                          photosRef={photosRef}
                        />
                      </div>
                    </div>
                  ))}
                  {item.files && item.files.length > 0 && (
                    <div className="report-to-user-list">
                      <p>??????</p>
                      {/* <FileList list={item.files} /> */}
                      <FileList list={item.files || []} fileStyle="delStyle" />
                    </div>
                  )}

                  {item.hasOwnProperty('fileReturnModels') &&
                    Array.isArray(item.fileReturnModels) &&
                    item.fileReturnModels.length > 0 && (
                      <RenderFileList
                        list={item.fileReturnModels || []}
                        large={true}
                        teamId={item.ascriptionId}
                      />
                    )}
                  <Tabs defaultActiveKey="1" type="card" size="small" className="problem_report_navs">
                    <TabPane tab="??????" key="1">
                      {getPersonList(unique(item.isReadTaskPlanModel))}
                    </TabPane>
                    <TabPane tab="??????" key="2">
                      {getPersonList(unique(item.noReadTaskPlanModel))}
                    </TabPane>
                    <TabPane tab="????????????" key="3">
                      {getPersonList(item.reportUser)}
                    </TabPane>
                    <TabPane tab="????????????" key="4">
                      {getPersonList(item.reportCopyUser)}
                    </TabPane>
                  </Tabs>
                  {commentViewHtml(item, 1, _commMsg)}
                </div>
              </div>
            ))}
        </div>
        {nodeData.datalist && nodeData.datalist.length == 0 && <NoneData />}
      </div>
    )
  }
  //??????????????????
  const commentViewHtml = (item: any, type: number, msg: any) => {
    const _msg = msg ? msg : item.commentMessages
    // let showEditor = false
    // if (!$oldIndex) {
    //   $oldIndex = item.sigleIndex
    //   if (item.editInput) {
    //     showEditor = true
    //   }
    // } else {
    //   if ($oldIndex !== item.sigleIndex && item.editInput) {
    //     showEditor = true
    //   }
    // }
    // $oldIndex = item.sigleIndex

    return (
      <div className="commentBox">
        {_msg && _msg.length > 0 && (
          <List
            className="report_view_list"
            itemLayout="horizontal"
            dataSource={viewList(item, type, _msg)}
            renderItem={(item: any) => (
              <li>
                <Comment
                  avatar={item.avatar}
                  actions={[<span key="comment-nested-reply-to">{item.datetime}</span>]}
                  content={
                    <p>
                      <p>{item.content}</p>
                      {item.fileReturnModels && item.fileReturnModels.length != 0 && (
                        <div className="attr-box">
                          <RenderFileList
                            list={item.fileReturnModels || []}
                            large={true}
                            teamId={item.ascriptionId}
                          />
                        </div>
                      )}
                    </p>
                  }
                />
              </li>
            )}
          />
        )}

        {!btnDataList.editInput && (
          <div
            className="opinion-textareas"
            onClick={() => {
              inputViewShow(type)
              if (type == 1) {
                item.editInput = true
                setReportRightftList([...reportRightftList])
              } else if (type == 2) {
                item.editInput = false
                btnDataList.editInput = false
                setreportPlanList([...reportPlanList])
              }
              btnDataList.editInput = true
              btnDataList.content = ''
              btnDataList.rootId = ''
              btnDataList.parentId = ''
              btnDataList.accout = 0
              btnDataList.userId = item.reportUserId
              btnDataList.placeText = '?????????????????????'
              setBtnData({
                ...btnDataList,
              })
            }}
          >
            {type == 1 && <div className="textarea_set">?????????????????????</div>}
          </div>
        )}

        {/* {item.editInput && ( */}
        {btnDataList.editInput && (
          <>
            <div className="editorBox">
              <ApprovalcommentEditor
                source="taskReportDetail"
                ref={editorRef}
                param={{
                  sourceType: 'synergyMain',
                  currentType: 'replayRepoert',
                  handleBtnShow: true,
                  replay,
                  setFileList: ({ fileItem, imgUrl }: any) => {},
                  delCommentTxt: () => {},
                  compCommentHight: () => {},
                  setStatus,
                  teamId: item.ascriptionId,
                  atUserIds,
                  addFiles,
                  setAtUserIds,
                  setAddFiles,
                  fileModelss,
                  item,
                  getFileId: (uuid: any) => {
                    setFileId(uuid)
                  },
                }}
              />
            </div>
            <div className="report_view_btn">
              <Button
                className="cancleBtn"
                onClick={() => {
                  item.editInput = false
                  btnDataList.editInput = false
                  if (type == 1) {
                    setReportRightftList([...reportRightftList])
                  } else if (type == 2) {
                    setreportPlanList([...reportPlanList])
                  }
                }}
              >
                ??????
              </Button>
              <Button
                className="sendBtn"
                onClick={e => {
                  addViewContent(e, item, type)
                }}
              >
                ??????
              </Button>
            </div>
          </>
        )}
      </div>
    )
  }
  // ??????????????????????????????
  const getPersonList = (list: any) => {
    return (
      <div className="report_list">
        {list?.map((item: PersonType, index: number) => (
          <div className="report_des_peo_box flex column center" key={index} title={item.username}>
            <Avatar src={item.profile || ''} style={{ background: '#4285f4' }}>
              {item.username && item.username.substr(-2, 2)}
            </Avatar>
            <span className="report_des_name">{item.username}</span>
          </div>
        ))}
      </div>
    )
  }
  // ?????????????????????
  const getPlanSolveList = (nodeData: ResDeatilData, getKey: number) => {
    if (!nodeData) {
      return false
    }
    return (
      <div key={getKey}>
        <div className="process_date_title" data-title="2020/08/07">
          {nodeData.time}
        </div>
        {nodeData.datalist &&
          nodeData.datalist.length > 0 &&
          nodeData.datalist.map((item: any, index: number) => (
            <div className="process_date_conts_box" key={item.id}>
              <div className="process_normal_title submit_infos_tit">
                <div className="submit_infos">
                  <span className="title_name getblue">{item.username || item.reportUserName}</span>
                  <span style={{ marginRight: '30%' }}>???{item.createTime.split(' ')[1]}??????</span>
                </div>
              </div>
              <div className="process_normal_content">
                {item.nextPlanModel && (
                  <div className="problem_box">
                    <div className="problem_title">???????????????</div>
                    <div
                      className="problem_cont"
                      // contentEditable={false}
                      // dangerouslySetInnerHTML={{
                      //   __html: item.content ? item.content.split(':::').join('') : '',
                      // }}
                    >
                      <RenderPreImgs
                        content={item.content ? item.content.split(':::').join('') : ''}
                        photosRef={photosRef}
                      />
                    </div>
                  </div>
                )}
                {commentViewHtml(item, 2, '')}
              </div>
            </div>
          ))}
        {nodeData.datalist && nodeData.datalist.length == 0 && (
          <div className="process_date_conts_box" style={{ border: 'none' }}>
            <NoneData />
          </div>
        )}
      </div>
    )
  }
  const workPrint = () => {
    setVisiblePrint(true)
  }
  //????????????modal
  const cloasePrintModal = () => {
    setVisiblePrint(false)
  }
  //??????
  const workShare = () => {
    $store.dispatch({
      type: 'WORKPLAN_MODAL',
      data: {
        quoteMsg: quoteMsg,
      },
    })
    const contentJson = {
      id: Number(quoteMsg.reportId),
      content: quoteMsg.name,
      title: quoteMsg.title,
      taskId: quoteMsg.id,
    }
    const chatMsg = {
      type: 6,
      messageJson: {
        type: 4,
        contentJson: JSON.stringify(contentJson),
      },
    }
    setShareCon(JSON.stringify(chatMsg))
    setShareToRoomParam({
      shareToRoomModalShow: true,
      titName: '????????????',
    })
  }

  const DeatilSolve = () => {
    return (
      <div className="task_report_content" id="taskReportContent">
        <div className="task_report_wrapper">
          {/* ??????????????? */}
          <div className="reportTaskDetailOpenCon">
            {reportLefftList && (
              <>
                <section className="oneReportProgress flex space_between flex_wrap">
                  <div className="report_des_peo_box flex column">
                    <Avatar
                      size={34}
                      style={{
                        marginBottom: 4,
                      }}
                      src={getDifferImage(reportLefftList.percent || 0).img}
                    ></Avatar>
                    <span>{getDifferImage(reportLefftList.percent || 0).text}</span>
                  </div>
                  <div className="progress_right flex-1 column center">
                    <Progress percent={reportLefftList.percent || 0} size="small" />
                    <div className="progress_bot flex">
                      <span>?????????{reportLefftList.startTime}</span>
                      <span>?????????{reportLefftList.endTime}</span>
                    </div>
                  </div>
                </section>
                <div className="report_person">
                  <Avatar className="oa-avatar" src={reportLefftList.liableUserProfile || ''}>
                    {reportLefftList.liableUsername && reportLefftList.liableUsername.substr(-2, 2)}
                  </Avatar>
                  <span className="report_person_titile">{reportLefftList.name}</span>
                </div>
                <div className="report_descrip">
                  ????????????:
                  <div
                    className="cont_box"
                    // contentEditable={false}
                    // dangerouslySetInnerHTML={{ __html: reportLefftList.description }}
                    data-configid={reportLefftList.id}
                  >
                    <RenderPreImgs
                      content={
                        reportLefftList.description ? reportLefftList.description.split(':::').join('') : ''
                      }
                      photosRef={photosRef}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
          {/* ?????????????????? */}
          <div className="report_right_child_box">
            <div className="report_right_content">
              <Row className="report_right_header">
                <Col span={12}>????????????</Col>
                <Col span={12}>???????????????</Col>
              </Row>
              <div className="lines"></div>
              {props.param.type === 1 && !props.param.data.disable && (
                <Row className="report_right_choose">
                  <Col span={12}>
                    <span style={{ color: '#212224' }}>????????????????????????</span>
                    <Radio.Group
                      name="radiogroup"
                      value={acceptMind}
                      onChange={e => {
                        setAcceptMind(e.target.value)
                        changeAuthVal(e.target.value)
                      }}
                    >
                      <Radio value={1}>???</Radio>
                      <Radio value={0}>???</Radio>
                    </Radio.Group>
                  </Col>
                  <Col span={12}></Col>
                </Row>
              )}
              {reportRightftList.length > 0 &&
                reportRightftList.map((item: ResDeatilData, index: number) => (
                  <Row className="process_item_box" key={index}>
                    <Col className="process_cont_box">
                      {/* <GetSolveList nodeData={item} getKey={index} /> */}
                      {getSolveList(item, index)}
                    </Col>
                    <Col className="process_cont_box">{getPlanSolveList(reportPlanList[index], index)}</Col>
                  </Row>
                ))}
              {!reportRightftList ||
                (reportRightftList && reportRightftList.length == 0 && (
                  <Row className="process_item_box">
                    <Col className="process_cont_box">
                      {' '}
                      <div className="process_date_conts_box" style={{ border: 'none' }}>
                        <NoneData />
                      </div>
                    </Col>
                    <Col className="process_cont_box">
                      {' '}
                      <div className="process_date_conts_box" style={{ border: 'none' }}>
                        <NoneData />
                      </div>
                    </Col>
                  </Row>
                ))}
            </div>
          </div>
        </div>
      </div>
    )
  }
  return (
    <>
      <Modal
        title={
          <div className="top_title_box" key={'reportdetails'}>
            <div className="titles">????????????</div>
            {!props.param.data.disable && (
              <div className="btn_box">
                <Tooltip placement="bottomLeft" title="??????" arrowPointAtCenter>
                  <span className="work-share" onClick={workShare}></span>
                </Tooltip>
                <Tooltip placement="bottomLeft" title="??????" arrowPointAtCenter>
                  <span className="work-print" onClick={workPrint}></span>
                </Tooltip>
                <Tooltip placement="bottomLeft" title="??????" arrowPointAtCenter>
                  <span
                    className="work-derive"
                    onClick={() => {
                      PdfDownload({ eleId: 'taskReportContent', fileName: '????????????' })
                    }}
                  ></span>
                </Tooltip>
              </div>
            )}
          </div>
        }
        visible={props.param.visible}
        onCancel={handleCancel}
        maskClosable={false}
        keyboard={false}
        className="TaskReportDeatil"
        footer={null}
        confirmLoading={true}
      >
        <Spin spinning={loading} tip={'???????????????????????????'}>
          {DeatilSolve()}
          {visiblePrint && <PrintModal onClose={cloasePrintModal}>{DeatilSolve()}</PrintModal>}
        </Spin>
      </Modal>
      {/* ?????????????????? */}
      {shareToRoomParam.shareToRoomModalShow && (
        <ChatForwardModal
          visible={shareToRoomParam.shareToRoomModalShow}
          chatMsg={shareCon}
          teamId={selectTeamId}
          onSelected={() => {
            setShareToRoomParam({
              shareToRoomModalShow: false,
            })
          }}
          onCancelModal={() => {
            setShareToRoomParam({
              shareToRoomModalShow: false,
            })
          }}
          dataAuth={true}
          findType={0}
          permissionType={3}
          isQueryAll={1}
          pageSize={10}
          selectList={{
            nowUserId,
            nowUser,
            curType: 0,
            nowAccount,
            profile: userInfo.profile,
            disable: true,
          }}
        />
      )}
      {/* <ShareToRoomModal
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
      /> */}

      <PhotosPreview ref={photosRef} />
      {detailHistory.visible && (
        <ReportHistoryModel
          param={{ ...detailHistory, type: 0 }}
          setvisible={(state: any, editValue: any) => {
            if (editValue) {
              requireReportData()
            }
            setDetailHistory({ ...detailHistory, visible: state })
          }}
        />
      )}
    </>
  )
}
export default TaskReportModel
