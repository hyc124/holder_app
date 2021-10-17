import React, { Fragment, useState, useEffect, useReducer, useRef } from 'react'
import { Modal, Button, Row, Col, Avatar, Popover, Spin, Tabs, Input, message, Tooltip } from 'antd'
import { useSelector } from 'react-redux'
import { ipcRenderer } from 'electron'
import { ClearOutlined, ExclamationCircleOutlined, LoadingOutlined } from '@ant-design/icons'
import ExportPdf from '@/src/components/export-pdf/index'
import $c from 'classnames'
import WaterMark from '@/src/components/water-mask/water-mask'
import { RenderPreImgs, PhotosPreview } from '@/src/components/normal-preview/normalPreview'
import {
  getUnreadUser,
  addCommentMsg,
  clearAllComment,
  removeComment,
  getCommentmessage,
  getNoticeById,
  getNoticeList,
} from './actions'
import './index.less'
import { RenderFileList } from '@/src/views/mettingManage/component/RenderUplodFile'
import { PreViewOffice } from '@/src/views/addModalWin/officeWrap'
import { noticeHandel } from '@/src/views/announce/actions'
const { TextArea } = Input
export const publishTypeText = {
  '0': '草稿',
  '1': '意见征集',
  '2': '审批中',
  '3': '已发布',
}

export const publishTypeColor = {
  '0': '#999999',
  '1': '#30A7CE',
  '2': '#FF9A09',
  '3': '#4FAD61',
}

interface CommentItemProps {
  id: number
  userId: number
  username: string
  userAccount: string
  profile?: string
  content: string
  createTime: string
  parentId: null
  rootId: null
  type?: 4
  childComments: []
  files?: null
  updateState?: 0
}

interface DetailsProps {
  showModal?: (isvisible: boolean) => void
  editNotice?: (id: number) => void
  refreshCallback?: (noticeId: number) => void //系统通知需要的回调
}

const initStates = {
  noticeDetails: {},
  commentData: {
    totalPages: 0,
    content: [],
  },
}

