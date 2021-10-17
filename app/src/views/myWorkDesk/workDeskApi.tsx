import { requestApi } from '@/src/common/js/ajax'

/**
 * 查询工作台模块新版
 * @param paramObj
 */
export const queryDeskModulesApi = (paramObj: { userId: any }) => {
  return new Promise(resolve => {
    const param = {
      ...paramObj,
    }
    requestApi({
      url: '/public/workbench/module/findModuleByUser', //新接口
      param,
    }).then((res: any) => {
      resolve(res.data)
    })
  })
}
/**
 * 查询工作台用户标签模块
 * @param paramObj
 */
export const queryDeskUserTemplateApi = (paramObj: { userId: any }) => {
  return new Promise(resolve => {
    const param = {
      ...paramObj,
    }
    requestApi({
      url: '/public/workbench/module/findTemplateByUser', //新接口
      param,
    }).then((res: any) => {
      resolve(res.data)
    })
  })
}
/**
 * 保存工作台用户标签模块
 */
export const saveDeskUserTemplateApi = (paramObj: any, url: string) => {
  return new Promise(resolve => {
    const param = {
      ...paramObj,
    }
    // 新接口 /public/workbench/module/setTemplateByUser
    const getUrl = url || '/public/workbench/module/setTemplateByUser'
    requestApi({
      url: getUrl,
      param,
      json: true,
      successMsg: '保存成功',
    }).then((res: any) => {
      if (res.success) {
        resolve(res)
      } else {
        resolve(false)
      }
    })
  })
}
/**
 * 查询工作台模块 旧版
 * @param paramObj
 */
export const queryDeskModuleApi = (paramObj: { userId: any }, headers: any) => {
  return new Promise(resolve => {
    const param = {
      ...paramObj,
    }
    requestApi({
      url: '/public/homeModule/findUserUsingTemplate',
      param,
      headers,
    }).then((res: any) => {
      resolve(res.data)
    })
  })
}
/**
 * 删除模块
 */
export const deskModuleDelApi = (paramObj: { moduleId: any }) => {
  return new Promise(resolve => {
    const { nowUserId } = $store.getState()
    const param = {
      userId: nowUserId,
      ...paramObj,
    }
    requestApi({
      // url: '/public/homeModule/deleteHomeModule',
      // 新接口
      url: '/public/workbench/module/deleteByModuleId',
      param,
      successMsg: '删除成功',
      apiType: 1,
    }).then((res: any) => {
      if (res.success) {
        resolve(res)
      } else {
        resolve(false)
      }
    })
  })
}
/**
 * 保存工作台模板配置
 */
export const deskModuleListSave = (paramObj: any, url: string) => {
  return new Promise(resolve => {
    const param = {
      ...paramObj,
    }
    // 新接口：/public/workbench/module/initTemplate
    const getUrl = url || '/public/homeModule/saveUserTemplate'
    requestApi({
      url: getUrl,
      param,
      json: getUrl == '/public/homeModule/saveUserTemplate' ? true : false,
      successMsg: '保存成功',
    }).then((res: any) => {
      if (res.success) {
        resolve(res)
      } else {
        resolve(false)
      }
    })
  })
}

/**
 * 查询导入
 */
export const findImportTypeApi = (paramObj: { homeType: any }) => {
  return new Promise(resolve => {
    const { nowUserId } = $store.getState()
    const param = {
      userId: nowUserId,
      ...paramObj,
    }
    requestApi({
      url: '/task/import/findImportType',
      param,
    }).then((res: any) => {
      if (res.success) {
        resolve(res.data)
      } else {
        resolve(false)
      }
    })
  })
}

/**
 * 导入任务
 * @param paramObj
 * @returns
 */
export const importTaskSaveApi = (paramObj: { homeType: any; importType: any }) => {
  return new Promise(resolve => {
    const { nowUserId } = $store.getState()
    const param = {
      userId: nowUserId,
      ...paramObj,
    }
    requestApi({
      url: '/task/import/save',
      param,
      json: true,
      successMsg: '导入成功',
    }).then((res: any) => {
      if (res.success) {
        resolve(res.data)
      } else {
        resolve(false)
      }
    })
  })
}
/**
 * 查询工作台模块数量
 * @param paramObj
 * @returns
 */
export const queryDeskTabsCount = (paramObj: { userId: any; teamId: any }, isFollow?: boolean) => {
  const { selectTeamId, followSelectTeadId } = $store.getState()
  const newOrgId = selectTeamId === -1 || isNaN(selectTeamId) ? '' : selectTeamId
  const followOrgId = followSelectTeadId === -1 ? '' : followSelectTeadId
  paramObj.teamId = isFollow ? followOrgId : newOrgId
  return new Promise(resolve => {
    const param = {
      ...paramObj,
    }
    requestApi({
      url: '/public/homeModule/countHomeByUser',
      param,
    }).then((res: any) => {
      if (res.success) {
        resolve(res.data)
      } else {
        resolve(false)
      }
    })
  })
}

/**
 * 工作台模块编辑器恢复默认查询
 * @param paramObj
 * @returns
 */
export const deskBackDefSetting = (paramObj: { type: number | string }) => {
  return new Promise(resolve => {
    const param = {
      ...paramObj,
    }
    requestApi({
      url: '/public/workbench/module/findDefaultTemplate',
      param,
    }).then((res: any) => {
      if (res.success) {
        resolve(res.data)
      } else {
        resolve(false)
      }
    })
  })
}

/**
 * 工作台模块标签移动保存
 * @param paramObj
 * @returns
 */
export const deskTabElementMoveApi = (paramObj: { moduleId: any; elementId: any; position: number }) => {
  return new Promise(resolve => {
    const param = {
      ...paramObj,
    }
    requestApi({
      url: '/public/workbench/module/moveElement',
      param,
    }).then((res: any) => {
      resolve(res.success)
    })
  })
}
// 获取点赞总数
export const queryAllThumbsUpNum = (param: any) => {
  return new Promise(resolve => {
    requestApi({
      url: '/public/thumbsUp/countUserAllThumbsUpNum',
      param,
    }).then((res: any) => {
      if (res.success) {
        resolve(res.data)
      } else {
        resolve(false)
      }
    })
  })
}

// 统计用户获赞数
export const getaddPraisedList = (param: any) => {
  return new Promise(resolve => {
    requestApi({
      url: 'public/thumbsUp/findUserThumbsUpPage',
      param,
    }).then((res: any) => {
      if (res.success) {
        resolve(res.data)
      } else {
        resolve(false)
      }
    })
  })
}

// 获赞未读

export const NoreadPariseList = (param: any) => {
  return new Promise(resolve => {
    requestApi({
      url: '/public/thumbsUp/countUserUnReadThumbsUp',
      param,
    }).then((res: any) => {
      if (res.success) {
        resolve(res.data)
      } else {
        resolve(false)
      }
    })
  })
}
// 设置已读状态

export const readPariseList = (param: any) => {
  return new Promise(resolve => {
    requestApi({
      url: '/public/thumbsUp/setThumbsUpReadState',
      param,
    }).then((res: any) => {
      if (res.success) {
        resolve(res.data)
      } else {
        resolve(false)
      }
    })
  })
}
