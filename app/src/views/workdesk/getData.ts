import { findWorkDeskTask, insertWorkDeskTask, updateWorkDeskTask } from './workDeskLocal'
import { requestApi } from '@/src/common/js/ajax'
import { checkType } from '../myWorkDesk/myWorkDeskHeader'
const host = process.env.API_FILE_HOST
//根据企业id获取头像
export const getOrgProfileById = (id: number) => {
  const { orgInfo } = $store.getState()
  if (orgInfo.length !== 0) {
    const selectOrg = orgInfo.filter((item: { id: number }) => item.id === id)
    if (selectOrg.length !== 0 && selectOrg[0].logo != '') {
      return selectOrg[0].logo
    } else {
      return $tools.asAssetsPath('/images/common/company_default.png')
    }
  }
}

//接受企业邀请  4拒绝 0接受
export const acceptInvite = (param: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/team/invite/operation', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        resolve(resData)
      })
      .catch(err => {
        reject(err)
      })
  })
}
//接受企业邀请  4拒绝 0接受
export const okrListChange = (param: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/task/work/plan/krSort', param, {
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
//彩虹屁数据 设置已读状态
export const thumbRead = (param: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/public/thumbsUp/setThumbsUpReadState', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        resolve(resData)
      })
      .catch(err => {
        reject(err)
      })
  })
}
//查询模块数量
export const countHomeByUser = (param: any, isFollow?: boolean) => {
  const { loginToken, selectTeamId, followSelectTeadId } = $store.getState()
  const newOrgId = selectTeamId === -1 || isNaN(selectTeamId) ? '' : selectTeamId
  const followOrgId = followSelectTeadId === -1 ? '' : followSelectTeadId
  param.teamId = isFollow ? followOrgId : newOrgId
  return new Promise((resolve, reject) => {
    $api
      .request('/public/homeModule/countHomeByUser', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        resolve(resData)
      })
      .catch(err => {
        resolve(err)
      })
  })
}
//查询代办模块筛选统计数量
export const CountToDoCondition = (param: any, isFollow?: boolean) => {
  const { loginToken, selectTeamId, followSelectTeadId } = $store.getState()
  const newOrgId = selectTeamId === -1 || isNaN(selectTeamId) ? '' : selectTeamId
  const followOrgId = followSelectTeadId === -1 ? '' : followSelectTeadId
  param.teamId = isFollow ? followOrgId : newOrgId

  return new Promise((resolve, reject) => {
    $api
      .request('/public/synergy/countToDoCondition', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        resolve(resData)
      })
      .catch(err => {
        reject(err)
      })
  })
}

//查询企业列表
export const newQueryTeamList = (param: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/team/enterpriseInfo/newQueryTeamList', param, {
        headers: {
          loginToken: loginToken,
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
//查询用户信息
export const queryUserInfo = (param: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/team/user/find/account', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        resolve(resData)
      })
      .catch(err => {
        reject(err)
      })
  })
}
//查询工作台模块信息
export const findUserUsingTemplate = (param: any, headers: any) => {
  return new Promise((resolve, reject) => {
    $api
      .request('/public/homeModule/findUserUsingTemplate', param, {
        headers: headers,
        formData: true,
      })
      .then(resData => {
        resolve(resData)
      })
      .catch(err => {
        reject(err)
      })
  })
}