const reducer = (state = initStates, action: { type: any; data: any }) => {
  switch (action.type) {
    // 公告详情数据
    case 'NOTICE_DETAILS':
      return { ...state, noticeDetails: action.data }
    // 评论列表数据
    case 'COMMENT_DATA':
      return { ...state, commentData: action.data }
    default:
      return state
  }
}
export const noticeName = (str: any) => {
  const _str = str || ''
  const newName = _str.replace(/\s*/g, '')
  if (newName.length > 33) {
    return {
      name: newName.substring(0, 33) + '...',
      state: true,
    }
  }
  return {
    name: newName,
    state: false,
  }
}
const NoticeDetail = ({ showModal, editNotice, refreshCallback }: DetailsProps) => {
  const [state, dispatch] = useReducer(reducer, initStates)
  const { noticeDetails } = state
  // 详情数据
  const {
    id,
    name,
    userProfile,
    username,
    time,
    groupName,
    content,
    apply,
    // fileModels,
    relationModels,
    fileReturnModels,
    template,
    unread,
    read,
    type,
    isDownload,
    isDiscuss,
    belongId,
  } = noticeDetails
  // 图片预览框组件
  const photosRef = useRef<any>(null)
  // 已读未读的用户列表数据
  const [unreadList, setUnreadList] = useState([])
  // 已读未读数据loading状态
  const [readLoading, setReadLoading] = useState(false)
  // 评论回复的父级的数据
  const init = { id: null, userId: null, userAccount: null, rootId: null, username: null }
  const [commentParentInfo, setCommentParentInfo] = useState<any>(init)
  // 评论内容改变的数据
  const [inputValue, setInputValue] = useState('')
  const [showTextArea, setShowTextArea] = useState(false)
  // 详情评论的分页数据
  const [commentPageNo, setCommentPageNo] = useState(0)
  // 签收提示框
  const [tipsModalVisible, setTipsModalVisible] = useState(false)
  //详情loading状态
  const [detailLoading, setDetailLoading] = useState(false)
  //公告在线编辑路径
  const [noticeUrl, setNoticeUrl] = useState<any>('')
  //公告在线编辑状态模态框状态
  const [noticeVsible, setNoticeVsible] = useState(false)
  // 查询详情所需参数
  const { nowUserId, nowUser, nowAccount } = $store.getState()
  const noticeDetailProps = useSelector((state: any) => state.noticeDetailProps)
  // 查看或签收后更新列表状态所需参数
  const queryParams = useSelector((state: any) => state.queryParams)
  // 代办通知消息的所有数据
  const systemMsgs = useSelector((state: StoreStates) => state.systemMsgs)
  //已读未读切换默认选中
  const [activeKeys, setActiveKeys] = useState<string>('unread')
  //撤回删除loading
  const [btnLoadin, setBtnloading] = useState(false)
  function getUsers(isRead: number) {
    setReadLoading(true)
    getUnreadUser({ id, isRead }).then((res: any) => {
      if (res.returnCode === 0) {
        setUnreadList(res.dataList)
      }
      setReadLoading(false)
    })
  }

  // 已读未读popover显示时查询数据
  function onVisibleChange(visible: boolean) {
    setActiveKeys('unread')
    if (visible) {
      getUsers(0)
    }
  }

  // 发布范围-已读未读popover-tab切换
  function tabChange(key: string) {
    setActiveKeys(key)
    if (key === 'unread') {
      getUsers(0)
    } else {
      getUsers(1)
    }
  }

  //渲染评论子节点
  function renderComment(parentItem: CommentItemProps, data: CommentItemProps[]) {
    return data.map((item: CommentItemProps) => {
      return (
        <Fragment key={item.id}>
          <div className="chlidItem">
            <div>
              <span className="username">{item.username}</span> 回复
              <span className="username">{parentItem.id === item.parentId && parentItem.username}</span>：
              <span className="content" onClick={() => setCommentParentInfo(item)}>
                {item.content}
              </span>
            </div>
            <div className="time">{item.createTime}</div>
          </div>
          {item.childComments.length > 0 && renderComment(item, item.childComments)}
        </Fragment>
      )
    })
  }

  // 清空评论
  function delAllComment() {
    Modal.confirm({
      className: 'notice_modal_confirm',
      title: '操作提示!',
      content: '清空后不可恢复，确定要清空评论吗？',
      onOk() {
        clearAllComment({ type: 4, typeId: id }).then((res: any) => {
          if (res.returnCode === 0) {
            message.success('删除成功')
            getCommentList(id)
          }
        })
      },
    })
  }

  // 删除单条评论
  const delSingComment = (commentId: number) => {
    removeComment({ id: commentId }).then((res: any) => {
      if (res.returnCode === 0) {
        message.success('删除成功')
        getCommentList(id)
      }
    })
  }

  // 发布评论
  function sendComment() {
    setShowTextArea(false)
    if (inputValue == '') {
      return message.error('请输入评论内容')
    }
    const { belongId, belongName } = noticeDetails
    const { id: parentId, userId, userAccount, rootId } = commentParentInfo
    const pushContent =
      !rootId || !parentId
        ? `${nowUser} + '评论了你的公告【' + ${name} + '】：' + ${content}`
        : `${nowUser} + '在公告【' + ${name} + '】中回复了你:' + ${content}`
    const value = {
      userId: nowUserId, //评论人id
      userName: nowUser, //评论人姓名
      userAccount: nowAccount, //评论人账号
      content: inputValue, //TODO: 评论内容
      typeId: id, //评论主题id
      type: 4, //报告类型 0任务汇报 1工作报告 2制度 4公告
      parentId: parentId, //TODO: 评论父id
      rootId: rootId ? rootId : parentId ? parentId : undefined, //TODO: 根评论id
      userIds: userId ? [userId] : [], //需要发通知的用户id集合
      userNames: userAccount ? [userAccount] : [], //需要发通知的账号集合
      belongId, //归属id
      belongName, //归属名称
      belongType: 2, //归属类型企业类型2 工作组类型4 部门3
      pushContent, //推送内容
    }
    addCommentMsg(value).then((res: any) => {
      if (res.returnCode === 0) {
        message.success('发送评论成功')
        $('.r_wrap_cont').scrollTop(1600)
        setInputValue('')
        setCommentParentInfo(init)
        getCommentList(id)
      } else {
        message.error(res.returnMessage)
      }
    })
  }

  // 查询评论列表
  const getCommentList = (typeId: number, isMore?: boolean) => {
    let pageNo = commentPageNo
    if (isMore) {
      pageNo = commentPageNo + 1
    } else {
      pageNo = 0
    }
    setCommentPageNo(pageNo)
    // 查询评论列表数据
    getCommentmessage({
      typeId,
      type: 4, //报告类型 0任务汇报 1工作报告 2制度 4公告
      pageSize: 10,
      pageNo,
    }).then((res: any) => {
      if (!res.reurnCode) {
        const data = res.data
        if (isMore) {
          dispatch({
            type: 'COMMENT_DATA',
            data: {
              ...data,
              content: [...state.commentData.content, ...data.content],
            },
          })
        } else {
          dispatch({ type: 'COMMENT_DATA', data })
        }
      }
    })
  }

  // 查询公告列表
  function getNotice() {
    const value = {
      ...queryParams,
      type: -1,
      userId: nowUserId,
      account: nowAccount,
    }
    getNoticeList(value).then((res: any) => {
      if (!res.returnCode) {
        $store.dispatch({ type: 'NOTICE_LIST', data: res.data })
      }
    })
    //系统设置更新列表红点状态
    if (refreshCallback) {
      refreshCallback(noticeDetailProps.noticeId)
    }
  }

  /**
   * 公告详情撤回,删除
   * @param id 公告ID
   * @param optType 0撤回 1删除
   */
  const handelTool = (id: number, type: number) => {
    Modal.confirm({
      className: 'notice_modal_confirm',
      title: '操作提示',
      icon: <ExclamationCircleOutlined />,
      content: type === 0 ? '确定撤回该公告？' : '删除后不可恢复，确定要删除该公告吗？',
      onOk() {
        setBtnloading(true)
        const requestUrl = type === 0 ? '/team/notice/recallById' : '/team/notice/removeById'
        noticeHandel(id, requestUrl)
          .then(() => {
            setBtnloading(false)
            closeDetailModal()
            getNotice()
          })
          .catch(() => {
            setBtnloading(false)
          })
      },
    })
  }
  // 公告签收
  const handleReceipt = () => {
    $mainApi
      .request(
        'team/notice/setReadByUserId',
        { id: noticeDetailProps.noticeId, userId: nowUserId },
        {
          headers: {
            loginToken: $store.getState().loginToken,
          },
          formData: true,
        }
      )
      .then(() => {
        // 隐藏签收提示框
        setTipsModalVisible(false)
        // 显示详情
        showModal && showModal(true)
        // 成功关闭右小角弹窗
        ipcRenderer.send('handle_messages_option', [
          'rule',
          noticeDetailProps.noticeId,
          noticeDetailProps.noticeType,
        ])
        //刷新侧边栏+代办列表+数字统计
        ipcRenderer.send('update_unread_num', [noticeDetailProps.noticeId])
        // 更新列表阅读状态
        getNotice()
        // 关闭当前公告的推送
        const result = systemMsgs.filter(item => {
          return item.noticeType !== 'rule' && item.noticeTypeId !== noticeDetailProps.noticeId
        })
        $store.dispatch({ type: 'SET_SYSTEM_MSG', data: { systemMsgs: result } })
      })
  }

  // 关闭公告详情窗口
  const closeDetailModal = () => {
    if (noticeDetailProps.source !== 'noticeList') {
      ipcRenderer.send('close_notice_details_win')
    } else {
      showModal && showModal(false)
    }
  }

  useEffect(() => {
    setDetailLoading(true)
    getNoticeById({ id: noticeDetailProps.noticeId, userId: nowUserId }).then((res: any) => {
      // type 0 草稿 1 意见征集中 2 审批中 3 已发布   isReceipt 0 不需要回执 1 需要回执
      setNoticeUrl(res.noticeUrl)
      if (!res.isRead && res.isReceipt && (res.type === 3 || res.type === 1)) {
        setTipsModalVisible(true)
      } else {
        setTipsModalVisible(false)
      }
      // 不需要签收的公告且未读的更新列表状态：取消红点展示
      if (!res.isReceipt && res.isRead === 0 && (res.type === 3 || res.type === 1)) {
        getNotice()
      }
      dispatch({
        type: 'NOTICE_DETAILS',
        data: {
          ...res,
        },
      })
      setDetailLoading(false)
      getCommentList(noticeDetailProps.noticeId)
    })
  }, [noticeDetailProps])

  const editNoticeHandel = () => {
    // 关闭详情模态框

    const queryParams = {
      id: noticeDetailProps.noticeId,
      userId: nowUserId,
      edit: 1,
    }
    getNoticeById(queryParams).then((res: any) => {
      closeDetailModal()
      editNotice && editNotice(res) //查询
    })
  }

  const title = (
    <Tabs activeKey={activeKeys} onChange={tabChange}>
      <Tabs.TabPane tab={`未读${unread}`} key="unread"></Tabs.TabPane>
      <Tabs.TabPane tab={`已读${read}`} key="read"></Tabs.TabPane>
    </Tabs>
  )

  //已读未读内容
  const memberContent = (
    <Spin spinning={readLoading}>
      <div className="readMembers">
        {unreadList.map((item: any) => {
          const users = item.usernames || []
          return (
            <div key={item.initial}>
              <p>{item.initial}</p>
              <p>
                {users.map((item: string, index: number) => {
                  return <span key={index}>{item}</span>
                })}
              </p>
            </div>
          )
        })}
      </div>
    </Spin>
  )

  const $isDownload = isDownload !== 0 && type !== 0 && type !== 2
  const antIcon = <LoadingOutlined style={{ fontSize: 16 }} spin />
  return (
    <Fragment>
      {noticeDetailProps.source === 'noticeList' && (
        <Modal
          className="receiptModal"
          title={
            <div className="customTitle">
              <ExclamationCircleOutlined />
              操作提示
            </div>
          }
          closable={false}
          width={416}
          bodyStyle={{ height: 56 }}
          visible={tipsModalVisible}
          footer={
            <div className="addModalFooter">
              <Button
                type="ghost"
                onClick={() => {
                  setTipsModalVisible(false)
                  closeDetailModal()
                }}
              >
                稍后处理
              </Button>
              <Button type="primary" onClick={handleReceipt}>
                确认签收
              </Button>
            </div>
          }
        >
          <div>确认收到公告,确认签收后查看详情？</div>
        </Modal>
      )}
      <Modal
        className={`modalNoticeDetails ${tipsModalVisible && noticeDetailProps.source ? 'isModalFilter' : ''}`}
        width={window.innerWidth - 40}
        style={{ top: 20 }} //56
        bodyStyle={{
          height: isDiscuss === 1 && type !== 0 ? window.innerHeight - 149 : window.innerHeight - 93,
          overflowY: 'hidden',
        }}
        visible={true}
        maskClosable={false}
        title={
          <Row justify="space-between">
            <div>公告详情</div>
            <Spin size="small" indicator={antIcon} spinning={btnLoadin}>
              <div className="operateIcon">
                {$isDownload ? (
                  <ExportPdf
                    name={name}
                    eleId="noticeDetailsContent"
                    beglongId={`${belongId}`}
                    fileGuid={noticeUrl ? noticeDetails.fileGuid : ''}
                    isDiscuss={isDiscuss}
                    type={type}
                  />
                ) : (
                  ''
                )}
                {noticeDetails.userId == nowUserId && (
                  <Fragment>
                    {type != 0 ? (
                      ''
                    ) : (
                      <span className="btnSpan" onClick={editNoticeHandel}>
                        <span className="icon edit"></span>
                        编辑
                      </span>
                    )}
                    {type == 0 ? (
                      ''
                    ) : (
                      // <Spin spinning={true} tip="请稍后...">
                      <span className="btnSpan" onClick={() => handelTool(id, 0)}>
                        <span className="icon recall"></span>
                        撤回
                      </span>
                      // </Spin>
                    )}
                    <span className="btnSpan" onClick={() => handelTool(id, 1)}>
                      <span className="icon remove"></span>
                      删除
                    </span>
                  </Fragment>
                )}
              </div>
            </Spin>
          </Row>
        }
        onOk={closeDetailModal}
        onCancel={closeDetailModal}
        footer={null}
      >
        <Spin spinning={detailLoading}>
          <WaterMark
            text={`${nowUser && nowUser.length > 5 ? nowUser.substring(0, 5) : nowUser}_${
              nowAccount && nowAccount.length > 4 ? nowAccount.substr(-4, 4) : nowAccount
            }`}
            option={{ width: '100%', height: '100%' }}
          >
            <div id="noticeDetailsContent">
              <div className="notice_detaile_l">
                <div className={$c('notice_office', { oldnotice: !noticeUrl })}>
                  {!noticeUrl && (
                    <RenderPreImgs
                      content={`<div className="detailsContent" >${content}</div>`}
                      photosRef={photosRef}
                      parentNode={true}
                    />
                  )}
                  {noticeUrl && (
                    <PreViewOffice
                      visible={noticeVsible}
                      dataurl={noticeUrl}
                      setVisible={(flag: boolean) => {
                        setNoticeVsible(flag)
                      }}
                    />
                  )}
                </div>
              </div>
              <div className="notice_detaile_r">
                <div className="notice_detaile_r_top">
                  <div className="r_header" style={{ height: template === 1 ? 141 : 90 }}>
                    {template === 1 ? (
                      <div className="headerFormal">
                        <Tooltip title={name.length > 10 ? name : ''}>
                          <header>{name}</header>
                        </Tooltip>
                        <table>
                          <tbody>
                            <tr>
                              <td>发布人</td>
                              <td>分类</td>
                              <td>发布时间</td>
                              <td>状态</td>
                            </tr>
                            <tr>
                              <Tooltip title={username}>
                                <td>
                                  <div className="tdStyle">{username}</div>
                                </td>
                              </Tooltip>
                              <Tooltip title={groupName}>
                                <td>
                                  <div className="tdStyle">{groupName}</div>
                                </td>
                              </Tooltip>
                              <Tooltip title={time}>
                                <td>
                                  <div className="tdStyle">{time}</div>
                                </td>
                              </Tooltip>
                              <td>
                                <Tooltip title={publishTypeText[type]}>
                                  <div className="tdStyle">
                                    <span style={{ color: publishTypeColor[type] }}>
                                      {publishTypeText[type]}
                                    </span>
                                  </div>
                                </Tooltip>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="headerStandard">
                        {/* 标准版 */}
                        <Tooltip title={noticeName(name).state ? name : ''}>
                          <header>
                            {noticeName(name).name}
                            <span
                              style={{
                                color: publishTypeColor[type],
                                border: `1px solid ${publishTypeColor[type]}`,
                              }}
                            >
                              {publishTypeText[type]}
                            </span>
                          </header>
                        </Tooltip>

                        <div className="noticeInfo">
                          <Avatar
                            style={{ minWidth: 'inherit' }}
                            className="oa-avatar"
                            src={userProfile}
                            size={24}
                          >
                            {username && username.substr(-2, 2)}
                          </Avatar>
                          <Tooltip title={`${username}-${time}|${groupName}`}>
                            <span className="info">
                              <span>{username}</span>
                              <span>{time}</span> | <span>{groupName}</span>
                            </span>
                          </Tooltip>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="r_wrap_cont">
                    <Row justify="start" className="fileListBox">
                      <div className="label_title">附件</div>
                      <ul>
                        <RenderFileList
                          list={fileReturnModels || []}
                          large={true}
                          hideDown={$isDownload ? false : true}
                          teamId={belongId}
                        />
                      </ul>
                    </Row>

                    <Row justify="space-between" className="applyContent">
                      <Col className="label_title">发布范围</Col>
                      <Col>
                        <Popover
                          placement="left"
                          trigger="click"
                          title={title}
                          content={memberContent}
                          onVisibleChange={onVisibleChange}
                        >
                          <span className="unreadNumber">{unread}人未读</span>
                        </Popover>
                      </Col>
                    </Row>
                    <Row>
                      <Col>
                        <span className="title" style={{ color: '#70707A' }}>
                          {apply === 0
                            ? '适用部门发布时所包含的成员可查看'
                            : '新加入适用部门、岗位、角色的成员可查看，退出适用部门、岗位、角色不可查看'}
                        </span>
                      </Col>
                    </Row>
                    <Row className="membersList">
                      {relationModels &&
                        relationModels.map((item: any) => {
                          return <span key={item.typeId}>{item.typeName}</span>
                        })}
                    </Row>
                    <div className="commentBox">
                      {state.commentData.content.length > 0 && noticeDetails.userId == nowUserId ? (
                        <div className="clearComment" onClick={delAllComment}>
                          <ClearOutlined />
                          清空评论
                        </div>
                      ) : (
                        ''
                      )}
                      {state.commentData.content.map((parentItem: CommentItemProps) => {
                        const { id, username, userId, profile, createTime, content, childComments } = parentItem
                        return (
                          <div key={id}>
                            <div className="listBox">
                              <Avatar className="oa-avatar" src={profile} size={34}>
                                {username && username.substr(-2, 2)}
                              </Avatar>
                              <div style={{ flex: '1' }}>
                                <div>
                                  <span className="username">{username}</span>：
                                  <span className="content" onClick={() => setCommentParentInfo(parentItem)}>
                                    {content}
                                  </span>
                                </div>
                                <div
                                  className="time"
                                  style={{ display: 'flex', justifyContent: 'space-between' }}
                                >
                                  <span>{createTime}</span>
                                  {userId == nowUserId || noticeDetails.userId == nowUserId ? (
                                    <span onClick={() => delSingComment(id)} style={{ cursor: 'pointer' }}>
                                      删除
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                            {childComments.length > 0 && (
                              <div className="replyContent">{renderComment(parentItem, childComments)}</div>
                            )}
                          </div>
                        )
                      })}
                      {state.commentData.totalPages > 1 && commentPageNo < state.commentData.totalPages - 1 && (
                        <div onClick={() => getCommentList(id, true)} className="loadMore">
                          加载更多评论
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="notice_detaile_r_buttom" style={{ height: showTextArea ? 198 : 68 }}>
                  {isDiscuss === 1 && type !== 0 && (
                    <div className="tool">
                      {!showTextArea && (
                        <Input
                          placeholder={
                            commentParentInfo.username ? `@${commentParentInfo.username}` : '发表一下你的意见~'
                          }
                          value={''}
                          onClick={() => {
                            setShowTextArea(true)
                            $('.r_wrap_cont').scrollTop(1600)
                          }}
                        />
                      )}
                      {showTextArea && (
                        <div className="tool_textArea_wrap">
                          <TextArea
                            autoFocus
                            className="tool_textArea"
                            placeholder={
                              commentParentInfo.username
                                ? `@${commentParentInfo.username}`
                                : '发表一下你的意见~'
                            }
                            value={inputValue}
                            rows={4}
                            onChange={event => setInputValue(event.target.value)}
                          />
                          <div className="tool_submit_btn">
                            <Button onClick={() => setShowTextArea(false)}>取消</Button>
                            <Button type="primary" onClick={sendComment}>
                              发送
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </WaterMark>
        </Spin>
      </Modal>
      {/* 预览图片 */}
      <PhotosPreview ref={photosRef} />
    </Fragment>
  )
}

export default NoticeDetail
