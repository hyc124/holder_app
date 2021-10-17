import { message } from 'antd'

//获取企业列表数据
export const findByTypeAndUser = (param: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/team/enterpriseInfo/findByTypeAndUser', param, {
        headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
      })
      .then(data => {
        resolve(data)
      })
      .catch(err => {
        reject(err)
      })
  })
}
// 获取企业列表下的部门信息
export const findUserMainPostAndDepartment = (param: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/team/enterpriseUser/findUserMainPostAndDepartment', param, {
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

// 查询最近联系人的列表
export const queryUserList = (keywords: string) => {
  const { nowUserId, loginToken } = $store.getState()
  return new Promise(resolve => {
    const param = {
      keywords: keywords,
      userId: nowUserId,
    }
    $api
      .request(
        '/im-biz/addressBook/recentContactPerson',
        { ...param },
        {
          headers: { loginToken: loginToken },
          formData: true,
        }
      )
      .then(resData => {
        resolve(resData.dataList || [])
      })
      .catch(() => {
        if (window.navigator.onLine == false) {
          message.error('当前网络异常，加载数据失败...')
        } else {
          message.error('加载数据失败...')
        }
      })
  })
}

// 查询联系人列表
export const queryAddressList = (param: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request(
        '/im-biz/addressBook/frequentContactPerson',
        { ...param },
        {
          headers: { loginToken: loginToken },
          formData: true,
        }
      )
      .then(data => {
        resolve(data)
      })
      .catch(err => {
        reject(err)
      })
  })
}
// 添加常用联系人
export const addCustomLinkman = (param: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/im-biz/addressBook/addCustomLinkman', param, {
        headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
      })
      .then(data => {
        resolve(data)
      })
      .catch(err => {
        reject(err)
      })
  })
}
// 删除常用联系人
export const deleteCustomLinkman = (param: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/im-biz/addressBook/deleteCustomLinkman', param, {
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
// 查询个人卡片信息
export const findMemberCard = (param: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/team/user/findMemberCard', param, {
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
// 编辑联系人备注
export const editLinkMan = (param: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/im-biz/addressBook/editLinkMan', param, {
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
// 添加编辑联系人
export const addSingleCustomLinkman = (param: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/im-biz/addressBook/addSingleCustomLinkman', param, {
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
// 获取企业树状结构数据
export const findEnterpriseTree = (param: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/team/permission/findEnterpriseTree', param, {
        headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
      })
      .then(data => {
        resolve(data)
      })
      .catch(err => {
        reject(err)
      })
  })
}
export const findRolesByPermission = (param: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/team/enterpriseRole/findRolesByPermission', param, {
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

export const findRolePermissionUsers = (param: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/team/enterpriseRole/findRolePermissionUsers', param, {
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

// 获取通讯录列表下的部门信息
export const mailListFindEnterpriseTreeModel = (param: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/team/permission/mailListFindEnterpriseTreeModel', param, {
        headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
      })
      .then(data => {
        resolve(data)
      })
      .catch(err => {
        reject(err)
      })
  })
}

// 获取通讯录群组列表
export const getGroupData = (param: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/im-biz/addressBook/pageSearch', param, {
        headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
      })
      .then(res => {
        resolve((res && res.data) || [])
      })
      .catch(err => {
        reject(err)
      })
  })
}

// 搜索聊天室列表
export const searchAddressList = (keywords: string) => {
  const { nowUserId, loginToken } = $store.getState()
  return new Promise(resolve => {
    const param = {
      keywords: keywords,
      userId: nowUserId,
    }
    $api
      .request(
        '/im-biz/chatRoom/search',
        { ...param },
        {
          headers: { loginToken, 'Content-Type': 'application/json' },
        }
      )
      .then(resData => {
        resolve(resData.data)
      })
      .catch(() => {
        if (window.navigator.onLine == false) {
          message.error('当前网络异常，加载数据失败...')
        } else {
          message.error('加载数据失败...')
        }
      })
  })
}
