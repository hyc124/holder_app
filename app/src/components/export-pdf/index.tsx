import React from 'react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
// import { DownloadOutlined } from '@ant-design/icons'
import './index.less'
import { message } from 'antd'
import { downloadFile } from '../download-footer/downloadFile'

interface ExportPdfProps {
  text?: string
  eleId: string
  name: string
  beglongId: any
  fileGuid: any
  isDiscuss: any
  type: any
  Icon?: any
}

const PdfComponent = ({ text = '下载', eleId, name, beglongId, fileGuid, isDiscuss, type }: ExportPdfProps) => {
  const $name = name ? name.replace(/\s*/g, '') : ''
  // const [isloading, setIsLoading] = useState(false)
  //老版本公告下载
  const download = () => {
    // setIsLoading(true)
    jQuery('.modalNoticeDetails .ant-modal-body').css({
      height: 'inherit',
    })
    const element: any = document.getElementById(eleId) // 这个dom元素是要导出pdf的div容器
    const w = element.offsetWidth // 获得该容器的宽
    const h = element.offsetWidth // 获得该容器的高
    const offsetTop = element.offsetTop // 获得该容器到文档顶部的距离
    const offsetLeft = element.offsetLeft // 获得该容器到文档最左的距离
    const canvas = document.createElement('canvas')
    const winI = document.body.clientWidth // 获得当前可视窗口的宽度（不包含滚动条）
    const winO = window.innerWidth // 获得当前窗口的宽度（包含滚动条）
    let abs = 0
    if (winO > winI) {
      abs = (winO - winI) / 2 // 获得滚动条长度的一半
    }
    canvas.width = w * 2 // 将画布宽&&高放大两倍
    canvas.height = h * 2
    const context: any = canvas.getContext('2d')
    context.scale(2, 2)
    context.translate(-offsetLeft - abs, -offsetTop)
    // 这里默认横向没有滚动条的情况，因为offset.left(),有无滚动条的时候存在差值，因此
    // translate的时候，要把这个差值去掉
    // element.style.width = '700px'
    html2canvas(element, {
      allowTaint: true,
      scale: 2, // 提升画面质量，但是会增加文件大小
    }).then(function(canvas) {
      const contentWidth = canvas.width
      const contentHeight = canvas.height
      //一页pdf显示html页面生成的canvas高度;
      const pageHeight = (contentWidth / 592.28) * 841.89
      //未生成pdf的html页面高度
      let leftHeight = contentHeight
      //页面偏移
      let position = 0
      //a4纸的尺寸[595.28,841.89]，html页面生成的canvas在pdf中图片的宽高
      const imgWidth = 595.28
      const imgHeight = (592.28 / contentWidth) * contentHeight

      const pageData = canvas.toDataURL('image/jpeg', 1.0)

      const pdf = new jsPDF('', 'pt', 'a4')

      //有两个高度需要区分，一个是html页面的实际高度，和生成pdf的页面高度(841.89)
      //当内容未超过pdf一页显示的范围，无需分页
      if (leftHeight < pageHeight) {
        pdf.addImage(pageData, 'JPEG', 0, 0, imgWidth, imgHeight)
      } else {
        // 分页
        while (leftHeight > 0) {
          pdf.addImage(pageData, 'JPEG', 0, position, imgWidth, imgHeight)
          leftHeight -= pageHeight
          position -= 841.89
          //避免添加空白页
          if (leftHeight > 0) {
            pdf.addPage()
          }
        }
      }
      pdf.save(`${$name}.pdf`)
      setTimeout(() => {
        jQuery('.modalNoticeDetails .ant-modal-body').css({
          height:
            isDiscuss === 1 && type !== 0 ? window.innerHeight - 149 + 'px' : window.innerHeight - 93 + 'px',
        })
      }, 200)
    })
  }
  //新版本公告下载
  const newDownLoad = () => {
    if (!fileGuid) {
      return message.error('[提示]公告fileGuid为空!')
    }
    downloadFile({
      url: '',
      fileName: `${$name}.pdf`,
      companyId: beglongId,
      fileKey: fileGuid,
      fileSize: 0,
      isOffice: true,
      dir: 'notice',
      fromType: 'mainWin',
    })
  }

  return (
    <span onClick={newDownLoad} className="exportIcon btnSpan">
      <span className="icon download"></span>
      {text}
    </span>
  )
}

export default PdfComponent
