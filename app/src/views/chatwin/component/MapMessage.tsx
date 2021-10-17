import React, { useRef, useLayoutEffect, memo, useState } from 'react'
import ChatItemMap from './ChatItemMap'

const MapMessage = (props: any) => {
  const refComplete = useRef(null)
  const { showContent, contextMenuEvent, mapMsg } = props
  // 地图的显隐
  const [mapDetails, setMapDetails] = useState<boolean>(false)
  //   初始化地图
  useLayoutEffect(() => {
    let timer: any = null
    //设置表头相关字段
    if (document.getElementsByClassName('allmap_').length > 0) {
      if (refComplete.current) {
        timer = setTimeout(() => {
          const WS: any = window
          const BMap = WS.BMap //取出window中的BMap对象
          const SC: any = showContent
          const { messageJson } = SC || {}
          const addressObj = $tools.isJsonString(messageJson) ? JSON.parse(messageJson) : messageJson
          const map = new BMap.Map('allmap_' + SC.serverTime, {
            enableMapClick: false,
            // minZoom: 15,
            // maxZoom: 15,
            enableDoubleClick: false,
          }) // 创建Map实例
          // let point: any = BMap.point
          // let marker: any = BMap.marker
          const point = new BMap.Point(addressObj?.longitude, addressObj?.latitude) // 初始化地图,设置中心点坐标和地图级别
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
  }, [showContent])
  return (
    <div className="message-address" ref={refComplete} onContextMenu={contextMenuEvent}>
      <div
        onClick={e => {
          e.stopPropagation()
          setMapDetails(true)
        }}
      >
        <div className="message-address-tip">
          <div className="t1">{mapMsg.abbrAddress}</div>
          <div className="t2">{mapMsg.fullAddress}</div>
        </div>
        <div
          id={'allmap_' + showContent.serverTime}
          style={{ height: '96px', width: '278px' }}
          className="allmap_"
        ></div>
      </div>
      {/* {renderThumMember()} */}
      {/* 地图窗口详情 */}
      {mapDetails && (
        <ChatItemMap
          {...mapMsg}
          visible2={mapDetails}
          action={(state: boolean) => {
            setMapDetails(state)
          }}
        ></ChatItemMap>
      )}
    </div>
  )
}

export default memo(MapMessage)