//查询工作台模块信息
export const customQuery = () => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request(
        '/team/dataCentre/clear',
        {
          teamId: $store.getState().selectTeamId,
          userId: $store.getState().nowUserId,
        },
        {
          headers: { loginToken: loginToken },
          formData: true,
        }
      )
      .then(resData => {
        resolve(resData)
      })
      .catch(err => {
        reject(err)
      })
  })
}
export const moveHomeModle = (param: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/public/homeModule/moveHomeModule', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        resolve(resData)
      })
      .catch(err => {
        reject(err)
      })
  })
}
//模块编辑器查询所有模块名称
export const getAllHomeElement = () => {
  const { loginToken, nowUserId } = $store.getState()
  return new Promise((resolve, reject) => {
    requestApi({
      url: '/public/homeModule/findAllHomeElement',
      param: { userId: nowUserId },
    })
      .then(res => {
        resolve(res.data.dataList)
      })
      .catch(err => {
        reject(err)
      })
  })
}
//查询当前账号工作台模板
export const getUserTemplateSet = (param: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/public/homeModule/findUserTemplateSet', param, {
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
//恢复默认
export const backDefaultSetting = (selectKey: string) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request(
        '/public/homeModule/findDefaultTemplate',
        {
          position: selectKey,
        },
        {
          headers: { loginToken: loginToken },
          formData: true,
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
//查询@我的
export const getRemindMeData = (pageNo: number, pageSize: number) => {
  const { nowUserId, selectTeamId, loginToken, followUserInfo } = $store.getState()
  return new Promise(resolve => {
    const param = {
      userId: !followUserInfo.followStatus ? nowUserId : followUserInfo.userId,
      type: 1,
      pageNo: pageNo || 0,
      pageSize: pageSize || 10,
      belongId: selectTeamId === -1 || isNaN(selectTeamId) ? '' : selectTeamId,
    }
    $api
      .request('/public/synergy/findUserWorkbenchSynergy', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        const showData = resData.data
        resolve(showData)
      })
  })
}

//查询待处理列表
export const getWaitHandle = (pageNo: number, pageSize: number) => {
  const { nowUserId, loginToken, selectTeamId, followUserInfo } = $store.getState()
  return new Promise(resolve => {
    const param = {
      userId: !followUserInfo.followStatus ? nowUserId : followUserInfo.userId,
      type: 2,
      pageNo: pageNo || 0,
      pageSize: pageSize || 10,
      belongId: selectTeamId === -1 || isNaN(selectTeamId) ? '' : selectTeamId,
    }
    $api
      .request('/public/synergy/findUserWorkbenchSynergy', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        const showData = resData.data.content || []
        resolve(showData)
      })
  })
}
//工作台标签拖动
export const moveHomeElement = (params: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/public/homeModule/moveHomeElement', params, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(res => {
        if (res.returnCode == 0) {
          resolve(res)
        } else {
          reject(res)
        }
      })
      .catch(err => reject(err))
  })
}
/**
 * 查询任务列表
 * @param params
 * @param isFollow
 * @param onlyFind 只查数据
 */
export const getWorkingTeamTask = (params: any, isFollow?: boolean, onlyFind?: boolean) => {
  const {
    nowUserId,
    nowAccount,
    selectTeamId,
    loginToken,
    followUserInfo,
    followSelectTeadId,
  } = $store.getState()
  const workTeamId = selectTeamId === -1 || isNaN(selectTeamId) ? '' : selectTeamId
  const followTeamId = followSelectTeadId === -1 ? '' : followSelectTeadId
  return new Promise(resolve => {
    const param = {
      pageNo: params.pageNo || 0,
      pageSize: params.pageSize || 10,
      account: !isFollow ? nowAccount : followUserInfo.account,
      loginUserId: nowUserId,
      status: params.status,
      startTime: params.startTime,
      endTime: params.endTime,
      keyword: params.keyword,
      property: params.property,
      level: 0,
      enterpriseId: !isFollow ? workTeamId : followTeamId,
      tagKeyword: params.tagKeyword,
      listType: params.listType,
      userId: !isFollow ? nowUserId : followUserInfo.userId, //2020/10/20 参数调整
    }
    // 先查询本地数据库，查出cacheTime传给后台再查询是否需要更新本地数据库
    const localParam: any = {
      pageNo: params.pageNo || 0,
      pageSize: params.pageSize || 10,
      loginUserId: !isFollow ? nowUserId : followUserInfo.userId,
      enterpriseId: !isFollow ? workTeamId : followTeamId,
      listType: params.listType,
    }
    let cacheTime = 0
    const header: any = { loginToken: loginToken, 'Content-Type': 'application/json' }
    findWorkDeskTask(localParam).then((localRes: any) => {
      if (localRes) {
        cacheTime = localRes.cacheTime
      }
      if (cacheTime) {
        header.cacheTime = cacheTime
      }
      $api
        .request('/task/workbench', param, {
          headers: header,
        })
        .then(resData => {
          const showData = resData.data
          let getData: any = showData || {}
          // 1941:无需更新，直接查询本地数据库
          if (resData.returnCode == 1941) {
            getData = JSON.parse(localRes.data)
          }
          if (onlyFind) {
            resolve({ dataList: getData.content || [] })
            return
          }
          resolve(getData)
          if (resData.returnCode != 1941) {
            // obj为true代表筛选条件查询，则不更新到本地数据库
            if (resData.obj) {
              return
            }
            localParam.data = showData
            if (localRes == undefined) {
              insertWorkDeskTask(localParam)
            } else {
              updateWorkDeskTask(localParam)
            }
          }
        })
    })
  })
}

