import React from 'react'
import { Avatar } from 'antd'
import { cutName } from '@/src/common/js/common'

/**
 * 选择人员插件组织架构树更改数据为Tree可渲染数据格式
 * 有些接口中返回的id是rid，所以定义一个idKey nameKey便于不同键名的值的获取
 * @param  data
 * data{
 * idKey:key值键名，
 * nameKey：name值键名，
 * }
 * attachInfo:{
 * teamObj:企业数据,
 * findType:查询类型 0默认只可选中人员
 * findByType: 'role'：按角色查询 的组织架构，默认按企业部门组织架构
 * propType:属性类型 0成员 1角色（findByType=='role'时使用）
 * checkedKeys 单复选框选中状态
 * }
 */

/**
 * 检查是否有单/复选框
 */
interface MemberRenderTreeProps {
  idKey: string //key值键名
  nameKey: string //name值键名
  hasChildKey: string //是否有子级
  array: any
  id?: string //父级id
  name?: string //父级名字
  type?: number //父级类型
}

interface AttachInfoProps {
  findType: string
  teamObj?: { teamId?: any; teamName?: any }
  options: any
  findByType?: string
  propType?: number
  checkedKeys: any
  selectData: any
  expandedKeys?: any
  parent?: any //父级链条信息
}

const MemberRenderTreeData = (
  data: MemberRenderTreeProps,
  attachInfo: AttachInfoProps,
  checkableType: number[]
) => {
  // 获取外部传入参数
  const options = attachInfo.options || {}
  const { disableList } = options
  // 组织架构选中的key列表
  const checkedKeys = attachInfo.checkedKeys || []
  // 右侧展示数据列表
  const selectData = attachInfo.selectData || []
  // 组织架构展开的key列表
  const expandedKeys = attachInfo.expandedKeys || []
  let cmyObj: any = attachInfo.teamObj ? attachInfo.teamObj : {}
  //父级链条信息
  const preParent: any = attachInfo.parent ? attachInfo.parent : null

  const setCheckable = (options: any, itemType: number): boolean => {
    let checkable = false
    if (options.cascadeMember) {
      checkable = true
    } else if (checkableType && checkableType.length > 0) {
      // 可添加单复选框的类型
      if (checkableType.includes(itemType)) {
        checkable = true
      }
    } else if (options.findType == 0) {
      if (itemType == 0) {
        checkable = true
      } else {
        checkable = false
      }
    }
    // 判断是否父组件传入 多选check
    if (options.useExternal && itemType != 2) {
      checkable = true
    }
    return checkable
  }

  if (data.array && data.array.length > 0) {
    for (const i in data.array) {
      const item: any = data.array[i]
      const thisId = item[data.idKey]
      const currentUser = selectData.find((item: any) => {
        return item.curId == thisId
      })
      const userTeamId = currentUser ? currentUser.cmyId : ''
      const userTeamName = currentUser ? currentUser.cmyName : ''
      const thisName = item[data.nameKey]

      let account = ''
      let thisType: any = 0
      let typeName = ''
      let showName = thisName
      let thisNodeId = ''
      let selectedUserKey = ''
      let thisText: any = showName
      // 名字左侧的图标
      let nameLeftIcon: any
      // ====character为角色查询标识====//
      if (attachInfo.findByType != 'character') {
        thisType = item.type
        let roleInfo = ''
        if (item.type == 0) {
          typeName = 'account_'
          showName = `${item.name || name}${item.roleName ? '-' + item.roleName : ''}`
          roleInfo = `##role_${item.roleId || ''}_31_${item.roleName || ''}`
        } else if (item.type == 3) {
          typeName = 'department_'
        } else {
          typeName = 'duties_'
        }

        if (item.type == 2) {
          //企业数据信息
          if (options.sourceType && options.sourceType === 'chat_invit') {
            selectedUserKey = `company_${userTeamId}_2_${userTeamName}`
          }
          thisNodeId = `company_${thisId}_2_${thisName}`
          cmyObj = { teamId: thisId, teamName: thisName }
          //企业根节点
          nameLeftIcon = <span className="img_icon nameLeftIcon root"></span>
        } else {
          if (item.type == 0) {
            account = `_${item.account || ''}`
          }
          // 上一层data中id为本层的父级id
          if (options.sourceType && options.sourceType === 'chat_invit') {
            selectedUserKey = `${typeName}${thisId}_${item.type}_${thisName}${account}##parentId_${data.id ||
              ''}_${data.type || ''}_${data.name ||
              ''}##company_${userTeamId}_2_${userTeamName}${roleInfo}_${i}`
          }
          thisNodeId = `${typeName}${thisId}_${item.type}_${thisName}${account}##parentId_${data.id ||
            ''}_${data.type || ''}_${data.name || ''}##company_${cmyObj.teamId}_2_${
            cmyObj.teamName
          }${roleInfo}_${i}`
          nameLeftIcon = <span className="img_icon nameLeftIcon child"></span>
        }
        // 是否可选中单/复选框
        const checkable = setCheckable(options, item.type)
        item.checkable = checkable
        thisText = showName
      } else {
        thisType = attachInfo.propType
        //角色查询
        if (attachInfo.propType == 0) {
          //成员
          typeName = 'account_'
          nameLeftIcon = <span className="img_icon nameLeftIcon root"></span>
          let cutUser = thisName
          if (thisName.length > 2) {
            cutUser = cutName(thisName || '', 2, -1) || ''
          }
          thisText = (
            <div className="org_tree_row flex center-v between">
              <div className="row_left flex center-v">
                <Avatar className="user_head" src={item.profile || ''}>
                  {cutUser}
                </Avatar>
                <span className="org_tree_text my_ellipsis">{thisName}</span>
              </div>
            </div>
          )
        } else if (attachInfo.propType == 4) {
          //角色
          typeName = 'character_'
          nameLeftIcon = <span className="img_icon nameLeftIcon child"></span>
        }
        if (attachInfo.propType == 0) {
          account = `_${item.account || ''}`
        }
        if (options.sourceType && options.sourceType === 'chat_invit') {
          selectedUserKey = `${typeName}${thisId}_${
            attachInfo.propType
          }_${thisName}${account}##parentId_${data.id || ''}_${data.type || ''}_${data.name ||
            ''}##company_${userTeamId}_2_${userTeamName}_${i}`
        }
        thisNodeId = `${typeName}${thisId}_${attachInfo.propType}_${thisName}${account}##parentId_${data.id ||
          ''}_${data.type || ''}_${data.name || ''}##company_${cmyObj.teamId}_2_${cmyObj.teamName}_${i}`
        //   是否可选中单/复选框
        const checkable = setCheckable(options, attachInfo.propType || 0)
        item.checkable = checkable
      }
      //1 设置key和显示名
      item.key = thisNodeId
      item.title = thisText
      //2 设置父级链信息
      const thisInfo = {
        id: item.id,
        name: item.name,
        type: item.type,
      }
      let parent: any = {}
      if (item.type != 2) {
        // 设置当前节点的父级链（上级封装完成传来的即为本级父级链）
        item.parent = preParent
        // 传递给子级新的父级链
        parent = { ...thisInfo, parent: preParent }
      } else {
        // 企业是最高级，不设置当前父级链，只传递给子级新的父级链
        parent = thisInfo
      }
      const sItem: any = selectData.find((v: any) => {
        const type = v.curType != undefined ? v.curType : options.findType
        // 不同企业部门下同一个人员是否全选中
        if (!options.comMember) {
          if (item.parent) {
            return v.curId == thisId && type == thisType && v.parentId == item.parent.id
          } else {
            return v.curId == thisId && type == thisType && v.parentId == item.id
          }
        } else {
          if (options.sourceType && options.sourceType === 'chat_invit') {
            return v.curId == thisId && type == thisType && v.cmyId == userTeamId
          } else {
            return v.curId == thisId && type == thisType
          }
        }
      })
      if (sItem) {
        if (!checkedKeys.includes(thisNodeId)) {
          if (options.sourceType && options.sourceType === 'chat_invit') {
            checkedKeys.push(selectedUserKey)
          } else {
            checkedKeys.push(thisNodeId)
          }
        }
        if (sItem.disable) {
          item.disableCheckbox = true
        }
      }
      // 3.2 获取置灰选中成员数据，设置置灰选中效果
      const dItem: any = disableList.find((v: any) => {
        const type = v.curType != undefined ? v.curType : options.findType
        return v.curId == thisId && type == thisType
      })
      if (dItem) {
        if (!checkedKeys.includes(thisNodeId)) {
          if (options.sourceType && options.sourceType === 'chat_invit') {
            checkedKeys.push(selectedUserKey)
          } else {
            checkedKeys.push(thisNodeId)
          }
        }
        item.disableCheckbox = true
      }
      // 4 存储展开的节点 之展开第一层
      if (item.childs && item.childs.length > 0 && !item.parent) {
        expandedKeys.push(item.key)
      }
      //   ======更新附属信息============//
      const attachObj = { ...attachInfo, ...{ teamObj: cmyObj }, parent: parent }
      if ((item.childs && item.childs.length > 0) || item[data.hasChildKey]) {
        item.icon = nameLeftIcon
        item.children = item.childs || []
        //存在子数组
        const options1 = {
          array: item.children,
          idKey: data.idKey,
          nameKey: data.nameKey,
          hasChildKey: data.hasChildKey,
          id: thisId,
          name: thisName,
          type: item.type,
        }
        MemberRenderTreeData(options1, attachObj, checkableType)
      } else {
        const nameLeftIcon = <span className="img_icon nameLeftIcon null"></span>
        item.icon = nameLeftIcon
        item.isLeaf = true
      }
    }
  }
}

export default MemberRenderTreeData
