import React, { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { message, Spin } from 'antd'
import Axios from 'axios'
import { ipcRenderer } from 'electron'
import './wu-tong-window.less'
import { deleteSystemNotification } from '../../getData'

const WuTongWindow = () => {
  //吾同体育访问地址
  const wuTongUrl = useSelector((store: StoreStates) => store.wuTongUrl)
  const { url } = wuTongUrl
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
  console.log(url)
  return (
    <div className="wutong_container" style={{ width: '100%', height: '100%' }}>
      <Spin spinning={loading} tip="正在努力加载中，请耐心等待...">
        <iframe
          className="wutongWin"
          sandbox="allow-scripts allow-same-origin allow-top-navigation allow-popups"
          src={wuTongUrl.url}
          id="wutong"
          style={{ width: '100%', height: '100%' }}
          height="100%"
        />
      </Spin>
    </div>
  )
}

export default WuTongWindow
