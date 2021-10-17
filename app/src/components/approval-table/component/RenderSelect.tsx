import { FormElementModelProps } from '@/src/views/approval/components/ApprovalDettail'
import { message, Select } from 'antd'
import React, { useRef } from 'react'
import { CSSProperties, useEffect, useState } from 'react'
import { getElementValue, getSelectOuterData } from '../getData/getData'
import $c from 'classnames'
import { shallowEqual, useSelector } from 'react-redux'

//单独渲染下拉菜单
const RenderSelect = ({
  formElementModel,
  formItemStyles,
  isAuth,
  teamId,
  eventId,
  changeData,
  coord,
  name,
}: {
  formElementModel: FormElementModelProps
  formItemStyles: CSSProperties | undefined
  isAuth: boolean
  teamId: number
  eventId: number
  changeData?: (item: any, value?: string, content?: string) => void
  coord: any
  name: any
}) => {
  const [dataAuth, setDataAuth] = useState(isAuth)
  const [selectOpen, setSelectOpen] = useState(false)
  const selectRef = useRef<any>(null)
  //显示已选
  const { formulaNumvalObj } = $store.getState()
  const approvalCheckData = useSelector((state: StoreStates) => state.approvalCheckData, shallowEqual)
  let showVal = ''
  if (formulaNumvalObj[formElementModel.uuId] && name === 'triggerApproval') {
    showVal = JSON.parse(formulaNumvalObj[formElementModel.uuId])[0].val
  } else if (formElementModel.value) {
    showVal = JSON.parse(formElementModel.value)[0]?.val
  }
  const selectOptions = useRef<any>(formElementModel.approvalFormElementContentModels || [])
  //切换下拉
  const changeSelect = (value: string, option: any) => {
    const selVal = JSON.stringify([{ id: option.key, val: value }])
    const updateData = { [formElementModel.uuId]: selVal }
    changeData &&
      changeData({
        data: updateData,
        contentArr: value,
        leaveDateRange: option.leavedaterange,
        leaveDateData: option.leavedatedata,
      })
    //清空受影响的
    formElementModel.influenceUuid?.map(item => {
      const updateData = { [item]: '' }
      changeData && changeData({ data: updateData, contentArr: '' })
    })
    showVal = JSON.parse(selVal)[0].val
    setDataAuth(dataAuth)
    // changeData && changeData(formElementModel, selVal, value)
  }
  useEffect(() => {
    if (formElementModel.businessSystemRelation === 1) {
      //查询外部数据
      const uuId = formElementModel.copyUuid || formElementModel.parentUuId || formElementModel.uuId
      getSelectOuterData(eventId, teamId, uuId, 'select')
        .then(data => {
          const newSelectOptions = data.map((item: { id: any; val: any }) => {
            return {
              elementId: item.id,
              content: item.val,
            }
          })
          selectOptions.current = newSelectOptions
          setDataAuth(dataAuth)
        })
        .catch(() => {
          message.error('查询外部数据失败')
          selectOptions.current = []
          setDataAuth(dataAuth)
        })
    }
  }, [])
  const beInfluences = approvalCheckData.filter(
    idx => formElementModel.beInfluenceUuid && formElementModel.beInfluenceUuid.includes(idx.uuId)
  )
  const beInVals = beInfluences
    .map(idx => {
      return idx.valueContent
    })
    .toString()
  //控件组控制权限
  useEffect(() => {
    if (formElementModel.beInfluenceUuid) {
      let newAuth = true
      beInfluences.map(item => {
        if (!item.valueContent) {
          newAuth = false
          showVal = ''
          const updateData = { [formElementModel.uuId]: '' }
          changeData && changeData({ data: updateData, contentArr: '' })
        }
      })
      ;(async () => {
        //如果选择了人员请求下拉框数据
        if (newAuth) {
          let paramModelList: any[] = []
          beInfluences.map(item => {
            paramModelList.push({
              elementGroupParamId: item.elementGroupParamId,
              paramValue: getElementValue(item),
            })
          })
          if (paramModelList.length != 0) {
            const dataList = await getSelectListData(paramModelList)
            selectOptions.current = JSON.parse(dataList[0].paramValue)
          }
        }
        setDataAuth(newAuth)
      })()
    }
  }, [beInVals])

  //查询下拉列表
  const getSelectListData = (paramModelList: any[]) => {
    return new Promise<any>((resolve, reject) => {
      const { loginToken } = $store.getState()
      let param = {
        elementGroupId: formElementModel.elementGroupId,
        paramModelList: paramModelList,
        teamId: teamId,
      }
      $api
        .request('/approval/elementGroupController/getElementGroupValueModel', param, {
          headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
        })
        .then(res => {
          if (res.returnCode === 0) {
            resolve(res.dataList)
          } else {
            reject()
          }
        })
        .catch(() => {
          reject()
        })
    })
  }
  return (
    <div
      ref={selectRef}
      className={$c('plugElementRow', {
        hasRequire: formElementModel.attribute === 1 && formElementModel.edit === 1,
      })}
      key={formElementModel.id}
      style={formItemStyles}
      data-elementid={formElementModel.id}
      data-type={'select'}
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
        <Select
          className="approval-select"
          disabled={!dataAuth}
          value={showVal}
          onChange={changeSelect}
          open={selectOpen}
          onFocus={() => {
            setSelectOpen(true)
          }}
          onBlur={() => {
            setSelectOpen(false)
          }}
          virtual={false}
        >
          {selectOptions.current.map((selectItem: { elementId: any; content: any; contentValue: string }) => (
            <Select.Option
              key={selectItem.elementId}
              value={selectItem.content}
              leavedaterange={selectItem.contentValue}
              leavedatedata={selectItem}
            >
              {selectItem.content}
            </Select.Option>
          ))}
        </Select>
      </div>
    </div>
  )
}
export default RenderSelect
