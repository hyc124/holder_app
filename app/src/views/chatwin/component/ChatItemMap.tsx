import React, { useRef, useEffect, memo } from 'react'
import { Modal } from 'antd'
const ChatItemMap = (props: any) => {
  const { visible2, action } = props
  const refComplete = useRef(null)
  useEffect(() => {
    let timer: any = null
    //设置表头相关字段
    if (refComplete) {
      timer = setTimeout(() => {
        const WS: any = window
        const BMap = WS.BMap //取出window中的BMap对象
        const SC: any = props
        const map = new BMap.Map('allmap', {
          enableMapClick: false,
          minZoom: 12,
          maxZoom: 16,
          enableDoubleClick: false,
        }) // 创建Map实例
        // let point: any = BMap.point
        // let marker: any = BMap.marker
        const point = new BMap.Point(SC.longitude, SC.latitude) // 初始化地图,设置中心点坐标和地图级别
        map.centerAndZoom(point, 15)
        const marker = new BMap.Marker(point) // 创建标注
        map.addOverlay(marker) // 将标注添加到地图中
        map.enableScrollWheelZoom()
        map.enableDragging()
        map.addControl(new BMap.OverviewMapControl())
        map.addControl(new BMap.NavigationControl())
        map.addControl(new BMap.ScaleControl())
      }, 100)
    }
    return () => {
      clearTimeout(timer)
      timer = null
    }
  }, [refComplete])

  const handleOk = (e: any) => {
    e.stopPropagation()
    action(false)
  }

  const handleCancel = (e: any) => {
    e.stopPropagation()
    action(false)
  }

  return (
    <Modal
      title="地图"
      visible={visible2}
      onOk={handleOk}
      onCancel={handleCancel}
      width={650}
      footer={null}
      maskClosable={false}
    >
      <div ref={refComplete}>
        <div id={'allmap'} style={{ height: '478px', width: '600px' }}></div>
      </div>
    </Modal>
  )
}
export default memo(ChatItemMap)
