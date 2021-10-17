import React from 'react'
import { Checkbox } from 'antd'
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
 * 渲染职务授权和个人权限申请表格
 */
const RenderAuthTable = ({
  name,
  type,
  data,
  selTab,
  changeAuthData,
}: {
  name: string
  type: string
  data: AuthCallBackProps | null
  changeAuthData: (id: number, isCheck: number, title: string) => void
  selTab?: string
}) => {
  const addData =
    type === 'authModule' ? data?.authorityModel.addPermission : data?.authorityModel.addDataPermissions
  const delData =
    type === 'authModule' ? data?.authorityModel.delPermission : data?.authorityModel.delDataPermissions
  const addTitle = type === 'authModule' ? '申请新增' : '新增数据范围'
  const delTitle = type === 'authModule' ? '申请删除' : '删除数据范围'

  if (!addData && !delData) {
    return null
  }
  //渲染表格tr
  const renderTr = (title: string, trData: any[]) => {
    return (
      <tr className="post-auth-addRange">
        <td className="post-title">{title}</td>
        <td className="post-item">
          {trData.map((item, index) => (
            <div className="post-info-box" key={index}>
              <span className="post-item-title">
                <span>{item.functionName}</span>
              </span>
              <ul className="post-item-info">
                {item.permissionModels.map((val: { id: number; isChecked: number; permissionName: string }) => (
                  <li key={val.id}>
                    <Checkbox
                      onChange={() => {
                        changeAuthData(val.id, val.isChecked, title)
                      }}
                      defaultChecked={val.isChecked === 0}
                      disabled={selTab !== 'waitApproval'}
                    >
                      {val.permissionName}
                    </Checkbox>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </td>
      </tr>
    )
  }

  return (
    <div className="plugElementRow" style={{ alignItems: 'flex-start', marginBottom: 15, marginTop: 16 }}>
      <div className="plugRowLeft">{name}</div>
      <div className="plugRowRight">
        <table className="authTable">
          <tbody>
            {addData && addData.length !== 0 && renderTr(addTitle, addData)}
            {delData && delData.length !== 0 && renderTr(delTitle, delData)}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default RenderAuthTable
