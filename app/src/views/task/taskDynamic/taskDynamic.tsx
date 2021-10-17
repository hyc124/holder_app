import React, { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { Checkbox, Select, DatePicker, Space, Input, Button, message, Tooltip, Avatar, Dropdown } from 'antd'
import './taskDynamic.less'
import $c from 'classnames'
// import '../../../../src/styles/common.less'
const CheckboxGroup = Checkbox.Group
const { Option } = Select
const { RangePicker } = DatePicker
import { requestApi } from '../../../common/js/ajax'
import ReportHistoryModel from '../../DailySummary/component/ReportHistoryList'
import NoneData from '@/src/components/none-data/none-data'
import * as Maths from '@/src/common/js/math'
import moment from 'moment'
import { RenderPreImgs, PhotosPreview } from '@/src/components/normal-preview/normalPreview'
import {
  DescriptComponet,
  HeaderComponet,
  initTaskLevel,
  judeDescriptText,
  RederUsersCom,
  RenderItem,
  ReproduceComponet,
  TaskInfoComponet,
} from './dynamicCom'
import LogItem from './logItemCom'
import { DownOutlined, CheckOutlined } from '@ant-design/icons'
import { hideShowHeader, isCheckHeaderShow } from '../taskDetails/detailRight'
import { RenderFileList } from '../../mettingManage/component/RenderUplodFile'
import { ApprovalcommentEditor } from '../../approval/components/ApprovalcommentEditor'
import { findCommentMessages } from '../../DailySummary/common/getReprt'
interface FilterProps {
  keyword: string
  nextLevel: string
  startTime: string
  endTime: string
  types: string[]
  planTypes: string[]
}
// 点击评论 页面滚动至元素可视
export const scrollToAnchor = (anchorName: any) => {
  if (anchorName) {
    const anchorElement = document.getElementById(anchorName)

    if (anchorElement) {
      anchorElement.scrollIntoView({
        behavior: 'smooth', // 默认 auto
        block: 'center', // 默认 center
        inline: 'center', // 默认 nearest
      })
    }
  }
}
// 滚动至顶部
export const scrollToTop = (from?: string) => {
  const top: any = document.getElementById('taskDynamic_container')

  if (top) {
    const containerDom: any = $('#taskDynamic_container')
    const headerDom: any = $('#taskDynamic_container').prev()
    if (from == 'other') {
      if (!containerDom.hasClass('pad_top_47')) {
        containerDom.addClass('pad_top_47')
      }
      if (headerDom.hasClass('forcedHide')) {
        headerDom.removeClass('forcedHide')
      }
    } else {
      if (!containerDom.hasClass('pad_top_47')) {
        containerDom.addClass('pad_top_47')
      }
    }
    top.scrollTo({
      top: 0,
      behavior: 'auto',
    })
  }
}

//暴露刷新页面
// let refreshDetail: any = null
export let refreshDetails: any = null
// 暴露滚动加载
export let dynamicScrollLoad: any = null
const optionsOne = [
  { label: '任务汇报', value: '2' },
  { label: '任务复盘', value: '7' },
  { label: '操作日志', value: '3' },
]
const optionsProject = [
  { label: '项目汇报', value: '2' },
  { label: '项目复盘', value: '7' },
  { label: '操作日志', value: '3' },
]
const okrOptionsOne = [
  { label: '全部', value: '1' },
  { label: '汇报', value: '2' },
  { label: '复盘', value: '7' },
  { label: '操作日志', value: '3' },
]

const initComment = { id: '', rootId: null, username: '' } //初始评论数据
//日期格式
const dateFormat = 'YYYY/MM/DD HH:mm'
// 缓存当前是否请求下一页数据状态
let loadMore = false
// 缓存当前是否还有更多数据
let noMoreData = false
// 缓存当前筛选组件状态
let dynamicHeaderDom: any
// 缓存滚动可是区域高度
let scrollContainer: any
/******************************************************************* 日志 start*************************************************************************************** */
const Log = ({ objItem, taskdetail }: any) => {
  // 描述框
  const [descriptModal, setDescriptContent] = useState({
    visible: false,
    content: '',
    type: 0,
  })
  const content = objItem.description.split('：')
  const headerItem = {
    username: objItem.username,
    userProfile: objItem.userProfile,
    createTime: objItem.createTime,
    content: content[1],
  }

  const taskInfo = {
    taskName: objItem.name,
    workPlanType: objItem.workPlanType,
    // progress: 80,
    // color: 1,
  }

  return (
    <>
      <div className="log_opinion  dynamics_content_item">
        <div className="get_onelevel_content">
          {/* 头部信息 */}
          <HeaderComponet objItem={headerItem} />
          {/* 任务详情 */}
          <TaskInfoComponet objItem={taskInfo} />
          {/* 日志项 */}
          <div className={`opinion_text`}>
            {/* 冻结、指派、移交说明 */}
            {objItem.reason && (
              <div className="onelevl_change_item">
                <span className="onelevl_change_type">{judeDescriptText(objItem.logType)}</span>
                <span className="onelevl_change_new">{objItem.reason}</span>
              </div>
            )}
            {/* item 循环 contentList */}
            {objItem.contentList &&
              objItem.contentList.map((item: any, index: number) => (
                <LogItem
                  key={index}
                  logItem={item}
                  action={(content: any, type: number, visible: boolean) => {
                    setDescriptContent({
                      content,
                      type,
                      visible,
                    })
                  }}
                />
              ))}
          </div>
        </div>
      </div>
      {/* 描述模态框 */}
      <DescriptComponet
        objItem={{
          ...descriptModal,
          action: (status: boolean) => {
            setDescriptContent({ content: '', type: 0, visible: status })
          },
        }}
      />
    </>
  )
}
/********************************************************************日志 end*************************************************************************************** */
/*********************************************************************复盘 start*************************************************************************************** */

const Repaly = ({ objItem }: any) => {
  const headerItem = {
    username: objItem.username,
    userProfile: objItem.userProfile,
    createTime: objItem.createTime,
    content: objItem.description.split('：')[1], //'提交了任务复盘'
  }
  const taskInfo = {
    taskName: objItem.content.taskName,
    workPlanType: objItem.workPlanType,
    // progress: 80,
    // color: 1,
  }
  const reproduceItem = {
    content: objItem.content.content,
  }
  return (
    <div className="contact_note_opinion  dynamics_content_item">
      <div className="get_onelevel_content">
        {/* 头部信息 */}
        <HeaderComponet objItem={headerItem} />

        {/* 任务详情 */}
        <TaskInfoComponet objItem={taskInfo} />
        {/* 内容 */}
        <ReproduceComponet objItem={reproduceItem} />
      </div>
    </div>
  )
}
/*********************************************************************强制汇报 start*************************************************************************************** */
const ForceReport = ({ objItem }: any) => {
  const headerItem = {
    username: objItem.username,
    userProfile: objItem.userProfile,
    createTime: objItem.createTime,
    content: objItem.description,
  }
  const taskInfo = {
    taskName: objItem.name,
    workPlanType: objItem.workPlanType,
    // progress: 80,
    // color: 1,
  }
  return (
    <div className="dynamics_content_item force-report-log">
      <div className="get_onelevel_content">
        {/* 头部信息 */}
        <HeaderComponet objItem={headerItem} />
        {/* 任务详情 */}
        <TaskInfoComponet objItem={taskInfo} />
        {/* 日志项 label :汇报设置 */}
        {objItem.contentList?.map((item: any, index: any) => {
          return (
            <div className="onelevl_change_item" key={index}>
              <span className="onelevl_change_type">汇报设置</span>
              <span className="onelevl_change_old">
                {item.before == null ? '无' : JSON.parse(item.before).content}
              </span>
              <span className="onelevl_change_icon"></span>
              <span className="onelevl_change_new">
                {`${item.after == null ? '无' : JSON.parse(item.after).content} ${
                  item.after == null ? '' : JSON.parse(item.after).time
                }`}
              </span>
            </div>
          )
        })}
      </div>
    </div>
    // </div>
  )
}
/*********************************************************************强制汇报 end*************************************************************************************** */

/********************************************************************复盘 end*************************************************************************************** */
const TaskDynamic = ({ param }: { param: { taskDetail: any } }) => {
  const { nowAccount, nowUserId, nowUser } = $store.getState()
  const taskdetail = param.taskDetail
  const [taskLevel, setTaskLevel] = useState<any>([]) //层级
  const [moreStatus, setMoreStatus] = useState(false) //显示 更多选择功能
  const [dataList, setDataList] = useState<any>([])
  const [commMsg, setCommentMessages] = useState<any>([])
  const [filters, setFilters] = useState<FilterProps>({
    keyword: '',
    nextLevel: '1',
    startTime: '',
    endTime: '',
    types: ['2', '7'],
    planTypes: ['2', '7'],
  })

  //打开强制汇报
  // const [openforce, setOpenforce] = useState(false)
  // 强制汇报相关参数
  // const [reportdata, setReportdata] = useState<any>({
  //   reportid: '',
  // })
  //历史汇报
  const [detailHistory, setDetailHistory] = useState({
    visible: false,
    data: {},
  })

  // 图片预览框组件
  const photosRef = useRef<any>(null)
  const inputRef: any = useRef(null)
  const containerRef: any = useRef(null)
  const contentRef: any = useRef(null)
  const headerRef: any = useRef(null)
  // 获取数据
  const getTaskDetails = (paramObj?: { findLevel?: any; scrollLoad?: boolean }) => {
    const infoObj = paramObj ? paramObj : {}
    const { scrollLoad } = infoObj
    if (!taskdetail.id) {
      return
    }

    const nextLevel = infoObj.findLevel ? infoObj.findLevel : filters.nextLevel

    const pageTime: string = scrollLoad && dataList.length != 0 ? dataList[dataList.length - 1].timestamp : '' //取最后一条数据的创建时间
    const param = {
      ...filters,
      taskId: taskdetail ? taskdetail.id : '',
      pageTime,
      pageSize: 15,
      nextLevel,
      mainId: taskdetail.mainId ? taskdetail.mainId : 0,
    }
    if (taskdetail.workPlanType != 2 && taskdetail.workPlanType != 3) {
      param.planTypes = []
    }
    requestApi({
      url: '/task/dynmic/findNew',
      param: param,
      json: true,
      // apiType: 'main',
      setLoadState: 1,
    }).then((res: any) => {
      if (res.success) {
        const _dataList = res.data.dataList || []
        noMoreData = _dataList.length === 0
        if (scrollLoad) {
          if (_dataList.length == 0) {
            message.warning('没有更多数据了！')
          } else {
            setDataList(dataList.concat(_dataList))
          }
        } else {
          scrollToTop()
          setDataList(_dataList)
        }
        // console.log('_dataList',_dataList);
        if (_dataList.length != 0) {
          findCommentMessages(
            _dataList[0].typeId,
            _dataList[0].ascriptionId,
            getFindCommentParas(taskdetail)
          ).then((sucessData: any) => {
            if (sucessData.returnCode == 0) {
              setCommentMessages(sucessData.dataList)
            }
          })
        }
      }
      loadMore = false
      isCheckHeaderShow(containerRef, contentRef, dynamicHeaderDom, headerRef)
    })
  }

  //刷新
  refreshDetails = getTaskDetails
  useLayoutEffect(() => {
    scrollContainer = $('#taskDynamic_container')
    dynamicHeaderDom = $('.task-dynamic-header')
    scrollContainer.off('mousewheel').on('mousewheel', '#taskNamicsMian', (e: any) => {
      const containerHeight = containerRef.current.offsetHeight || 0 //可见高度
      const contentHeight = contentRef.current.offsetHeight || 0 //内容高度
      dynamicHeaderDom = $('.task-dynamic-header')
      // 下滚加载分页
      if (e.originalEvent.wheelDelta <= 0) {
        // 如果可是区域小于滚动区域，则刘海头一直显示
        if (containerHeight < contentHeight) {
          hideShowHeader(dynamicHeaderDom, headerRef, 1)
        }
        if (noMoreData) {
          return
        }
        // 监听滚动事件
        // const contentH = scrollContainer[0].scrollHeight || 0 //内容高度
        const scrollTop = scrollContainer.scrollTop() || 0 //滚动高度
        if (contentHeight - containerHeight - scrollTop <= 5 && !loadMore) {
          dynamicScrollLoad()
        }
      } else {
        if (containerHeight < contentHeight) {
          hideShowHeader(dynamicHeaderDom, headerRef, 0)
        }
      }
    })
    // 暴露外部的滚动加载方法
    dynamicScrollLoad = () => {
      loadMore = true
      refreshDetails({ scrollLoad: true })
    }
    return () => {
      initData()
    }
  }, [])
  // 监听 任务变化，初始
  useEffect(() => {
    initData()
    const subTaskLevels = taskdetail ? taskdetail.subTaskLevels + 1 : 1
    const levels: any = initTaskLevel(subTaskLevels)
    setTaskLevel(levels)
    const defaultLevel = levels.length >= 3 ? '3' : levels[levels.length - 1]
    setMoreStatus(false)
    initFiltersData(defaultLevel)
    getTaskDetails({ findLevel: defaultLevel })
    // console.log('详情刘海头', taskdetail)
  }, [taskdetail])

  // 初始过滤数据
  const initFiltersData = (defaultLevel: string) => {
    filters.keyword = ''
    filters.startTime = ''
    filters.endTime = ''
    filters.types = ['2', '7']
    filters.planTypes = ['2', '7']
    filters.nextLevel = defaultLevel
    setFilters({ ...filters })
  }
  // 初始缓存数据
  const initData = () => {
    if (loadMore) loadMore = false
    if (noMoreData) noMoreData = false
    hideShowHeader(dynamicHeaderDom, headerRef, 0)
  }

  //汇报 复盘选择项
  const onChangeOne = (checkedList: any) => {
    filters.types = checkedList
    setFilters({ ...filters })
    getTaskDetails()
  }
  //会议 审批选择项
  // const onChangeTwo = (checkedList: any) => {
  //   setCheckedListTwo(checkedList)
  // }
  // 层级选择
  const handleLevelChange = (value: any) => {
    console.log(value, 'jiagou')
    filters.nextLevel = value
    setFilters({ ...filters })
    getTaskDetails()
  }

  //时间选择变化
  const onTimeChange = (value: any, dateStrings: string[]) => {
    setMoreStatus(false)
    filters.startTime = dateStrings[0]
    filters.endTime = dateStrings[1]
    setFilters({ ...filters })
    getTaskDetails()
  }

  /*********************************************************************头部筛选 start*************************************************************************************** */
  const overlayHtml = (
    <div className={$c('task-two')}>
      {/* {optionsTwo.length > 0 && (
        <CheckboxGroup
          options={optionsTwo}
          defaultValue={checkedListTwo}
          onChange={(checkedList: any) => {
            onChangeTwo(checkedList)
          }}
        />
      )} */}
      <div className="task_twoipt">
        <Input
          ref={inputRef}
          defaultValue={filters.keyword}
          placeholder="请输入姓名/关键字"
          className="baseInput radius16 border0 bg_gray"
          prefix={
            <em
              className="search-icon-t-btn"
              onClick={() => {
                filters.keyword = inputRef.current.state.value
                setFilters({ ...filters })
                setMoreStatus(false)
                getTaskDetails()
              }}
            ></em>
          }
          onPressEnter={(e: any) => {
            filters.keyword = e.target.value
            setFilters({ ...filters })
            setMoreStatus(false)
            getTaskDetails()
          }}
          style={{ width: 200 }}
        />
      </div>
      {/* <Space direction="vertical" className="customSpace" size={12}> */}
      <div className="timer_picker">按时间筛选</div>
      <div className="task_twopicker">
        <RangePicker
          showTime={true}
          onChange={onTimeChange}
          suffixIcon=""
          format={dateFormat}
          value={
            filters.startTime == ''
              ? null
              : [moment(filters.startTime, dateFormat), moment(filters.endTime, dateFormat)]
          }
        />
      </div>

      {/* </Space> */}
    </div>
  )
  const Header = () => {
    return (
      <div ref={headerRef} className={`my-dynamic-header task-dynamic-header pad_hor`}>
        <div className="task-one flex between">
          <CheckboxGroup
            options={taskdetail.type == 1 ? optionsProject : optionsOne} //type:0--任务；5--项目
            defaultValue={filters.types}
            onChange={(checkedList: any) => {
              onChangeOne(checkedList)
            }}
          />
          <div className="task-level">
            <Select
              className="levelSelect"
              defaultValue={'展示' + filters.nextLevel + '层'}
              style={{ width: 87 }}
              onChange={(value: any) => {
                handleLevelChange(value)
              }}
              disabled={taskLevel && taskLevel.length == 1}
              bordered
              suffixIcon={<span className="img_icon tri_down"></span>}
            >
              {taskLevel.map((item: any, index: number) => (
                <Option value={item} key={index}>
                  {item}
                </Option>
              ))}
            </Select>
            <Dropdown
              visible={moreStatus}
              trigger={['click']}
              overlay={overlayHtml}
              onVisibleChange={(visible: boolean) => {
                setMoreStatus(visible)
              }}
            >
              <Tooltip title="筛选">
                <span className="arrow-btn-box">
                  <span className="arrow-btn img_icon"></span>
                </span>
              </Tooltip>
            </Dropdown>
          </div>
        </div>
      </div>
    )
  }
  const controlStatus = (list: any, val: any) => {
    let name = ''
    list.map((item: any) => {
      if (item == val) {
        name = 'active'
      }
      if (val == 1 && list.length == 3) {
        name = 'active'
      }
    })
    return name
  }
  const getNowStstus = (type: string) => {
    let nowType: any = type == 'okr' ? filters.planTypes : filters.types
    return (
      <>
        <div className="main_item_name">{type == 'okr' ? 'OKR状态' : '任务状态'}</div>
        <ul className="main_item_sattus">
          {okrOptionsOne.map((item: any, index: number) => (
            <li
              className={`${controlStatus(nowType, item.value)}`}
              value={item.value}
              key={index}
              onClick={(e: any) => {
                e.stopPropagation()

                if (item.value == '1') {
                  if (nowType.length == 3) {
                    nowType = []
                  } else {
                    nowType = ['2', '7', '3']
                  }
                } else {
                  if (nowType.indexOf(item.value) == -1) {
                    nowType.push(item.value)
                  } else {
                    nowType.splice(nowType.indexOf(item.value), 1)
                  }
                }
                if (type == 'okr') {
                  filters.planTypes = nowType
                } else {
                  filters.types = nowType
                }
                setFilters({ ...filters })
                getTaskDetails()
              }}
            >
              {type == 'okr' ? (item.value == '2' ? $intl.get('progressRep') : item.label) : item.label}
            </li>
          ))}
        </ul>
      </>
    )
  }

  const selectOkrTxet = () => {
    let nameText: any = ''
    filters.planTypes.map((item: any) => {
      if (item == '2') {
        nameText = nameText + 'OKR状态:' + $intl.get('progressRep') + '、'
      } else if (item == '7') {
        nameText = nameText + $intl.get('replay') + '、'
      } else if (item == '3') {
        nameText = nameText + $intl.get('operateLogs') + '、'
      }
    })
    filters.types.map((item: any) => {
      if (item == '2') {
        nameText = nameText + '任务状态:' + $intl.get('taskReport') + '、'
      } else if (item == '7') {
        nameText = nameText + $intl.get('taskReplay') + '、'
      } else if (item == '3') {
        nameText = nameText + $intl.get('taskOperateLogs') + '、'
      }
    })
    return nameText.substr(0, nameText.length - 1)
  }
  // Okr的动态筛选
  const OkrHeader = () => {
    return (
      <div ref={headerRef} className={`my-dynamic-header task-dynamic-header pad_hor`}>
        <div className="task-one flex between">
          <div className="select_tag">
            <Dropdown
              overlay={
                <div className="okr_main_item">
                  {getNowStstus('okr')}
                  {getNowStstus('')}
                </div>
              }
              trigger={['click']}
            >
              <a className="okr_Select" onClick={e => e.preventDefault()}>
                <span className="text-ellipsis">{selectOkrTxet()}</span>
                {/* <DownOutlined /> */}
                <span className="Select_icon"></span>
              </a>
            </Dropdown>
          </div>

          <div className="task_left">
            <Select
              className="levelSelect scrollbarsStyle"
              defaultValue={`展示 ${filters.nextLevel} 层`}
              style={{ width: 102 }}
              // listHeight={176}
              onChange={(value: any) => {
                handleLevelChange(value)
              }}
              disabled={taskLevel && taskLevel.length == 1}
              bordered
              suffixIcon={<span className="img_icon tri_down"></span>}
            >
              {taskLevel.map((item: any, index: number) => (
                <Option value={item} key={index}>
                  {/* {item}
                   */}
                  <div className="select_items">
                    <span>展示 {item} 层</span>
                    <span
                      className="checkOutlined"
                      style={{
                        display: Number(filters.nextLevel) == index + 1 ? 'block' : 'none',
                        float: 'right',
                      }}
                    >
                      <CheckOutlined style={{ color: '#4285F4' }}></CheckOutlined>
                    </span>
                  </div>
                </Option>
              ))}
            </Select>
            <Dropdown
              visible={moreStatus}
              trigger={['click']}
              overlay={overlayHtml}
              onVisibleChange={(visible: boolean) => {
                setMoreStatus(visible)
              }}
            >
              <Tooltip title="筛选">
                <span className="arrow-btn-box">
                  <span className="arrow-btn img_icon"></span>
                </span>
              </Tooltip>
            </Dropdown>
          </div>
        </div>
      </div>
    )
  }
  /*********************************************************************头部 end*************************************************************************************** */

  /******************************************************************** 汇报 start*************************************************************************************** */
  const Report = ({ objItem, objItemIndex }: any) => {
    // console.log(objItem)
    const [showEditor, setShowEditor] = useState({
      visible: false,
      param: initComment,
    }) //显示富文本编辑器
    const reportRef: any = useRef()
    // const planRef: any = useRef()
    const headerItem = {
      username: objItem.username,
      userProfile: objItem.userProfile,
      createTime: objItem.createTime,
      content: objItem.description.split('：')[1],
    }
    const taskInfo = {
      taskName: objItem.content.taskName,
      progress: objItem.content.processes,
      workPlanType: objItem.workPlanType,
      color: 1,
      cycleNum: objItem.content.cycleNum,
    }
    const readerContent = {
      noReadUser: objItem.content.noReadUser || [],
      isReadUser: objItem.content.isReadUser || [],
    }

    // 获取当前评论信息  并打开评论副本编辑器
    const getCommentItem = (commenItem: any) => {
      setShowEditor({
        visible: true,
        param: commenItem,
      })
      // changeVal 子组件暴露给父组件的方法
      // type === 'reportRef' ? reportRef.current.changeVal(commenItem) : planRef.current.changeVal(commenItem)
    }

    // 编辑评论 富文本组件
    const EditorItem = ({
      commenObj,
      commentMsg,
      commentType,
      cRef,
      pageUuid,
      nextPlanModelIndex,
      closeEditor,
    }: any) => {
      // const [showEditor, setShowEditor] = useState(false) //显示富文本编辑器
      const [commentMessage, setCommentMessage] = useState(commentMsg) //@ 回复 存储评论父数据
      // const [placeholder, setPlaceholder] = useState('')

      //复盘富文本信息
      // const [editorText, setEditorText] = useState<any>()
      const editorRef = useRef<any>(null)
      const [msgTxtRef, setMsgTxtRef] = useState<any>(null)
      // const [pageUuid, setPageUuid] = useState<string>('')
      // 此处注意useImperativeHandle方法的的第一个参数是目标元素的ref引用
      // useImperativeHandle(cRef, () => ({
      //   // changeVal 就是暴露给父组件的方法
      //   changeVal: (commenItem: any) => {
      //     setCommentMessage(commenItem)
      //     setPlaceholder('@' + commenItem.username)
      //     // setShowEditor(!showEditor)
      //   },
      // }))

      // const [replay, setReplay] = useState<any>({ replayTip: '给Ta评论' })
      //输入变化状态
      const [status, setStatus] = useState<any>()
      //获取@成员
      const [atUserIds, setAtUserIds] = useState<any>([])
      //获取添加的附件
      const [addFiles, setAddFiles] = useState<any>([])
      const [fileModelss] = useState<any>([])
      //存储当前回复框的的附件UUID
      const [fileId, setFileId] = useState('')
      // 评论内容改变的数据
      // const [inputValue, setInpVal] = useState('')
      useEffect(() => {
        if (pageUuid) {
          setMsgTxtRef(editorRef.current.getEditor())
        }
      }, [pageUuid])
      //编辑评论内容
      // const editorChange = (html: any) => {
      //   setEditorText(html)
      // }
      // 发送评论
      const submitComment = () => {
        if (!msgTxtRef?.current?.innerHTML) return message.warning('请填写评论内容!')
        const typeId = commenObj.id //commentType 1:汇报  2:计划
        const type = commentType === 1 ? 0 : commentType === 2 ? 10 : '' //commentType 1:汇报  2:计划
        const parentId = commentMessage.id ? commentMessage.id : ''

        const rootId = commentMessage.rootId
          ? commentMessage.rootId
          : commentMessage.id
          ? commentMessage.id
          : null
        const userIds = commentMessage?.userId ? [commentMessage?.userId] : []
        const param = {
          userId: nowUserId, //评论人id
          userName: nowUser, //评论人姓名
          content: msgTxtRef.current.innerHTML || '', //评论内容
          userAccount: nowAccount, //评论人账号
          typeId, //评论主题id
          type, //报告类型 0任务汇报 10下一步计划  1工作报告 2制度 4公告
          parentId, //评论父id
          rootId, //根评论id
          // userIds: reportUserIds, //需要发通知的用户id集合
          // userNames: reportUserNames, //需要发通知的账号集合
          belongId: taskdetail ? taskdetail.ascriptionId : '', //归属id  ascriptionId: 730 ascriptionName: "测试哈哈哈哈"
          belongName: taskdetail ? taskdetail.ascriptionName : '', //归属名称
          belongType: 2, //归属类型
          temporaryId: fileId,
          // pushContent: pushContent, //推送内容
          atUserIds: atUserIds,
          taskId: taskdetail ? taskdetail.id : '', // 任务id
          userIds, //父级id合集
        }
        addCommentMessage(param)
      }
      // 发送 评论
      const addCommentMessage = (param: any) => {
        requestApi({
          url: '/public/comment/addCommentMessage',
          param: param,
          json: true,
        })
          .then((res: any) => {
            if (res.success) {
              findCommentMessage({ typeId: param.typeId, type: param.type, belongId: param.belongId })
              message.success('评论成功')
              closeEditor()
              // setEditorText('')
            }
          })
          .catch(err => console.log(err))
      }

      /**
       * 获取评论数据-新接口
       */
      const findCommentMessage = ({ typeId, belongId }: any) => {
        const newArr = [...dataList]
        findCommentMessages(typeId, belongId, getFindCommentParas(taskdetail)).then((sucessData: any) => {
          if (sucessData.returnCode == 0) {
            const commentMessages = sucessData.dataList || []
            if (commentType == 1) newArr[objItemIndex].content.commentMessages = commentMessages

            if (commentType == 2)
              newArr[objItemIndex].content.nextPlanModel[nextPlanModelIndex].commentMessages = commentMessages
          }
          setDataList(newArr)
          isCheckHeaderShow(containerRef, contentRef, dynamicHeaderDom, headerRef)
        })
      }
      return (
        <div className="comment_box_wrap">
          <ApprovalcommentEditor
            className="editorBox"
            ref={editorRef}
            param={{
              sourceType: 'synergyMain',
              currentType: 'replayRepoert',
              handleBtnShow: true,
              replay: { replayTip: '' },
              handleBtn: {
                emoji: false,
                file: false,
                sendMsg: false,
              },
              teamId: taskdetail ? taskdetail.ascriptionId : '',
              pageUuid: pageUuid,
              files: [],
              setFileList: ({ fileItem, imgUrl }: any) => {},
              delCommentTxt: () => {},
              compCommentHight: () => {},
              setStatus,
              atUserIds,
              addFiles,
              setAtUserIds,
              setAddFiles,
              fileModelss,
              getFileId: (uuid: any) => {
                setFileId(uuid)
              },
            }}
          />
          <div className="commen_btn">
            <Button
              onClick={() => {
                setCommentMessage({ id: '', rootId: null, username: '' })
                // setEditorText('')
                closeEditor()
              }}
            >
              取消
            </Button>
            <Button
              type="primary"
              onClick={() => {
                submitComment()
              }}
            >
              发送
            </Button>
          </div>
        </div>
      )
    }

    // 评论内容
    // const CommentCom = ({ comments, index, srcollToIpt, commentType }: any) => {
    const CommentCom = ({ comments, index, srcollToIpt, ascriptionId }: any) => {
      // console.log(comments)
      return (
        <div className="commentMessage_box">
          {comments?.map((item: any, seIndex: number) => (
            <div
              className="view_comment_item parent-conment"
              style={{ cursor: 'pointer' }}
              key={seIndex}
              onClick={() => {
                // getCommentItem(item, commentType)
                getCommentItem(item)
                scrollToAnchor(srcollToIpt + index)
              }}
            >
              <div className="header-content">
                <div className="flex center-v" style={{ marginBottom: 10 }}>
                  <Avatar className="oa-avatar" src={item.profile}>
                    {item.username && item.username.substr(-2, 2)}
                  </Avatar>
                  <div className="header-right">
                    <div className="flex center-v">
                      {/* <Tooltip title={`${item.username}`}>
                        <span className="username">{item.username.substr(0, 4)}：</span>
                      </Tooltip> */}
                      <RenderPreImgs
                        content={`<pre class="user-cont"><span style="width: 100%;">${item.username}：${item.content}</span></pre>`}
                        photosRef={photosRef}
                        parentNode={true}
                        htmlParentClass={'user-cont'}
                      />
                    </div>
                    <div className="time-wrapper flex between">
                      <span>{item.createTime}</span>
                    </div>
                  </div>
                </div>
                {item.fileReturnModels && item.fileReturnModels.length != 0 && (
                  <RenderFileList list={item.fileReturnModels || []} large={true} teamId={ascriptionId} />
                )}
              </div>
              <div className="view_comment_wrapper" contentEditable={false}>
                {/* <Divider /> */}
                {item.childComments &&
                  RenderItem(item.childComments, item.username).map((sItem: any, tindex: number) => (
                    <div
                      className="child-item-row"
                      key={tindex}
                      contentEditable={false}
                      onClick={e => {
                        e.stopPropagation()
                        // getCommentItem(sItem, commentType)
                        getCommentItem(sItem)

                        scrollToAnchor(srcollToIpt + index)
                      }}
                    >
                      <pre>
                        <RenderPreImgs
                          content={
                            `<span style="color: #191F25">${sItem.username}</span>：<span style="color: #70707A; margin-right: 6px">回复</span><span style="color: #191F25">${sItem.parentName}</span>：` +
                            sItem.content
                          }
                          photosRef={photosRef}
                          htmlParentClass={'child-item-row'}
                        />
                      </pre>
                      {/* 子级附件 */}
                      {sItem.fileReturnModels && sItem.fileReturnModels.length != 0 && (
                        <RenderFileList
                          list={sItem.fileReturnModels || []}
                          large={true}
                          teamId={ascriptionId}
                        />
                      )}
                      <div className="time-wrapper">
                        <span>{sItem.createTime}</span>
                      </div>

                      {/* <Divider /> */}
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )
    }

    return (
      <div className="process_normal_content dynamics_content_item report_content">
        {/* <div className="onelevel_item_time">
          <i className="process-icon task-editor-icon"></i>
          <span>{objItem.createTime}</span>
        </div> */}
        <div className="get_onelevel_content">
          {/* 头部信息 */}
          <div className="flex between">
            <HeaderComponet objItem={headerItem} />
            {objItem.userId === nowUserId && taskdetail.flag !== 3 && (
              <Tooltip title="编辑汇报">
                <span
                  className="edit_btn_box"
                  onClick={(e: any) => {
                    e.stopPropagation()
                    $store.dispatch({
                      type: 'TASK_LIST_ROW',
                      data: {
                        handleBtn: {
                          ascriptionId: objItem.ascriptionId,
                          id: objItem.taskId,
                          status: objItem.content.processes.newProcess == 100 ? 2 : 0,
                          executorUsername: objItem.username,
                          reportId: objItem.typeId,
                          type: 0,
                          time: Math.floor(Math.random() * Math.floor(1000)),
                          types: objItem.workPlanType == 2 || objItem.workPlanType == 3 ? 'okr' : '',
                          source: objItem.workPlanType == 2 || objItem.workPlanType == 3 ? 'okr_list' : '',
                        },
                        type: 1,
                        sourceType: '_detail',
                      },
                    })
                    $tools.createWindow('DailySummary')
                  }}
                >
                  <span className="edit_report_btn"></span>
                  编辑
                </span>
              </Tooltip>
            )}
          </div>
          {/* 任务详情 */}
          <TaskInfoComponet objItem={taskInfo} />
          <div className="onelevel_item_main">
            {/* 循环 content.models */}
            {objItem.content &&
              objItem.content.models &&
              objItem.content.models.map((item: any, index: number) => (
                <div className="problem_box" key={index}>
                  <p className="problem_title">[{item.name}]</p>
                  {/* 富文本内容 */}
                  <div className="problem_cont" contentEditable={false}>
                    <RenderPreImgs
                      content={item.content ? item.content.split(':::').join('') : ''}
                      photosRef={photosRef}
                    />
                  </div>
                </div>
              ))}
            {/* 下一步计划 循环 */}

            {objItem.content &&
              objItem.content.nextPlanModel &&
              objItem.content.nextPlanModel.map((item: any, index: number) => (
                // <div className="next_process_content" key={index}>
                <div className="problem_box" key={index}>
                  <div className="problem_title">下一步计划</div>
                  <div
                    className="problem_cont"
                    contentEditable={false}
                    // dangerouslySetInnerHTML={{ __html: item.content ? item.content.split(':::').join('') : '' }}
                    // onClick={() => {
                    //   onPreviewImg(item.content)
                    // }}
                  >
                    <RenderPreImgs
                      content={item.content ? item.content.split(':::').join('') : ''}
                      photosRef={photosRef}
                    />
                  </div>
                </div>
              ))}

            {/* 文件列表 */}
            {objItem.content && objItem.content.fileReturnModels && (
              <div className="taskFilesList overflow_hidden">
                <div className="file-header">附件：</div>
                {/* <FileList list={objItem.content.files || []} /> */}
                <RenderFileList
                  list={objItem.content.fileReturnModels || []}
                  large={true}
                  teamId={objItem.ascriptionId}
                />
              </div>
            )}
            <div className="flex between" style={{ marginTop: 12 }}>
              <div>
                <span
                  className="replay-report"
                  onClick={() => {
                    setShowEditor({ ...showEditor, visible: true, param: objItem })
                    scrollToAnchor('comment_box_wrap_report_' + objItemIndex)
                  }}
                >
                  <span className="btn-icon replay-report-icon"></span>
                  回复
                </span>

                {/*查看历史汇报 */}
                {objItem.workPlanType != 2 && objItem.workPlanType != 3 && (
                  <span
                    className="show-report"
                    onClick={(e: any) => {
                      e.stopPropagation()
                      detailHistory.visible = true
                      detailHistory.data = {
                        taskId: objItem.taskId,
                        reportId: objItem.typeId,
                        reportUser: objItem.userId,
                      } //reportUser 汇报人
                      setDetailHistory({ ...detailHistory })
                    }}
                  >
                    <span className="btn-icon show_report_btn"></span>
                    查看历史汇报
                  </span>
                )}
              </div>
              {/* 已读未读 */}
              <RederUsersCom objItem={readerContent} />
            </div>

            {/* 评论内容 */}
            {objItem.content && objItem.content.commentMessages && (
              <CommentCom
                comments={objItem.content.commentMessages}
                index={objItemIndex}
                srcollToIpt={'comment_box_wrap_report_'}
                commentType={'reportRef'}
                ascriptionId={objItem.ascriptionId}
              />
            )}
            {/* 评论引导框 */}
            {!showEditor.visible && (
              <Input
                type="text"
                placeholder="写下你的评论..."
                readOnly={true}
                onClick={() => {
                  setShowEditor({ ...showEditor, visible: true, param: objItem })
                  scrollToAnchor('comment_box_wrap_report_' + objItemIndex)
                }}
                style={{ margin: '12px 0' }}
              />
            )}

            {/* 汇报 评论框 */}
            <div id={'comment_box_wrap_report_' + objItemIndex} className="comment_box_wrap">
              {showEditor.visible && (
                <EditorItem
                  commenObj={objItem.content}
                  commentMsg={showEditor.param}
                  commentType={1}
                  ref={reportRef}
                  cRef={reportRef}
                  pageUuid={Maths.uuid()}
                  closeEditor={() => {
                    setShowEditor({
                      visible: false,
                      param: initComment,
                    })
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }
  /*********************************************************************汇报 end*************************************************************************************** */

  return (
    <>
      {taskdetail.workPlanType == 2 || taskdetail.workPlanType == 3 ? <OkrHeader /> : <Header />}
      <div id="taskDynamic_container" className="taskDynamic_container pad_hor pad_top_47" ref={containerRef}>
        <div
          id="taskNamicsMian"
          className={$c('taskNamicsMian', { boBorderLeft: dataList.length < 2 })}
          ref={contentRef}
        >
          {/* 2:汇报 21:强制汇报 3:日志 4:会议 5:审批 7:复盘心得 8:主题 */}
          {dataList.map((item: any, index: number) => {
            if (item.type == 2) return <Report key={index} objItem={item} objItemIndex={index} />
            if (item.type == 7) return <Repaly key={index} objItem={item} />
            if (item.type == 3) return <Log key={index} objItem={item} taskdetail={taskdetail} />
            if (item.type == 21) return <ForceReport key={index} objItem={item} />
          })}
          {dataList.length == 0 && (
            <NoneData
              searchValue={filters.keyword}
              imgSrc={$tools.asAssetsPath(`/images/noData/newreproduce.svg`)}
              showTxt={
                filters.types.length === 1 && filters.types[0] === '7'
                  ? '及时复盘，趁早发现问题哦~'
                  : '空空如也，这里什么都没有~'
              }
              imgStyle={{ width: 120, height: 120 }}
              containerStyle={{ minHeight: 300 }}
            />
          )}
        </div>
        {/* 强制汇报 */}
        {/* {openforce && (
            <Forcereport
              visible={openforce}
              datas={{
                from: 'detail', //来源
                isdetail: 1, //是否为详情 1详情 0设置 2编辑
                taskid: '', //任务id
                reportid: reportdata.reportid, //强制汇报id
                createTime: reportdata.createTime, //创建时间
                startTime: '', //开始时间
                endTime: '', //结束时间
                teamId: taskdetail.ascriptionId, //企业id
              }}
              setModalShow={setOpenforce}
              onOk={(datas: any) => {
                getTaskDetails()
              }}
            ></Forcereport>
          )} */}
      </div>

      {/* 历史汇报 */}
      {detailHistory.visible && (
        <ReportHistoryModel
          param={{ ...detailHistory, type: 0 }}
          setvisible={(state: any) => {
            setDetailHistory({ ...detailHistory, visible: state })
            getTaskDetails()
          }}
        />
      )}
      {/* 预览图片 */}
      <PhotosPreview ref={photosRef} />
    </>
  )
}
// 获取评论数据
export const getCommentMessage = ({
  typeId,
  type,
  commentType,
  dataList,
  objItemIndex,
  nextPlanModelIndex,
  containerRef,
  contentRef,
  headerRef,
  setDataList,
}: any) => {
  const param = {
    typeId,
    type: type,
    pageSize: 30,
    pageNo: 0,
  }
  requestApi({
    url: '/public/comment/commentMessagePage',
    param: param,
    json: false,
    apiType: 'main',
  }).then((res: any) => {
    if (res.success) {
      const commentMessages = res.data.data.content
      const newArr = [...dataList]
      if (commentType == 1) newArr[objItemIndex].content.commentMessages = commentMessages

      if (commentType == 2)
        newArr[objItemIndex].content.nextPlanModel[nextPlanModelIndex].commentMessages = commentMessages
      setDataList(newArr)
      isCheckHeaderShow(containerRef, contentRef, dynamicHeaderDom, headerRef)
      // ipcRenderer.send('update_unread_num') //更新工作台数量
    }
  })
}
export default TaskDynamic

// 获取当前查询评论参数类型
const getFindCommentParas = ({ workPlanType }: any) => {
  const type = workPlanType == 2 || workPlanType == 3 ? 16 : 0
  return type
}
