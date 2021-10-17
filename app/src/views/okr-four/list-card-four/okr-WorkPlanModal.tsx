/**
 * 规划右键或更多按钮操作
 */
import React, { useState, useEffect, useContext, useRef, useImperativeHandle } from 'react'
import { Modal, Button, Table, Checkbox, Spin } from 'antd'
import NoneData from '@/src/components/none-data/none-data'
import { requestApi } from '@/src/common/js/ajax'
import { moveToDirSave, delFolder, delPlan, shareToRoomSave } from '../../workplan/WorkPlanOpt'
import { planContext } from './okr-workplan'
import { shareToRoom } from '@/src/common/js/api-com'
import {DelPlanModal} from '../../workplan/WorkPlanModal'
// 规划模式上下文数据
// 注：state设置为异步，上下文里数据用的state可能还没及时更改，所以加载完成后的操作才适合用此数据
let planContextObj: any

/**
 * 规划弹框容器（此处是规划所需弹框集合，但单个弹框也可以单独按需引用）
 */
export const WorkPlanModal = (props: any) => {
  planContextObj = useContext(planContext)
  return (
    <section>
      <MovePlanModal props={props} />
      <DelPlanModal props={props} dataItem={$store.getState().planModalObj.sourceItem || {}} refreshData={planContextObj.refreshData}/>
      <ShareToRoomModal props={props} isclcallback={false} isclcallbackFn={() => {}} />
    </section>
  )
}

/*******************************移动到文件夹***********************************/

/**
 * 移动到文件夹列表渲染
 * @param props
 */
