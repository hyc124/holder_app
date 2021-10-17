import React from 'react'
import { Tooltip, Avatar } from 'antd'
interface DataNode {
  title: string
  key: string
  isLeaf?: boolean
  children?: DataNode[]
}

/**
 * 组织架构树更改数据为Tree可渲染数据格式
 * 有些接口中返回的id是rid，所以定义一个idKey nameKey便于不同键名的值的获取
 * @param  data
 * data{
 * idKey:key值键名，
 * nameKey：name值键名，
 * }
 * teamObj:企业数据
 */
export const renderTreeData = (
  data: any,
  attachInfo: {
    teamObj?: { teamId?: any; teamName?: any }
    fromType: string
    isCount: boolean
    expandedKeys?: any
    setExpandedKeys?: (param: string) => void
  }
) => {
  // 展开的节点
  const expandedKeys = attachInfo.expandedKeys || []
  let cmyObj: any = attachInfo.teamObj ? attachInfo.teamObj : {}
  // if (data.array && data.array.length > 0) {
  return data.array.map((item: any) => {
    const thisId = item[data.idKey]
    const thisName = item[data.nameKey]
    let typeName = ''
    let showName = thisName
    let thisNodeId = ''
    let roleInfo = ''
    // 名字左侧的图标
    let nameLeftIcon: any
    if (item.type == 0) {
      typeName = 'account_'
      showName = `${item.name || name}${item.roleName ? '-' + item.roleName : ''}`
      roleInfo = `@role_${item.roleId}_31_${item.roleName}`
    } else if (item.type == 3) {
      typeName = 'department_'
    } else {
      typeName = 'duties_'
    }
    if (item.type == 2) {
      //企业数据信息
      thisNodeId = `company_${thisId}_2_${thisName}`
      cmyObj = { teamId: thisId, teamName: thisName }
      //企业根节点
      // nameLeftIcon = <span className="img_icon nameLeftIcon root"></span>
      nameLeftIcon = (
        <Avatar
          className="img_icon logoLeftIcon root"
          src={item.logo || $tools.asAssetsPath('/images/common/company_default.png')}
          size={24}
        ></Avatar>
      )
    } else {
      // 上一层data中id为本层的父级id
      thisNodeId = `${typeName}${thisId}_${item.type}_${thisName}@parentId_${data.id}_${data.type}_${data.name}@company_${cmyObj.teamId}_2_${cmyObj.teamName}${roleInfo}`
      // nameLeftIcon = <span className="img_icon nameLeftIcon tree_rig_switch"></span>
      // nameLeftIcon = <span className="img_icon nameLeftIcon child"></span>
    }
    // 企业级是否有下一层数据
    let switchIcon: any
    if (item.type == 2 && item.childs && item.childs.length > 0) {
      switchIcon = (
        <span
          className="img_icon tree_rig_switch"
          onClick={(e: any) => {
            if (attachInfo.setExpandedKeys) {
              e.stopPropagation()
              attachInfo.setExpandedKeys(thisNodeId)
            }
          }}
        ></span>
      )
    }
    const thisText = (
      <div className="org_tree_row flex center-v between">
        <div className="row_left flex center-v">
          <Tooltip placement="top" title={showName}>
            <span className="org_tree_text my_ellipsis" style={{ maxWidth: '150px' }}>
              {showName}
            </span>
          </Tooltip>
          <span className={`org_tree_count_text flex_shrink_0 ${attachInfo.isCount ? '' : 'forcedHide'}`}>
            {item.type != 0 ? '(' + item.person + ')' : ''}
          </span>
        </div>
        <div className="row_right">{switchIcon}</div>
      </div>
    )

    item.key = thisNodeId
    item.title = thisText

    //  ======更新附属信息============//
    const attachObj = { ...attachInfo, ...{ teamObj: cmyObj } }
    // 有数据则说明需要展开
    if (item.childs && item.childs.length > 0) {
      expandedKeys.push(thisNodeId)
    }
    if ((item.childs && item.childs.length > 0) || item.hasChild) {
      item.switcherIcon = nameLeftIcon
      item.children = item.childs || []
      return {
        ...item,
        title: thisText,
        children: renderTreeData(
          {
            array: item.children,
            idKey: data.idKey,
            nameKey: data.nameKey,
            id: thisId,
            name: thisName,
            type: item.type,
          },
          attachObj
        ),
      }
      //存在子数组
    } else {
      // const nameLeftIcon = <span className="img_icon nameLeftIcon null"></span>
      const nameLeftIcon = <span className="img_icon nameLeftIcon null"></span>
      item.switcherIcon = nameLeftIcon
      item.isLeaf = true
      return {
        ...item,
        title: thisText,
      }
    }
  })
  // }
}

/**
 * 获取当前企业或部门信息
 * nodeInfo 树结构组装数据
 */
export const getTreeParam = (nodeInfo: any, parent?: any) => {
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
  const params: any = nodeInfo
  if (params) {
    if (params.split('_')[2].indexOf('2') != -1 && params.split('_')[2].indexOf('@') == -1) {
      //选择企业
      cmyId = params.split('_')[1] // 保存企业id
      cmyName = params.split('_')[3] // 保存企业名
      curId = params.split('_')[1]
      curName = params.split('_')[3] //保存当前选中类型（企业/部门/岗位）
      curType = params.split('_')[2]
      curTypeName = params.split('_')[0]
    } else {
      const pArr = params.split('@')
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
    // 查询父级信息里部门岗位的递归方法
    const findDeptRole = (parents: any) => {
      if (parents.type == 3) {
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
    getType: curType,
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
  }
}
/**
 * 添加子级到当前点击的树节点中
 * @param list 组织架构树数据
 * @param key 当前点击的节点key值
 * @param children 要添加的子级数据
 */
export const setTreeChild = (list: DataNode[], key: React.Key, children: DataNode[]): DataNode[] => {
  return list.map(node => {
    if (node.key === key) {
      // node.children = children
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
