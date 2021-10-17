import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Avatar,
  Button,
  Dropdown,
  Input,
  List,
  Menu,
  message,
  Modal,
  Pagination,
  Select,
  Spin,
  Table,
  Tooltip,
} from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import './EnterpriseClouddisk.less'
//获取用户加入的企业
import {
  AddBrowse,
  AddCollect,
  CancelCollect,
  downloadZipFiles,
  fileIcon,
  findAllCompany,
  getBrowseList,
  getCollectList,
  getSpaceSize,
  getWorkFileList,
} from './getData'
// import { ImagePreviewModal } from '../mettingManage/component/RenderUplodFile'
import moment from 'moment'
import { any } from 'async'
import { getLocationFormType } from '@/src/components/file-list/file-list-item'
import { downloadFile } from '@/src/components/download-footer/downloadFile'
import Checkbox from 'antd/es/checkbox'
import TaskReportModel from '../workReport/component/TaskReportModel'
import ReportDetails from '../workReport/component/ReportDetails'
import NoticeDetails from '@/src/components/notice-details/index'
import MeetDetails from '../mettingManage/component/MeetDetails'
import DetailModal from '../task/taskDetails/detailModal'
import InfiniteScroll from 'react-infinite-scroller'
import { Provider } from 'react-redux'
import RenderApprovalDetails from '../approval-only-detail/ApprovalDetailsOnly'
import { ipcRenderer } from 'electron'
import DownLoadFileFooter from '@/src/components/download-footer/download-footer'
import PdfModal from '../mettingManage/component/PdfTest'
import { refreshPage } from '../workdesk/TaskListData'
import { setAppLoading } from '@/src/components/app-loading/appLoading'
import { loadLocales } from '@/src/common/js/intlLocales'
import { ImagePreviewModal } from '../mettingManage/component/RenderUplodFile'
import { getImgSize } from '@/src/common/js/common'
const { Option } = Select

/**
 * 文件来源属性
 */
interface FileSourceProps {
  id: string
  text: string
  key: number
}

/**
 *文件来源
 */
const fileSourceList = [
  { key: 1, id: '-1', text: '全部来源' },
  { key: 2, id: '1', text: '任务' },
  { key: 3, id: '2', text: 'OKR' },
  { key: 4, id: '3', text: '汇报' },
  { key: 5, id: '4', text: '审批' },
  { key: 6, id: '5', text: '公告' },
  { key: 7, id: '6', text: '会议' },
  { key: 8, id: '7', text: '沟通' },
  { key: 9, id: '8', text: '其他' },
]

/**
 *文件类型
 */
const fileTypeList = [
  { id: '-1', text: '全部' },
  { id: '1', text: '文档' },
  { id: '2', text: '图片' },
  { id: '3', text: '音频' },
  { id: '4', text: '视频' },
  { id: '5', text: '其他' },
]

/**
 *排序
 */
const sortList = [
  { id: '1', text: '文件名称' },
  { id: '3', text: '文件大小' },
  { id: '2', text: '上传日期' },
]

let last = true
/*
 *图片类型
 */
const imgesType = ['bmp', 'jpg', 'png', 'gif', 'jpeg']

/***
 * 可预览的文档
 */
const canViewFileArr = ['ppt', 'pptx', 'xlsx', 'xls', 'doc', 'docx', 'pdf']

/***
 * 页码
 */
const paginationCus = {
  pageSizeOptions: ['5', '10', '30', '50', '80', '100'],
  showQuickJumper: true,
  showSizeChanger: true,
  defaultPageSize: 20,
}

//图片key
let photoIndexKey = ''

//选中的文件
let selectFile: any = []
//当前登录人 账户  选中的企业
const { nowUserId, nowAccount, selectTeamId } = $store.getState()

let companyId = selectTeamId.toString()

