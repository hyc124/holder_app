import { Avatar } from 'antd'
import React from 'react'
import { toOKRWindow } from '../../task/taskDetails/detailRight'

// 进度输入值控制整数
export const changeInputVal = (e: any, type?: string, data?: any) => {
  let textboxvalue = e.target.value
  if (textboxvalue.length == 1) {
    textboxvalue = e.target.value.replace(/[^0-9]/g, '')
  } else {
    if (type == 'weight' || (type == 'score' && data.ratingType == 1)) {
      //权重和打分[分制为1:0-1的时候可以输入小数] 则可以输入小数后一位
      textboxvalue = e.target.value.replace(/^\D*(\d*(?:\.\d{0,1})?).*$/g, '$1')
    } else if (type == 'percent') {
      textboxvalue = e.target.value.replace(/^\D*(\d*(?:\.\d{0,2})?).*$/g, '$1')
    } else {
      textboxvalue = e.target.value.replace(/\D/g, '')
    }
  }
  if (!data) {
    if (textboxvalue > 100) {
      textboxvalue = 100
    }
  } else {
    if (data.ratingType == 1 && type == 'score') {
      if (textboxvalue > 1) {
        textboxvalue = 1
      }
    } else {
      if (textboxvalue > 100) {
        textboxvalue = 100
      }
    }
  }

  return textboxvalue
}

// 计算表格高度
export const calcTableScrollHeight = (filterMoule: any, fromSource: string) => {
  const filterMoules = typeof filterMoule == 'string' ? JSON.parse(filterMoule) : filterMoule
  // 有风险项展示则高度-130
  return fromSource == 'okr_module' &&
    ((filterMoules.isMyPlan && filterMoules?.periodId) || !filterMoules.isMyPlan)
    ? // ? 'calc(100% - 210px)'
      ''
    : 'calc(100% - 10px)'
}

//对齐关联的弹窗
export const ShowAlignModel = (props: any) => {
  const headDef: any = $tools.asAssetsPath('/images/workplan/head_def.png')

  const namesfN = (item: any) => {
    let names = item.username
    let textnames = item.username
    if (item.username == $intl.get('others') || item.username == '') {
      textnames = ''
      names = ' ? '
    }
    return (
      <span className="getnowName text-ellipsis">
        <Avatar
          size={24}
          src={textnames ? item.profile : headDef}
          className="oa-avatar"
          style={{ fontSize: '11px' }}
        >
          {textnames ? textnames.substr(-2, 2) : ''}
        </Avatar>
        {names}
      </span>
    )
  }

  const { type, dataList, hasAuth, sourceFrom, cancelBtn } = props.params
  return (
    <div
      className="model_Hover"
      // style={{ top: `${_layerY + 13}px`, left: `${_layerX}px` }}
      // onMouseLeave={prop.closeMOdel}
    >
      <i>{type == 0 ? '向上支撑' : '被支撑'}</i>
      <ul className="model_Hover_list">
        {dataList &&
          dataList?.length > 0 &&
          dataList?.map((item: any, index: number) => (
            <li className="model_Hover_item" key={index}>
              {namesfN(item)}
              <p
                className="okr_name text-ellipsis"
                onClick={(e: any) => {
                  e.stopPropagation()
                  // if (!dataList.hasAuth) {
                  //   return
                  // }
                  item.form = sourceFrom + '_detail'
                  item.id = item.planId
                  item.okrModeActive = '2' //默认选中详情
                  toOKRWindow(item)
                }}
              >
                {item.name}
              </p>
              <span
                style={{ color: '#3949ab', cursor: 'pointer' }}
                onClick={e => {
                  e.stopPropagation()
                  if (!hasAuth) {
                    return
                  }
                  cancelBtn(item.planId, index)
                }}
              >
                {type == 0 ? $intl.get('cancelAlign') : $intl.get('cancelRelate')}
              </span>
            </li>
          ))}
      </ul>
    </div>
  )
}
//查询状态
export const getZone = () => {
  const val = $('.workPlanListNav li.active').attr('data-type')
  return val
}