//查询目标任务
export const getWorkBenchList = (
  pageNo: number,
  pageSize: number,
  ascriptionId?: number,
  ascriptionType?: number
) => {
  // export const getWorkBenchList = (pageNo: number, pageSize: number) => {
  const { nowUserId, selectTeamId, loginToken, followUserInfo } = $store.getState()
  return new Promise(resolve => {
    const param = {
      teamId: selectTeamId === -1 || isNaN(selectTeamId) ? '' : selectTeamId,
      ascriptionId: !ascriptionId ? nowUserId : ascriptionId,
      ascriptionType: !ascriptionId ? 0 : ascriptionType,
      operateUser: nowUserId,
      pageNo: pageNo || 0,
      pageSize: pageSize || 10,
      userId: !followUserInfo.followStatus ? nowUserId : followUserInfo.userId,
      // type: type,
    }
    $api
      .request('/task/work/plan/workbenchList', param, {
        headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
      })
      .then(resData => {
        const showData = resData.data
        resolve(showData)
      })
  })
}

//查询检查项任务
export const getCheckTask = (params: any) => {
  const { nowUserId, selectTeamId, loginToken, followUserInfo } = $store.getState()
  return new Promise(resolve => {
    const param = {
      pageNo: params.pageNo || 0,
      pageSize: params.pageSize || 10,
      teamId: selectTeamId === -1 || isNaN(selectTeamId) ? '' : selectTeamId,
      userId: !followUserInfo.followStatus ? nowUserId : followUserInfo.userId,
    }
    $api
      .request('/task/check/workbenchList', param, {
        headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
      })
      .then(resData => {
        const showData = resData.data
        resolve(showData)
      })
  })
}

//查询待收汇报
export const getReceiveReport = (pageNo: number, pageSize: number) => {
  const { nowUserId, selectTeamId, loginToken, followUserInfo } = $store.getState()
  return new Promise(resolve => {
    const param = {
      pageNo: pageNo || 0,
      pageSize: pageSize || 10,
      teamId: selectTeamId === -1 || isNaN(selectTeamId) ? '' : selectTeamId,
      userId: !followUserInfo.followStatus ? nowUserId : followUserInfo.userId,
    }
    $api
      .request('/task/force/report/queryReceive', param, {
        headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
      })
      .then(resData => {
        const showData = resData.data
        resolve(showData)
      })
  })
}

//查询台账
export const queryReportTableListFunc = (pageNo: number, pageSize: number) => {
  const { nowUserId, selectTeamId, loginToken, nowAccount, followUserInfo } = $store.getState()
  return new Promise(resolve => {
    const param = {
      orgId: selectTeamId === -1 || isNaN(selectTeamId) ? '' : selectTeamId,
      pageNo: pageNo || 0,
      pageSize: pageSize || 50,
      userAccount: !followUserInfo.followStatus ? nowAccount : followUserInfo.account,
      userId: !followUserInfo.followStatus ? nowUserId : followUserInfo.userId,
      keywords: '',
    }
    $api
      .request('/approval/findAuthorisedBusinessFormPage', param, {
        headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
      })
      .then(resData => {
        const dataList = resData.data
        resolve(dataList)
      })
  })
}

// 按企业查询关注的台账和报表
export const queryFollowReport = (orgId: string | number) => {
  const { nowUserId, loginToken, followUserInfo } = $store.getState()
  return new Promise(resolve => {
    const param = {
      orgId: orgId,
      userId: !followUserInfo.followStatus ? nowUserId : followUserInfo.userId,
    }
    $api
      .request('/approval/cloudStandingBookFollow/workbenchFollowCloudStandingBook', param, {
        headers: { loginToken },
        formData: true,
      })
      .then(res => {
        if (res.returnCode === 0) {
          resolve(res.dataList)
        }
      })
  })
}

//-------------------------工作台右侧接口查询START-------------------------------------------------------------

//查询评论是否存在
export const findCommentIsExist = (commentId: number) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    const parms = { commentId }
    $api
      .request('/public/comment/commentIsExist', parms, {
        headers: {
          loginToken: loginToken,
        },
        formData: true,
      })
      .then(data => {
        if (data.returnCode == 0) {
          resolve(data.data)
        } else {
          reject()
        }
      })
      .catch(() => {
        reject()
      })
  })
}
//添加@我的评论回复
export const commentToAtMe = (param: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/public/comment/workbenchCommentAtMeInfo', param, {
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
//查询快速评论内容
export const quickComment = (param: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/public/synergy/findQuickCommentContent', param, {
        headers: {
          loginToken: loginToken,
        },
        formData: true,
      })
      .then(data => {
        resolve(data)
      })
      .catch(e => {
        reject(e)
      })
  })
}

//聊天@快捷回复已知晓
export const dealHandle = (param: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('im-consumer/dealHandle', param, {
        headers: {
          loginToken: loginToken,
        },
        formData: true,
      })
      .then(data => {
        resolve(data)
      })
      .catch(e => {
        reject(e)
      })
  })
}

