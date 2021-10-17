import React, { useLayoutEffect, useState } from 'react'
import { FullscreenExitOutlined } from '@ant-design/icons'
import './officewrap.less'
import { Button, Modal, Tooltip } from 'antd'
interface OfficeProps {
  dataurl: string
}
interface PreViewOfficeProps {
  dataurl: string
  visible: boolean
  setVisible: (state: boolean) => void
}

export const PreViewOffice = (props: PreViewOfficeProps) => {
  //自适应高度
  const minimize = () => {
    props.setVisible(false)
  }
  return (
    <div className="preview_office_content">
      <iframe className="preview_office_wrap iframe_scrollbar" src={props.dataurl}></iframe>
      <Modal
        title=""
        centered
        className="office_modal"
        closable={false}
        visible={props.visible}
        width={window.innerWidth}
        bodyStyle={{ height: window.innerHeight }}
        footer={null}
      >
        <div className="full_office_wrap" style={{ height: '100%' }}>
          <div className="full_office_wrap_head">
            <Tooltip title="恢复默认" placement="bottom">
              <Button type="dashed" onClick={minimize} icon={<FullscreenExitOutlined />}>
                关闭
              </Button>
            </Tooltip>
          </div>
          <iframe
            style={{ height: '100%' }}
            className="preview_office_wrap iframe_scrollbar"
            src={props.dataurl}
          ></iframe>
        </div>
      </Modal>
    </div>
  )
}

const WrapContent = (props: OfficeProps) => {
  const [msg, setMsg] = useState({
    disY: 0, //鼠标按下时光标的Y值
    disH: 0, // 拖拽前div的高
  })
  useLayoutEffect(() => {
    const oDragIcon = document.querySelector('#iframeRoom_drop_icon')
    oDragIcon?.addEventListener('mousedown', oDragIconMousedown)
    return () => {
      oDragIcon?.removeEventListener('mousedown', oDragIconMousedown)
    }
  }, [])

  const oDragIconMousedown = (_ev: any) => {
    const oPanel: any = document.querySelector('#iframe_room')
    const ev: any = _ev || window.event
    setMsg({
      ...msg,
      disY: ev.clientY, // 获取鼠标按下时光标Y的值
      disH: oPanel.offsetHeight, // 获取拖拽前div的高
    })

    const temp = {
      disY: ev.clientY, // 获取鼠标按下时光标Y的值
      disH: oPanel.offsetHeight, // 获取拖拽前div的高
    }

    document.onmousemove = (e: any) => {
      const ev: any = e || window.event
      ev.returnValue = false
      //拖拽时为了对宽和高 限制一下范围，定义两个变量
      let H = ev.clientY - temp.disY + temp.disH
      if (H < 100) {
        H = 100
      }
      if (H > 1000) {
        H = 1000
      }
      oPanel.style.height = H + 'px' // 拖拽后物体的高
    }
    document.onmouseup = () => {
      document.onmousemove = null
      document.onmouseup = null
    }
  }
  return (
    <div id="iframe_room">
      <div className="officeUrl_room">
        <iframe id="office_wrap" className="office_wrap iframe_scrollbar" src={props.dataurl}></iframe>
      </div>
      {/* <div className="iframeRoom_drop_wrap">
        <div id="iframeRoom_drop_icon">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div> */}
    </div>
  )
}
export default WrapContent
