import React, { useState, useEffect } from 'react'
import { Modal, Tabs, Radio, Input, Select, Tree } from 'antd'
const { TabPane } = Tabs
import './AddSignModal.less'
import $c from 'classnames'
import { useSelector } from 'react-redux'

interface AddSignModalProps {
  teamId: number
  nowApprovalId: number //审批id
  eventId: number //事件id
  onClose: () => void
  onSure: (data: any[], type: string) => void
  checkType?: string
  nodeUsers?: any[]
  isFindAllDept?: boolean //是否查询所有部门
  insteadofNode?: boolean //是否是替换节点
  isOnlyPeo?: boolean //只要人员控件不需要子级
}

//对象数组去重
const isInArray = (arr: any[], item: any) => {
  let isIn = false
  arr.map(idx => {
    if (idx.id === item.id) {
      isIn = true
      return false
    }
  })
  return isIn
}

//tab下选中数据
let TopSelVal = ''
/**
 * 加签选择节点
 */
const AddSignModal = (props: AddSignModalProps) => {
  const { teamId, nowApprovalId, eventId, onClose, onSure } = props
  const signModalObj = useSelector((store: StoreStates) => store.showSignModal)
  //选择的集合
  const [selectUser, setSelectUsers] = useState<any[]>([])
  //选择tab 默认部门
  const [activeKey, setActiveKey] = useState('0')
  //详细信息数据
  const [infoData, setInfoData] = useState<Array<any>>([])
  //默认岗位搜索
  const [roleType, setRoleType] = useState('2')
  //搜索框文案
  const [inputPlaceHolder, setInputPlaceHolder] = useState('请输入姓名进行搜索')
  //岗位搜索关键字
  const [keyWords, setKeyWords] = useState('')
  //tabs数据
  const signTabs = [
    {
      key: '0',
      title: '部门',
      visible: true,
    },
    {
      key: '1',
      title: '岗位',
      visible: true,
    },
    {
      key: '2',
      title: '角色',
      visible: true,
    },
    {
      key: '3',
      title: '发起者',
      visible: true,
    },
    {
      key: '5',
      title: '底表人员',
      visible: false,
    },
    {
      key: '6',
      title: '表单控件',
      visible: true,
    },
  ]

  //切换tab
  const changeSelTab = (activeKey: string) => {
    setRoleType('2')
    setActiveKey(activeKey)
  }

  useEffect(() => {
    let showTxt = ''
    if (activeKey === '0' || (activeKey === '1' && roleType === '1')) {
      showTxt = '请输入姓名进行搜索'
    } else if (activeKey === '1' && roleType === '2') {
      showTxt = '请输入岗位进行搜索'
    } else if (activeKey === '2') {
      showTxt = '请输入角色名称进行搜索'
    }
    setInputPlaceHolder(showTxt)
  }, [activeKey, roleType])

  //根据传入的id和type请求详细信息列表
  const getUsersById = (type: string, id: string) => {
    const { nowAccount, loginToken } = $store.getState()
    const param = {
      ascriptionId: id,
      ascriptionType: type,
      onlyUser: 1,
      orgId: teamId,
      keywords: '',
      account: nowAccount,
      permissionType: 3,
    }
    $api
      .request('/team/enterpriseRoleInfo/findUserByEnterprise', param, {
        headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
      })
      .then(resData => {
        const userList = resData.data.childs || []
        const showUsers: any = []
        userList.map((item: { deptName: string; roleName: string; name: string; type: string; id: string }) => {
          if (!isInArray(showUsers, item)) {
            showUsers.push({
              label: item.deptName + '-' + item.roleName + '-' + item.name,
              value: item.type + '#' + item.id + '#' + item.name,
              id: item.id,
            })
          }
        })
        setInfoData(showUsers)
      })
  }

  //根据关键字搜索solr
  const getUserlistByKeyWords = (keywords: string) => {
    const { nowAccount, loginToken } = $store.getState()
    const param = {
      orgid: teamId,
      onlyUser: 1,
      keywords: keywords,
      account: nowAccount,
      permissionType: 3,
    }
    $api
      .request('/team/user/solr/findUserByEnterprise', param, {
        headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
      })
      .then(resData => {
        const userList = resData.dataList || []
        const showUsers: any = []
        userList.map((item: { deptchain: string; username: string; id: string }) => {
          if (!isInArray(showUsers, item)) {
            const deptName = item.deptchain.split('###')[1]
            const roleName = item.deptchain.split('###')[3]
            showUsers.push({
              label: deptName + '-' + roleName + '-' + item.username,
              value: 0 + '#' + item.id + '#' + item.username,
              id: item.id,
            })
          }
        })
        setInfoData([...showUsers])
      })
  }

  //选择详细信息时回调
  const changeRadioSel = (e: any) => {
    TopSelVal = e.target.value
  }

  //选择tab数据后回调
  const changeTopValue = (value: string) => {
    TopSelVal = value
  }

  //点击按钮将选择的值展示到右侧已选
  const selValToRight = () => {
    if (TopSelVal !== '') {
      setSelectUsers([TopSelVal])
    }
  }

  //点击删除
  const removeSelect = (index: number) => {
    const newSelect = selectUser.filter((_item, idx) => idx !== index)
    setSelectUsers(newSelect)
  }

  /**
   * 切换岗位搜索类型
   */
  const changeSelRoleType = (value: any) => {
    setRoleType(value)
  }

  //搜索框搜索
  const changeSearchInput = (e: any) => {
    if (activeKey === '0' || (activeKey === '1' && roleType === '1')) {
      getUserlistByKeyWords(e.target.value)
    }
    setKeyWords(e.target.value)
  }
  return (
    <Modal
      className="add-sign-modal"
      title={'新增节点'}
      width={850}
      visible={signModalObj.visible}
      closable={true}
      onCancel={onClose}
      onOk={() => onSure(selectUser, signModalObj.type)}
      destroyOnClose={true}
    >
      <div className="sign-left-box">
        <div className="top-conner">
          <Tabs activeKey={activeKey} onChange={changeSelTab}>
            {signTabs.map(item => {
              if (item.visible) {
                return (
                  <TabPane key={item.key} tab={item.title} forceRender={true}>
                    {activeKey === '0' && (
                      <DeptTreeComponent teamId={teamId} callback={getUsersById} onChange={changeTopValue} />
                    )}
                    {activeKey === '1' && (
                      <RoleList
                        teamId={teamId}
                        keyword={keyWords}
                        callback={getUsersById}
                        onChange={changeTopValue}
                      />
                    )}
                    {activeKey === '2' && (
                      <AllRoles
                        teamId={teamId}
                        keyword={keyWords}
                        callback={getUsersById}
                        onChange={changeTopValue}
                      />
                    )}
                    {activeKey === '3' && <SendUsers onChange={changeTopValue} />}
                    {activeKey === '6' && (
                      <FormItemList approvalId={nowApprovalId} eventId={eventId} onChange={changeTopValue} />
                    )}
                  </TabPane>
                )
              }
            })}
          </Tabs>
        </div>
        {activeKey !== '3' && activeKey !== '6' && (
          <div className="bottom-conner">
            <div className="sign-title">详细信息</div>
            <div className={$c('user-list', { noneData: infoData.length === 0 })}>
              {infoData.length === 0 && <span>暂无详细信息</span>}
              {infoData.length !== 0 && (
                <Radio.Group options={infoData} onChange={changeRadioSel}></Radio.Group>
              )}
            </div>
          </div>
        )}
      </div>
      <div
        className="approval-select-add"
        onClick={e => {
          e.preventDefault()
          selValToRight()
        }}
      ></div>
      <div className="sign-right-box">
        {(activeKey === '1' || activeKey === '2' || activeKey === '0') && (
          <div className="search_user_input_box">
            <Input
              type="text"
              placeholder={inputPlaceHolder}
              value={keyWords}
              onChange={changeSearchInput}
              suffix={<img src={$tools.asAssetsPath('/images/common/search.png')} />}
            />
            {activeKey === '1' && (
              <Select className="select_input_type" defaultValue={'2'} onChange={changeSelRoleType}>
                <Select.Option value="1">人员</Select.Option>
                <Select.Option value="2">岗位</Select.Option>
              </Select>
            )}
          </div>
        )}
        <div className="bottom-select-list">
          <span className="sign-title">已选</span>
          <div className="selected-user-list">
            {selectUser.length !== 0 &&
              selectUser.map((item, index) => {
                const showType = item.split('#')[0]
                const showId = item.split('#')[1]
                const showName = item.split('#')[2]
                return (
                  <div className="selected-user-item" key={index}>
                    <div className="showUser">
                      <span className={showType === '3' ? 'org_icon' : 'user_icon'}></span>
                      <span className="show_name">{showName}</span>
                    </div>
                    <div
                      className="del_icon"
                      onClick={() => {
                        removeSelect(index)
                      }}
                    ></div>
                  </div>
                )
              })}
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default AddSignModal

/**
 * 查询部门树结构
 */
const getDeptTreeData = (teamId: number, parentId?: string, parentType?: string) => {
  return new Promise<any>(resolve => {
    const { nowAccount, loginToken } = $store.getState()
    const param = {
      id: parentId || teamId,
      type: parentType || 2,
      teamId: teamId,
      account: nowAccount,
      permissionType: 3,
      view: '2#3#',
    }
    $api
      .request('/team/permission/findEnterpriseTree', param, {
        headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
      })
      .then(resData => {
        resolve(resData.data)
      })
  })
}

//处理treechilds 数据
const handleChildsData = (childs: any[]) => {
  const treeChildData = childs.map(item => {
    return {
      title: item.name,
      key: item.type + '#' + item.id + '#' + item.name,
      isLeaf: item.hasChild === 0,
    }
  })
  return treeChildData
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

/**
 * 部门树
 */
const DeptTreeComponent = (props: {
  teamId: number
  callback: (type: string, id: string) => void
  onChange: (selectValue: string) => void
}) => {
  const { teamId, callback, onChange } = props
  const [treeData, setTreeData] = useState<Array<any>>([])
  const [expandedKeys, setExpandedKeys] = useState<string[]>([])
  useEffect(() => {
    //初始查询部门树数据
    getDeptTreeData(teamId).then(data => {
      const treeKey = data.type + '#' + data.id + '#' + data.name
      const treeInitData = [
        {
          title: data.name,
          key: treeKey,
          disabled: true,
          children: handleChildsData(data.childs),
        },
      ]
      setExpandedKeys([treeKey])
      setTreeData(treeInitData)
    })
  }, [])

  //异步加载数据
  const onLoadData = (treeNode: any) => {
    return new Promise<any>(resolve => {
      if (treeNode.children) {
        resolve()
        return
      }
      const id = treeNode.key.split('#')[1]
      const type = treeNode.key.split('#')[0]
      setExpandedKeys([...expandedKeys, treeNode.key])
      getDeptTreeData(teamId, id, type).then(data => {
        const childrenData = data.childs.map(
          (item: { name: any; type: string; id: string; hasChild: number }) => {
            return {
              title: item.name,
              key: item.type + '#' + item.id + '#' + item.name,
              isLeaf: item.hasChild === 0,
            }
          }
        )
        setTreeData(origin => updateTreeData(origin, treeNode.key, childrenData))
        resolve()
      })
    })
  }

  //展开收起
  const onExpand = (expandedKeys: any[]) => {
    setExpandedKeys(expandedKeys)
  }

  //选中
  const onSelect = (selectedKeys: any) => {
    if (selectedKeys.length !== 0) {
      //回调查询详细信息
      callback(selectedKeys[0].split('#')[0], selectedKeys[0].split('#')[1])
      //树选择回调
      onChange(selectedKeys[0])
    }
  }
  return (
    <Tree
      expandedKeys={expandedKeys}
      onExpand={onExpand}
      onSelect={onSelect}
      loadData={onLoadData}
      treeData={treeData}
    />
  )
}

/**
 * 根据企业id查询岗位列表
 */
const getRoleListData = (teamId: number, keyword: string) => {
  return new Promise<any>(resolve => {
    const { nowAccount, loginToken } = $store.getState()
    const param = {
      id: teamId,
      keywords: keyword,
      accoun: nowAccount,
      permissionType: 3,
    }
    $api
      .request('/team/enterpriseRoleInfo/findEntRoles', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        resolve(resData.dataList || [])
      })
  })
}

/**
 * 岗位列表
 */
const RoleList = (props: {
  teamId: number
  keyword: string
  callback: (type: string, id: string) => void
  onChange: (selectValue: string) => void
}) => {
  const { teamId, keyword, callback, onChange } = props
  //岗位列表数据
  const [roleListData, setRoleListData] = useState<Array<any>>([])
  //选择岗位id
  const [selectRoleId, setSelectRoleId] = useState('')
  //初始化请求数据
  useEffect(() => {
    getRoleListData(teamId, keyword).then(dataList => {
      setRoleListData(dataList)
    })
  }, [keyword])

  //点击选中岗位
  const selectRole = (id: number, type: number, name: string) => {
    setSelectRoleId(String(id))
    callback(String(type), String(id))
    const selVal = type + '#' + id + '#' + name
    onChange(selVal)
  }

  return (
    <ul className="show_list_ul">
      {roleListData.map(item => (
        <li
          key={item.type + '-' + item.id}
          onClick={() => {
            selectRole(item.id, item.type, item.deptName + '-' + item.name)
          }}
        >
          <a className={$c({ active: String(item.id) === selectRoleId })}>
            {item.deptName}-{item.name}
          </a>
        </li>
      ))}
    </ul>
  )
}

/**
 * 根据企业id查询角色列表
 */
const getAllRolesList = (teamId: number, keyword: string) => {
  return new Promise<any>(resolve => {
    const { loginToken } = $store.getState()
    const param = {
      enterpriseId: teamId,
      keywords: keyword,
    }
    $api
      .request('/team/enterpriseRole/findRoleList', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        resolve(resData.dataList || [])
      })
  })
}

/**
 * 所有角色列表
 */
const AllRoles = (props: {
  teamId: number
  keyword: string
  callback: (type: string, id: string) => void
  onChange: (selectValue: string) => void
}) => {
  const { teamId, keyword, callback, onChange } = props
  //角色列表数据
  const [roleListData, setRoleListData] = useState<Array<any>>([])
  //选择角色id
  const [selectRoleId, setSelectRoleId] = useState('')
  //初始化请求数据
  useEffect(() => {
    getAllRolesList(teamId, keyword).then(dataList => {
      setRoleListData(dataList)
    })
  }, [keyword])

  //点击选中角色
  const selectRole = (id: number, type: number, name: string) => {
    setSelectRoleId(String(id))
    callback(String(type), String(id))
    const selVal = type + '#' + id + '#' + name
    onChange(selVal)
  }

  return (
    <ul className="show_list_ul">
      {roleListData.map(item => (
        <li
          key={item.id}
          onClick={() => {
            selectRole(item.id, 5, item.roleName)
          }}
        >
          <a className={$c({ active: String(item.id) === selectRoleId })}>{item.roleName}</a>
        </li>
      ))}
    </ul>
  )
}

/**
 * 发起者列表
 */
const SendUsers = (props: { onChange: (selectValue: string) => void }) => {
  const { onChange } = props
  //选择发起者类型
  const [selectRoleId, setSelectRoleId] = useState('')
  //点击选中发起者列表项
  const selectRole = (type: number, id: number, name: string) => {
    setSelectRoleId(String(type))
    const selVal = type + '#' + id + '#' + name
    onChange(selVal)
  }
  return (
    <ul className="show_list_ul">
      <li
        onClick={() => {
          selectRole(6, 0, '直接主管')
        }}
      >
        <a className={$c({ active: '6' === selectRoleId })}>直接主管</a>
      </li>
      <li
        onClick={() => {
          selectRole(7, 0, '间接主管')
        }}
      >
        <a className={$c({ active: '7' === selectRoleId })}>间接主管</a>
      </li>
      <li
        onClick={() => {
          selectRole(8, 0, '第三级主管')
        }}
      >
        <a className={$c({ active: '8' === selectRoleId })}>第三级主管</a>
      </li>
      <li
        onClick={() => {
          selectRole(9, 0, '发起者本人')
        }}
      >
        <a className={$c({ active: '9' === selectRoleId })}>发起者本人</a>
      </li>
      <li
        onClick={() => {
          selectRole(10, 0, '发起者分管领导')
        }}
      >
        <a className={$c({ active: '10' === selectRoleId })}>发起者分管领导</a>
      </li>
      <li
        onClick={() => {
          selectRole(11, 0, '发起者部门主管')
        }}
      >
        <a className={$c({ active: '11' === selectRoleId })}>发起者部门主管</a>
      </li>
      <li
        onClick={() => {
          selectRole(12, 0, '企业负责人')
        }}
      >
        <a className={$c({ active: '12' === selectRoleId })}>企业负责人</a>
      </li>
    </ul>
  )
}

/**
 * 请求表单控件列表
 */
const getFormItemList = (approvalId: number, eventId: number) => {
  return new Promise<any>(resolve => {
    const { loginToken } = $store.getState()
    const param = {
      eventId: eventId,
      approvalId: approvalId,
    }
    $api
      .request('/approval/approval/template/find/turn/info', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        const resolveData = resData.dataList.filter(
          (item: { type: string; elementId: any }) => item.type === 'peoSel' && item.elementId !== null
        )
        resolve(resolveData)
      })
  })
}

