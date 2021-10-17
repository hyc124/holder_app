import { useEffect, useState } from 'react'
import React from 'react'
import './MettingDetailsPop.less'
import Modal from 'antd/lib/modal/Modal'
import MeetQuery from './MeetQuery'
import MeetConculsion from './MeetConculsion'
import MeetAdd from './MeetAdd'
import { useSelector } from 'react-redux'
import { Select } from 'antd'
import { CaretDownOutlined } from '@ant-design/icons'
import { findAllCompanyApi } from '../../task/creatTask/getData'
import $c from 'classnames'
interface DetailsProps {
  listType: number
  typeId: number
  visibleDetails: boolean
  openType: string
  nowStatus: number
  isMeetType: boolean
  isDeskIn: boolean //是否是工作台快捷入口进入
}
interface MeetProps {
  datas: DetailsProps
  isVisibleDetails: (value: boolean) => void
}

const MettingDetailsPop = ({ datas, isVisibleDetails }: MeetProps) => {
  const { nowAccount, nowUserId } = $store.getState()
  const [detailsList, setDetailsList] = useState(false)
  // 会议详情
  const [meetDetails, setMetDetails] = useState(false)
  // 会议进度
  const [meetQuery, setMeetQuery] = useState(false)
  // 会议结论
  const [meetConculsion, setMeetConculsion] = useState(false)
  // 会议发起+编辑
  const [meetAdd, setMeetAdd] = useState(false)

  // 当前企业名称
  const [nowOrgName, setNowtOrgName] = useState('')
  const [nowOrgId, setNowOrgId] = useState<number>(0)
  // 列表
  const [orgList, setOrgList] = useState<any>([])
  // 确认请假/参加会议
  const refreshMeetList = useSelector((store: StoreStates) => store.refreshMeetList)
  useEffect(() => {
    if (refreshMeetList && !datas.isDeskIn) {
      isVisibleDetails(false)
    }
  }, [refreshMeetList])

  useEffect(() => {
    if (datas.openType === 'create' || datas.openType === 'start') {
      setMeetAdd(true)
      findAllCompanyApi({
        type: -1,
        userId: nowUserId,
        username: nowAccount,
      }).then((data: any) => {
        setOrgList(data)
        setNowtOrgName(data[0]?.shortName)
        setNowOrgId(data[0]?.id)
      })
    } else if (datas.openType === 'received') {
      setMetDetails(true)
    }
  }, [datas.openType])

  useEffect(() => {
    if (datas.visibleDetails) {
      setDetailsList(datas.visibleDetails)
    }
  }, [datas.visibleDetails])

  const bindEvent = (meetAdd: boolean, meetQuery: boolean, meetSition: boolean) => {
    setMeetAdd(meetAdd)
    setMeetQuery(meetQuery)
    setMetDetails(false)
    setMeetConculsion(meetSition)
  }

  const GetTitle = () => {
    if (datas.openType === 'start') {
      return (
        <div className="metting_type">
          <div
            className={$c('meet_details_menu mett_details', { active: meetAdd })}
            onClick={() => bindEvent(true, false, false)}
          >
            会议详情
          </div>
          <div
            className={$c('meet_details_menu meet_query', { active: meetQuery })}
            onClick={() => bindEvent(false, true, false)}
          >
            进度查询
          </div>
          <div
            className={$c('meet_details_menu meet_conculsion', { active: meetConculsion })}
            onClick={() => bindEvent(false, false, true)}
          >
            会议结论
          </div>
        </div>
      )
    } else if (datas.openType === 'received') {
      return (
        <div className="metting_type">
          <div className="meet_details_menu mett_details">收到的会议</div>
        </div>
      )
    } else {
      // 创建
      return (
        <Select
          style={{ width: 160 }}
          className="meet-org-box"
          value={nowOrgName}
          onChange={(value: string, option: any) => {
            setNowtOrgName(option.value)
            setNowOrgId(option.key)
          }}
          suffixIcon={<CaretDownOutlined />}
        >
          {orgList.map((item: any) => {
            return (
              <Select.Option key={item.id} value={item.shortName}>
                {item.shortName}
              </Select.Option>
            )
          })}
        </Select>
      )
    }
  }

  return (
    <Modal
      visible={datas.visibleDetails}
      title={<GetTitle />}
      width={850}
      onCancel={() => isVisibleDetails(false)}
      maskClosable={false}
      footer={null}
      keyboard={false}
      centered
      className={$c('metting-modal-details-box', {
        'metting-add-modal-details-box': datas.openType === 'create',
      })}
    >
      <div className="content_box">
        {meetAdd && (
          <MeetAdd
            datas={{
              visibleMeetAdd: meetAdd,
              openType: datas.openType,
              meetId: datas.typeId,
              nowStatus: datas.nowStatus,
              teamId: nowOrgId,
              teamName: nowOrgName,
            }}
            onHideAdd={(type: boolean) => {
              setMeetAdd(type)
              setMetDetails(type)
              isVisibleDetails(false)
            }}
          />
        )}
        {meetQuery && (
          <MeetQuery
            datas={{
              queryId: datas.typeId,
              listType: datas.listType,
              nowStatus: datas.nowStatus,
              isMeetType: datas.isMeetType,
            }}
          />
        )}
        {meetConculsion && (
          <MeetConculsion
            datas={{ queryId: datas.typeId, listType: datas.listType, nowStatus: datas.nowStatus }}
          />
        )}
      </div>
    </Modal>
  )
}

export default MettingDetailsPop
