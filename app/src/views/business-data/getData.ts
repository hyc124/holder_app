/**台账接口集合 */

import { message } from 'antd'
import Axios from 'axios'
Axios.defaults.withCredentials = true

//查询业务数据企业列表
export const getBusinessOrgList = () => {
  return new Promise<any[]>((resolve, reject) => {
    const { nowUserId, nowAccount, loginToken } = $store.getState()
    const param = {
      userId: nowUserId,
      userAccount: nowAccount,
    }
    $api
      .request('/approval/findAuthorisedBusinessFormOrg', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        resolve(resData.dataList)
      })
      .catch(err => {
        reject(err)
      })
  })
}

//新增底表数据查询接口
export const relationSystem = (baseFormId: any) => {
  return new Promise<any[]>((resolve, reject) => {
    const { loginToken } = $store.getState()
    const param = {
      baseFormId: baseFormId,
    }
    $api
      .request('/approval/approval/baseForm/isRelationSystemBaseForm', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(() => {
        resolve()
      })
      .catch(err => {
        reject(err)
      })
  })
}
//查询底表数据详情
export const getFormDataDetails = (baseFormId: any) => {
  return new Promise<any[]>((resolve, reject) => {
    const { loginToken, nowUserId } = $store.getState()
    const param = {
      userId: nowUserId,
      baseFormDataId: baseFormId,
    }
    $api
      .request('/approval/approval/baseForm/findBaseFormDataDetails', param, {
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
//操作记录查询
export const getBaseFormLog = (baseFormId: any) => {
  return new Promise<any[]>((resolve, reject) => {
    const { loginToken, nowUserId } = $store.getState()
    const param = {
      userId: nowUserId,
      baseFormDataId: baseFormId,
    }
    $api
      .request('/approval/approval/baseForm/findBaseFormLog', param, {
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
//查询导入模板
export const findBaseFormDataTemplate = (baseFormId: any) => {
  return new Promise<any[]>((resolve, reject) => {
    const { loginToken } = $store.getState()
    const param = {
      baseFormId: baseFormId,
    }
    $api
      .request('/approval/findBaseFormDataTemplate', param, {
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
//确定新增底表数据
export const saveBaseFormData = (params: any) => {
  const { baseFormValueArr, businessTableId, teamId } = params
  const { nowUserId, nowUser, loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    const param = {
      baseFormElementValueModels: baseFormValueArr,
      baseFormId: businessTableId, //底表id
      type: 0, //0：新增 1:修改
      username: nowUser,
      userId: nowUserId,
    }
    $api
      .request('/approval/approval/baseForm/saveBaseFormData', param, {
        headers: {
          loginToken: loginToken,
          teamId,
          'Content-Type': 'application/json',
        },
      })
      .then(data => {
        resolve(data)
      })
      .catch(err => {
        reject(err)
      })
  })
}
//删除业务数据
export const deleteBaseFormData = (params: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/approval/approval/baseForm/deleteBaseFormData', params, {
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
//查询表单模板
export const getBusinessFormDetail = (baseFormId: any) => {
  return new Promise<any[]>((resolve, reject) => {
    const { loginToken, nowUserId } = $store.getState()
    const param = {
      baseFormId: baseFormId,
      userId: nowUserId,
    }
    $api
      .request('/approval/approval/baseForm/findBaseTemplate', param, {
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
//查询业务数据列表
export const getBusinessList = (orgId: number) => {
  return new Promise<any>((resolve, reject) => {
    const { nowUserId, nowAccount, loginToken } = $store.getState()
    const param = {
      orgId,
      pageNo: 0,
      pageSize: 20,
      userAccount: nowAccount,
      userId: nowUserId,
      keywords: '',
    }
    $api
      .request('/approval/findAuthorisedBusinessFormPage', param, {
        headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
      })
      .then(resData => {
        resolve(resData.data)
      })
      .catch(err => {
        reject(err)
      })
  })
}

//查询业务数据表格
export const getBusinessData = (
  baseFormId: string,
  pagination?: any,
  viewId?: number,
  dataScreenModel?: any
) => {
  return new Promise<any>((resolve, reject) => {
    const { nowUserId, nowAccount, loginToken, followUserInfo } = $store.getState()
    const param: any = {
      userAccount: nowAccount,
      userId: !followUserInfo.followStatus ? nowUserId : followUserInfo.userId,
      pageNo: pagination === 0 ? pagination : pagination.pageNo,
      pageSize: pagination === 0 ? 20 : pagination.pageSize,
      baseFormId,
    }
    if (viewId) {
      param.viewId = viewId
    }
    if (dataScreenModel && dataScreenModel.length > 0) {
      param.dataScreenModels = dataScreenModel
    }
    $api
      .request('/approval/approval/baseForm/findBaseFormStandingBook', param, {
        headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
      })
      .then(resData => {
        getBusinessBottomData(baseFormId, viewId, dataScreenModel).then(bottomData => {
          resData.data.bottomData = bottomData
          resolve(resData.data)
        })
      })
      .catch(err => {
        reject(err)
      })
  })
}
//查询业务数据底部数据
export const getBusinessBottomData = (baseFormId: string, viewId?: number, dataScreenModel?: any) => {
  return new Promise<any>((resolve, reject) => {
    const { nowUserId, nowAccount, loginToken } = $store.getState()
    const param: any = {
      userAccount: nowAccount,
      userId: nowUserId,
      pageNo: 0,
      pageSize: 20,
      baseFormId,
    }
    if (viewId) param.viewId = viewId
    // dataScreenModel ? (param.dataScreenModels = dataScreenModel) : ''
    if (dataScreenModel && dataScreenModel.length > 0) param.dataScreenModels = dataScreenModel
    $api
      .request('/approval/approval/baseForm/findBaseFormBottomData', param, {
        headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
      })
      .then(resData => {
        resolve(resData.data)
      })
      .catch(err => {
        reject(err)
      })
  })
}
//重新上传失败记录
export const uploadErrorData = (param: any) => {
  return new Promise<any>((resolve, reject) => {
    const { loginToken } = $store.getState()
    $api
      .request('/approval/againImportBaseFormData', param, {
        headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
      })
      .then(resData => {
        resolve(resData)
      })
      .catch(err => {
        reject(err)
      })
  })
}
//下载失败记录
export const downloadErrorLog = (param: any) => {
  return new Promise<any>((resolve, reject) => {
    const { loginToken } = $store.getState()
    $api
      .request('/approval/downloadErrorLog', param, {
        headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
      })
      .then(resData => {
        resolve(resData)
      })
      .catch(err => {
        reject(err)
      })
  })
}

// 查询台账
export const getTreeInfo = (keyword: string) => {
  const { loginToken, nowUserId, nowAccount } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request(
        '/approval/approval/baseForm/findCloudStandingBookOrdinalList',
        {
          userId: nowUserId,
          userAccount: nowAccount,
          keyword: keyword,
        },
        {
          headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
        }
      )
      .then(res => {
        resolve(res)
      })
      .catch(err => {
        reject(err)
      })
  })
}

// 查询统计报表
export const getStaticTreeList = (keywords: string) => {
  const { loginToken, nowUserId } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request(
        '/approval/reportStatistics/findUserCloudStandingBookOrgModel',
        {
          userId: nowUserId,
          keywords: keywords,
        },
        {
          headers: { loginToken },
          formData: true,
        }
      )
      .then(res => {
        if (res.returnCode === 0) {
          resolve(res.dataList)
        }
      })
      .catch(err => {
        reject(err)
      })
  })
}

//排序
export const dropSort = (params: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/approval/approval/baseForm/groupAndformSort', params, {
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
//查询底部数据和
export const getBottomValue = (baseFormId: number, type: string, uuid: string, dataScreenModel?: any) => {
  return new Promise<number>((resolve, reject) => {
    const { loginToken } = $store.getState()
    const param = {
      baseFormId,
      type,
      uuid,
      dataScreenModel,
    }
    $api
      .request('/approval/approval/baseForm/bottomDataCount', param, {
        headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
      })
      .then(resData => {
        resolve(resData.data)
      })
      .catch(err => {
        reject(err)
      })
  })
}

// 关注和取消关注
export const followStandingBook = (params: any) => {
  return new Promise<number>(resolve => {
    const { loginToken, nowUserId } = $store.getState()
    $api
      .request(
        '/approval/cloudStandingBookFollow/updateCloudStandingBookFollow',
        { ...params, userId: nowUserId },
        {
          headers: { loginToken },
          formData: true,
        }
      )
      .then(res => {
        if (res.returnCode === 0) {
          resolve()
          if (params.followType) {
            message.success('关注成功')
          }
        }
      })
      .catch(err => {
        message.error(err.returnMessage || (params.followType ? '关注失败' : '取消关注失败'))
      })
  })
}

// 查询报表详情
export const getReportFormDetails = (baseFormId: number) => {
  return new Promise<any>((resolve, reject) => {
    const { nowUserId, loginToken, followUserInfo } = $store.getState()
    const param: any = {
      userId: !followUserInfo.followStatus ? nowUserId : followUserInfo.userId,
      id: baseFormId,
    }
    $api
      .request('/approval/reportStatistics/findReportStatistics', param, {
        headers: { loginToken },
        formData: true,
      })
      .then(res => {
        if (res.returnCode === 0) {
          resolve(res.data)
        }
      })
      .catch(err => {
        reject(err)
      })
  })
}

export const clearCookie = (teamId: number) => {
  return new Promise<any>((resolve, reject) => {
    const { loginToken } = $store.getState()
    const param: any = {
      logKey: teamId,
      enterpriseName: 'goalgo',
    }
    $api
      .request('/approval/reportStatistics/metabaseLogout', param, {
        headers: { loginToken },
        formData: true,
      })
      .then(res => {
        if (res.returnCode === 0) {
          resolve(res.data)
        }
      })
      .catch(err => {
        reject(err)
      })
  })
}

//下载失败记录
export const downloadFailedRecord = (params: any) => {
  return new Promise<any>((resolve, reject) => {
    const { loginToken } = $store.getState()
    $api
      .request('/approval/downloadFailedRecord', params, {
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
