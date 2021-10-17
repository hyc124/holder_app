import { requestApi } from '@/src/common/js/ajax'
import { message } from 'antd'

//查询企业标签信息
export const getlabelList = (companyId: any, keyword: string) => {
  const { loginToken } = $store.getState()
  return new Promise(resolve => {
    const param = {
      typeId: companyId,
      keyword: keyword,
    }
    $api
      .request('/task/tag/findByTypeId', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        const showData = resData
        resolve(showData)
      })
      .catch(function(res) {
        message.error(res.returnMessage)
      })
  })
}

//添加修改标签
export const getAddtag = (paramObj: any) => {
  const { loginToken } = $store.getState()
  return new Promise(resolve => {
    const param = {
      typeId: paramObj.typeId,
      id: paramObj.id, //节点id cc
      rgb: paramObj.rgb,
      content: paramObj.content,
    }
    $api
      .request('/task/tag/add', param, {
        headers: {
          loginToken: loginToken,
          'Content-Type': 'application/json',
        },
      })
      .then(resData => {
        const showData = resData
        resolve(showData)
      })
      .catch(function(res) {
        message.error(res.returnMessage)
      })
  })
}

//删除标签
export const delTagApi = (id: number) => {
  const { loginToken } = $store.getState()
  return new Promise(resolve => {
    const param = {
      id: id, //节点id cc
    }
    $api
      .request('/task/tag/delete', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        const showData = resData
        resolve(showData)
      })
      .catch(function(res) {
        message.error(res.returnMessage)
      })
  })
}

//查询优先级
export const findPriorityApi = (param: any) => {
  const { loginToken } = $store.getState()
  return new Promise(resolve => {
    $api
      .request('/task/attach/findPriority', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        const showData = resData
        resolve(showData)
      })
      .catch(function(res) {
        message.error(res.returnMessage)
      })
  })
}

//查询企业列表信息
export const findAllCompanyApi = (param: any) => {
  const { loginToken } = $store.getState()
  return new Promise(resolve => {
    $api
      .request('/team/enterpriseInfo/findByTypeAndUser', param, {
        headers: {
          loginToken: loginToken,
          'Content-Type': 'application/json',
        },
      })
      .then(resData => {
        const showData = resData && resData.dataList ? resData.dataList : []
        resolve(showData)
      })
      .catch(function(res) {
        message.error(res.returnMessage)
      })
  })
}
//查询拥有规划企业列表信息
export const findWorkPlanTeam = (param: any) => {
  const { loginToken } = $store.getState()
  return new Promise(resolve => {
    $api
      .request('/team/enterpriseInfo/findWorkPlanTeam', param, {
        headers: {
          loginToken: loginToken,
          'Content-Type': 'application/json',
        },
      })
      .then(resData => {
        const showData = resData && resData?.dataList ? resData.dataList : []
        resolve(showData)
      })
      .catch(function(res) {
        message.error(res.returnMessage)
        resolve(res)
      })
  })
}

//查询开启okr查询企业列表信息
export const findEnableCompanyApi = () => {
  return new Promise(resolve => {
    const param = {
      userId: $store.getState().nowUserId,
    }
    requestApi({
      url: '/task/okr/findEnableTeam',
      param,
      apiType: 1,
    }).then((res: any) => {
      if (res.success) {
        resolve(res.data)
      } else {
        resolve(res.success)
      }
    })
  })
}

//查询主岗部门
export const mainDutyApi = (param: any) => {
  const { loginToken } = $store.getState()
  return new Promise(resolve => {
    $api
      .request('/team/enterpriseUser/findLeaderAndRoleByAccount', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        const showData = resData
        resolve(showData)
      })
      .catch(function(res) {
        message.error(res.returnMessage)
      })
  })
}
//创建子任务查询主岗及归属企业信息
export const findExtendsTeamApi = (param: any) => {
  const { loginToken } = $store.getState()
  return new Promise(resolve => {
    $api
      .request('/task/joinTeam/findExtendsTeam', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        const showData = resData
        resolve(showData)
      })
      .catch(function(res) {
        message.error(res.returnMessage)
      })
  })
}

//查询父级任务及关联OKR列表
export const findSupportApi = (param: any) => {
  const { loginToken } = $store.getState()
  return new Promise(resolve => {
    $api
      .request('/task/findCreateParent', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        const showData = resData
        resolve(showData)
      })
      .catch(function(res) {
        message.error(res.returnMessage)
      })
  })
}

//保存创建、编辑任务
export const saveCreatTask = (param: any, url: any) => {
  const { loginToken } = $store.getState()
  return new Promise(resolve => {
    $api
      .request(url, param, {
        headers: {
          loginToken: loginToken,
          'Content-Type': 'application/json',
        },
      })
      .then(resData => {
        const showData = resData
        resolve(showData)
      })
      .catch(function(res) {
        resolve(res)
      })
  })
}

//查询可以被@的人
export const queryTaskTypeUsersApi = (param: any) => {
  const { loginToken } = $store.getState()
  return new Promise(resolve => {
    $api
      .request('/task/queryTaskTypeUsers', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        const showData = resData
        resolve(showData)
      })
      .catch(function(res) {
        // message.error(res.returnMessage)
      })
  })
}

//查询工作时间
export const getWorkHoursApi = (param: any) => {
  const { loginToken } = $store.getState()
  return new Promise(resolve => {
    $api
      .request('/task/config/getWorkHours', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        const showData = resData
        resolve(showData)
      })
      .catch(function(res) {
        message.error(res.returnMessage)
      })
  })
}

//查询目标初始参数
export const createObjectInit = (param: any) => {
  const { loginToken } = $store.getState()
  return new Promise(resolve => {
    $api
      .request('/task/work/plan/okr/createInit', param, {
        headers: {
          loginToken: loginToken,
          'Content-Type': 'application/json',
        },
      })
      .then(resData => {
        const showData = resData
        resolve(showData)
      })
      .catch(function(res) {
        resolve(res)
        message.error(res.returnMessage)
      })
  })
}
//保存创建参数
export const createObjectSave = (param: any) => {
  const { loginToken } = $store.getState()
  return new Promise(resolve => {
    $api
      .request('/task/work/plan/okr/create', param, {
        headers: {
          loginToken: loginToken,
          teamId: param?.teamId,
          'Content-Type': 'application/json',
        },
      })
      .then(resData => {
        const showData = resData
        resolve(showData)
      })
      .catch(function(res) {
        resolve(res)
        message.error(res.returnMessage)
      })
  })
}