export const MoveToDirlist = (props: any) => {
  const folderPosList = planContextObj.folderPosList
  // 当前所在文件夹位置
  const folderPos = folderPosList[folderPosList.length - 1]

  // 父组件方法
  const ptAction = props.action
  const [listData, setListData] = useState<any>([])
  /**
   * 文件名列
   * @param props
   */
  const DirNameCol = (props: any): any => {
    const item = props.itemData || {}
    return (
      <div className={'cellCont flex between'}>
        <div className="rowLeft flex center-v flex-1">
          <div className="row_content flex-1">
            <em className="img_icon dir_icon"></em>
            <span className="dir_name my_ellipsis">{item.name}</span>
          </div>
        </div>
        <div className="rowRight">
          <span className={`now_pos_msg ${folderPos.id == item.id ? '' : 'forcedHide'}`}>
            {$intl.get('currentLocation')}
          </span>
        </div>
      </div>
    )
  }
  const selectRow = (item: any) => {
    ptAction.setSelectRow(item)
    updateTableParam(listData, item.id, 'active')
    setListData([...listData])
  }
  /**
   * 查询第一层文件夹列表数据
   */
  const findDirListFirst = () => {
    const param: any = {
      userId: $store.getState().nowUserId,
      zone: planContextObj.planType,
    }
    requestApi({
      url: '/task/work/plan/folder/list',
      param: param,
    }).then(res => {
      if (res.success) {
        const list = res.data.dataList || []
        setTreeTableData(list)
        // 不能直接传listModeData，必须新插入一个数组[...listModeData]，否则无法及时更新节点上的数据
        setListData([...list])
      }
    })
  }
  /**
   * 处理后台数据为表格树可用数据
   */
  const setTreeTableData = (data: any) => {
    data.map((item: any) => {
      item.key = item.id
      item.dirName = <DirNameCol key={item.id} itemData={item} />
      if (item.folderCount > 0) {
        item.children = []
      }
    })
  }
  const columns = [
    {
      title: $intl.get('name'),
      dataIndex: 'dirName',
      className: 'dirName',
      key: 'name',
    },
  ]
  // const moveToDirObj = useSelector((state: any) => state.moveToDirObj)
  const visible = props.visible

  // 每次显示弹框时查询数据
  useEffect(() => {
    if (visible) {
      findDirListFirst()
    }
  }, [visible])
  useEffect(() => {
    if (props.selRowType == 0) {
      updateTableParam(listData, '', 'active')
      setListData([...listData])
    }
  }, [props.selRowType])

  /**
   * 给树形表格添加新数据
   * @param list
   * @param id
   * @param children
   */
  const updateTreeData = (list: any, id: any, children: any) => {
    return list.map((item: any) => {
      if (item.id === id) {
        item.children = children
      } else if (item.children) {
        return {
          ...item,
          children: updateTreeData(item.children, id, children),
        }
      }
      return item
    })
  }
  /**
   * 更新表格数据中的某个参数值
   * @param list
   */
  const updateTableParam = (list: any, id: any, keyName: string) => {
    return list.map((item: any) => {
      if (item.id === id) {
        item[keyName] = true
        item.dirName = <DirNameCol key={item.id} itemData={item} />
      } else {
        item[keyName] = false
        item.dirName = <DirNameCol key={item.id} itemData={item} />
        if (item.children) {
          return {
            ...item,
            children: updateTableParam(item.children, id, keyName),
          }
        }
      }
      return item
    })
  }
  /**
   * 点击展开图标时触发
   * @param expanded
   * @param row
   */
  const expandNode = (expanded: any, row: any) => {
    if (!expanded || row.children.length > 0) {
      return
    }
    // 请求子节点数据
    const param: any = {
      userId: $store.getState().nowUserId,
      zone: planContextObj.planType,
      id: row.id,
    }
    requestApi({
      url: '/task/work/plan/folder/list',
      param: param,
    }).then(res => {
      if (res.success) {
        const childData = res.data.dataList || []
        setTreeTableData(childData)
        updateTreeData(listData, row.id, childData)
        // 不能直接传listModeData，必须新插入一个数组[...listModeData]，否则无法及时更新节点上的数据
        setListData([...listData])
      }
    })
  }
  /**
   * 展开折叠参数
   */
  const expandable: any = {
    //自定义展开折叠按钮
    expandIcon: ({ expanded, onExpand, record }: any) => {
      if ((record.children && record.children.length > 0) || record.folderCount) {
        if (expanded) {
          return <span className="treeTableIcon img_icon expanded" onClick={e => onExpand(record, e)}></span>
        } else {
          return <span className="treeTableIcon img_icon  collapsed" onClick={e => onExpand(record, e)}></span>
        }
      } else {
        return <span className="treeTableIcon" onClick={e => onExpand(record, e)}></span>
      }
    },
    indentSize: 20, //自定义缩进值
  }

  return (
    <Table
      className="moveToDirTable"
      columns={columns}
      dataSource={listData}
      showHeader={false}
      onExpand={expandNode}
      expandable={expandable}
      locale={{ emptyText: <NoneData /> }}
      rowClassName={(row: any) => {
        let className = ''
        if (row.active) className = 'active'
        return className
      }}
      onRow={(row: any) => {
        return {
          onClick: () => {
            selectRow(row)
          }, // 点击行
        }
      }}
      pagination={false}
    />
  )
}
/**
 * 移动到文件夹弹框
 */
export const MovePlanModal = (props: { props: any }) => {
  const getProps = props.props
  const param = getProps.param
  const action = getProps.action
  const [visible, setVisible] = useState(false)
  const [selRowType, setSelRowType] = useState(1)
  // 名字输入框节点
  const tableRef = useRef({})
  let selectRowItem: any = {}
  const setSelectRow = (item: any, myPlan?: boolean) => {
    selectRowItem = myPlan ? {} : item
    setSelRowType(myPlan ? 0 : 1)
  }
  const handleOk = () => {
    action.setMoveToFolderShow(false)
    const sourceItem = $store.getState().planModalObj.sourceItem || {}
    moveToDirSave(
      {
        id: selectRowItem.id ? selectRowItem.id : 0, //目标文件夹id
        type: 0,
        typeId: sourceItem.id, //被移动对象id
      },
      {
        optType: 'move',
        planContextObj: planContextObj,
      }
    )
  }
  const handleCancel = () => {
    action.setMoveToFolderShow(false)
  }
  useEffect(() => {
    setVisible(param.moveToFolderShow)
  }, [param.moveToFolderShow])
  const folderPosList = planContextObj.folderPosList
  // 当前所在文件夹位置
  const folderPos = folderPosList[folderPosList.length - 1]
  return (
    <Modal
      className="baseModal moveToFolderModal"
      visible={visible}
      title={$intl.get('moveToFolder')}
      onOk={handleOk}
      onCancel={handleCancel}
      footer={[
        <Button key="back" onClick={handleCancel}>
          {$intl.get('cancel')}
        </Button>,
        <Button key="submit" type="primary" onClick={handleOk}>
          {$intl.get('sure')}
        </Button>,
      ]}
    >
      <MoveToDirlist
        visible={visible}
        selRowType={selRowType}
        action={{ setSelectRow: setSelectRow }}
        tableRef={tableRef}
      />
      <div
        className={`myPlanRow planMoveRow flex between ${selRowType == 0 ? 'active' : ''}`}
        onClick={() => {
          setSelectRow({}, true)
        }}
      >
        <div className="rowLeft flex-1">
          <em className="img_icon my_plan_icon"></em>
          <span>{$intl.get('myOKR')}</span>
        </div>
        <div className="rowRight">
          <span className={`now_pos_msg ${folderPos.id == '' ? '' : 'forcedHide'}`}>
            {$intl.get('currentLocation')}
          </span>
        </div>
      </div>
    </Modal>
  )
}

