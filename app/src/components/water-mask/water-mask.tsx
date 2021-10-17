import React, { useEffect, useState } from 'react'

const WaterMark = ({ text = '', option, children }: { text: string; option: any; children: any }) => {
  const { top = '0px', left = '0px', width, height } = option
  const [background, setBackground] = useState('')
  useEffect(() => {
    const can = document.createElement('canvas') // 设置画布的长宽
    can.width = 300
    can.height = 100
    const ctx = can.getContext('2d') // 旋转角度
    if (ctx) {
      ctx.clearRect(0, 0, 200, 150)
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, 200, 150)

      // 设置字体文字大小及字体类型
      ctx.font = '15px Arial'
      // 设置旋转角度 格式 (-45 * Math.PI) / 180
      ctx.rotate((-25 * Math.PI) / 180)
      // 设置文本样式
      ctx.fillStyle = 'rgba(170,170,170,0.26)'
      // 设置水印文本
      ctx.fillText(text, 20, 90)
      // 生成base64格式的图片路径
      const curl = can.toDataURL('image/png')
      setBackground(`url(${curl}) left top repeat`)
    }
  }, [text])

  return (
    <div
      className="water-mask-container"
      style={{
        top,
        left,
        width,
        height,
        background,
        zIndex: 999,
      }}
    >
      {children}
    </div>
  )
}

export default WaterMark
