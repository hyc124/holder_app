import React, { useState, useContext, useImperativeHandle } from 'react'
import { Tree, Checkbox, Radio } from 'antd'
import { requestApi } from '../../../../common/js/ajax'
import { findRepeatIndex } from '@/src/common/js/common'
import MemberRenderTreeData from './MemberRenderTreeData'

// 创建弹框上下文
export const modalContext = React.createContext({})

interface TreeProps {
  findId: string
  findType: number
  findName: string
  hasChild?: number
  teamId: string
  teamName: string
  findChild?: boolean
  treeKey?: any
  isSearch?: boolean
  key_words?: string
}
/**
 * 根据筛选类型显示的组织架构内容
 */
interface DataNode {
  title: string
  key: string
  isLeaf?: boolean
  children?: DataNode[]
}

// 记录树形结构展开节点
let treeExpandedKeys: any = []
const OrgShowCon = React.forwardRef(
  (props: { checkableType: any; ref?: any; param: any; action: any }, ref) => {
    let checkableType = props.checkableType
    // 弹框上下文数据
    const modalContextObj: any = useContext(modalContext)
    // 继承父组件参数
    const ptParam = props.param || {}
    // 继承的父组件方法
    const ptAction = props.action || {}
    // 继承的options参数
    const options = props.param.options || {}
    // 组织架构树
    const [treeData, setTreeData] = useState<any>({
      orgData: [],
      expandedKeys: [],
    })
    const [checkedKeys, setCheckedKeys] = useState<any>([])
    // 常用联系人
    const [contactsData, setContactsData] = useState<any>([])
    // 按角色选择
    const [roleOrgInfo, setRoleOrgInfo] = useState<any>({
      orgData: [],
      expandedKeys: [],
    })
    const [roleCheckedKeys, setRoleCheckedKeys] = useState<any>([])
    // checkable 或单选状态下节点选择是否完全受控（为true父子节点选中状态不再关联）
    let checkStrictly = false
    if (options.checkableType || options.checkboxType == 'radio') {
      checkStrictly = true
    }

    // ***********************暴露给父组件的方法 start**************************//
    // 此处注意useImperativeHandle方法的的第一个参数是目标元素的ref引用
    useImperativeHandle(ref, () => ({
      // 设置树形结构数据
      setTreeData: (data: any) => {
        setTreeData(data)
      },
      // 按类型查询第一层组织架构树
      findByType: (type: number, paramObj: any, attachObj: { checkableType: Array<number> }) => {
        checkableType = attachObj.checkableType || []
        findByType(type, paramObj)
      },
      // 按类型刷新左侧
      delByType: (type: number, paramObj: any) => {
        delByType(type, paramObj)
      },
      // 刷新常用联系人数据选择状态
      setContactsDataChange: (checked: boolean, curId: any) => {
        if (contactsData.length === 0) return
        for (const i in contactsData) {
          const item = contactsData[i]
          if (item.contactsUser == curId) {
            item.checked = checked
          }
        }
        setContactsData([...contactsData])
      },
    }))
    // ***********************暴露给父组件的方法 end**************************//

    /**
     * 按类型筛选
     * @param type 组织架构展示类型：0按组织架构 1按角色 2按第一层部门 3常用联系人
     */
    const findByType = (type: number, paramObj: any) => {
      switch (type) {
        case 1: //企业组织架构
        case 3: //首层部门组织架构
          findOrgTree(paramObj)
          break
        case 2: //角色组织架构
          findRoleOrg(paramObj)
          break
        case 4: //常用联系人
          findContacts(paramObj)
          break
        default:
          break
      }
    }

    /**
     * 按类型删除和刷新左侧组织架构数据选中状态
     * @param type 组织架构展示类型：1按组织架构 2按角色 3按第一层部门 4常用联系人
     */
    const delByType = (type: number, paramObj: any) => {
      if (options.orgBotInfo.type == 'report') {
        //任务干系人
        for (const i in options.orgBotList) {
          if (options.orgBotList[i].curId == paramObj.curId) {
            options.orgBotList[i].checked = false
          }
        }
      }
      switch (type) {
        case 2: //角色组织架构
          for (let i = 0; i < roleCheckedKeys.length; i++) {
            const thisTree = getTreeParam(roleCheckedKeys[i])
            if (thisTree.curId == paramObj.curId && thisTree.curType == paramObj.curType) {
              roleCheckedKeys.splice(i, 1)
              i--
            }
          }
          setRoleCheckedKeys([...roleCheckedKeys])
          break
        case 1: //企业组织架构
        case 3: //首层部门组织架构
          for (let i = 0; i < checkedKeys.length; i++) {
            const thisTree = getTreeParam(checkedKeys[i])
            if (thisTree.curId == paramObj.curId && thisTree.curType == paramObj.curType) {
              checkedKeys.splice(i, 1)
              i--
            }
            if (
              options.cascadeMember &&
              thisTree.curId == paramObj.parentId &&
              thisTree.curType == paramObj.parentType
            ) {
              checkedKeys.splice(i, 1)
              i--
            }
          }
          setCheckedKeys([...checkedKeys])
          break
        case 4: //常用联系人
          for (const i in contactsData) {
            const item = contactsData[i]
            if (item.contactsUser == paramObj.curId) {
              item.checked = false
            }
          }
          setContactsData([...contactsData])
          break
        default:
          break
      }
    }

    /**
     * 获取当前企业、部门、成员信息
     * nodeInfo 树结构当前节点组装key
     * parent：父级链信息
     */
    const getTreeParam = (nodeInfo: any, parent?: any) => {
      /**
       * getType: 保存当前选中类型 (2企业 3部门 31岗位)
       * curType：保存当前选中类型(2企业 3部门 31岗位)
       * curId:当前选中id
       * curName:当前选中名字
       * parentType：保存直属上级type
       * parentId:保存直属上级id
       * parentName:保存直属上级名字
       * cmyId：保存当前选中企业id
       * cmyName：保存当前选中企业id
       * deptId：选中部门id
       * roleId：选中岗位id
       */
      let curType = 0
      let curTypeName = ''
      let curId = ''
      let curName = ''
      let parentType = ''
      let parentId = ''
      let parentName = ''
      let cmyId = ''
      let cmyName = ''
      let deptId = ''
      let deptName = ''
      let roleId = ''
      let roleName = ''
      let characterId = '', //角色id
        characterName = '' //角色名
      let userId = '',
        userName = '',
        account = ''
      const params: any = nodeInfo
      if (params) {
        if (params.split('_')[2].indexOf('2') != -1 && params.split('_')[2].indexOf('##') == -1) {
          //选择企业
          cmyId = params.split('_')[1] // 保存企业id
          cmyName = params.split('_')[3] // 保存企业名
          curId = params.split('_')[1]
          curName = params.split('_')[3] //保存当前选中类型（企业/部门/岗位）
          curType = params.split('_')[2]
          curTypeName = params.split('_')[0]
        } else {
          const pArr = params.split('##')
          pArr.map((pitem: any, i: number) => {
            const infoArr = pitem.split('_')
            if (i == 0) {
              curId = pitem.split('_')[1]
              curName = pitem.split('_')[3] //保存当前选中类型（企业/部门/岗位）
              curType = pitem.split('_')[2]
              curTypeName = params.split('_')[0]
            }
            if (infoArr[0] == 'company') {
              cmyId = infoArr[1]
              cmyName = infoArr[3]
            } else if (infoArr[0] == 'parentId') {
              parentId = infoArr[1]
              parentName = infoArr[3]
              parentType = infoArr[2]
            } else if (infoArr[0] == 'role') {
              roleId = infoArr[1]
              roleName = infoArr[3]
            } else if (infoArr[0] == 'account') {
              //人员
              userId = infoArr[1]
              userName = infoArr[3]
              account = infoArr[4] || ''
            } else if (infoArr[0] == 'character') {
              //角色
              characterId = infoArr[1]
              characterName = infoArr[3]
            }
          })
        }
        curType = Number(curType)
        if (curType == 3) {
          deptId = curId
          deptName = curName
        } else if (curType == 31) {
          roleId = curId
          roleName = curName
        }
        // 查询父级信息里部门岗位的递归方法,已查到就不在往上级查询
        const findDeptRole = (parents: any) => {
          if (parents.type == 3 && !deptId && parents.id) {
            deptId = parents.id
            deptName = parents.name
          } else if (parents.type == 31) {
            roleId = parents.id
            roleName = parents.name
          }
          if (parents.parent) {
            findDeptRole(parents.parent)
          }
        }
        // 查询部门岗位
        if (parent) {
          findDeptRole(parent)
        }
      }

      return {
        curId: curId,
        curType: curType,
        curTypeName: curTypeName,
        curName: curName,
        parentId: parentId,
        parentName: parentName,
        parentType: parentType,
        cmyId: cmyId,
        cmyName: cmyName,
        deptId: deptId,
        deptName: deptName,
        roleId: roleId,
        roleName: roleName,
        userId: userId,
        userName: userName,
        account: account,
        characterId: characterId,
        characterName: characterName,
      }
    }
    //   =============================查询方法=========================//
    /**
     * 查询组织架构第一层
     */
    const findOrgTree = (paramObj: TreeProps) => {
      treeExpandedKeys = []
      const defaultLevel = options.defaultLevel
      let param: any = {
        id: paramObj.findId,
        type: paramObj.findType,
        teamId: paramObj.teamId,
        account: options.nowAccount,
        permissionType: options.permissionType,
        isQueryAll: options.isQueryAll ? 1 : 0,
        inMyself: 1, //是否包含自己
        notAccount: options.notAccount,
        defaultLevel: defaultLevel,
        view: '2#3#31#0#',
      }

      if (options.findType == 3) {
        param.view = '2#3#'
      } else if (options.findType == 31) {
        param.view = '2#3#31#'
      }
      let url = '/team/permission/findEnterpriseTree'
      if (options.isOuterSystem === 1) {
        //审批请求外部数据
        param = {
          approvalId: options.approvalObj.approvalId || null,
          eventId: options.approvalObj.eventId,
          teamId: paramObj.teamId,
          userAccount: options.nowAccount,
          uuid: options.approvalObj.uuid,
          elementType: options.approvalObj.elementType,
        }
        url = '/approval/businessSystem/outerSystemData'
      }
      requestApi({
        url: url,
        param: param,
        json: options.isOuterSystem === 1 ? false : true,
        setLoadState: modalContextObj.setLoading,
      }).then(res => {
        if (res.success) {
          const selData = ptAction.getSelData()
          // 默认展开的节点
          const expandedKeys: any = []
          // 默认选中的节点
          const selectKeys: any = []
          let getData: any = []
          // 企业信息
          let teamObj = {}
          if (options.isOuterSystem === 1) {
            const getObj = res.data.data.enterpriseTreeModel || {}
            //外部数据
            getData = [res.data.data.enterpriseTreeModel || {}]
            teamObj = {
              teamId: getObj.id,
              teamName: getObj.name,
            }
          } else {
            if (paramObj.findType == 2) {
              const getObj = res.data.data || {}
              getData = [res.data.data || {}]
              teamObj = {
                teamId: getObj.id,
                teamName: getObj.name,
              }
            } else {
              const childs = res.data.data.childs || []
              getData = [
                {
                  id: paramObj.findId,
                  name: paramObj.findName,
                  type: paramObj.findType,
                  hasChild: paramObj.hasChild,
                  childs: childs,
                },
              ]
              teamObj = {
                teamId: paramObj.teamId,
                teamName: paramObj.teamName,
              }
            }
          }

          const options1 = {
            array: getData,
            idKey: 'id',
            nameKey: 'name',
            hasChildKey: 'hasChild',
          }
          const options2 = {
            findType: '0',
            teamObj: teamObj,
            options: options,
            checkedKeys: selectKeys,
            selectData: selData,
            expandedKeys: expandedKeys,
          }
          MemberRenderTreeData(options1, options2, checkableType)
          setTreeData({
            orgData: [...getData],
            expandedKeys: expandedKeys,
          })
          // 更新单复选框选中状态
          setCheckedKeys([...selectKeys])
        }
      })
    }
    // 点击查询组织架构子级
    const queryTreeChild = (treeNode: any, resolve?: () => void) => {
      const treeInfo: any = getTreeParam(treeNode.key, treeNode.parent)
      const param = {
        id: treeInfo.curId,
        type: treeInfo.curType,
        teamId: treeInfo.cmyId,
        account: options.nowAccount,
        permissionType: options.permissionType,
        isQueryAll: options.isQueryAll ? 1 : 0,
        inMyself: 1,
        notAccount: options.notAccount,
        defaultLevel: 1,
      }
      requestApi({
        url: '/team/permission/findEnterpriseTree',
        param: param,
        json: true,
      }).then(res => {
        if (res.success) {
          const selData = ptAction.getSelData()
          const childData = res.data.data.childs || []
          const options1 = {
            array: childData,
            idKey: 'id',
            nameKey: 'name',
            hasChildKey: 'hasChild',
            id: treeInfo.curId,
            name: treeInfo.curName,
            type: treeInfo.curType,
          }
          const options2 = {
            findType: '0',
            teamObj: {
              teamId: treeInfo.cmyId,
              teamName: treeInfo.cmyName,
            },
            options: options,
            checkedKeys: checkedKeys,
            selectData: selData,
            parent: {
              id: treeNode.id,
              name: treeNode.name,
              type: treeNode.type,
              parent: treeNode.parent,
            },
          }
          MemberRenderTreeData(options1, options2, checkableType)
          const setData = setTreeChild(treeData.orgData, treeNode.key, childData)
          // 重新设置 expandedKeys
          setTimeout(() => {
            setTreeData({
              ...treeData,
              orgData: [...setData],
              expandedKeys: [...treeExpandedKeys],
            })
          }, 300)
          // 更新单复选框选中状态
          setCheckedKeys([...checkedKeys])
          if (resolve) {
            resolve()
          }
        }
      })
    }
    // =======================树形组件事件======================//
    /**
     * 添加子级到当前点击的树节点中
     * @param list 组织架构树数据
     * @param key 当前点击的节点key值
     * @param children 要添加的子级数据
     */
    const setTreeChild = (list: DataNode[], key: React.Key, children: DataNode[]): DataNode[] => {
      return list.map(node => {
        if (node.key === key) {
          return {
            ...node,
            children: children,
          }
        } else if (node.children) {
          return {
            ...node,
            children: setTreeChild(node.children, key, children),
          }
        }
        return node
      })
    }

    /**
     * 点击展开按钮加载子节点时
     * @param treeNode 当前点击的树节点
     */
    const onLoadData = (treeNode: any): Promise<void> => {
      return new Promise(resolve => {
        if (treeNode.children && treeNode.children.length > 0) {
          resolve()
          return
        }
        queryTreeChild(treeNode, resolve)
      })
    }
    /**
     * 点击组织架构展开节点
     * @param checkedKeys
     * @param e
     * @param attachInfo
     */
    const onExpandCmy = (expandedKeys: any, e: { expanded: boolean; node: any }, type: string | number) => {
      treeExpandedKeys = [...expandedKeys]
      // 角色
      if (type == 'character') {
        setRoleOrgInfo({
          ...roleOrgInfo,
          expandedKeys: [...expandedKeys],
        })
      } else {
        setTreeData({
          ...treeData,
          expandedKeys: [...expandedKeys],
        })
      }
    }
    /**
     * 递归查询满足的key值并存取
     * @param dataList
     * @param findId
     * @param findType
     * @param myCheckedKeys
     */
    const findNextsKey = (dataList: any, findId: string, findType: number, myCheckedKeys: any) => {
      // 存取所有被选中成员
      dataList.map((titem: any) => {
        if (titem.id == findId && titem.type == findType && !myCheckedKeys.includes(titem.key)) {
          myCheckedKeys.push(titem.key)
        }
        if (titem.children) {
          findNextsKey(titem.children || [], findId, findType, myCheckedKeys)
        }
      })
    }

    /**
     * 企业部门组织架构点击复选框触发
     * @param treeNode 当前点击的树节点
     */
    const onCheck = (checkedKeys: any, e: any, attachInfo: { source: string; preCheckedKeys: any }) => {
      let selData = ptAction.getSelData()
      const checkedNode: any = e.node
      // 单/复选框选中的节点key
      let myCheckedKeys: any = []
      // 单/复选框选中状态
      if (options.checkboxType == 'radio') {
        myCheckedKeys = [checkedNode.key]
      } else {
        myCheckedKeys = checkedKeys.checked
      }
      let checkedItem: any = {}
      let showName = ''

      // 级联选择人员时，排除掉checkedKeys中的部门岗位
      if (options.cascadeMember) {
        const newSelData: any = []
        // 选中人员
        if (e.checked) {
          checkedKeys.map((citem: any) => {
            const thisItem: any = getTreeParam(citem, checkedNode.parent)
            if (thisItem.curType == 0) {
              // 查找是否已经存在重复成员
              const isRepeat = findRepeatIndex({
                keyName: 'curId',
                keyVal: thisItem.curId,
                list: selData,
              })
              if (isRepeat == -1) {
                newSelData.push(thisItem)
              }
            }
          })
          // 存取所有被选中成员
          findNextsKey(treeData.orgData, e.node.id, e.node.type, myCheckedKeys)
        } else {
          // 获取删除的人员
          const delKeys = attachInfo.preCheckedKeys.filter((d: any) => !checkedKeys.includes(d))
          for (let i = 0; i < selData.length; i++) {
            for (const d in delKeys) {
              const delItem: any = getTreeParam(delKeys[d])
              if (selData[i].curId == Number(delItem.curId)) {
                selData.splice(i, 1)
                i--
                break
              }
            }
          }
          // 删除所有取消选中成员
          for (let c = 0; c < myCheckedKeys.length; c++) {
            const item: any = getTreeParam(myCheckedKeys[c])
            if (item.curId == e.node.id) {
              myCheckedKeys.splice(c, 1)
              break
            }
          }
        }
        selData = [...selData, ...newSelData]
      } else {
        // useExternal判断是否父组件传入 多选check
        if (attachInfo.source == 'character' && !options.useExternal) {
          const treeInfo: any = getTreeParam(checkedNode.key)
          checkedItem = {
            curId: checkedNode.userId || '',
            curType: 0,
            curName: checkedNode.username || '',
            parentId: checkedNode.roleId,
            parentName: checkedNode.roleName,
            parentType: 31,
            cmyId: treeInfo.cmyId,
            cmyName: treeInfo.cmyName,
            deptId: checkedNode.deptId || '',
            deptName: checkedNode.deptName || '',
            roleId: checkedNode.roleId || '',
            roleName: checkedNode.roleName || '',
            account: checkedNode.account || '',
          }
          showName = `${checkedNode.deptName || checkedItem.cmyName}-${checkedNode.roleName}${
            checkedNode.username ? '-' : ''
          }${checkedNode.username || ''}`
        } else {
          checkedItem = getTreeParam(checkedNode.key, checkedNode.parent)
          if (checkedItem.parentId == checkedItem.cmyId && checkedItem.parentType == 2) {
            showName = `${checkedItem.cmyName}-${checkedItem.curName}`
          } else {
            showName = `${checkedItem.cmyName}-${checkedItem.parentName}-${checkedItem.curName}`
          }
        }
        checkedItem.showName = showName
        // 头像
        checkedItem.profile = checkedNode.profile || ''
        // =======单选=======//
        if (options.checkboxType == 'radio') {
          selData = [checkedItem]
        } else {
          // =======多选=======//
          if (e.checked) {
            if (options.sourceType && options.sourceType === 'chat_invit') {
              // 替换当前选中企业的人
              let isIn = true
              selData.forEach((item: any, index: number) => {
                if (item.curId == checkedItem.curId) {
                  isIn = false
                  selData[index] = checkedItem
                }
              })
              if (isIn) {
                selData.push(checkedItem)
              }
            } else {
              selData.push(checkedItem)
            }
            // 存取所有被选中成员
            findNextsKey(treeData.orgData, e.node.id, e.node.type, myCheckedKeys)
          } else {
            if (options.sourceType && options.sourceType === 'chat_invit') {
              // 群主不可被取消
              const { nowUserId } = $store.getState()
              const iGroupLeader = selData.find((item: any) => {
                return item.curId == nowUserId && (item.curId == e.node.id || item.curId == e.node.userId)
              })
              if (iGroupLeader) {
                return
              }
            }
            for (const i in selData) {
              if (selData[i].curId == checkedItem.curId) {
                selData.splice(i, 1)
                break
              }
            }
            // 删除所有取消选中成员
            for (let c = 0; c < myCheckedKeys.length; c++) {
              const item: any = getTreeParam(myCheckedKeys[c])
              if (item.curId == e.node.id) {
                myCheckedKeys.splice(c, 1)
                break
              }
            }
          }
        }
      }
      // 单/复选框选中状态
      // 更新单复选框选中状态
      // 按角色选择
      if (attachInfo.source == 'character') {
        setRoleCheckedKeys(myCheckedKeys)
      } else {
        setCheckedKeys(myCheckedKeys)
        if (options.sourceType && options.sourceType === 'chat_invit') {
          setRoleCheckedKeys(myCheckedKeys)
        }
      }
      // 设置被选中数据
      ptAction.setSelData(selData, e.checked)
    }

    // *********************************常用联系人*********************************//
    /**
     * 查询常用联系人
     */
    const findContacts = (paramObj: { teamId: string }) => {
      const param: any = {
        teamId: paramObj.teamId,
        userId: options.nowUserId,
        type: options.findType,
        notInIds: [],
        notAccount: options.notAccount,
        notChildAccount: options.notChildAccount,
        onlyUser: options.contacts.onlyUser, //0不查岗位 1 查
        account: options.nowAccount,
        permissionType: options.permissionType,
      }
      if (options.contacts.notRole) {
        param.notRole = options.contacts.notRole
      }
      requestApi({
        url: '/team/teamUserInfo/findContacts',
        param: param,
        json: true,
      }).then(res => {
        if (res.success) {
          const dataList = res.data.dataList || []
          // 获取已被选中数据
          const selData = ptAction.getSelData()
          // 设置选中状态
          if (options.sourceType && options.sourceType === 'chat_invit') {
            // 中选中当前企业
            dataList.map((item: any) => {
              item.disabled = options.disableList.some((items: any) => items.userId === item.contactsUser)
              selData.map((sitem: any) => {
                if (
                  item.contactsUser == sitem.curId &&
                  item.contactsType == sitem.curType &&
                  item.contactsTeamId == sitem.cmyId
                ) {
                  item.checked = true
                  if (sitem.disable) {
                    item.disabled = true
                  }
                }
              })
            })
          } else {
            dataList.map((item: any) => {
              item.disabled = options.disableList.some((items: any) => items.userId === item.contactsUser)
              selData.map((sitem: any) => {
                if (item.contactsUser == sitem.curId && item.contactsType == sitem.curType) {
                  item.checked = true
                  if (sitem.disable) {
                    item.disabled = true
                  }
                }
              })
            })
          }
          setContactsData(dataList)
        }
      })
    }

    /**
     * 常用联系人单/复选框
     * item当前所选数据
     * type:radio单选 checkbox复选框
     */
    const onContactsChange = ({ type, checked, item }: { type: string; checked: boolean; item: any }) => {
      const thisChecked = checked ? false : true
      let selData = ptAction.getSelData()
      let parentId = '',
        parentName = '',
        parentType = 3
      if (item.contactsType == 0) {
        parentId = item.contactsRoleId || ''
        parentName = item.contactsRoleName || ''
        parentType = 31
      } else if (item.contactsType == 31) {
        parentId = item.contactsDeptId || ''
        parentName = item.contactsDeptName || ''
        parentType = 3
      } else if (item.contactsType == 3) {
        parentId = item.contactsTeamId || ''
        parentName = item.contactsTeamName || ''
        parentType = 2
      }
      const checkedItem: any = {
        curId: item.contactsUser || '',
        curType: item.contactsType || 0,
        curName: item.contactsUsername || '',
        userId: item.contactsUser || '',
        userName: item.contactsUsername || '',
        account: item.contactsAccount || '',
        parentId: parentId,
        parentName: parentName,
        parentType: parentType,
        cmyId: item.contactsTeamId,
        cmyName: item.contactsTeamName,
        deptId: item.contactsDeptId || '',
        deptName: item.contactsDeptName || '',
        roleId: item.contactsRoleId || '',
        roleName: item.contactsRoleName || '',
        profile: item.profile || '',
      }
      let showName = ''
      if (checkedItem.parentId == checkedItem.cmyId && checkedItem.parentType == 2) {
        showName = `${checkedItem.cmyName}-${checkedItem.curName}`
      } else {
        showName = `${checkedItem.cmyName}-${checkedItem.parentName}-${checkedItem.curName}`
      }
      checkedItem.showName = showName
      if (type == 'radio') {
        selData = [checkedItem]
        // 设置单选框选中状态
        for (const i in contactsData) {
          const item = contactsData[i]
          if (item.contactsUser == checkedItem.curId) {
            item.checked = true
          } else {
            item.checked = false
          }
        }
      } else {
        if (thisChecked) {
          if (options.sourceType && options.sourceType === 'chat_invit') {
            // 替换当前选中企业的人
            let isIn = true
            selData.forEach((item: any, index: number) => {
              if (item.curId == checkedItem.curId) {
                isIn = false
                selData[index] = checkedItem
              }
            })
            if (isIn) {
              selData.push(checkedItem)
            }
          } else {
            selData.push(checkedItem)
          }
        } else {
          // 群主不可被取消
          if (options.sourceType && options.sourceType === 'chat_invit') {
            const { nowUserId } = $store.getState()
            const iGroupLeader = selData.find((item: any) => {
              return item.curId == nowUserId && item.curId == checkedItem.curId
            })
            if (iGroupLeader) {
              return
            }
          }
          for (const i in selData) {
            if (selData[i].curId == checkedItem.curId) {
              selData.splice(i, 1)
              break
            }
          }
        }
        // 设置复选框框选中状态
        for (const i in contactsData) {
          const item = contactsData[i]
          if (item.contactsUser == checkedItem.curId) {
            item.checked = thisChecked
          }
        }
        // 设置任务干系人被选中数据
        if (options.orgBotList) {
          for (const i in options.orgBotList) {
            if (options.orgBotList[i].curId == checkedItem.curId) {
              options.orgBotList[i].checked = thisChecked
            }
          }
        }
      }

      setContactsData([...contactsData])
      // 设置被选中数据
      ptAction.setSelData(selData, thisChecked)
      // 刷新任务干系人选择状态
      options.orgBotList && ptAction.setOrgBotList([...options.orgBotList])
    }

    // *********************************按角色选择********** **************************//
    /**
     * 角色组织架构
     * @param paramObj
     */
    const findRoleOrg = (paramObj: { teamId: string; teamName: string }) => {
      treeExpandedKeys = []
      const param: any = {
        teamId: paramObj.teamId,
        account: options.nowAccount,
        permissionType: options.permissionType,
      }
      requestApi({
        url: '/team/enterpriseRole/findRolesByPermission',
        param: param,
        setLoadState: modalContextObj.setLoading,
      }).then(res => {
        if (res.success) {
          const selData = ptAction.getSelData()
          const getData = res.data.dataList || []
          // 默认展开的节点
          const expandedKeys: any = []
          const teamObj = {
            teamId: paramObj.teamId,
            teamName: paramObj.teamName,
          }
          const options1 = {
            array: getData,
            idKey: 'id',
            nameKey: 'roleName',
            hasChildKey: 'userNum',
            // 父级信息
            id: paramObj.teamId,
            name: paramObj.teamName,
            type: 2,
          }
          const options2 = {
            findType: options.findType,
            teamObj: teamObj,
            options: options,
            findByType: 'character',
            propType: 4,
            checkedKeys: roleCheckedKeys,
            selectData: selData,
            expandedKeys: expandedKeys,
          }
          MemberRenderTreeData(options1, options2, checkableType)
          setRoleOrgInfo({
            orgData: getData,
          })
          // 更新单复选框选中状态
          setCheckedKeys([...roleCheckedKeys])
        }
      })
    }

    // 点击查询组织架构子级
    const queryRoleTreeChild = (treeNode: any, resolve?: () => void) => {
      // 获取当前节点信息
      const treeInfo: any = getTreeParam(treeNode.key)
      const param: any = {
        roleId: treeInfo.curId,
        account: options.nowAccount,
        permissionType: options.permissionType,
      }
      requestApi({
        url: '/team/enterpriseRole/findRolePermissionUsers',
        param: param,
      }).then(res => {
        if (res.success) {
          const selData = ptAction.getSelData()
          const childData = res.data.dataList || []
          for (const i in childData) {
            if (!childData[i].username) {
              childData.splice(i, 1)
              break
            }
          }
          const options1 = {
            array: childData,
            idKey: 'userId',
            nameKey: 'username',
            hasChildKey: 'userNum',
            // 父级信息
            id: treeInfo.curId,
            name: treeInfo.curName,
            type: treeInfo.curType,
          }
          const options2 = {
            findType: options.findType,
            teamObj: {
              teamId: treeInfo.cmyId,
              teamName: treeInfo.cmyName,
            },
            options: options,
            findByType: 'character',
            propType: 0,
            checkedKeys: roleCheckedKeys,
            selectData: selData,
          }
          MemberRenderTreeData(options1, options2, checkableType)
          const setData = setTreeChild(roleOrgInfo.orgData, treeNode.key, childData)
          setTimeout(() => {
            setRoleOrgInfo({
              ...roleOrgInfo,
              orgData: [...setData],
              expandedKeys: [...treeExpandedKeys],
            })
          }, 300)
          // 更新单复选框选中状态
          setRoleCheckedKeys([...roleCheckedKeys])
          if (resolve) {
            resolve()
          }
        }
      })
    }
    /**
     * 点击展开按钮加载子节点时
     * @param treeNode 当前点击的树节点
     */
    const onRoleOrgLoadData = (treeNode: any): Promise<void> => {
      return new Promise(resolve => {
        if (treeNode.children && treeNode.children.length > 0) {
          resolve()
          return
        }
        queryRoleTreeChild(treeNode, resolve)
      })
    }

    //文案修改
    let showNoneTxt = $intl.get('contacts')
    if (options.findType == '3') {
      showNoneTxt = $intl.get('Department')
    } else if (options.findType == '31') {
      showNoneTxt = $intl.get('Station')
    }

    return (
      <div className={`orgShowCon flex-1 ${options.checkboxType == 'radio' ? 'orgRadio' : ''}`}>
        {/* 企业部门组织架构展示 */}
        {ptParam.showType == 1 || ptParam.showType == 3 ? (
          <Tree
            multiple
            checkable
            // selectable={false}
            onSelect={(expKeys: any, e: any) => {
              onExpandCmy(expKeys, e, 'team')
            }}
            selectedKeys={treeData.expandedKeys ? treeData.expandedKeys : []}
            loadData={onLoadData}
            treeData={treeData.orgData}
            checkedKeys={checkedKeys}
            onExpand={(expKeys: any, e: any) => {
              onExpandCmy(expKeys, e, 'team')
            }}
            expandedKeys={treeData.expandedKeys}
            blockNode={true}
            checkStrictly={checkStrictly}
            onCheck={(onCheckedKeys: any, e: any) => {
              onCheck(onCheckedKeys, e, {
                source: 'base',
                preCheckedKeys: checkedKeys,
              })
            }}
          />
        ) : (
          ''
        )}
        {/* 常用联系人展示 */}
        {ptParam.showType == 4 ? (
          <ul className="contactsList">
            {contactsData.length > 0
              ? contactsData.map((item: any, i: number) => {
                  let showName = ''
                  //查询岗位时
                  if (options.findType == 3) {
                    showName = `${item.contactsDeptName || item.contactsUsername}`
                  } else if (options.findType == 31) {
                    showName = `${
                      item.contactsDeptName ? item.contactsDeptName + '-' : ''
                    }${item.contactsRoleName || item.contactsUsername}`
                  } else if (options.contacts.onlyUser == 1) {
                    showName = `${item.contactsDeptName ? item.contactsDeptName + '-' : ''}${
                      item.contactsRoleName ? item.contactsRoleName + '-' : ''
                    }${item.contactsUsername}`
                  } else {
                    showName = `${item.contactsDeptName ? item.contactsDeptName + '-' : ''}${
                      item.contactsUsername
                    }`
                  }
                  return (
                    <li
                      key={i}
                      className="flex between center-v"
                      onClick={() => {
                        // 判断是否能够修改
                        if (!item.disabled) {
                          onContactsChange({
                            type: options.checkboxType,
                            checked: item.checked,
                            item,
                          })
                        }
                      }}
                    >
                      <div className="show_left flex center-v overflow_hidden">
                        <em className="img_icon user_icon"></em>
                        <span className="my_ellipsis">{showName}</span>
                      </div>
                      <div className="show_right">
                        {options.checkboxType == 'radio' ? (
                          <Radio
                            value={item.id}
                            checked={item.checked}
                            disabled={item.disabled}
                            onClick={(e: any) => {
                              e.stopPropagation()
                            }}
                          ></Radio>
                        ) : (
                          <Checkbox value={item.id} checked={item.checked} disabled={item.disabled}></Checkbox>
                        )}
                      </div>
                    </li>
                  )
                })
              : `${$intl.get('currentNoTopSome')}${showNoneTxt}`}
          </ul>
        ) : (
          ''
        )}
        {/* 按角色选择组织架构 */}
        {ptParam.showType == 2 ? (
          <Tree
            multiple
            checkable
            // selectable={false}
            loadData={onRoleOrgLoadData}
            treeData={roleOrgInfo.orgData}
            checkedKeys={roleCheckedKeys}
            blockNode={true}
            checkStrictly={checkStrictly}
            onCheck={(checkedKeys: any, e: any) => {
              onCheck(checkedKeys, e, {
                source: 'character', //角色
                preCheckedKeys: roleCheckedKeys,
              })
            }}
            onSelect={(expKeys: any, e: any) => {
              onExpandCmy(expKeys, e, 'character')
            }}
            onExpand={(expKeys: any, e: any) => {
              onExpandCmy(expKeys, e, 'character')
            }}
            expandedKeys={roleOrgInfo.expandedKeys}
            selectedKeys={roleOrgInfo.expandedKeys ? roleOrgInfo.expandedKeys : []}
          />
        ) : (
          ''
        )}
      </div>
    )
  }
)

export default OrgShowCon
