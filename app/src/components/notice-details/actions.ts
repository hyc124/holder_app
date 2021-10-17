import { message } from 'antd'

// 查询图片地址
export const getPictureUrl = (params: any) => {
  return new Promise(resolve => {
    $mainApi
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

//查询公告列表
export const getNoticeList = (params: object) => {
  return new Promise(resolve => {
    $mainApi
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
  return new Promise(resolve => {
    $mainApi
      .request('/team/notice/queryById', params, {
        headers: {
          loginToken: $store.getState().loginToken,
        },
        formData: true,
      })
      .then(res => {
        resolve(res.data)
      })
  })
}

// 查询详情评论列表
export const getCommentmessage = (params: object) => {
  return new Promise(resolve => {
    $mainApi
      .request('public/comment/commentMessagePage', params, {
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

// 查询已读未读成员
export const getUnreadUser = (params: object) => {
  return new Promise(resolve => {
    $mainApi
      .request('team/notice/findReadUserById', params, {
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

// 发布评论
export const addCommentMsg = (params: object) => {
  return new Promise(resolve => {
    $api
      .request('public/comment/addCommentMessage', params, {
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          loginToken: $store.getState().loginToken,
        },
      })
      .then(res => {
        resolve(res)
      })
      .catch(err => {
        resolve(err)
      })
  })
}

// 清空所有评论
export const clearAllComment = (params: object) => {
  return new Promise(resolve => {
    $mainApi
      .request('/public/comment/wipe', params, {
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

// 删除单条评论
export const removeComment = (params: object) => {
  return new Promise(resolve => {
    $mainApi
      .request('/public/comment/remove', params, {
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

//公告签收
export const receiptNotice = (params: object) => {
  $mainApi
    .request('team/notice/setReadByUserId', params, {
      headers: {
        loginToken: $store.getState().loginToken,
      },
      formData: true,
    })
    .then(res => {
      console.log(res)
    })
}
