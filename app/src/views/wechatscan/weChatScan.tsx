import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
const WeChatScan = (props: any) => {
  //获取扫描信息
  const weChatScanState = useSelector((store: StoreStates) => store.weChatScanState)

  return (
    <div className="weChat-qrCode">
      <iframe
        className="weChat-qrCode-iframe qrCodeIframe"
        frameBorder="0"
        sandbox="allow-scripts allow-same-origin allow-top-navigation"
        scrolling="no"
        src={weChatScanState.imgUrl}></iframe>
    </div>
  )
}

export default WeChatScan
