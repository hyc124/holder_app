import React, { useState } from 'react'
import html2canvas from 'html2canvas'
import './scaleZoom.less'
import { Dropdown } from 'antd'
/**
 * 放大缩小组件
 * node：设置的节点区域，如果设置了可拖动节点，则此节点即为可拖动节点名
 * zoomStep:放大缩小的单位（默认0.1）
 * minZoom：最小缩放限制
 * maxZoom：最大缩放限制
 * scaleZoom:点击放大缩小后的回调函数
 * className:自定义类名
 * outHandle:外部处理放大缩小
 */
const ScaleZoom = (props: {
  node?: any
  zoomStep?: number // 放大缩小步长
  minZoom?: number // 最小缩小限制
  maxZoom?: number // 最大放大限制
  scaleZoom?: any //放大缩小操作时的回调
  outHandle?: boolean //外部scaleZoom控制
  className?: string //外部传入额外类名
  thumbBtn?: boolean //是否显示缩略图按钮
  thumbSourceId?: string //缩略图内容节点的id名
}) => {
  const defaults: any = {
    zoomStep: 0.1,
    minZoom: 0.5,
    maxZoom: 1.9,
    outHandle: false,
    scaleZoom: () => {},
  }
  // 防止空对象报错
  const param = props || {}
  //   合并参数
  const options = { ...defaults, ...param }
  const { node, zoomStep, minZoom, maxZoom, scaleZoom, outHandle, className, thumbBtn, thumbSourceId } = options
  /**
   * state
   */
  const [state, setState] = useState<any>({
    thumbVisible: '',
    thumbImg: '',
  })
  /**
   * 放大缩小
   */
  const scaleZoomFn = (type: number) => {
    scaleZoom && scaleZoom(type)
    if (outHandle) {
      return
    }
    const areaNode = className ? $(`.scaleComArea.${className}`) : $('.scaleComArea')
    // let zoomNum:any = parseFloat(aeaNode.attr("data-zoom") || '1').toFixed(1);
    let zoomNum: any = Number(areaNode.attr('data-zoom') || 1)
    // 放大
    if (type == 1) {
      if (zoomNum < maxZoom) {
        zoomNum += zoomStep
      }
    } else if (type == 2) {
      //缩小
      if (zoomNum > minZoom) {
        zoomNum -= zoomStep
      }
    } else {
      //还原
      zoomNum = 1
      $(node).css({ left: '0', top: '0px' })
    }
    $(node).css({ transform: `scale(${zoomNum})` })
    areaNode.attr('data-zoom', zoomNum)
    $(node).attr('data-zoom', zoomNum)
    areaNode.find('.scale-zoom .zoom_percent').html(Math.round(zoomNum * 100) + '%')
  }
  /**
   * 缩略图显示
   */
  const thumbImgShow = ({ visible }: any) => {
    // const thumbImgBox = $(evt.currentTarget).find('.thumbImgBox')
    // const thumbImg = thumbImgBox.find('img')
    // if (thumbImgBox.is(':hidden')) {
    //   thumbImgBox.show()
    // } else {
    //   thumbImgBox.hide()
    //   return
    // }
    setState({ ...state, thumbVisible: visible })
    if (!visible) {
      return
    }
    const element: any = document.querySelector(thumbSourceId) // 这个dom元素是要导出pdf的div容器
    const canvas = document.createElement('canvas')
    // 处理canvas宽度扩大2倍（测试时有黑色背景bug，暂且去掉）
    // const w = element.offsetWidth // 获得该容器的宽
    // const h = element.offsetHeight // 获得该容器的高
    // canvas.width = w * 2 // 将画布宽&&高放大两倍
    // canvas.height = h * 2
    const context: any = canvas.getContext('2d')
    context.scale(2, 2)
    html2canvas(element, {
      allowTaint: true,
      // scale: 2, // 提升画面质量，但是会增加文件大小
    }).then(function(canvas) {
      const imgData = canvas.toDataURL('image/jpeg', 1.0)
      // thumbImg.attr('src', imgData)
      setState({ ...state, thumbVisible: visible, thumbImg: imgData })
    })
  }
  return (
    <div className={`scaleComArea flex center-v ${className || ''}`} data-zoom="1">
      {thumbBtn && (
        <Dropdown
          trigger={['click']}
          placement="topRight"
          visible={state.thumbVisible}
          overlay={
            <div className="scaleComThumbImgBox flex center-v center-h">
              <img className="imgShow" src={state.thumbImg} alt="" />
            </div>
          }
          onVisibleChange={(visible: boolean) => {
            thumbImgShow({ visible })
          }}
        >
          <div className="thumb_btn">
            <span className="img_icon thumb_icon"></span>
          </div>
        </Dropdown>
      )}
      <div className="scale-zoom flex center-v between">
        <span
          className="scale_icon scale-zoom-plus"
          onClick={() => {
            scaleZoomFn(1)
          }}
        ></span>
        <em className="zoom_percent">100%</em>
        <span
          className="scale_icon scale-zoom-minus"
          onClick={() => {
            scaleZoomFn(2)
          }}
        ></span>
      </div>
      <div
        className="scale-location"
        onClick={() => {
          scaleZoomFn(0)
        }}
      >
        <span></span>
      </div>
    </div>
  )
}

export default ScaleZoom