const userId = nowUserId.toString()
const EnterpriseClouddisk = () => {
  // input输入框
  const inputRef: any = useRef(null)
  //loading
  const [loading, setLoading] = useState(true)

  const [pageViewState, setPageViewState] = useState<any>({
    id: 1,
    title: '最近浏览',
    companyId: companyId,
    spaceVisible: false,
    sortBoxText: '',
    lastChooseType: false,
  })

  //表格数据源
  const [tableState, setTableState] = useState<any>({
    totalElements: 0,
    totalPages: 0,
    loadCount: 0,
    tableData: [],
  })

  //页面请求参数
  const [paramState, setParamState] = useMergeState({
    userId: userId,
    companyId: companyId,
    companyIds: [''],
    businessType: -1,
    fileType: -1,
    orderCode: 0,
    orderType: 0,
    pageIndex: 1,
    pageSize: 20,
    keywords: '',
    businessTypeStr: '',

    fileTypeStr: '',
  })

  // 企业列表数据
  const [enterpriseData, setEnterpriseData] = useState([
    {
      id: 0,
      name: '',
      departName: '',
      logo: '',
    },
  ])

  //下载按钮样式控制
  const [downloadBtn, setDownloadBtnClass] = useState('')

  //是否支持图片预览
  const [imgModalVisible, setImgModalVisible] = useState(false)

  //可预览图片列表
  const [fileList, setImageList] = useState<any>([])

  //任务汇报
  const [taskReportDetail, setTaskReport] = useState({
    taskReportVisible: false,
    taskId: any,
  })

  //任务详情
  // const [taskDetail, setTaskDetail] = useState({
  //   taskDetailVisible: false,
  //   taskId: any,
  // })

  //okr详情
  // const [okrDetail, setOkrDetail] = useState({
  //   okrDetailVisible: false,
  //   dataInfo: {},
  //   okrId: any,
  // })

  // 工作报告详情
  const [reportDetailsModel, setReportDetailsModel] = useState({
    showReportDetails: false,
    reportId: any,
  })

  //公告查看
  const [noticeVisible, setNoticeVisible] = useState(false)

  //会议详情
  const [meetDetails, setMeetDetails] = useMergeState({
    meetDetailsVisible: false,
    meetId: any,
  })

  // 缩率图模式 滚动加载 是否加载更多
  const [hasMore, setHasMore] = useState(false)

  // 缩率图模式 滚动加载 当前页
  const [pageIndex, setPageIndex] = useState(1)

  //设置最后一次选中的 左侧导航
  const [lastChooseState, setLastChoose] = useState({
    lastChooseType: true,
    pageViewState: {
      id: 1,
      title: '',
      companyId: '',
      spaceVisible: false,
      sortBoxText: '',
    },
  })

  //文件详情模态框
  const [detailModalState, setDetailModalState] = useState({
    detailModalVisible: false,
    fileInfo: {
      fileName: '',
      addTime: '',
      fileSize: '',
      userName: '',
      description: '',
      businessType: 0,
      businessId: 0,
    },
  })
  //PDF组件需要的参数
  const [pdfInfo, setPdfInfo] = useMergeState({
    preFileVisible: false,
    preFileUrl: '',
    preTitle: '',
  })

  // 详情弹框ref
  const detailModalRef = useRef<any>({})
  //点击左侧导航 更改页面显示参数
  const setPageViewEvent = (e: any, pageView: any) => {
    if (pageView.id == 3) {
      paramState.companyId = pageView.companyId.toString()
      pageViewState.id = 3
      pageViewState.companyId = pageView.companyId
      if (e == null) {
        pageViewState.title = pageView.title
      } else {
        pageViewState.title = '【' + pageView.title + '】中与我相关的文档'
      }
      pageViewState.spaceVisible = true
      setLastChoose({ lastChooseType: true, pageViewState: pageViewState })
      cleanData()
    } else {
      pageViewState.spaceVisible = false
      pageViewState.id = pageView.id
      pageViewState.title = pageView.title

      if (pageView.id == 4) {
        pageViewState.title = '"' + pageView.title + '"的搜索结果'
      } else {
        cleanData()
        setLastChoose({ lastChooseType: true, pageViewState: pageViewState })
      }
    }

    setPageViewState({ ...pageViewState })

    setParamState({ ...paramState })
    loadList()
  }

  // 获取企业列表数据
  useEffect(() => {
    // 初始化多语言配置
    loadLocales()
    setAppLoading(true)

    console.log('loading>>>>' + loading)
    //默认加载最近浏览
    pageViewState.id = 1
    pageViewState.title = '最近浏览'
    pageViewState.spaceVisible = false
    pageViewState.viewModel = 1
    setPageViewState({ ...pageViewState })

    //加载当前用户加入的企业
    findAllCompany({
      nowUserId: nowUserId,
      nowAccount: nowAccount,
    }).then((res: any) => {
      setEnterpriseData(res)
      const etpIds: any[] = []
      res?.forEach((etp: { id: any }) => {
        etpIds.push(etp.id.toString())
      })
      paramState.companyIds = etpIds
      if ((isEmpty(companyId) || companyId == '-1') && res != null && res.length > 0) {
        companyId = res[0].id.toString()
      }
      paramState.companyId = companyId
      setParamState(paramState)
      //加载列表 默认参数
      loadList()
    })
  }, [])

  //加载列表
  const loadList = (_index?: number, _size?: number, _isScorrll?: boolean) => {
    let index = _index
    let size = _size
    let isScorrll = _isScorrll
    if (pageViewState.viewModel == 2 && isEmpty(index)) {
      //缩率图模式初次加载 参数初始化
      index = 1
      size = 80
      isScorrll = true
      last = true
    }

    const requestParam = {
      userId: paramState.userId,
      companyId: paramState.companyId,
      companyIds: [''],
      businessType: paramState.businessType,
      fileType: paramState.fileType,
      orderCode: paramState.orderCode,
      orderType: paramState.orderType,
      pageIndex: index == null ? paramState.pageIndex : index,
      pageSize: size == null ? paramState.pageSize : size,
      keywords: paramState.keywords,
      userAccount: '',
    }
    if (isScorrll && index == 1) {
      tableState.tableData = []
      setTableState({ ...tableState })
    }
    setAppLoading(true)
    console.log(paramState.companyIds)
    requestParam.companyIds = []
    requestParam.companyIds = paramState.companyIds?.map((item: any) => {
      return item
    })

    if (pageViewState?.id == 1) {
      requestParam.companyIds.push(nowAccount)

      console.log(paramState.companyIds)
      //最近浏览
      getBrowseList(requestParam).then((res: any) => {
        if (res.code == 1) {
          const content = res.data.dataList || []
          let list = []
          if (content.length > 0 && isScorrll) {
            list = tableState.tableData.concat(content)
          }
          tableState.tableData = isScorrll ? list : content
          tableState.totalElements = res.data.pageCount
          tableState.totalPages = res.data.pageTotal
          tableState.loadList = list.length
          setTableState({ ...tableState })
          combineImageList(isScorrll ? list : content)
        } else {
          message.error(res.msg)
        }
        setAppLoading(false)
      })
    } else if (pageViewState?.id == 2) {
      requestParam.companyIds.push(nowAccount)
      //收藏列表
      getCollectList(requestParam).then((res: any) => {
        if (res.code == 1) {
          const content = res.data.dataList || []
          let list = []
          if (content.length > 0 && isScorrll) {
            list = tableState.tableData.concat(content)
          }
          tableState.tableData = isScorrll ? list : content
          tableState.totalElements = res.data.pageCount
          tableState.totalPages = res.data.pageTotal
          tableState.loadList = list.length
          setTableState({ ...tableState })
          combineImageList(isScorrll ? list : content)
        } else {
          message.error(res.msg)
        }
        setAppLoading(false)
      })
    } else {
      const selectCompanyId = (isEmpty(pageViewState?.companyId)
        ? requestParam.companyId
        : pageViewState?.companyId
      ).toString()
      //显示企业占用空间
      getSpaceSize({ companyId: selectCompanyId, userId: paramState.userId }).then((res: any) => {
        pageViewState.useSpaceSize = bytesToSize(res)
        setPageViewState({ ...pageViewState })
        setAppLoading(false)
      })
      //显示工作文档
      if (isEmpty(requestParam.keywords)) {
        requestParam.companyIds = []
        requestParam.companyIds.push(requestParam.companyId)
      } else {
        requestParam.userAccount = nowAccount
      }
      getWorkFileList(requestParam).then((res: any) => {
        if (res.code == 1) {
          const content = res.data.dataList || []
          console.log('index >>>' + index + '  size >>>' + size + '   count >>>' + content.length)
          let list = []
          if (content.length > 0 && isScorrll) {
            list = tableState.tableData.concat(content)
          }
          tableState.tableData = isScorrll ? list : content
          tableState.totalElements = res.data.pageCount
          tableState.totalPages = res.data.pageTotal
          tableState.loadList = list.length
          setTableState({ ...tableState })
          combineImageList(isScorrll ? list : content)
        } else {
          message.error(res.msg)
        }
        setAppLoading(false)
      })
    }

    if (selectFile.length > 0) {
      setDownloadBtnClass('downLoadBtnClick')
    } else {
      setDownloadBtnClass('')
    }
  }

  //预览事件
  const preFileEvent = (e: any, item: any) => {
    e.stopPropagation()
    const suffix = fileIcon(item, pageViewState.view).suffix

    if (imgesType.includes(suffix)) {
      // setImgModalVisible(true) // 图片预览
      const fromType = getLocationFormType(window.location.hash)
      getImgSize(item.officeUrl).then(res => {
        const imgWidthH = res
        photoIndexKey = item.fileGUID
        $store.dispatch({
          type: 'SET_FILE_OBJ',
          data: {
            imgWidthH,
            companyId,
            fromType,
            fileType: 'img',
            fileList: fileList,
            photoIndexKey: photoIndexKey,
          },
        })

        $tools.createWindow('fileWindow')
      })
    } else {
      // 判断文件类型 支持预览重新打开页面 ,附件预览,进行判断附件是否重新打开窗口或者给出tips信息

      if (canViewFileArr.includes(suffix)) {
        //打开附件预览窗口:
        if (suffix === 'pdf') {
          setPdfInfo({
            preFileVisible: true,
            preFileUrl: item.officeUrl,
            preTitle: item.fileName,
          })
          AddBrowse({
            userId: userId,
            companyId: paramState.companyId,
            fileGUID: item.fileGUID,
          })
        } else {
          AddBrowse({
            userId: userId,
            companyId: paramState.companyId,
            fileGUID: item.fileGUID,
          })
          //2021-08-06 用a标签预览附件
          const a = document.createElement('a')
          a.href = item.officeUrl + '&holderView=1'
          a.target = '_blank'
          a.click()
          // $store.dispatch({
          //   type: 'SET_FILE_OFFICE_URL',
          //   data: {
          //     url: item.officeUrl,
          //     fileName: item.fileName,
          //   },
          // })
          // $tools.createWindow('fileWindow').finally(() => {})
        }
      } else {
        message.warning('该文件类型不支持预览')
      }
    }
  }

  // 表格列
  const columns = [
    {
      title: '名称',
      dataIndex: 'fileName',
      key: 'fileName',
      width: '50%',
      ellipsis: { showTitle: false },
      sorter: true,
      render: (text: any, record: any) => {
        return (
          <div>
            <img className="fileImage" src={fileIcon(record, 1).imgIcon} />
            <Tooltip placement="bottom" title={text}>
              <span className="fileName">{text}</span>
            </Tooltip>
          </div>
        )
      },
    },

    {
      title: '',
      dataIndex: 'fileGUID',
      key: 'fileGUID',
      width: '10%',
      render: (text: any, record: any) => {
        return (
          <div className="operateBtn">
            <Button
              className={isEmpty(record.collectGuid) ? 'collectBtn' : 'cancelCollectBtn'}
              onClick={(e: any) => {
                e.stopPropagation()
                isEmpty(record.collectGuid)
                  ? collectEvent(record.fileGUID)
                  : cancelCollectEvent(record.collectGuid)
              }}
            ></Button>
            <Button
              className="downBtn"
              onClick={(e: any) => {
                e.stopPropagation()
                downloadSingleEvent(record)
              }}
            ></Button>
          </div>
        )
      },
    },

    {
      title: '上传时间',
      dataIndex: 'addTime',
      key: 'addTime',
      width: '20%',
      ellipsis: { showTitle: false },
      sorter: true,
      render: (text: any, record: any) => {
        const time = moment(text).format('YYYY/MM/DD HH:mm')
        return <span>{time}</span>
      },
    },
    {
      title: '类型',
      dataIndex: 'fileType',
      key: 'fileType',
      width: '10%',
      ellipsis: { showTitle: false },
      render: (text: any, record: any) => {
        return <span>{record.fileExt.toUpperCase()}文件</span>
      },
    },
    {
      title: '大小',
      dataIndex: 'fileSize',
      key: 'fileSize',
      width: '10%',
      ellipsis: { showTitle: false },
      sorter: true,
      render: (text: any, record: any) => {
        return <span>{bytesToSize(record.fileSize, 2)}</span>
      },
    },
    {
      title: '上传者',
      dataIndex: 'userName',
      key: 'userName',
      width: '10%',
    },
    {
      title: '来源',
      dataIndex: 'description',
      key: 'description',
      width: '25%',
      ellipsis: { showTitle: false },
      render: (text: any, record: any) => {
        return (
          <Tooltip placement="bottom" title={text}>
            <a
              className={
                record.businessId == 0 || record.businessId == null || record.businessId == undefined
                  ? 'sourceDisable description'
                  : 'description'
              }
              onClick={(e: any) => {
                e.stopPropagation()
                sourceEnvent({ businessType: record.businessType, businessId: record.businessId })
              }}
            >
              {text}
            </a>
          </Tooltip>
        )
      },
    },
  ]

  //下载单个附件
  const downloadSingleEvent = (item: any) => {
    //附件下载
    const fromType = getLocationFormType(window.location.hash)
    downloadFile({
      url: item.officeUrl,
      fileName: item.fileName,
      fileKey: item.fileGUID,
      dir: 'notice',
      fileSize: item.fileSize,
      fromType: fromType,
      companyId: companyId,
    })
  }

  /**
   * 文件列表页码变化
   * @param pagepageIndex
   * @param pageSize
   */
  const onTbalepageChange = (page: any, pageSize: any) => {
    paramState.pageIndex = page
    paramState.pageSize = pageSize
    setParamState({
      ...paramState,
    })
    loadList()
  }

  /**
   * 筛选条件改变
   * @param id 1=文件来源
   * @param value  2=文件类型
   */
  const changeFilter = (id: any, value: any) => {
    if (id == 1) {
      const list = fileSourceList.filter(function(item) {
        return item.text == value
      })
      paramState.businessType = list[0].id
      paramState.businessTypeStr = value
    }
    if (id == 2) {
      const filelist = fileTypeList.filter(function(item) {
        return item.text == value
      })
      paramState.fileType = filelist[0].id
      paramState.fileTypeStr = value
    }
    setParamState({ ...paramState })

    tableState.tableData = []
    setTableState({ ...tableState })

    loadList()
  }

  /***
   * 切换页面展示方式  不清空筛选条件 仅清空排序方式和选中文件
   */
  const changeViewEvent = () => {
    selectFile = []
    paramState.orderCode = -1
    paramState.orderType = 0

    tableState.tableData = []
    setTableState({ ...tableState })

    selectFile = []
    setSelectedRowKeys(selectFile)

    if (pageViewState.viewModel == 1) {
      pageViewState.viewModel = 2
      $('.ToggleMode').addClass('ToggleModeClick')
      pageViewState.sortBoxText = ''
    } else {
      pageViewState.viewModel = 1
      paramState.pageIndex = 1
      paramState.pageSize = 20

      $('.ToggleMode').removeClass('ToggleModeClick')
    }
    setParamState({ ...paramState })
    setPageViewState({ ...pageViewState })

    loadList()
  }

  //缩率图的checkbox
  const cbxOnClick = (e: any, fileModel: any) => {
    e.stopPropagation()
    if (e.target.checked) {
      selectFile.push(fileModel)
      console.log($(e.target).parent('.ant-checkbox'))
      $(e.target)
        .parent('.ant-checkbox')
        .parent('.ant-checkbox-wrapper')
        .parent('.topDiv')
        .parent('.thumbnailDiv')
        .addClass('selectThumbnailDiv')
    } else {
      selectFile.splice(selectFile.indexOf(fileModel), 1)
      $(e.target)
        .parent('.ant-checkbox')
        .parent('.ant-checkbox-wrapper')
        .parent('.topDiv')
        .parent('.thumbnailDiv')
        .removeClass('selectThumbnailDiv')
    }
    if (selectFile.length > 0) {
      setDownloadBtnClass('downLoadBtnClick')
    } else {
      setDownloadBtnClass('')
    }
  }

  const [selectedRowKeys, setSelectedRowKeys] = useState<any>([])
  /***
   * 列表选中文件
   */
  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedRowKeys: any, selectedRows: any) => {
      setSelectedRowKeys(selectedRowKeys)
      if (selectedRowKeys.length > 0) {
        setDownloadBtnClass('downLoadBtnClick')
      } else {
        setDownloadBtnClass('')
      }
      selectFile = selectedRows
    },
  }

  //表格 表头排序
  const sorterFun = (pagination: any, filters: any, sorter: any) => {
    paramState.orderType = sorter.order == 'descend' ? 0 : 1 // 排序类型，正序/倒叙/不排序
    switch (sorter.field) {
      case 'fileName':
        paramState.orderCode = 1
        break
      case 'addTime':
        paramState.orderCode = 2
        break
      case 'fileSize':
        paramState.orderCode = 3
        break
    }
    setParamState({ ...paramState })
    loadList()
  }

  //批量下载附件
  let downloadKey = ''
  const downloadZipEvent = () => {
    let downloadUrl = ''

    if (selectFile.length == 1) {
      //单独下载单个附件
      downloadSingleEvent(selectFile[0])
    } else {
      setAppLoading(true)
      //批量下载zip
      const fileGUIDList = selectFile.map((item: any) => {
        return item.fileGUID
      })
      if (isEmpty(downloadKey)) {
        downloadKey = Date.parse(Date()).toString()
      }
      downloadZipFiles({
        zipKey: downloadKey,
        fileGuids: fileGUIDList,
        companyId: companyId,
        userId: nowUserId,
      }).then(res => {
        if (res.code == 1) {
          if (!res.data.packageIsComplete) {
            downloadZipEvent()
          } else {
            downloadKey = ''
            downloadUrl = res.data.zipUrl
            const fromType = getLocationFormType(window.location.hash)
            downloadFile({
              url: downloadUrl,
              fileName: moment(Date()).format('YYYYMMDDHHmm') + '.zip',
              customOption: { url: downloadUrl, type: 'zip' },
              fileKey: '',
              fileSize: 800,
              dir: '',
              fromType: fromType,
            })
            setAppLoading(false)
          }
        } else {
          //错误
          message.error('下载出错啦！')
          setAppLoading(false)
          downloadKey = ''
        }
      })
    }
  }

  //来源点击事件
  const sourceEnvent = (business: any) => {
    switch (business.businessType) {
      case 1: //任务
      // taskDetail.taskDetailVisible = true
      // taskDetail.taskId = business.businessId
      // // setTaskDetail({ ...taskDetail })
      // detailModalRef.current?.setState({
      //   id: business.businessId,
      //   taskType: business.businessType == 2 ? 'okr' : '',
      //   taskData: { taskId: business.businessId, from: 'clouddisk' },
      //   visible: true,
      // })
      // break
      case 2:
        // okr
        // okrDetail.okrDetailVisible = true
        // okrDetail.dataInfo = {}
        // okrDetail.okrId = business.businessId

        // setOkrDetail({ ...okrDetail })
        detailModalRef.current?.setState({
          from: 'clouddisk',
          id: business.businessId,
          taskType: business.businessType == 2 ? 'okr' : '',
          taskData: {
            taskId: business.businessId,
            type: business.businessType,
            from: 'apiInit', //详情左侧初始化时请求接口方式渲染数据
          },
          visible: true,
        })

        break
      case 3:
        //汇报（工作报告）
        reportDetailsModel.showReportDetails = true
        reportDetailsModel.reportId = business.businessId
        setReportDetailsModel({ ...reportDetailsModel })
        break
      case 4:
        //审批
        approvalDetail(business.businessId)
        break
      case 5:
        //公告
        lookRule(business.businessId, '')
        break
      case 6:
        //会议
        meetDetails.meetId = business.businessId
        meetDetails.meetDetailsVisible = true
        setMeetDetails({ ...meetDetails })
        break
      case 7:
        //沟通
        const roomId = business.businessId
        const { chatListData, openRoomIds, selectItem } = $store.getState()
        const data = JSON.parse(JSON.stringify(chatListData))
        let newIds = [...openRoomIds]
        data.map((item: any) => {
          if (item.id == roomId) {
            const isRoomOpen = openRoomIds.some(thisId => {
              return thisId === item.id
            })
            if (!isRoomOpen) {
              // 添加打开的聊天室id
              newIds = [...openRoomIds, item.id]
              $store.dispatch({ type: 'SET_OPENROOM_IDS', data: newIds })
            }
            // 设置选中
            $store.dispatch({ type: 'SET_SELECT_ITEM', data: item })
            // 打开沟通窗口
            ipcRenderer.send('show_commuciate_muc', [selectItem, item])
          }
        })

        break
      case 8:
        break
    }
  }

  //展示详情模态框
  const showDetailModal = (fileInfo: any) => {
    detailModalState.detailModalVisible = true
    detailModalState.fileInfo = fileInfo
    setDetailModalState({ ...detailModalState })
  }

  //关闭模态框
  const handleCancel = () => {
    detailModalState.detailModalVisible = false
    setDetailModalState({ ...detailModalState })
  }

  //公告
  const lookRule = (noticeTypeId: number, noticeType: string) => {
    setNoticeVisible(true)
    $store.dispatch({
      type: 'NOTICE_DETAILS',
      data: {
        source: 'noticeList',
        noticeId: noticeTypeId,
        noticeType: noticeType,
      },
    })
  }

  //审批
  const approvalDetail = (approvalId: any) => {
    const modal = Modal.info({
      title: '审批详情',
      style: {
        height: '800px',
      },
      closable: true,
    })
    modal.update({
      title: '审批详情',
      width: '1000px',
      centered: true,
      okCancel: false,
      // okText: '知道了',
      icon: false,
      className: 'show-approval-details',
      content: (
        <Provider store={$store}>
          <RenderApprovalDetails queryAll={false} approvalId={approvalId} />
        </Provider>
      ),
    })
  }

  //缩率图排序事件
  const selectSortEvent = (id: any, text?: any) => {
    switch (id) {
      case 1:
      case 2:
      case 3:
        paramState.orderCode = id
        pageViewState.sortBoxText = text
        setPageViewState({ ...pageViewState })
        break
      case 4:
        paramState.orderType = 1
        break
      case 5:
        paramState.orderType = 0
        break
    }
    setParamState({ ...paramState })
    loadList(1, 80, true)
  }

  //滚动加载
  const handleInfiniteOnLoad = () => {
    console.log('进入了滚动加载。。。。。')
    setAppLoading(true)
    setHasMore(true)
    if (pageIndex >= tableState.totalPages) {
      if (last) {
        message.warning('没有了~别扯了')
      }
      last = false
      setAppLoading(false)
      setHasMore(false)
      return
    }
    console.log(pageIndex)
    setPageIndex(pageIndex + 1)
    console.log(pageIndex)
    loadList(pageIndex + 1, 80, true)
  }

  //显示更多按钮 悬浮事件
  const moreBtnMouserOverEvent = (e: any) => {
    $(e.currentTarget)
      .children('.moreUL')
      .show()
  }

  //显示更多按钮 点击事件
  const moreBtnClickEvent = (e: any) => {
    e.stopPropagation()
    $(e.currentTarget)
      .children('.moreUL')
      .show()
  }

  //显示更多按钮 鼠标离开事件
  const moreBtnMouveLeaveEvent = (e: any) => {
    $('.moreUL').hide()
  }

  //收藏事件
  const collectEvent = (fileGuid: any) => {
    setAppLoading(true)
    AddCollect({ companyId: paramState.companyId, userId: paramState.userId, fileGUID: fileGuid }).then(res => {
      if (res.code == 1) {
        message.success(res.msg)
      } else {
        message.error(res.msg)
      }
      loadList()
    })
  }

  //取消收藏
  const cancelCollectEvent = (collectGuid: any) => {
    setAppLoading(true)
    CancelCollect({
      companyId: paramState.companyId,
      userId: paramState.userId,
      collectGuid: collectGuid,
    }).then(res => {
      if (res.code == 1) {
        message.success(res.msg)
      } else {
        message.error(res.msg)
      }
      loadList()
    })
  }

  //组合图片列表
  const combineImageList = (list: any) => {
    if (list == null || list.length == 0) {
      return
    }
    const imageList: any = []
    list.map(function(file: any, i: number) {
      // file.fileKey = i
      const imgFormatArr = ['bmp', 'jpg', 'png', 'gif', 'jpeg']
      const fileExt = file.fileName
        .toLowerCase()
        .split('.')
        .splice(-1)[0]
      if (imgFormatArr.includes(fileExt)) {
        const model = {
          // fileName: file.fileName,
          // fileKey: i,
          // url: file.officeUrl,
          // size: file.fileSize,
          ...file,
          fileName: '',
          fileKey: file.fileGUID,
          companyId,
          displayName: file.fileName,
        }
        imageList.push(model)
      }
    })

    setImageList(imageList)

    return imageList
  }

  const sortMenu = (
    <div className="sortBox">
      <ul className="sortBox_top">
        <li
          className={`${paramState.orderCode == 1 ? 'itemCheck' : ''} item active`}
          onClick={(e: any) => selectSortEvent(1, '文件名称')}
        >
          文件名称
        </li>
        <li
          className={`${paramState.orderCode == 3 ? 'itemCheck' : ''} item `}
          onClick={(e: any) => selectSortEvent(3, '文件大小')}
        >
          文件大小
        </li>
        <li
          className={`${paramState.orderCode == 2 ? 'itemCheck' : ''} item `}
          onClick={(e: any) => selectSortEvent(2, '上传日期')}
        >
          上传日期
        </li>
      </ul>
      <ul className="sortBox_btm">
        <li
          className={`${paramState.orderType == 1 ? 'itemCheck' : ''} item `}
          onClick={(e: any) => selectSortEvent(4, '')}
        >
          升序
        </li>
        <li
          className={`${paramState.orderType == 0 ? 'itemCheck' : ''} item `}
          onClick={(e: any) => selectSortEvent(5, '')}
        >
          降序
        </li>
      </ul>
    </div>
  )

  //切换左侧导航 清空数据
  const cleanData = () => {
    paramState.pageIndex = 1
    if (pageViewState.viewModel == 1) {
      paramState.pageSize = 20
    } else {
      paramState.pageSize = 80
    }
    paramState.orderCode = 0
    paramState.orderType = 0
    paramState.businessType = -1
    paramState.fileType = -1
    paramState.keywords = ''
    selectFile = []
    setDownloadBtnClass('')
    paramState.businessTypeStr = ''
    paramState.fileTypeStr = ''
    setParamState({ ...paramState })

    pageViewState.sortBoxText = ''
    setPageViewState({ ...pageViewState })

    selectFile = []
    setSelectedRowKeys(selectFile)

    console.log(selectedRowKeys)
    tableState.tableData = []
    setTableState({ ...tableState })

    setPageIndex(1)
  }

  //加载页面数据
  const refreshEvent = () => {
    cleanData()
    loadList()
  }

  return (
    <div className="clouddiskMainDiv">
      <div className="cloud_wrap_l">
        <Input
          allowClear
          ref={inputRef}
          autoFocus={true}
          value={paramState.keywords}
          placeholder="名称/上传者关键字"
          className="cloud_seach_input margin16"
          prefix={
            <em
              className="search-icon-t-btn"
              onClick={(e: any) => {
                if (isEmpty(inputRef.current.state.value)) {
                  message.warning('请输入搜索关键词')
                  return
                }
                setPageViewEvent(null, { id: 4, title: e.target.value || '' })

                //  loadList();
              }}
            ></em>
          }
          suffix={
            paramState.keywords && (
              <em
                className="search_clear"
                onClick={() => {
                  paramState.keywords = ''
                  setParamState(paramState)
                  lastChooseState.lastChooseType = true
                  setLastChoose({ ...lastChooseState })
                  setPageViewEvent(null, {
                    id: lastChooseState.pageViewState.id,
                    title: lastChooseState.pageViewState.title,
                    companyId: lastChooseState.pageViewState.companyId,
                  })
                }}
              ></em>
            )
          }
          onChange={(e: any) => {
            const inputValue = e.target.value || ''
            setParamState({
              keywords: inputValue,
            })
            if (isEmpty(inputValue)) {
              lastChooseState.lastChooseType = true
              setLastChoose({ ...lastChooseState })
              setPageViewEvent(null, {
                id: lastChooseState.pageViewState.id,
                title: lastChooseState.pageViewState.title,
                companyId: lastChooseState.pageViewState.companyId,
              })
            }
          }}
          onPressEnter={(e: any) => {
            if (isEmpty(e.target.value)) {
              message.warning('请输入搜索关键词')
              return
            }
            setPageViewEvent(null, { id: 4, title: e.target.value || '' })
          }}
        />

        <div className="cloud_wrap_l_nav">
          <div
            className={`${
              pageViewState.id == 1 && lastChooseState.lastChooseType ? 'navRecentBrowseClick' : ''
            } recentBrowse option`}
            onClick={e => {
              setPageViewEvent(e, { id: 1, title: '最近浏览' })
            }}
          >
            <span className="spn"></span>最近浏览
          </div>
          <div
            className={`${
              pageViewState.id == 2 && lastChooseState.lastChooseType ? 'navCollectClick' : ''
            } navCollect option`}
            onClick={e => setPageViewEvent(e, { id: 2, title: '收藏' })}
          >
            <span className="spn"></span>收藏
          </div>
        </div>
        <div className="enter_prise_list">
          {enterpriseData.map((item, index) => (
            <div
              key={index}
              className={`${
                pageViewState.id == 3 && pageViewState.companyId == item.id && lastChooseState.lastChooseType
                  ? 'navCompanyClick'
                  : ''
              } company_item option`}
              onClick={e => setPageViewEvent(e, { id: 3, title: item.name, companyId: item.id })}
            >
              <Avatar
                size={16}
                src={item.logo ? item.logo : $tools.asAssetsPath('/images/common/company_default.png')}
              ></Avatar>
              <span className="company_item_name">{item.name}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="cloud_wrap_r">
        <div className="cloud_wrap_r_top">
          <Button type="primary" className={`${downloadBtn} downloadBtnIcon`} onClick={downloadZipEvent}>
            下载
          </Button>

          <div className="filterDiv">
            <Button className="refreshBtn" onClick={refreshEvent}>
              刷新
            </Button>
            {/* 文件来源 */}
            <div className="filterWrap margin16">
              <span className="lab_name">来源</span>
              <Select
                className="sourceSelect margin16"
                placeholder=""
                value={paramState.businessTypeStr}
                onChange={value => changeFilter(1, value)}
              >
                {fileSourceList.map((item: FileSourceProps) => (
                  <Option
                    key={item.id}
                    title={item.text}
                    value={item.text}
                    defaultValue={-1}
                    className="sourceSelectItem"
                  >
                    {item.text}
                  </Option>
                ))}
              </Select>
            </div>

            {/* 文件类型 */}
            <div className="filterWrap margin16">
              <span className="lab_name">类型</span>
              <Select
                className="fileTypeSelect margin16"
                value={paramState.fileTypeStr}
                onChange={value => changeFilter(2, value)}
              >
                {fileTypeList.map((item: any) => {
                  return (
                    <Option
                      key={item.id}
                      title={item.text}
                      value={item.text}
                      defaultValue={-1}
                      className="fileTypeItem"
                    >
                      {item.text}
                    </Option>
                  )
                })}
              </Select>
            </div>

            {/* 缩略图模式下的排序 */}
            {pageViewState.viewModel == 2 && (
              <div className="filterWrap margin16">
                <Dropdown trigger={['click']} overlay={sortMenu}>
                  <div className="fileTypeSelect margin16">
                    <span className="lab_name">排序</span>
                    <span
                      className={`${
                        paramState.orderType == 1 ? 'ascSort' : paramState.orderType == 0 ? 'descSort' : ''
                      } select_name`}
                    >
                      {pageViewState.sortBoxText}
                    </span>
                  </div>
                </Dropdown>
                <span
                  className="ant-select-arrow"
                  unselectable="on"
                  aria-hidden="true"
                  style={{ right: '25px' }}
                >
                  <span role="img" aria-label="down" className="anticon anticon-down ant-select-suffix">
                    <svg
                      viewBox="64 64 896 896"
                      focusable="false"
                      data-icon="down"
                      width="1em"
                      height="1em"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M884 256h-75c-5.1 0-9.9 2.5-12.9 6.6L512 654.2 227.9 262.6c-3-4.1-7.8-6.6-12.9-6.6h-75c-6.5 0-10.3 7.4-6.5 12.7l352.6 486.1c12.8 17.6 39 17.6 51.7 0l352.6-486.1c3.9-5.3.1-12.7-6.4-12.7z"></path>
                    </svg>
                  </span>
                </span>
              </div>
            )}

            <Button
              className="ToggleMode"
              onClick={(e: any) => {
                changeViewEvent()
              }}
            ></Button>
          </div>
        </div>
        {/* <Spin spinning={loading}> */}
        <div className="cloud_wrap_r_main">
          <div className="title">{pageViewState?.title}</div>
          {pageViewState?.spaceVisible && (
            <div className="useSpaceSize">已使用{pageViewState?.useSpaceSize}</div>
          )}
          <div className="tableContainer">
            {/* 列表模式显示 */}
            {pageViewState?.viewModel == 1 && tableState.tableData?.length !== 0 && (
              <Table
                size="small"
                className="tableCus"
                // loading={loading}
                pagination={false}
                columns={columns}
                rowKey={(record: any) => record.fileGUID}
                scroll={{ y: 'calc(100vh - 390px)' }}
                dataSource={tableState.tableData}
                // locale={{
                //   emptyText: '暂时没有数据~',
                // }}
                rowSelection={{
                  ...rowSelection,
                }}
                sortDirections={['descend', 'ascend']}
                onChange={sorterFun}
                onRow={record => {
                  return {
                    onClick: event => {
                      event.preventDefault()
                      preFileEvent(event, record)
                    }, // 双击行预览
                  }
                }}
              />
            )}
            {/* 缩略图模式显示 */}
            {pageViewState?.viewModel == 2 && tableState.tableData?.length !== 0 && (
              <div style={{ overflow: 'auto' }}>
                <InfiniteScroll
                  initialLoad={false}
                  pageStart={0}
                  loadMore={handleInfiniteOnLoad}
                  // hasMore={!loading && hasMore}
                  hasMore={true}
                  useWindow={false}
                  style={{ height: '100%' }}
                >
                  <List
                    // loading={loading}
                    dataSource={tableState.tableData}
                    className="thumbnailList"
                    renderItem={(item: any) => (
                      <List.Item
                        onClick={(e: any) => {
                          e.stopPropagation()
                          preFileEvent(e, item)
                        }}
                      >
                        <div className="thumbnailDiv">
                          <div className="topDiv">
                            <Checkbox
                              className="cbxSelect"
                              onClick={(e: any) => {
                                e.stopPropagation()
                                cbxOnClick(e, item)
                              }}
                            ></Checkbox>
                            <div
                              className="moreBtn"
                              onMouseOver={(e: any) => {
                                moreBtnMouserOverEvent(e)
                              }}
                              onMouseLeave={(e: any) => {
                                moreBtnMouveLeaveEvent(e)
                              }}
                              onClick={(e: any) => {
                                moreBtnClickEvent(e)
                              }}
                            >
                              <ul className="moreUL">
                                <li
                                  onClick={(e: any) => {
                                    e.stopPropagation()
                                    downloadSingleEvent(item)
                                  }}
                                >
                                  下载
                                </li>
                                <li
                                  onClick={(e: any) => {
                                    e.stopPropagation()
                                    isEmpty(item.collectGuid)
                                      ? collectEvent(item.fileGUID)
                                      : cancelCollectEvent(item.collectGuid)
                                  }}
                                >
                                  {item.collectGuid == null ? '添加到收藏' : '取消收藏'}{' '}
                                </li>
                                <li
                                  onClick={(e: any) => {
                                    e.stopPropagation()
                                    showDetailModal(item)
                                  }}
                                >
                                  文件信息
                                </li>
                              </ul>
                            </div>
                          </div>
                          <div className="contentDiv">
                            <img className="icon" src={fileIcon(item, '2').imgIcon} />
                            <Tooltip placement="bottom" title={item.fileName}>
                              <div className="fileName">{item.fileName}</div>
                            </Tooltip>
                          </div>
                        </div>
                      </List.Item>
                    )}
                  ></List>
                </InfiniteScroll>
              </div>
            )}

            {tableState.tableData?.length == 0 && (
              <div className="nodataDiv">
                <p>
                  <img src={$tools.asAssetsPath('/images/etpCloudDisk/nodata.png')} className="nodataImg" />
                </p>
                <span className="nodataText"> 暂时没有数据~</span>
              </div>
            )}
            {/* 页码仅在列表模式展示（最近浏览不展示） */}
            {pageViewState?.viewModel == 1 && tableState.tableData?.length !== 0 && (
              <Pagination
                className="paginationCus"
                {...paginationCus}
                pageSize={paramState.pageSize}
                current={paramState.pageIndex}
                total={tableState.totalElements}
                onChange={onTbalepageChange}
              />
            )}
          </div>
          {/* {imgModalVisible && (
            <ImagePreviewModal
              fileList={fileList}
              visible={imgModalVisible}
              photoIndex_Key={photoIndexKey}
              handleVisile={() => {
                setImgModalVisible(false)
              }}
            />
          )} */}

          <Modal
            title="文件信息"
            visible={detailModalState?.detailModalVisible}
            className="fileDetailModal"
            footer={[]}
            onCancel={handleCancel}
          >
            <ul className="fileDetailUL">
              <li>
                <span className="title">名称：</span>{' '}
                <span className="text">{detailModalState?.fileInfo?.fileName}</span>{' '}
              </li>
              <li>
                <span className="title">上传日期：</span>{' '}
                <span className="text">{detailModalState?.fileInfo?.addTime}</span>{' '}
              </li>
              <li>
                <span className="title">大小：</span>{' '}
                <span className="text"> {bytesToSize(detailModalState?.fileInfo?.fileSize)}</span>
              </li>
              <li>
                <span className="title">上传者：</span>{' '}
                <span className="text">{detailModalState?.fileInfo?.userName}</span>{' '}
              </li>
              <li>
                <span className="title">来源：</span>{' '}
                <a
                  className={`${
                    detailModalState?.fileInfo?.businessId == 0 ||
                    detailModalState?.fileInfo?.businessId == null ||
                    detailModalState?.fileInfo?.businessId == undefined
                      ? 'sourceDisable'
                      : ''
                  } text`}
                  onClick={() => {
                    sourceEnvent({
                      businessType: detailModalState?.fileInfo?.businessType,
                      businessId: detailModalState?.fileInfo?.businessId,
                    })
                  }}
                >
                  {detailModalState?.fileInfo?.description}
                </a>
              </li>
            </ul>
          </Modal>

          {/* 跳转到对应页面 */}

          {/* 任务详情 */}
          {/* {taskDetail.taskDetailVisible && (
            <DetailModal
              param={{
                visible: taskDetail.taskDetailVisible,
                from: 'chatmsg',
                id: taskDetail.taskId?.toString(),
                taskData: {},
              }}
              setvisible={(state: any) => {
                setTaskDetail({ ...state })
              }}
            ></DetailModal>
          )} */}

          {/* okr详情 */}
          {/* {okrDetail.okrDetailVisible && (
            <Okrdetail
              visible={okrDetail.okrDetailVisible}
              datas={okrDetail.dataInfo}
              mindId={okrDetail.okrId}
              oId=""
              setvisible={(visible: any) => {
                okrDetail.okrDetailVisible = visible;
                setOkrDetail({ ...okrDetail })
              }}
              openMode={(resData: any) => {
                // OpenMode('100', resData)
              }}
            ></Okrdetail>
          )} */}
          <DetailModal
            ref={detailModalRef}
            // param={{
            //   visible: okrDetail.okrDetailVisible,
            //   from: 'chatmsg',
            //   id: okrDetail.okrId?.toString(),
            //   taskData: { taskType: 'okr' },
            // }}
            // setvisible={(state: any) => {
            //   okrDetail.okrDetailVisible = state
            //   setOkrDetail({ ...okrDetail })
            // }}
          ></DetailModal>
          {/* 任务汇报 */}
          {taskReportDetail?.taskReportVisible && (
            <TaskReportModel
              param={{
                visible: true,
                data: { taskId: taskReportDetail.taskId },
                type: 1,
              }}
              setvisible={(state: any) => {
                setTaskReport(state)
              }}
            />
          )}

          {/* {工作报告详情} */}
          {reportDetailsModel.showReportDetails && (
            <ReportDetails
              param={{
                reportId: reportDetailsModel.reportId,
                isVisible: reportDetailsModel.showReportDetails,
                isMuc: 0,
              }}
              setvisible={(state: any) => {
                reportDetailsModel.showReportDetails = state
                setReportDetailsModel({ ...reportDetailsModel })
              }}
            />
          )}

          {/* 公告 */}
          {noticeVisible && (
            <NoticeDetails
              showModal={(isVisible: boolean) => setNoticeVisible(isVisible)}
              // refreshCallback={(noticeTypeId: number) => refreshDotSHow(noticeTypeId)}
            />
          )}

          {/* 会议详情 */}
          {meetDetails.meetDetailsVisible && (
            <MeetDetails
              datas={{
                queryId: meetDetails.meetId,
                meetModal: meetDetails.meetDetailsVisible,
              }}
              isVisibleDetails={(state: boolean) => {
                setMeetDetails({
                  meetDetailsVisible: state,
                })
              }}
              callback={() => {}}
            />
          )}

          {pdfInfo.preFileVisible && (
            <PdfModal
              pdfUrl={pdfInfo.preFileUrl}
              visible={pdfInfo.preFileVisible}
              setVsible={(state: boolean) => {
                setPdfInfo({ preFileVisible: state })
              }}
            />
          )}
        </div>
        {/* </Spin> */}
      </div>
      <DownLoadFileFooter fromType="mainWin" />
    </div>
  )
}

//bytes 转换成gb
const bytesToSize = (bytes: any, decimals: any = 2) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

// 判断字符串是否为空
const isEmpty = (str: any) => {
  if (typeof str == 'undefined' || str == null || str == '' || str == 'null') {
    return true
  } else {
    return false
  }
}

export default React.memo(EnterpriseClouddisk)

export const useMergeState = (initialValue: any) => {
  const [values, setValues] = useState(initialValue)
  const updateValues = useCallback(newState => {
    if (typeof newState !== 'object') {
      return console.warn('values required type is object!')
    }
    setValues((prevState: any) => Object.assign({}, prevState, newState))
  }, [])
  const forceValues = useCallback(_values => {
    setValues(_values || initialValue)
  }, [])
  return [values, updateValues, forceValues]
}
