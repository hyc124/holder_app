import { useEffect, useState } from 'react'
import React from 'react'
import { Modal, Tooltip, message, Spin } from 'antd'
import SendComment from './sendComment'
import ChatForwardModal from '@/src/components/chat-forward-modal'
import { PdfDownload } from '../../../common/js/PdfDownload'
import PrintModal from '@/src/components/print-modal/PrintModal'
import ReportDetailsPrint from './ReportDetailsPrint'
import { editReport } from '../getData'
import { useMergeState } from '../../chat-history/chat-history'
import $c from 'classnames'
const ReportDetails = (params: any) => {
  // 已读未读弹窗
  const { nowUser, nowAccount, nowUserId, userInfo, loginToken, selectTeamId } = $store.getState()
  const [reportDetailsData, setReportDetailsData] = useState<any>([])
  const [visibleSharePop, setVisibleSharePop] = useState(false)
  const [reportDetailsCommData, setReportDetailsCommData] = useState<any>([])
  const [thumbsUpUserModelList, setThumbsUpUserModelList] = useState<any>([])
  // 编辑工作报告权限（仅可编辑自己发起的工作报告）
  const [isEditReport, setIsEditReport] = useState(true)
  // 分享发出的内容
  const [shareCon, setShareCon] = useState<any>('')
  const [commentShow, setCommentShow] = useState<any>('')
  //是否显示打印弹窗
  const [visiblePrint, setVisiblePrint] = useState(false)
  const [pagination, setPagination] = useState({
    pageNo: 0,
    pageSize: 10,
    total: 0,
  })
  //关闭打印modal
  const cloasePrintModal = () => {
    setVisiblePrint(false)
  }
  //   群聊推送
  const [quoteMsg, setQuoteMsg] = useState({
    id: '',
    name: '',
    type: '',
    title: '',
    val: '',
  })
  //汇报loading
  const [loading, setLoading] = useState(false)
  //多个汇报得时候 左右切换按钮 显示隐藏状态
  const [prevVsible, setPrevVsible] = useState(false)
  const [nextVsible, setNextVsible] = useState(false)
  //页码参数
  const [pageInfo, setPageInfo] = useMergeState({
    index: 0, //当前index值
    total: 0, //总页数
  })

  const sendCommentParam: any = {
    userId: nowUserId,
    userName: nowUser,
    userAccount: nowAccount,
    typeId: reportDetailsData.reportId,
    type: 1, //评论主题类型
    userIds: [], //需要发通知的用户id集合
    userNames: [], //需要发通知的账号集合
    belongId: reportDetailsData.belongId,
    belongName: reportDetailsData.belongName,
    belongType: 2,
    pushContent: '', //推送内容
    reportId: reportDetailsData.reportId,
    noticeType: params.param.noticeType,
  }

  useEffect(() => {
    if (params.param.isVisible) {
      const isTypeArr = Array.isArray(params.param.reportId)
      if (!isTypeArr) {
        reportDetails(params.param.reportId)
      } else {
        //多个汇报[XX,XX,XX]
        const $report = params.param.reportId
        setPageInfo({ total: $report.length })
        setPrevVsible(true)
        setNextVsible(true)
        reportDetails($report[pageInfo.index])
      }
      setReportDetailsCommData([])
      $store.dispatch({
        type: 'WORK_REPORT_LIST_COMMENT',
        data: { workRpoertListIsThum: false },
      })
    }
  }, [pageInfo.index])

  //按钮切换 type 0上一页 1下一页
  const switchEvent = (e: any, type: number) => {
    e.stopPropagation()
    const { index, total } = pageInfo
    if (type === 0) {
      if (index !== 0) {
        setPageInfo({ index: index - 1 })
      }
    } else {
      if (index !== total - 1) {
        setPageInfo({ index: index + 1 })
      }
    }
  }

  //查询详情
  const reportDetails = (reportId: any) => {
    const param = {
      reportId: reportId,
      userId: nowUserId,
      isMuc: params.param.isMuc ? params.param.isMuc : 0,
    }
    setLoading(true)
    editReport(param)
      .then((data: any) => {
        setLoading(false)
        setReportDetailsData(data.data)
        setThumbsUpUserModelList(data.data.thumbsUpUserModelList)
        setQuoteMsg({
          id: data.data.reportId,
          name: data.data.contentModels[0]
            ? data.data.contentModels[0].content
                .replace(/<!--[\w\W\r\n]*?-->/gim, '')
                .replace(/<\/?.+?\/?>/g, '')
            : '',
          type: 'workReport',
          title: `${data.data.userName}的${data.data.templateName}(${data.data.reportStartTime}-${data.data.reportEndTime})`,
          val: '',
        })
        if (data.data.userId !== nowUserId) {
          sendCommentParam.userIds.push(data.data.userId)
          sendCommentParam.userIds.push(data.data.userNames)
          setIsEditReport(false)
        }
        // 查询评论
        reportDetailsComm(data.data)
        $store.dispatch({
          type: 'WORK_REPORT_LIST_COMMENT',
          data: { workRpoertListIsThum: data.data.userIsThumbsUpState },
        })
        $('.set_comment_box .opinion-area').css('padding-bottom', '10px')
      })
      .catch(err => {
        params.setvisible(false)
        setLoading(false)
        message.error(err.returnMessage)
      })
  }

  const workShare = () => {
    $store.dispatch({
      type: 'WORKPLAN_MODAL',
      data: {
        quoteMsg: quoteMsg,
      },
    })
    const contentJson = { id: quoteMsg.id, content: quoteMsg.name, title: quoteMsg.title }
    const con = {
      type: 6,
      messageJson: {
        type: 1,
        contentJson: JSON.stringify(contentJson),
      },
    }
    setShareCon(JSON.stringify(con))
    setVisibleSharePop(true)
  }

  const reportEdit = async () => {
    await $store.dispatch({
      type: 'EDIT_WORK_REPORT_USER_ID',
      data: { editWorkReportUserId: reportDetailsData.userId },
    })
    await $store.dispatch({
      type: 'EDIT_WORK_REPORT_ID',
      data: { editWorkReportId: reportDetailsData.reportId },
    })
    await $store.dispatch({
      type: 'WORKREPORT_TYPE',
      data: { wortReportType: 'edit', wortReportTtime: Math.floor(Math.random() * Math.floor(1000)) },
    })
    params.setvisible(false)
    $tools.createWindow('WorkReport')
  }

  const workPrint = () => {
    setVisiblePrint(true)
  }

  // 发送评论
  const sendComments = (parm: any) => {
    if (parm.type === 'queryUser') {
      findThumbsUpUsersByTypeId(parm.typeId)
    } else {
      // 查询评论
      reportDetailsComm(parm.param)
    }
  }

  const findThumbsUpUsersByTypeId = (typeId: number) => {
    const param = {
      type: 'work_report',
      typeId: typeId,
      userId: nowUserId,
    }
    $api
      .request('/public/thumbsUp/findThumbsUpUsersByTypeId', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        // setThumbsUpUserModelList([...thumbsUpUserModelList, resData.dataList])
        setThumbsUpUserModelList([...resData.dataList])
      })
  }

  const reportDetailsComm = (parm: any, no?: any) => {
    const param = {
      typeId: parm.reportId,
      teamId: parm.belongId,
      userId: parm.userId,
      type: 1,
    }
    $api
      .request('/public/comment/getCommentMessage', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        setReportDetailsCommData({
          ...reportDetailsCommData,
          content: resData.dataList,
          pageNo: no ? no : pagination.pageNo,
          typeId: parm.bolongId,
          totalPages: resData.totalPages,
        })
        setPagination({
          pageNo: pagination.pageNo,
          pageSize: pagination.pageSize,
          total: resData.totalElements || 0,
        })
        // ipcRenderer.send('update_unread_num') //更新工作台数量
      })
  }

  const queryCommt = (no: any, parm: any) => {
    setPagination({ ...pagination, pageNo: no })
    reportDetailsComm(parm, no)
  }
  const setVisibleShow = (type: any, rootid: any, nowid: any) => {
    setCommentShow({ visible: type, rootid: rootid, nowid: nowid })
  }
  return (
    <>
      <Modal
        visible={params.param.isVisible}
        className="report-details-pop"
        maskClosable={false}
        centered
        width={850}
        keyboard={false}
        // title="详情"
        title={
          <div className="top_title_box" key={'reportdetails'}>
            <div className="titles">详情</div>
            <div className="btn_box">
              <Tooltip placement="bottomLeft" title="分享" arrowPointAtCenter>
                <span className="work-share" onClick={workShare}></span>
              </Tooltip>
              {isEditReport && (
                <Tooltip placement="bottomLeft" title="编辑" arrowPointAtCenter>
                  <span className="report_edit" onClick={reportEdit}></span>
                </Tooltip>
              )}
              <Tooltip placement="bottomLeft" title="打印" arrowPointAtCenter>
                <span className="work-print" onClick={workPrint}></span>
              </Tooltip>
              <Tooltip placement="bottomLeft" title="下载" arrowPointAtCenter>
                <span
                  className="work-derive"
                  onClick={() => {
                    PdfDownload({ eleId: 'printDataBox', fileName: '工作报告' })
                  }}
                ></span>
              </Tooltip>
            </div>
          </div>
        }
        footer={null}
        onCancel={() => {
          //   props.isVisible = false
          params.setvisible(false)
        }}
      >
        {reportDetailsData.length !== 0 && (
          <ReportDetailsPrint
            datas={{ cont: reportDetailsData, comm: reportDetailsCommData, thumList: thumbsUpUserModelList }}
            queryCommt={queryCommt}
            setVisibleShow={setVisibleShow}
            type={'style'}
          />
        )}
        {visiblePrint && reportDetailsData && (
          <PrintModal onClose={cloasePrintModal}>
            <ReportDetailsPrint
              datas={{ cont: reportDetailsData, comm: reportDetailsCommData }}
              queryCommt={queryCommt}
              setVisibleShow={setVisibleShow}
              type={'style'}
            />
          </PrintModal>
        )}
        <SendComment
          noticeType={params.param.noticeType}
          sendComments={sendComments}
          paramObj={sendCommentParam}
          commentShow={commentShow}
          setVisibleShow={setVisibleShow}
          thumParam={{
            content: reportDetailsData.templateName,
            typeTime: reportDetailsData.createTime,
            userId: reportDetailsData.userId,
            userName: reportDetailsData.userName,
            userIsThumbsUpState: reportDetailsData.userIsThumbsUpState,
            belongId: reportDetailsData.belongId,
          }}
          thumList={thumbsUpUserModelList}
        />

        {prevVsible && (
          <Tooltip title={pageInfo.index === 0 ? '已经是第一页了' : ''}>
            <div
              className={$c('handel_btn handel_prev', { handelDisable: pageInfo.index === 0 })}
              onClick={e => switchEvent(e, 0)}
            ></div>
          </Tooltip>
        )}
        {nextVsible && (
          <Tooltip title={pageInfo.index === pageInfo.total - 1 ? '已经是最后一页了' : ''}>
            <div
              className={$c('handel_btn handel_next', { handelDisable: pageInfo.index === pageInfo.total - 1 })}
              onClick={e => switchEvent(e, 1)}
            ></div>
          </Tooltip>
        )}

        {loading && (
          <div className="example" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Spin />
          </div>
        )}
      </Modal>
      {visibleSharePop && (
        <ChatForwardModal
          visible={visibleSharePop}
          chatMsg={shareCon}
          teamId={selectTeamId}
          onSelected={() => {
            setVisibleSharePop(false)
          }}
          onCancelModal={() => {
            setVisibleSharePop(false)
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
        // <ShareToRoomModal
        //   props={{
        //     param: {
        //       shareToRoomModalShow: visibleSharePop,
        //     },
        //     action: {
        //       setShareToRoomModalShow: setVisibleSharePop,
        //     },
        //   }}
        //   isclcallback={false}
        //   isclcallbackFn={() => { }}
        // />
      )}
    </>
  )
}
export default ReportDetails
