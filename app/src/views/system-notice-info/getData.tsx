//系统通知模块接口集合
export interface ItemProps {
  content: string
  source: string
  createTime: string
  spareId: any
  status: number
  id: number
  belongId: number
  belongType: string
  belongName: string
  noticeType: string
  noticeTypeId: number
  flag: number
  reportType: number
  reportStartTime: any
  reportEndTime: any
  noticeTypeName: string
}
export const queryNoticeInfo = (params: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/public/synergy/findNoticeData', params, {
        headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
      })
      .then(res => {
        resolve(res)
      })
      .catch(err => {
        reject(err)
      })
  })
}

//标记已读
//全部类型的标记已读
export const signReadByScreenType = (params: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/public/synergy/signReadByScreenType', params, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(res => {
        if (res.returnCode == 0) {
          resolve(res)
        } else {
          reject('标记已读失败,服务器错误')
        }
      })
      .catch(err => {
        reject('标记已读失败')
      })
  })
}
//非全部类型的标记已读
export const signEasyNoticeRead = (params: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/public/synergy/signEasyNoticeRead', params, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(res => {
        if (res.returnCode == 0) {
          resolve(res)
        } else {
          reject('标记已读失败,服务器错误')
        }
      })
      .catch(err => {
        reject('标记已读失败')
      })
  })
}
//删除通知
export const deleteSystemNotice = (params: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/public/notification/deleteSystemNoticeById', params, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(res => {
        if (res.returnCode == 0) {
          resolve(res)
        } else {
          reject(res.returnMessage)
        }
      })
      .catch(err => {
        reject(err.returnMessage)
      })
  })
}
//=========================协同入口需要的接口信息==============================================================
//查询企业邀请详情
export const showInviteDetail = (params: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/team/invite/findInviteTeamInfo', params, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(res => {
        if (res.returnCode == 0) {
          resolve(res)
        } else {
          reject(res.returnMessage)
        }
      })
      .catch(err => {
        reject(err.returnMessage)
      })
  })
}

//拒绝/同意 企业邀请联系人
export const operateInviteLinkUser = (params: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/task/joinTeam/operateTeam', params, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(res => {
        if (res.returnCode == 0) {
          resolve(res)
        } else {
          reject(res.returnMessage)
        }
      })
      .catch(err => {
        reject(err.returnMessage)
      })
  })
}

//校验公告状态（是否被撤回）
export const checkNoticeState = (params: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/team/notice/pushQueryById', params, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(res => {
        resolve(res)
      })
      .catch(err => {
        reject(err.returnMessage)
      })
  })
}
