import React, { useState, useEffect } from 'react'
import { Button, Modal, Tooltip, Avatar, Row, Col } from 'antd'
import { FormContentModelProps } from '@/src/views/approval/components/ApprovalDettail'
import { getNoticeDetailById } from '../getData/getData'
import WaterMark from '../../water-mask/water-mask'
import { CloseOutlined } from '@ant-design/icons'
import { PreViewOffice } from '@/src/views/addModalWin/officeWrap'
import $c from 'classnames'
import { publishTypeColor, publishTypeText } from '@/src/views/announce/fields'
import { noticeName } from '../../notice-details'
import { RenderFileList } from '@/src/views/mettingManage/component/RenderUplodFile'
//审批公告详情
interface NoticeDetailProps {
  id: number
  name: string
  content: string
  userId: number
  username: string
  userProfile: string
  type: number
  isDiscuss: number
  groupName: string
  time: string
  relationModels: { id: number; type: number; typeId: number; typeName: string; includeChild: number }[] //发布范围
  fileModels: any[]
  fileReturnModels: any[]
  belongName: string
}
/**
 * 渲染公告审批详情
 */
const RenderRuleDetail = ({ meetId, showInfo }: { meetId: number; showInfo: FormContentModelProps[] }) => {
  const [noticeData, setNoticeData] = useState<NoticeDetailProps | null>(null)
  const [showNotice, setShowNotice] = useState(false)
  //拉取公告内容详情
  useEffect(() => {
    getNoticeDetailById(meetId).then(data => {
      setNoticeData(data)
    })
  }, [meetId])
  return (
    <>
      {showInfo.length !== 0 &&
        showInfo.map((item, index) => {
          if (item.elementName !== '审批内容') {
            return (
              <div className="plugElementRow" key={index}>
                <div className="plugRowLeft">{item.elementName}</div>
                <div className="plugRowRight">{item.elementValue}</div>
              </div>
            )
          }
        })}
      <div className="plugElementRow" style={{ alignItems: 'flex-start' }}>
        <div className="plugRowLeft">审批内容</div>
        <div className="plugRowRight" style={{ alignItems: 'center' }}>
          {/* {noticeData && <RenderNoticeDetailContent data={noticeData} />} */}
          {noticeData && (
            <Button className="notice_detaile_btn" onClick={() => setShowNotice(true)}>
              公告详情
            </Button>
          )}
        </div>
      </div>
      {showNotice && (
        <NoticeDetileModal
          data={noticeData}
          visible={showNotice}
          setVsible={(flag: boolean) => {
            setShowNotice(flag)
          }}
        />
      )}
    </>
  )
}

export default RenderRuleDetail

//渲染公告内容
const NoticeDetileModal = (props: any) => {
  const {
    username,
    template,
    name,
    groupName,
    time,
    type,
    userProfile,
    relationModels,
    fileReturnModels,
    noticeUrl,
    content,
    isDownload,
  } = props.data
  const { nowAccount } = $store.getState()
  //公告在线编辑状态模态框状态
  const [noticeVsible, setNoticeVsible] = useState(false)
  const $isDownload = isDownload !== 0 && type !== 0 && type !== 2
  return (
    <Modal
      className="approNoticeWrap"
      visible={props.visible}
      width={window.innerWidth - 40}
      closable={false}
      style={{ top: 20 }}
      bodyStyle={{ height: window.innerHeight - 57, overflowY: 'hidden' }}
      onCancel={() => props.setVsible(false)}
      footer={null}
    >
      <WaterMark text={username + '-' + nowAccount.substr(-4, 4)} option={{ width: '100%', height: '100%' }}>
        <div className="approval-notice-header">
          <span className="title">公告详情</span>
          <CloseOutlined className="close_icon" onClick={() => props.setVsible(false)} />
        </div>
        <div className="approval-notice-content">
          <div className={$c('approval-notice-l', { oldnotice: !noticeUrl })}>
            {noticeUrl && (
              <PreViewOffice
                visible={noticeVsible}
                dataurl={noticeUrl}
                setVisible={(flag: boolean) => {
                  setNoticeVsible(flag)
                }}
              />
            )}
            {!noticeUrl && (
              <section className="notice-item" style={{ height: '100%', padding: 20 }}>
                {content && (
                  <div className="notice-content" dangerouslySetInnerHTML={{ __html: content }}></div>
                )}
                {!content && <div>暂无公告内容</div>}
              </section>
            )}
          </div>
          <div className="approval-notice-r">
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
                              <span style={{ color: publishTypeColor[type] }}>{publishTypeText[type]}</span>
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
                    <Avatar style={{ minWidth: 'inherit' }} className="oa-avatar" src={userProfile} size={24}>
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
              {/* <div className="detailsContent" dangerouslySetInnerHTML={{ __html: content }}></div> */}
              <Row justify="start" className="fileListBox">
                <div className="label_title">附件</div>
                {/* <ul>{fileModels && <FileList list={fileModels} />}</ul> */}
                <ul>
                  <RenderFileList
                    list={fileReturnModels || []}
                    large={true}
                    hideDown={$isDownload ? false : true}
                  />
                </ul>
              </Row>

              <Row justify="space-between" className="applyContent">
                <Col className="label_title">发布范围</Col>
              </Row>
              <Row className="membersList">
                {relationModels &&
                  relationModels.map((item: any) => {
                    return <span key={item.typeId}>{item.typeName}</span>
                  })}
              </Row>
            </div>
          </div>
        </div>
      </WaterMark>
    </Modal>
  )
}
