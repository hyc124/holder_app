import React, { useEffect, useState, Fragment } from 'react'
import { Modal, message, Tooltip, Button } from 'antd'
import { MinusCircleOutlined, PlusCircleOutlined } from '@ant-design/icons'
import { useSelector } from 'react-redux'
import SelectMember from '@/src/components/select-member/index'

interface AddRangeProps {
  newAdd: boolean
  rangeType: number
  teamInfoId: number
  ascriptionId: number
  ascriptionName: string
  ascriptionType: number
}

interface DataRangeProps {
  setRangeData: (addRangeData: AddRangeProps, permissionId: number) => void
  closeModal: () => void
  visible: boolean
  permissionType: number
}

export interface RelationModelItemProps {
  id: number
  type: number
  typeId: number
  typeName: string
  includeChild: number
  roleName: string
  key: number
  name: string
  deptName: string
}

function DataRange({ setRangeData, closeModal, visible, permissionType }: DataRangeProps) {
  const selectTeamId = useSelector((state: StoreStates) => state.selectTeamId)
  const { loginToken, nowAccount } = $store.getState()
  // 审批中的数据范围
  const [approvalingData, setApprovalingData] = useState([])
  // 已拥有的数据范围
  const [hasData, setHasData] = useState([])

  // 适用范围选择模态框显隐
  const [moddalVisible, setModalVisible] = useState(false)
  // 适用范围选中的成员
  const [checkedMember, setCheckedMember] = useState<Array<RelationModelItemProps>>([])

  // 权限时效：0永久 1限时 2次数
  const setTime = (grantType: number, grantValue: number, remainValue: number) => {
    if (grantType == 1) {
      // 剩余时间
      const remainHour = Math.floor(remainValue / (60 * 60 * 1000)) + '小时'
      const remainHourRemain = remainValue % (60 * 60 * 1000)
      let remainMinute = ''
      if (remainHourRemain != 0) {
        remainMinute = Math.floor(remainHourRemain / (60 * 1000)) + '分'
      }
      return `${grantValue}小时，${remainHour}${remainMinute}`
    } else if (grantType == 2) {
      return `${grantValue}'次，${remainValue}次`
    } else {
      return '永久'
    }
  }

  // 适用范围成员删除
  const delApplyMember = (record: RelationModelItemProps) => {
    setCheckedMember(origin => {
      return origin.filter(item => {
        return item.key !== record.key
      })
    })
  }

  //选择成员显示的名称
  const showName = (item: RelationModelItemProps) => {
    return item.type === 6
      ? item['roleName']
      : item.type === 31
      ? `${item.deptName}-${item.name}`
      : item['name']
  }

  // 保存选中的数据范围
  function setRange() {
    const permissionOrgModels: any = []
    checkedMember.map(item => {
      const obj = {
        newAdd: true,
        rangeType: 3,
        teamInfoId: selectTeamId,
        ascriptionId: item.id,
        ascriptionName: item.type === 31 ? `${item.deptName}-${item.name}` : item.name,
        ascriptionType: item.type,
      }
      permissionOrgModels.push(obj)
    })
    const params = {
      account: nowAccount,
      permissionOrgModels,
      teamId: selectTeamId,
      typeId: selectTeamId,
      type: permissionType,
      rangeType: 3,
    }
    $api
      .request('/team/permission/dataPermission/save', params, {
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          loginToken: loginToken,
        },
      })
      .then((res: any) => {
        // permissionOrgModels界面展示所需
        //申请权限所需permissionId:res.data
        setRangeData(permissionOrgModels, res.data)
        closeModal()
      })
      .catch(function(res) {
        message.error(res.returnMessage)
      })
  }

  useEffect(() => {
    const params = { teamId: selectTeamId, account: nowAccount, type: permissionType }
    $api
      .request('/team/permission/findUserDataPermissions', params, {
        headers: {
          loginToken: loginToken,
        },
        formData: true,
      })
      .then(res => {
        const hasData = res.dataList[0].permissionOrgModels
        const approvalData = res.dataList[1].permissionOrgModels
        if (hasData.length) {
          // 审批中的数据
          setApprovalingData(hasData)
        }
        if (approvalData.length) {
          // 已拥有的数据
          setHasData(approvalData)
        }
      })
      .catch(function(res) {
        message.error(res.returnMessage)
      })
  }, [])

  return (
    <Fragment>
      <Modal
        className="dataRangContent"
        visible={visible}
        width={850}
        bodyStyle={{ height: '520px', overflowY: 'auto' }}
        title="数据范围"
        onCancel={closeModal}
        onOk={setRange}
        maskClosable={false}
      >
        <div style={{ textAlign: 'right', marginBottom: '20px' }}>
          <Button
            icon={<PlusCircleOutlined style={{ fontSize: '16px', verticalAlign: '-3px' }} />}
            onClick={() => setModalVisible(true)}
          >
            添加数据权限
          </Button>
        </div>
        <div className="tabItem">
          <span>新增数据范围</span>
          <div className="rangDataBox">
            {checkedMember.map((item: RelationModelItemProps) => {
              return (
                <Tooltip placement="top" title={showName(item)} key={item.key}>
                  <div>
                    <span className="text">{showName(item)}</span>
                    <div className="delIcon" onClick={() => delApplyMember(item)}>
                      <MinusCircleOutlined />
                    </div>
                  </div>
                </Tooltip>
              )
            })}
          </div>
        </div>
        <div className="tabItem">
          <span>审批中数据范围</span>
          <span>
            {approvalingData.map((item: any) => {
              return (
                <Tooltip key={item.ascriptionId} placement="top" title={item.ascriptionName}>
                  <span className="rangDataItem">{item.ascriptionName}</span>
                </Tooltip>
              )
            })}
          </span>
        </div>
        <div className="tabItem">
          <span>已拥有数据范围</span>
          <span>
            {hasData.map((item: any) => {
              return (
                <Tooltip
                  key={item.ascriptionId}
                  placement="top"
                  title={`授权时效：${setTime(item.grantType, item.grantValue, item.remainValue)}`}
                >
                  <span className="rangDataItem">{item.ascriptionName}</span>
                </Tooltip>
              )
            })}
          </span>
        </div>
      </Modal>

      {/* 选择数据范围模态框 */}
      {moddalVisible && (
        <SelectMember
          visible={moddalVisible}
          checkMemberVisible={() => setModalVisible(false)}
          enterpriseId={selectTeamId}
          setMemberData={data => setCheckedMember(data)}
          checkedMember={checkedMember}
          use="authManage"
        />
      )}
    </Fragment>
  )
}

export default DataRange
