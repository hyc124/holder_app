import { useEffect, useState, useRef, useLayoutEffect } from 'react'
import React from 'react'
import { Modal, Tooltip, message, Button, Avatar, Divider, Input } from 'antd'
import ChatForwardModal from '@/src/components/chat-forward-modal'
import { PdfDownload } from '../../../common/js/PdfDownload'
import PrintModal from '@/src/components/print-modal/PrintModal'
import './okrReportDetails.less'
import { getTaskBelong } from '../../task/taskDetails/detailAttach'
import { requestApi } from '../../../common/js/ajax'
import Editor from '@/src/components/editor/index'
import { RenderPreImgs } from '@/src/components/normal-preview/normalPreview'
import { HeaderComponet, RederUsersCom, RenderItem, TaskInfoComponet } from '../../task/taskDynamic/dynamicCom'
import { RenderFileList } from '../../mettingManage/component/RenderUplodFile'
import { ipcRenderer } from 'electron'
import { getTaskTeamId } from '../../myWorkDesk/myWorkDesk'
// 缓存当前是否请求下一页数据状态
let loadMore = false
// 缓存当前是否还有更多数据
let noMoreData = false
// 缓存滚动可是区域高度
let scrollContainer: any
const arr: any = {}
const OkrReportDetails = (params: any) => {
  // 已读未读弹窗
  const containerRef: any = useRef(null) //当前的内容区域
  const { nowUser, nowAccount, nowUserId, userInfo } = $store.getState()
  //是否显示打印弹窗
  const [visiblePrint, setVisiblePrint] = useState({
    visible: false, //是否显示打印弹窗
    okrMainData: arr, //okr主标题内容详情数据
    okrReportData: [], //okr汇报详情数据
    visibleSharePop: false, //是否显示选择分享的窗口
    quoteMsg: {
      //选择分享的当前数据
      id: '',
      name: '',
      reportId: '',
      type: '',
      title: '',
      val: '',
    },
  })
  useEffect(() => {
    if (params.param.visible) {
      reportDetails()
    }
  }, [])
  useLayoutEffect(() => {
    ipcRenderer.on('refresh_operated_task', (_: any, data: any) => {
      if (data.sourceType == 'okr_progress' && params.param.visible) {
        reportDetails()
      }
    })
    scrollContainer = $('.okr-report-details .ant-modal-body')
    scrollContainer.off('mousewheel').on('mousewheel', '.okr-modal-cont', (e: any) => {
      const containerHeight = $('.okr-report-details .okr-modal-main').height() || 0 //可见高度
      const contentHeight = containerRef.current.offsetHeight || 0 //内容高度
      // 下滚加载分页
      if (e.originalEvent.wheelDelta <= 0) {
        if (noMoreData) {
          return
        }
        // 监听滚动事件
        const scrollTop = $('.okr-report-details .okr-modal-main').scrollTop() || 0 //滚动高度
        if (contentHeight - containerHeight - scrollTop <= 5 && !loadMore) {
          loadMore = true
          const nowData: any = visiblePrint.okrReportData[visiblePrint.okrReportData.length - 1]
          reportDetails({ scrollLoad: true, time: nowData.createTime })
        }
      }
    })

    return () => {
      if (loadMore) loadMore = false
      if (noMoreData) noMoreData = false
    }
  }, [])
  //   查询okr详情
  const reportDetails = (anmeScroll?: any) => {
    const param = {
      taskId: params.param.data.taskId,
      setTime: anmeScroll ? anmeScroll.time : '',
      userId: nowUserId,
    }

    requestApi({
      url: '/task/report/findOkrInfo',
      param: param,
      json: false,
    }).then((res: any) => {
      if (res.success) {
        const nowDataes: any = res.data.data
        const _dataList: any = nowDataes.dynamics.content || []
        noMoreData = _dataList.length === 0
        if (anmeScroll) {
          if (_dataList.length == 0) {
            message.warning('没有更多数据了！')
          } else {
            visiblePrint.okrReportData = visiblePrint.okrReportData.concat(_dataList)
            setVisiblePrint({ ...visiblePrint })
          }
        } else {
          visiblePrint.quoteMsg = {
            id: nowDataes.id,
            reportId: _dataList[0] ? _dataList[0].typeId : '',
            name: nowDataes.name
              ? nowDataes.name.replace(/<!--[\w\W\r\n]*?-->/gim, '').replace(/<\/?.+?\/?>/g, '')
              : '',
            type: 'okrReport',
            title: `${nowDataes.liableUsername}的OKR进展(${nowDataes.periodText})`,
            val: '',
          }
          visiblePrint.okrMainData = nowDataes
          visiblePrint.okrReportData = _dataList
          setVisiblePrint({ ...visiblePrint })
        }
      }
      loadMore = false
    })
  }
  //分享okr汇报详情
  const workShare = () => {
    visiblePrint.visibleSharePop = true
    setVisiblePrint({ ...visiblePrint })
  }
  //打印界面控制
  const workPrint = () => {
    visiblePrint.visible = true
    setVisiblePrint({ ...visiblePrint })
  }
  //关闭打印modal
  const cloasePrintModal = () => {
    visiblePrint.visible = false
    setVisiblePrint({ ...visiblePrint })
  }
  //提醒、取消提醒
  const remindClick = () => {
    const paramData = {
      taskId: params.param.data.taskId,
      userId: nowUserId,
      type: visiblePrint.okrMainData.subscribe ? 0 : 1,
      idType: 0,
    }
    requestApi({
      url: '/task/report/subscribe/remind',
      param: paramData,
      json: false,
    }).then((res: any) => {
      if (res.success) {
        message.success('修改成功')
        visiblePrint.okrMainData.subscribe = paramData.type
        setVisiblePrint({ ...visiblePrint })
      } else {
        message.error(res.data.returnMessage)
      }
    })
  }

  // 分享OKR进展到群聊的参数
  const contentJson = {
    id: Number(visiblePrint.quoteMsg.reportId),
    content: visiblePrint.quoteMsg.name,
    title: visiblePrint.quoteMsg.title,
    taskId: visiblePrint.quoteMsg.id,
  }
  const chatMsg = {
    type: 6,
    messageJson: {
      type: 5,
      contentJson: JSON.stringify(contentJson),
    },
  }
  return (
    <div>
      <Modal
        visible={params.param.visible}
        className="okr-report-details"
        maskClosable={false}
        keyboard={false}
        width={850}
        title={'进展详情'}
        footer={null}
        onCancel={() => {
          params.setvisible(false)
        }}
      >
        <div id="okr_top_title">
          <div className="okr_top_title" key={'okreportdetails'}>
            {visiblePrint.okrMainData.attach && (
              <div className="header_content flex center-v">
                <em
                  className={`img_icon ${
                    visiblePrint.okrMainData.workPlanType == 2 ? 'name_flag' : 'Krname_flag'
                  }`}
                >
                  {visiblePrint.okrMainData.workPlanType == 3 ? 'KR' : ''}
                </em>
                <div style={{ display: 'inline-block', width: 'calc(100% - 73px)' }}>
                  {/* 任务名称 */}
                  <div className="taskNameBox">
                    <span
                      className={`taskNameShow pointerDisable text-ellipsis`}
                      style={{ width: '100%', verticalAlign: 'bottom' }}
                    >
                      {visiblePrint.okrMainData.name}
                    </span>
                  </div>
                  {/* 归属信息 */}
                  <div className="persionInfoRow flex center-v">
                    <div className="time_filter">
                      <span>{visiblePrint.okrMainData.periodText}</span>
                    </div>
                    <span className="verLine14"></span>
                    <span className="persionInfo_icon"></span>
                    <div className={`persionInfoItem flex pointerDisable`}>
                      <Tooltip
                        title={
                          getTaskBelong(
                            visiblePrint.okrMainData.attach,
                            visiblePrint.okrMainData.ascriptionName
                          ).belongTxt || ''
                        }
                      >
                        <span className="belong_info my_ellipsis">
                          {getTaskBelong(
                            visiblePrint.okrMainData.attach,
                            visiblePrint.okrMainData.ascriptionName
                          ).rangTxt
                            ? getTaskBelong(
                                visiblePrint.okrMainData.attach,
                                visiblePrint.okrMainData.ascriptionName
                              ).rangTxt +
                              '- 归属于' +
                              getTaskBelong(
                                visiblePrint.okrMainData.attach,
                                visiblePrint.okrMainData.ascriptionName
                              ).belongTxt
                            : '无归属'}
                        </span>
                      </Tooltip>
                    </div>
                    <span className="verLine14"></span>
                    {/* 责任人 */}
                    <div className={`liableRow flex between center-v pointerDisable`}>
                      <div className="memberItem">
                        <Avatar
                          key="liable"
                          className="oa-avatar"
                          src={visiblePrint.okrMainData.liableUserProfile}
                          size={24}
                          style={{
                            width: '24px',
                            height: '24px',
                            marginRight: '4px',
                            backgroundColor: !visiblePrint.okrMainData.liableUsername ? 'inherit' : '#4285f4',
                          }}
                        >
                          {visiblePrint.okrMainData.liableUsername
                            ? visiblePrint.okrMainData.liableUsername.substr(-2, 2)
                            : ''}
                        </Avatar>
                      </div>
                      <span className="liable_name">{visiblePrint.okrMainData.liableUsername || ''}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="btn_box">
              <Tooltip
                placement="bottomLeft"
                title={!visiblePrint.okrMainData.subscribe ? '开启提醒' : '关闭提醒'}
                arrowPointAtCenter
              >
                <span
                  className={`remind_edit ${!visiblePrint.okrMainData.subscribe ? 'not_allow' : ''}`}
                  onClick={remindClick}
                ></span>
              </Tooltip>
              <Tooltip placement="bottomLeft" title="分享" arrowPointAtCenter>
                <span className="work-share" onClick={workShare}></span>
              </Tooltip>
              <Tooltip placement="bottomLeft" title="打印" arrowPointAtCenter>
                <span className="work-print" onClick={workPrint}></span>
              </Tooltip>
              <Tooltip placement="bottomLeft" title="下载" arrowPointAtCenter>
                <span
                  className="work-derive"
                  onClick={() => {
                    PdfDownload({ eleId: 'okr-modal-cont', fileName: 'okr汇报' })
                  }}
                ></span>
              </Tooltip>
            </div>
          </div>
          <div className="okr-modal-main">
            <div className="okr-modal-cont" ref={containerRef} id="okr-modal-cont">
              {visiblePrint.okrReportData.length !== 0 &&
                visiblePrint.okrReportData.map((item: any, index: number) => (
                  <Report
                    key={index}
                    objItem={item}
                    objItemIndex={index}
                    totalElements={{
                      total: visiblePrint.okrMainData.dynamics.totalElements,
                      type: params.param.type,
                    }}
                    viewAction={(data: any) => {
                      if (data) {
                        item = data
                        setVisiblePrint({ ...visiblePrint })
                      }
                    }}
                  />
                ))}
            </div>
            {visiblePrint && visiblePrint.visible && (
              <PrintModal onClose={cloasePrintModal}>
                <div className="okr-modal-cont" style={{ padding: '14px 12px 10px 16px' }}>
                  {visiblePrint.okrReportData.map((item: any, index: number) => (
                    <Report
                      key={index}
                      objItem={item}
                      totalElements={{
                        total: visiblePrint.okrMainData.dynamics.totalElements,
                        type: params.param.type,
                      }}
                      objItemIndex={index}
                      cssStyle={{ pointerEvents: 'none' }}
                    />
                  ))}
                </div>
              </PrintModal>
            )}
          </div>
        </div>
      </Modal>
      {visiblePrint.visibleSharePop && ( //分享的群聊窗口
        <ChatForwardModal
          visible={visiblePrint.visibleSharePop}
          chatMsg={JSON.stringify(chatMsg)}
          teamId={visiblePrint.okrMainData.ascriptionId}
          onSelected={() => {
            visiblePrint.visibleSharePop = false
            setVisiblePrint({ ...visiblePrint })
          }}
          onCancelModal={() => {
            visiblePrint.visibleSharePop = false
            setVisiblePrint({ ...visiblePrint })
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
    </div>
  )
}
export const Report = ({ objItem, objItemIndex, cssStyle, viewAction, totalElements }: any) => {
  // 图片预览框组件
  const photosRef: any = useRef(null)

  const [showEditor, setShowEditor] = useState({
    visible: false,
    param: { id: '', rootId: null, username: '' },
  }) //显示富文本编辑器

  const headerItem = {
    username: objItem.username,
    userProfile: objItem.userProfile,
    createTime: objItem.createTime,
    content: objItem.description.split('：')[1],
  }
  const taskInfo = {
    taskName: objItem.content.taskName,
    progress: objItem.content.processes,
    workPlanType: objItem.workPlanType,
    color: 1,
    cycleNum: objItem.content.cycleNum,
  }
  const readerContent = {
    noReadUser: objItem.content.noReadUser || [],
    isReadUser: objItem.content.isReadUser || [],
  }

  // 获取当前评论信息  并打开评论副本编辑器
  const getCommentItem = (commenItem: any) => {
    setShowEditor({
      visible: true,
      param: commenItem,
    })
  }

  // 编辑评论 富文本组件
  const EditorItem = ({ commenObj, commentMsg, commentType, nextPlanModelIndex, closeEditor }: any) => {
    const [commentMessage, setCommentMessage] = useState(commentMsg) //@ 回复 存储评论父数据

    //复盘富文本信息
    const [editorText, setEditorText] = useState<any>()

    //编辑评论内容
    const editorChange = (html: any) => {
      setEditorText(html)
    }
    // 发送评论
    const submitComment = () => {
      const typeId = commenObj.id //commentType 1:汇报  2:计划
      const type = commentType === 1 ? 0 : commentType === 2 ? 10 : '' //commentType 1:汇报  2:计划
      const parentId = commentMessage.id ? commentMessage.id : ''

      const rootId = commentMessage.rootId
        ? commentMessage.rootId
        : commentMessage.id
        ? commentMessage.id
        : null
      const userIds = commentMessage?.userId ? [commentMessage?.userId] : []
      const param = {
        userId: $store.getState().nowUserId, //评论人id
        userName: $store.getState().nowUser, //评论人姓名
        content: editorText, //评论内容
        userAccount: $store.getState().nowAccount, //评论人账号
        typeId, //评论主题id
        type, //报告类型 0任务汇报 10下一步计划  1工作报告 2制度 4公告
        parentId, //评论父id
        rootId, //根评论id
        // userIds: reportUserIds, //需要发通知的用户id集合
        // userNames: reportUserNames, //需要发通知的账号集合
        belongId: objItem ? objItem.ascriptionId : '', //归属id  ascriptionId: 730 ascriptionName: "测试哈哈哈哈"
        belongName: objItem ? objItem.ascriptionName : '', //归属名称
        belongType: 2, //归属类型
        // pushContent: pushContent, //推送内容
        userIds, //父级id合集
      }

      addCommentMessage(param)
    }
    // 发送 评论
    const addCommentMessage = (param: any) => {
      requestApi({
        url: '/public/comment/addCommentMessage',
        param: param,
        json: true,
      })
        .then((res: any) => {
          if (res.success) {
            getCommentMessage(param.typeId, param.type)
            message.success('评论成功')
            closeEditor()
            setEditorText('')
          }
        })
        .catch(err => console.log(err))
    }

    // 获取评论数据
    const getCommentMessage = (id: number, type: number) => {
      const param = {
        typeId: id,
        type: type,
        pageSize: 30,
        pageNo: 0,
      }

      requestApi({
        url: '/public/comment/commentMessagePage',
        param: param,
        json: false,
      }).then((res: any) => {
        if (res.success) {
          const data = res.data.data.content
          if (commentType == 1) {
            objItem.content.commentMessages = data
          }
          if (commentType == 2) {
            objItem.content.nextPlanModel[nextPlanModelIndex].commentMessages = data
          }
          viewAction && viewAction(objItem)
        }
      })
    }

    return (
      <div className="comment_box_wrap">
        <Editor
          editorContent={editorText}
          placeholder={commentMessage.username ? '@' + commentMessage.username : ''}
          showText={true}
          editorChange={editorChange}
          height={100}
          className="taskDynamicEditor"
          previewArea=".taskDynamicEditor"
        />
        {/* )} */}
        <div className="commen_btn">
          <Button
            onClick={() => {
              setCommentMessage({ id: '', rootId: null, username: '' })
              setEditorText('')
              closeEditor()
            }}
          >
            取消
          </Button>
          <Button
            type="primary"
            onClick={() => {
              submitComment()
            }}
          >
            发送
          </Button>
        </div>
      </div>
    )
  }

  // 评论内容
  const CommentCom = ({ comments, index, srcollToIpt }: any) => {
    return (
      <div className="commentMessage_box">
        {comments.map((item: any, seIndex: number) => (
          <div
            className="view_comment_item parent-conment"
            key={seIndex}
            onClick={() => {
              getCommentItem(item)
              scrollToAnchor(srcollToIpt + index)
            }}
          >
            <div className="flex center-v between">
              <div className="show_user">
                <Avatar
                  size={24}
                  src={item.profile}
                  style={{ backgroundColor: '#4285f4', fontSize: 12, marginRight: 12 }}
                >
                  {item.username && item.username.substr(-2, 2)}
                </Avatar>
                <span className="user-name">{item.username}</span>
              </div>
              <span className="view_comment_date">{item.createTime}</span>
            </div>
            <div className="view_comment_info" contentEditable={false}>
              <RenderPreImgs
                content={`<pre class="user-cont">${item.content}</pre>`}
                photosRef={photosRef}
                parentNode={true}
              />
              <span
                className="replay-report parent-replay"
                onClick={(e: any) => {
                  e.stopPropagation()
                  getCommentItem(item)
                  scrollToAnchor(srcollToIpt + index)
                }}
              >
                <span className="btn-icon replay-report-icon"></span>回复
              </span>
              {item.childComments && item.childComments.length > 0 && <Divider />}
              {item.childComments &&
                RenderItem(item.childComments, item.username).map((sItem: any, tindex: number) => (
                  <div
                    className="view_comment_item child-conment"
                    key={tindex}
                    contentEditable={false}
                    onClick={e => {
                      e.stopPropagation()
                      getCommentItem(sItem)
                      scrollToAnchor(srcollToIpt + index)
                    }}
                  >
                    <div className="flex center-v between">
                      <div className="show_user">
                        <Avatar
                          size={24}
                          src={sItem.profile}
                          style={{ backgroundColor: '#4285f4', fontSize: 12, marginRight: 12 }}
                        >
                          {sItem.username && sItem.username.substr(-2, 2)}
                        </Avatar>
                        <span className="user-name">
                          <span className="user">{sItem.username}</span>
                          <span style={{ margin: '0px 4px', color: '#9A9AA2' }}>回复</span>
                          <span className="user">{sItem.parentName}</span>
                        </span>
                      </div>
                      <span className="view_comment_date">{sItem.createTime}</span>
                    </div>
                    <div className="view_comment_info" contentEditable={false}>
                      <RenderPreImgs
                        content={`<pre class="user-cont">${sItem.content}</pre>`}
                        photosRef={photosRef}
                        parentNode={true}
                      />
                    </div>
                    <span
                      className="replay-report"
                      onClick={(e: any) => {
                        e.stopPropagation()
                        getCommentItem(sItem)
                        scrollToAnchor(srcollToIpt + index)
                      }}
                    >
                      <span className="btn-icon replay-report-icon"></span>回复
                    </span>
                    {tindex == item.childComments.length - 1 ? '' : <Divider />}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div
      className="process_normal_content dynamics_content_item report_content"
      style={cssStyle ? cssStyle : {}}
    >
      {objItemIndex == 0 && <div className="get_onelevel_total">{totalElements.total}篇进展</div>}
      <div className="get_onelevel_content">
        {/* 头部信息 */}
        <div className="flex between">
          <HeaderComponet objItem={headerItem} />
          {objItem.userId === $store.getState().nowUserId && objItem.flag !== 3 && !totalElements.type && (
            <Tooltip title="修改进展">
              <span
                className="edit_btn_box"
                onClick={(e: any) => {
                  e.stopPropagation()
                  $store.dispatch({
                    type: 'TASK_LIST_ROW',
                    data: {
                      handleBtn: {
                        id: objItem.taskId,
                        status: objItem.content.processes.newProcess == 100 ? 2 : 0,
                        executorUsername: objItem.username,
                        reportId: objItem.typeId,
                        type: 0,
                        time: Math.floor(Math.random() * Math.floor(1000)),
                        types: objItem.workPlanType == 2 || objItem.workPlanType == 3 ? 'okr' : '',
                        source: objItem.workPlanType == 2 || objItem.workPlanType == 3 ? 'okr_list' : '',
                        ascriptionId: getTaskTeamId(objItem),
                      },
                      type: 1,
                      sourceType: 'okr_progress',
                    },
                  })
                  $tools.createWindow('DailySummary')
                }}
              >
                <span className="edit_report_btn"></span>
                修改
              </span>
            </Tooltip>
          )}
        </div>
        {/* 任务详情 */}
        <TaskInfoComponet objItem={taskInfo} />
        <div className="onelevel_item_main">
          {/* 循环 content.models */}
          {objItem.content &&
            objItem.content.models &&
            objItem.content.models.map((item: any, index: number) => (
              <div className="problem_box" key={index}>
                <p className="problem_title">[{item.name}]</p>
                {/* 富文本内容 */}
                <div className="problem_cont" contentEditable={false}>
                  <RenderPreImgs
                    content={item.content ? item.content.split(':::').join('') : ''}
                    photosRef={photosRef}
                  />
                </div>
              </div>
            ))}
          {/* 下一步计划 循环 */}

          {objItem.content &&
            objItem.content.nextPlanModel &&
            objItem.content.nextPlanModel.map((item: any, index: number) => (
              <div className="problem_box" key={index}>
                <div className="problem_title">下一步计划</div>
                <div className="problem_cont" contentEditable={false}>
                  <RenderPreImgs
                    content={item.content ? item.content.split(':::').join('') : ''}
                    photosRef={photosRef}
                  />
                </div>
              </div>
            ))}

          {/* 文件列表 */}
          {objItem.content && objItem.content.fileReturnModels && (
            <div className="taskFilesList overflow_hidden">
              <div className="file-header">附件：</div>
              <RenderFileList
                list={objItem.content.fileReturnModels || []}
                large={true}
                teamId={objItem.ascriptionId}
              />
            </div>
          )}
          <div className="flex between" style={{ marginTop: 12, marginRight: 12 }}>
            <div>
              <span
                className="replay-report"
                onClick={() => {
                  setShowEditor({ ...showEditor, visible: true })
                  scrollToAnchor('comment_box_wrap_report_' + objItemIndex)
                }}
              >
                <span className="btn-icon replay-report-icon"></span>
                回复
              </span>
            </div>
            {/* 已读未读 */}
            <RederUsersCom objItem={readerContent} />
          </div>
          <div
            className={`comment_text_input ${
              objItem.content && objItem.content.commentMessages ? 'cont-data' : ''
            }`}
          >
            {/* 评论内容 */}
            {objItem.content && objItem.content.commentMessages && (
              <CommentCom
                comments={objItem.content.commentMessages}
                index={objItemIndex}
                srcollToIpt={'comment_box_wrap_report_'}
                commentType={'reportRef'}
                ascriptionId={objItem.ascriptionId}
              />
            )}
            {/* 评论引导框 */}
            {!showEditor.visible && (
              <Input
                type="text"
                placeholder="写下你的评论..."
                readOnly={true}
                onClick={() => {
                  setShowEditor({ ...showEditor, visible: true, param: objItem })
                  scrollToAnchor('comment_box_wrap_report_' + objItemIndex)
                }}
                style={{ margin: '12px 0' }}
              />
            )}

            {/* 汇报 评论框 */}
            <div id={'comment_box_wrap_report_' + objItemIndex} className="comment_box_wrap">
              {showEditor.visible && (
                <EditorItem
                  commenObj={objItem.content}
                  commentMsg={showEditor.param}
                  commentType={1}
                  closeEditor={() => {
                    setShowEditor({ visible: false, param: { id: '', rootId: null, username: '' } })
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
// 点击评论 页面滚动至元素可视
export const scrollToAnchor = (anchorName: any) => {
  if (anchorName) {
    const anchorElement = document.getElementById(anchorName)
    if (anchorElement) {
      anchorElement.scrollIntoView({
        behavior: 'smooth', // 默认 auto
        block: 'center', // 默认 center
        inline: 'center', // 默认 nearest
      })
    }
  }
}

export default OkrReportDetails
