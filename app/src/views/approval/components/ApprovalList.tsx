import React, { useState, useEffect, useRef } from 'react'
import InfiniteScroll from 'react-infinite-scroller'
import { List, Avatar, Spin, Input, Tooltip, Radio, message, DatePicker, Dropdown } from 'antd'
import NoneData from '@/src/components/none-data/none-data'
import { SelectMemberOrg } from '@/src/components/select-member-org/index'
import $c from 'classnames'
import { SearchOutlined, CloseOutlined } from '@ant-design/icons'
import { ipcRenderer } from 'electron'
import { setNoticeRead } from './ApprovalDettail'
import moment from 'moment'
const { RangePicker } = DatePicker
interface ListProps {
  name: string
  activeKey?: number
  uuid: string
  itemClick: (item: ApprovalListItemProps | null) => void
  unReadCount: number
}

interface ApprovalListDataProps {
  totalPages: number
  totalElements: number
  content: any[]
}
//审批列表数据
export interface ApprovalListItemProps {
  id: number
  name: string
  profile: string
  userId: number
  teamId: number
  belongType: string
  user: string
  userprofile: string
  time: string
  state: number
  currentProcess: string
  noticeId?: number
  noticeRead: number
  custom: string
  taskKey: string
  urge: number
  taskId?: number
  executeTime?: string
  approvalTime: string
  isTouch: number
  waitingTime: {
    year: number
    day: number
    hour: number
    minute: number
  }
  isRead: number
  approvalType: number
}

//根据状态返回审批状态字段
export const getStatusTxtByState = (state: number) => {
  let statusTxt = '待审批'
  let statusColor = '#FBBC05'
  if (state === 1) {
    statusTxt = '已通过'
    statusColor = '#34A853'
  } else if (state === 2) {
    statusTxt = '已拒绝'
    statusColor = '#EA4335'
  } else if (state === 3) {
    statusTxt = '已撤回'
    statusColor = '#EA4335'
  } else if (state === 4) {
    statusTxt = '已回退'
    statusColor = '#EA4335'
  } else if (state === 7) {
    statusTxt = '待发起'
    statusColor = '#EA4335'
  } else if (state === 8) {
    statusTxt = '知会'
    statusColor = '#EA4335'
  } else if (state === 5) {
    statusTxt = '已终止'
    statusColor = '#EA4335'
  }
  return {
    txt: statusTxt,
    color: statusColor,
  }
}
let selectPerson: any[] = []
//处理已选择成员展示
let nodeSelecteds: any[] = selectPerson.map((item: any) => {
  return {
    userId: item.userId,
    userName: item.userName,
    account: item.account,
    curId: parseInt(item.userId),
    curName: item.userName || '',
    curType: 0,
    parentId: item.roleId || '',
    parentName: item.roleName || '',
    deptId: item.deptId || '',
    deptName: item.deptName || '',
    roleId: item.roleId || '',
    roleName: item.roleName || '',
    profile: item.profile || '',
    cmyId: item.teamId,
    cmyName: item.teamName,
  }
})
/**
 * 根据name获取请求列表type
 */
const getTypeByName = (name: string) => {
  let type = 0
  if (name === 'mySendApproval') {
    type = 1
  } else if (name === 'noticeMeApproval') {
    type = 2
  } else if (name === 'approvaledList') {
    type = 3
  } else if (name === 'rejectApproval') {
    type = 4
  } else if (name === 'triggerApproval') {
    type = 7
  }
  return type
}

/**
 * 审批列表
 */
