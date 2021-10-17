import React, { useRef } from 'react'
import { Avatar, Dropdown, Modal, Tabs } from 'antd'
import { PhotosPreview, RenderPreImgs } from '@/src/components/normal-preview/normalPreview'
import { loopTaskListDataShow } from '@/src/components/loop-task-date/loop-task-date'
// import { ProgressColors } from '../../fourQuadrant/TableList'
const { TabPane } = Tabs

// 初始层级
export const initTaskLevel = (subTaskLevels: number) => {
  const level: string[] = []

  for (let i = 1; i < subTaskLevels + 1; i++) {
    level.push(String(i))
  }

  return level
}
//  判断 日志 描述label文字
export const judeDescriptText = (type: any) => {
  switch (type) {
    case 7:
    case 71:
      return '冻结说明'
    case 31:
      return '指派说明'
    case 5:
      return '移交备注'
    default:
      break
  }
}

//  判断 日志 提示文字
export const judeTypeText = (type: any) => {
  switch (type) {
    case 1:
      return '名称'
    case 2:
      return '描述'
    case 3:
      return '附件'
    case 4:
      return '验收人'
    case 5:
      return '督办人'
    case 6:
      return '标签'
    case 7:
      return '循环配置'
    case 8:
      return '优先级'
    case 9:
      return '属性'
    case 10:
      return '清单'
    case 11:
      return '提醒'
    case 12:
      return '开始时间'
    case 13:
      return '结束时间'
    case 14:
      return '执行人'
    case 15:
      return '领导责任人'
    case 16:
      return '归属'
    case 17:
      return '进度'
    case 18:
      return '类型'
    case 19:
      return '指派人'
    case 20:
      return '参与企业'
    case 23:
      return 'O'
    case 24:
      return 'KR'
    case 27:
      return '信心指数'
    case 29:
      return '打分标准'
    default:
      break
  }
}

// 处理数据
export const filterData = (type: number, data: any) => {
  if (data == null || data === 'undefind' || data == '{}' || !data) return '无'

  // if (typeof data == 'object') {
  //   icon1 = $tools.asAssetsPath(`/images/task/task-pandect/${JSON.parse(data).icon}.png`)
  // }

  if (type === 6) {
    const _tagItem = JSON.parse(data)
    const icon1 = $tools.asAssetsPath(`/images/task/${_tagItem.icon}.png`)
    let html = ''
    if (_tagItem.icon) html += `<img src="${icon1}" style={width:100%;height:100%} alt="" />`
    if (_tagItem.tag && _tagItem.tag.length != 0) {
      for (let i = 0; i < _tagItem.tag.length; i++) {
        html += `<span class='tag-name'> ${_tagItem.tag[i].content} </span>`
      }
    }
    return html
  }

  if (type === 7) return loopTaskListDataShow(JSON.parse(data))
  if (type === 8) {
    if (data.indexOf('number') != -1) {
      const icon1 = $tools.asAssetsPath(`/images/task/task-pandect/${data}.png`)

      // 数字类型
      return `<img src="${icon1}" style="width:16px;height:16px" alt="" />`
    } else {
      // 星星类型
      const star = $tools.asAssetsPath('/images/common/star.png')
      return `${data} <img src="${star}" style="width:16px;height:16px;position:relative;top:-2px;" alt="" />`
    }
  }
  if (type === 9) return data == 1 ? '私密' : '公开'
  if (type === 11) {
    let text = ''
    if (data == '0') text = '无提醒'
    if (data == '1') text = '0分钟提醒'
    if (data == '2') text = '5分钟提醒'
    if (data == '3') text = '15分钟提醒'
    if (data == '4') text = '30分钟提醒'
    if (data == '5') text = '1小时提醒'
    if (data == '6') text = '12小时提醒'
    if (data == '7') text = '1天提醒'
    if (data == '8') text = '1周提醒'
    return text
  }
  if (type == 25) {
    return `<span class="status_icon"
              style="border: 1px solid ${getstatusColor(data).color};background-color: ${
      getstatusColor(data).bgcolor
    }">
              <span class="status_icon_color" style="background-color: ${getstatusColor(data).color}"></span>
            </span>
            <span class="status_icon_text" style=" color: ${getstatusColor(data).color}">
              ${getstatusColor(data).text}
            </span>`
  }

  return data
}
//对象去重
// export const unique = (arr: any) => {
//   const hash = {}
//   const newArray = arr.reduce((item: any, next: any) => {
//     hash[next.userId] ? '' : (hash[next.userId] = true && item.push(next))
//     return item
//   }, [])
//   return newArray
// }

