import React, { useState, useEffect } from 'react'
import { message, Modal, Table } from 'antd'
import './myWorkPlan.less'
import { findMoveFolderList } from './newPlanApi'
import { moveToDirSave } from './NewPlanOpt'
import NoneData from '@/src/components/none-data/none-data'
/**
 * 工作规划新版3.26
 */
class NewPlanModel extends React.Component<any> {
  // 构造器
  constructor(props: any) {
    super(props)
  }
  state = {
    visible: false, //模态框显示隐藏
    text: '移动',
    nowselRow: { id: 0, type: 0, parentFolderId: 0 },
    selectRowItem: { id: 0, type: 0 },
  }
  componentDidUpdate(prevProps: any, prevState: any) {
    //更新使表格加载完
    if (this.state.visible != this.props.visible) {
      this.setState({
        visible: this.props.visible,
        text: this.props.text,
        nowselRow: this.props.nowselRow,
        selectRowItem: {},
      })
    }
  }
  closeModal = () => {
    this.props.setStateChange('1')
  }
  setRange = () => {
    if (
      this.state.nowselRow.id == this.state.selectRowItem.id ||
      this.state.nowselRow.parentFolderId == this.state.selectRowItem.id
    ) {
      message.error('你已经在此位置了')
      return false
    }
    const param: any = {
      typeId: this.state.nowselRow.id,
      type: this.state.nowselRow.type,
    }
    if (this.state.selectRowItem.id) {
      param.id = this.state.selectRowItem.id
    }
    moveToDirSave(param, {
      optType: 'drag',
    }).then((res: any) => {
      if (!res.success) return
      // 刷新左侧列表数据
      const reFreshParam = {
        optType: 'move',
        taskIds: [this.state.nowselRow.id],
        type: this.state.nowselRow.type,
        parentId: this.state.selectRowItem.id,
        parentIdNodeKey: `1_${this.state.selectRowItem.id}`,
      }
      this.props.refreshLeftTree(reFreshParam)
      this.props.setStateChange('1', 'sucess')
    })
  }
  setSelectRow = (item: any, myPlan?: boolean) => {
    // this.state.selectRowItem = myPlan ? { id: 0 } : item
    this.setState({ ...this.state, selectRowItem: myPlan ? { id: 0 } : item })
  }
  // firstDataShow = () => {
  //   this.state.nowselRow.parentFolderId = 0
  //   this.setState({ ...this.state })
  // }
  render() {
    return (
      <>
        <Modal
          className="new_plan_model"
          visible={this.state.visible}
          width={400}
          title={this.state.text}
          onCancel={this.closeModal}
          onOk={this.setRange}
          maskClosable={false}
        >
          <MoveToDirlist
            visible={this.state.visible}
            action={{
              setSelectRow: this.setSelectRow,
            }}
            data={{ nowItem: this.state.nowselRow, nowSelectItem: this.state.selectRowItem }}
          />
        </Modal>
      </>
    )
  }
}
export default NewPlanModel

/**
 * 移动到文件夹列表渲染
 * @param props
 */
export const MoveToDirlist = (props: any) => {
  // 当前所在文件夹位置
  const folderPos = props.data.nowItem

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
          <span className={`now_pos_msg ${folderPos.parentFolderId == item.id ? '' : 'forcedHide'}`}>
            当前所在位置
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
    findMoveFolderList(folderPos.id).then((res: any) => {
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
      // if (folderPos.id == item.id) {
      //   ptAction.firstDataShow(0)
      // }
      item.dirName = <DirNameCol key={item.id} itemData={item} />
      if (item.folderCount > 0) {
        item.children = []
      }
    })
  }
  const columns = [
    {
      title: '名称',
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
  }, [folderPos.id])

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
        if (item.children) {
          return {
            ...item,
            children: updateTableParam(item.children, id, keyName),
          }
        }
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
    findMoveFolderList(folderPos.id, row.id).then((res: any) => {
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
        return <span className="treeTableIcon hide" onClick={e => onExpand(record, e)}></span>
      }
    },
    indentSize: 20, //自定义缩进值
  }

  return (
    <>
      <div
        className={`myPlanRow planMoveRow flex between ${props.data.nowSelectItem.id == 0 ? 'active' : ''}`}
        onClick={() => {
          ptAction.setSelectRow({}, true)
          updateTableParam(listData, '', 'active')
          setListData([...listData])
        }}
      >
        <div className="rowLeft flex-1">
          <em className="img_icon my_plan_icon"></em>
          <span>我的脑图</span>
        </div>
        <div className="rowRight">
          <span className={`now_pos_msg ${folderPos.parentFolderId == 0 ? '' : 'forcedHide'}`}>
            当前所在位置
          </span>
        </div>
      </div>
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
        onRow={row => {
          return {
            onClick: () => {
              selectRow(row)
            }, // 点击行
          }
        }}
        pagination={false}
      />
    </>
  )
}
