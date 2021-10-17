import React from 'react'

function getType(type: number) {
  switch (type) {
    case 0:
      return <span className="type cg">草稿</span>
    case 1:
      return <span className="type yj">意见征集中</span>
    case 2:
      return <span className="type sh">审核中</span>
    case 3: //已发布
      return ''
    default:
      return <span className="type cg">草稿</span>
  }
}

function isUnRead(type: number, isRead: number) {
  if (type == 0 || type == 2) {
    //审批中 草稿 未读状态下 都取消红点
    return false
  } else {
    if (isRead == 0) {
      //未读显示红色点
      return true
    } else if (isRead == 1) {
      return false
    }
  }
}

const ColumnsWithAll = [
  {
    title: '公告名称',
    dataIndex: 'name',
    key: 'name',
    width: 400,
    render: (text: any, { type, isRead }: any) => {
      return (
        <p className="noticeText">
          {isUnRead(type, isRead) && <i className="isRead"></i>}
          <span className="title">{text}</span>
          {getType(type)}
        </p>
      )
    },
  },
  {
    title: '发布人',
    dataIndex: 'username',
    key: 'username',
    width: 140,
    render: (text: string) => {
      return <span className="creatUser">{text}</span>
    },
  },
  {
    title: '企业名称',
    dataIndex: 'teamName',
    key: 'teamName',
    width: 140,
    render: (text: string) => {
      return <span className="teamName">{text}</span>
    },
  },
  {
    title: '发布时间',
    dataIndex: 'time',
    key: 'time',
    width: 180,
    render: (text: string) => {
      return <span className="publishTime">{text}</span>
    },
  },
]

const ColumnsWithTeam = [
  {
    title: '公告名称',
    dataIndex: 'name',
    key: 'name',
    width: 400,
    render: (text: any, { type, isRead }: any) => {
      return (
        <p className="noticeText">
          {isUnRead(type, isRead) && <i className="isRead"></i>}
          <span className="title">{text}</span>
          {getType(type)}
        </p>
      )
    },
  },
  {
    title: '发布人',
    dataIndex: 'username',
    key: 'username',
    width: 140,
    render: (text: string) => {
      return <span className="creatUser">{text}</span>
    },
  },
  {
    title: '发布时间',
    dataIndex: 'time',
    key: 'time',
    width: 180,
    render: (text: string) => {
      return <span className="publishTime">{text}</span>
    },
  },
]

const publishTypeText = {
  '0': '草稿',
  '1': '意见征集',
  '2': '审批中',
  '3': '已发布',
}

const publishTypeColor = {
  '0': '#999999',
  '1': '#30A7CE',
  '2': '#FF9A09',
  '3': '#4FAD61',
}

export { ColumnsWithAll, ColumnsWithTeam, publishTypeText, publishTypeColor, isUnRead }
