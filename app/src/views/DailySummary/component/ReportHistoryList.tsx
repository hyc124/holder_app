import React, { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { Modal, Carousel, Progress, Tabs, Avatar, List, Comment, message, Button, Spin } from 'antd'
import {
  historyReport,
  sendViewComm,
  findCommentMessages,
  taskReportDetail,
} from '../../../views/DailySummary/common/getReprt'
import moment from 'moment'
import './ReportMangerModel.less'
import FileList from '../../../components/file-list/file-list'
import { RenderPreImgs, PhotosPreview } from '@/src/components/normal-preview/normalPreview'
import { ApprovalcommentEditor } from '../../approval/components/ApprovalcommentEditor'
import { RenderFileList } from '../../mettingManage/component/RenderUplodFile'
const changeNowList = {
  variableWidth: true,
  arrows: true,
  autoplay: false,
  speed: 200,
  autoplaySpeed: 600,
  cssEase: 'fade',
}
interface PersonType {
  userId: number
  username: string
  type: number
  userRead: number
  profile: string
}
const { TabPane } = Tabs
let logEdit: any
const ReportHistoryModel = (props: any) => {
  const [loading, setLoading] = useState(true)
  const { nowUser, nowAccount } = $store.getState()
  const [historyListData, setHistoryListData] = useState<any[]>([])
  const [editInputHtml, setEditInputHtml] = useState(false)
  // const [nameRef, setNameRef] = useState(null)
  const [getIndex, setGetIndex] = useState(0)
  const [btnDataList, setBtnData] = useState({
    content: '',
    rootId: '',
    parentId: '',
    accout: 0,
    userId: '',
    reportUserId: '',
    placeText: '',
  })
  const nameRef: any = useRef<any>(null)
  // 图片预览框组件
  const photosRef = useRef<any>(null)
  const editorRef = useRef<any>(null)
  const [replay] = useState<any>({ replayTip: '给Ta评论' })
  //输入变化状态
  const [status, setStatus] = useState<any>()
  //获取@成员
  const [atUserIds, setAtUserIds] = useState<any>([])
  //获取添加的附件
  const [addFiles, setAddFiles] = useState<any>([])
  const [fileModelss] = useState<any>([])
  //存储当前回复框的的附件UUID
  const [fileId, setFileId] = useState('')

  //获取输入框焦点
  useEffect(() => {
    setLoading(true)
    if (props.param.visible) {
      logEdit = false
      if (props.param.type == 0) {
        //查询历史所有汇报
        historyReport(props.param.data.taskId, props.param.data.reportUser).then((res: any) => {
          setHistoryListData(res.dataList)
          if (res.dataList && res.dataList.length > 0) {
            res.dataList.forEach((element: any, index: number) => {
              if (element.reportId == props.param.data.reportId) {
                setGetIndex(index)
              }
            })
          }
          setLoading(false)
        })
      }
      if (props.param.type == 1) {
        //查询当前汇报详情
        taskReportDetail(props.param.data.taskId, props.param.data.type).then((res: any) => {
          setHistoryListData([res.data])
          setLoading(false)
        })
      }
    }
  }, [props.param])
  const handleCancel = () => {
    props.setvisible(false, logEdit)
  }

  useEffect(() => {
    if (status) {
      setBtnData({ ...btnDataList, content: editorRef.current.getEditor().current.innerHTML })
    }
  }, [status])

  //评论列表type---1:任务动态  2:下一步计划
  const viewList = (data: any) => {
    const conentList: any = []
    data.commentMessages?.map((item: any) => {
      conentList.push({
        avatar: (
          <Avatar src={item.profile || ''} style={{ background: '#4285f4' }}>
            {item.username.substr(-2, 2)}
          </Avatar>
        ),
        content: (
          <div className="commment_view_all">
            <div
              contentEditable={false}
              // dangerouslySetInnerHTML={{
              //   __html: `<div class="callUser" id="${item.id}" rootId="${item.id}" dataName="${item.username}" userId="${item.userId}" useraccout="${item.userAccount}">${item.content}</div>`,
              // }}
              onClick={(e: any) => {
                setEditInputHtml(true)
                btnDataList.content = ''
                btnDataList.rootId = item.id
                btnDataList.parentId = item.id
                btnDataList.accout = item.userAccount
                btnDataList.userId = item.userId
                btnDataList.placeText = '@' + item.username
                btnDataList.reportUserId = ''
                setBtnData({ ...btnDataList })
              }}
            >
              <RenderPreImgs
                content={`<div class="callUser" id="${item.id}" rootId="${item.id}" dataName="${item.username}" userId="${item.userId}" useraccout="${item.userAccount}">${item.content}</div>`}
                photosRef={photosRef}
              />
              <RenderFileList list={item.fileReturnModels || []} large={true} teamId={data.ascriptionId} />
            </div>
            {item.childComments &&
              [1].map(() => {
                // const html = addChildComment(item.childComments, item.username, item.id)
                return (
                  <div
                    key={1}
                    contentEditable={false}
                    // dangerouslySetInnerHTML={{
                    //   __html: html,
                    // }}
                    onClick={(e: any) => {
                      if (e.target.id) {
                        btnDataList.content = ''
                        btnDataList.rootId = e.target.attributes['data-rootid'].value
                        btnDataList.parentId = e.target.id
                        btnDataList.accout = Number(e.target.attributes['data-useraccout'].value)
                        btnDataList.userId = e.target.attributes['data-userId'].value
                        btnDataList.placeText = '@' + e.target.attributes['data-dataname'].value
                        btnDataList.reportUserId = ''
                        setBtnData({ ...btnDataList })
                      } else if (e.target.parentNode.id) {
                        btnDataList.content = ''
                        btnDataList.rootId = e.target.parentNode.attributes['data-rootid'].value
                        btnDataList.parentId = e.target.parentNode.id
                        btnDataList.accout = Number(e.target.parentNode.attributes['data-useraccout'].value)
                        btnDataList.userId = e.target.parentNode.attributes['data-userId'].value
                        btnDataList.placeText = '@' + e.target.parentNode.attributes['data-dataname'].value
                        btnDataList.reportUserId = ''

                        setBtnData({ ...btnDataList })
                      }
                      setEditInputHtml(true)
                    }}
                  >
                    <AddChildComment
                      params={{
                        data: item.childComments,
                        parentName: item.username,
                        rootId: item.id,
                        teamId: data.ascriptionId,
                      }}
                    />
                  </div>
                )
              })}
          </div>
        ),
        datetime: (
          <span style={{ color: '#757577' }}>{moment(item.createTime).format('YYYY-MM-DD HH:mm:ss')}</span>
        ),
      })
    })

    return conentList
  }

  /**填充子评论 */
  const AddChildComment = (props: any) => {
    const { data, parentName, rootId, teamId } = props.params
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
                  teamId: teamId,
                }}
              />
            )}
            {item.fileReturnModels && item.fileReturnModels.length != 0 && (
              <div className="attr-box">
                <RenderFileList list={item.fileReturnModels || []} large={true} teamId={teamId} />
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
          <span>@{item.username}</span>：回复 <span>@{parentName}</span>：
          <span style={{ color: 'black' }} dangerouslySetInnerHTML={{ __html: item.content }}></span>
        </div>
        <div>
          <em style={{ fontStyle: 'inherit' }}>{item.createTime}</em>
        </div>
      </>
    )
  }

  useLayoutEffect(() => {
    if (getIndex && !loading) {
      setTimeout(() => {
        if (nameRef && nameRef.current) {
          nameRef.current.goTo(getIndex)
        }
      }, historyListData.length * 180)
    }
  }, [nameRef, loading])
  /**
   * type:  1任务动态评论 2任务下一步计划
   *
   */
  const addViewContent = (e: any, data: any) => {
    let pushContent = ''
    if (!data.rootId || !data.parentId) {
      pushContent =
        nowUser +
        `评论了你的${data.taskModel?.type == 1 ? '项目' : '任务'}汇报【` +
        data.taskModel.name +
        '】:' +
        btnDataList.content
    } else {
      pushContent =
        nowUser +
        `回复了你的${data.taskModel?.type == 1 ? '项目' : '任务'}汇报【` +
        data.taskModel.name +
        '】:' +
        btnDataList.content
    }
    if (btnDataList.content == '') {
      message.error('请填写评论内容')
      return false
    }
    const userIds = btnDataList?.userId
      ? [btnDataList?.userId]
      : btnDataList?.reportUserId
      ? [btnDataList?.reportUserId]
      : []
    const param = {
      typeId: data.reportId,
      belongId: data.ascriptionId,
      belongName: data.ascriptionName,
      belongType: data.ascriptionType,
      content: btnDataList.content,
      type: 0,
      parentId: btnDataList.parentId,
      rootId: btnDataList.rootId,
      userIds, //父级id合集
      userNames: btnDataList.accout && btnDataList.userId != nowAccount ? [btnDataList.accout] : [],
      pushContent: pushContent,
      temporaryId: fileId,
      atUserIds: atUserIds,
    }
    sendViewComm(param).then((res: any) => {
      findCommentMessages(data.reportId, data.ascriptionId).then((sucessData: any) => {
        if (sucessData.returnCode == 0) {
          logEdit = true
          data.commentMessages = sucessData.dataList
          setEditInputHtml(false)
          setAddFiles([])
          setAtUserIds([])
        }
      })
    })
  }
  //评论界面处理
  const commentViewHtml = (item: any) => {
    return (
      <>
        {item.commentMessages && item.commentMessages.length > 0 && (
          <List
            className="report_view_list"
            itemLayout="horizontal"
            dataSource={viewList(item)}
            renderItem={(item: any) => (
              <li>
                <Comment avatar={item.avatar} content={item.content} datetime={item.datetime} />
              </li>
            )}
          />
        )}
      </>
    )
  }
  const CarouseChange = (currentSlide: number) => {
    btnDataList.content = ''
    btnDataList.rootId = ''
    btnDataList.parentId = ''
    btnDataList.accout = 0
    btnDataList.userId = ''
    btnDataList.placeText = ''
    btnDataList.reportUserId = ''
    setBtnData({ ...btnDataList })
    setEditInputHtml(false)
    if (currentSlide != -1) {
      setGetIndex(currentSlide)
    }
  }
  return (
    <Modal
      title={
        <div className="report-detail-header">
          <span className="submit_time">
            {historyListData[getIndex] ? historyListData[getIndex].createDate : ''}
          </span>
          <span className="title">
            {historyListData[getIndex]?.taskModel?.type == 1 ? '项目' : '任务'}汇报详情
          </span>
        </div>
      }
      visible={props.param.visible}
      onCancel={handleCancel}
      maskClosable={false}
      className="reportDetailMask"
      footer={null}
      width="850px"
    >
      <Spin spinning={loading} tip={'加载中，请耐心等待'}>
        <Carousel {...changeNowList} afterChange={CarouseChange} ref={nameRef}>
          {historyListData.map((text: any, index: number) => (
            <div className="report_Detail_Content" key={index}>
              <div className="report-detail-body">
                <div className="report_text_one">
                  <div className="report_text_one_header flex">
                    <p>执行人：{text.taskModel.liableUsername}</p>
                    <p>汇报人：{text.reportUserName}</p>
                  </div>
                  <div className="report_name">
                    {text.taskModel?.type == 1 ? '项目' : '任务'}名称：{text.taskModel.name}
                  </div>
                  <div className="report_text_title_info">
                    <div className="row row-no-margin">
                      <p>{text.taskModel?.type == 1 ? '项目' : '任务'}描述:</p>
                      <div
                        className="cont_box"
                        contentEditable={false}
                        // dangerouslySetInnerHTML={{ __html: text.taskModel.description }}
                        data-configid={text.taskModel.id}
                      >
                        <RenderPreImgs content={text.taskModel.description || ''} photosRef={photosRef} />
                      </div>
                    </div>
                    <div className="report_name_date">
                      <span>{text.taskModel.startTime ? text.taskModel.startTime : '/'}</span>
                      {' 一 '}
                      {text.taskModel.endTime}
                      <p className="planSpend">
                        计划使用<span>{text.taskModel.expectSpend}小时</span>完成该
                        {text.taskModel?.type == 1 ? '项目' : '任务'}
                      </p>
                    </div>
                  </div>
                  <div className="progress_right flex-1 column center">
                    <Progress percent={text.process} size="small" />
                    <div className="report-progress-spend flex">本次进度消耗{text.spendTimes || 0}小时</div>
                  </div>
                </div>
                <div className="report-item-list">
                  {text.models.map((data: any, num: number) => (
                    <div className="problem_box" key={num}>
                      <div className="problem_title">{data.name}</div>
                      <div
                        className="problem_cont"
                        contentEditable={false}
                        // dangerouslySetInnerHTML={{
                        //   __html: data.content ? data.content.split(':::').join('') : '',
                        // }}
                      >
                        {' '}
                        <RenderPreImgs
                          content={data.content ? data.content.split(':::').join('') : ''}
                          photosRef={photosRef}
                        />
                      </div>
                    </div>
                  ))}
                  {text.nextPlanModel &&
                    text.nextPlanModel.map((data: any, num: number) => (
                      <div className="problem_box" key={num}>
                        <div className="problem_title">下一步计划</div>
                        <div className="problem_cont" contentEditable={false}>
                          {' '}
                          <RenderPreImgs
                            content={data.content ? data.content.split(':::').join('') : ''}
                            photosRef={photosRef}
                          />
                        </div>
                      </div>
                    ))}
                </div>
                <Tabs defaultActiveKey="1">
                  <TabPane tab="已读" key="1">
                    {getPersonList(text.isReadTaskPlanModel)}
                  </TabPane>
                  <TabPane tab="未读" key="2">
                    {getPersonList(text.noReadTaskPlanModel)}
                  </TabPane>
                  <TabPane tab="汇报对象" key="3">
                    {getPersonList(text.reportUser)}
                  </TabPane>
                </Tabs>
                <div className="report-to-user-list">
                  <p>附件</p>
                  <FileList list={text.fileReturnModels} />
                </div>
                {commentViewHtml(text)}
              </div>
            </div>
          ))}
        </Carousel>
      </Spin>
      <div>
        {!editInputHtml && !loading && (
          <div
            className="opinion-textareas"
            onClick={(e: any) => {
              setEditInputHtml(true)
              btnDataList.content = ''
              btnDataList.rootId = ''
              btnDataList.parentId = ''
              btnDataList.accout = 0
              btnDataList.userId = ''
              btnDataList.placeText = '请在此填写评论'
              btnDataList.reportUserId = historyListData[getIndex].reportUserId
              setBtnData({
                ...btnDataList,
              })
            }}
          >
            <div className="textarea_set">可在此填写评论</div>
          </div>
        )}

        {editInputHtml && (
          <div className="AppCommentEditorBox">
            <div className="editorBox">
              <ApprovalcommentEditor
                ref={editorRef}
                param={{
                  sourceType: 'synergyMain',
                  currentType: 'replayRepoert',
                  handleBtnShow: true,
                  replay,
                  teamId: historyListData[getIndex].ascriptionId,
                  setFileList: () => {},
                  delCommentTxt: () => {},
                  compCommentHight: () => {},
                  setStatus,
                  atUserIds,
                  addFiles,
                  setAtUserIds,
                  setAddFiles,
                  fileModelss,
                  item: btnDataList.content,
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
                  setEditInputHtml(false)
                }}
              >
                取消
              </Button>
              <Button
                className="sendBtn"
                onClick={e => {
                  addViewContent(e, historyListData[getIndex])
                }}
              >
                发送
              </Button>
            </div>
          </div>
        )}
      </div>
      {/* 预览图片 */}
      <PhotosPreview ref={photosRef} />
    </Modal>
  )
}
// 已读、未读、汇报对象
const getPersonList = (list: any) => {
  return (
    <div className="report_list flex">
      {list.map(
        (item: PersonType, index: number) =>
          item.username && (
            <div className="report_des_peo_box flex column center" key={index}>
              <Avatar src={item.profile || ''} style={{ background: '#4285f4' }}>
                {item.username && item.username.substr(-2, 2)}
              </Avatar>
              <span>{item.username}</span>
            </div>
          )
      )}
    </div>
  )
}
export default ReportHistoryModel
