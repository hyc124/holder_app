import { message } from 'antd'

// 查询图片地址
export const getPictureUrl = (params: any) => {
  return new Promise(resolve => {
    $api
      .request('tools/oss/get/url', params, {
        headers: {
          loginToken: $store.getState().loginToken,
        },
        formData: true,
      })
      .then(res => {
        resolve(res)
      })
  })
}

//查询企业列表
export const getCompanylist = (params: object) => {
  return new Promise(resolve => {
    $api
      .request('/team/notice/group/findManagerEnterprise', params, {
        headers: {
          loginToken: $store.getState().loginToken,
        },
        formData: true,
      })
      .then(res => {
        resolve(res)
      })
      .catch(res => {
        resolve(res)
      })
  })
}

// 获取公告office在线编辑URL
export const getNoticeUrl = (params: object) => {
  return new Promise(resolve => {
    $api
      .request('team/notice/getNoticeUrl', params, {
        headers: {
          loginToken: $store.getState().loginToken,
        },
        formData: true,
      })
      .then(res => {
        resolve(res)
      })
      .catch(res => {
        resolve(res)
      })
  })
}
export const getGrouplist = (params: object) => {
  return new Promise(resolve => {
    $api
      .request('/team/notice/group/operate/list', params, {
        headers: {
          loginToken: $store.getState().loginToken,
        },
        formData: true,
      })
      .then(res => {
        resolve(res)
      })
  })
}

//查询企业公告类型列表
export const getNoticeTypelist = (params: object) => {
  return new Promise(resolve => {
    $api
      .request('/team/notice/group/user/list', params, {
        headers: {
          loginToken: $store.getState().loginToken,
        },
        formData: true,
      })
      .then(res => {
        resolve(res)
      })
  })
}

//查询公告列表
export const getNoticeList = (params: object) => {
  return new Promise(resolve => {
    $api
      .request('/team/notice/findListByCondition', params, {
        headers: {
          loginToken: $store.getState().loginToken,
        },
        formData: true,
      })
      .then(res => {
        resolve(res)
      })
  })
}

//编辑-查询公告详情
export const getNoticeById = (params: object) => {
  return new Promise((resolve, reject) => {
    $api
      .request('/team/notice/queryById', params, {
        headers: {
          loginToken: $store.getState().loginToken,
        },
        formData: true,
      })
      .then(res => {
        resolve(res.data)
      })
      .catch(err => {
        reject(err)
      })
  })
}
//公告操作:撤回,删除 optType 0撤回,1删除
export const noticeHandel = (id: number | string, reqUrl: string) => {
  const { nowUserId, nowAccount } = $store.getState()
  const params = {
    id: id,
    userId: nowUserId,
    username: nowAccount,
  }
  return new Promise((resolve, reject) => {
    $api
      .request(reqUrl, params, {
        headers: {
          loginToken: $store.getState().loginToken,
        },
        formData: true,
      })
      .then(res => {
        resolve(res)
      })
      .catch(err => {
        reject(err)
      })
  })
}

// 发布公告
export const publishNotice = (params: object) => {
  return new Promise(resolve => {
    $api
      .request('/team/notice/create', params, {
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          loginToken: $store.getState().loginToken,
        },
      })
      .then(res => {
        message.success(res.returnMessage)
        resolve(res)
      })
      .catch(err => {
        message.error(err.returnMessage)
      })
  })
}

// 开启关闭讨论
export const changeDiscussType = (params: object) => {
  return new Promise(resolve => {
    $api
      .request('/team/notice/openDiscuss', params, {
        headers: {
          loginToken: $store.getState().loginToken,
        },
        formData: true,
      })
      .then(res => {
        resolve(res)
      })
  })
}
