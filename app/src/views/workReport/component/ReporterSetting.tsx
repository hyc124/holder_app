import React, { useState, useEffect } from 'react'
import { Modal, Form, Select, Button, Avatar, message } from 'antd'
import { getReportTemplate, ReportUserListProps, getPeople, addSubmit } from '../getData'
import { findAllCompanyApi } from '../../task/creatTask/getData'
import './reportStatistics.less'
import { SelectMemberOrg } from '@/src/components/select-member-org'
import ReportAccept from './ReportAccept'
interface ReporterSettingProps {
  visible: boolean
  onCancel: () => void
}
interface CompanyProps {
  id: number
  name: string
}
interface ReportTypeProps {
  templateId: number
  type: number
  name: string
}

const ReporterSetting = (props: ReporterSettingProps) => {
  const { visible, onCancel } = props
  const { nowUserId, nowAccount, nowUser, nowAvatar } = $store.getState()
  const [reportTypeList, setReporTypetList] = useState<ReportTypeProps[]>([])
  const [companyList, setCompanyList] = useState<CompanyProps[]>([])
  const [teamId, setteamId] = useState<any>(Number)
  const [templateId, settemplateId] = useState<any>(Number)
  const [reports, setreports] = useState<any>(false)
  // 汇报对象
  const [reportUserList, setReportUserList] = useState<Array<ReportUserListProps>>([])
  const [reportUser, setReportUser] = useState<any>({})
  //抄送对象
  const [CCUserList, setCCUserList] = useState<Array<ReportUserListProps>>([])
  // 选人插件参数
  const initSelMemberOrg: any = {
    teamId: '',
    sourceType: 'report', //操作类型
    allowTeamId: [''],
    selectList: reportUserList, //选人插件已选成员
    checkboxType: 'checkbox',
    permissionType: 3, //组织架构通讯录范围控制
    showPrefix: false, //不显示部门岗位前缀
  }
  const [selMemberOrg, setSelMemberOrg] = useState(initSelMemberOrg)
  const [memberOrgShow, setMemberOrgShow] = useState(false)
  const [form] = Form.useForm()
  const layout = {
    labelCol: { span: 24 },
    wrapperCol: { span: 24 },
  }
  const selMemberSure = (dataList: any) => {
    const _datas = dataList.map((item: any) => {
      return {
        userId: item.curId,
        curId: item.curId,
        curName: item.curName,
        curType: 0,
        profile: item.profile,
      }
    })
    setReportUserList(_datas)
    form.setFieldsValue({
      sendUsers: dataList[0]?.curName,
    })
  }

  const reportReceivingStatistics = () => {
    setreports(true)
  }

  useEffect(() => {
    findAllCompanyApi({
      type: -1,
      userId: nowUserId,
      username: nowAccount,
    }).then((companyData: any) => {
      if (companyData.length) {
        // 设置公司列表数据
        setCompanyList(companyData)
        // 查询汇报模板
        const teamId = companyData[0].id
        setteamId(teamId)
      }
    })
  }, [])

  useEffect(() => {
    if (teamId) {
      getReportTemplate(teamId).then(data => {
        if (data.length) {
          // 设置汇报模板列表数据
          setReporTypetList(data)
          const templateId = data[0].templateId
          settemplateId(templateId)
          form.setFieldsValue({
            teamId: teamId,
            templateId: templateId,
            receiveUser: nowUser,
            sendUsers: reportUserList[0]?.username,
          })
        }
      })
    }
  }, [teamId])

  useEffect(() => {
    // 查人接口
    const param = {
      templateId: templateId,
      userId: nowUserId,
    }
    getPeople(param).then((res: any) => {
      setReportUser(res)
      const $reportSendUsers = res.reportSendUsers || []
      const $reportUser = $reportSendUsers.map((item: any) => {
        return {
          userId: item.id,
          curId: item.id,
          curType: 0,
          curName: item.name,
          profile: item?.profile,
        }
      })
      setReportUserList($reportUser)
    })
  }, [templateId])

  const onFinishFailed = (errorInfo: any) => {
    setteamId(errorInfo.values.teamId)
    settemplateId(errorInfo.values.templateId)
  }

  // 添加模板内容
  const selReportUser = () => {
    //修改参数方式
    selMemberOrg.selectList = reportUserList
    selMemberOrg.orgBotList = []
    selMemberOrg.allowTeamId = [teamId]
    selMemberOrg.sourceType = 'report'
    selMemberOrg.orgBotInfo = {
      type: 'joinTeam',
      title: '参与企业联系人',
      titleSub: '（该任务链条下的企业联系人）',
    }
    setSelMemberOrg({
      ...selMemberOrg,
    })
    setMemberOrgShow(true)
  }

  const delUser = (id: string, type: number) => {
    if (type === 0) {
      reportUserList.map((item: any, index: number) => {
        if (item.curId == id) {
          return reportUserList.splice(index, 1)
        }
      })
      setReportUserList([...reportUserList])
    } else if (type === 1) {
      CCUserList?.map((item: any, index: number) => {
        if (item.curId == id) {
          return reportUserList.splice(index, 1)
        }
      })
      setCCUserList([...CCUserList])
    }
  }

  // 保存按钮
  const submitContent = () => {
    const userIds = reportUserList.map((item: any) => {
      return item.curId
    })
    const param = {
      reportUserIds: [reportUser.reportReceiveUser.id],
      templateId: templateId,
      userIds: userIds,
    }
    addSubmit(param).then(() => {
      message.success('保存成功！')
      onCancel()
    })
  }

  return (
    <>
      <Modal
        className="reporterSettingModal"
        visible={visible}
        title={'汇报对象设置'}
        width={850}
        bodyStyle={{ height: '566px' }}
        onCancel={onCancel}
        centered
        closable
        destroyOnClose
        footer={null}
      >
        <div className="formContent">
          <div className="tips">
            <div className="tips-text">
              提示：添加的【发汇报的人】在提交工作报告时，将强制将您作为收汇报的人。
            </div>
            <div className="tips-button">
              <Button type="primary" shape="round" size="small" onClick={reportReceivingStatistics}>
                报告接收统计
              </Button>
            </div>
          </div>
          <Form {...layout} name="basic" onFinishFailed={onFinishFailed} form={form}>
            <Form.Item label="归属企业" name="teamId" rules={[{ required: false, message: '请选择归属企业' }]}>
              <Select onChange={e => setteamId(e)}>
                {companyList.map(item => {
                  return (
                    <Select.Option key={item.id} value={item.id}>
                      {item.name}
                    </Select.Option>
                  )
                })}
              </Select>
            </Form.Item>
            <Form.Item label="报告类型" name="templateId">
              <Select onChange={e => settemplateId(e)}>
                {reportTypeList.map(item => {
                  return (
                    <Select.Option key={item.templateId} value={item.templateId}>
                      {item.name}
                    </Select.Option>
                  )
                })}
              </Select>
            </Form.Item>
            <Form.Item
              label="收汇报的人"
              name="receiveUser"
              rules={[{ required: true, message: '请选择收汇报的人' }]}
            >
              <div className="receiveUser_style">
                <Avatar src={nowAvatar} className="oa-avatar">
                  {nowUser && nowUser.length > 2 ? nowUser.slice(-2) : nowUser}
                </Avatar>
                <div style={{ margin: '4px' }}>
                  {nowUser && nowUser.length > 2 ? nowUser.slice(-2) : nowUser}
                </div>
              </div>
            </Form.Item>
            <Form.Item
              label="发汇报的人"
              name="sendUsers"
              rules={[{ required: true, message: '请选择发汇报的人' }]}
            >
              <div className="addMember">
                <div className="addMember_content">
                  {reportUserList.map((item: any, index: number) => (
                    <div className="reportUser1" key={index}>
                      <Avatar className="oa-avatar" src={item.profile || ''}>
                        {item.curName ? item.curName.substr(-2, 2) : ''}
                      </Avatar>
                      <div style={{ margin: '4px' }}>{item.curName ? item.curName.substr(-2, 2) : ''}</div>
                      {!item.disable && (
                        <div className="user-del-btn" onClick={() => delUser(item.curId, 0)}></div>
                      )}
                    </div>
                  ))}
                </div>
                <span
                  className="deffetImg"
                  onClick={() => {
                    selReportUser()
                  }}
                ></span>
              </div>
            </Form.Item>
            <Form.Item className="from_button">
              <Button className="cancel_button" htmlType="button" onClick={onCancel}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" onClick={submitContent}>
                保存
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Modal>
      {reports && (
        <ReportAccept
          visible={reports}
          changVisible={(flag: boolean) => setreports(flag)}
          reportUser={reportUser}
        />
      )}
      {/* 选人弹窗 */}
      {memberOrgShow && (
        <SelectMemberOrg
          param={{
            visible: memberOrgShow,
            ...selMemberOrg,
          }}
          action={{
            setModalShow: setMemberOrgShow,
            onSure: selMemberSure,
          }}
        />
      )}
    </>
  )
}

export default ReporterSetting
