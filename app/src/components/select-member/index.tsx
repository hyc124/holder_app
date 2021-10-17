import React, { useState, useEffect } from 'react'
import {
  Row,
  Col,
  Modal,
  Card,
  Tabs,
  Input,
  Select,
  Radio,
  Button,
  Checkbox,
  List,
  Avatar,
  message,
  Tree,
} from 'antd'
import { DoubleRightOutlined, CloseCircleOutlined, UserOutlined } from '@ant-design/icons'
import { getMemberListAction, getPostList, getRoleList, queryByName, getDeptTree } from './actions'
import { RelationModelItemProps } from '@/src/views/announce/addModal'
import './index.less'

const { Search } = Input
const { Option } = Select
const { TabPane } = Tabs

const searchType = {
  DEPT: '请输入姓名进行搜索',
  POST: '请输入岗位进行搜索',
  POST_NAME: '请输入姓名进行搜索',
  ROLE: '请输入角色进行搜索',
}

interface DataNode {
  title: string
  key: string
  children?: DataNode[]
  isLeaf?: boolean
}

interface SelectMemberProps {
  visible: boolean
  enterpriseId: number
  apply?: number
  checkedMember: RelationModelItemProps[]
  setMemberData: (data: RelationModelItemProps[]) => void
  applyChange?: (apply: number) => void
  checkMemberVisible: (visibel: boolean) => void
  use?: string
}

interface DataTreeProps {
  id: number
  name: string
  type: number
  hasChild: number
}

interface RoleItemProps {
  id: number
  enterpriseId: null
  roleName: string
  description: string
  userNum: number
  key: string | number
  type: number
}

interface MemberDetailsItemProps {
  account: string
  name: string
  type: number
  hasChild: number
  deptId: number
  deptName: string
  sortName: string
  roleId: number
  roleName: string
  key: string | number
  id: number
  checked: boolean
}

interface PostListProps {
  id: number
  name: string
  type: number
  hasChild: number
  deptId: number
  deptName: string
  sortName: string
  actived: boolean
  key: string | number
}

