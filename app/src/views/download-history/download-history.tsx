import React, { useEffect, useState } from 'react'
import { Button } from 'antd'
import fs from 'fs'
import path from 'path'

import './download-history.less'
import NoneData from '@/src/components/none-data/none-data'
import { getFileIcon } from '@/src/common/js/math'
import { ipcRenderer, shell } from 'electron'
import NoneFindFileModal from '@/src/components/download-footer/none-file-modal'
//下载记录的地址
const _normalpath = path.join('c:\\oa', './', 'downLoadHistory.bar')
//展示下载附件历史
const DownLoadHistory = () => {
  const { nowAccount } = $store.getState()
  const [showHistoryData, setHistoryData] = useState<any[]>([])
  // const [visible, setVisible] = useState(false)
  const [state, setState] = useState({
    visible: false,
    path: '',
  })
  const [getList, setGetList] = useState(false)
  /**
   * 初始化加载方法
   */
  const initFn = () => {
    fs.readFile(_normalpath, 'UTF-8', function(err, res) {
      let newdata = []
      if (!err && res != '') {
        newdata = JSON.parse(res)
      }
      //处理数据
      setHistoryData(
        newdata.filter((item: { userAccount: string }) => item.userAccount !== nowAccount).reverse()
      )
    })
  }

  useEffect(() => {
    /**
     * 监听窗口显示时调用初始化方法刷新界面
     */
    ipcRenderer.on('window-show', () => {
      initFn()
    })
  }, [])
  //初始查询数据
  useEffect(() => {
    initFn()
  }, [getList])

  //在文件夹中打开
  const openInFolder = (path: string) => {
    fs.exists(path, function(exists) {
      if (exists) {
        shell.showItemInFolder(path)
      } else {
        setState({
          ...state,
          visible: true,
          path,
        })
      }
    })
  }

  //关闭弹窗
  const closeModal = () => {
    setState({
      ...state,
      visible: false,
    })
  }

  //区分今天和往天，往天展示日期
  let nowFindDate = new Date().toDateString()
  let isFirst = true

  //清除全部下载历史
  const clearAllHistory = () => {
    fs.writeFile(_normalpath, JSON.stringify([]), function(err) {
      if (!err) {
        // throw err;
      }
    })
    setGetList(!getList)
  }

  //删除单挑下载记录
  const deleteHistoryItem = (downloadTime: any) => {
    //删除本地记录
    fs.readFile(_normalpath, 'UTF-8', function(err, res) {
      let newdata: any[] = []
      if (!err) {
        newdata = JSON.parse(res)
        $.each(newdata, (i, item) => {
          if (item.currentTime == downloadTime) {
            newdata.splice(i, 1)
            return false
          }
        })
      }
      fs.writeFile(_normalpath, JSON.stringify(newdata), function(err) {
        if (!err) {
          // throw err;
        }
        setGetList(!getList)
      })
    })
  }

  return (
    <div className="download-history-container">
      <NoneFindFileModal visible={state.visible} path={state.path} onClose={closeModal} />
      {showHistoryData.length === 0 && <NoneData showTxt="当前没有下载记录" />}
      {showHistoryData.length !== 0 && (
        <div className="downloadList-content">
          <div className="downloadHead">
            <Button type="link" className="clearAll_list" onClick={clearAllHistory}>
              清除全部
            </Button>
          </div>
          <div className="downloadList_container">
            {showHistoryData.map((item: any, index: number) => {
              // console.log(item);
              // const currentPath = 'C:\\oaDownLoad\\' + item.currentFileName
              const currentPath = item.localPath
              const ext = item.currentFileName
                .toLowerCase()
                .split('.')
                .splice(-1)[0]
              const showHtml = (
                <div className="list_item">
                  <div className="left_iconfile">
                    <img src={getFileIcon(ext)} />
                  </div>
                  <div className="right_detail">
                    <div className="right_left_box">
                      <div className="file_name hasFinish">{item.currentFileName}</div>
                      {item.currentStatus === 2 && (
                        <Button
                          type={'link'}
                          onClick={() => {
                            openInFolder(currentPath)
                          }}
                        >
                          在文件夹中显示
                        </Button>
                      )}
                    </div>
                    {item.currentStatus === 0 && (
                      <div className="right_btn_box">
                        <span className="failed_download">已取消</span>
                      </div>
                    )}
                    {item.currentStatus === 1 && (
                      <div className="right_btn_box">
                        <span className="failed_download">下载失败</span>
                      </div>
                    )}
                  </div>
                  <div
                    className="close_nowlist"
                    onClick={() => {
                      deleteHistoryItem(item.currentTime)
                    }}
                  ></div>
                </div>
              )
              let showTitle: any = null
              if (isFirst && nowFindDate === new Date(item.currentTime).toDateString()) {
                isFirst = false
                showTitle = <div className="list_title">今天</div>
              } else if (!isFirst && nowFindDate !== new Date(item.currentTime).toDateString()) {
                nowFindDate = new Date(item.currentTime).toDateString()
                showTitle = <div className="list_title">{$tools.getMyDate(item.currentTime).split(' ')[0]}</div>
              }
              return (
                <div className="download_list_item" key={index}>
                  {showTitle}
                  {showHtml}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default DownLoadHistory
