import React, { useState, useEffect } from 'react'
import { Modal, Tag, Tabs, Avatar, Comment, Tooltip, List, Row, Col, Spin, Collapse } from 'antd'
import { mangerHistory, findByUserDeatil, queryTodayNoWrite } from '../common/getReprt'
import ReportHistoryModel from '../../DailySummary/component/ReportHistoryList'
import moment from 'moment'
import './ReportMangerModel.less'
import { getPictureUrl } from '../../../components/notice-details/actions'
import FileListView from '../../../components/file-list/file-list'
const changeNowList = {
  variableWidth: true,
  arrows: true,
  autoplay: false,
  speed: 2000,
  autoplaySpeed: 5000,
  cssEase: 'linear',
}
const { TabPane } = Tabs
interface PersonData {
  count: number
  userId: number
  username: string
}
interface PersonType {
  userId: number
  username: string
  type: number
  userRead: number
  profile: string
}
const { Panel } = Collapse
export const FileList = (props: any) => {
  const [fileList, setFileList] = useState<any>([])
  useEffect(() => {
    if (props.data) {
      setFileList(props.data)
    }
    // 查询图片地址
    // async function getImg() {
    //   for (let i = 0; i < props.data.length; i++) {
    //     await getPictureUrl({
    //       fileName: props.data[i].fileKey,
    //       dir: props.data[i].dir,
    //     }).then((imgData: any) => {
    //       props.data[i].url = imgData.data
    //     })
    //   }
    //   setFileList(props.data)
    // }
    // getImg()
  }, [props.data])
  return (
    <ul className="file_normal_box_list">
      {fileList &&
        fileList.length > 0 &&
        fileList.map((item: any, index: number) => (
          <li key={index}>
            <img className="img_file" src={item.imgUrl} />
            <a
              className="delete_icon"
              onClick={e => {
                e.stopPropagation()
                props.deleteFile(item)
              }}
            ></a>
          </li>
        ))}
    </ul>
  )
}
export const ReportMangerModel = ({
  param,
  setvisible,
}: {
  param: { visible: boolean; data: any }
  setvisible: any
}) => {
  const [reportMangerData, setReportMangerData] = useState<any[]>([])
  const [personList, setPersonList] = useState<PersonData[]>([])
  const [todayNoWrite, setTodayNoWrite] = useState<any[]>([])
  const [detailHistory, setDetailHistory] = useState({ visible: false, data: {} })
  const [loading, setLoading] = useState(false)
  const [userVal, setUserVal] = useState(0)
  useEffect(() => {
    // let unmounted = false
    if (param.visible) {
      mangerHistory({
        id: param.data.id,
        queryType: param.data.queryType,
        personType: param.data.personType,
      }).then((resData: any) => {
        setPersonList(resData.dataList)
      })
      dataTabList()
      queryTodayNoWrite(param.data.id, param.data.teamId).then((resData: any) => {
        setTodayNoWrite(resData.dataList)
      })
    }
    // return () => {
    //   unmounted = true
    // }
  }, [param, setvisible])
  const handleCancel = () => {
    setvisible(false)
  }
  const dataTabList = (uerid?: number) => {
    setUserVal(uerid || 0)
    setLoading(true)
    findByUserDeatil({
      taskId: param.data.id,
      userId: uerid ? uerid : 0,
      personType: param.data.personType,
    }).then((res: any) => {
      setReportMangerData(res.dataList)
      setLoading(false)
    })
  }
  //评论列表type---1:任务动态  2:下一步计划
  const viewList = (data: any) => {
    const conentList: any = []
    data.commentMessages.map((item: any) => {
      conentList.push({
        avatar: (
          <Avatar src={item.profile || ''} style={{ background: '#4285f4' }}>
            {item.username.substr(-2, 2)}
          </Avatar>
        ),
        content: (
          <div className="commment_view_all">
            <div
              contentEditable={false}
              dangerouslySetInnerHTML={{
                __html: `<div class="callUser" id="${item.id}" rootId="${item.id}" dataName="${item.username}" userId="${item.userId}" useraccout="${item.userAccount}">${item.content}</div>`,
              }}
            ></div>
            {item.childComments && (
              <div
                contentEditable={false}
                dangerouslySetInnerHTML={{
                  __html: addChildComment(item.childComments, item.username, item.id),
                }}
              ></div>
            )}
          </div>
        ),
        datetime: (
          <span style={{ color: '#757577' }}>{moment(item.createTime).format('YYYY-MM-DD HH:mm:ss')}</span>
        ),
      })
    })

    return conentList
  }
  /**填充子评论 */
  const addChildComment = (data: any, parentName: string, rootId: number) => {
    let html = ''
    $.each(data, (i, item) => {
      html += `<div class="callUser" id="${item.id}" rootid="${rootId}" dataName="${item.username}" userId="${item.userId}" useraccout="${item.userAccount}"
      > <span>@${item.username}</span>：回复 <span>@${parentName}</span>：${item.content} <em> ${item.createTime}</em></div>`
      if (item.childComments && item.childComments.length != 0) {
        html += addChildComment(item.childComments, item.username, rootId)
      }
    })
    return html
  }
  // 已读、未读、汇报对象
  const getPersonList = (list: any) => {
    return (
      <div className="report_list flex">
        {list &&
          list.length > 0 &&
          list.map((item: PersonType, index: number) => (
            <div className="report_des_peo_box flex column center" key={index}>
              <Avatar src={item.profile || ''} style={{ background: '#4285f4' }}>
                {item.username && item.username.substr(-2, 2)}
              </Avatar>
              <span>{item.username}</span>
            </div>
          ))}
      </div>
    )
  }
  return (
    <>
      <Modal
        title="任务汇报"
        visible={param.visible}
        onCancel={handleCancel}
        maskClosable={false}
        className="reprtMangeModel"
        footer={null}
        width="850px"
      >
        <Spin spinning={loading} tip={'加载中，请耐心等待'}>
          <div className="nametotal_live">
            <div className={`tupiao_namelist ${userVal ? 'tupiao_native' : ''}`}>
              <span
                onClick={e => {
                  e.stopPropagation()
                  dataTabList()
                }}
              >
                所有{param.data.personIdType == 4 && '执行'}
                {param.data.personIdType == 5 && '领导'}人
              </span>
            </div>
            <ul className="nameclickList">
              {personList &&
                personList.length > 0 &&
                personList.map((item: PersonData, index: number) => (
                  <li
                    className={`${userVal == item.userId ? 'active' : ''}`}
                    key={index}
                    onClick={() => {
                      dataTabList(item.userId)
                    }}
                  >
                    {item.username}({item.count})
                  </li>
                ))}
            </ul>
          </div>
          {reportMangerData &&
            reportMangerData.length > 0 &&
            reportMangerData.map((item: any, index: number) => (
              <div
                className="process_content_all"
                key={index}
                onClick={(e: any) => {
                  e.stopPropagation()
                  if (
                    !e.target.className.includes('file-item') &&
                    !e.target.className.includes('ant-tabs-tab')
                  ) {
                    detailHistory.visible = true
                    detailHistory.data = {
                      taskId: item.reportId,
                      ...item,
                    }
                    setDetailHistory({ ...detailHistory })
                  }
                }}
              >
                <div className="process_normal_title submit_infos_tit">
                  <div className="submit_infos">
                    <span className="title_name getblue">{item.reportUserName}</span>
                    <span style={{ marginRight: '25%' }}>于{item.createDate}提交的汇报</span>
                  </div>
                </div>
                <div className="process_normal_content">
                  {item.models.map((data: any, num: number) => (
                    <div className="problem_box" key={num}>
                      <div className="problem_title">{data.name}</div>
                      <div
                        className="problem_cont"
                        contentEditable={false}
                        dangerouslySetInnerHTML={{
                          __html: data.content ? data.content.split(':::').join('') : '',
                        }}
                      ></div>
                    </div>
                  ))}
                  <Tabs defaultActiveKey="1" type="card" size="small" className="problem_report_navs">
                    <TabPane tab="已读" key="1">
                      {getPersonList(item.readUsers)}
                    </TabPane>
                    <TabPane tab="未读" key="2">
                      {getPersonList(item.unReadUsers)}
                    </TabPane>
                  </Tabs>
                  {item.files && item.files.length > 0 && (
                    <div className="report-to-user-list">
                      <p>附件</p>
                      <FileListView list={item.files} />
                    </div>
                  )}
                  {item.commentMessages && item.commentMessages.length > 0 && (
                    <List
                      className="report_view_list"
                      itemLayout="horizontal"
                      dataSource={viewList(item)}
                      renderItem={(item: any) => (
                        <li>
                          <Comment avatar={item.avatar} content={item.content} datetime={item.datetime} />
                        </li>
                      )}
                    />
                  )}
                </div>
              </div>
            ))}
        </Spin>
      </Modal>
      {detailHistory.visible && (
        <ReportHistoryModel
          param={{ ...detailHistory, type: 1 }}
          setvisible={(state: any) => {
            setDetailHistory({ ...detailHistory, visible: state })
          }}
        />
      )}
    </>
  )
}
