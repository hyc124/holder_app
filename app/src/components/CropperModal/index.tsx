import React, { createRef, useState } from 'react'
import { Modal, Upload, Button, message } from 'antd'
import axios from 'axios'
import Cropper from 'react-cropper'
import * as Maths from '@/src/common/js/math'
import 'cropperjs/dist/cropper.css'
import './index.less'

interface PropperProps {
  visible: boolean
  closeModal: () => void
  uploadSuccess: (profile: string) => void
}

const protocol = process.env.API_PROTOCOL
const host = process.env.API_HOST
export default function Croppper({ visible, closeModal, uploadSuccess }: PropperProps) {
  const cropperRef = createRef<any>()
  const [blobFile, setBlobFile] = useState('')
  const [loading, setLoading] = useState(false)

  // 初始化显示需要裁切的图片
  const beforeUpload = (file: any) => {
    if (/^image\/\w+$/.test(file.type)) {
      const URL = window.URL || window.webkitURL
      const blobURL = URL.createObjectURL(file)
      setBlobFile(blobURL)
      return file
    } else {
      message.error('该文件类型不支持')
    }
  }

  // 查询图片地址
  const getPictureUrl = (fileKey: string) => {
    const params = {
      fileName: fileKey,
      dir: 'team',
    }
    return $mainApi
      .request('tools/oss/get/url', params, {
        headers: {
          loginToken: $store.getState().loginToken,
        },
        formData: true,
      })
      .then((res: any) => {
        if (res.returnCode === 0) {
          uploadSuccess(res.data)
        } else {
          message.error(res.returnMessage)
        }
      })
      .catch(() => {
        message.error('获取图片地址失败，请重试')
      })
  }

  //将base64转换为文件
  function dataURLtoFile(dataurl: string, filename: string) {
    const arr: any[] = dataurl.split(',')
    const mime = arr[0].match(/:(.*?);/)[1]
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }
    return new File([u8arr], filename, {
      type: mime,
    })
  }

  // 上传文件
  async function customRequestUpload() {
    const uuid = Maths.uuid()
    const imgkey = uuid + '.png'
    const cropper = cropperRef.current.cropper
    const base64url = cropper.getCroppedCanvas().toDataURL('image/jpeg')
    const myfile = dataURLtoFile(base64url, imgkey)
    const formData = new FormData()
    formData.append('file', myfile)
    // formData.append('fileName', uuid + '.png')
    formData.append('fileName', uuid)
    formData.append('dir', 'team')
    setLoading(true)
    axios({
      method: 'post',
      url: `${protocol}${host}/tools/oss/uploadFiles`,
      headers: {
        loginToken: $store.getState().loginToken,
      },
      data: formData,
    })
      .then((res: any) => {
        setLoading(false)
        if (res.data.returnCode === 0) {
          const ldot = myfile.name.lastIndexOf('.') //字符串最后出现下标位置
          const fileType = myfile.name.substring(ldot + 1) //.后面是后缀名，截取判断
          // getPictureUrl(`${imgkey}.${fileType}`)
          getPictureUrl(imgkey)
        }
      })
      .catch(err => {
        setLoading(false)
      })
  }
  return (
    <Modal
      title="裁剪头像"
      visible={visible}
      onCancel={closeModal}
      onOk={closeModal}
      className="cropperModal"
      width={850}
      bodyStyle={{ height: '490px' }}
      maskClosable={false}
      centered
      footer={
        <Button loading={loading} disabled={blobFile ? false : true} onClick={customRequestUpload}>
          开始上传
        </Button>
      }
    >
      <div className="cropperConent">
        <div style={{ flex: '1', margin: '20px' }}>
          {!blobFile && (
            <Upload
              name="avatar"
              listType="picture-card"
              className="avatar-uploader"
              showUploadList={false}
              beforeUpload={beforeUpload}
              action=""
            >
              <div>
                <div className="uploadBtn"></div>
                <span className="uploadText">上传本地照片</span>
              </div>
            </Upload>
          )}
          {blobFile && (
            <div>
              <Cropper
                ref={cropperRef}
                src={blobFile} // 文件
                style={{ width: 537, height: 444 }} // 自定义样式
                aspectRatio={1} // 设置图片长宽比
                viewMode={1}
                guides={false} // 是否显示九宫格
                preview=".cropper-preview" // 设置预览的dom
              />
            </div>
          )}
        </div>
        <div className="previewContent">
          <div>预览：</div>
          <div className="preview-container">
            <div className="cropper-preview" />
          </div>
        </div>
      </div>
    </Modal>
  )
}
