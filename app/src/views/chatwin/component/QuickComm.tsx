import React, { useState, useEffect, memo } from 'react'
import { dealHandle } from '../../workdesk/getData'
import { ipcRenderer } from 'electron'

const QuickComm = (props: any) => {
  const { dataItem } = props
  const { handleModel } = dataItem
  const [isclicked, setIsclicked] = useState(false)
  const { nowUserId } = $store.getState()
  const [selectId, setSelectId] = useState(null)
  const quickComments = () => {
    const param = {
      userId: nowUserId, //事件名称
      timestamp: dataItem.time, //通知的内容
    }
    // 判断是否回复的同一条消息
    if (selectId !== handleModel.id) {
      dealHandle(param).then(() => {
        //关闭PUSH弹窗
        ipcRenderer.send('handle_messages_option', ['meet', dataItem.roomId, 'task_talk_at_push'])
        setSelectId(handleModel.id)
        setIsclicked(true)
      })
    }
  }

  // 有下角弹窗点击已知晓，及时更新状态（按钮置灰）
  useEffect(() => {
    ipcRenderer.on('IS_KNOW_TIME_STAMP', (ev, args) => {
      if (args === dataItem.time) {
        setIsclicked(true)
      }
    })
    return () => {
      ipcRenderer.removeAllListeners('IS_KNOW_TIME_STAMP')
    }
  }, [])

  return (
    <>
      <span
        className={`isKnow ${dataItem.handleModel?.know === 1 || isclicked ? 'isclicked' : ''}`}
        onClick={() => quickComments()}
      >
        已知晓
      </span>
      <span
        onClick={() => {
          $('.msg-txt').focus()
          const { currentReplyData, selectItem } = $store.getState()
          const draftData = JSON.parse(JSON.stringify(currentReplyData))
          draftData.forEach((item: any, index: number) => {
            if (selectItem.roomId === item.roomId) {
              draftData.splice(index, 1)
            }
          })
          draftData.push(dataItem)
          $store.dispatch({ type: 'SET_REPLY_PARENT_DATA', data: draftData })
          $store.dispatch({ type: 'SET_KEEP_SCROLL', data: true })
          quickComments()
        }}
      >
        回复
      </span>
    </>
  )
}

export default memo(QuickComm)
