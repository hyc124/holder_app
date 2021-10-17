/**企业邀请组件**/
import React, { useEffect, useState } from 'react'
import { message, Modal, Avatar, Button } from 'antd'
import { showInviteDetail } from '@/src/views/system-notice-info/getData'
import './org-invitation-plug.less'
import { ipcRenderer } from 'electron'
import { refreshPage } from '../../TaskListData'
interface PlugProps {
  params: {
    visible: boolean
    id: any //noticeTypeId
    setvisible: (state: any) => void
    optionCallback: (params?: any) => void
    disposeType?: number
    isRead?: any
  }
}
//行业信息
const Industry = [
  { id: 1, name: '计算机/互联网/通信/电子' },
  { id: 2, name: '会计/金融/银行/保险' },
  { id: 3, name: '贸易/消费/制造/运营' },
  { id: 4, name: '制造/医疗' },
  { id: 5, name: '房地产/建筑' },
  { id: 6, name: '专业服务/教育/培训' },
  { id: 7, name: '服务业' },
  { id: 8, name: '物流/运输' },
  { id: 9, name: '能源/原材料' },
  { id: 10, name: '政府/非盈利组织/其他' },
]
const OrgInvitationPlug = (props: PlugProps) => {
  const { visible, id, setvisible, optionCallback } = props.params
  const { nowUserId, loginToken } = $store.getState()
  //企业邀请信息
  const [inviteInfo, setInviteInfo] = useState({
    name: '',
    description: '',
    logo: '',
    sortName: '',
    tradeHtml: '',
  })
  useEffect(() => {
    //查询企业邀请详情
    showInviteDetail({
      inviteId: id,
      userId: nowUserId,
    }).then((data: any) => {
      const { name, description, logo, sortName, trade } = data.data
      setInviteInfo({
        ...inviteInfo,
        name: name,
        description: description,
        logo: logo,
        sortName: sortName,
        tradeHtml: industry(trade),
      })
    })
  }, [id])

  //过滤行业信息
  const industry = (trade: number) => {
    const industryArr = Industry.filter((item: { name: string; id: number }) => item.id == trade)
    if (industryArr.length !== 0) {
      return industryArr[0].name
    }
    return '计算机/互联网/通信/电子'
  }
  //option 4拒绝 0接受
  const acceptInvite = (option: number, ascriptionType: number) => {
    const sendParam = {
      id: id,
      result: option,
      userId: nowUserId,
    }
    $api
      .request('/team/invite/operation', sendParam, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(data => {
        if (data.returnCode == 0) {
          const toastrMsg = ascriptionType == 2 ? '企业' : '团队'
          if (option === 0) {
            message.success(`成功加入${toastrMsg}`)
          } else {
            message.success(`拒绝加入${toastrMsg}`)
          }
          optionCallback(true)
          setvisible(false)
          // 成功关闭右小角弹窗
          ipcRenderer.send('handle_messages_option', ['invite', id, 'invite'])
          refreshPage && refreshPage() //刷新右侧待办列表
        } else {
          message.error(data.returnMessage)
        }
      })
      .catch(err => {
        setvisible(false)
        message.error(err.returnMessage)
      })
  }
  return (
    <Modal
      className="showInvitationModal"
      title="邀请通知"
      centered
      closable={true}
      visible={visible}
      maskClosable={true}
      onCancel={() => setvisible(false)}
      width={850}
      bodyStyle={{ padding: '20px', height: '500px' }}
      footer={
        props.params.disposeType == 0 ? (
          <div>
            <Button onClick={() => acceptInvite(4, 2)}>拒绝</Button>
            <Button type="primary" onClick={() => acceptInvite(0, 2)}>
              接受
            </Button>
          </div>
        ) : null
      }
    >
      <div className="modal-body">
        <p className="invitate_from">来源:{inviteInfo.name}</p>
        <div className="detail_item">
          <div className="detail_title">企业名称</div>
          <div className="detail_content org_name">
            <Avatar
              style={{ marginRight: '8px' }}
              size={30}
              src={
                inviteInfo.logo
                  ? inviteInfo.logo
                  : `${$tools.asAssetsPath('/images/common/company_default.png')}`
              }
            />
            {inviteInfo.name}
          </div>
        </div>
        <div className="detail_item">
          <div className="detail_title">企业简称</div>
          <div className="detail_content org_sort_name">{inviteInfo.sortName}</div>
        </div>
        <div className="detail_item">
          <div className="detail_title">行业</div>
          <div className="detail_content org_trade">{inviteInfo.tradeHtml}</div>
        </div>
        <div className="detail_item">
          <div className="detail_title">描述</div>
          <div className="detail_content org_description">{inviteInfo.description}</div>
        </div>
      </div>
    </Modal>
  )
}
export default OrgInvitationPlug
