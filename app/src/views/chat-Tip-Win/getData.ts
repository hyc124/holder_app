/**
 * 查询用户未读消息
 */

export const findUserUnReadMuc = () => {
  const { loginToken, nowUserId } = $store.getState()
  $store.dispatch({
    type: 'SAVE_UNREAD_INFO',
    data: [],
  })
  return new Promise((resolve, reject) => {
    $api
      .request(
        '/im-biz/chatRoom/message/findUserUnReadMuc',
        { userId: nowUserId },
        {
          headers: { loginToken: loginToken },
          formData: true,
        }
      )
      .then(res => {
        const { selectItem } = $store.getState()
        const list = res.dataList || []
        const reportListData = list.filter((item: any) => {
          return item.roomId !== selectItem.roomId && item.remindType === 0
        })
        if (reportListData && reportListData.length > 0) {
          $store.dispatch({
            type: 'SAVE_UNREAD_INFO',
            data: reportListData || [],
          })
        }
        resolve(reportListData)
      })
      .catch(err => {
        reject(err.returnMessage)
      })
  })
}
/**
 * 忽略未读消息
 */
export const ignoreMucMessage = () => {
  const { loginToken, nowUserId } = $store.getState()
  const params = {
    userId: nowUserId,
  }
  return new Promise((resolve, reject) => {
    $api
      .request('/im-biz/chatRoom/message/ignoreAllNewMsg', params, {
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