// 递归处理数据，组装成同级
export const RenderItem = (data: any, parentName: string) => {
  const newChilds: any = []
  const getChild = (childs: any, parentName: string) => {
    for (let i = 0; i < childs.length; i++) {
      newChilds.push({ ...childs[i], parentName: parentName })

      if (childs[i].childComments && childs[i].childComments.length != 0) {
        getChild(childs[i].childComments, childs[i].username)
      }
    }
  }
  getChild(data, parentName)
  return newChilds
}

// 显示头部操作基本信息
interface HeaderProps {
  username: string
  userProfile: string
  createTime: string
  content: string
}
export const HeaderComponet = ({ objItem }: { objItem: HeaderProps }) => {
  const { username, userProfile, createTime, content } = objItem
  return (
    <div className="onelevel_item_title">
      <Avatar size={32} src={userProfile} style={{ backgroundColor: '#4285f4', fontSize: 12, marginRight: 12 }}>
        {username && username.substr(-2, 2)}
      </Avatar>
      <div className="user-box">
        <span className="user-content">
          <span className="user-name">{username}</span> {content}{' '}
        </span>
        <span className="user-time">{createTime}</span>
      </div>
    </div>
  )
}

//状态显示颜色
//状态显示颜色
const getstatusColor = (val: any) => {
  let color = ''
  let bgcolor = ''
  let text = ''
  if (val == 0) {
    color = '#4285F4'
    bgcolor = '#E9F2FF'
    text = $intl.get('normal')
  } else if (val == 1) {
    color = '#FFAA00'
    bgcolor = '#FFF6E1'
    text = $intl.get('hasRisks')
  } else if (val == 2) {
    color = '#34A853'
    bgcolor = '#E5F7E8'
    text = $intl.get('leading')
  } else if (val == 3) {
    color = '#EA4335'
    bgcolor = '#FEF3F2'
    text = $intl.get('delay')
  }
  return {
    color: color,
    bgcolor: bgcolor,
    text: text,
  }
}
// 显示任务详情基本信息
interface TaskInfoProps {
  taskName: string
  progress?: any
  color?: number
  cycleNum?: number
  workPlanType?: number
}
export const TaskInfoComponet = ({ objItem }: { objItem: TaskInfoProps }) => {
  const { taskName, progress, color, workPlanType } = objItem
  let colorIndex = -1
  // let strokeColor: any = -1
  // let trailColor: any = -1

  if (color) {
    colorIndex = progress.newProcess == 100 ? 4 : color > 0 ? color - 1 : color
    //进度条的色彩
    // strokeColor =
    //   ProgressColors[colorIndex] && ProgressColors[colorIndex][0] ? ProgressColors[colorIndex][0] : ''
    //未完成的分段的颜色
    // trailColor =
    //   ProgressColors[colorIndex] && ProgressColors[colorIndex][1] ? ProgressColors[colorIndex][1] : ''
  }
  if (progress && !progress.oldProcessStatus && progress.oldProcessStatus != 0) {
    progress.oldProcessStatus = progress.newProcessStatus
  }
  let detailname = ''
  if (workPlanType == 2) {
    detailname = 'object'
  } else if (workPlanType == 3) {
    detailname = 'kr'
  }
  return (
    <div className="task-info ">
      <div className="left-container flex center ">
        <em className={`task-info-icon ${detailname}`}></em>
        <span className="task-info-text my_ellipsis">{taskName}</span>
        {objItem.cycleNum && objItem.cycleNum === 0 && <span className="boardTaskType circleNum">循</span>}
        {objItem.cycleNum && objItem.cycleNum > 0 && (
          <span className="boardTaskType circleNum">循 {objItem.cycleNum}</span>
        )}
      </div>
      {progress ? (
        workPlanType == 2 || (workPlanType == 3 && progress) ? ( //o、kr的进展展示
          <>
            {workPlanType == 3 && (
              <div className="right_heart">
                <i></i>
                <span>{progress.oldCci}</span>
                <i className="right_heart_icon"></i>
                {/* <i className="heart_change_icon">→</i> */}
                <i></i>
                <span>{progress.newCci}</span>
              </div>
            )}

            <div className="right_process">
              <span>{progress.oldProcess}%</span>
              <i className="right_heart_icon"></i>
              <span>{progress.newProcess}%</span>
            </div>
            <div className="status_icon_mian">
              <span
                className="status_icon"
                style={{
                  border: `1px solid ${getstatusColor(progress.oldProcessStatus).color}`,
                  backgroundColor: `${getstatusColor(progress.oldProcessStatus).bgcolor}`,
                }}
              >
                <span
                  className="status_icon_color"
                  style={{ backgroundColor: `${getstatusColor(progress.oldProcessStatus).color}` }}
                ></span>
              </span>
              <span
                className="status_icon_text"
                style={{ color: `${getstatusColor(progress.oldProcessStatus).color}` }}
              >
                {getstatusColor(progress.oldProcessStatus).text}
              </span>
              <i className="right_heart_icon"></i>
              <span
                className="status_icon"
                style={{
                  border: `1px solid ${getstatusColor(progress.newProcessStatus).color}`,
                  backgroundColor: `${getstatusColor(progress.newProcessStatus).bgcolor}`,
                }}
              >
                <span
                  className="status_icon_color"
                  style={{ backgroundColor: `${getstatusColor(progress.newProcessStatus).color}` }}
                ></span>
              </span>
              <span
                className="status_icon_text"
                style={{ color: `${getstatusColor(progress.newProcessStatus).color}` }}
              >
                {getstatusColor(progress.newProcessStatus).text}
              </span>
            </div>
          </>
        ) : (
          colorIndex != -1 && (
            <div className="right_process">
              <span>{progress.oldProcess}%</span>
              <i></i>
              <span>{progress.newProcess}%</span>
            </div>
            // <div className="right">
            //   <Tooltip title={`${progress.newProcess}%`}>
            //     <Progress
            //       className="cus-progress"
            //       width={32}
            //       strokeWidth={12}
            //       type="circle"
            //       percent={progress.newProcess}
            //       format={percent => percent}
            //       strokeColor={strokeColor}
            //       trailColor={trailColor}
            //     />
            //   </Tooltip>
            // </div>
          )
        )
      ) : (
        ''
      )}
    </div>
  )
}

