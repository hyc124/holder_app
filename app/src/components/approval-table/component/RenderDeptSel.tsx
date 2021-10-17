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

//单独渲染选择部门
const RenderDeptSel = ({
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
  //展示已选择部门
  const { executeData, approvalDetailInfo } = $store.getState()
  const { onlyElementData } = $store.getState()
  const formulaNumvalObj = useSelector((store: StoreStates) => store.formulaNumvalObj)
  let selectDept: any[] = []
  if (formulaNumvalObj[formElementModel.uuId] && name === 'triggerApproval') {
    selectDept = JSON.parse(formulaNumvalObj[formElementModel.uuId])
  } else if (formElementModel.value) {
    selectDept = JSON.parse(formElementModel.value)
  }

  if (formElementModel.repeatValue && !formElementModel.repeatRowVal) {
    // 重复行没有唯一标识，但有冲销和普通回写控件，重复时带父级的值
    if (formElementModel.parentUuId && formulaNumvalObj[formElementModel.parentUuId]) {
      selectDept = JSON.parse(formElementModel.parentUuId && formulaNumvalObj[formElementModel.parentUuId])
    } else if (formElementModel.value) {
      selectDept = JSON.parse(formElementModel.value)
    }
  }

  //处理部门数据
  let deptDataList: any[] = selectDept.map((item: { deptId: string; deptName: string }) => {
    return {
      curId: parseInt(item.deptId),
      curName: item.deptName,
      deptId: parseInt(item.deptId),
      deptName: item.deptName,
    }
  })
  //显示选择的部门列表
  const [visible, setVisible] = useState(false)
  //是否显示默认部门
  useEffect(() => {
    ;(async () => {
      if (
        (name === 'triggerApproval' || name === 'waitApproval') &&
        formElementModel.isDefault === 1 &&
        formElementModel.edit === 1 &&
        deptDataList.length === 0
      ) {
        let postModel: any = {
          departmentId: 0,
          departName: '',
        }
        if (executeData) {
          postModel = executeData.postModel
        } else {
          postModel = await findUserMainPostAndDepartment(teamId)
        }
        deptDataList = [
          {
            deptId: postModel.departmentId,
            deptName: postModel.departName,
            candel: true, //默认的可删除
          },
        ]
        const formData = [
          {
            deptId: postModel.departmentId?.toString(),
            deptName: postModel.departName,
          },
        ]
        const valueStr = postModel.departName
        setTimeout(() => {
          const updateData = { [formElementModel.uuId]: JSON.stringify(formData) }
          changeData && changeData({ data: updateData, contentArr: valueStr })
        }, 1000)
      }
    })()
  }, [])
  //选择人员后回调
  const deptSelChange = (data: any) => {
    const formData = data.map((item: { curId: number; curName: string }) => {
      return {
        deptId: item.curId.toString(),
        deptName: item.curName,
      }
    })
    const valueStr = data
      .map((item: { curName: string }) => {
        return item.curName
      })
      .join('')
    const updateData = { [formElementModel.uuId]: JSON.stringify(formData) }
    changeData && changeData({ data: updateData, contentArr: valueStr })
    deptDataList = data
    setVisible(false)
  }
  //点击打开选择部门弹窗
  const openDeptSel = () => {
    setVisible(true)
  }
  //点击tag删除部门
  const delDeptSel = (id: number) => {
    const newData = deptDataList.filter((item: { deptId: number }) => item.deptId !== id)
    const formData = newData.map((item: { deptId: number; deptName: string }) => {
      return {
        deptId: item.deptId,
        deptName: item.deptName,
      }
    })
    const valueStr = newData
      .map((item: { deptName: string }) => {
        return item.deptName
      })
      .join('')
    const updateData = { [formElementModel.uuId]: JSON.stringify(formData) }
    changeData && changeData({ data: updateData, contentArr: valueStr })
    deptDataList = newData
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
                      text: '常用部门',
                    },
                  },
                  title: '选择部门',
                  findType: 3,
                  selectList: deptDataList,
                  isOuterSystem: formElementModel.businessSystemRelation || 0,
                  approvalObj: {
                    approvalId: approvalDetailInfo ? approvalDetailInfo.id : '',
                    eventId: eventId,
                    uuid: formElementModel.copyUuid || formElementModel.parentUuId || formElementModel.uuId,
                    elementType: 'deptSel',
                  },
                  showPrefix: {
                    //是否显示成员的部门岗位前缀
                    dept: true, //部门
                    role: true, //岗位
                    company: false, //企业前缀
                  },
                  onSure: (datas: any) => {
                    deptSelChange(datas)
                  },
                }}
                action={{
                  setModalShow: setVisible,
                }}
              />
            )}
          </>
        )}
        {deptDataList.map((item: { deptId: number; deptName: string; candel?: boolean }, index: number) => (
          <Tooltip key={index} title={item.deptName}>
            <Tag
              closable={isAuth || item.candel}
              onClose={(e: any) => {
                e.preventDefault()
                delDeptSel(item.deptId)
              }}
              style={{ border: !isAuth ? 0 : '1px solid #dcdcdc' }}
            >
              <span className="txt">{item.deptName}</span>
            </Tag>
          </Tooltip>
        ))}
        {/* 唯一标识 */}
        {(name === 'triggerApproval' || name === 'waitApproval') &&
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
export default RenderDeptSel
