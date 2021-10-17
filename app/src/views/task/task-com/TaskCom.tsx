import React, { useEffect, useState } from 'react'
import { isImgUrl } from '@/src/common/js/common'
import { Avatar, Tag, Tooltip } from 'antd'
import $c from 'classnames'
/**
 * 获取任务类型
 */
export const taskTypeName = (type: number) => {
  let taskType = ''
  switch (Number(type)) {
    case 1:
    case 0:
      taskType = '任务'
      break
    case 2:
      taskType = '职能'
      break
    case 5:
    case 3:
      taskType = '项目'
      break
  }
  return taskType
}

/**
 * 获取任务类型标签
 */
export const TaskTypeTag = ({ type, className, concatMsg, style }: any) => {
  let objSpn: any = ''
  switch (Number(type || 0)) {
    case 1:
      objSpn = (
        <span style={style} className={`taskTypeLabel boardXm ${className || ''}`}>
          项目{concatMsg}
        </span>
      )
      break
    default:
      objSpn = (
        <span style={style} className={`taskTypeLabel boardRw ${className || ''}`}>
          任务{concatMsg}
        </span>
      )
      break
    // case 0:
    //   objSpn = (
    //     <span style={style} className={`taskTypeLabel boardMb ${className || ''}`}>
    //       目标{concatMsg}
    //     </span>
    //   )
    //   break
    // case 1:
    //   objSpn = (
    //     <span style={style} className={`taskTypeLabel boardLs ${className || ''}`}>
    //       临时{concatMsg}
    //     </span>
    //   )
    //   break
    // case 2:
    //   objSpn = (
    //     <span style={style} className={`taskTypeLabel boardZn ${className || ''}`}>
    //       职能{concatMsg}
    //     </span>
    //   )
    //   break
    // case 3:
    //   objSpn = (
    //     <span style={style} className={`taskTypeLabel boardXm ${className || ''}`}>
    //       项目{concatMsg}
    //     </span>
    //   )
    //   break
  }
  return objSpn
}

/**
 * 显示任务角色负责人
 */
export const RoleComponet = ({ params }: { params?: any }) => {
  const labelShow = params ? params.labelShow : true
  const { code, style, type } = params
  // console.log(code, 'codema')
  let cName = ''
  let cTitl = ''
  if (code == 1) {
    cName = 'my_assign'
    cTitl = '我指派'
  } else if (code == 4) {
    cName = 'my_execute'
    cTitl = '我执行'
  } else if (code == 5) {
    cName = 'my_leader'
    cTitl = '我领导'
  } else if (code == 6) {
    cName = 'my_supervise'
    cTitl = '我督办'
  }
  return (
    <Tooltip title={cTitl}>
      <span className="Task_text" style={{ color: '#9a9aa2', fontSize: '12px', marginRight: '5px' }}>
        {type ? '项目' : '任务'}
      </span>
      <span style={style} className={$c(`myTaskRoleBox ${cName}`)}>
        {/* {labelShow ? cTitl : ''} */}
        {cTitl}
      </span>
    </Tooltip>
  )
}

/**
 * 任务列表标签html渲染
 * showWay显示方式 //1：纯文本展示 0：圆角方框展示
 */
export const TaskListTags = (paramObj: { tagList: any; showWay?: number; classname?: string }) => {
  return (
    <div
      className={`taskTagListBox flex-1 my_ellipsis ${paramObj.classname} ${
        paramObj.showWay == 1 ? '' : 'txtStyle'
      } ${paramObj.tagList.length == 0 ? 'null' : ''}`}
    >
      {paramObj.tagList.map((item: any, i: number) => {
        if (paramObj.showWay == 1) {
          if (i == 0) {
            return (
              <span
                key={i}
                className={`taskBigLabel taskLabelMarleft tagColor_${item.color}`}
                style={{ background: item.rgb }}
              >
                {item.content}
              </span>
            )
          } else {
            return (
              <span key={i} className={`taskBigLabel tagColor_${item.color}`} style={{ background: item.rgb }}>
                {item.content}
              </span>
            )
          }
        } else {
          let content = item.content || ''
          if (i != paramObj.tagList.length - 1) {
            content = item.content + '/'
          }
          return (
            <span key={i} className="taskTagTxt">
              {content}
            </span>
          )
        }
      })}
    </div>
  )
}

/**
 * 根据不同状态返回任务列表标签
 */
export const setTagByStatus = (item: globalInterface.TaskListProps) => {
  return (
    <div className="tag-list">
      {item.property === 1 && <Tag className="com-tag com-tag-m">密</Tag>}
      {item.status === 3 && <Tag className="com-tag com-tag-y">延</Tag>}
      {item.flag === 3 && <Tag className="com-tag com-tag-y">归</Tag>}
      {/* {item.approvalStatus !== 0 && <Tag className="com-tag com-tag-s">审</Tag>} */}
      {item.flag === 1 && <Tag className="com-tag com-tag-d">冻</Tag>}
      {item.isDraft === 1 && <Tag className="com-tag com-tag-g">稿</Tag>}
      {item.cycleNum === 0 && <Tag className="com-tag com-tag-x">循</Tag>}
      {item.cycleNum > 0 && <Tag className="com-long-tag  com-tag-x">循 {item.cycleNum}</Tag>}
      {item.assignName && item.assignName && (
        <Tag color={'#E7E7E9'} className="com-long-tag ">
          由{item.assignName}指派
        </Tag>
      )}
      {item.planCount && item.planCount !== 0 && (
        <Tag color={'#E7E7E9'} className="com-long-tag ">
          问题:{item.planCount}
        </Tag>
      )}
      {item.today === true && (
        // <Tag icon={<img src={$tools.asAssetsPath('/images/common/today_task.png')} />}></Tag>
        <Tag className="com-tag com-tag-y com-tag-j">今</Tag>
      )}
    </div>
  )
}