// 复盘信息
interface ReproduceProps {
  content: string
}
export const ReproduceComponet = ({ objItem }: { objItem: ReproduceProps }) => {
  const { content } = objItem
  // 图片预览框组件
  const photosRef = useRef<any>(null)
  return (
    <>
      <div className="opinion_text">
        <div className="problem_title">复盘心得</div>
        <pre contentEditable={false}>
          <RenderPreImgs content={content} photosRef={photosRef} />
        </pre>
      </div>
      {/* 预览图片 */}
      <PhotosPreview ref={photosRef} />
    </>
  )
}

// 描述模态框
interface DescriptProps {
  content: string
  visible: boolean
  type: number //1:修改后 0:修改前
  action: (status: boolean) => void
}
export const DescriptComponet = ({ objItem }: { objItem: DescriptProps }) => {
  const { content, visible, type, action } = objItem
  // 图片预览框组件
  const photosRef = useRef<any>(null)

  return (
    <Modal
      title={type ? '任务描述【修改后】' : '任务描述【修改前】'}
      className="descriptModal"
      width={1200}
      footer={[]}
      visible={visible}
      onCancel={() => action(false)}
      maskClosable={false}
      centered
    >
      <p contentEditable={false} onScroll={(e: any) => e.stopPropagation()()}>
        <RenderPreImgs content={content} photosRef={photosRef} />
      </p>
      {/* 预览图片 */}
      <PhotosPreview ref={photosRef} />
    </Modal>
  )
}
// 已读未读用户窗口
interface RederUserHtmlProps {
  noReadUser: UserProps[]
  isReadUser: UserProps[]
}
interface UserProps {
  username: string
  profile: string
}

const UserOverlay = ({ content }: { content: RederUserHtmlProps }) => {
  const { noReadUser, isReadUser } = content
  return (
    <Tabs defaultActiveKey="1" className="drop-users">
      <TabPane tab={`未读(${noReadUser.length})`} key="1">
        <div className="drop-user-box flex wrap">
          {noReadUser.map((item: UserProps, index: number) => (
            <div className="drop-user-item flex column center" key={index}>
              <Avatar size={42} src={item.profile} style={{ backgroundColor: '#4285f4', fontSize: 12 }}>
                {item.username && item.username.substr(-2, 2)}
              </Avatar>
              <span className="user-name my_ellipsis">{item.username}</span>
            </div>
          ))}
        </div>
      </TabPane>
      <TabPane tab={`已读(${isReadUser.length})`} key="2">
        <div className="drop-user-box flex wrap">
          {isReadUser.map((item: UserProps, index: number) => (
            <div className="drop-user-item flex column center" key={index}>
              <Avatar size={42} src={item.profile} style={{ backgroundColor: '#4285f4', fontSize: 12 }}>
                {item.username && item.username.substr(-2, 2)}
              </Avatar>
              <span className="user-name my_ellipsis">{item.username}</span>
            </div>
          ))}
        </div>
      </TabPane>
    </Tabs>
  )
}
export const RederUsersCom = ({ objItem }: { objItem: RederUserHtmlProps }) => {
  const { noReadUser, isReadUser } = objItem

  return (
    <Dropdown overlay={<UserOverlay content={objItem} />} trigger={['click']} placement="topRight">
      <span>
        <span className="readed_title">{noReadUser.length}人未读/</span>
        <span className="readed_title">{isReadUser.length}人已读</span>
      </span>
    </Dropdown>
  )
}