const SelectMember = ({
  visible,
  enterpriseId,
  checkMemberVisible,
  setMemberData,
  applyChange,
  apply,
  use,
  checkedMember: initMembers,
}: SelectMemberProps) => {
  // 搜索条件框placeholder数据
  const [placeHolderValue, setPlaceHolderValue] = useState('DEPT')
  // 部门树的数据
  const [treeData, setTreeData] = useState<any[]>([])
  // 岗位列表数据
  const [postData, setPostData] = useState<Array<PostListProps>>([])
  // 角色列表数据
  const [roleData, setRoleData] = useState<Array<RoleItemProps>>([])
  // 根据部门、岗位、角色查询的成员详情数据
  const [memberDetailsList, setMemberDetails] = useState<Array<MemberDetailsItemProps>>([])
  // 选中的checkbox节点数据
  const [selectedNodes, setSelectedNodes] = useState<any[]>([])
  // 最终要展示的选中的数据
  const [checkedMember, setCheckedMember] = useState<any[]>(initMembers || [])

  // 查询岗位列表
  function findPostList(params: object) {
    let value = {}
    if (use === 'authManage') {
      // 权限管理额外所需参数
      value = {
        permissionType: 3,
        account: $store.getState().nowAccount,
      }
    }
    getPostList({ ...params, ...value }).then((res: any) => {
      if (res.success) {
        setPostData(res.data.dataList)
      }
    })
  }

  // 查询角色列表
  function findRoleList(params: object) {
    getRoleList(params).then((res: any) => {
      if (res.success) {
        const data = [...res.data.dataList]
        data.map((item: any) => {
          item.type = 6
        })
        setRoleData(res.data.dataList)
      }
    })
  }

  // 模糊查询-按名字查询
  function findUserList(keywords: string) {
    const params = {
      orgid: enterpriseId,
      onlyUser: 1,
      keywords,
      notAccount: '',
    }
    queryByName(params).then((res: any) => {
      if (res.success) {
        const data = [...res.data]
        //后端返回id
        //deptchain: 470###用户端开发组###759###用户端技术主管
        data.map(item => {
          const deptList = item.deptchain.split('###')
          item.key = item.id
          item.deptId = deptList[0]
          item.roleId = deptList[2]
          item.deptName = deptList[1]
          item.roleName = deptList[3]
          item.name = item.username
          item.checked = false
          item.type = placeHolderValue === 'DEPT' ? '4' : item.type
        })
        if (data && data.length) {
          setMemberDetails(data)
        } else {
          setMemberDetails([])
        }
      }
    })
  }

  //模糊查询
  function onSearch(keywords: string) {
    switch (placeHolderValue) {
      case 'DEPT': // 部门按名字查询
        // findUserList(keywords)
        const value = {
          ascriptionId: selectedNodes.length ? selectedNodes[0].id : enterpriseId,
          ascriptionType: selectedNodes.length ? selectedNodes[0].type : 2,
          keywords,
        }
        if (use === 'authManage') {
          getMemberList({
            ...value,
            account: $store.getState().nowAccount,
            permissionType: 3,
          })
        } else {
          getMemberList(value)
        }
        break
      case 'POST': // 按岗位查询
        findPostList({
          id: enterpriseId,
          keywords,
        })
        break
      case 'POST_NAME': // 岗位按名字查询
        findUserList(keywords)
        break
      case 'ROLE': // 按角色查询
        findRoleList({ enterpriseId, keywords })
        break
      default:
        break
    }
  }

  // tab切换
  function tabChange(activeKey: string) {
    setSelectedNodes([])
    // 重置详情列表数据
    setMemberDetails([])
    setPlaceHolderValue(activeKey)
    switch (activeKey) {
      case 'DEPT':
        break
      case 'POST':
        findPostList({ id: enterpriseId })
        break
      case 'ROLE':
        findRoleList({ enterpriseId })
        break
      default:
        break
    }
  }

  // 渲染适用范围部门tree数据
  function renderTreeData(data: any) {
    data.key = data.id
    data.title = data.name
    if (data.childs && data.childs.length > 0) {
      data.children = data.childs
      data.children.map((item: any) => {
        item.key = item.id
        item.title = item.name
        if (item.hasChild) {
          item.children = item.childs
          renderTreeData(data.childs)
        } else {
          item.isLeaf = true
        }
      })
    }
  }

  /**
   * 查询部门、岗位、角色下具体成员
   * @param ascriptionId 当前id(父级id)
   * @param ascriptionType 类型 2企业 3部门 31岗位/职务 5角色
   * @param onlyUser 显示部门岗位前缀
   * @param notAccount 是否排除自己
   * @param keywords
   */
  function getMemberList(values: object) {
    const params = {
      orgId: enterpriseId,
      onlyUser: 1,
      ...values,
    }
    getMemberListAction(params).then((res: any) => {
      if (res.success) {
        const data = res.data.childs
        if (data && data.length) {
          data.map((item: MemberDetailsItemProps) => {
            item.key = item.id
          })
          setMemberDetails(data)
        } else {
          setMemberDetails([])
        }
      }
    })
  }

  // 选中角色 - 查询详细人员
  function getRoleDetails(record: RoleItemProps) {
    const values = {
      ascriptionId: record.id,
      ascriptionType: 5,
      keywords: '',
    }
    getMemberList(values)
    // 设置选中状态样式
    setRoleData(origin => {
      return origin.map(res => {
        if (res.id === record.id) {
          return {
            ...res,
            actived: true,
          }
        } else {
          return {
            ...res,
            actived: false,
          }
        }
      })
    })
    record.key = `${record.type}_${record.id}`
    setSelectedNodes([record])
  }

  //选中岗位 - 查询详细人员
  function postDataChecked(record: PostListProps) {
    // 设置选中状态样式
    setPostData(origin => {
      return origin.map(res => {
        if (res.id === record.id) {
          return {
            ...res,
            actived: true,
          }
        } else {
          return {
            ...res,
            actived: false,
          }
        }
      })
    })
    const values = {
      ascriptionId: record.id,
      ascriptionType: 31,
      keywords: '',
    }
    record.key = `${record.type}_${record.id}`
    getMemberList(values)
    setSelectedNodes([record])
  }

  //选中企业和部门tree - 查询详细人员
  function onTreeSelect(selectedKeys: (string | number)[], e: object) {
    if (selectedKeys.length > 0) {
      const values = {
        ascriptionId: selectedKeys[0],
        ascriptionType: 3,
        keywords: '',
      }
      const record = e['node']
      record.key = `${record.type}_${record.id}`
      getMemberList(values)
      setSelectedNodes([record])
    }
  }

  function setDataChecked(record: MemberDetailsItemProps, flag: boolean) {
    setMemberDetails(origin => {
      origin.map(item => {
        if (item.key === record.key) {
          item.checked = flag
        }
      })
      return [...origin]
    })
  }
  // 详情-多选框-选中后保存数据
  function checkedChange(e: object, record: MemberDetailsItemProps) {
    if (e['target']['checked']) {
      const isCompanyChecked = checkedMember.find(item => {
        return item.type === 2
      })
      if (isCompanyChecked) {
        message.warn('不能同时选中企业和成员，请先删除选中企业')
        return
      }
      setDataChecked(record, true)
      setCheckedMember(origin => {
        const result =
          origin &&
          origin.find(item => {
            return item.name === record['name']
          })
        if (!result) {
          return [...origin, record]
        } else {
          return [...origin]
        }
      })
    } else {
      setDataChecked(record, false)
      setCheckedMember(origin => {
        return origin.filter(item => {
          return item.key !== record['key']
        })
      })
    }
  }

  // 选中的人员移到右侧
  function handleJoin() {
    const result = memberDetailsList.filter((item: MemberDetailsItemProps) => {
      return item.checked === true
    })
    if (result.length === 0) {
      if (selectedNodes[0]['type'] === 2) {
        //中选中企业时覆盖所有选中的数据
        setCheckedMember(selectedNodes)
      } else if (selectedNodes[0]['type'] === 3) {
        // 选中部门：提示是否包含子部门
        const obj = {
          ...selectedNodes[0],
        }
        Modal.confirm({
          title: '信息提示',
          content: <div>是否包含子部门？</div>,
          okText: '包含',
          cancelText: '不包含',
          centered: true,
          onOk() {
            obj.name = `${obj['name']}(包含子部门)`
            obj.includeChild = '1'
            setCheckedMember(origin => {
              const result = origin.find(item => {
                return item.key === selectedNodes[0].key
              })
              if (!result) {
                return [...origin, obj]
              }
              return origin
            })
          },
          onCancel() {
            obj.name = `${obj['name']}(不包含子部门)`
            obj.includeChild = '0'
            setCheckedMember(origin => {
              const result = origin.find(item => {
                return item.key === selectedNodes[0].key
              })
              if (!result) {
                return [...origin, obj]
              }
              return origin
            })
          },
        })
      } else {
        setCheckedMember(origin => {
          const result = origin.find(item => {
            return item.key === selectedNodes[0].key
          })
          if (!result) {
            return [...origin, ...selectedNodes]
          }
          return origin
        })
      }
    }
  }

  // 右侧删除数据并同步到左侧
  function delChecked(record: MemberDetailsItemProps) {
    setDataChecked(record, false)
    setCheckedMember(origin => {
      return origin.filter(item => {
        return item['key'] !== record.key
      })
    })
  }

  function updateTreeData(list: DataNode[], key: React.Key, children: DataNode[]): DataNode[] {
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

  function fetchTreeData(key: number, ascriptionType: number, resolve?: () => void) {
    //待优化 = 优化后统一使用/team/permission/findEnterpriseTree接口，permission=-1不查权限
    let params = {},
      deptUrl = ''
    if (use === 'authManage') {
      // 权限管理额外所需参数
      deptUrl = '/team/permission/findEnterpriseTree'
      params = {
        type: ascriptionType, //权限管理-类型
        teamId: enterpriseId, //权限管理-企业id
        id: key, //权限管理-部门id
        view: '2#3#', //公共-查询企业下部门
        permissionType: 3,
        account: $store.getState().nowAccount,
      }
    } else {
      deptUrl = '/team/enterpriseRoleInfo/findEnterpriseTree'
      params = {
        ascriptionType, //公告-类型
        orgId: enterpriseId, //公告-企业id
        ascriptionId: key, //公告-部门id
        level: 1, //公告-单独所需
        view: '2#3#', //公共-查询企业下部门
      }
    }

    getDeptTree(params, deptUrl).then((res: any) => {
      if (res.success) {
        const data = { ...res.data }
        renderTreeData(data)
        if (resolve) {
          setTreeData(origin => updateTreeData(origin, key, data.children))
          resolve()
        } else {
          if (use === 'authManage') {
            // 权限管理地方-过滤掉企业数据只展示企业下部门
            setTreeData(data.children || [])
          } else {
            setTreeData([data])
          }
        }
      }
    })
  }

  // 查询企业下面的部门
  function onLoadData({ key, children }: any): Promise<void> {
    return new Promise(resolve => {
      if (children && children.length > 0) {
        resolve()
        return
      }
      fetchTreeData(key, 3, resolve)
    })
  }

  // 查询企业
  useEffect(() => {
    if (visible) {
      fetchTreeData(enterpriseId, 2)
    }
  }, [])

  return (
    <Modal
      title="选择适用范围"
      className="modalSelectMember"
      width={850}
      bodyStyle={{ maxHeight: '680px', overflowY: 'auto' }}
      visible={visible}
      onOk={() => checkMemberVisible(false)}
      onCancel={() => checkMemberVisible(false)}
      footer={
        <div className="modalFooter">
          <div>
            {apply === 0 || apply === 1 ? (
              <Radio.Group
                defaultValue={apply}
                onChange={(e: any) => applyChange && applyChange(e['target']['value'])}
              >
                <Radio value={0}>仅适用部门、岗位、角色当前包含的成员查看</Radio>
                <Radio value={1}>
                  新加入适用部门、岗位、角色的成员可查看，退出适用部门、岗位、角色不可查看
                </Radio>
              </Radio.Group>
            ) : (
              ''
            )}
          </div>
          <div style={{ width: '160px' }}>
            <Button type="ghost" onClick={() => checkMemberVisible(false)}>
              取消
            </Button>
            <Button
              type="primary"
              onClick={() => {
                console.log(checkedMember)
                setMemberData(checkedMember)
                checkMemberVisible(false)
              }}
            >
              确定
            </Button>
          </div>
        </div>
      }
    >
      <Row justify="space-between" align="middle" gutter={20}>
        <Col span="11">
          <Tabs defaultActiveKey="DEPT" onChange={tabChange} className="roleTreeContent">
            <TabPane tab="部门" key="DEPT">
              {treeData && <Tree showIcon loadData={onLoadData} treeData={treeData} onSelect={onTreeSelect} />}
            </TabPane>
            <TabPane tab="岗位" key="POST">
              {postData.map(item => {
                return (
                  <div
                    className={`memberList ${item.actived ? ' active' : ''}`}
                    key={item.id}
                    onClick={() => postDataChecked(item)}
                  >
                    {item.deptName}-{item.name}
                  </div>
                )
              })}
            </TabPane>
            {use !== 'authManage' && (
              <TabPane tab="角色" key="ROLE">
                {roleData.map((item: any) => {
                  return (
                    <div
                      className={`memberList ${item.actived ? ' active' : ''}`}
                      key={item.id}
                      onClick={() => getRoleDetails(item)}
                    >
                      {item.roleName}
                    </div>
                  )
                })}
              </TabPane>
            )}
          </Tabs>
          <Card className="deptDetails" size="small" title="详细信息">
            {memberDetailsList.length ? (
              memberDetailsList.map((item: MemberDetailsItemProps) => {
                // const currentId = item.id ? item.id : item.rid
                const currentId = item.id
                const key = `${currentId}_${item.deptId}_${item.roleId}`
                const role = `${item.roleName}`
                return (
                  <Checkbox
                    onChange={(e: object) => checkedChange(e, item)}
                    key={key}
                    id={key}
                    checked={item.checked}
                  >
                    <span className="deptDetailsName">
                      {item.deptName} {role ? `-${role}` : ''} - {item.name}
                    </span>
                  </Checkbox>
                )
              })
            ) : (
              <div className="noDataText">暂无详细信息</div>
            )}
          </Card>
        </Col>
        {/* type=2 选中的为企业时 不能再选其他按钮不可见 */}
        <Col span="2" style={{ textAlign: 'center', fontSize: '20px' }}>
          {checkedMember && checkedMember.length > 0 && checkedMember[0].type === 2 ? (
            ''
          ) : (
            <DoubleRightOutlined onClick={handleJoin} />
          )}
        </Col>
        <Col span="11">
          <div className="searchBox">
            {placeHolderValue === 'DEPT' || placeHolderValue === 'ROLE' ? (
              <Search placeholder={searchType[placeHolderValue]} onSearch={value => onSearch(value)} />
            ) : (
              <div>
                <Input.Group compact>
                  <Search
                    placeholder={searchType[placeHolderValue]}
                    onSearch={value => onSearch(value)}
                    style={{ width: '264px', marginRight: '8px', border: 'none' }}
                  />
                  <Select
                    defaultValue="POST"
                    onChange={activeKey => {
                      setPlaceHolderValue(activeKey)
                    }}
                  >
                    <Option value="POST">岗位</Option>
                    <Option value="POST_NAME">人员</Option>
                  </Select>
                </Input.Group>
              </div>
            )}
          </div>
          <Card className="userChecked" title="已选" size="small">
            {checkedMember.length > 0 && (
              <List
                className="checkedList"
                size="small"
                dataSource={checkedMember}
                renderItem={(item: MemberDetailsItemProps) => (
                  <List.Item key={item.id}>
                    {/* 角色6 岗位31 企业2、部门3、人员4 */}
                    <List.Item.Meta
                      avatar={<Avatar size="small" icon={<UserOutlined />} />}
                      title={
                        item.type === 6
                          ? item['roleName']
                          : item.type === 31
                          ? `${item.deptName}-${item.name}`
                          : item['name']
                      }
                    />
                    <div>
                      <CloseCircleOutlined className="icon" onClick={() => delChecked(item)} />
                    </div>
                  </List.Item>
                )}
              ></List>
            )}
          </Card>
        </Col>
      </Row>
    </Modal>
  )
}

export default SelectMember