const ApprovalList = (props: ListProps) => {
  const { name, activeKey, uuid, itemClick, unReadCount } = props
  const { nowUserId, loginToken, sendApprovalInfo } = $store.getState()
  //审批列表loading
  const [listLoading, setListLoading] = useState(false)
  //是否有加载更多
  const [hasMore, setHasMore] = useState(true)
  //审批列表数据
  const [approvalList, setApprovalList] = useState<Array<ApprovalListItemProps>>([])
  const listDataRef = useRef<any>([])
  //审批列表分页
  const [listPageNo, setListPageNo] = useState(0)
  //审批列表总页数
  const [totalPages, setTotalPages] = useState(0)
  //关键字搜索列表
  const [keywords, setKeyWords] = useState('')
  //左侧列表是否收起
  const [closeLeft, setCloseLeft] = useState(false)
  const listRef = useRef<any>(null)
  const unReadMsg: any = localStorage.getItem('APPROVAL_UNREAD_STATUS')
  const unReadMsgInfo: any[] = JSON.parse(unReadMsg)
  const [readStatus, isReadStatus] = useState(false)
  // 审批筛选改变状态
  const [screenVal, setScreenVal] = useState(false)
  // 审批筛选级别选中值
  const [levelVal, setLevelVal] = useState(-1)
  // 发起时间范围筛选
  const [launchTime, setLaunchTime] = useState({ startTime: '', endTime: '' })
  // 收到时间范围筛选
  const [receivedTime, setReceivedTime] = useState({ startTime: '', endTime: '' })
  //显示选择的岗位列表
  const [visible, setVisible] = useState(false)
  //筛选框是否有值
  const [checkVal, setCheckVal] = useState(false)
  // 发起人列表数据
  const [launchData, setLaunchData] = useState([])
  // 切换图标
  const [bgChageVal, setBgChageVal] = useState(false)

  //初始化
  useEffect(() => {
    ipcRenderer.on('change_list_item_status', (event, args) => {
      const { approvalId } = args
      const newApprovalList = listDataRef.current.map((item: { id: any; state: number; isRead: number }) => {
        if (item.id === approvalId && name !== 'noticeMeApproval') {
          item.state = 3
        } else if (item.id === approvalId && name === 'noticeMeApproval') {
          // 知会我的红点刷新
          item.isRead = 1
        }
        return item
      })
      setApprovalList(newApprovalList)
    })
  }, [])

  useEffect(() => {
    $store.dispatch({ type: 'LOCAL_READ_STATUS', data: readStatus })
  }, [readStatus])

  //列表更新
  useEffect(() => {
    const type = getTypeByName(name)
    setListLoading(true)
    setListPageNo(0)
    setHasMore(true)
    $(listRef.current).scrollTop(0)

    // 取本地缓存记录（知会我的——已读未读状态）
    let _status = readStatus
    if (type === 2 && unReadMsg && unReadMsgInfo.length) {
      const obj: any = checkhasUser(unReadMsgInfo)
      if (obj !== '') {
        isReadStatus(obj.readStatus)
        _status = obj.readStatus
      }
    }

    fetchApprovalList(type, 0, _status)
      .then(data => {
        listDataRef.current = data.content
        setApprovalList(data.content)
        //选中指定审批列表
        const { createApprovalInfo } = $store.getState()
        const selectItem = data.content.filter(item => item.id === createApprovalInfo)
        if (selectItem.length != 0) {
          itemClick(selectItem[0])
        } else {
          data.content.length !== 0 ? itemClick(data.content[0]) : itemClick(null)
        }

        setTotalPages(data.totalPages)
      })
      .finally(() => {
        setListLoading(false)
      })
  }, [keywords, uuid, launchTime, receivedTime, levelVal, launchData])

  useEffect(() => {
    checkValue()
  }, [levelVal, receivedTime, launchTime, launchData])
  //查询审批列表
  const fetchApprovalList = (type: number, listPageNo: number, flag?: boolean) => {
    return new Promise<ApprovalListDataProps>(resolve => {
      const param: any = {
        userId: nowUserId,
        type: type,
        keywords: keywords,
        pageNo: listPageNo,
        pageSize: 20,
        isPhone: 0,
      }
      let url: string = '/approval/approval/queryApprovalInfoPage'
      var header: any = { loginToken: loginToken }
      let formData: boolean = true
      if (
        name == 'waitApproval' ||
        name == 'noticeMeApproval' ||
        name == 'mySendApproval' ||
        name == 'approvaledList'
      ) {
        // 筛选创建时间
        param.createStartTime = launchTime.startTime
        param.createEndTime = launchTime.endTime
        // 筛选发起时间
        param.startTime = receivedTime.startTime
        param.endTime = receivedTime.endTime
        // 筛选选择状态
        param.approvalStatus = levelVal == -1 ? null : levelVal
        // 筛选选择的发起人
        param.userScreenModels = []
        launchData.map((item: any) => {
          param.userScreenModels.push({
            typeId: Number(item.curId),
            type: item.curType == 3 ? 30 : item.curType == 4 ? 5 : item.curType,
          })
        })
        // 有筛选情况修改接口名字以及 接口参数
        url = '/approval/approval/queryApprovalListByCondition'
        header = { loginToken: loginToken, 'Content-Type': 'application/json' }
        formData = false
      }

      if (type === 2 && flag) {
        param.isRead = 0
      }

      $api
        .request(url, param, {
          headers: header,
          formData: formData,
        })
        .then(resData => {
          resolve(resData.data)
        })
        .catch(err => {
          setHasMore(false)
        })
    })
  }

  //滚动加载列表数据
  const handleInfiniteOnLoad = () => {
    setListLoading(true)
    if (listPageNo + 1 >= totalPages) {
      setListLoading(false)
      setHasMore(false)
      return
    }
    const type = getTypeByName(name)
    fetchApprovalList(type, listPageNo + 1, readStatus)
      .then(data => {
        setListPageNo(listPageNo + 1)
        listDataRef.current = [...approvalList, ...data.content]
        setApprovalList([...approvalList, ...data.content])
      })
      .finally(() => {
        setListLoading(false)
      })
  }

  //输入框搜索关键字
  const getListByKeyWord = (value: string) => {
    setKeyWords(value)
  }

  //左侧自动收起展开
  const toggleLeftPane = () => {
    setCloseLeft(!closeLeft)
    $('.flow-container .postil_scale').animate({ left: (closeLeft ? 340 : 136) + 'px' })
  }

  const checkhasUser = (arr: Array<any>) => {
    let hasUser = ''
    for (let i = arr.length; i--; ) {
      if (arr[i].userId === nowUserId) {
        hasUser = arr[i]
        break
      }
    }
    return hasUser
  }
  //输入框聚焦时展开
  const focusSearchForm = () => {
    setCloseLeft(false)
  }
  const filterReadStatus = () => {
    setListPageNo(0)

    setListLoading(true)
    setHasMore(true)
    $(listRef.current).scrollTop(0)

    //本地缓存未读数据
    const unReadMsg: any = localStorage.getItem('APPROVAL_UNREAD_STATUS')
    const unReadMsgInfo: any[] = JSON.parse(unReadMsg)
    if (unReadMsg && unReadMsgInfo.length > 0) {
      if (!checkhasUser(unReadMsgInfo)) {
        unReadMsgInfo.push({
          userId: nowUserId,
          readStatus: !readStatus,
        })
        localStorage.setItem('APPROVAL_UNREAD_STATUS', JSON.stringify(unReadMsgInfo))
      } else {
        const newArr = unReadMsgInfo.map(item => {
          if (item.userId === nowUserId) {
            item.readStatus = !readStatus
          }
          return item
        })
        localStorage.setItem('APPROVAL_UNREAD_STATUS', JSON.stringify(newArr))
      }
    } else {
      localStorage.setItem(
        'APPROVAL_UNREAD_STATUS',
        JSON.stringify([
          {
            userId: nowUserId,
            readStatus: !readStatus,
          },
        ])
      )
    }

    fetchApprovalList(2, 0, !readStatus)
      .then(data => {
        listDataRef.current = data.content
        setApprovalList(data.content)
        //选中指定审批列表
        const { createApprovalInfo } = $store.getState()
        const selectItem = data.content.filter(item => item.id === createApprovalInfo)
        if (selectItem.length != 0) {
          itemClick(selectItem[0])
        } else {
          data.content.length !== 0 ? itemClick(data.content[0]) : itemClick(null)
        }

        setTotalPages(data.totalPages)
      })
      .finally(() => {
        setListLoading(false)
      })
  }
  const setReadMark = () => {
    setNoticeRead()
      .then(() => {
        message.success('操作成功！')
        ipcRenderer.send('refresh_approval_count')
      })
      .catch(() => {
        message.error('操作失败，请重试')
      })
  }
  const levelTyprArr = [
    {
      tit: '待审批',
      idx: 0,
    },
    {
      tit: '已通过',
      idx: 1,
    },
    {
      tit: '已拒绝',
      idx: 2,
    },
    {
      tit: '已撤回',
      idx: 3,
    },
  ]
  // 筛选框的发起人删除
  const deleteLaunchOp = (ite: any, index: number) => {
    const data = [...launchData]
    data.splice(index, 1)
    setLaunchData(data)
  }
  // 检查筛选框是否有值
  const checkValue = () => {
    if (
      (receivedTime.startTime && receivedTime.endTime) ||
      (launchTime.startTime && launchTime.endTime) ||
      levelVal != -1 ||
      (launchData && launchData.length > 0)
    ) {
      setCheckVal(true)
    } else {
      setCheckVal(false)
    }
  }
  const initScreenVal = () => {
    if (checkVal) {
      setLaunchTime({ startTime: '', endTime: '' })
      setReceivedTime({ startTime: '', endTime: '' })
      setLevelVal(-1)
      setLaunchData([])
    }
  }
  // 筛选弹框内容
  const menu = (
    <div className="screenTable">
      {/* 级别 */}

      {name != 'waitApproval' && (
        <div className="levelType">
          <div className="levelTitle">
            级别:<span>(单选)</span>{' '}
          </div>
          <div className="levelTypeOp">
            {levelTyprArr.map((item, index) => {
              return (
                (item.idx != 3 || name == 'mySendApproval') && (
                  <div
                    className={levelVal == item.idx ? 'selectSty' : ''}
                    key={index}
                    onClick={() => {
                      if (levelVal == item.idx) {
                        setLevelVal(-1)
                      } else {
                        setLevelVal(item.idx)
                      }
                    }}
                  >
                    {item.tit}
                  </div>
                )
              )
            })}
          </div>
        </div>
      )}
      {/* 发起时间 */}
      <div className="levelType">
        <div className="levelTitle">发起时间</div>
        <RangePicker
          placeholder={['开始时间', '结束时间']}
          allowClear
          className="dataPicker"
          format="YYYY/MM/DD"
          value={
            launchTime.startTime
              ? [moment(launchTime.startTime, 'YYYY/MM/DD'), moment(launchTime.endTime, 'YYYY/MM/DD')]
              : null
          }
          onChange={(date: any, dateString: any) => {
            setLaunchTime({ startTime: dateString[0], endTime: dateString[1] })
          }}
        />
      </div>
      {/* 收到时间 */}
      <div className="levelType">
        <div className="levelTitle">
          {name == 'mySendApproval' ? '完成时间' : name == 'approvaledList' ? '处理时间' : '收到时间'}
        </div>
        <RangePicker
          placeholder={['开始时间', '结束时间']}
          allowClear
          className="dataPicker"
          format="YYYY/MM/DD"
          value={
            receivedTime.startTime
              ? [moment(receivedTime.startTime, 'YYYY/MM/DD'), moment(receivedTime.endTime, 'YYYY/MM/DD')]
              : null
          }
          onChange={(date: any, dateString: any) => {
            console.log(date, dateString)
            setReceivedTime({ startTime: dateString[0], endTime: dateString[1] })
          }}
        />
      </div>
      {/* 发起人 */}
      {name != 'mySendApproval' && (
        <div className="levelType">
          <div className="levelTitle">发起人</div>
          <div className="launchBox">
            <span
              className={`${launchData.length > 0 ? 'checkBColor' : 'checkGColor'}`}
              onClick={() => {
                setVisible(true)
              }}
            >
              <img
                src={
                  launchData && launchData.length > 0
                    ? $tools.asAssetsPath('/images/workdesk/pushlishCon_h.png')
                    : $tools.asAssetsPath('/images/workdesk/pushlishCon.png')
                }
                alt=""
              />
            </span>
            <div>
              {launchData &&
                launchData.map((ite: any, index: number) => {
                  return (
                    <Tooltip
                      title={ite.showName || ite.curName}
                      overlayStyle={{
                        display: ite.curType != 0 && ite.showName && ite.showName.length > 12 ? '' : 'none',
                      }}
                      key={index}
                    >
                      <div className="launchOp">
                        <div>{ite.curType == 0 ? ite.curName : ite.showName}</div>
                        <CloseOutlined
                          className="closeLaunch"
                          onClick={() => {
                            deleteLaunchOp(ite, index)
                          }}
                        />
                      </div>
                    </Tooltip>
                  )
                })}
            </div>
          </div>
        </div>
      )}
      {/* 重置 */}
      <div className="buttonBox">
        <div
          onClick={() => {
            initScreenVal()
          }}
        >
          {/* <img src={$tools.asAssetsPath('/images/company/figure_icon.png')} /> */}
          <img
            src={
              checkVal
                ? $tools.asAssetsPath('/images/workdesk/Refresh.png')
                : $tools.asAssetsPath('/images/workdesk/Refresh_nodata.png')
            }
            alt=""
          />
          <div className={checkVal ? 'refreshColor' : ''}>重置</div>
        </div>
      </div>
    </div>
  )
  return (
    <div className={$c('left-panel flex column', { closeLeft: closeLeft })}>
      <div className="approval-list-header">
        <Input.Search
          className="search-form"
          placeholder={'姓名/审批事件名称/表单编号'}
          onFocus={focusSearchForm}
          onSearch={getListByKeyWord}
        />
        {!closeLeft && name != 'triggerApproval' && (
          <Dropdown
            overlay={menu}
            trigger={['click']}
            visible={screenVal}
            onVisibleChange={e => {
              setScreenVal(e)
              checkValue()
            }}
          >
            {/* bgChageVal, setBgChageVal */}
            <div
              className="screenBox"
              onMouseOver={(e: any) => {
                setBgChageVal(true)
              }}
              onMouseOut={() => {
                setBgChageVal(false)
              }}
            >
              {checkVal && (
                <img className="screenOk" src={$tools.asAssetsPath('/images/workdesk/screenOk.png')} alt="" />
              )}
              <img
                src={
                  screenVal || bgChageVal
                    ? $tools.asAssetsPath('/images/workdesk/select_mu_h.png')
                    : $tools.asAssetsPath('/images/workdesk/select_mu.png')
                }
                alt=""
              />
            </div>
          </Dropdown>
        )}
      </div>
      {name === 'noticeMeApproval' && !closeLeft && (
        <div className="approval-setRead-status">
          <div className="setRead-status">
            <Radio
              // disabled={unReadCount > 0 ? false : true}
              checked={readStatus}
              onClick={() => {
                isReadStatus(!readStatus)
                filterReadStatus()
              }}
            >
              仅查看未读
            </Radio>
          </div>
          <div
            className={`setRead-mark ${unReadCount > 0 ? '' : 'unClickColor'}`}
            onClick={() => {
              setReadMark()
            }}
          >
            标记全部已读
          </div>
        </div>
      )}
      <div className="approval-list" ref={listRef}>
        <InfiniteScroll
          initialLoad={false}
          pageStart={0}
          loadMore={handleInfiniteOnLoad}
          useWindow={false}
          hasMore={!listLoading && hasMore}
          style={{ height: '100%' }}
        >
          <List
            dataSource={approvalList}
            locale={{ emptyText: !closeLeft ? <NoneData /> : ' ' }}
            renderItem={item => {
              const titleTxt = `${
                (name === 'triggerApproval' && item.state == 7) || (item.isTouch && item.isTouch === 1)
                  ? '【触发】'
                  : ''
              }${$tools.htmlDecodeByRegExp(item.name)}${
                item.custom && item.custom !== '' ? `【${item.custom}】` : ''
              }`
              return (
                <List.Item
                  key={item.id}
                  onClick={() => {
                    itemClick(item)
                  }}
                  className={$c('flex approval-list-item', { active: activeKey === item.id })}
                >
                  <div className="approval-item-container flex center-v">
                    {/* {item.isRead === 0 && name === 'noticeMeApproval' && <span className="redDot"></span>} */}
                    <span
                      className={item.isRead === 0 && name === 'noticeMeApproval' ? 'redDot' : 'whiteDot'}
                    ></span>
                    <Avatar className="oa-avatar" src={item.profile}>
                      {item.user.substr(-2, 2)}
                    </Avatar>
                    <div className="approval-item-content flex-1 flex column">
                      {titleTxt.length > 14 && (
                        <Tooltip title={titleTxt}>
                          <span className="approval-name text-ellipsis">{titleTxt}</span>
                        </Tooltip>
                      )}
                      {titleTxt.length <= 14 && <span className="approval-name text-ellipsis">{titleTxt}</span>}
                      <div className="approval-bottom">
                        <span className="approval-time text-ellipsis">
                          {$tools.handleTimeToUse(item.approvalTime || item.time)}
                        </span>
                        {name !== 'waitApproval' && (
                          <span
                            className="approval-status"
                            style={{
                              borderColor: getStatusTxtByState(item.state).color,
                              color: getStatusTxtByState(item.state).color,
                            }}
                          >
                            {getStatusTxtByState(item.state).txt}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </List.Item>
              )
            }}
          ></List>
        </InfiniteScroll>
        {listLoading && hasMore && (
          <div className="approval-list-spin text-center p-8">
            <Spin></Spin>
          </div>
        )}
      </div>
      <div className="left-side-button" onClick={toggleLeftPane}></div>
      {/* 选择成员 */}
      {visible && (
        <SelectMemberOrg
          param={{
            visible: visible,
            checkboxType: 'checkbox',
            selectList: [...launchData],
            isOuterSystem: 0,
            useExternal: true,
            onSure: (datas: any) => {
              setScreenVal(true)
              setLaunchData(datas)

              // launchData, setLaunchData
            },
            onClose: (data: any) => {
              if (!data) {
                setScreenVal(true)
              }
            },
            showPrefix: {
              //是否显示成员的部门岗位前缀
              dept: true, //部门
              role: true, //岗位
              company: true, //企业前缀
            },
          }}
          action={{
            setModalShow: setVisible,
          }}
        />
      )}
    </div>
  )
}

export default ApprovalList
