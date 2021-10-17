import React from 'react'

interface PermissionProps {
  id: number
  isChecked: number
  permissionName: string
  grantType: number
}
interface PermissionModels {
  type: number
  grantType: number
  functionName: string
  permissionModels: PermissionProps[]
}

function getValue(permissions: any) {
  const data = JSON.parse(permissions)
  const result = data
    .map((item: PermissionModels) => {
      const name = `【${item.functionName}】`
      const list = item.permissionModels
        .map((record, index, target) => {
          if (index < target.length - 1) {
            return record.permissionName
          } else {
            return record.permissionName
          }
        })
        .join(' | ')
      return `${name}${list}`
    })
    .join('、')
  return result
}

const applyColumns = () => [
  {
    title: '序列',
    dataIndex: 'num',
    key: 'num',
  },
  {
    title: '申请记录',
    dataIndex: 'addPermissions',
    key: 'addPermissions',
    render: (text: string, record: any) => {
      let addPermissions = ''
      let delPermissions = ''
      if (record.addPermissions) {
        addPermissions = getValue(record.addPermissions)
      }
      if (record.delPermissions) {
        delPermissions = getValue(record.delPermissions)
      }
      return (
        <>
          {addPermissions && (
            <div style={{ display: 'flex' }}>
              <span>新增：</span>
              <span>{addPermissions}</span>
            </div>
          )}
          {delPermissions && (
            <div style={{ display: 'flex' }}>
              <span>删除：</span>
              <span>{delPermissions}</span>
            </div>
          )}
        </>
      )
    },
  },
  {
    title: '授权时效',
    dataIndex: 'grantType',
    key: 'grantType',
    render: (text: number, record: any) => {
      // 权限时效 0永久 1限时 2次数
      if (text === 1) {
        return record.grantValue + '小时'
      } else if (text === 2) {
        return record.grantValue + '次'
      } else {
        return '永久'
      }
    },
  },
  {
    title: '授权时间',
    dataIndex: 'grantTime',
    key: 'grantTime',
  },
]

const approvalColumns = (authRecovery: (id: number, content: string) => void) => [
  {
    title: '序列',
    dataIndex: 'num',
    key: 'num',
    width: 70,
  },
  {
    title: '申请人',
    dataIndex: 'grantObject',
    key: 'grantObject',
    width: 120,
  },
  {
    title: '申请记录',
    dataIndex: 'addPermissions',
    key: 'addPermissions',
    render: (text: string, record: any) => {
      let addPermissions = ''
      let delPermissions = ''
      if (record.addPermissions) {
        addPermissions = getValue(record.addPermissions)
      }
      if (record.delPermissions) {
        delPermissions = getValue(record.delPermissions)
      }
      return (
        <>
          {addPermissions && (
            <div style={{ display: 'flex' }}>
              <span style={{ minWidth: '42px' }}>新增：</span>
              <span>{addPermissions}</span>
            </div>
          )}
          {delPermissions && (
            <div style={{ display: 'flex' }}>
              <span>删除：</span>
              <span>{delPermissions}</span>
            </div>
          )}
        </>
      )
    },
  },
  {
    title: '授权时效',
    dataIndex: 'grantType',
    key: 'grantType',
    width: 100,
    render: (text: number, record: any) => {
      // 权限时效 0永久 1限时 2次数
      if (text === 1) {
        return record.grantValue + '小时'
      } else if (text === 2) {
        return record.grantValue + '次'
      } else {
        return '永久'
      }
    },
  },
  {
    title: '授权时间',
    dataIndex: 'grantTime',
    key: 'grantTime',
    width: 160,
  },
  {
    title: '操作',
    dataIndex: 'status',
    key: 'status',
    width: 100,
    render: (text: number, record: any) => {
      if (text == -1) {
        return <span style={{ color: '#9A9AA2' }}>已回收</span>
      } else if (text == 0) {
        return <span style={{ color: '#9A9AA2' }}>已过期</span>
      } else if (text == 1) {
        return (
          <span
            className="link-button"
            onClick={() => authRecovery(record.id, getValue(record.addPermissions))}
          >
            回收权限
          </span>
        )
      }
    },
  },
]

export { applyColumns, approvalColumns }
