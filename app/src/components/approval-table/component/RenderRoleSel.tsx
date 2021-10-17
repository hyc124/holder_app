import {
  findUserMainPostAndDepartment,
  FormElementModelProps,
} from '@/src/views/approval/components/ApprovalDettail'
import { Button } from 'antd/lib/radio'
import { CSSProperties, useEffect, useState } from 'react'
import $c from 'classnames'
import React from 'react'
import { useSelector } from 'react-redux'
import { SelectMemberOrg } from '../../select-member-org'
import { Tag, Tooltip } from 'antd'
import RenderOnlySymbol from './RenderOnlySymbol'
import { getOnlyElementUuid, isRelationOnyElement } from '../getData/approvalHandle'

//单独渲染人员选择
const RenderRoleSel = ({
  formElementModel,
  formItemStyles,
  isAuth,
  teamId,
  eventId,
  name,
  changeData,
  coord,
}: {
  formElementModel: FormElementModelProps
  formItemStyles: CSSProperties | undefined
  isAuth: boolean
  teamId: number
  eventId: number
  name?: string
  changeData?: (item: any, value?: string, content?: string) => void
  coord: any
}) => {
  //展示已选择岗位
  const { executeData, approvalDetailInfo } = $store.getState()
  const { onlyElementData } = $store.getState()
  const formulaNumvalObj = useSelector((store: StoreStates) => store.formulaNumvalObj)
  let selectRole: any[] = []
  if (formulaNumvalObj[formElementModel.uuId] && name === 'triggerApproval') {
    selectRole = JSON.parse(formulaNumvalObj[formElementModel.uuId])
  } else if (formElementModel.value) {
    selectRole = JSON.parse(formElementModel.value)
  }

  if (formElementModel.repeatValue && !formElementModel.repeatRowVal) {
    // 重复行没有唯一标识，但有冲销和普通回写控件，重复时带父级的值
    if (formElementModel.parentUuId && formulaNumvalObj[formElementModel.parentUuId]) {
      selectRole = JSON.parse(formElementModel.parentUuId && formulaNumvalObj[formElementModel.parentUuId])
    } else if (formElementModel.value) {
      selectRole = JSON.parse(formElementModel.value)
    }
  }
  //处理岗位数据
  let roleDataList: any[] = selectRole.map(
    (item: { roleId: string; roleName: string; deptId: string; deptName: string }) => {
      return {
        curId: parseInt(item.roleId),
        curName: item.roleName,
        roleId: parseInt(item.roleId),
        roleName: item.roleName,
        deptId: parseInt(item.deptId),
        deptName: item.deptName,
        parentName: item.deptName,
      }
    }
  )
  //显示选择的岗位列表
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    //是否显示默认岗位
    ;(async () => {
      if (
        (name === 'triggerApproval' || name === 'waitApproval') &&
        formElementModel.isDefault === 1 &&
        formElementModel.edit === 1 &&
        roleDataList.length === 0
      ) {
        let postModel: any = {
          postId: 0,
          postName: '',
          departmentId: 0,
          departName: '',
        }
        if (executeData) {
          postModel = executeData.postModel
        } else {
          postModel = await findUserMainPostAndDepartment(teamId)
        }
        roleDataList = [
          {
            roleId: postModel.postId,
            roleName: postModel.postName,
            deptId: postModel.departmentId,
            deptName: postModel.departName,
            candel: true,
          },
        ]
        const formData = [
          {
            deptId: postModel.departmentId?.toString(),
            deptName: postModel.departName,
            roleId: postModel.postId?.toString(),
            roleName: postModel.postName,
          },
        ]
        const valueStr = postModel.departName + '-' + postModel.postName
        const updateData = { [formElementModel.uuId]: JSON.stringify(formData) }
        setTimeout(() => {
          changeData && changeData({ data: updateData, contentArr: valueStr })
          // changeData && changeData(formElementModel, JSON.stringify(formData), valueStr)
        }, 1000)
      }
    })()
  }, [])
  //选择人员后回调
  const roleSelChange = (data: any) => {
    const formData = data.map((item: { roleId: any; roleName: any; deptId: any; deptName: any }) => {
      return {
        roleId: item.roleId.toString(),
        roleName: item.roleName,
        deptId: item.deptId.toString(),
        deptName: item.deptName,
      }
    })
    const valueStr = data
      .map((item: { roleName: string }) => {
        return item.roleName
      })
      .join('')
    const updateData = { [formElementModel.uuId]: JSON.stringify(formData) }
    changeData && changeData({ data: updateData, contentArr: valueStr })
    // changeData && changeData(formElementModel, JSON.stringify(formData), valueStr)
    roleDataList = data
    setVisible(false)
  }
  //点击打开选择人员弹窗
  const openDeptSel = () => {
    setVisible(true)
  }
  //外部删除岗位
  const delRoleSel = (id: number) => {
    const newData = roleDataList.filter((item: { roleId: number }) => item.roleId !== id)
    roleDataList = newData
    const formData = newData.map((item: { roleId: any; roleName: any; deptId: any; deptName: any }) => {
      return {
        roleId: item.roleId,
        roleName: item.roleName,
        deptId: item.deptId,
        deptName: item.deptName,
      }
    })
    const valueStr = newData
      .map((item: { roleName: string }) => {
        return item.roleName
      })
      .join('')
    const updateData = { [formElementModel.uuId]: JSON.stringify(formData) }
    changeData && changeData({ data: updateData, contentArr: valueStr })
    // changeData && changeData(formElementModel, JSON.stringify(formData), valueStr)
  }
  return (
    <div
      className={$c('plugElementRow', {
        hasRequire: formElementModel.attribute === 1 && formElementModel.edit === 1,
      })}
      key={formElementModel.id}
      style={formItemStyles}
      data-elementid={formElementModel.id}
      data-type={formElementModel.type}
      data-uuid={formElementModel.uuId}
      data-mark={formElementModel.condition}
      data-isauth={formElementModel.edit === 0 ? false : true}
      data-isdef={formElementModel.isDefault === 1 ? true : false}
      data-isedit={formElementModel.special === 1 ? true : false}
      data-datetype={formElementModel.dateType}
      data-parentuuid={formElementModel.parentUuId}
      data-onlyflag={formElementModel.repeatRowVal}
      data-normalvalue={formElementModel.normalValue}
    >
      <div className={$c('plugRowLeft', { hideName: formElementModel.showName === 0 })}>
        {formElementModel.name}
      </div>
      <div className="plugRowRight">
        {isAuth && (
          <>
            <Button className="approval-add-btn" onClick={openDeptSel}></Button>
            {visible && (
              <SelectMemberOrg
                param={{
                  visible: visible,
                  allowTeamId: [teamId],
                  checkboxType: formElementModel.isRadio == 1 ? 'checkbox' : 'radio',
                  fliterByType: {
                    '1': {
                      show: true,
                      text: '按组织架构选择',
                    },
                    '2': {
                      show: false,
                      text: '按角色选择',
                    },
                    '3': {
                      show: formElementModel.businessSystemRelation === 0,
                    },
                    '4': {
                      show: formElementModel.businessSystemRelation === 0,
                      text: '常用岗位',
                    },
                  },
                  title: '选择岗位',
                  findType: 31,
                  selectList: roleDataList,
                  isOuterSystem: formElementModel.businessSystemRelation || 0,
                  approvalObj: {
                    approvalId: approvalDetailInfo ? approvalDetailInfo.id : '',
                    eventId: eventId,
                    uuid: formElementModel.copyUuid || formElementModel.parentUuId || formElementModel.uuId,
                    elementType: 'roleSel',
                  },
                  showPrefix: {
                    //是否显示成员的部门岗位前缀
                    dept: true, //部门
                    role: true, //岗位
                    company: false, //企业前缀
                  },
                  onSure: (datas: any) => {
                    roleSelChange(datas)
                  },
                }}
                action={{
                  setModalShow: setVisible,
                }}
              />
            )}
          </>
        )}
        {roleDataList.map(
          (item: { roleId: number; roleName: string; deptName: string; candel?: boolean }, index: number) => (
            <Tooltip key={index} title={item.roleName}>
              <Tag
                closable={isAuth || item.candel}
                onClose={(e: any) => {
                  e.preventDefault()
                  delRoleSel(item.roleId)
                }}
                style={{ border: !isAuth ? 0 : '1px solid #dcdcdc' }}
              >
                <span className="txt">
                  {item.deptName ? `${item.deptName}-` : ''}
                  {item.roleName}
                </span>
              </Tag>
            </Tooltip>
          )
        )}
        {/* 唯一标识 */}
        {(name === 'triggerApproval' || name === 'waitApproval') &&
          // executeData &&
          // executeData.onlyElementUuid &&
          // !formElementModel.parentUuId && 重复行有唯一标识不显示
          onlyElementData &&
          isRelationOnyElement(formElementModel.uuId, formElementModel.edit) &&
          getOnlyElementUuid(onlyElementData, formElementModel.uuId) && (
            <RenderOnlySymbol
              eventId={eventId}
              changeData={changeData}
              uuid={formElementModel.uuId}
              parentUuId={formElementModel.parentUuId}
              coord={coord}
            />
          )}
      </div>
    </div>
  )
}

export default RenderRoleSel
