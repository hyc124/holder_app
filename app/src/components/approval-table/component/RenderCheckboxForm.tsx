import { FormElementModelProps } from '@/src/views/approval/components/ApprovalDettail'
import { CSSProperties, useState } from 'react'
import { getSelectOuterData } from '../getData/getData'
import $c from 'classnames'
import React from 'react'
import { Button, Tag, Tooltip } from 'antd'
import CheckboxModal from '../../checkbox-modal'

//单独渲染checkbox组件
const RenderCheckboxForm = ({
  formElementModel,
  formItemStyles,
  isAuth,
  eventId,
  teamId,
  changeData,
  coord,
}: {
  formElementModel: FormElementModelProps
  formItemStyles: CSSProperties | undefined
  isAuth: boolean
  eventId: number
  teamId: number
  changeData?: (item: any, value?: string, content?: string) => void
  coord: any
}) => {
  const { formulaNumvalObj } = $store.getState()
  //默认多选值
  let showCheckbox: any[] = []
  if (formulaNumvalObj[formElementModel.uuId]) {
    showCheckbox = JSON.parse(formulaNumvalObj[formElementModel.uuId])
  } else if (formElementModel.value) {
    showCheckbox = JSON.parse(formElementModel.value)
  }
  //是否显示多选框
  const [visible, setVisble] = useState(false)
  //设置多选tag
  const [showCheckTag, setShowCheckTag] = useState(showCheckbox)
  //多选选项列表
  const [showModalList, setShowModalList] = useState<any>([])

  //打开多选modal
  const selectCheckbox = () => {
    if (formElementModel.businessSystemRelation === 1) {
      const uuId = formElementModel.copyUuid || formElementModel.parentUuId || formElementModel.uuId
      getSelectOuterData(eventId, teamId, uuId, 'checkbox')
        .then(data => {
          const newCheckList = data.map((item: { id: any; val: any }) => {
            return {
              id: item.id,
              val: item.val,
            }
          })
          setShowModalList(newCheckList)
        })
        .catch(() => {
          setShowModalList([])
        })
    } else {
      const checkList = formElementModel.approvalFormElementContentModels.map(item => {
        return {
          id: item.elementId,
          val: item.content,
        }
      })
      setShowModalList(checkList)
    }
    setVisble(true)
  }
  //关闭多选modal
  const onCancel = () => {
    setVisble(false)
  }
  //确定多选选择回调
  const onOk = (selectIds: string[]) => {
    const valueContentVal = selectIds.map((item: any) => {
      return item.val
    })
    setShowCheckTag(selectIds)
    const updateData = { [formElementModel.uuId]: JSON.stringify(selectIds) }
    changeData && changeData({ data: updateData, contentArr: valueContentVal.join(',') })
    setVisble(false)
  }
  //删除已选择回调
  const closeCheck = (id: string) => {
    const newSelectChecks = showCheckTag.filter((item: { id: string }) => item.id !== id)
    const valueStr = newSelectChecks.map((item: { val: any }) => {
      return item.val
    })
    setShowCheckTag(newSelectChecks)
    const updateData = { [formElementModel.uuId]: JSON.stringify(newSelectChecks) }
    changeData && changeData({ data: updateData, contentArr: valueStr.join(',') })
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
            <Button className="approval-add-btn" onClick={selectCheckbox}></Button>
            <CheckboxModal
              list={showModalList}
              selected={showCheckTag}
              visible={visible}
              onOk={onOk}
              onCancel={onCancel}
            />
          </>
        )}
        {showCheckTag.map((item: { id: string; val: string }, index: number) => (
          <Tooltip key={index} title={item.val}>
            <Tag
              closable={isAuth}
              onClose={(e: any) => {
                e.preventDefault()
                closeCheck(item.id)
              }}
              style={{ border: !isAuth ? 0 : '1px solid #dcdcdc' }}
            >
              {item.val}
            </Tag>
          </Tooltip>
        ))}
      </div>
    </div>
  )
}

export default RenderCheckboxForm
