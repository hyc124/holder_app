import React, { useEffect, useState } from 'react'
import { CloseOutlined } from '@ant-design/icons'
import './index.less'
import {
  queryAttach,
  queryCountSubordinate,
  queryEnterprise,
  getOrgProfileById,
  findOneTaskDetail,
} from '../../getData'
import { message, Divider, Tree, Table, Avatar, Tag, Button, Dropdown, Pagination, Spin } from 'antd'
import { renderProgress } from '../WaitTask'
import $c from 'classnames'
import TaskListOpt from '../TaskListOpt'
import DetailModal from '@/src/views/task/taskDetails/detailModal'
import NoneData from '@/src/components/none-data/none-data'
import SearchPlugDown from '../search-plug/search-plug-downTask'
import { QUERY_PARAMS } from '@/core/store/actions/announce.action'
import { getDividerLine } from '../TaskList'
interface DataNode {
  title: string
  key: string
  isLeaf?: boolean
  children?: DataNode[]
}
interface TtemDataProps {
  id: number
  name: string
  ascriptionType: number
  ascriptionId: number
  ascriptionName: string
  status: number
  flag: number
  approvalStatus: number
  endTime: string
  level: number
  property: number
  cycleNum: number
  progress: { percent: number; color: number }
  subTaskCount: number
  type: number
  executorUser: number
  executorUsername: string
  profile: string
  today: boolean
  icon?: any
  goldModel?: any
  assignName?: any
  reportCount?: any
  opinionCount?: any
  tagList?: any
  childrenData?: any[] //前端需要展开树结构任务添加
}
interface TableProps {
  taskName: object
  key: number
  subTaskCount: number
  children: Array<TableProps>
}
//查询下属任务列表数据
export const queryUndTaskList = (params: any) => {
  return new Promise(resolve => {
    $api
      .request('/task/workbench', params, {
        headers: { loginToken: $store.getState().loginToken, 'Content-Type': 'application/json' },
      })
      .then(data => {
        const showData = data.data
        resolve(showData)
      })
  })
}

