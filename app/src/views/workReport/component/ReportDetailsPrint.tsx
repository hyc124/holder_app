import { useState, useLayoutEffect, useRef } from 'react'
import React from 'react'
import { Avatar, Divider, message, Tabs } from 'antd'
import MeetDetails from '../../mettingManage/component/MeetDetails'
import DetailModal from '@/src/views/task/taskDetails/detailModal'
import { PhotosPreview, RenderPreImgs } from '@/src/components/normal-preview/normalPreview'
import { RenderFileList } from '../../mettingManage/component/RenderUplodFile'
import { getStatusOrTime } from '../../okr-four/work-okr-mind/okr-list-org'
import { RenderStatusTarget } from '../WorkReport'
import { detailParam } from '../../force-Report/create-force-Report'
const ReportDetailsPrint = ({
  datas,
  queryCommt,
  setVisibleShow,
  type,
}: {
  datas: any
  queryCommt?: (value: any, typeId: any) => void
  setVisibleShow?: (value: any, roodId: any, nowid: any) => void
  type?: string
}) => {
  const reportDetailsData = datas.cont
  //   评论
  const reportDetailsCommData = datas.comm
  // 点赞头像
  const thumbsUpUserModelList = datas.thumList
  const [visibleIsRead, setVisibleIsRead] = useState(false)
  const { loginToken, nowUserId } = $store.getState()
  // 任务、审批、会议详情
  const [detailsState, setDetailsState] = useState<any>({
    meetModalVisible: false, //会议详情
    taskModalVisible: false, //任务详情
    meetId: '',
    taskId: '',
    approvalId: '',
  })
  // 详情弹框组件
  const detailModalRef = useRef<any>({})
  // 图片预览框组件
  const photosRef = useRef<any>(null)

  const DetailsContent = (prop: any) => {
    const item = prop.item
    return (
      <div className="relation_list_box">
        {item?.map((data: any, i: number) => {
          const taskRelation = data.relationInfos.filter(
            (re: { relationType: number }) => re.relationType === 1
          )
          const okrRelation = data.relationInfos.filter((re: { relationType: number }) => re.relationType === 5)
          const approvalRelation = data.relationInfos.filter(
            (re: { relationType: number }) => re.relationType === 4
          )
          const meetRelation = data.relationInfos.filter(
            (re: { relationType: number }) => re.relationType === 2
          )
          return (
            <div className="relation_list_model" key={i}>
              <div className="workreport-detail-item" data-id={data.id}>
                <div className="workreport-title">{data.configTitle}</div>
                {/* <pre className="workreport-content" dangerouslySetInnerHTML={{ __html: data.content }}></pre> */}
                <RenderPreImgs
                  content={`<div className="flex-1 detail_notice" >${data.content}</div>`}
                  photosRef={photosRef}
                  parentNode={true}
                />
              </div>
              <div className="work_report_show_relation">
                {taskRelation.length !== 0 && (
                  <div>
                    <span>相关任务</span>
                    <div>
                      {taskRelation.map((titem: any, ti: number) => {
                        return <GetRelationTask item={titem} key={ti} type={1} />
                      })}
                    </div>
                  </div>
                )}

                {approvalRelation.length !== 0 && (
                  <div>
                    <span>相关审批</span>
                    <div>
                      {approvalRelation.map((aitem: any, ai: number) => {
                        return <GetRelationApproval item={aitem} key={ai} />
                      })}
                    </div>
                  </div>
                )}
                {meetRelation.length !== 0 && (
                  <div>
                    <span>相关会议</span>
                    <div>
                      {meetRelation.map((mitem: any, mi: number) => {
                        return <GetRelationMeeting item={mitem} key={mi} />
                      })}
                    </div>
                  </div>
                )}
                {okrRelation.length !== 0 && (
                  <div>
                    <span>相关OKR</span>
                    <div>
                      {okrRelation.map((titem: any, ti: number) => {
                        return <GetRelationTask item={titem} key={ti} type={5} />
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
        {/* 预览图片 */}
        <PhotosPreview ref={photosRef} />
      </div>
    )
  }

  // 关联任务
  const GetRelationTask = (datas: any) => {
    const { item, type } = datas

    return (
      <div className="relation_list_new relation_list_task relation_list_okr">
        <div className="relation_title_box ">
          <div
            className="relation_top_cont"
            onClick={() => {
              showDetails('task', item.relationId, item)
            }}
          >
            <Avatar src={item.profile} className="oa-avatar">
              {item.userName && item.userName.substr(-2, 2)}
            </Avatar>
            <div className="relation_right_box">
              <div className="relation_tit_cont">
                <span className="tit">{item.relationName}</span>
              </div>
              <div className="relation_status">
                {type == 1 && (
                  <>
                    {taskExcuteStatus(item.state)}
                    <div className="tit_time">{item.time}</div>
                  </>
                )}

                {type == 5 && (
                  <>
                    <div className="tit_time">周期 {item.periodStr}</div>

                    {item.workPlanTargetResultList?.length > 0 && (
                      <>
                        <div className="cell_line">|</div>
                        <div className="tit_time flex" style={{ width: 'calc(100% - 180px)' }}>
                          {RenderStatusTarget({
                            statusArr: item.workPlanTargetResultList,
                            label: <span style={{ marginTop: -6 }}>指标</span>,
                          })}
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
              <div className="relation_secend_box flex">
                <div className="relation_progoess">
                  <div className="progress_now">进度：{item.lastProcess}%</div>
                  <div className="progress_icon"></div>
                  <div className="progress_last"> {item.process} %</div>
                </div>
                {type == 5 && (
                  <>
                    <div className="cell_line">|</div>
                    <div className="relation_progoess">
                      <div className="progress_now">状态：{getStatusOrTime(1, item.lastProcessStatus)}</div>
                      <div className="progress_icon"></div>
                      <div className="progress_last"> {getStatusOrTime(1, item.processStatus)}</div>
                    </div>
                  </>
                )}
                {item.planType == 3 && (
                  <>
                    <div className="cell_line">|</div>
                    <div className="relation_progoess heart_kr">
                      <div className="progress_now">
                        信心指数：<i></i>
                        {item.lastCci}
                      </div>
                      <div className="progress_icon"></div>
                      <div className="progress_now">
                        <i></i>
                        {item.cci}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          {item.content != null && (
            <div
              className="relation_report_box"
              onClick={() => {
                showDetails('task', item.relationId, item)
              }}
            >
              <div className="add-task-report">
                <span className="tits">{type != 5 ? '汇报：' : '进展：'}</span>
                <span
                  className="cont"
                  dangerouslySetInnerHTML={{
                    __html: item.content,
                  }}
                ></span>
              </div>
            </div>
          )}
          {item.fileReturnModels && item.fileReturnModels.length != 0 && (
            <div className="attr-box">
              <RenderFileList
                list={item.fileReturnModels || []}
                large={true}
                teamId={reportDetailsData.belongId}
              />
            </div>
          )}
        </div>
      </div>
    )
  }

  /**
   * 任务执行状态
   *
   *  0 未开启
   *  1 开启
   *  2 完成
   *  3 延迟
   *  4 变更
   *  -1 删除
   */
  const taskExcuteStatus = (status: number) => {
    switch (status) {
      case 0:
        // 未开始
        return <span className="status_gray">未开始</span>
      case 1:
        // 进行中
        return <span className="status_blue">进行中</span>
      case 2:
        // 完成
        return <span className="status_green">完成</span>
      case 3:
        // 已延迟
        return <span className="status_red">已延迟</span>
      case 4:
        // 已变更
        return <span className="status_yellow">已变更</span>
      default:
        return <span className="status_gray">删除</span>
    }
  }

  // 关联审批
  const GetRelationApproval = (datas: any) => {
    const data = datas.item
    return (
      <div
        className="relation_list_new relation_list_approval"
        data-id={data.relationId}
        data-type={data.relationType}
        data-state={data.state}
        onClick={() => {
          showDetails('approval', data.relationId)
        }}
      >
        <div className="relation_title_box ">
          <div className="relation_top_cont">
            <Avatar src={data.profile} className="oa-avatar">
              {data.userName && data.userName.substr(-2, 2)}
            </Avatar>

            <div className="relation_right_box">
              <div className="relation_tit_cont">
                <span className="tit">{data.relationName}</span>
              </div>
              <div className="relation_status">
                {getListLable(data.state)}
                <div className="tit_time">{data.time}</div>
              </div>
            </div>
          </div>
          {data.content != null && (
            <div className="relation_remark_box">
              <div className="add-approval-remark">
                <span className="tits">备注：</span>
                <span className="cont">{data.content}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  /**
   * 列表标签
   * status
   *  0 审批中
   *  1 同意
   *  2 拒绝
   *  3 撤回
   *  4 回退
   *  5 终止
   *  6 重新发起
   *  7 等待发起
   *  8 知会备注
   *  9 替换节点
   *  10 暂存待办
   */
  const getListLable = (status: number) => {
    switch (status) {
      case 0:
        return <span className="status_yellow">审批中</span>
      case 1:
        return <span className="status_green">已通过审批</span>
      case 2:
        return <span className="status_red">已拒绝审批</span>
      case 3:
        return <span className="status_blue">撤回</span>
      case 4:
        return <span className="status_red">回退中</span>
      case 5:
        return <span className="status_red">终止</span>
      case 6:
        return <span className="status_blue">重新发起</span>
      case 7:
        return <span className="status_yellow">等待发起</span>
      case 8:
        return <span className="status_blue">知会</span>
      case 9:
        return <span className="status_blue">替换节点</span>
      case 10:
        return <span className="status_yellow">暂存待办</span>
    }
  }

  // 关联会议
  const GetRelationMeeting = (datas: any) => {
    const data = datas.item
    return (
      <div
        className="relation_list_new relation_list_meeting"
        data-state={data.state}
        data-id={data.relationId}
        data-type={data.relationType}
        onClick={() => {
          showDetails('meet', data.relationId)
        }}
      >
        <div className="relation_title_box ">
          <div className="relation_top_cont">
            <div className="relation_right_box">
              <div className="relation_tit_cont">
                <span className="tit">{data.relationName}</span>
              </div>
              <div className="relation_status">
                {getMeetingStatus(data.proceed, data.joinStatus, data.state)}
                <div className="tit_time">{data.time}</div>
                <span>{data.meetingRoomName}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
  const getMeetingStatus = (proceed: number, joinStatus: number, status: number) => {
    if (proceed == 0) {
      return <span className="status_yellow">审核中</span>
    } else if (proceed == 2) {
      return <span className="status_blue">进行中</span>
    } else if (proceed == 3) {
      return <span className="status_green">已结束</span>
    }
    if (joinStatus == 2) {
      //请假
      return <span className="status_yellow">已请假</span>
    }
    if (status == 0) {
      return <span className="status_red">已终止</span>
    }
    //审核中
    if (status == 2) {
      return <span className="status_yellow">审核中</span>
    }
  }
  //查看任务详情
  const lookTaskDetail = (item: any) => {
    //在当前强制汇报页面中显示任务详情

    let isaddtask = ''
    if (item.status == 1) {
      isaddtask = 'okr_draft'
    }

    const param = detailParam({
      visible: true,
      taskId: item.relationId,
      taskType: item.relationType != 1 ? 'okr' : '',
      // type:1--任务详情，2-okr详情
      taskData: { taskId: item.relationId, from: 'workReport', type: item.relationType == 1 ? 1 : 2 },
      isaddtask,
      from: 'workReport',
    })
    detailModalRef.current.setState(param)
  }
  const showDetails = (type: string, id: number, item?: any) => {
    setDetailsState({
      meetModalVisible: false, //会议详情
      taskModalVisible: false, //任务详情
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
      //查看审批详情
      $store.dispatch({
        type: 'SET_OPERATEAPPROVALID',
        data: { isQueryAll: false, ids: id },
      })
      $tools.createWindow('ApprovalOnlyDetail')
    }
  }

  const showPePop = (e: any) => {
    e.stopPropagation()
    setVisibleIsRead(true)
    console.log(reportDetailsData)
  }

  const stopVisibleIsRead = (e: any) => {
    e.stopPropagation()
  }

  const ReadUser = (prop: any) => {
    const item: any = prop.item
    return (
      <div className="listItem">
        {item.map((ritem: any, r: number) => {
          return (
            <span key={r}>
              {ritem.username}
              {prop.item.length - 1 == r ? '' : '、'}
            </span>
          )
        })}
      </div>
    )
  }

  const IsRead = (prop: any) => {
    const data: any = prop.item
    return (
      <li>
        {data.map((uitem: any, u: number) => {
          return (
            <div className="listItem" key={u}>
              <Avatar src={uitem.profile} className="oa-avatar">
                {uitem.username && uitem.username.substr(-2, 2)}
              </Avatar>
              <span>{uitem.username}</span>
            </div>
          )
        })}
      </li>
    )
  }

  const UnRead = (prop: any) => {
    const data: any = prop.item
    const [arrUnread, setarrUnread] = useState(data)
    return (
      <li>
        {arrUnread.map((uitem: any, u: number) => {
          return (
            <div className="listItem unreadList" key={u}>
              <div className="avatarBox">
                <Avatar src={uitem.profile} className="oa-avatar">
                  {uitem.username && uitem.username.substr(-2, 2)}
                </Avatar>
                <span className="avatarName">{uitem.username}</span>
              </div>
              {reportDetailsData.userId === nowUserId && (
                <span
                  className="rec_icon"
                  onClick={() => {
                    recallWorkReport(uitem.userId, u).then(resolve => {
                      arrUnread.splice(u, 1)
                      setarrUnread([...arrUnread])
                    })
                  }}
                >
                  撤回
                </span>
              )}
            </div>
          )
        })}
      </li>
    )
  }

  const recallWorkReport = (uid: number, u: number) => {
    return new Promise(resolve => {
      const param = {
        workReportId: reportDetailsData.reportId,
        userId: uid,
      }
      $api
        .request('/team/recallWorkReport', param, {
          headers: { loginToken: loginToken },
          formData: true,
        })
        .then(resData => {
          if (resData.returnCode == 0) {
            message.info('撤回成功')
            resolve(true)
          }
        })
    })
  }

  const SendUser = (prop: any) => {
    const data: any = prop.item
    return (
      <li>
        {data.map((uitem: any, u: number) => {
          return (
            <div className="listItem" key={u}>
              <Avatar src={uitem.profile} className="oa-avatar">
                {uitem.username && uitem.username.substr(-2, 2)}
              </Avatar>
              <span>{uitem.username}</span>
            </div>
          )
        })}
      </li>
    )
  }

  const JoinModelList = (prop: any) => {
    const data: any = prop.item
    const normalHeader = $tools.asAssetsPath('/images/chatWin/chat_project.png')
    return (
      <li>
        {data.map((uitem: any, u: number) => {
          return (
            // <Avatar key={u} src={uitem.userProfile} className="oa-avatar">
            //   {uitem.userName && uitem.userName.substr(-2, 2)}
            // </Avatar>
            <div className="listItem" key={u}>
              <Avatar key={u} src={uitem.icon || normalHeader} className="oa-avatar">
                {uitem.subject}
              </Avatar>
              <span className="avatarName">{uitem.subject}</span>
            </div>
          )
        })}
      </li>
    )
  }

  const Support = (prop: any) => {
    const data: any = prop.item
    console.log(data)
    return (
      <ul>
        {data?.map((uitem: any, u: number) => {
          return (
            <li className="listItem" key={u}>
              <Avatar src={uitem.profile} className="oa-avatar">
                {uitem.username && uitem.username.substr(-2, 2)}
              </Avatar>
              {/* <span>{uitem.userName && uitem.userName.substr(-2, 2)}</span> */}
            </li>
          )
        })}
      </ul>
    )
  }

  const Comments = () => {
    return (
      <div>
        {reportDetailsCommData.length != 0 &&
          reportDetailsCommData.content?.map((item: any, i: number) => {
            const _cont = `<b>${item.username}</b>：${item.content}`
            return (
              <div className="view_box_new" key={i}>
                <span className="view_profile" style={{ float: 'left' }}>
                  <Avatar src={item.profile} className="oa-avatar">
                    {item.username && item.username.substr(-2, 2)}
                  </Avatar>
                </span>
                <span className="view_cont_box">
                  <div className="view_cont">
                    <pre
                      className="user-cont"
                      data-id={item.id}
                      root-id={item.id}
                      data-user={item.userAccount}
                      data-name={item.username}
                      user-id={item.userId}
                      onClick={() => {
                        setVisibleShow && setVisibleShow(true, '', item.id)
                        console.log(item)
                        $store.dispatch({
                          type: 'WORK_REPORT_LIST_COMMENT',
                          data: {
                            workRpoertListCommRootId: item.id,
                            workRpoertListCommParentId: item.id,
                            workRpoertListCommName: item.username,
                            workRpoertListCommUserId: item.userId,
                          },
                        })
                      }}
                    >
                      <RenderPreImgs
                        content={`<div class="callUser" id="${item.id}" rootId="${item.id}" dataName="${item.username}" userId="${item.userId}" useraccout="${item.userAccount}">${_cont}</div>`}
                        photosRef={photosRef}
                      />
                    </pre>
                  </div>
                  <div className="taskFilesList overflow_hidden">
                    <RenderFileList
                      list={item.fileReturnModels || []}
                      large={true}
                      teamId={reportDetailsData.belongId}
                    />
                  </div>
                  <div className="view_time">
                    <span>{item.createTime}</span>
                  </div>
                  {item.childComments.length > 0 && (
                    <div className="view_child_cont">
                      {addChildComment(item.childComments, item.username, item.id)}
                    </div>
                  )}
                </span>
              </div>
            )
          })}
      </div>
    )
  }

  const addChildComment = (data: any, parentName: string, rootId: number) => {
    return (
      <div>
        {data.map((item: any, i: number) => {
          const _html: any = `<b>${item.username}</b>：回复 ${parentName}：${item.content}`
          return (
            <div key={i} className="child_item">
              <pre
                className="callUser"
                data-id={item.id}
                root-id={rootId}
                data-user={item.userAccount}
                data-name={item.username}
                user-id={item.userId}
                onClick={() => {
                  setVisibleShow && setVisibleShow(true, rootId, item.id)
                  console.log(item)
                  $store.dispatch({
                    type: 'WORK_REPORT_LIST_COMMENT',
                    data: {
                      workRpoertListCommRootId: rootId,
                      workRpoertListCommParentId: item.id,
                      workRpoertListCommName: item.username,
                      workRpoertListCommUserId: item.userId,
                    },
                  })
                }}
              >
                <RenderPreImgs content={_html} photosRef={photosRef} />
              </pre>
              <div className="taskFilesList overflow_hidden">
                {/* <FileList list={item.files || []} /> */}
                <RenderFileList
                  list={item.fileReturnModels || []}
                  large={true}
                  teamId={reportDetailsData.belongId}
                />
              </div>
              <div className="view_time">
                <span>{item.createTime}</span>
              </div>
              {item.childComments &&
                item.childComments.length != 0 &&
                addChildComment(item.childComments, item.username, rootId)}
            </div>
          )
        })}
      </div>
    )
  }

  useLayoutEffect(() => {
    initEvent()
  }, [])
  const initEvent = () => {
    jQuery('.ant-modal-wrap')
      .off()
      .click(function(e: any) {
        const _con = jQuery('.report_pop_box,.isRead_per_box') // 设置目标区域
        if (!_con.is(e.target) && _con.has(e.target).length === 0) {
          setVisibleIsRead(false)
        }
      })
  }

  return (
    <div
      id="printDataBox"
      ref={() => {
        initEvent()
      }}
    >
      <div className="report-type-title flex">
        <div className="fleft">
          <span className="report-icon-type">汇报类型：</span>
          <span className="report-type">{reportDetailsData.templateName}</span>
          <span className="report-year">
            {reportDetailsData.reportStartTime}
            {reportDetailsData.type !== 0 && reportDetailsData.type !== 5
              ? `${'-' + reportDetailsData.reportEndTime}`
              : ''}
          </span>
        </div>
        <div className="report_head">
          <div className="">
            <img src={$tools.asAssetsPath('/images/workReport/comn.png')} alt="" className="detail-head-icon" />
            <span className="detail-title-name">{reportDetailsData.belongName}</span>
          </div>
        </div>
        <div className=" work-report-submit">
          <div className="work_report_subtname">
            <span className="report-person-name">{reportDetailsData.userName}</span>&nbsp;于&nbsp;
            <span className="report-time">
              <span>{reportDetailsData.createTime}</span>
            </span>
            &nbsp;提交
          </div>
        </div>
      </div>

      <div className="report-content-box">
        <DetailsContent item={reportDetailsData.contentModels} />
      </div>

      <section className="set_report_file" style={{ overflow: 'hidden' }}>
        <div className="detail-attach-item" style={{ display: 'inherit' }}>
          <span className="fleft detail-attach-title">附件</span>
          <div className="attr-box">
            <RenderFileList
              list={reportDetailsData.fileReturnModels || []}
              large={true}
              teamId={reportDetailsData.belongId}
            />
          </div>
        </div>
      </section>
      <Divider style={{ background: '#E7E7E9' }} />
      <section className="set_report_per">
        <div className="isRead_per_box">
          <span
            className="isRead_per_tit active"
            onClick={e => {
              showPePop(e)
            }}
          >
            {reportDetailsData && reportDetailsData.readUsers && reportDetailsData.readUsers.length}人已读
          </span>
          <div className="isRead_per_cont">
            {reportDetailsData && reportDetailsData.readUsers && reportDetailsData.readUsers.length != 0 && (
              <ReadUser item={reportDetailsData.readUsers} />
            )}
          </div>
          {/* 展示头像区域 */}
        </div>

        {visibleIsRead && (
          <div
            className="report_pop_box"
            onClick={e => {
              stopVisibleIsRead(e)
            }}
          >
            <Tabs defaultActiveKey="1" className="readStatusTab">
              <Tabs.TabPane tab="已读" key="1">
                <div className="reportUsersList">
                  <ul className="detail-attach-names reportUsers">
                    {reportDetailsData &&
                      reportDetailsData.readUsers &&
                      reportDetailsData.readUsers.length != 0 && <IsRead item={reportDetailsData.readUsers} />}
                  </ul>
                </div>
              </Tabs.TabPane>
              <Tabs.TabPane tab="未读" key="2">
                <div className="copyUsersList">
                  <ul className="detail-attach-names reportUsers">
                    {reportDetailsData &&
                      reportDetailsData.unReadUsers &&
                      reportDetailsData.unReadUsers.length != 0 && (
                        <UnRead item={reportDetailsData.unReadUsers} />
                      )}
                  </ul>
                </div>
              </Tabs.TabPane>
              <Tabs.TabPane tab="发送对象" key="3">
                <div className="set_group_name">
                  <ul className="set_group_projName">
                    {reportDetailsData &&
                      reportDetailsData.reportUsers &&
                      reportDetailsData.reportUsers.length != 0 && (
                        <SendUser item={reportDetailsData.reportUsers} />
                      )}
                    {reportDetailsData &&
                      reportDetailsData.copyUsers &&
                      reportDetailsData.copyUsers.length != 0 && (
                        <SendUser item={reportDetailsData.copyUsers} />
                      )}
                    {reportDetailsData &&
                      reportDetailsData.projectJoinModelList &&
                      reportDetailsData.projectJoinModelList.length != 0 && (
                        <JoinModelList item={reportDetailsData.projectJoinModelList} />
                      )}
                  </ul>
                </div>
              </Tabs.TabPane>
            </Tabs>
          </div>
        )}
      </section>

      <section
        className="set_comment_box"
        style={{
          backgroundColor:
            (thumbsUpUserModelList && thumbsUpUserModelList.length > 0) || reportDetailsCommData.length > 0
              ? ''
              : 'initial',
        }}
      >
        {reportDetailsData &&
          reportDetailsData.thumbsUpUserModelList &&
          thumbsUpUserModelList &&
          thumbsUpUserModelList.length != 0 && (
            <div className="set_support_box">
              <div className="support_icon"></div>
              <div className="support_list">
                {thumbsUpUserModelList && thumbsUpUserModelList.length > 0 && (
                  <Support item={thumbsUpUserModelList} />
                )}
              </div>
            </div>
          )}
        <div className="opinion-area">
          <div className="row">
            <div className="provide-edit-view">
              <Comments />
            </div>
            {reportDetailsCommData &&
              reportDetailsCommData.totalPages > 1 &&
              reportDetailsCommData.pageNo < reportDetailsCommData.totalPages - 1 && (
                <div
                  className="reload_more_view"
                  onClick={() => {
                    queryCommt && queryCommt(reportDetailsCommData.pageNo + 1, reportDetailsCommData)
                  }}
                >
                  加载更多评论
                </div>
              )}
          </div>
        </div>
      </section>

      {/* 会议详情弹窗 */}
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
      {/* 任务详情 */}

      <DetailModal
        ref={detailModalRef}
        param={{
          from: 'workReport',
        }}
        // param={{
        //   visible: detailsState.taskModalVisible,
        //   from: 'undlist',
        //   id: detailsState.taskId,
        // }}
        // setvisible={() => {
        //   setDetailsState({
        //     taskModalVisible: false,
        //     taskId: '',
        //   })
        // }}
        // callbackFn={() => {}}
      ></DetailModal>
    </div>
  )
}
export default ReportDetailsPrint
