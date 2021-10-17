import React, { useState, useEffect } from 'react'
import { ipcRenderer } from 'electron'
import WebView from 'react-electron-web-view'
import { Spin } from 'antd'
import { getReportFormDetails, followStandingBook, clearCookie } from './getData'
interface DetailsProps {
  title: string
  id: number
  key: string
}

const Details = (props: { selectNode: DetailsProps }) => {
  const { selectNode } = props
  const [isFollowed, setFollowed] = useState(0)
  const [details, setDetails] = useState({ url: '' })
  const [loading, setLoading] = useState(true)
  // 关注报表
  const followBusinessData = () => {
    const followType = isFollowed === 1 ? 0 : 1
    const params = {
      type: 4, // 关注类型（1台账，4统计）
      typeId: selectNode.id, // 类型id
      followType: followType, // 0取消关注，1关注
    }
    followStandingBook(params).then(() => {
      // 刷新工作台
      ipcRenderer.send('refresh_standing_book')
      setFollowed(followType)
    })
  }

  useEffect(() => {
    if (selectNode.id) {
      const dataKey = selectNode.key
      const teamId = dataKey.split('-')
      clearCookie(Number(teamId[0])).then(() => {
        getReportFormDetails(selectNode.id)
          .then(res => {
            setDetails(res)
            setFollowed(res.isFollowed)
          })
          .finally(() => {
            setTimeout(() => {
              setLoading(false)
            }, 3000)
          })
      })
    }
  }, [selectNode.id])

  return (
    <>
      <div className="title flex">
        <div>{selectNode.title}</div>
        <div className="follow_handle">
          <em
            className={`${isFollowed ? 'color_yellow' : 'color_blue'} img_icon`}
            onClick={followBusinessData}
          ></em>
          关注
        </div>
      </div>
      {details.url && (
        <Spin spinning={loading} tip="加载中,请稍后...">
          {/* <iframe
            id="details_content"
            src={details.url}
            style={{ border: 'none', width: '100%', height: '100%' }}
          ></iframe> */}
          {
            <WebView
              src={details.url}
              id="details_content"
              disablewebsecurity
              allowpopups
              style={{ width: '100%', height: '100%' }}
            />
          }
        </Spin>
      )}
    </>
  )
}

export default Details
