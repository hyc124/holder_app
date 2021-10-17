import React, { useEffect, useState } from 'react'
import { getMeetingDetail } from '../getData/getData'
import { Tooltip } from 'antd'
import { RenderFileList } from '@/src/views/mettingManage/component/RenderUplodFile'

interface MeetingDetailProps {
  name: string
  meetingRoomName: string
  startTime: string
  endTime: string
  teamName: string
  originator: string
  status: number
  subjects: {
    id: number
    topic: string
    goal: string
    users: { deptName: string; postName: string; username: string }[]
  }[]
  joinUsers: { deptName: string; postName: string; username: string }[]
  meetingFileModels: any[]
  overTime: string
}
/**
 * 渲染会议审批
 */
const RenderMeetingDetail = ({ showInfo, infoContent }: { showInfo: any[]; infoContent: string }) => {
  const [meetData, setMeetData] = useState<MeetingDetailProps | null>(null)
  const infoMsg = infoContent.split(':::')
  const meetId = parseInt(infoMsg[1])
  //请求权限申请数据范围
  useEffect(() => {
    getMeetingDetail(meetId).then((data: any) => {
      setMeetData(data)
    })
  }, [meetId])
  return (
    <>
      {showInfo.length !== 0 &&
        showInfo.map((item, index) => {
          if (item.type !== 'CuttingLine') {
            return (
              <div
                className="plugElementRow"
                key={index}
                style={{ alignItems: 'flex-start', marginBottom: 12, minHeight: 30 }}
              >
                <div className="plugRowLeft">{item.elementName || item.name}</div>
                <div className="plugRowRight" dangerouslySetInnerHTML={{ __html: item.elementValue }}></div>
              </div>
            )
          } else {
            return (
              <div className="plugElementRow" key={index}>
                <div className="form-cuttingLine"></div>
              </div>
            )
          }
        })}
      <div className="plugElementRow" style={{ alignItems: 'flex-start' }}>
        <div className="plugRowLeft">审批内容</div>
        <div className="plugRowRight">{meetData && <RenderMeetDetailContent data={meetData} />}</div>
      </div>
    </>
  )
}

export default RenderMeetingDetail

/**
 * 渲染会议详情
 */
const RenderMeetDetailContent = ({ data }: { data: MeetingDetailProps }) => {
  //获取会议附件
  const meetFiles = data.meetingFileModels.map(item => {
    return {
      fileName: item.file.fileName,
      fileKey: item.file.fileKey,
      fileSize: item.file.fileSize,
      dir: item.file.dir,
      uploadDate: item.file.uploadDate,
      uploadUser: item.file.uploadUser,
    }
  })
  return (
    <div className="meet-detail-container">
      <div className="meet-belong">会议所属: {data.teamName}</div>
      <div className="meet-content-container">
        <div className="meet-title">{data.name}</div>
        <div className="meet-info">
          <div className="meeting-info-msg">
            <div className="meeting-info-headImg">
              <img src={$tools.asAssetsPath('/images/meeting/none_meeting_room.png')} />
            </div>
            <div className="meet-name-container">
              <span className="meet-room">{data.meetingRoomName}</span>
              <div className="meet-time">
                {data.startTime}-{data.endTime}
              </div>
            </div>
            <div className="meeting-right-status">
              <div className="meeting-head-right">
                <span className="m-r-icon"></span>
                <span className="m-r-cont">已结束</span>
              </div>
              {data.overTime && <div className="meeting-all-time">距离会议开始时间：{data.overTime}</div>}
            </div>
          </div>
          <div className="meeting-org">
            <span className="meeting-org-icon"></span>
            <span className="meeting-org-name">{data.teamName}</span>
            <span className="meeting-org-user-icon"></span>
            <span className="meeting-org-user">{data.originator}</span>
          </div>
          <div className="meetTit-box">
            {data.subjects.map(item => (
              <div className="meeting-box" key={item.id}>
                <div className="topics">
                  <span>会议议题</span>
                  <p>{item.topic}</p>
                </div>
                <div className="goals">
                  <span>达到目标</span>
                  <p>{item.goal}</p>
                </div>
                <div className="userNames">
                  <span>列席成员</span>
                  <p>
                    {item.users.map((val, index) => (
                      <Tooltip key={index} title={val.username}>
                        <span>
                          {val.deptName ? `【${val.deptName}】` : ''}
                          {val.username}
                        </span>
                      </Tooltip>
                    ))}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="joinUsers">
            <span>参会成员</span>
            <p>
              {data.joinUsers.map((item, index) => (
                <Tooltip key={index} title={item.username}>
                  <span>
                    {item.deptName && item.deptName !== '' ? `【${item.deptName}】` : ''}
                    {item.username}
                  </span>
                </Tooltip>
              ))}
            </p>
          </div>
          <div className="joinUsers" style={{ border: 0 }}>
            <span>附件</span>
            <div className="attr-box">
              {/* <FileList list={meetFiles} /> */}
              <RenderFileList list={meetFiles || []} isApproval={true} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
