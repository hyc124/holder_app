import React, { useRef, useState } from 'react'
import { Modal, Row, Col, Avatar, Tooltip } from 'antd'
import WaterMark from '@/src/components/water-mask/water-mask'
import moment from 'moment'
import { RenderPreImgs, PhotosPreview } from '@/src/components/normal-preview/normalPreview'
import './announce.less'
import { RenderFileList } from '../mettingManage/component/RenderUplodFile'
import { PreViewOffice } from '../addModalWin/officeWrap'
import { CloseOutlined } from '@ant-design/icons'
import { noticeName } from '@/src/components/notice-details'
import $c from 'classnames'
interface PreviewProps {
  enterpriseList: any[]
  groupList: []
  visible: boolean
  closePreviewModal: () => void
  data: any
  isDownLoad: boolean
}

const NoticePreview = ({
  visible,
  closePreviewModal,
  groupList,
  enterpriseList,
  data,
  isDownLoad,
}: PreviewProps) => {
  // 图片预览框组件
  const photosRef = useRef<any>(null)
  //公告在线编辑状态模态框状态
  const [noticeVsible, setNoticeVsible] = useState(false)
  const { nowAccount, nowUser } = $store.getState()
  const userProfile = $store.getState().nowAvatar

  // 详情数据
  const {
    name,
    groupId,
    content,
    apply,
    fileModels,
    relationModels,
    template,
    ascriptionId,
    officeUrl,
    belongId,
  } = data
  // 当前企业
  const belongCompany: any =
    enterpriseList &&
    enterpriseList.find((item: any) => {
      return item.id == ascriptionId
    })

  // 当前分组
  const currentGroup = groupList
    ? groupList.find((target: any) => {
        return target.id == groupId
      })
    : belongCompany['groupList'].find((target: any) => {
        return target.id == groupId
      })
  return (
    <Modal
      className="modalNoticeDetails"
      width={window.innerWidth - 40}
      style={{ top: 20 }}
      bodyStyle={{ height: window.innerHeight - 93, overflowY: 'hidden' }}
      closable={false}
      visible={visible}
      maskClosable={false}
      title={
        <div className="notice_detaile_heder">
          <span>公告详情</span>
          <div className="tool_btns">
            <span className="icon" onClick={closePreviewModal}>
              <CloseOutlined />
            </span>
          </div>
        </div>
      }
      onCancel={closePreviewModal}
      footer={null}
    >
      <WaterMark
        text={`${nowUser && nowUser.length > 5 ? nowUser.substring(0, 5) : nowUser}_${
          nowAccount && nowAccount.length > 4 ? nowAccount.substr(-4, 4) : nowAccount
        }`}
        option={{ width: '100%', height: '100%' }}
      >
        <div id="noticeDetailsContent">
          <div className="notice_detaile_l">
            <div className={$c('notice_office', { oldnotice: !officeUrl })}>
              {officeUrl && (
                <PreViewOffice
                  visible={noticeVsible}
                  dataurl={officeUrl.replace('mode=edit', 'mode=view')}
                  setVisible={(flag: boolean) => {
                    setNoticeVsible(flag)
                  }}
                />
              )}
              {!officeUrl && (
                <RenderPreImgs
                  content={`<div className="detailsContent" >${content}</div>`}
                  photosRef={photosRef}
                  parentNode={true}
                />
              )}
            </div>
          </div>
          <div className="notice_detaile_r">
            <div className="r_header" style={{ height: template === 1 ? 141 : 90 }}>
              {template === 1 ? (
                <div className="headerFormal">
                  <header>{name}</header>
                  <table>
                    <tbody>
                      <tr>
                        <td>发布人</td>
                        <td>分类</td>
                        <td>法布时间</td>
                        <td>状态</td>
                      </tr>
                      <tr>
                        <td>{nowUser}</td>
                        <td>{currentGroup && currentGroup.name}</td>
                        <td>{moment().format('YYYY/MM/DD HH:mm')}</td>
                        <td>
                          <span style={{ color: '#999999' }}>草稿</span>
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
                      <span style={{ color: '#999999', border: '1px solid #999999' }}>草稿</span>
                    </header>
                  </Tooltip>

                  <div className="noticeInfo">
                    <Avatar style={{ minWidth: 'inherit' }} className="oa-avatar" src={userProfile} size={24}>
                      {nowUser && nowUser.substr(-2, 2)}
                    </Avatar>
                    <Tooltip
                      title={`${nowUser}-${moment().format('YYYY/MM/DD HH:mm')}|${currentGroup &&
                        currentGroup.name}`}
                    >
                      <span className="info">
                        <span>{nowUser}</span> <span>{moment().format('YYYY/MM/DD HH:mm')}</span> |{' '}
                        <span>{currentGroup && currentGroup.name}</span>
                      </span>
                    </Tooltip>
                  </div>
                </div>
              )}
            </div>
            <div className="r_wrap_cont" style={{ paddingRight: 20, overflow: 'overlay' }}>
              {/* <div className="detailsContent" dangerouslySetInnerHTML={{ __html: content }}></div> */}
              <Row justify="start" className="fileListBox">
                <div className="label_title">附件</div>
                <RenderFileList list={fileModels || []} large={true} hideDown={isDownLoad} teamId={belongId} />
              </Row>

              <Row justify="space-between" className="applyContent">
                <Col className="label_title">发布范围</Col>
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
                  relationModels.map((item: any, index: number) => {
                    return <span key={index}>{item.typeName || item.name}</span>
                  })}
              </Row>
            </div>
          </div>
        </div>
      </WaterMark>
      {/* 预览图片 */}
      <PhotosPreview ref={photosRef} />
    </Modal>
  )
}

export default NoticePreview