const DownTaskModal = ({ onClose }: { onClose: () => void }) => {
  const { selectTeamId, nowAccount, nowUser, nowUserId } = $store.getState()
  const orgId = selectTeamId == -1 || isNaN(selectTeamId) ? '' : selectTeamId
  // const [getAttachId, setGetAttachId] = useState<any>('')
  const [windowHeight, setWindowHeight] = useState(0)
  const [defaultSelectedKeys, setDefaultSelectedKeys] = useState<string[]>([])
  const [hierarchy, setHierarchy] = useState([])
  const [tableData, setTableData] = useState<TableProps[]>([])
  const [treeData, setTreeData] = useState<Array<any>>([])
  const [totalElements, setTotalElements] = useState(0)
  //任务详情框
  const [opentaskdetail, setOpentaskdetail] = useState(false)
  //任务ID
  const [taskId, setTaskId] = useState<any>(0)
  const [btnParam, setBtnParam] = useState({
    rowObj: '',
    fromType: '',
    children: [],
  })
  //加载loading...
  const [loadTable, setLoadTable] = useState(false)
  //搜索下拉框
  const [dropvisible, setDropvisible] = useState(false)

  //选中下属得userId
  const [treeUserId, setTreeUserId] = useState<any>('')
  //查询参数定义
  const [searchParams, setSearchParams] = useState({
    id: orgId,
    loginUserId: nowUserId,
    account: nowAccount,
    userId: '',
    type: 2,
    status: [-4],
    pageNo: 0,
    pageSize: 10,
    priority: '',
    startTime: '',
    endTime: '',
    level: 0,
    property: 0,
    keyword: '',
    listType: 13,
  })
  useEffect(() => {
    queryAttach({
      teamId: orgId,
      account: nowAccount,
    }).then((data: any) => {
      const datas = data.data || ''
      // setGetAttachId(datas.id)
      queryCount(datas.id)
      queryEnter(datas.id)
    })
    setWindowHeight(window.innerHeight)
    window.addEventListener('resize', function() {
      setWindowHeight(this.window.innerHeight)
    })
    jQuery('body')
      .off()
      .click(function(e: any) {
        const _con = jQuery('.search_down_menu,.ant-picker-panels') // 设置目标区域
        if (!_con.is(e.target) && _con.has(e.target).length === 0) {
          setDropvisible(false)
        }
      })
    return () => {
      window.removeEventListener('resize', function() {
        setWindowHeight(this.window.innerHeight)
      })
      jQuery('body').off()
    }
  }, [])

  useEffect(() => {
    setLoadTable(true)
    queryUndTaskList(searchParams).then((data: any) => {
      setTotalElements(data.totalElements || 0)
      const contentData: TtemDataProps[] = data.content
      const newTableData: Array<TableProps> = []
      contentData.map((item: TtemDataProps) => {
        newTableData.push({
          taskName: { ...item },
          key: item.id,
          subTaskCount: item.subTaskCount,
          children: item.childrenData || [],
        })
      })
      setTableData(newTableData)
      setLoadTable(false)
    })
  }, [searchParams])
  /**
   * 统计用户下级数量
   * belongId:归属id
   * userAttachId:用户附加表id
   * level:统计层数
   */
  const queryCount = (attachId: any) => {
    queryCountSubordinate({
      belongId: orgId,
      userAttachId: attachId,
      level: 3,
    }).then((data: any) => {
      if (data.returnCode === 0) {
        const datas = data.dataList || []
        setHierarchy(datas)
      } else {
        message.error(data.returnMessage)
      }
    })
  }
  /**
   * 查询上下级关系
   * typeId:归属id
   * type:归属类型 团队传1 企业传2
   * attachId:人员id
   */
  const queryEnter = (attachId: any) => {
    queryEnterprise({
      typeId: orgId,
      type: 2,
      attachId: attachId,
    }).then((data: any) => {
      if (data.returnCode === 0) {
        const datas = data.dataList || []
        ergodicTreeArr(datas)
      } else {
        message.error(data.returnMessage)
      }
    })
  }

  //树节点处理
  const ergodicTreeArr = (arr: any[]) => {
    if (arr.length !== 0) {
      const defaultKey = arr[0].leaderId + '#' + arr[0].userId + '#' + arr[0].leaderAccount
      //默认选中第一个节点
      setDefaultSelectedKeys([defaultKey])
      setTreeUserId(arr[0].userId)
      setSearchParams({
        ...searchParams,
        userId: arr[0].userId,
      })
    }
    const projectTree: DataNode[] = arr.map((item: any) => {
      return {
        title: item.leaderName,
        key: item.leaderId + '#' + item.userId + '#' + item.leaderAccount,
        isLeaf: item.flag !== 1,
      }
    })
    setTreeData(projectTree)
  }

  //更新树子节点
  const updateTreeData = (list: any[], key: any, children: any[]): any[] => {
    return list.map(node => {
      if (node.key === key) {
        return {
          ...node,
          children,
        }
      } else if (node.children) {
        return {
          ...node,
          children: updateTreeData(node.children, key, children),
        }
      }
      return node
    })
  }

  //异步加载数据
  const onLoadData = (treeNode: any) => {
    return new Promise<any>(resolve => {
      if (treeNode.children) {
        resolve(true)
        return
      }
      queryEnterprise({
        typeId: orgId,
        type: 2,
        attachId: treeNode.key.split('#')[0],
      }).then((data: any) => {
        if (data.returnCode === 0) {
          const childData = data.dataList || []
          const childrenData = childData.map(
            (item: { leaderName: any; leaderId: any; userId: any; leaderAccount: any; flag: number }) => {
              return {
                title: item.leaderName,
                key: item.leaderId + '#' + item.userId + '#' + item.leaderAccount,
                isLeaf: item.flag !== 1,
              }
            }
          )
          setTreeData(origin => updateTreeData(origin, treeNode.key, childrenData))
          resolve(true)
        } else {
          message.error(data.returnMessage)
        }
      })
    })
  }
  //树节点选中
  const onSelect = (selectedKeys: any) => {
    if (selectedKeys.length !== 0) {
      setDefaultSelectedKeys(selectedKeys)
      const userId = selectedKeys[0].split('#')[1]
      setTreeUserId(userId)
      setSearchParams({
        ...searchParams,
        userId: userId,
        pageNo: 0,
        pageSize: 10,
      })
    }
  }

  //小写转大写
  const transNum = (num: number) => {
    return [
      { codeTxt: '零', id: 0 },
      { codeTxt: '一', id: 1 },
      { codeTxt: '二', id: 2 },
      { codeTxt: '三', id: 3 },
      { codeTxt: '四', id: 4 },
      { codeTxt: '五', id: 5 },
      { codeTxt: '六', id: 6 },
      { codeTxt: '七', id: 7 },
      { codeTxt: '八', id: 8 },
      { codeTxt: '九', id: 9 },
    ].filter((item: { codeTxt: string; id: number }) => item.id === num)[0].codeTxt
  }
  //搜索
  const queryCallback = (searcgData: any) => {
    setSearchParams({
      ...searchParams,
      ...searcgData,
      pageNo: 0,
      pageSize: 10,
    })
  }
  const setRowClassName = (record: any) => {
    if (record.subTaskCount === 0) {
      return 'noExpandable'
    } else {
      return ''
    }
  }
  //展开行
  const expandedRow = (expanded: any, record: any) => {
    loadChildData(record)
  }
  //加载子任务数据
  const loadChildData = (record: any) => {
    if (record.children && record.children.length > 0) {
      return
    }
    const nowTaskId = record.key
    const param = {
      taskId: nowTaskId,
      loginUserId: nowUserId,
    }
    $api
      .request('/task/workbench/sub', param, {
        headers: { loginToken: $store.getState().loginToken },
        formData: true,
      })
      .then(resData => {
        const childTaskData = resData.dataList
        const childDataItemArr: Array<TableProps> = childTaskData.map((item: TtemDataProps) => {
          return {
            taskName: { ...item },
            key: item.id,
            subTaskCount: item.subTaskCount,
            children: item.childrenData || [],
          }
        })
        //动态添加任务子任务
        const newTable = tableData.concat([])
        updateTaskData(newTable, nowTaskId, childDataItemArr)
        setTableData(newTable)
      })
  }
  //递归插入任务列表子元素
  const updateTaskData = (tableData: any, parentId: number, childData: Array<TableProps>) => {
    tableData.find((item: TableProps) => {
      if (item.key === parentId) {
        item.children = childData
        return tableData
      }
      if (item.children && item.children.length > 0) {
        updateTaskData(item.children, parentId, childData)
      }
    })
  }
  //获取当前最新的数据（单条任务查询）
  const queryOneTask = (taskId: number, type?: any, taskKey?: string) => {
    findOneTaskDetail({
      taskIds: taskId,
      loginUserId: nowUserId,
    }).then((data: any) => {
      const taskData = data.dataList
      const dataItemArr: Array<TableProps> = taskData.map((item: TtemDataProps) => {
        return {
          taskName: { ...item },
          key: item.id,
          subTaskCount: item.subTaskCount,
          children: item.childrenData || [],
        }
      })
      //动态添加任务子任务
      const newTable = tableData.concat([])
      updateNowTaskData(newTable, taskId, dataItemArr)
      setTableData(newTable)
    })
  }
  //递归替换当前行数据2
  const updateNowTaskData = (tableData: any, taskId: number, dataItemArr: Array<TableProps>) => {
    tableData.map((item: TableProps, index: number) => {
      if (item.key === taskId) {
        item.taskName = dataItemArr[0].taskName
        item.key = dataItemArr[0].key
        item.subTaskCount = dataItemArr[0].subTaskCount
        item.children = dataItemArr[0].children
      }
      if (item.children && item.children.length > 0) {
        updateNowTaskData(item.children, taskId, dataItemArr)
      }
    })
  }
  const columns = [
    {
      title: '11',
      dataIndex: 'taskName',
      key: 'taskName',
      render: (recode: TtemDataProps) => {
        return (
          <Dropdown
            overlay={
              <TaskListOpt
                taskOptData={btnParam}
                callback={(params?: any) => {
                  queryOneTask(params.taskId)
                }}
              />
            }
            trigger={['contextMenu']}
          >
            <div
              className={$c('common-task-item text-ellipsis', { finishedTask: recode.status == 2 })}
              onClick={(event: any) => {
                event.stopPropagation()
                setOpentaskdetail(true)
                setTaskId(recode.id)
              }}
            >
              <div className="common-task-l flex-1 flex">
                {!orgId && (
                  <Avatar
                    size={16}
                    src={getOrgProfileById(recode.ascriptionId)}
                    style={{ marginRight: 10 }}
                  ></Avatar>
                )}
                {recode.icon && (
                  <img className="com-tag-img" src={$tools.asAssetsPath(`/images/task/${recode.icon}.png`)} />
                )}
                <span className="common-task-name text-ellipsis">{recode.name}</span>
                <div className="tag-list">
                  {recode.property === 1 && <Tag className="com-tag com-tag-m">密</Tag>}
                  {recode.status === 3 && <Tag className="com-tag com-tag-y">延</Tag>}
                  {recode.flag === 3 && <Tag className="com-tag com-long-tag com-tag-g">归</Tag>}
                  {/* {recode.approvalStatus !== 0 && <Tag className="com-tag com-tag-s">审</Tag>} */}
                  {recode.flag === 1 && <Tag className="com-tag com-tag-d">冻</Tag>}
                  {recode.goldModel != null && (
                    <Tag className="boardTaskType circleNum">{recode.goldModel.star || ''}星任务</Tag>
                  )}
                  {recode.cycleNum === 0 && <Tag className="com-tag com-tag-x">循</Tag>}
                  {recode.cycleNum > 0 && (
                    <Tag className="long-tag com-long-tag com-tag-x">循 {recode.cycleNum}</Tag>
                  )}
                  {recode.assignName && recode.assignName && (
                    <Tag className="com-tag-larg">由{recode.assignName}指派</Tag>
                  )}
                  {recode.reportCount && recode.reportCount !== 0 && (
                    <Tag className="com-tag-larg">汇报:{recode.reportCount}</Tag>
                  )}
                  {recode.opinionCount && recode.opinionCount !== 0 && (
                    <Tag className="com-tag-larg">备注:{recode.opinionCount}</Tag>
                  )}
                  {recode.today === true && (
                    <Tag icon={<img src={$tools.asAssetsPath('/images/common/today_task.png')} />}></Tag>
                  )}
                  {recode.tagList && recode.tagList.length !== 0 && (
                    <div className="com-tag-content">
                      {recode.tagList.map((item: any, index: number) => (
                        <span key={index} className="com-list-tag">
                          {item.content}
                          {getDividerLine(index, recode.tagList?.length)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="common-task-r">
                {recode.executorUser !== nowUserId && (
                  <Avatar
                    src={recode.profile || ''}
                    size={32}
                    style={{ backgroundColor: '#4285f4', fontSize: 12 }}
                  >
                    {recode.executorUsername || ''}
                  </Avatar>
                )}
                {recode.progress && renderProgress(recode.progress, 'circle')}
              </div>
            </div>
          </Dropdown>
        )
      },
    },
  ]
  return (
    <div className="down_task_modal">
      <div className="down_task_modal_header">
        <span className="d_title">下属任务</span>
        <CloseOutlined className="close_icon" onClick={() => onClose()} />
      </div>
      <Divider />
      <div className="head_content">
        <div className="head_content_jb">
          {hierarchy.map((item: any, index: number) => (
            <div className="subordinate-item" key={index}>
              <span>
                {item.level != 1 ? transNum(item.level) + '级下属' : '直属下属'}:{item.countNum || 0}人
              </span>
            </div>
          ))}
        </div>
        <Dropdown
          overlay={<SearchPlugDown serachCallback={queryCallback} dataUserId={treeUserId} />}
          trigger={['click']}
          visible={dropvisible}
        >
          <span className="seach_icon" onClick={() => setDropvisible(true)}>
            <i></i>筛选
          </span>
        </Dropdown>
      </div>
      <div className="down_footer">
        <div className="down_fotter_left">
          <span>{treeData ? nowUser : ''}</span>
          <Tree
            showLine={{ showLeafIcon: false }}
            treeData={treeData}
            onSelect={onSelect}
            loadData={onLoadData}
            selectedKeys={defaultSelectedKeys}
            defaultSelectedKeys={defaultSelectedKeys}
          />
        </div>
        <div className="down_fotter_right flex-1">
          {tableData.length !== 0 && (
            <Table
              className="task_list_table"
              columns={columns}
              pagination={false}
              tableLayout={'fixed'}
              showHeader={false}
              loading={loadTable}
              dataSource={tableData}
              rowClassName={setRowClassName}
              onExpand={expandedRow}
              scroll={{ y: windowHeight - 300 }}
              onRow={(record: any) => {
                return {
                  onContextMenu: (event: any) => {
                    event.stopPropagation()
                    setBtnParam({
                      rowObj: record.taskName,
                      fromType: 'desk-working_team_task',
                      children: record.children || [],
                    })
                  },
                }
              }}
            />
          )}
          <div className="task_footer">
            {tableData.length !== 0 && (
              <Pagination
                showSizeChanger
                current={searchParams.pageNo + 1}
                pageSize={searchParams.pageSize}
                total={totalElements}
                pageSizeOptions={['5', '10', '20', '30', '50', '100']}
                onShowSizeChange={(current, size) => {
                  setSearchParams({
                    ...searchParams,
                    pageNo: current - 1,
                    pageSize: size || 20,
                  })
                }}
                onChange={(page, pageSize) => {
                  setSearchParams({
                    ...searchParams,
                    pageNo: page - 1,
                    pageSize: pageSize || 20,
                  })
                }}
              />
            )}
          </div>
          {tableData.length == 0 && (
            <NoneData imgSrc={$tools.asAssetsPath('/images/common/none_img_icon_4.svg')} />
          )}
        </div>
      </div>
      {opentaskdetail && (
        <DetailModal
          param={{
            visible: opentaskdetail,
            from: 'undlist',
            id: taskId,
          }}
          setvisible={(state: any) => {
            setOpentaskdetail(state)
          }}
          callbackFn={() => {}}
        ></DetailModal>
      )}
    </div>
  )
}
export default DownTaskModal
