import React, { useEffect, ReactNode, useRef, useState } from 'react'
import { Input, Tree, message, Spin } from 'antd'
import NoneData from '@/src/components/none-data/none-data'
import { getStaticTreeList, dropSort } from './getData'

interface DataNode {
  key: string
  orgId: number
  title: string | ReactNode
  icon?: ReactNode
  isLeaf?: boolean
  children?: DataNode[]
}

let exkeys: React.Key[] = []
const StatisticsMenu = (props: { activeKey: string; onSelect: (selectNode: any) => void; selectNode: any }) => {
  const { activeKey, onSelect, selectNode } = props
  const inputRef: any = useRef(null)
  // 树节点的数据
  const [treeData, setTreeData] = useState<DataNode[]>([])
  // 设置展开的节点的keys
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([])
  // loading加载
  const [loading, setLoading] = useState<boolean>(true)

  // 选中树节点
  const selectNodeHandle = (
    selectedKey: any,
    e: { selected: boolean; selectedNodes: any; node: any; event: any }
  ) => {
    const row = e.node
    if (!row.hasChild && row.hasOwnProperty('id')) {
      onSelect({ ...row, type: 4 })
    } else {
      let isExpanded = false
      expandedKeys.map(item => {
        if (item == row.key) {
          isExpanded = true
        }
      })
      if (isExpanded) {
        const result = expandedKeys.filter(item => {
          return item != row.key
        })
        setExpandedKeys(result)
      } else {
        const result = [...expandedKeys, row.key]
        setExpandedKeys(result)
      }
    }
  }

  // 展开树节点
  const onExpand = (expandedKeysValue: React.Key[]) => {
    setExpandedKeys(expandedKeysValue)
  }

  const loop = (data: any, key: any, callback: any) => {
    for (let i = 0; i < data.length; i++) {
      if (data[i].key === key) {
        return callback(data[i], i, data)
      }
      if (data[i].children) {
        loop(data[i].children, key, callback)
      }
    }
  }

  const getNewSortData = (arr: Array<any>) => {
    const modules: any = []
    arr.forEach((item: any) => {
      //存在分组
      if (item.children && item.children.length > 0) {
        const groups = item.children
        for (let i = 0; i < groups.length; i++) {
          const groupItem = groups[i]
          modules.push({
            groupId: groupItem.groupId,
            formIds: getFormInfo(groups[i].children),
          })
        }
      }
    })
    return modules
  }
  const getFormInfo = (arr: Array<any>) => {
    const formIds: any = []
    if (arr.length > 0) {
      arr.forEach((item: any) => {
        const _formId = item.id
        formIds.push(_formId)
      })
    }
    return formIds
  }

  const onDropEvent = (info: any) => {
    const node = info.node
    const dragNode = info.dragNode
    const dropKey = node.key
    const dragKey = dragNode.key
    const dropKeys = dropKey.split('-')
    const dragKeys = dragKey.split('-')
    // 不允许拖动企业排序、拖动分组/报表不允许跨企业
    if (dragKeys[0] !== dropKeys[0]) {
      return false
    } else if (info.dropPosition === -1) {
      return false
    }
    // 不允许分组向下拖动
    if (dropKeys.length === 3 && dragKeys.length === 2) {
      return
    }
    // 不允许将分组拖动到企业外
    if (dragKeys.length === 2 && !info.dropToGap) {
      if (dropKeys.length !== 1) {
        return
      }
    }
    if (dragKeys.length === 3) {
      // 不允许将报表拖动到分组外的企业下
      if (dropKeys.length === 1) {
        return
      }
      // 不允许将该分组下的报表拖动到其他分组
      if (dropKeys.length === 3 || dropKeys.length === 2) {
        if (dragKeys[1] !== dropKeys[1]) {
          return
        }
      }
    }
    const dropPos = node.pos.split('-')
    const dropPosition = info.dropPosition - Number(dropPos[dropPos.length - 1])
    const data = [...treeData]
    let dragObj: any = ''
    loop(data, dragKey, (item: any, index: number, arr: any[]) => {
      arr.splice(index, 1)
      dragObj = item
    })

    if (!info.dropToGap) {
      loop(data, dropKey, (item: any) => {
        item.children = item.children || []
        // 插入的位置
        item.children.unshift(dragObj)
      })
    } else if (
      (node.props.children || []).length > 0 && // Has children
      node.props.expanded && // Is expanded
      dropPosition === 1 // On the bottom gap
    ) {
      loop(data, dropKey, (item: any) => {
        item.children = item.children || []
        // where to insert
        item.children.unshift(dragObj)
      })
    } else {
      let ar: any
      let i: any
      loop(data, dropKey, (item: any, index: number, arr: any) => {
        ar = arr
        i = index
      })
      if (dropPosition === -1) {
        ar.splice(i, 0, dragObj)
      } else {
        ar.splice(i + 1, 0, dragObj)
      }
    }
    const sortParam: any = {
      userId: $store.getState().nowUserId,
      groupModels: getNewSortData(data),
    }
    dropSort(sortParam)
      .then((res: any) => {
        if (res.returnCode === 0) {
          setTreeData(data)
        }
      })
      .catch(err => {
        message.error(err.returnMessage || '排序异常')
      })
  }

  const handleTreeData = (isSearch: boolean, data: Array<DataNode>, orgId?: number, groupId?: number) => {
    const oneLevelData = data
    oneLevelData.forEach((item: any, index: number) => {
      if (item.id) {
        // 报表
        const src = $tools.asAssetsPath(`/images/approval/${item.logo ? item.logo : 'icon_05.png'}`)
        const dataKey = `${orgId}-${groupId}-${item.id}`
        item.key = dataKey
        item.switcherIcon = <img className="form_item_icon" src={src} />
      } else if (item.groupId) {
        // 分类
        item.orgId = orgId
        item.key = `${orgId}-${item.groupId}`
        if (isSearch) {
          exkeys.push(`${orgId}-${item.groupId}`)
        }
      } else {
        // 企业
        item.key = `${item.orgId}`
        item.switcherIcon = <span className="org_icon"></span>
        // 默认展开所有企业的key
        exkeys.push(`${item.orgId}`)
        if (index === 0 && item.children?.length) {
          // 默认展开第一个分组的key
          exkeys.push(`${item.orgId}-${item.children[0].groupId}`)
        }
      }
      if (item.children) {
        handleTreeData(isSearch, item.children, item.orgId, item.groupId)
      }
    })
    return oneLevelData
  }

  const queryTreeMenu = (keywords: string, isSearch: boolean) => {
    exkeys = []
    getStaticTreeList(keywords)
      .then((resData: any) => {
        console.log(resData)
        // 设置分组查询数据
        setTreeData(handleTreeData(isSearch, resData))
        // 保存默认展开的树的key
        setExpandedKeys(exkeys)
      })
      .catch(err => {
        message.error(err.returnMessage || '查询统计报表失败')
      })
      .finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    if (activeKey === 'statistics') {
      queryTreeMenu('', false)
    }
  }, [activeKey])

  return (
    <Spin spinning={loading} tip={'加载中，请稍侯'}>
      <Input
        ref={inputRef}
        allowClear
        placeholder="请输入报表名称"
        style={{ marginBottom: '26px' }}
        className="org_menu_search baseInput radius16 border0 bg_gray"
        suffix={
          <em
            className="search-icon-t-btn"
            onClick={() => {
              const inputValue = inputRef.current.state.value || ''
              queryTreeMenu(inputValue, inputValue ? true : false)
            }}
          ></em>
        }
        onPressEnter={(e: any) => {
          const value = e.target.value
          queryTreeMenu(value, value ? true : false)
        }}
      />
      <div className="busubess_tree_content">
        <Tree
          className="busubess_tree"
          onExpand={onExpand}
          expandedKeys={expandedKeys}
          treeData={treeData}
          onSelect={selectNodeHandle}
          selectedKeys={selectNode ? [selectNode.key] : []}
          onDrop={onDropEvent}
          blockNode={true}
          draggable={true}
        />
        {treeData.length === 0 && (
          <NoneData
            imgSrc={$tools.asAssetsPath('/images/common/report_serach_icon.svg')}
            showTxt="没有找到相关统计报表"
            imgStyle={{ width: 64, height: 66 }}
          />
        )}
      </div>
    </Spin>
  )
}

export default StatisticsMenu
