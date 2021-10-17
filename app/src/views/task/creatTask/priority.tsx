// 优先级显示{数字工作法、六点工作法}
import React, { useEffect, useState } from 'react'
import { findPriorityApi } from './getData'
import { Tooltip } from 'antd'
import { PriorityWarn } from '../taskModal/taskModal'
import { getAuthStatus } from '../../../common/js/api-com'
//数字工作法
const iconGather = {
  name: 'number',
  number: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  text: '优先级',
}
const PriorityDrop = (param: any) => {
  const props = param.props
  const setVisible = props.setVisible
  // 传入的星级数值
  const getStar = props.param.initDatas.data || 0
  const [datatype, setDatatype] = useState()
  const [goldAuth, setgoldAuth] = useState(false)

  const [active, setActive] = useState<any>(0)
  //六点优先法
  const [timepriority, setTimepriority] = useState([])
  // 设置的优先级被占用时二次提醒弹框显示
  const [priorityWarn, setPriorityWarn] = useState<any>({ visible: false })
  useEffect(() => {
    if (props.visible) {
      findPriority()
      //设置含金量权限
      const setGoldAuth = getAuthStatus('taskStarUpdate')
      setgoldAuth(setGoldAuth)
    }
  }, [props.visible])
  //查询工作方式
  const findPriority = () => {
    let typeIds: any = ''
    if (props.param.ascriptionType == 31 || props.param.ascriptionType == 0) {
      typeIds = props.param.roleId
    } else if (props.param.ascriptionType == 3) {
      typeIds = props.param.deptId
    } else {
      typeIds = props.param.teamId
    }
    const param = {
      enterpriseId: props.param.teamId, //企业id 645
      taskId: props.param.taskId ? props.param.taskId : '',
      typeId: typeIds,
      type: props.param.ascriptionType || 0,
    }
    findPriorityApi(param).then((desData: any) => {
      const types = desData.data.setType
      console.log(desData)
      setDatatype(types)
      if (types == 0) {
        setTimepriority(desData.data.star)
      }
    })
    //反显
    if (!props.param.initDatas) {
      setActive({
        type: 0,
        data: 0,
      })
    } else {
      setActive(props.param.initDatas.data)
    }
  }
  //点击存储数据
  // oldTaskId:被占用的任务id
  const setDatas = (
    type: string,
    data: number,
    attachInfo?: {
      taskId: string
      taskName: string
      liableUsername: string
    }
  ) => {
    const attachObj: any = attachInfo ? attachInfo : {}
    // 回调函数返回数据
    const datas = {
      type: type,
      data: data,
      taskId: props.param.taskId,
      oldTaskId: attachObj.taskId,
    }
    // 弹框隐藏
    if (setVisible) {
      setVisible(false)
    }
    if (getStar == data) {
      return
    }
    // 选中星级被占用且不是本身数值时二次弹框提醒
    if (attachObj.taskId) {
      if (!goldAuth) {
        return
      }
      props.setvisible && props.setvisible(false)
      setPriorityWarn({
        visible: true,
        taskName: attachObj.taskName || '',
        person: attachObj.liableUsername || '',
        star: data,
        onOk: () => {
          props.onOk(datas)
        },
      })
    } else {
      props.onOk(datas)
      setActive(data)
    }
  }

  if (datatype == 0) {
    //六点工作法
    return (
      <ul className="selPriorityBox sixPri">
        <p className="priority_tit">六点优先法</p>
        <div
          className={`task_sign_icon_no priority_no ${active == 0 ? 'active' : ''}`}
          onClick={() => {
            setDatas('', 0)
          }}
        >
          无
        </div>
        <li className="priorityList">
          {timepriority.map((item: any, index: number) => {
            const surplus = 1 - parseInt(item.count)
            const disable = surplus > 0 ? '' : 'disable'
            return (
              <Tooltip title={`剩余数量：${1 - parseInt(item.count)}`} key={index}>
                <div
                  className={`six_priority_item ${disable} ${active == item.star ? 'active' : ''}`}
                  onClick={() => {
                    setDatas('0', item.star, {
                      taskId: item.taskId || 0,
                      taskName: item.taskName || '',
                      liableUsername: item.liableUsername || '',
                    })
                  }}
                >
                  <span>{item.star}</span>
                  <em className="img_icon star_icon"></em>
                </div>
              </Tooltip>
            )
          })}
        </li>
        <PriorityWarn
          param={{ ...priorityWarn }}
          action={{
            setVisible: (flag: boolean) => {
              setPriorityWarn({ ...priorityWarn, visible: flag })
            },
          }}
        />
      </ul>
    )
  } else {
    //数字工作法
    return (
      <ul className="selPriorityBox">
        <p className="priority_tit">数字优先级</p>
        <div
          className={`task_sign_icon_no priority_no ${active == 0 ? 'active' : ''}`}
          onClick={() => {
            setDatas('', 0)
          }}
        >
          无
        </div>
        <li className="priorityList">
          <div className="priorityListIn">
            {iconGather.number.map((item: any) => {
              const url = `/images/common/${iconGather.name}-${item}.png`
              const bgUrl = $tools.asAssetsPath(url)
              return (
                <i
                  key={item}
                  className={`img_icon task_sign_icon num_priority_item ${active == item ? 'active' : ''}`}
                  onClick={() => {
                    setDatas('1', item)
                  }}
                >
                  <img src={bgUrl} />
                </i>
              )
            })}
          </div>
        </li>
      </ul>
    )
  }
}

const Priority = (props: any) => {
  return <PriorityDrop props={...props} />
}
export default Priority
