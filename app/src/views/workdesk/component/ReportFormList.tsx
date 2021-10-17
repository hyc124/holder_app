import React, { useEffect, useState } from 'react'
import { Tooltip, Spin } from 'antd'
import { ipcRenderer } from 'electron'
import './TargetKanban.less'
import { useSelector, shallowEqual } from 'react-redux'
import NoneData from '@/src/components/none-data/none-data'
import { queryFollowReport } from '../getData'
import { judeNoDataImg } from './TaskList'
import FollowReportModal from './FollowReportModal'
interface ItemProps {
  groupId: number
  id: number
  title: string
  orgId: number
  type: number
  logo?: string
}
interface ItemMoreProps {
  orgId: number
  title: string
  eventModelList: []
}
interface ModuleProps {
  groupId: number
  baseFormName: string
  baseFormId: number
  orgId: number
  logo?: string
  type: number
}

let refreshForm: any = null
export const refreshReportForm = () => {
  if (refreshForm) refreshForm()
}

const ReportFormList = ({ isFollow }: { isFollow?: boolean }) => {
  // 选择的企业id
  const selectTeamId = useSelector((state: StoreStates) => state.selectTeamId, shallowEqual)
  const followSelectTeadId = useSelector((state: StoreStates) => state.followSelectTeadId)
  const teamId = !isFollow ? selectTeamId : followSelectTeadId
  // 关注的台账的数据
  const [data, setData] = useState<any>([])
  // 添加关注模态框
  const [modalValue, setModalValue] = useState({ modalVisible: false, orgId: 0 })
  // loading状态
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    ipcRenderer.on('refresh_standing_book', () => {
      queryReportForm()
    })
  }, [])

  //防止内存泄漏
  let isUnmounted = false
  useEffect(() => {
    queryReportForm()
    return () => {
      isUnmounted = true
    }
  }, [teamId])

  refreshForm = () => {
    queryReportForm()
  }

  const queryReportForm = () => {
    setLoading(true)
    const orgId = selectTeamId === -1 || isNaN(selectTeamId) ? '' : selectTeamId
    queryFollowReport(orgId)
      .then((resData: any) => {
        if (!isUnmounted) {
          if (teamId !== -1) {
            if (resData.length) {
              const data = resData[0].eventModelList
              data.map((item: any) => {
                item.orgId = resData[0].orgId
              })
              setData(data)
            } else {
              setData([])
            }
          } else {
            setData(resData)
          }
        }
      })
      .finally(() => {
        setLoading(false)
      })
  }

  // 添加关注的台账
  const handleModalVisible = (visible: boolean, orgId?: number) => {
    setModalValue({ modalVisible: visible, orgId: orgId ? orgId : selectTeamId })
  }

  // 添加关注后刷新列表
  const refreshFollowList = () => {
    queryReportForm()
  }

  return (
    <Spin spinning={loading} tip="加载中请稍后...">
      <div className="report_table">
        {teamId !== -1 ? (
          <div className="report_class_content">
            {data.map((item: ItemProps, index: number) => (
              <ModuleItem
                key={index}
                groupId={item.groupId}
                baseFormId={item.id}
                orgId={item.orgId}
                baseFormName={item.title}
                logo={item.logo || ''}
                type={item.type}
              />
            ))}
            {!isFollow && (
              <div className="follow_add">
                <i className="report_add_icon" onClick={() => handleModalVisible(true)}></i>
                <div className="report_add_text">添加关注</div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ width: '100%', height: '100%' }}>
            {data.length === 0 && (
              <NoneData
                imgSrc={judeNoDataImg('report_form').imgSrc}
                showTxt={judeNoDataImg('report_form').showTxt}
                imgStyle={{ width: 74, height: 71 }}
              />
            )}
            {data.map((row: ItemMoreProps, index: number) => (
              <section className="report_class" key={index}>
                <div className="report_class_name">{row.title}</div>
                <div className="report_class_content">
                  {row.eventModelList?.map((item: ItemProps, index: number) => (
                    <ModuleItem
                      key={index}
                      orgId={row.orgId}
                      groupId={item.groupId}
                      baseFormId={item.id}
                      baseFormName={item.title}
                      logo={item.logo || ''}
                      type={item.type}
                    />
                  ))}
                  <div className="follow_add">
                    <i className="report_add_icon" onClick={() => handleModalVisible(true, row.orgId)}></i>
                    <div className="report_add_text">添加关注</div>
                  </div>
                </div>
              </section>
            ))}
          </div>
        )}
        {modalValue.modalVisible && (
          <FollowReportModal
            visible={modalValue.modalVisible}
            handleModalVisible={handleModalVisible}
            refreshFollowList={refreshFollowList}
            orgId={modalValue.orgId}
          />
        )}
      </div>
    </Spin>
  )
}

export default ReportFormList

//单个台账组件
const ModuleItem = ({ type, groupId, baseFormName, baseFormId, orgId, logo }: ModuleProps) => {
  const [loading, setBtnLoading] = useState(false)
  //点击台账查看详情
  const showReportTableDetail = () => {
    setBtnLoading(true)
    $store.dispatch({
      type: 'SET_BUSINESS_INFO',
      data: {
        type: type,
        key: `${orgId}-${groupId}-${baseFormId}`,
        id: baseFormId,
        title: baseFormName,
        baseFormId,
        baseFormName,
        orgId,
        groupId,
        logo,
      },
    })
    $tools.createWindow('BusinessData').finally(() => {
      setBtnLoading(false)
    })
  }
  // 台账图标
  const src = $tools.asAssetsPath(`/images/approval/${logo ? logo : 'icon_05.png'}`)
  const img = <img src={src} />
  return (
    <div
      className="report_table_ul_item"
      onClick={() => {
        showReportTableDetail()
      }}
    >
      <Spin wrapperClassName="report_table_ul_item_loading" spinning={loading}>
        <div className={`report_item_icon`}>
          {img}
          {/* <span className={`${type === 1 ? 'color_yellow' : 'color_blue'} report_label`}>
            {type === 1 ? '台账' : '统计'}
          </span> */}
        </div>
        <Tooltip placement="topLeft" title={baseFormName}>
          <div className="report_item_name">{baseFormName}</div>
        </Tooltip>
      </Spin>
    </div>
  )
}