/*******************************共享到群***********************************/
interface RoomItem {
  belongOrg: string
  belongType: string
  belongTypeId: string
  icon: string
  id: string
  muc: string
  subject: string
  talkType: number
  toPerson: Array<string>
  type: string
  checked: any //是否被选中
}
/**
 * 弹框
 * @param props
 */
export const ShareToRoomModal = (props: {
  props: { param: any; action: any }
  isclcallback: any
  isclcallbackFn: any
}) => {
  const getProps = props.props
  const param = getProps.param
  const action = getProps.action
  // 群列表组件
  let roomListRef: any = null
  // 共享群数据
  const [visible, setVisible] = useState(false)
  //   loading显示状态
  const [loading, setLoading] = useState(false)
  // ========点击确认===========//
  const handleOk = () => {
    action.setShareToRoomModalShow(false)
    const { sourceItem, quoteMsg, shareFormType } = $store.getState().planModalObj || {}
    // 获取所有群数据
    const allRoomList = roomListRef.getRoomList()
    // 被选中群
    const selRoomList: any = []
    const selRoomIds: Array<string> = []
    allRoomList.map((item: RoomItem) => {
      if (item.checked) {
        selRoomList.push(item)
        selRoomIds.push(item.id)
      }
    })
    if (props.isclcallback) {
      //支持回调 ---------------------
      props.isclcallbackFn(selRoomList)
      return
    }
    console.log(selRoomList)
    if (shareFormType == 'workPlan') {
      shareToRoomSave({
        id: sourceItem.id, //节点id
        type: 1, //类型：0个人 1项目组
        typeIds: selRoomIds, //数组、类型id
        name: sourceItem.name,
        mainId: sourceItem.mainId,
        typeId: sourceItem.typeId,
        teamId: sourceItem.teamId,
        teamName: sourceItem.teamName,
        selRoomList: selRoomList,
      })
    } else if (shareFormType === 'taskReport') {
      $store.dispatch({ type: 'ROOM_ID_LIST', data: selRoomList })
    } else {
      shareToRoom({
        selRoomList: selRoomList,
        shareObj: quoteMsg,
        setLoadState: setLoading,
      }).then((res: any) => {
        if (res && param.onOk) {
          param.onOk()
        }
      })
    }
  }
  // ========点击取消===========//
  const handleCancel = () => {
    action.setShareToRoomModalShow(false)
  }
  useEffect(() => {
    setVisible(param.shareToRoomModalShow)
  }, [param.shareToRoomModalShow])

  const roomListOnRef = (ref: any) => {
    roomListRef = ref
  }
  // 标题
  const titName = param.titName ? param.titName : $intl.get('selectGroup')
  return (
    <Modal
      className="baseModal delModal shareToRoomModal"
      visible={visible}
      title={titName}
      onOk={handleOk}
      onCancel={handleCancel}
      width={660}
      centered={true}
      footer={[
        <Button key="back" onClick={handleCancel}>
          {$intl.get('cancel')}
        </Button>,
        <Button key="submit" type="primary" onClick={handleOk}>
          {$intl.get('sure')}
        </Button>,
      ]}
    >
      <Spin spinning={loading}>
        <ShareRoomList visible={visible} onRef={roomListOnRef} setLoading={setLoading} />
      </Spin>
    </Modal>
  )
}

