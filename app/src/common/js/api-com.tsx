import { message } from 'antd'
import { requestApi } from '../../common/js/ajax'

interface ShareToRoomParam {
  selRoomList: Array<RoomItem> //选中群数据数组
  shareObj: any
  successMsg?: string
  setLoadState?: any
}
interface SendToRoomParam {
  messageModel: string //群消息信息
  successMsg?: string
  setLoadState?: any
}
interface RoomItem {
  belongOrg: string
  belongType: string
  belongTypeId: string
  id: string
  muc: string
  subject: string
  talkType: number
  toPerson: Array<string>
  icon?: string
  type?: string
}
//获取右键权限111
export const getTaskBtnApi = (param: any) => {
  const { loginToken } = $store.getState()
  let showData: any = ''
  // async function ajax() {
  return new Promise(resolve => {
    $api
      .request('/task/findOperationBtn', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        showData = resData
        resolve(showData)
      })
      .catch(function(res) {
        resolve(res)
      })
  })
  // return showData
  // }
  // return ajax()
}
/**
 * 发送消息到群之前的处理
 */
export const shareToRoom = (paramObj: ShareToRoomParam) => {
  return new Promise(resolve => {
    const messageModel: any = []
    // 遍历选中的群
    paramObj.selRoomList.map((item: RoomItem) => {
      const msgJson = {
        type: 2,
        subType: 8,
        from: $store.getState().nowUser,
        fromId: $store.getState().nowUserId,
        fromAccount: $store.getState().nowAccount,
        roomName: item.subject,
        roomJid: item.muc,
        roomId: item.id,
        roomType: item.talkType,
        message: '',
        time: new Date().getTime(),
        ascriptionId: item.belongTypeId,
        ascriptionType: item.belongType,
        ascriptionName: item.belongOrg,
        quoteMsg: paramObj.shareObj,
        profile: $store.getState().nowAvatar,
      }
      messageModel.push({
        content: JSON.stringify(msgJson),
        roomJid: item.muc,
      })
    })
    // 发送消息到群
    sendToRoom({
      messageModel: messageModel,
      successMsg: paramObj.successMsg ? paramObj.successMsg : '',
      setLoadState: paramObj.setLoadState,
    }).then((res: any) => {
      if (res) {
        resolve(true)
      }
    })
  })
}
/**
 * 发送消息到群
 */
export const sendToRoom = (paramObj: SendToRoomParam) => {
  return new Promise(resolve => {
    const param = {
      mucMessageModels: paramObj.messageModel,
      userAccount: $store.getState().nowAccount,
    }
    requestApi({
      url: '/im-consumer/muc/sendMessageToMuc',
      param: param,
      successMsg: paramObj.successMsg ? paramObj.successMsg : '发送成功',
      json: true,
      setLoadState: paramObj.setLoadState,
    }).then((res: any) => {
      if (res.success) {
        resolve(true)
      }
    })
  })
}

/**
 * 获取企业权限
 * type：查询权限类型
 * typeId:查询权限id
 * customAuthList：自定义查询权限，存入自定义数组customAuthList中，不保存到全局权限store集合中
 * isOnlyGetAuth: 仅获取权限列表
 */
export const findAuthList = (paramObj: {
  typeId: any
  type?: number
  customAuthList?: any
  isOnlyGetAuth?: boolean
}) => {
  return new Promise((resolve: any) => {
    const { followUserInfo, nowUserId } = $store.getState()
    const param = {
      // system: 'oa',
      // account: followUserInfo?.followStatus ? followUserInfo?.account : nowAccount,
      userId: followUserInfo?.followStatus ? followUserInfo?.userId : nowUserId,
      // type: paramObj.type ? paramObj.type : 2,
      belongId: paramObj.typeId || 0,
    }
    requestApi({
      url: '/team/permission/getUserPermission',
      param: param,
    })
      .then(res => {
        if (res.success) {
          const dataList = res.data.dataList || []
          // 保存权限列表
          if (paramObj.customAuthList) {
            paramObj.customAuthList = dataList
          }
          if (!paramObj?.isOnlyGetAuth) {
            // 更新全局权限列表
            $store.dispatch({ type: 'AUTHLIST', data: dataList })
          }
          resolve(dataList)
        } else {
          resolve(false)
        }
      })
      .catch(() => {
        resolve(false)
      })
  })
}

/**
 * 查询某个接口是否有权限
 * authList:自定义查询权限时，传入的权限列表数据
 */
export const getAuthStatus = (api: string, sefAuthList?: any) => {
  const authList = sefAuthList ? sefAuthList : $store.getState().authList
  if (authList.includes(api)) {
    return true
  } else {
    return false
  }
}

/**
 * 查询服务状态
 * type：查询权限类型
 */
export const queryServeState = (paramObj: { typeId: any }) => {
  return new Promise((resolve: any) => {
    const { nowAccount } = $store.getState()
    const param = {
      system: 'oa',
      account: nowAccount,
      typeId: paramObj.typeId,
    }
    requestApi({
      url: '/authority/queryServeState',
      param: param,
    })
      .then(res => {
        if (res.success) {
          resolve({ state: res.data || false })
        } else {
          message.warning(res?.data?.msg || '您的应用服务已到期，请联系管理员续费！')
          resolve(false)
        }
      })
      .catch(() => {
        resolve(false)
      })
  })
}

/**
 * 组织架构搜索
 */
export const orgSearchList = (paramObj: any) => {
  return new Promise(resolve => {
    const param = {
      onlyUser: 1,
      keywords: paramObj.keywords,
      orgIds: paramObj.orgIds,
      account: $store.getState().nowAccount,
    }
    requestApi({
      url: '/team/user/solr/findAuthUserByEnterprise',
      param: param,
      json: true,
    }).then((res: any) => {
      if (res.success) {
        resolve(res)
      }
    })
  })
}
/**
 * 查询用户头像
 */
export const findProfileApi = ({ userIds }: { userIds: any }) => {
  return new Promise(resolve => {
    const param = {
      userIds: userIds.join(','),
    }
    requestApi({
      url: '/team/user/profiles',
      param: param,
    }).then((res: any) => {
      if (res.success) {
        resolve(res)
      } else {
        resolve(false)
      }
    })
  })
}
