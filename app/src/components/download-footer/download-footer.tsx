/**
 * 附件下载底部状态栏
 */
import React, { useEffect, useState } from 'react'

import './download-footer.less'
import { Progress, Button, Dropdown, Menu, Tooltip } from 'antd'
import { CloseOutlined, UpOutlined } from '@ant-design/icons'
import { getFileIcon } from '@/src/common/js/math'
import { useSelector } from 'react-redux'
import $c from 'classnames'
import { getFileShowSize } from '../file-list/file-list-item'
import fs from 'fs'
import { ipcRenderer, shell } from 'electron'
import NoneFindFileModal from './none-file-modal'

//文件信息
interface FileItemProps {
  fileName: string
  showFileName: string
  fileKey: string
  fileSymbol: string
  fileSize: number
  dir: string
  percent: number
  status: string //文件状态
}
const DownFileItem = ({ item }: any) => {
  // const [visible, setVisible] = useState(false)
  const [state, setState] = useState({
    visible: false,
    path: '',
  })
  //点击菜单
  const clickDownMenu = ({ key }: any) => {
    if (key === '0') {
      //查看附件
      fs.exists(item.localPath, function(exists) {
        if (exists) {
          shell.openItem(item.localPath)
        } else {
          setState({
            ...state,
            visible: true,
            path: item.localPath,
          })
          // setVisible(true)
        }
      })
    } else if (key === '1') {
      //在文件夹中显示
      fs.exists(item.localPath, function(exists) {
        if (exists) {
          shell.showItemInFolder(item.localPath)
        } else {
          setState({
            ...state,
            visible: true,
            path: item.localPath,
          })
          // setVisible(true)
        }
      })
    } else if (key === '2') {
      fs.unlink(item.localPath, function(exists) {
        // downloadFileLists.map((ite: any, index: number) => {
        //   if (item.fileSymbol === ite.fileSymbol) {
        item.status = 'cancel'
        //   }
        //   return ite
        // })
        // setDownloadFileLists([...downloadFileLists])
      })
      //取消下载
    }
  }
  //查看菜单
  const menu = (
    <Menu className="look_file_menu" onClick={clickDownMenu}>
      <Menu.Item key="0" disabled={item.status !== 'done'}>
        查看
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="1" disabled={item.status !== 'done'}>
        在文件夹中显示
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="2" disabled={item.status !== 'downloading'}>
        取消
      </Menu.Item>
    </Menu>
  )
  //关闭弹窗
  const closeModal = () => {
    setState({
      ...state,
      visible: false,
      path: '',
    })
    // setVisible(false)
  }
  return (
    <div className="file_item">
      <NoneFindFileModal visible={state.visible} path={state.path} onClose={closeModal} />
      <Progress
        className="file-progress"
        type="circle"
        percent={item.status === 'cancel' ? 0 : item.percent}
        width={36}
        strokeColor={item.status === 'cancel' ? 'none' : ''}
        format={() => <img className="file-icon" src={getFileIcon(item.fileName)} />}
      />
      <div className="file_name_box">
        <Tooltip title={item.showFileName}>
          <span className="file_name">
            <em className="file-name">{item.showFileName}</em>
            {item.fileSize > 0 && <em>({getFileShowSize(item.fileSize)})</em>}
          </span>
        </Tooltip>
        {item.status === 'cancel' && <span className="state_txt">已取消</span>}
      </div>
      <Dropdown
        overlay={menu}
        placement="bottomRight"
        trigger={['click']}
        arrow={true}
        overlayClassName="downloadMenu"
      >
        <Button className="look_up" icon={<UpOutlined />}></Button>
      </Dropdown>
    </div>
  )
}
//下载相关操作
let downloadFileListsExport: any = null
let adddownloadFiles: any = null
export const downloadFileListsFn = (type: any, fileSymbol: any, percent: any, status: any) => {
  downloadFileListsExport && downloadFileListsExport(type, fileSymbol, percent, status)
}
export const adddownloadFilesFn = (downloadFile: any) => {
  adddownloadFiles && adddownloadFiles(downloadFile)
}
//下载附件底部状态栏  fromType:下载来源
const DownLoadFileFooter = ({ fromType }: { fromType: string }) => {
  // const downloadFileLists = useSelector((store: StoreStates) => store.downloadFileLists)
  const [showIcon, setShowIcon] = useState(false)
  const [downloadFileLists, setDownloadFileLists] = useState<any>([])

  //当前窗口的下载列表
  const showDownloadLists = downloadFileLists.filter((item: any) => item.fromType === fromType)
  useEffect(() => {
    setShowIcon(true)
    const timer = setTimeout(() => {
      setShowIcon(false)
    }, 1000)
    return () => {
      clearTimeout(timer)
    }
  }, [downloadFileLists.length])
  //获取下载信息
  downloadFileListsExport = (type: any, fileSymbol: any, percent: any, status: any) => {
    if (type === 'percent') {
      //更新进度
      downloadFileLists.map((item: any) => {
        // if (item.status !== 'cancel') {
        if (item.fileSymbol === fileSymbol) {
          if (item.status !== 'cancel') {
            item.percent = percent
          }
        }
        return item
        // }
      })
      setDownloadFileLists([...downloadFileLists])
    }
    if (type === 'status') {
      downloadFileLists.map((item: any) => {
        if (item.fileSymbol === fileSymbol) {
          item.percent = 100
          item.status = status
        }
        return item
      })
      setDownloadFileLists([...downloadFileLists])
    }
  }
  //set下载列表
  adddownloadFiles = (downloadFile: any) => {
    if (downloadFile === null) {
      setDownloadFileLists([...downloadFileLists, []])
    } else {
      setDownloadFileLists([downloadFile, ...downloadFileLists])
    }
  }
  //关闭下载底部
  const closeDownloadFooter = () => {
    // $store.dispatch({ type: 'ADD_DOWNLOAD_FILE', data: null })
    setDownloadFileLists([])
  }

  //查看全部下载历史
  const showDownloadHistory = () => {
    $tools.createWindow('DownLoadHistory')
  }

  return (
    <div className="filedownload_container" style={{ display: showDownloadLists.length > 0 ? 'flex' : 'none' }}>
      <div className="file_item_list">
        {showDownloadLists.map((item: FileItemProps, index: number) => {
          return <DownFileItem item={item} key={index} />
        })}
      </div>
      {/* <Button className="look_all_file" onClick={showDownloadHistory} style={{ display: showDownloadLists.length > 0 ? 'flex' : 'none' }}>
        显示全部
      </Button> */}
      <Button className="close_download_footer" icon={<CloseOutlined />} onClick={closeDownloadFooter}></Button>
      <div className={$c('download_iconfile', { changeAni: showIcon })}></div>
    </div>
  )
}

export default DownLoadFileFooter
