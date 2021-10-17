import React, { useState, useRef, useEffect } from 'react'
import { Modal, Tree, Tabs, Input, message, Spin } from 'antd'
import NoneData from '@/src/components/none-data/none-data'
import './FollowReport.less'
import { queryFollowReport } from '../getData'
import { judeNoDataImg } from './TaskList'
interface FollowModalProps {
  orgId: number
  visible: boolean
  handleModalVisible: (visible: boolean) => void
  refreshFollowList: () => void
}
interface CheckDataProps {
  title: string
  key: string
  type: number
  id?: number
  groupId?: number
}

let keys: string[] = []
let initCheckedKeys: string[] = []
const FollowReportModal = (props: FollowModalProps) => {
  const inputRef: any = useRef(null)
  // 右侧选中的数据
  const [checkedData, setCheckedData] = useState<CheckDataProps[]>([])
  // 选中的树的key
  const [checkedKeys, setCheckedKeys] = useState<string[]>([])
  // 选中的tab
  const [activeKey, setActiveKey] = useState('standing_book')
  // 树节点的数据
  const [treeData, setTreeData] = useState<any>([])
  // 展开的节点的keys
  const [expandedKeys, setExpandedKeys] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const handleTreeData = (treeData: any[], groupId?: string) => {
    return treeData.map(item => {
      if (item.id) {
        // 报表
        item.key = `${groupId}_${item.id}`
        keys.push(`${groupId}_${item.id}`)
      } else if (item.groupId) {
        // 分类
        item.checkable = false
        item.key = `${item.groupId}`
        keys.push(`${item.groupId}`)
      }
      if (item.children) {
        handleTreeData(item.children, item.groupId)
      }
      return item
    })
  }

  const getListData = (keywords: string, activeKey: string) => {
    const { loginToken, nowUserId } = $store.getState()
    let url = ''
    if (activeKey === 'standing_book') {
      url = 'approval/approval/baseForm/findUserCloudStandingBookOrdinalListByOrgId'
      // 台账
    } else {
      // 统计
      url = 'approval/reportStatistics/findUserCloudStandingBookOrgModel'
    }
    const params = {
      orgId: props.orgId,
      userId: nowUserId,
      keywords,
    }
    return new Promise((resolve, reject) => {
      $api
        .request(url, params, {
          headers: { loginToken },
          formData: true,
        })
        .then(res => {
          if (res.returnCode === 0) {
            if (res.dataList) {
              resolve(res.dataList)
            } else {
              resolve([])
            }
          }
        })
        .catch(err => {
          reject(err)
        })
    })
  }

  const handleCheckData = (data: any) => {
    return data.map((item: any) => {
      if (item.id) {
        item.key = `${item.groupId}_${item.id}`
        initCheckedKeys.push(`${item.groupId}_${item.id}`)
      }
      if (item.eventModelList) {
        handleCheckData(item.eventModelList)
      }
      return item
    })
  }

  useEffect(() => {
    initCheckedKeys = []
    // 查询所有的数据
    getListData('', 'standing_book').then((resData: any) => {
      setTreeData(handleTreeData(resData))
      setExpandedKeys(keys)
    })
    // 查询已关注的数据
    queryFollowReport(props.orgId)
      .then((resData: any) => {
        const data = handleCheckData(resData)
        if (data.length) {
          // 保存树默认选中的项
          setCheckedKeys(initCheckedKeys)
          // 保存右侧选中的数据
          setCheckedData(data[0].eventModelList)
        }
      })
      .catch(() => {
        setLoading(false)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  // 选中或取消选中台账或报表添加到右侧列表
  const onCheck = (checkedKeys: any, e: any) => {
    if (e.checked) {
      setCheckedData(origin => {
        const data = origin.concat({ ...e.node, type: activeKey === 'standing_book' ? 1 : 4 })
        return data
      })
      setCheckedKeys(origin => {
        const data = origin.concat(checkedKeys)
        return data
      })
    } else {
      setCheckedData(origin => {
        return origin.filter(item => {
          return item.key !== e.node.key
        })
      })
      setCheckedKeys(origin => {
        return origin.filter(item => {
          return item !== e.node.key
        })
      })
    }
  }

  // 移除右侧选中的数据
  const deleteCheckedData = (dataItem: any) => {
    const result = checkedData.filter(item => {
      return item.key !== dataItem.key
    })
    const keys: any[] = checkedData
      .map(item => {
        if (item.key !== dataItem.key) {
          return item.key
        }
      })
      .filter(data => {
        if (data) {
          return data
        }
      })
    setCheckedData(result)
    setCheckedKeys(keys)
  }

  const tabChange = (activeKey: string) => {
    keys = []
    getListData('', activeKey).then((resData: any) => {
      // 保存树的数据
      setTreeData(handleTreeData(resData))
      // 默认展开所有的树
      setExpandedKeys(keys)
    })
    // 保存当前tab分类
    setActiveKey(activeKey)
  }

  const onSearchHandle = (inputValue: string) => {
    getListData(inputValue, activeKey).then((resData: any) => {
      setTreeData(handleTreeData(resData))
    })
  }

  const onOk = () => {
    const { loginToken, nowUserId } = $store.getState()
    const result = checkedData.map(item => {
      return {
        type: item.type, // 关注类型（1台账，4统计）
        typeId: item.id, // 类型id
        name: item.title,
      }
    })
    const params = {
      userId: nowUserId,
      belongId: props.orgId,
      followModelList: result,
    }
    $api
      .request('/approval/cloudStandingBookFollow/addWorkbenchCloudStandingBookFollow', params, {
        headers: { loginToken, 'Content-Type': 'application/json' },
      })
      .then(res => {
        if (res.returnCode === 0) {
          props.handleModalVisible(false)
          props.refreshFollowList()
        }
      })
      .catch(err => {
        message.error(err.returnMessage || '关注失败')
      })
  }

  const TreeList = () => {
    return (
      <>
        <Input
          ref={inputRef}
          allowClear
          placeholder="请输入名称"
          style={{ marginBottom: '26px', width: '280px', marginLeft: '2px' }}
          className="org_menu_search baseInput radius16 border0 bg_gray"
          suffix={
            <em
              className="search-icon-t-btn"
              onClick={() => {
                const inputValue = inputRef.current.state.value || ''
                onSearchHandle(inputValue)
              }}
            ></em>
          }
          onPressEnter={(e: any) => {
            const value = e.target.value
            onSearchHandle(value)
          }}
        />
        {treeData.length ? (
          <Tree
            checkable
            defaultExpandAll={true}
            expandedKeys={expandedKeys}
            checkedKeys={checkedKeys}
            onCheck={onCheck}
            treeData={treeData}
          />
        ) : (
          <NoneData
            imgSrc={judeNoDataImg('report_form').imgSrc}
            showTxt={'暂无数据'}
            imgStyle={{ width: 74, height: 71 }}
          />
        )}
      </>
    )
  }

  return (
    <Modal
      className="selectFollowReportModal"
      visible={props.visible}
      title={'添加关注'}
      onCancel={() => props.handleModalVisible(false)}
      onOk={onOk}
      width={850}
      centered={true}
      maskClosable={false}
      keyboard={false}
      bodyStyle={{ padding: '0 20px' }}
    >
      <Spin spinning={loading}>
        <div className="follow_report_content flex">
          <div className="follow_left_pannel column">
            <Tabs onChange={tabChange} activeKey={activeKey}>
              <Tabs.TabPane tab="台账" key="standing_book">
                {TreeList()}
              </Tabs.TabPane>
              <Tabs.TabPane tab="统计" key="statistics">
                {TreeList()}
              </Tabs.TabPane>
            </Tabs>
          </div>
          <div className="follow_right_pannel">
            <div className="rightShowTit">已选项</div>
            <ul>
              {checkedData.map(item => {
                return (
                  <li className="flex" key={item.key}>
                    <div>{item.title}</div>
                    <div className="rowRight">
                      <em
                        className="delete_icon"
                        onClick={() => {
                          deleteCheckedData(item)
                        }}
                      ></em>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </Spin>
    </Modal>
  )
}

export default FollowReportModal
