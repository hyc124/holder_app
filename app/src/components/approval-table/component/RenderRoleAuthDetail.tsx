import React, { useState, useEffect } from 'react'
import { Radio, Input } from 'antd'
import { FormContentModelProps } from '@/src/views/approval/components/ApprovalDettail'
import { getAuthCallBack } from '../getData/getData'
import RenderAuthTable from './RenderAuthTable'

//权限详情
interface AuthCallBackProps {
  type: number
  authId: number
  name: string
  typeName: string
  info: string
  callBackUrl: string
  authorityModel: {
    addPermission: {
      functionName: string
      permissionModels: { id: number; permissionName: string; isChecked: number }[]
    }[]
    delPermission: {
      functionName: string
      permissionModels: { id: number; permissionName: string; isChecked: number }[]
    }[]
    addDataPermissions: {
      functionName: string
      permissionModels: { id: number; permissionName: string; isChecked: number }[]
    }[]
    delDataPermissions: {
      functionName: string
      permissionModels: { id: number; permissionName: string; isChecked: number }[]
    }[]
    dataTimeModel: {
      grantType: number
      grantValue: number
    }
    functionTimeModel: {
      grantType: number
      grantValue: number
    }
  }
}
/**
 * 渲染权限申请详情
 */
const RenderRoleAuthDetail = ({
  infoContent,
  teamId,
  showInfo,
  selectName,
  showAuthInfo,
}: {
  infoContent: string
  teamId: number
  showInfo: FormContentModelProps[]
  selectName?: string
  isExecute?: boolean
  showAuthInfo?: (data: any) => void
}) => {
  const [authData, setAuthData] = useState<AuthCallBackProps>()
  const infoMsg = infoContent.split(':::')
  const findType = parseInt(infoMsg[0])
  const findId = parseInt(infoMsg[1])
  //权限授权类型
  const [authType, setAuthType] = useState(
    authData?.authorityModel.functionTimeModel
      ? authData?.authorityModel.functionTimeModel.grantType
      : undefined
  )
  //权限授权值
  const [authVal, setAuthVal] = useState(
    authData?.authorityModel.functionTimeModel
      ? authData?.authorityModel.functionTimeModel.grantValue
      : undefined
  )
  //数据范围类型
  const [dataType, setDataType] = useState(
    authData?.authorityModel.dataTimeModel ? authData?.authorityModel.dataTimeModel.grantType : undefined
  )
  //数据范围值
  const [dataVal, setDataVal] = useState(
    authData?.authorityModel.dataTimeModel ? authData?.authorityModel.dataTimeModel.grantValue : undefined
  )
  //请求权限申请数据范围
  useEffect(() => {
    getAuthCallBack(findType, findId, teamId).then(data => {
      setAuthData(data)
    })
  }, [findId])

  //修改申请权限后
  useEffect(() => {
    //暴露权限申请内容给审批详情
    showAuthInfo && showAuthInfo(authData)
  }, [authData])

  //修改权限设置
  const changeAuthData = (id: number, isCheck: number, title: string) => {
    if (!authData) {
      return
    }
    const wouldCheck = isCheck === 0 ? 1 : 0
    const newAuthData = Object.assign(authData)
    if (title === '申请新增') {
      const newPerMission = authData.authorityModel.addPermission.map(item => {
        item.permissionModels = item.permissionModels.map(idx => {
          if (idx.id === id) {
            idx.isChecked = wouldCheck
          }
          return idx
        })
        return item
      })
      newAuthData.authorityModel.addPermission = newPerMission
    } else if (title === '新增数据范围') {
      const newPerMission = authData.authorityModel.addDataPermissions.map(item => {
        item.permissionModels = item.permissionModels.map(idx => {
          if (idx.id === id) {
            idx.isChecked = wouldCheck
          }
          return idx
        })
        return item
      })
      newAuthData.authorityModel.addDataPermissions = newPerMission
    }
    //更新设置权限详情
    showAuthInfo && showAuthInfo(newAuthData)
  }

  //修改权限设置
  const changeAuthVal = (type: string, val: any) => {
    if (!authData) {
      return
    }
    const newAuthData = Object.assign(authData)
    if (type === 'auth_radio') {
      setAuthType(val)
      newAuthData.authorityModel.functionTimeModel.grantType = val
    } else if (type === 'auth_time') {
      setAuthType(val)
      newAuthData.authorityModel.functionTimeModel.grantType = val
    } else if (type === 'auth_input') {
      setAuthVal(val)
      newAuthData.authorityModel.functionTimeModel.grantValue = parseInt(val)
    } else if (type === 'dataRange_radio') {
      setDataType(val)
      newAuthData.authorityModel.dataTimeModel.grantType = val
    } else if (type === 'dataRange_input') {
      setDataVal(val)
      newAuthData.authorityModel.dataTimeModel.grantValue = parseInt(val)
    }
    showAuthInfo && showAuthInfo(newAuthData)
  }

  //根据不同权限显示
  const renderNodebyType = (item: FormContentModelProps) => {
    const type = item.type
    const name = item.elementName
    if (name === '授权时限' && type === 'auth_radio') {
      const normalSel = authType !== 1 && authType !== 2 ? 0 : 1
      return (
        <Radio.Group
          onChange={e => {
            changeAuthVal(type, e.target.value)
          }}
          defaultValue={normalSel}
        >
          <Radio value={0}>永久</Radio>
          <Radio value={1}>临时</Radio>
        </Radio.Group>
      )
    } else if (type === 'auth_radio' && name === '授权时效' && authType) {
      return (
        <Radio.Group
          onChange={e => {
            changeAuthVal('auth_time', e.target.value)
          }}
          defaultValue={authType}
        >
          <Radio value={1}>时间</Radio>
          <Radio value={2}>次数</Radio>
        </Radio.Group>
      )
    } else if (type === 'auth_input' && authType) {
      return (
        <Input
          type="number"
          onChange={e => {
            changeAuthVal('auth_input', e.target.value)
          }}
          defaultValue={authVal}
          placeholder={'请输入整数'}
        ></Input>
      )
    } else if (type === 'dataRange_radio') {
      //数据范围授权时限
      return (
        <Radio.Group
          onChange={e => {
            changeAuthVal(type, e.target.value)
          }}
          defaultValue={dataType}
        >
          <Radio value={0}>永久</Radio>
          <Radio value={1}>临时</Radio>
        </Radio.Group>
      )
    } else if (type === 'dataRange_input') {
      //数据范围授权时效值
      return (
        <Input
          type="number"
          onChange={e => {
            changeAuthVal(type, e.target.value)
          }}
          defaultValue={dataVal}
          placeholder={'请输入整数'}
        ></Input>
      )
    } else {
      return item.elementValue
    }
  }
  return (
    <>
      {showInfo.length !== 0 &&
        showInfo.map((item, index) => {
          if (item.type !== 'authModule' && item.type !== 'dataRange') {
            if (
              (item.elementName === '授权岗位' && findType != 1) ||
              (item.elementName === '授权时效' && !authType) ||
              (item.type === 'auth_input' && !authType) ||
              (item.type === 'dataRange_input' && !authType) ||
              ((item.type === 'dataRange_radio' || item.type === 'dataRange_input') &&
                !authData?.authorityModel.addDataPermissions)
            ) {
              //岗位授权才显示授权岗位
              return null
            }
            return (
              <div className="plugElementRow" key={index}>
                <div className="plugRowLeft">{item.elementName}</div>
                <div className="plugRowRight">{renderNodebyType(item)}</div>
              </div>
            )
          } else {
            if (!authData) {
              return null
            }
            return (
              <RenderAuthTable
                key={index}
                name={item.elementName}
                type={item.type}
                data={authData}
                selTab={selectName}
                changeAuthData={changeAuthData}
              />
            )
          }
        })}
    </>
  )
}
export default RenderRoleAuthDetail
