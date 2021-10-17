import { CheckboxOptionType } from 'antd/lib/checkbox'
import { reject } from 'async'

export interface ReportUserListProps {
  userId: number
  username: string
  profile: string
  forceReportUser: boolean
}

export interface ReportContentListProps {
  id: number
  type: number
  title: string
  configTitle: string
  required: number
  inputBox: number
  relationTask: number
  hint: string
  belongType: number
  belongId: number
  position: number
  draft: string
  isActive: false
  isOpenList: false //展开右侧列表
  placeholder?: string //新建汇报模板提示问题
  templateModel: {
    allowImport: number
  }
  relationInfos?: {
    relationType: number
    relationId: number
    id: number
    relationName: string
    endTime: string
    startTime: string | null
    status: number
    userName: string
    userProfile: string
    executorUsername: string
    executorUserProfile: string
    flag: number
    priority: number | null
    reportCount: number
    lastProcess: number
    processNew: number
    process: number
    problemCount: number
    readPoint: number | null
    approvalStatus: number
    executorTime: string
    type: number
    relationState: number
    maxRole: number
    content: string
    files: []
    borderClass: boolean
  }[]
  editInput?: boolean
}
export interface ShareRoomList extends CheckboxOptionType {
  belongOrg: string
  belongType: string
  belongTypeId: string
  id: string
  muc: string
  subject: string
  talkType: number
  toPerson: Array<string>
  icon?: string
  type?: number
}
export interface ListProps {
  templateId: number
  name: string
  type: number
  allowImport: number
  customType: number
}
//确认导入上一篇
export const importLastReport = (param: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/team/report/content/findAllowReportByTeamIdAndType', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(data => {
        resolve(data)
      })
      .catch(err => {
        reject(err)
      })
  })
}
//编辑汇报
export const editReport = (param: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/team/findWorkReportById', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(data => {
        resolve(data)
      })
      .catch(err => {
        reject(err)
      })
  })
}

export const findRelationUser = (reportOrgId: any, templateId: number) => {
  const { loginToken, nowUserId } = $store.getState()
  return new Promise<ReportUserListProps[]>(resolve => {
    const param = {
      templateId,
      // ascriptionId: reportOrgId,
      userId: nowUserId,
    }
    // /team/relation/findRelationUser'
    $api
      .request('/team/relation/findDefaultReportUser', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        resolve(resData.dataList)
      })
  })
}
export const findTemplate = (params: any) => {
  const { loginToken, nowUserId } = $store.getState()
  const { reportOrgId, templateType, getTemplateId } = params
  return new Promise<ReportContentListProps[]>(resolve => {
    const param = {
      belongId: reportOrgId,
      type: templateType,
      templateId: getTemplateId,
      belongType: 2,
      userId: nowUserId,
    }
    $api
      .request('/team/report/config/list', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        resolve(resData.dataList)
      })
      .catch(res => {
        console.log('/team/report/config/list :' + res)
      })
  })
}
export const queryShareRoomList = () => {
  const { loginToken, nowAccount } = $store.getState()
  return new Promise<ShareRoomList[]>(resolve => {
    const param = {
      account: nowAccount,
    }
    $api
      .request('/im-consumer/project/find/join', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        resolve(resData)
      })
  })
}

export const getReportTemplate = (reportOrgId: any) => {
  const { loginToken } = $store.getState()
  return new Promise<ListProps[]>(resolve => {
    const param = {
      belongId: reportOrgId,
    }
    $api
      .request('/team/report/config/findWorkReportListByTeamId', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        resolve(resData.data)
      })
  })
}

//获取工作规划,审批,关联会议列表

export const getDataList = (url: string, param: any) => {
  const { loginToken } = $store.getState()
  return new Promise(resolve => {
    $api
      .request(url, param, {
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          loginToken: loginToken,
        },
      })
      .then(resData => {
        resolve(resData)
      })
  })
}

// addWorkReport
export const sendAddWorkReport = (param: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/team/addWorkReport', param, {
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          loginToken: loginToken,
        },
      })
      .then(resData => {
        resolve(resData)
      })
      .catch(err => {
        reject(err)
      })
  })
}

// addWorkReport
export const getCurrentTime = () => {
  const { loginToken } = $store.getState()
  const param = {
    userId: 1,
  }
  return new Promise<number>((resolve, reject) => {
    $api
      .request('/im-consumer/muc/getCurrentTime', param, {
        headers: {
          loginToken: loginToken,
          formData: true,
        },
      })
      .then(resData => {
        resolve(resData.data)
      })
      .catch(err => {
        reject(err)
      })
  })
}

// 汇报对象设置查找人
export const getPeople = (param: any) => {
  const { loginToken } = $store.getState()
  return new Promise<void>((resolve, reject) => {
    $api
      .request('/team/reportStatistics/queryClientReportUser', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        resolve(resData.data)
      })
      .catch(err => {
        reject(err)
      })
  })
}

// 保存更新数据
export const addSubmit = (param: any) => {
  const { loginToken } = $store.getState()
  return new Promise<void>((resolve, reject) => {
    $api
      .request('/team/reportStatistics/saveClientReportUser', param, {
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          loginToken: loginToken,
        },
      })
      .then(resData => {
        resolve(resData.data)
      })
      .catch(err => {
        reject(err)
      })
  })
}

// 报告接收统计 ReportAcceptance
export const ReportAcceptance = (param: any) => {
  const { loginToken } = $store.getState()
  return new Promise<void>((resolve, reject) => {
    $api
      .request('/team/reportStatistics/queryClientStatistics', param, {
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          loginToken: loginToken,
        },
      })
      .then(resData => {
        resolve(resData)
      })
      .catch(err => {
        reject(err)
      })
  })
}

// 报告接收统计 queryClientStatisticsDetail
export const queryClientStatisticsDetail = (param: any) => {
  const { loginToken } = $store.getState()
  return new Promise<void>((resolve, reject) => {
    $api
      .request('/team/reportStatistics/queryClientStatisticsDetail', param, {
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          loginToken: loginToken,
        },
      })
      .then(resData => {
        resolve(resData)
      })
      .catch(err => {
        reject(err)
      })
  })
}