//查询个人获赞数据
export const getThumbsData = (pageNo: number, pageSize: number, isFollow?: boolean) => {
  const { nowUserId, selectTeamId, loginToken, followUserInfo, followSelectTeadId } = $store.getState()
  const newOrgId = selectTeamId === -1 || isNaN(selectTeamId) ? '' : selectTeamId
  const followOrgId = followSelectTeadId === -1 ? '' : followSelectTeadId
  return new Promise(resolve => {
    const params = {
      userId: !isFollow ? nowUserId : followUserInfo.userId,
      belongId: isFollow ? followOrgId : newOrgId,
      pageNo: pageNo,
      pageSize: pageSize,
    }
    $api
      .request('/public/thumbsUp/findUserThumbsUpPage', params, {
        headers: {
          loginToken: loginToken,
        },
        formData: true,
      })
      .then(res => {
        resolve(res)
      })
      .catch(e => {})
  })
}

//查询个人统计信息
export const queryUsercalculation = (isFollow?: boolean) => {
  const { nowUserId, selectTeamId, loginToken, followUserInfo, followSelectTeadId } = $store.getState()
  const newOrgId = selectTeamId === -1 || isNaN(selectTeamId) ? '' : selectTeamId
  const followOrgId = followSelectTeadId === -1 ? '' : followSelectTeadId
  return new Promise((resolve, reject) => {
    const params = {
      userId: !isFollow ? nowUserId : followUserInfo.userId,
      teamId: isFollow ? followOrgId : newOrgId,
    }
    $api
      .request('/public/homeModule/countPersonalInformation', params, {
        headers: {
          loginToken: loginToken,
        },
        formData: true,
      })
      .then(res => {
        resolve(res.data)
      })
      .catch(e => {
        reject(e)
      })
  })
}
//查询用户今日彩虹屁
export const queryCondolences = (temId: any, isFollow?: boolean) => {
  const { nowUserId, selectTeamId, loginToken } = $store.getState()
  let _selectTeamId: any = null
  if (temId) {
    _selectTeamId = temId
  } else {
    _selectTeamId = selectTeamId == -1 || isNaN(selectTeamId) ? '' : selectTeamId
  }

  return new Promise(resolve => {
    $api
      .request(
        '/team/rainbowFart/findUserRainBowFart',
        {
          userId: nowUserId,
          teamId: _selectTeamId,
        },
        {
          headers: {
            loginToken: loginToken,
          },
          formData: true,
        }
      )
      .then(res => {
        resolve(res.data)
      })
      .catch(e => {})
  })
}
//查询关注人
export const queryFollowData = (fType: number, isFollow?: boolean) => {
  const {
    nowUserId,
    nowAccount,
    loginToken,
    followUserInfo,
    followSelectTeadId,
    selectTeamId,
  } = $store.getState()
  // const headerId = $('.workdesk-header').attr('data-orgId') || '-1'
  const headerId: any = $('.workdesk-header').attr('data-orgId') || selectTeamId || '-1'
  let newOrgId: any = ''
  if (isFollow) {
    newOrgId = selectTeamId == -1 ? '' : selectTeamId
  } else {
    newOrgId = headerId == '-1' ? '' : parseInt(headerId)
  }
  let followOrgId = followSelectTeadId === -1 ? '' : followSelectTeadId
  if (followOrgId == '') {
    followOrgId = newOrgId
  }
  return new Promise((resolve, reject) => {
    const queryParms = {
      userId: !isFollow ? nowUserId : followUserInfo.userId,
      belong: 'org',
      belongId: isFollow ? followOrgId : newOrgId,
      followType: 'user',
      account: isFollow ? followUserInfo.account : nowAccount,
      type: fType,
    }
    $api
      .request('/task/follow/findFollowUserList', queryParms, {
        headers: {
          loginToken: loginToken,
        },
        formData: true,
      })
      .then(res => {
        if (res.returnCode == 0) {
          resolve(res.dataList || [])
        } else {
          reject(res)
        }
      })
  })
}
//取消关注授权
export const cancelFollowAuth = (param: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/task/follow/deleteFollowUser', param, {
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
//失效的禅道数据
export const deleteSystemNotification = (params: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/public/notification/deleteSystemNotification', params, {
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

//待处理邀请类同意拒绝操作
export const agreeRefuse = (params: any) => {
  const { id, result } = params
  const { loginToken, nowUserId, followUserInfo } = $store.getState()
  const param = {
    id: id,
    result: result,
    userId: !followUserInfo.followStatus ? nowUserId : followUserInfo.userId,
  }
  return new Promise((resolve, reject) => {
    $api
      .request('/team/invite/operation', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(data => {
        if (data.returnCode == 0) {
          resolve(data)
        } else {
          reject(data)
        }
      })
      .catch(err => {
        reject(err)
      })
  })
}
//被删除和撤回的消息点击后自动已读
export const ReadCancelMsg = (_msgId: number) => {
  const { loginToken, nowUserId, followUserInfo } = $store.getState()
  const sendParam = {
    id: _msgId,
    userId: !followUserInfo.followStatus ? nowUserId : followUserInfo.userId,
  }
  return new Promise((resolve, reject) => {
    $api
      .request('/public/synergy/updateNoticeReadAndDispose', sendParam, {
        headers: { loginToken: loginToken },
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
//请求标记为已读
export const SetReadMsg = (_msgId: number) => {
  const { loginToken, nowUserId, followUserInfo } = $store.getState()
  const sendParam = {
    id: _msgId,
    userId: !followUserInfo.followStatus ? nowUserId : followUserInfo.userId,
  }
  return new Promise((resolve, reject) => {
    $api
      .request('/public/synergy/signReadByIdAndUserId', sendParam, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(res => {
        resolve(res)
      })
  })
}

//查询会议详情v
export const queryMeetInfo = (noticeTypeId: number) => {
  const { nowUserId, loginToken, followUserInfo } = $store.getState()
  const param = {
    type: 2, //收到的会议详情
    userId: !followUserInfo.followStatus ? nowUserId : followUserInfo.userId,
    meetingId: noticeTypeId,
  }
  return new Promise((resolve, reject) => {
    $api
      .request('/public/meeting/info', param, {
        headers: { loginToken: loginToken },
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
//待办任务会议请假参加
export const handelMeetStatus = (meetIdRefer: number, type: number, val: string) => {
  const { nowUserId, loginToken, followUserInfo } = $store.getState()
  const param = {
    meetingId: meetIdRefer,
    userId: !followUserInfo.followStatus ? nowUserId : followUserInfo.userId,
    joinStatus: type,
    notes: val,
  }
  return new Promise((resolve, reject) => {
    $api
      .request('/public/meeting/attend', param, {
        headers: { loginToken: loginToken },
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
//参加会议
export const addRemind = (params: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/public/scheduleRemind/addRemind', params, {
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
//保存工作台模板配置
export const saveModuleTypeAndList = (params: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/public/homeModule/saveUserTemplate', params, {
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
//获取工作台标签配置
export const getModuleTagSetting = (params: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/public/home/specificConfig', params, {
        headers: { loginToken: loginToken },
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

//保存工作台标签配置
export const saveModuleTagSetting = (params: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/public/home/save/userItemConfig', params, {
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
//工作台标签配置初始化
export const initModuleTagSetting = (params: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/public/home/query/userItemConfig', params, {
        headers: { loginToken: loginToken },
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

// followUser
//查询关注人权限列表
export const getAuthUserIds = (params: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/team/enterpriseFollowerAuth/getAuthUserIds', params, {
        headers: { loginToken: loginToken },
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
//
export const batchFollow = (params: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/task/follow/batchFollow', params, {
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
//工作台列表右侧按钮
//任务取消关注
export const cancleTaskFollow = (params: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/task/follow/unfollow', params, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(res => {
        resolve(res)
        if (res.returnCode == 0) {
          resolve(res)
        } else {
          reject(res.returnMessage)
        }
      })
      .catch(err => {
        reject('取消关注失败！')
      })
  })
}
//关注任务
export const taskFollow = (params: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/task/follow/following', params, {
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
        reject('关注失败！')
      })
  })
}

// 申请关注工作台
export const deskFollow = (params: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/task/follow/updateFollowRequestDispose', params, {
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
        reject(err)
      })
  })
}
//-------------------------工作台右侧接口查询OVER-------------------------------------------------------------
//删除模块
export const removeModule = (params: any) => {
  const { nowUserId, loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/public/homeModule/deleteHomeModule', params, {
        headers: { loginToken: loginToken },
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

//工作台改变任务进度
export const editTaskProgress = (params: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/task/log/addTaskLog', params, {
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
// 返回指定任务的详情
export const findOneTaskDetail = (params: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/task/workbench/find', params, {
        headers: { loginToken: loginToken },
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
// 目標任務返回指定任务的详情
export const findOneTargetTaskDetail = (params: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/task/work/plan/workbench/find', params, {
        headers: { loginToken: loginToken },
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
//归档任务-统计信息
export const queryStatistics = (params: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/task/archiveMember/queryArchiveTaskCountByDeptUser', params, {
        headers: { loginToken: loginToken },
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
//归档任务-列表信息
export const queryArchiveTaskListByDeptUser = (params: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/task/archiveMember/queryArchiveTaskListByDeptUser', params, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(res => {
        resolve(res)
      })
  })
}
//归档任务-撤回
export const recall = (params: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/task/taskOnFile/recall', params, {
        headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
      })
      .then(
        res => {
          if (res.returnCode == 0) {
            resolve(res)
          } else {
            reject(res)
          }
        },
        err => {
          reject(err)
        }
      )
  })
}
//下属任务
/**
 * 得到查询树结构attachId
 * teamId:团队id
 * account:当前登录账号
 */
export const queryAttach = (params: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/team/teamUserInfo/findUserAttach', params, {
        headers: { loginToken: loginToken },
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
/**
 * 统计用户下级数量
 * belongId:归属id
 * userAttachId:用户附加表id
 * level:统计层数
 */
export const queryCountSubordinate = (params: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/team/enterpriseUser/countUserSubordinate', params, {
        headers: { loginToken: loginToken },
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
/**
 * 查询上下级关系
 * typeId:归属id
 * type:归属类型 团队传1 企业传2
 * attachId:人员id
 */
export const queryEnterprise = (params: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/team/enterpriseUser/findEnterpriseRelation', params, {
        headers: { loginToken: loginToken },
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
//部分任务TAB筛选条件单独请求

export const queryWorkDeskTask = (params: {
  status: number[]
  startTime: string
  endTime: string
  keyword: string
  tagKeyword: string
  property: number
  listType: number
  pageNo?: number
  pageSize?: number
}) => {
  const { nowUserId, nowAccount, selectTeamId, loginToken, followUserInfo } = $store.getState()
  return new Promise(resolve => {
    const param = {
      pageNo: params.pageNo || 0,
      pageSize: params.pageSize || 10,
      account: !followUserInfo.followStatus ? nowAccount : followUserInfo.account,
      loginUserId: !followUserInfo.followStatus ? nowUserId : followUserInfo.userId,
      status: params.status,
      startTime: params.startTime,
      endTime: params.endTime,
      keyword: params.keyword,
      level: 0,
      property: params.property, //1私密任务
      enterpriseId: selectTeamId === -1 || isNaN(selectTeamId) ? '' : selectTeamId,
      tagKeyword: params.tagKeyword,
      listType: params.listType,
    }
    $api
      .request('/task/workbench', param, {
        headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
      })
      .then(resData => {
        const showData = resData.data
        resolve(showData)
      })
  })
}

// 查询状态
export const getSystemState = (params: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/public/notification/findSystemNotificationState', params, {
        headers: { loginToken: loginToken },
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

//查询导入
export const findImportType = (params: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/task/import/findImportType', params, {
        headers: { loginToken: loginToken },
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
// 导入任务
export const importTaskRequest = (params: any) => {
  const { loginToken } = $store.getState()
  return new Promise(resolve => {
    $api
      .request('/task/import/save', params, {
        headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
      })
      .then(resData => {
        resolve(resData)
      })
  })
}
//查询是否显示私密任务按钮
export const queryShowPrivatebtn = (listType: number, userId?: any) => {
  const { nowUserId, nowAccount, selectTeamId, loginToken } = $store.getState()
  const ascriptionId = selectTeamId == -1 ? '' : selectTeamId
  const params = {
    id: selectTeamId == -1 ? '' : selectTeamId,
    ascriptionType: 2,
    enterpriseId: ascriptionId,
    userId: userId ? userId : nowUserId,
    loginUserId: nowUserId,
    account: nowAccount,
    listType: listType,
    level: 0,
  }
  return new Promise(resolve => {
    $api
      .request('/task/findListCondition', params, {
        headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
      })
      .then(resData => {
        resolve(resData)
      })
  })
}

// 业务数据（查看回写明细）
export const businessWhiteBack = (params: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/approval/approval/baseForm/findBackWaitStandingBook', params, {
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

//查询工作台右侧待办任务列表
export const queryWaitTaskList = (params: any, listPageNo: number, isFollow: any) => {
  const { loginToken, nowUserId, selectTeamId, followSelectTeadId, followUserInfo } = $store.getState()
  const { navActive, dateFormat } = params
  const newOrgId = selectTeamId === -1 || isNaN(selectTeamId) ? '' : selectTeamId
  const followOrgId = followSelectTeadId === -1 ? '' : followSelectTeadId
  return new Promise((resolve, reject) => {
    const queryParam = {
      userId: !isFollow ? nowUserId : followUserInfo.userId,
      types: navActive,
      pageNo: listPageNo,
      pageSize: 10,
      belongId: isFollow ? followOrgId : newOrgId,
      date: dateFormat,
    }
    $api
      .request('/public/synergy/findUserWorkbenchSynergy', queryParam, {
        headers: {
          loginToken: loginToken,
          'Content-Type': 'application/json',
        },
      })
      .then(res => {
        resolve(res.data)
      })
      .catch(err => {
        reject(err)
      })
  })
}

// 微信授权请求
export const weChatLogin = () => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request(
        '/team/weChatLogin/weChatLogin',
        {},
        {
          headers: { loginToken: loginToken },
          formData: true,
        }
      )
      .then(resData => {
        resolve(resData)
      })
      .catch(err => {
        reject(err)
      })
  })
}
// 微信扫码检测
export const weChatScanState = (params: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/team/weChatLogin/getWeChatLoginInfo', params, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        resolve(resData)
      })
      .catch(err => {
        reject(err)
      })
  })
}

// 微信校验绑定
export const bindWeChat = (params: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/team/weChatLogin/bindWeChat', params, {
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

// 微信解绑
export const removeWeChatBind = (params: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/team/weChatLogin/removeWeChatBind', params, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        resolve(resData)
      })
      .catch(err => {
        reject(err)
      })
  })
}

// 查询用户注册信息
export const findRegisterUser = (params: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/team/register/findRegisterUser', params, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        resolve(resData)
      })
      .catch(err => {
        reject(err)
      })
  })
}

// 检测电话或邮箱是否正确，正确发送验证码
export const registerfind = (params: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/team/register/find', params, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        resolve(resData)
      })
      .catch(err => {
        reject(err)
      })
  })
}