/**
 * 查询共享群列表
 */
export const ShareRoomList = (props: any) => {
  const { setLoading } = props
  const [roomList, setRoomList] = useState<any>([])
  // 每次显示弹框时查询数据
  useEffect(() => {
    if (props.visible) {
      if ($store.getState().planModalObj.shareFormType == 'workPlan') {
        findSelectList()
      } else if ($store.getState().planModalObj.shareFormType === 'taskReport') {
        const dataList: any = []
        $store.getState().roomIdList.map((item: RoomItem) => {
          if (item.id) {
            dataList.push({
              id: item.id,
              name: item.subject,
            })
          }
        })
        findShareList(dataList)
      } else {
        findShareList('')
      }
    }
  }, [props.visible])
  /**
   * 查询选中群
   */
  const findSelectList = () => {
    const sourceItem = $store.getState().planModalObj.sourceItem || {}
    // 请求子节点数据
    const selParam: any = {
      shareUser: $store.getState().nowUserId,
      type: 1, //类型：0个人 1项目组
      id: sourceItem.id, //计划id
    }
    // 查询已共享群
    requestApi({
      url: '/task/work/plan/findShareTypeId',
      param: selParam,
      setLoadState: setLoading,
    }).then(res => {
      const dataList = []
      if (res.success) {
        const getData = res.data.data || {}
        // 保存选中数据
        for (const id in getData) {
          dataList.push({
            id: id,
            name: getData[id],
          })
          // selectRoomIdsTmp.push(id)
        }
      }
      findShareList(dataList)
    })
  }
  /**
   * 查询所有群列表
   * @param selList
   */
  const findShareList = (selList: any) => {
    const sourceItem = $store.getState().planModalObj.sourceItem || {}
    // 查询群列表
    let listParam: any = {
      account: $store.getState().nowAccount,
    }
    if ($store.getState().planModalObj.shareFormType == 'workPlan') {
      listParam = {
        account: $store.getState().nowAccount,
        type: 1, //类型：0个人 1项目组
        teamId: sourceItem.teamId, //
      }
    }
    requestApi({
      url: '/im-consumer/project/find/join',
      param: listParam,
    }).then(res => {
      if (res.success) {
        const dataList = res.data.dataList || []
        dataList.map((item: any) => {
          const isSel = isInSelect(selList, item.id)
          if (isSel) {
            item.checked = true
          } else {
            item.checked = false
          }
        })
        setRoomList(dataList)
      }
    })
  }
  /***
   * 是否选中项目组
   * @param arr
   * @param id
   * @returns {boolean}
   */
  const isInSelect = (arr: any, id: string) => {
    let isIn = false
    for (const i in arr) {
      if (arr[i].id == id) {
        isIn = true
        break
      }
    }
    return isIn
  }
  /**
   * 切换复选框状态
   * @param e
   */
  const onChange = (e: any, selItem: any) => {
    for (const i in roomList) {
      if (roomList[i].id == selItem.id) {
        roomList[i].checked = e.target.checked
        // selectRoomIdsTmp.push(selItem.id)
        break
      }
    }
    setRoomList([...roomList])
  }

  // 此处注意useImperativeHandle方法的的第一个参数是目标元素的ref引用
  useImperativeHandle(props.onRef, () => ({
    // 暴露给父组件的方法
    // 选中群数据
    getRoomList: () => {
      return roomList
    },
  }))
  return (
    <ul className="shareRoomList flex wrap">
      {roomList.map((item: any, i: number) => {
        return (
          <li key={i}>
            <Checkbox
              checked={item.checked}
              onChange={e => {
                onChange(e, item)
              }}
            >
              {item.subject}
            </Checkbox>
          </li>
        )
      })}
    </ul>
  )
}
