import React, { useRef, useLayoutEffect, memo, useState } from 'react'
import ChatItemMap from './ChatItemMap'

const ReplyMsgMap = (props: any) => {
  const refComplete = useRef(null)
  // 地图的显隐
  const [mapDetails, setMapDetails] = useState<boolean>(false)
  const { replyMainBody } = props
  const { messageJson } = replyMainBody || {}
  const addressObj = $tools.isJsonString(messageJson) ? JSON.parse(messageJson) : messageJson
  //   初始化地图
  useLayoutEffect(() => {
    let timer: any = null
    //设置表头相关字段
    if (document.getElementsByClassName('reply_map').length > 0) {
      if (refComplete.current) {
        timer = setTimeout(() => {
          const WS: any = window
          const BMap = WS.BMap //取出window中的BMap对象
          const map = new BMap.Map('reply_map' + replyMainBody.serverTime, {
            enableMapClick: false,
            // minZoom: 15,
            // maxZoom: 15,
            enableDoubleClick: false,
          }) // 创建Map实例
          // let point: any = BMap.point
          // let marker: any = BMap.marker
          const point = new BMap.Point(addressObj.longitude, addressObj.latitude) // 初始化地图,设置中心点坐标和地图级别
          map.centerAndZoom(point, 15)
          const marker = new BMap.Marker(point) // 创建标注
          map.addOverlay(marker) // 将标注添加到地图中
          map.disableDragging()
          // marker.setAnimation(BMap.BMAP_ANIMATION_BOUNCE) //跳动的动画
        }, 100)
      }
    }
    return () => {
      timer && clearTimeout(timer)
    }
  }, [replyMainBody])
  return (
    <div className="message-info message-address" ref={refComplete}>
      <div
        onClick={e => {
          e.stopPropagation()
          setMapDetails(true)
        }}
      >
        <div className="message-address-tip">
          <div className="t1">{addressObj.abbrAddress}</div>
          <div className="t2">{addressObj.fullAddress}</div>
        </div>
        <div
          id={'reply_map' + replyMainBody.serverTime}
          style={{ height: '150px', width: '270px' }}
          className="reply_map"
        ></div>
      </div>
      {/* 地图窗口详情 */}
      {mapDetails && (
        <ChatItemMap
          {...addressObj}
          visible2={mapDetails}
          action={(state: boolean) => {
            setMapDetails(state)
          }}
        ></ChatItemMap>
      )}
    </div>
  )
}

export default memo(ReplyMsgMap)