/**
 * 表单控件列表
 */
const FormItemList = (props: {
  approvalId: number
  eventId: number
  onChange: (selectValue: string) => void
}) => {
  const { approvalId, eventId, onChange } = props
  //人员控件列表
  const [peoSelList, setPeoSelList] = useState<any[]>([])

  //初始化请求数据
  useEffect(() => {
    getFormItemList(approvalId, eventId).then(data => {
      setPeoSelList(data)
    })
  }, [])

  //固定子级
  const getChildData = (elementId: string) => {
    const childArr = [
      {
        title: '人员本人',
        key: 13 + '#' + elementId + '#人员本人',
      },
      {
        title: '人员的直接主管',
        key: 15 + '#' + elementId + '#人员的直接主管',
      },
      {
        title: '人员的间接主管',
        key: 16 + '#' + elementId + '#人员的间接主管',
      },
      {
        title: '人员的第三级主管',
        key: 17 + '#' + elementId + '#人员的第三级主管',
      },
      {
        title: '人员的分管领导',
        key: 18 + '#' + elementId + '#人员的分管领导',
      },
      {
        title: '人员的部门主管',
        key: 19 + '#' + elementId + '#人员的部门主管',
      },
    ]
    return childArr
  }

  //选中控件
  const selectFormItem = (selectedKeys: any) => {
    if (selectedKeys.length > 0) {
      onChange(selectedKeys[0])
    }
  }

  return (
    <div className="form-list">
      {peoSelList.length !== 0 &&
        peoSelList.map(item => {
          const nowTreeData = [
            {
              title: item.typeName,
              key: item.elementId,
              disabled: true,
              children: getChildData(item.elementId),
            },
          ]
          return (
            <Tree
              key={item.elementId}
              onSelect={selectFormItem}
              defaultExpandAll={true}
              treeData={nowTreeData}
            />
          )
        })}
    </div>
  )
}
