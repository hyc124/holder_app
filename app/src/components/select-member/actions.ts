import { message } from 'antd'
// 查询部门
export const getDeptTree = (params: object, url: string) => {
  return $mainApi
    .request(url, params, {
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        loginToken: $store.getState().loginToken,
      },
    })
    .then((res: any) => {
      if (res.returnCode === 0) {
        return {
          success: true,
          data: res.data,
        }
      } else {
        message.error(res.returnMessage)
      }
    })
}

// 查询岗位列表
export const getPostList = (params: object) => {
  return $mainApi
    .request('team/enterpriseRoleInfo/findEntRoles', params, {
      headers: {
        loginToken: $store.getState().loginToken,
      },
      formData: true,
    })
    .then((res: any) => {
      if (res.returnCode === 0) {
        return {
          success: true,
          data: res,
        }
      } else {
        message.error(res.returnMessage)
        return {
          success: false,
        }
      }
    })
}

// 查询角色列表
export const getRoleList = (params: object) => {
  return $mainApi
    .request('/team/enterpriseRole/findRoleList', params, {
      headers: {
        loginToken: $store.getState().loginToken,
      },
      formData: true,
    })
    .then((res: any) => {
      if (res.returnCode === 0) {
        return {
          success: true,
          data: res,
        }
      } else {
        message.error(res.returnMessage)
        return {
          success: false,
        }
      }
    })
}

// 查询部门、岗位、角色下具体成员
export const getMemberListAction = (params: object) => {
  return $mainApi
    .request('/team/enterpriseRoleInfo/findUserByEnterprise', params, {
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        loginToken: $store.getState().loginToken,
      },
    })
    .then((res: any) => {
      if (res.returnCode === 0) {
        return {
          success: true,
          data: res.data,
        }
      } else {
        message.error(res.returnMessage)
        return {
          success: false,
        }
      }
    })
}

// 适用范围根据名字-模糊查询
export const queryByName = (params: object) => {
  return $mainApi
    .request('/team/user/solr/findUserByEnterprise', params, {
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        loginToken: $store.getState().loginToken,
      },
    })
    .then((res: any) => {
      if (res.returnCode === 0) {
        return {
          success: true,
          data: res.dataList,
        }
      } else {
        message.error(res.returnMessage)
        return {
          success: false,
        }
      }
    })
}