// 重置密码
export const registerReset = (params: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/team/register/reset', params, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        resolve(resData)
      })
      .catch(err => {
        reject(err)
      })
  })
}

// 查询自定义表单流程设计配置
export const addCustomApprovalGetConfig = (params: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/approval/approval/event/addCustomApprovalGetConfig', params, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        resolve(resData)
      })
      .catch(err => {
        reject(err)
      })
  })
}

// 查询审批打印记录
export const findApprovalPrintLog = (params: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/approval/approval/findApprovalPrintLog', params, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        resolve(resData)
      })
      .catch(err => {
        reject(err)
      })
  })
}

// 添加审批打印记录
export const addApprovalPrintLog = (params: any) => {
  const { loginToken } = $store.getState()
  return new Promise((resolve, reject) => {
    $api
      .request('/approval/approval/addApprovalPrintLog', params, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        resolve(resData)
      })
      .catch(err => {
        reject(err)
      })
  })
}
const exceedNum = (num: any) => {
  if (num.count > 99) {
    return '99+'
  }
  return num.count
}
//查询工作台tab统计
export const refreshDeskNums = ({ userId, isFollow }: any) => {
  const { nowUserId } = $store.getState()
  countHomeByUser(
    {
      userId: userId ? userId : nowUserId,
    },
    isFollow
  ).then((data: any) => {
    const list = data.dataList || []
    const domList = $('#workDeskModuleContent').find('.module_tab_item .tab_num')
    domList?.each((_: number, dom: any) => {
      const code = $(dom)
        .parents('.module_tab_item')
        .attr('data-code')
      const findItem = list.find((item: any) => item.code == code)
      if (findItem) {
        // const dom = code == 'my_okr' ? $('.okr_num') : $(`.${code}_num`)
        const num = exceedNum(findItem)
        if (findItem.count > 0) {
          $(dom).removeClass('forcedHide')
        }
        $(dom).text(`(${num})`)
      } else {
        $(dom)
          .addClass('forcedHide')
          .text(`(0)`)
      }
    })
  })
}