/**
 * 倒计时展示
 */
export const countDownShow = (item: any) => {
  //是否启动
  const isStart = item.executeTime != null
  //是否完成
  const isComplet = item.status == 2
  // 倒计时
  let progressCir = <span className="nostart_percent">-/-</span>
  const processObj = item.progress || {}
  if (isStart) {
    progressCir = setProgressHtm(processObj, isComplet)
  }
  //   let showTxt = `消耗时长：${processObj.consumer || 0}天 | 剩余时长：${processObj.residue || 0}天`
  // let showContent = `${processObj.consumer || 0}天 | ${processObj.residue || 0}天`
  // if (item.fromMsg == 'project') {
  //   // showTxt = `已消耗${processObj.consumer || 0}天/共${processObj.totalDays || 0}天`
  //   showContent = `已消耗${processObj.consumer || 0}天/共${processObj.totalDays || 0}天`
  // }
  // 没有了预估时间，需要暂时屏蔽countdownRig中的展示数据
  return (
    <div className="progressBox">
      {progressCir}
      <div className="countdownRig noshow">
        {/* <div className="countdown_use_time">{showContent}</div> */}
        {/* <div className="countdown_remain_time">
                        剩余{processObj.residue || 0}天
                        </div> */}
      </div>
    </div>
  )
}
/**
 * 渲染进度
 * isComplet 是否完成
 */
export const setProgressHtm = (infoObj: any, isComplet: boolean) => {
  let rotateLeft: any = {}
  let rotateRig: any = {}
  const percent = infoObj.percent || 0
  let progress = percent
  if (percent <= 50) {
    const deg = progress * 3.6 + 45
    rotateRig = { transform: `rotate(${deg}deg)` }
  } else {
    progress = percent - 50
    const deg = progress * 3.6 + 45
    rotateRig = { transform: 'rotate(225deg)' }
    rotateLeft = { transform: `rotate(${deg}deg)` }
  }
  let color = ''
  if (isComplet) {
    color = 'finish_color'
  } else {
    color = `process_color${infoObj.color || 0}`
  }
  //   let title = `${infoObj.day || 0}天未更新<br/>进度${percent}%`
  let _text = (
    <Tooltip title={percent + '%'}>
      <div className="text-circle">{percent}</div>
    </Tooltip>
  )
  if (infoObj.isopen == 1) {
    _text = <div className="text-circle">-/-</div>
  }
  return (
    <div className={`percentCircleCon ${color}`}>
      <div className="percent-circle percent-circle-left">
        <div className="percentCircleIn left-content" style={rotateLeft}></div>
      </div>
      <div className="percent-circle percent-circle-right">
        <div className="percentCircleIn right-content" style={rotateRig}></div>
      </div>
      {_text}
    </div>
  )
}

/**
 * 自定义头像
 */
export const OaAvatar = ({
  src,
  content,
  className,
}: {
  content: string
  src?: string
  className?: string
}) => {
  const bg = src ? { backgroundImage: `url(${src})` } : {}
  return (
    <div className={`oaAvatar ${className ? className : ''}`} style={bg}>
      {src ? '' : content}
    </div>
  )
}

/**
 * 判断图片url是否有效，防止加载为空
 */
export const CheckAvatar = ({
  profile,
  headName,
  tips,
  className,
}: {
  profile: string
  headName: string
  tips?: string
  className?: string
}) => {
  const [url, setUrl] = useState(profile)
  useEffect(() => {
    let monted = false
    isImgUrl(profile).then(res => {
      if (!monted) {
        if (res) {
          monted = true
          setUrl(profile)
        } else {
          setUrl('')
        }
      }
    })

    return () => {
      monted = true
    }
  }, [])
  return (
    <Tooltip title={tips || ''}>
      <Avatar src={url} className={`oa-avatar ${className || ''}`}>
        {headName}
      </Avatar>
    </Tooltip>
  )
}

/**
 * 获取自定义进度旋转角度
 * @param percent
 */
export const getProgressRotate = (percent: number) => {
  let rotateLeft: any = {}
  let rotateRig: any = {}
  let leftDeg: any = ''
  let rightDeg: any = ''
  let progress = percent
  if (percent <= 50) {
    const deg = progress * 3.6 + 45
    rotateRig = { transform: `rotate(${deg}deg)` }
    rightDeg = deg
  } else {
    progress = percent - 50
    const deg = progress * 3.6 + 45
    rotateRig = { transform: 'rotate(225deg)' }
    rotateLeft = { transform: `rotate(${deg}deg)` }
    leftDeg = deg
    rightDeg = 225
  }
  return {
    rotateLeft,
    rotateRig,
    leftDeg,
    rightDeg,
  }
}
