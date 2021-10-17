import React, { Fragment, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import NoticeDetails from '@/src/components/notice-details/index'
import { getPictureUrl, getPreviewUrl } from '../../components/upload-file/actions'
import { getLocationFormType } from '../../components/file-list/file-list-item'
import { Modal, Row, Col } from 'antd'
import { UploadOutlined, DownloadOutlined } from '@ant-design/icons'
import { ipcRenderer } from 'electron'
import { downloadFile } from '../../components/download-footer/downloadFile'
import { getFileSize, getFileIcon, imgesGatter, formatDateTime } from '@/src/common/js/math'
import { isJsonString } from '@/core/tools'
const seeFileWin = () => {
    // 附件预-览文件信息
    const [previewInfo, setPreviewInfo] = useState<any>(null)
    const [fileSrc, setFileSrc] = useState('')
    const [fileType, setFileType] = useState('')

    const fileInfo = useSelector((store: any) => store.fileInfo)
    const dir = fileInfo.dir
    const { fileName, fileKey, fileSize: fileSize, fromType, fileUrl } = fileInfo
    const value = { fileName, fileKey, fileSize: fileSize, dir, fromType }
    const params = {
        fileName: fileKey ? fileKey : `${undefined}.${fileName}`,
        dir,
    }
    document.title = fileName || '查看文件'
    async function getUrl(params: any) {
        let data = await getPreviewUrl(params)
        console.log(typeof (data));
        const viewUrl: any = fileUrl ? fileUrl : data
        const nowfileSrc = `http://110.185.107.104:8001/doceditor.aspx?editorsMode=fillForms&fileUrl=${viewUrl}`
        setFileSrc(nowfileSrc)
        setFileType('file')
    }
    getUrl(params)
    return (

        <div style={{ width: '100%' }}>
            {fileType === 'unknown' ? (
                <div className="notPreview">
                    <img src={$tools.asAssetsPath('/images/fileIcon/not-preview.png')} />
                    <div>当前文件不支持预览</div>
                    <div>
                        <DownloadOutlined
                            onClick={() => {
                                downloadFile(value)
                            }}
                        />
                下载<span>{getFileSize(fileSize)}</span>
                    </div>
                </div>
            ) : (
                    <iframe id="pdfIframe" src={fileSrc} width="100%" height="100%" frameBorder={0}></iframe>
                )}
        </div>
        // <div onClick={() => {
        //     const dialog = electron.remote.dialog
        //     dialog.showSaveDialog(
        //         {
        //             title: '另存文件',
        //             defaultPath: "C:\\自定义文件名.txt",
        //         },

        //     )
        // }}>
        //     11111
        // </div>
    )
}
export default seeFileWin
