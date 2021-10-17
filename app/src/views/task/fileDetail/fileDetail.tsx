import React, { useState, useEffect } from 'react'
import { Avatar } from 'antd'
import './fileDetail.less'
import { requestApi } from '../../../common/js/ajax'
import { getFileIcon, getFileSize } from '../../../common/js/file'
import NoneData from '@/src/components/none-data/none-data'
import { ipcRenderer } from 'electron'
import FileList from '@/src/components/file-list/file-list'
import { RenderFileList } from '../../mettingManage/component/RenderUplodFile'
/**
 * 文件来源
 * @param type
 * @param name
 * @param userName
 */
const fileSource = (type: string, name: string, userName: string, planType: number) => {
  let fromType = ''
  let param = ''
  if (planType === 2) {
    param = 'O'
  } else if (planType === 3) {
    param = 'KR'
  } else if (planType === 1) {
    param = '项目'
  } else {
    param = '任务'
  }
  switch (type) {
    case 'task':
      fromType = param + '详情 | 由【' + userName + '】上传'
      break
    case 'taskReport':
    case 'taskLog':
      fromType = param + (planType === 2 || planType === 3 ? '进展' : '汇报') + ' | 【' + userName + '】上传'
      break
    case 'taskOpinion':
      fromType = param + '备注 | 【' + userName + '】上传'
      break
    case 'talk':
    case 'comment':
      fromType = param + `评论 | ${name ? `主题(${name})` : ''}由【${userName}】上传`
      break
    default:
      fromType = '【' + userName + '】提交的问题及方案'
  }
  return fromType
}

// 刷新方法
export let refreshFiles: any = null
/**
 * 附件详情列表渲染
 */
export const FilesList = ({ refresh, param }: { refresh?: any; param: any }) => {
  const { taskId, ascriptionId, fileCount } = param
  // 附件列表数据
  const [fileInfo, setFileList] = useState<any>({
    fileList: [],
    type: 0,
  })
  /**
   * 按时间分组
   * @param array
   */
  const sortByTime = (array: any) => {
    const map: any = {}
    array.forEach((item: any) => {
      // 根据每一项的uploadDate进行判断，如果uploadDate相同，则应在一个新数组里
      //如果之前没有以此uploadDate为分组的数组
      if (!map[item.addTime]) {
        // 那么创建这个组 //list里存放完整的数据
        map[item.addTime] = { ...item, list: [item] }
      } else {
        // 如果已经有这个数组 插入数据
        map[item.addTime].list.push(item)
      }
    })
    //再定义一个空数组进行过滤
    const list: any = []
    for (const i in map) {
      list.push(map[i])
    }
    return list
  }

  /**
   * 查询附件
   */
  const findFileList = () => {
    const param = {
      loginUserId: $store.getState().nowUserId,
      taskId: taskId,
      belongType: 2,
      belong: ascriptionId,
      pageNo: 0,
      pageSize: 1000,
    }
    requestApi({
      url: '/task/file/control/list',
      param: param,
      json: true,
    }).then((res: any) => {
      console.log('XXXXX', res)
      if (res.success) {
        const files = res.data.data.content || []
        $('.processCont  #rc-tabs-5-tab-3').text(`${$intl.get('filesOverview')}(${files.length || 0})`)
        const newFiles = sortByTime(files)
        console.log(newFiles)
        // 遍历附件列表，需要规划类型
        setFileList({ fileList: newFiles, type: res.data.obj })
      }
    })
  }
  useEffect(() => {
    if (taskId) {
      findFileList()
    }
    refreshFiles = findFileList
  }, [taskId, fileCount])
  return (
    <section className="taskFilesList overflow_auto h100">
      {fileInfo.fileList &&
        fileInfo.fileList.map((sitem: any, i: number) => {
          // 取出来源信息
          let time = ''
          if (sitem.addTime) {
            time = sitem.addTime.substring(0, sitem.addTime.lastIndexOf(':')).replace('T', ' ')
          }
          // 附件列表
          return (
            <div
              key={i}
              style={{ display: 'flex', flexWrap: 'wrap' }}
              className={`file_item ${fileInfo.fileList.length > 0 ? '' : 'forcedHide'}`}
            >
              <div className="task-file-title">
                <div className="file-resource-info">
                  来源：
                  {fileSource(
                    sitem.fromType || '',
                    sitem.fromName || '',
                    sitem.uploadUser || '',
                    fileInfo.type || 0
                  )}
                </div>
                <div className="file-upload-date">{time}</div>
              </div>
              <RenderFileList className="fjzl" list={sitem.list} large={true} teamId={sitem.companyId} />
            </div>
          )
        })}
      {fileInfo.fileList.length == 0 ? (
        <NoneData
          imgSrc={$tools.asAssetsPath('/images/noData/OKR-file.png')}
          showTxt="上传附件，随时随地查看~"
          imgStyle={{ width: 66, height: 73 }}
          containerStyle={{ height: 300 }}
        />
      ) : (
        ''
      )}
    </section>
  )
}
/**
 * 附件详情列表单项数据
 */
export const FileDetailItem = ({ item }: { item: any }) => {
  const { fileKey, fileName, dir } = item
  const [fileUrl, setFileUrl] = useState('')
  const imgFormatArr = ['bmp', 'jpg', 'png', 'gif', 'jpeg']

  const ext = fileName
    .toLowerCase()
    .split('.')
    .splice(-1)[0]
  //渲染附件列表
  useEffect(() => {
    if (imgFormatArr.includes(ext)) {
      $tools.getUrlByKey(fileKey, dir).then((url: string) => {
        setFileUrl(url)
      })
    } else {
      setFileUrl(getFileIcon(ext))
    }
  }, [])

  /**
   * 文件下载
   */
  const downloadFile = (item: any) => {
    ipcRenderer.send('download_file', [item])
  }
  return (
    <div className="task-file-info">
      <Avatar className="file-avatar" shape={'square'} src={fileUrl}></Avatar>
      <div className="task-file-size">
        <p title={item.fileName}>{item.fileName}</p>
        <p>{getFileSize(item.fileSize)}</p>
      </div>
      <button
        className="img_icon file-download"
        onClick={() => {
          downloadFile(item)
        }}
      ></button>
    </div>
  )
}
