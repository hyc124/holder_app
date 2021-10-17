import { useEffect, useState } from 'react'
import React from 'react'
import './MeetDetails.less'
import { Avatar, message, Input, Modal } from 'antd'
import { Button } from 'antd'
import { SelectMemberOrg } from '../../../components/select-member-org/index'
import MeetStatusPop from './MeetStatusPop'
import { useSelector } from 'react-redux'
import { RenderFileList } from './RenderUplodFile'
interface GetDatas {
  originator: string
  originatorRole: string
  originatorDept: string
  originatorId: number
  teamName: string
  teamId: number
  deptName: string
  type: string
  name: string
  subjects: []
  joinUsers: []
  meetingFileModels: []
  meetingRoomId: null
  meetingRoomName: string
  peopleNum: null
  startTime: string
  endTime: string
  taskModels: null
  conclusion: null
  notes: null
  createTime: string
  joinStatus: number
  meetingId: number
  toAttend: number
  status: number
  proceed: number
  overTime: string
  files: null
  mettingSourceModel: null
}

const MeetDetails = ({
  datas,
  isVisibleDetails,
  callback,
}: {
  datas: any
  isVisibleDetails: (value: boolean) => void
  callback: () => void
}) => {
  const props = datas
  const { nowUserId, loginToken } = $store.getState()
  // 详情数据
  const [detailsList, setDetailsList] = useState<any>([])
  const [showFile] = useState<number>(0)
  // 提醒方式
  const [remindType, serRemindType] = useState<any>([])

  // 请假/参加会议弹窗
  const [meetStatusPop, setMeetStatusPop] = useState(false)
  // 弹窗 请假 2  参加 1
  const [meetStatusType, setMeetStatusType] = useState<number>(2)
  // 确认请假/参加
  const refreshMeetList = useSelector((store: StoreStates) => store.refreshMeetList)

  const [memberOrgShow, setMemberOrgShow] = useState(false)
  const [teamId, setTeamId] = useState()
  // 选人插件参数
  const initSelMemberOrg: any = {
    teamId: teamId,
    sourceType: '', //操作类型
    allowTeamId: [teamId],
    selectList: [], //选人插件已选成员
    checkboxType: 'checkbox',
    permissionType: 3, //组织架构通讯录范围控制
    showPrefix: false, //不显示部门岗位前缀
  }
  const [selMemberOrg] = useState(initSelMemberOrg)
  // 列席成员
  const [subjectUser, selSubjectUser] = useState<any>([])
  // 参会成员
  const [joinUser, setJoinUser] = useState<any>([])
  const [fileUrl, setFileUrl] = useState('')

  // 普通附件
  const [normalFile, setNormalFile] = useState([])
  // 保密附件
  const [secrecyFile, setsecrecyFile] = useState([])
  //是否展示私密附件
  const [showSrcrecyFile, setShowSrcrecyFile] = useState(false)

  const [updataParam] = useState({
    meetingFiles: [], //会议附件
    joinUsers: joinUser,
    meetingId: props?.queryId, //会议id
    meetingRoom: '', //会议室id
    name: detailsList?.name, //会议名称
    startTime: detailsList?.startTime, //开始时间
    endTime: detailsList?.endTime, //结束时间
    subjects: subjectUser, //议题集合
  })

  useEffect(() => {
    if (refreshMeetList) {
      setMeetStatusPop(false)
    }
  }, [refreshMeetList])

  useEffect(() => {
    queryInfo().then(datas => {
      setDetailsList(datas)
      getType()
    })
  }, [])

  //校验当前登录人是否拥有 私密附件查看权限
  const checkUser = (arr: any) => {
    for (let i = arr.length; i--; ) {
      if (arr[i]?.id === nowUserId) {
        setShowSrcrecyFile(true)
      }
    }
  }

  const queryInfo = () => {
    return new Promise<GetDatas[]>(resolve => {
      const param = {
        type: 2, //收到的会议详情
        userId: nowUserId,
        meetingId: props?.queryId,
      }
      $api
        .request('/public/meeting/info', param, {
          headers: { loginToken: loginToken },
          formData: true,
        })
        .then((resData: any) => {
          // 关闭加载动画
          const datas = resData?.data
          console.log('会议详情数据', datas)
          // fileUsers
          checkUser(datas?.fileUsers || [])
          setTeamId(resData?.data?.teamId)
          resolve(resData?.data)
          const newSubjectArr: [] = datas?.subjects?.map((item: any) => {
            const users: any = []
            if (item?.users && item?.users?.length > 0) {
              item.users.map((uitem: any, i: number) => {
                users.push({
                  curId: uitem?.userId,
                  curName: uitem?.username,
                  curType: 0,
                  profile: uitem?.profile,
                })
              })
            }
            return {
              type: 'attendUser',
              id: item?.id,
              topic: item?.topic,
              goal: item?.goal,
              users: users,
            }
          })
          selSubjectUser(newSubjectArr)
          const newJoinUser: any = datas.joinUsers?.map((item: any) => {
            return {
              sourceType: 'joinUser',
              curId: item?.userId,
              curName: item?.username,
              curType: 0,
              profile: item?.profile,
            }
          })
          setJoinUser(newJoinUser)
          updataParam.subjects = newSubjectArr
          updataParam.startTime = datas?.startTime
          updataParam.endTime = datas?.endTime
          updataParam.name = datas?.name
          const $secrecyFile = datas?.fileReturnModels?.filter((item: any) => item?.isPrivacy === 1) //私密附件
          const $normalFile = datas?.fileReturnModels?.filter((item: any) => item?.isPrivacy === 0) //正常附件
          setsecrecyFile($secrecyFile)
          setNormalFile($normalFile)

          if (datas?.files && datas?.files?.length > 0) {
            $tools.getUrlByKey(datas?.files[0]?.fileKey, 'meetingRoomFile').then((url: string) => {
              setFileUrl(url)
            })
          }
        })
        .catch(resData => {
          console.log('/public/meeting/info:', param, resData)
          message.error(resData?.returnMessage)
          isVisibleDetails(false)
        })
    })
  }
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
        serRemindType(resData?.data?.endTimeSelect)
      })
  }

  const cancelSend = () => {
    isVisibleDetails(false)
  }

  const JoinUser = (params: any) => {
    const datas = params?.datas
    return datas.users.map((item: any, i: number) => {
      return (
        <div className="user-div" key={item?.curId}>
          {datas.type !== 'subjects' && (
            <Avatar className="oa-avatar" src={item.profile}>
              {item?.curName && item?.curName?.length > 2 ? item?.curName?.slice(-2) : item?.curName}
            </Avatar>
          )}
          <span className={`${datas.type === 'subjects' ? 'common' : ''}`}>
            {item?.curName && item?.curName?.length > 2 ? item?.curName.slice(-2) : item?.curName}
          </span>
        </div>
      )
    })
  }

  // 保密附件查阅人员
  const GetFilesCheckedUser = (props: any) => {
    const datas = props?.datas
    return datas.map((item: any, i: number) => {
      return (
        <div className="user-div " key={i}>
          {/* 私密附件查阅人员 */}
          <span className="common">
            {item?.username && item?.username?.length > 2 ? item?.username?.slice(-2) : item?.username}
          </span>
          <span className="delBtn"></span>
        </div>
      )
    })
  }

  // 参加1/请假2
  const meetStatus = (type: number) => {
    setMeetStatusPop(true)
    setMeetStatusType(type)
  }
  const visibleMeetStatusPop = (params: any) => {
    callback() //执行回调
    setMeetStatusPop(params?.state)
    if (params?.isSuc) {
      isVisibleDetails(params?.state)
    }
  }

  // 我发出的 status（会议状态）：0 会议取消 1 会议生效     process（会议进度）：0审核中 1未开始 2进行中 3已结束
  const getStatus = (status: number, proceed: number, joinStatus: number) => {
    //参会状态 -1过期未确认 0待确认 1参加 2请假 3会议取消
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
    return <span className={`status_name_span ${showInfo}`}>{newStatus}</span>
  }

  const getMeetStatus = (status: number, proceed: number, joinStatus: number, overTime: string) => {
    let showInfo = 'none_start'
    let showTime = `距离会议开始还有：${overTime}`
    if (proceed == 0) {
      showInfo = 'approval_ing'
      showTime = '暂无会议信息'
    } else if (proceed == 2) {
      showTime = `该会议已开始：${overTime}`
      showInfo = 'starting_meet'
    } else if (proceed == 3) {
      showInfo = 'meet_finish'
      showTime = '暂无会议信息'
    }
    if (joinStatus == 2) {
      //请假
      showInfo = 'qj_meet'
      showTime = '暂无会议信息'
    }
    if (status == 0) {
      showInfo = 'shut_down_meet'
      showTime = '暂无会议信息'
    }
    //审核中
    if (status == 2) {
      showInfo = 'approval_ing'
      showTime = '暂无会议信息'
    }

    return <span className={`status_name_span ${showInfo}`}>{showTime}</span>
  }

  const updataMeet = (e: any, type: string, id?: number) => {
    const _val = e.target.value
    if (type === 'meetName') {
      updataParam.name = _val
    }
    //  else {
    //   const newUpdataParam: [] = updataParam.subjects.map((item: any, index: number) => {
    //     if (id === item.id) {
    //       if (type === 'meetTile') {
    //         item.topic = _val
    //       }
    //       if (type === 'meetGoal') {
    //         item.goal = _val
    //       }
    //     }
    //     return {
    //       ...item,
    //     }
    //   })
    // }
  }

  return (
    <Modal
      visible={props.meetModal}
      title="收到的会议"
      onCancel={cancelSend}
      footer={null}
      width={850}
      keyboard={false}
    >
      <div className="meet_details_box meet_details_content_box">
        <div className="meetDetailCont meet_details_content">
          <div className="new_meeting_belong_box">
            <div className="depx_box">
              <div className="detail_meet_org belong_org_icon">
                <span></span>
                <p className="meet_org_name">{detailsList?.teamName}</p>
              </div>
              <div className="detail_meet_org belong_dept_icon">
                <span></span>
                <p className="start_user_name">发起人：{detailsList?.originator}</p>
              </div>
              <div className="detail_meet_org send_form_task">
                <p className="content_meet_task"></p>
              </div>
            </div>
            <div>{getStatus(detailsList?.status, detailsList?.proceed, detailsList?.joinStatus)}</div>
          </div>
          <div className="custom-row custom-row-selectRoom">
            <div className="list list-detail required-param">
              <div className="title">
                <label className="tit">已选会议室</label>
                {getMeetStatus(
                  detailsList?.status,
                  detailsList?.proceed,
                  detailsList?.joinStatus,
                  detailsList?.overTime
                )}
              </div>

              <div className="content detail-meet-name">
                <Avatar
                  size={20}
                  shape="square"
                  className=""
                  src={fileUrl === '' ? $tools.asAssetsPath('/images/mettingManage/cmpDefault.svg') : fileUrl}
                ></Avatar>
                <span>
                  {detailsList?.meetingRoomName} {detailsList?.startTime} - {detailsList?.endTime}{' '}
                </span>
              </div>
            </div>
          </div>
          <div className="custom-row custom-row-meetName">
            <div className="list list-detail required-param">
              <div className="title">
                <label className="tit">会议名称</label>
              </div>
              <div className="content detail-meet-name">
                {detailsList.name && (
                  <Input
                    type="text"
                    className="select-items detail_meet_name_input"
                    style={{ border: 'none' }}
                    disabled={true}
                    defaultValue={detailsList?.name}
                    onChange={e => {
                      updataMeet(e, 'meetName')
                    }}
                  />
                )}
              </div>
            </div>
          </div>
          <div className="items-box detail-subject-container">
            <div className="subject-title">
              <label className="tit">会议议题</label>
            </div>
            {subjectUser?.map((item: any, i: number) => {
              return (
                <div
                  className="items-detail"
                  key={i}
                  style={{
                    border: 'none',
                    background: '#F9F9F9',
                  }}
                >
                  <div className="custom-row custom-row-subject">
                    <div className="list list-detail required-param">
                      <div className="title">
                        <label className="tit">议题名称</label>
                      </div>
                      <div className="content detail-meet-discuss">
                        <Input
                          type="text"
                          className="discuss_item select-items"
                          style={{ border: 'none' }}
                          defaultValue={item?.topic}
                          disabled={true}
                          onChange={e => {
                            updataMeet(e, 'meetTile', item?.id)
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
                        <Input
                          type="text"
                          maxLength={500}
                          className="goal_item select-items"
                          style={{ border: 'none' }}
                          defaultValue={item?.goal}
                          disabled={true}
                          onChange={e => {
                            updataMeet(e, 'meetGoal', item?.id)
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
                          {item?.users && item?.users?.length != 0 && (
                            <JoinUser datas={{ users: item?.users, type: 'subjects' }} />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="custom-row custom-row-joinUser">
            <div className="list list-detail confrenList required-param">
              <div className="title">
                <label className="tit">参会成员</label>
              </div>
              <div className="content add_user_box">
                <div className="meet-user-div">
                  {joinUser && joinUser?.length != 0 && (
                    <JoinUser datas={{ users: joinUser, type: 'joinuser' }} />
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="detail-meet-file">
            <div className="custom-row custom-row-fileBox">
              <div className="list list-detail">
                {/* <div className="title">
                  <Button
                    className={`normal-attach ${showFile === 0 ? 'active' : ''}`}
                    onClick={() => {
                      setShowFile(0)
                    }}
                  >
                    正常附件
                  </Button>
                  <Button
                    className={`secrecy-attach ${showFile === 1 ? 'active' : ''}`}
                    onClick={() => {
                      setShowFile(1)
                    }}
                  >
                    保密附件
                  </Button>
                </div> */}
                <div className="content">
                  {detailsList?.fileReturnModels && detailsList?.fileReturnModels?.length !== 0 && (
                    <div className="file_list_box" style={{ display: 'inherit' }}>
                      {showFile === 0 && (
                        <RenderFileList list={normalFile || []} large={true} teamId={detailsList?.teamId} />
                      )}
                      {showFile === 1 && showSrcrecyFile && (
                        <RenderFileList list={secrecyFile || []} large={true} teamId={detailsList?.teamId} />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            {detailsList?.meetingFileModels && detailsList?.meetingFileModels?.length !== 0 && (
              <div
                className="custom-row custom-row-secrecy"
                style={{ display: `${showFile === 1 ? 'none' : ''}` }}
              >
                <div className="list list-detail">
                  <div className="title">
                    <label className="tit">查阅成员</label>
                  </div>
                  <div className="content">
                    <div className="meet-user-div">
                      {detailsList?.meetingFileModels &&
                        detailsList?.meetingFileModels?.length !== 0 &&
                        detailsList?.meetingFileModels?.map((item: any, i: number) => {
                          if (item?.type === 0 && item?.fileUsers && item?.fileUsers?.length !== 0) {
                            return <GetFilesCheckedUser datas={item?.fileUsers} />
                          }
                        })}
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="custom-row meet-concluitem">
              <div className="list list-detail">
                <div className="title">
                  <label className="tit">结论</label>
                </div>
                <div className="content meetConcluitem">{detailsList?.conclusion || ''}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="meetDetailFooterBox">
          {detailsList?.joinStatus === 0 && (
            <div className="meetDetailFooter meet_details_footer_box meet_recived_footer_box">
              <div className="sendBtn_box">
                <Button
                  className="vacate"
                  type="ghost"
                  value="2"
                  onClick={() => {
                    meetStatus(2)
                  }}
                >
                  请假
                </Button>
                <Button
                  className="joinMeet"
                  type="primary"
                  value="1"
                  onClick={() => {
                    meetStatus(1)
                  }}
                >
                  参加
                </Button>
              </div>
            </div>
          )}
        </div>
        {meetStatusPop && (
          <MeetStatusPop
            visibleDetails={meetStatusPop}
            datas={{
              meetId: props?.queryId,
              type: meetStatusType,
              remindType: remindType,
            }}
            visibleMeetStatusPop={visibleMeetStatusPop}
          />
        )}
        <SelectMemberOrg
          param={{
            visible: memberOrgShow,
            ...selMemberOrg,
          }}
          action={{
            setModalShow: setMemberOrgShow,
          }}
        />
      </div>
    </Modal>
  )
}

export default MeetDetails