//刷新标签事件
export const queryDeskTabs = ({ isFollow }: any) => {
  return new Promise(resolve => {
    const { nowUserId, followUserInfo } = $store.getState()

    let isFollowUser: any = isFollow ? 'true' : 'false'
    if ($('.workdesk-container')) {
      isFollowUser = $('.workdesk-container').attr('data-follow')
    }

    //最近一次选择的企业企业信息
    countHomeByUser(
      {
        userId: isFollowUser != 'true' ? nowUserId : followUserInfo.userId,
      },
      isFollow
    ).then((data: any) => {
      const list = data.dataList || []
      // 保存当前企业下tab统计数据
      $store.dispatch({
        type: 'SET_DESKTABCOUNT',
        data: list,
      })
      resolve(list)
    })
  })
}

//确定选择责任人
export const sureSelectInPerson = (param: any) => {
  const { loginToken } = $store.getState()
  console.log(param)
  return new Promise((resolve, reject) => {
    $api
      .request('/approval/defineUserApproval', param, {
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

//获取附件专属token
//isChart 是否从聊天室获取token
export const getFileToken = (params: any) => {
  const param: any = {
    companyId: params.companyId,
    userId: params.userId,
  }
  if (params.hasOwnProperty('otherFile')) {
    param.otherFile = params.otherFile
    param.companyId = $store.getState().nowAccount
  }
  return new Promise((resolve, reject) => {
    $.ajax({
      type: 'POST',
      url: `${host}/Authentication/GetToken`,
      timeout: 3000,
      crossDomain: true,
      async: false,
      data: param,
      success: (result: any) => {
        if (result.code == 1 && result.data !== null) {
          resolve(result.data.token)
        }
      },
      error: err => {
        reject(err)
      },
    })
  })
}
//查询最新的附件列表
export const queryFileList = (params: any) => {
  return new Promise((resolve, reject) => {
    getFileToken(params)
      .then((token: any) => {
        $.ajax({
          type: 'GET',
          url: `${host}/api/File/GetFileListByGoalgo`,
          cache: false,
          async: false,
          data: params,
          beforeSend: XMLHttpRequest => {
            XMLHttpRequest.setRequestHeader('Token', token)
          },
          success: (data: any) => {
            resolve(data)
          },
          error: err => {
            reject(err)
          },
        })
      })
      .catch(() => {
        reject('加载失败..')
      })
  })
}

export const handelFileData = (params: any) => {
  return new Promise((resolve, reject) => {
    getFileToken(params).then((token: any) => {
      $.ajax({
        type: 'POST',
        url: `${host}/api/File/GetByFileGUID_Goalgo`,
        cache: false,
        async: false,
        contentType: 'application/json;charset=UTF-8',
        data: JSON.stringify(params),
        beforeSend: XMLHttpRequest => {
          XMLHttpRequest.setRequestHeader('Token', token)
        },
        success: (data: any) => {
          resolve(data)
        },
        error: err => {
          reject(err)
        },
      })
    })
  })
}

//删除附件
export const deleteByguid = (params: any) => {
  return new Promise((resolve, reject) => {
    getFileToken(params).then((token: any) => {
      $.ajax({
        type: 'GET',
        url: `${host}/api/File/DeleteByGUID`,
        cache: false,
        async: false,
        data: {
          fileGUID: params.fileGuid,
        },
        beforeSend: XMLHttpRequest => {
          XMLHttpRequest.setRequestHeader('Token', token)
        },
        success: (data: any) => {
          resolve(data)
        },
        error: err => {
          reject(err)
        },
      })
    })
  })
}
//待办项移除任务
export const removeTaskWaitApi = ({ noticeId }: { noticeId: number }) => {
  return new Promise(resolve => {
    const param = {
      noticeId,
      // operateUser: $store.getState().nowUserId,
    }
    requestApi({
      url: '/public/synergy/task/moveOut',
      param: param,
      json: false,
    }).then((res: any) => {
      if (res.success) {
        resolve(res.data)
      }
    })
  })
}
// 待办项任务处理已知晓
export const isKnowTaskWaitApi = ({ noticeId }: { noticeId: number }) => {
  return new Promise(resolve => {
    const param = {
      noticeId,
      userId: $store.getState().nowUserId,
    }
    requestApi({
      url: '/public/synergy/task/knowNotice',
      param: param,
      json: false,
    }).then((res: any) => {
      if (res.success) {
        resolve(res.data)
      }
    })
  })
}
//查询工作台入口模块未读数量
export const queryModalReadNum = (typeName?: string, msg?: string) => {
  // console.log(msg)
  const { nowUserId, loginToken } = $store.getState()
  const $params: any = {
    userId: nowUserId,
  }
  // if (!!typeName && checkType(typeName)) {
  //   $params.type = typeName
  // }
  return new Promise((resolve, reject) => {
    $api
      .request('im-biz/chatRoom/message/unReadCount', $params, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(data => {
        if (data.returnCode == 0) {
          resolve(data)
        } else {
          reject(data)
        }
      })
      .catch(err => {
        reject(err)
      })
  })
}

// 打开关闭聊天室
export const openWindow = (mucId: number, callback?: () => void) => {
  const { nowAccount, loginToken } = $store.getState()
  return new Promise(resolve => {
    $api
      .request(
        '/im-consumer/mucRelation/windowState',
        { id: mucId, state: 0, userAccount: nowAccount },
        {
          headers: { loginToken },
          formData: true,
        }
      )
      .then(res => {
        resolve(res.data)
        callback && callback()
      })
  })
}
