import React, { useState, useEffect, memo } from 'react'
import { Spin, Tabs, Input } from 'antd'
import InfiniteScroll from 'react-infinite-scroller'
import ChatFileItem from './ChatFileItem'
import NoneData from '@/src/components/none-data/none-data'
import '../styles/ChatFileList.less'
import DownLoadFileFooter from '@/src/components/download-footer/download-footer'

const { TabPane } = Tabs
interface FileListProps {
  id: number
  fileName: string
  fileKey: string
  fileSize: number
  dir: string
  uploadUser: string
  uploadDate: string
  collectType: number
  profile: string
  src: string
  officeUrl: string
  fileGUID: string
  mobileOfficeUrl: string
  downloadUrl: string
}

const fileTabs = [
  {
    title: '图片',
    key: '2',
  },
  {
    title: '文件',
    key: '1',
  },
]

const ChatFileList: React.FC<{ selectRoomId: number }> = ({ selectRoomId }) => {
  // 当前选中的聊天室
  const [loading, setLoading] = useState<boolean>(false)
  // 基本信息
  const { nowAccount, loginToken } = $store.getState()
  //文件列表
  const [fileList, setFileList] = useState<Array<FileListProps>>([])
  //关键字
  const [keywords, setKeyWords] = useState<string>('')
  //选择图片还是文件
  const [selectType, setSelectType] = useState<string>('2')
  //当前页
  const [pageNo, setPageNo] = useState<number>(0)
  //列表总页数
  const [totalPages, setTotalPages] = useState<number>(0)
  //是否有加载更多
  const [hasMore, setHasMore] = useState<boolean>(true)

  //查询列表
  useEffect(() => {
    setLoading(true)
    fetchFileList(0, (data: any) => {
      setLoading(false)
      setTotalPages(data.totalPages)
      setFileList(data.content)
    })
  }, [selectRoomId, selectType, keywords])

  const loadMore = () => {
    setLoading(true)
    setPageNo(pageNo + 1)
    if (pageNo + 1 >= totalPages) {
      setLoading(false)
      setHasMore(false)
      return
    }
    fetchFileList(pageNo + 1, data => {
      setLoading(false)
      setFileList(fileList.concat(data.content))
    })
  }

  //查询文件列表
  const fetchFileList = (page: number, callBack?: (data: any) => void) => {
    const params = {
      account: nowAccount,
      userId: $store.getState().nowUserId,
      type: selectType,
      relationId: selectRoomId,
      keyword: keywords,
      pageNo: page,
      pageSize: 20,
    }
    $api
      .request('/public/file/findFileList', params, {
        headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
      })
      .then(resData => {
        setLoading(false)
        callBack && callBack(resData.data || [])
      })
      .catch(() => {
        setLoading(false)
        setTotalPages(0)
      })
  }

  //切换文件图片
  const changeFileTab = (key: string) => {
    setSelectType(key)
    setHasMore(true)
    setPageNo(0)
  }

  //关键字搜索文件
  const searchFileList = (e: any) => {
    e.persist()
    setKeyWords(e.target.value)
  }

  //渲染tab
  const renderTabPane = (tab: { title: string; key: string }) => {
    return (
      <TabPane tab={tab.title} key={tab.key} forceRender={true} className="collect-list">
        <InfiniteScroll
          initialLoad={false}
          pageStart={0}
          loadMore={loadMore}
          hasMore={!loading && hasMore}
          useWindow={false}
        >
          {fileList.length !== 0 &&
            fileList.map((item: FileListProps, index: number) => (
              <div className="collect-item" key={item.id}>
                <ChatFileItem
                  index={index}
                  dir={item.dir}
                  src={item.officeUrl}
                  fileKey={item.fileKey}
                  fileName={item.fileName}
                  username={item.uploadUser}
                  fileSize={item.fileSize}
                  time={item.uploadDate}
                  type={item.collectType}
                  timestamp={item.id + ''}
                  mobileOfficeUrl={item.mobileOfficeUrl}
                  fileGuid={item.fileGUID}
                  downloadUrl={item.downloadUrl}
                />
              </div>
            ))}
        </InfiniteScroll>
        {fileList.length === 0 && <NoneData />}
      </TabPane>
    )
  }

  return (
    <div className="chat-handle-container">
      <Spin spinning={loading} wrapperClassName="chat-handle-content">
        <Tabs
          className="file-list flex"
          defaultActiveKey={selectType}
          onChange={changeFileTab}
          tabBarExtraContent={
            <Input.Search
              className="collection-input"
              style={{ marginRight: 20 }}
              placeholder="请输入关键字"
              onSearch={value => setKeyWords(value)}
              onPressEnter={searchFileList}
            />
          }
        >
          {fileTabs.map((item: { title: string; key: string }) => renderTabPane(item))}
        </Tabs>
      </Spin>
      <DownLoadFileFooter fromType="chatwin" />
    </div>
  )
}

export default memo(ChatFileList)
