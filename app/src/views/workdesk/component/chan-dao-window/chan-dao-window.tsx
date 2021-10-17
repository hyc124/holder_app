import React, { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { message, Spin } from 'antd'
import WebView from 'react-electron-web-view'
import Axios from 'axios'
import { ipcRenderer } from 'electron'
import './chan-dao-window.less'
import { deleteSystemNotification } from '../../getData'

const ChanDaoWindow = () => {
  //禅道访问地址
  const chanDaoUrl = useSelector((store: StoreStates) => store.chanDaoUrl)
  const { url, id, type } = chanDaoUrl
  const [setUrl, setSendUrl] = useState('')
  //是否显示loading
  const [loading, setLoading] = useState(false)
  const loadstart = () => {
    setLoading(true)
  }
  const loadstop = () => {
    setLoading(false)
  }
  //监听webview加载
  useEffect(() => {
    const wb = document.querySelector('webview')
    let isunmounted = false
    if (url != '') {
      if (!isunmounted) {
        wb?.addEventListener('did-start-loading', loadstart)
        wb?.addEventListener('did-stop-loading', loadstop)
      }
    }
    return () => {
      isunmounted = true
      wb?.removeEventListener('did-start-loading', loadstart)
      wb?.removeEventListener('did-stop-loading', loadstop)
    }
  }, [])

  useEffect(() => {
    Axios.get(url).then(res => {
      setLoading(false)
      if (res.data.returnCode == 0) {
        const _url = res.data.data.url
        setSendUrl(_url)
      } else if (res.data.returnCode == 5000) {
        deleteSystemNotification({
          noticeType: type,
          noticeTypeId: id,
        }).then((res: any) => {
          message.error('该BUG已被删除或失效')
          // ipcRenderer.send('close_chanDao_window')
          ipcRenderer.send('handle_messages_option', ['chandao', id, type])
          ipcRenderer.send('update_unread_num', [id]) //更新工作台数量
        })
      }
    })
  }, [chanDaoUrl])
  return (
    <div className="chandao_container" style={{ width: '100%', height: '100%' }}>
      <Spin spinning={loading} tip="正在努力加载中，请耐心等待...">
        {/* <WebView className="chandaoWin" src={setUrl} id="chandao" allowpopups style={{ width: '100%', height: '100%' }} height="100%" /> */}
        <iframe
          className="chandaoWin"
          src={setUrl}
          id="chandao"
          style={{ width: '100%', height: '100%' }}
          height="100%"
        />
      </Spin>
    </div>
  )
}

export default ChanDaoWindow
