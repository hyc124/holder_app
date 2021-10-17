import React, { useState, useEffect } from 'react'
import { Dropdown, message, Spin, Menu } from 'antd'
import './work-plan-mind.less'
import moment from 'moment'
import InfiniteScroll from 'react-infinite-scroller'
import NoneData from '@/src/components/none-data/none-data'
import { findEditMember } from '../workplan/WorkPlanOpt'
import SubMenu from 'antd/lib/menu/SubMenu'
let dataListlen = 0
let refJurisdiction: any = null
export const refJurisdictions = () => {
  refJurisdiction()
}
const WorkPlanMindoperate = (props: any) => {
  const { nowUserId, nowAccount, nowUser, loginToken } = $store.getState()
  //优先级显示隐藏
  const [logvis, setLogvis] = useState<any>(false)
  //加载
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [authList, setauthList] = useState<any>([])
  //操作日志数据
  const [loglist, setLoglist] = useState<any>([])
  //是否有权限操作
  const [draftAuth, setdraftAuth] = useState<any>('false')
  useEffect(() => {
    if (props.mindId != '') {
      jurisdictionFn()
    }
  }, [props.mindId])
  refJurisdiction = () => {
    jurisdictionFn()
  }
  //操作日志
  const optRecordlist = (times: any) => {
    setLoading(true)
    setHasMore(true)
    const pageSize = 8
    const param = {
      mainId: props.mindId,
      operateUser: nowUserId,
      pageSize: pageSize,
      pageTime: times || '',
    }
    $api
      .request('/task/work/plan/findLog', param, {
        headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
      })
      .then(resData => {
        setLoading(false)
        const dataList = resData.dataList || []
        dataListlen = dataList.length
        setLoglist([...loglist, ...dataList])
      })
      .catch(function(res) {
        setLoading(false)
        message.error(res.returnMessage)
      })
  }
  //滚动加载
  const handleInfiniteOnLoad = () => {
    setLoading(true)
    if (dataListlen >= 8) {
      const times = moment(loglist[loglist.length - 1].createTime).format('YYYY/MM/DD HH:mm')
      optRecordlist(times)
    } else {
      setLoading(false)
      setHasMore(false)
    }
  }
  //权限菜单
  const menus = () => {
    return (
      <Menu
        className="workmindItem"
        onClick={(menuProp: any) => {
          menuClick(menuProp)
        }}
      >
        <Menu.Item key="0">
          <div className="myMenuItem">
            <span>编辑权限</span>
          </div>
        </Menu.Item>
        {/* <SubMenu title="共享" key="sub2" popupClassName="myDropMenu subMenu">
          <Menu.Item key="5">
            <div className="myMenuItem">
              <span>共享到人</span>
            </div>
          </Menu.Item>
          <Menu.Item key="6">
            <div className="myMenuItem">
              <span>共享到群</span>
            </div>
          </Menu.Item>
        </SubMenu> */}
        <Menu.Item key="1">
          <div className="myMenuItem">
            <span>删除</span>
          </div>
        </Menu.Item>
      </Menu>
    )
  }
  const menuClick = (menuProp: any) => {
    switch (menuProp.key) {
      case '1': //删除规划
        props.callbackFn('remove')
        break
      case '0': //编辑权限
        props.callbackFn('jurisdiction', authList)
        break
      case '5': //共享到人
        props.callbackFn('share-1')
        break
      case '6': //共享到群
        props.callbackFn('share-2')
        break
      default:
        break
    }
  }
  //编辑权限
  const jurisdictionFn = () => {
    const sourceItem = $store.getState().mindMapData || {}
    findEditMember({
      id: sourceItem.id,
      mainId: sourceItem.mainId,
    }).then((dataList: any) => {
      const newList: any = []
      dataList.map((item: any) => {
        let disable = false
        const obj: any = {
          curId: item.id,
          curName: item.name,
          curType: 0,
        }
        // 责任人或创建人不可删除
        if (item.isDel == 0) {
          disable = true
        }
        obj.disable = disable
        newList.push(obj)
      })
      setauthList(newList)
    })
    const draftAuth = jQuery('.OKR_map_content').attr('data-auth') //'true'有操作权限--草稿
    setdraftAuth(draftAuth)
  }
  return (
    <div className="WorkPlanMindoperate">
      {/* 定位 */}
      <div className="postil_scale">
        <div className="scale-location">
          <span></span>
        </div>
        <div className="scale-zoom">
          <span className="scale-zoom-plus"></span>
          <i>100%</i>
          <span className="scale-zoom-minus"></span>
        </div>
      </div>
      {/* 操作 */}
      <div className="postil_resource">
        {/* 操作日志 */}
        <Dropdown
          visible={logvis}
          trigger={['click']}
          placement="topLeft"
          overlay={
            <div className="okrMindLogBox optRecordBox">
              <div className="header_title">操作日志</div>
              <div className="logBodycontent">
                <InfiniteScroll
                  initialLoad={false} // 不让它进入直接加载
                  hasMore={!loading && hasMore} // 是否继续监听滚动事件 true 监听 | false 不再监听
                  loadMore={handleInfiniteOnLoad} // 监听的ajax请求
                  useWindow={false} // 不监听 window 滚动条
                >
                  <Spin spinning={loading} tip={'加载中，请耐心等待'}>
                    <section className="logBody">
                      {loglist.length > 0 ? (
                        loglist.map((item: any, index: number) => {
                          let perChange = 'up'
                          let conclusion = item.conclusion || ''
                          if (!conclusion) {
                            perChange = 'noshow'
                          } else if (conclusion.includes('-')) {
                            perChange = 'down'
                            conclusion = item.conclusion.replace('-', '')
                          }
                          return (
                            <div className="optRecordItem" key={index}>
                              <span className="img_icon dot_icon"></span>
                              <p>{moment(item.createTime).format('YYYY/MM/DD HH:mm')}</p>
                              <div className="log_record">
                                <span className="user_name blue_color">{item.operateUsername}</span>
                                <span className="opt_txt">{item.description}</span>
                                <div className={`per_change ${perChange}`}>
                                  <i className="img_icon per_change_icon"></i>
                                  <span className="per_num blue_color">{conclusion}</span>
                                </div>
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <NoneData></NoneData>
                      )}
                    </section>
                  </Spin>
                </InfiniteScroll>
              </div>
            </div>
          }
          onVisibleChange={(flag: boolean) => {
            setLogvis(flag)
            setLoglist([])
            if (flag) {
              setTimeout(() => {
                optRecordlist('')
              }, 300)
            }
          }}
        >
          <div className="OKR_map_log">
            <span className="img_icon log_entry_icon log_icon"></span>
          </div>
        </Dropdown>
        {/* 权限 */}
        {draftAuth == 'true' && (
          <Dropdown
            trigger={['click']}
            placement="topLeft"
            overlay={() => {
              return menus()
            }}
            className="workmindItem"
          >
            <div className="OKR_map_operation">
              <span className="img_icon log_entry_icon operation_icon"></span>
              <ul className="optBtnMenu more_btn_box"></ul>
            </div>
          </Dropdown>
        )}
      </div>
    </div>
  )
}

export default WorkPlanMindoperate
