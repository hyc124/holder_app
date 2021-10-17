/**
 * 业务数据窗口
 */
import React, { useEffect, useState, useRef, useLayoutEffect, useImperativeHandle } from 'react'
import './business-data.less'
import axios from 'axios'
import { ipcRenderer } from 'electron'
import {
  Select,
  Menu,
  Tabs,
  Table,
  message,
  Drawer,
  Input,
  Button,
  DatePicker,
  Tag,
  Checkbox,
  Dropdown,
  Spin,
  Radio,
  Row,
  Col,
  Pagination,
  Tree,
  Modal,
  InputNumber,
  Tooltip,
  Upload,
  Timeline,
} from 'antd'
import NoneData from '@/src/components/none-data/none-data'
import {
  SearchOutlined,
  CaretUpOutlined,
  PlusOutlined,
  CloseOutlined,
  UploadOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons'
import $c from 'classnames'
import { useSelector } from 'react-redux'
import moment from 'moment'
import { SelectMemberOrg } from '@/src/components/select-member-org'
import { downloadFile } from '@/src/components/download-footer/downloadFile'
import DownLoadFileFooter from '@/src/components/download-footer/download-footer'
import { RadioChangeEvent } from 'antd/lib/radio'
import WhiteBckTableData from './business-whiteBackData'
import { useMergeState } from '../chat-history/chat-history'
import { changeWordToNum, init, newToFix } from './transformRmb'
import {
  deleteBaseFormData,
  dropSort,
  getBaseFormLog,
  getBottomValue,
  getBusinessData,
  getBusinessFormDetail,
  getBusinessOrgList,
  getFormDataDetails,
  getTreeInfo,
  relationSystem,
  saveBaseFormData,
  uploadErrorData,
  followStandingBook,
  downloadFailedRecord,
} from './getData'
import TreeMenu from './treeMenu'
import StaticDetails from './details'
import { loadLocales } from '@/src/common/js/intlLocales'
import { HandleSqliteDB } from '@/src/common/js/sqlite3Db'
//数据库对象
const db = HandleSqliteDB.getInstance()
const API_HOST = process.env.API_HOST
const API_PROTOCOL = process.env.API_PROTOCOL
const { TabPane } = Tabs
const CancelToken = axios.CancelToken
const source = CancelToken.source()
const protocol = process.env.API_PROTOCOL
const host = process.env.API_HOST
const { RangePicker } = DatePicker
const { TextArea } = Input
const radioStyle = {
  display: 'block',
  height: '30px',
  lineHeight: '30px',
  fontSize: '14px',
}
//筛选参数
let filterParm: any = null
// 组合筛选
let filterCombinationValue: any = []
interface PersonProps {
  item: any
  tearmId: any
  personVal: any
  timer: any
  isdisabled: boolean
  callbackFn: (id: number, domValue: any) => void
}
interface ErrorDataProps {
  errrorData: any
  item: any
  trIndex: number
  errorList: any
}
interface ControlProps {
  data: any
  type: string
  tearmId: any
  personTearmId: any
  onRef?: any
  changeCallback?: (id: number, domValue: any, item?: any) => void
}
//填充空白行
const getNoneTableData = (headerData: any[], startIndex: number) => {
  const param: any = {}
  headerData.map((item, i) => {
    if (item.uuid) {
      param[item.uuid] = ''
    } else {
      param[item.type] = ''
    }
    param.key = startIndex + i
  })
  return param
}

//重置宽度
const revertWidth = () => {
  setTimeout(() => {
    const columns = [...$('.business-main-table').find('.ant-table-selection-column')]
    const columnWidth = columns[0]
    const w = $(columnWidth).width() || 0
    $('.business-footer-table').css({
      'padding-left': `${w + 16}px`,
    })
  }, 200)
}
//企业前缀
const orgName = ''
let defaltTypeKey = ''
//公式数据信息
let formulaInfo: any = []
/**业务数据组件 */
const BusinessData = () => {
  const { funsAuthList } = $store.getState()
  const authObj = funsAuthList?.filter((item: any) => item?.name == 'STANDING_BOOK')[0]?.auths
  //获取工作台台账基础信息
  const businessInfo = useSelector((store: StoreStates) => store.businessInfo)
  const { nowUserId } = $store.getState()
  const defaultActiveKey = businessInfo
    ? businessInfo.type === 1
      ? 'standing_book'
      : 'statistics'
    : 'standing_book'
  // 选中的tab
  const [activeKey, setActiveKey] = useState<any>(defaultActiveKey)
  // 选中的统计报表
  const [selectReportform, setSelectReportForm] = useState<any>(businessInfo)
  //业务数据企业列表
  const [businessOrgList, setBusinessOrgList] = useState<any[]>([])
  //选中企业id
  const [selOrgId, setSelOrgId] = useState<any>(businessInfo ? businessInfo.orgId : -1)
  //默认选中
  const [selelctForm, setSelectForm] = useState<any>(businessInfo)
  //业务数据表格
  const [baseFormData, setBaseFormData] = useState<any>(null)
  // 变更明细数据
  const [baseFormWhiteBackData, setBaseWhiteBackFormData] = useState<any>(null)
  const [baseFormDataTitle, setBaseFormDataTitle] = useState<any>({
    baseFormDataTitleOld: [],
    baseFormDataTitleNew: [],
  })
  // const [exportLoading, setExportLoading] = useState(false)
  const baseFormDataRef = useRef<any>(null)
  //选中视图
  const [selectTab, setSelectTab] = useState<any>({
    id: null,
    name: '',
    isDownload: false,
    isPenetrate: false,
    isImport: false,
    isDelete: false,
    isAdd: false,
    isUpdate: false,
  })
  //表格loading
  const [tableLoading, setTableLoading] = useState(false)
  //筛选控制
  const [filterObj, setFilterObj] = useState<any>({
    filteredInfo: [],
    sortedInfo: null,
    isSort: false,
  })
  //table的ref
  const mainTableRef = useRef<any>(null)
  //分页
  const pageNoRef = useRef<any>(0)
  //是否有更多
  const isScrollRef = useRef<boolean>(true)
  const inputRef: any = useRef(null)
  const [viewType, setViewType] = useState('allData')
  const [filterTitle, setFilterTitle] = useState(false)
  const refCheckBox = useRef(null)
  //页码
  const [pagination, setPagination] = useState({
    pageNo: 0,
    pageSize: 20,
    total: 0,
  })

  //树形控件参数
  const [treeInit, setTreeInit] = useMergeState({
    treeData: [],
    selectedKeys: [], //选中节点
    expandedKeys: [], //展开节点
  })
  // 变更明细筛选数据
  const [whiteBackFilterObj, setWhiteBackFilterObj] = useState<any>()
  const [whiteBackTableChange, setWhiteBackTableChange] = useState({
    refresh: 0,
    visible: true,
  })

  //选中的数据
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  //添加删除数据弹框
  const [addvsible, setAddvsible] = useState(false)
  const [delvsible, setDelvsible] = useState(false)
  const [radioValue, setRadioValue] = useState(0)
  const [checkState, setCheckState] = useState(false)
  //导入模态框
  const [importVsible, setImportVsible] = useState(false)
  const [fileObj, setFileObj] = useState<any>(null)
  const uploadRef = useRef(null)
  let listRef: any = useRef(null)
  const [importFile, setImportFile] = useState<any>(null)
  //上传容器
  const [uploadMain, setUploadMain] = useState(true)
  //上传loading...
  const [uploadLoading, setUploadLoading] = useState(false)
  //上传进度条
  const [uploadProgress, setUploadProgress] = useState(false)
  //上传成功提示框
  const [uploadSuccess, setUploadSuccess] = useState(false)
  //失败记录
  const [uploadFailed, setUploadFailed] = useState(false)
  const [errorData, setErrorData] = useState({
    errorDatas: [],
    errorRecord: 0,
    succeedRecord: 0,
    viewTitleModels: [],
  })
  //添加数据控件信息
  const [controlData, setControlData] = useState([])
  //数据控件详情回显
  const [controlDetileData, setControlDetileData] = useState([])
  //日志
  const [formLogData, setFormLogData] = useState([])
  //工作台台账
  useEffect(() => {
    pageNoRef.current = 0
    getBusinessOrgList()
      .then(dataList => {
        setBusinessOrgList(dataList)
        if (businessInfo) {
          const { orgId, baseFormName, baseFormId, groupId, logo, type } = businessInfo
          // setSelectForm(businessInfo)
          setSelOrgId(businessInfo.orgId)
          pageNoRef.current = 0
          isScrollRef.current = true
          setSelectForm({
            baseFormId: baseFormId,
            baseFormName: baseFormName,
            orgId: orgId,
            logo: logo ? logo : 'icon_05.png',
            type: type,
          })
          paramsClear()
          //选中树结构中对应得表单
          const typeKey = orgId + '-' + groupId
          const formKey = orgId + '-' + groupId + '-' + baseFormId
          defaltTypeKey = typeKey
          setTreeInit({ selectedKeys: [formKey] })
        } else {
          setSelOrgId(dataList[0].orgId)
        }
      })
      .catch(err => {
        message.error(err.returnMessage)
      })
  }, [businessInfo])

  const queryTreeInfo = (keyword: string, isSerch: boolean) => {
    getTreeInfo(keyword)
      .then((res: any) => {
        if (res.returnCode === 0) {
          setTreeInit({ treeData: res.data })
          getCompanyKeys(res.data, keyword, isSerch)
          // 创建本地缓存字段
          db.exec(
            'CREATE TABLE if not exists base_form_data (id integer primary key autoincrement, userId, baseFormId, field)'
          )
        }
      })
      .catch(err => {
        message.error(err.returnMessage)
      })
  }
  //初始化加载树
  useEffect(() => {
    if (activeKey === 'standing_book') {
      queryTreeInfo('', false)
    }
  }, [activeKey])

  useEffect(() => {
    document.title = '台账'
    $(window).resize(function() {
      revertWidth()
    })
  }, [])

  //请求业务数据
  useEffect(() => {
    queryTanbleData()
  }, [selelctForm])

  const queryTanbleData = () => {
    setSelectedRowKeys([])
    if (selelctForm !== null && businessOrgList.length !== 0) {
      setTableLoading(true)
      getBusinessData(selelctForm.baseFormId, pagination)
        .then(resData => {
          //默认展示第一个视图
          setViewType('allData')
          setSelectTab({
            ...selectTab,
            isPenetrate: resData.penetrate,
            isDownload: resData.download,
            isImport: resData.import,
            isDelete: resData.delete,
            isAdd: resData.add,
            isUpdate: resData.update,
          })
          setPagination({ ...pagination, total: resData.totalElements })
          let _newArr: any = []
          if (resData.viewTitleModels && resData.viewTitleModels.length > 0) {
            _newArr = resData.viewTitleModels.map((item: any, i: number) => {
              return {
                ...item,
                isCkecked: true,
                position: i,
              }
            })
            // setBaseFormDataTitle({ baseFormDataTitleOld: _newArr, baseFormDataTitleNew: _newArr })
          }
          revertWidth()
          const _data = {
            userId: nowUserId,
            baseFormId: selelctForm.baseFormId,
            field: [],
          }
          let _compareArr: any = []
          findLocalBaseFormMsg().then((localRes: any) => {
            if (!localRes) {
              // 当本地数据库不存在数据时，存入当前数据
              inserteLocalLoginMsg(_data)
              setBaseFormDataTitle({ baseFormDataTitleOld: _newArr, baseFormDataTitleNew: _newArr })
              setBaseFormData({ ...resData })
            } else {
              // 当本地数据库存在数据时，将当前数据与本地数据库数据对比
              const _datas: any = hasIn(localRes, selelctForm.baseFormId)
              if (_datas.isIn) {
                const _arr = JSON.parse(_datas.datas.field)
                _compareArr = compareArr(_newArr, _arr)
              } else {
                inserteLocalLoginMsg(_data)
              }
              setBaseFormDataTitle({ baseFormDataTitleOld: _newArr, baseFormDataTitleNew: _compareArr })
              setBaseFormData({ ...resData, viewTitleModels: _compareArr })
            }
          })
        })
        .finally(() => {
          setTableLoading(false)
        })
    }
  }

  //请求分页业务数据
  useEffect(() => {
    if (selelctForm !== null && businessOrgList.length !== 0) {
      setTableLoading(true)
      getBusinessData(selelctForm.baseFormId, pagination, selectTab.id, filterCombinationValue)
        .then(resData => {
          //默认展示第一个视图
          setViewType('allData')
          setSelectTab({
            ...selectTab,
            isPenetrate: resData.penetrate,
            isDownload: resData.download,
            isImport: resData.import,
            isDelete: resData.delete,
            isAdd: resData.add,
            isUpdate: resData.update,
          })
          // setBaseFormData(resData)
          setPagination({ ...pagination, total: resData.totalElements })
          let _newArr: any = []
          if (resData.viewTitleModels.length > 0) {
            _newArr = resData.viewTitleModels.map((item: any, i: number) => {
              return {
                ...item,
                position: i,
              }
            })
            // setBaseFormDataTitle({ baseFormDataTitleOld: _newArr, baseFormDataTitleNew: _newArr })
          }
          revertWidth()
          let _compareArr: any = []
          findLocalBaseFormMsg().then((localRes: any) => {
            if (localRes) {
              // 当本地数据库存在数据时，将当前数据与本地数据库数据对比
              const _datas: any = hasIn(localRes, selelctForm.baseFormId)
              // if (_datas.isIn) {
              const _arr = JSON.parse(_datas.datas.field)
              _compareArr = compareArr(_newArr, _arr)
              setBaseFormDataTitle({ baseFormDataTitleOld: _newArr, baseFormDataTitleNew: _compareArr })
              setBaseFormData({ ...resData, viewTitleModels: _compareArr })
              // }
            }
          })
        })
        .finally(() => {
          setTableLoading(false)
        })
    }
  }, [pagination.pageNo, pagination.pageSize])

  useEffect(() => {
    baseFormDataRef.current = baseFormData
    if (baseFormData && baseFormData.baseFormDataMap && baseFormData.baseFormDataMap.length < 20) {
      isScrollRef.current = false
    }
  }, [baseFormData])

  //筛选
  useEffect(() => {
    if (filterObj.filteredInfo.length == 0 && !filterObj.sortedInfo && !filterObj.clearFilters) {
      filterParm = null
      return
    }
    let _customFilterParam = []
    if (filterObj.filteredInfo.length > 0) {
      _customFilterParam = filterObj.filteredInfo.map((item: any) => {
        const param: any = {}
        param.type = item.type
        if (item.type === 'apply_person_dept') {
          param.contain = item.contain
          const valueArr = item.filterArr.map((item: { deptId: any }) => {
            return item.deptId
          })
          param.value = valueArr.join(',')
        } else if (item.type === 'apply_person') {
          param.contain = item.contain
          const valueArr = item.filterArr.map((item: { userId: any }) => {
            return item.userId
          })
          param.value = valueArr.join(',')
        } else if (item.type === 'form_serial_number' || item.type === 'back_form_name') {
          param.contain = item.contain
          param.value = item.value
        } else if (item.type === 'create_time') {
          param.value = item.value
        } else {
          param.contain = item.contain
          param.value = item.value
          param.uuid = item.uuid
        }
        return param
      })
    }
    //排序
    if (filterObj.sortedInfo) {
      const param: any = {
        uuid: filterObj.sortedInfo.field,
      }
      if (filterObj.sortedInfo.order === 'ascend') {
        //升序
        param.sort = 1
        param.type = filterObj.sortedInfo.column.type
      } else if (filterObj.sortedInfo.order === 'descend') {
        //降序
        param.sort = 2
        param.type = filterObj.sortedInfo.column.type
      }
      const _test = filterAssemble(param, _customFilterParam, filterObj.sortedInfo)
      if (_test.isIn) {
        // 如果筛选数组中有则替换
        _customFilterParam[_test.index] = param
      } else {
        // 如果筛选数组中没有则添加
        _customFilterParam.push(param)
      }
    }
    setTableLoading(true)
    filterCombinationValue = _customFilterParam
    // filterParm = null
    getBusinessData(
      selelctForm.baseFormId,
      filterObj.clearFilters ? pagination : 0, //重置则按之前的页码查询
      selectTab.id,
      _customFilterParam
    )
      .then(resData => {
        // setBaseFormData(resData)
        setPagination({ ...pagination, total: resData.totalElements })
        let _newArr: any = []
        if (resData.viewTitleModels && resData.viewTitleModels.length > 0) {
          _newArr = resData.viewTitleModels.map((item: any, i: number) => {
            return {
              ...item,
              position: i,
            }
          })
          // setBaseFormDataTitle({ baseFormDataTitleOld: _newArr, baseFormDataTitleNew: _newArr })
        }
        revertWidth()
        let _compareArr: any = []
        findLocalBaseFormMsg().then((localRes: any) => {
          if (localRes) {
            // 当本地数据库存在数据时，将当前数据与本地数据库数据对比
            const _datas: any = hasIn(localRes, selelctForm.baseFormId)
            // if (_datas.isIn) {
            const _arr = JSON.parse(_datas.datas.field)
            _compareArr = compareArr(_newArr, _arr)
            setBaseFormDataTitle({ baseFormDataTitleOld: _newArr, baseFormDataTitleNew: _compareArr })
            setBaseFormData({ ...resData, viewTitleModels: _compareArr })
            // }
          }
        })
      })
      .finally(() => {
        setTableLoading(false)
      })
  }, [filterObj])

  //表格筛选
  const tableChangeEvent = (
    _pagination: any,
    _filters: any,
    sorter: any,
    extra: { currentDataSource: any; action: string }
  ) => {
    if (extra.action === 'sort') {
      setFilterObj({
        ...filterObj,
        sortedInfo: sorter,
        isSort: true,
        clearFilters: false,
      })
    }
  }

  //处理自定义筛选
  const setCustomFilter = (selectVals: any, clearFilters?: any) => {
    const _newArr = filterObj.filteredInfo
    const _isFilter = filterAssemble(selectVals[0], filterObj.filteredInfo, filterObj.sortedInfo, clearFilters)
    if (clearFilters) {
      // 重置筛选数组中当前项
      if (_isFilter.isIn) {
        _newArr.splice(_isFilter.index, 1)
      }
    } else {
      // 添加
      if (_newArr.length === 0) {
        _newArr.push(selectVals[0])
      } else {
        if (_isFilter.isIn) {
          // 如果筛选数组中有则替换
          _newArr[_isFilter.index] = selectVals[0]
        } else {
          // 如果筛选数组中没有则添加
          _newArr.push(selectVals[0])
        }
      }
    }

    setFilterObj({
      filteredInfo: _newArr,
      isSort: false,
      sortedInfo: _isFilter.delSor ? null : filterObj.sortedInfo,
      clearFilters: clearFilters ? true : false,
    })
  }

  //滚动加载更多
  useLayoutEffect(() => {
    if (mainTableRef.current) {
      const tableList = Array.from(mainTableRef.current.querySelectorAll('.ant-table-body'))
      const handleTableScroll = (e: { currentTarget: any }) => {
        const current = e.currentTarget
        tableList.forEach((table: any) => {
          if (table !== current && table.scrollLeft !== current.scrollLeft) {
            table.scrollLeft = current.scrollLeft
          }
        })
      }
      tableList.forEach((table: any) => {
        table.addEventListener('scroll', handleTableScroll)
      })
      //垂直滚动加载
      const tableBody = mainTableRef.current.querySelector('.business-main-table .ant-table-body')
      let _scrollTop = 0 //保存上次滚动距离
      let isRun = false //是否执行查询
      if (tableBody) {
        $(tableBody)
          .off('scroll')
          .on('scroll', async () => {
            if (tableBody.scrollTop === 0) {
              _scrollTop = 0
            }
            // 上一次滚动高度与当前滚动高度不同则是纵向滚动
            if (_scrollTop != tableBody.scrollTop) {
              //是否滑动到距离底部40px的位置
              const scorll = _scrollTop >= tableBody.scrollHeight - tableBody.clientHeight - 40
              //isRun为true时 代表已经执行查询
              if (isRun && scorll) {
                return
              }
              //_scrollTop < tableBody.scrollTop 判断是否向下滑动
              isRun = _scrollTop < tableBody.scrollTop && scorll
              //保存当前滚动位置
              _scrollTop = tableBody.scrollTop
              if (isRun && isScrollRef.current) {
                setTableLoading(true)
                pageNoRef.current += 1
                let param: any = null
                if (filterObj.sortedInfo && filterObj.sortedInfo.order) {
                  param = {
                    uuid: filterObj.sortedInfo.field,
                  }
                  if (filterObj.sortedInfo.order === 'ascend') {
                    //升序
                    param.sort = 1
                    param.type = filterObj.sortedInfo.column.type
                  } else if (filterObj.sortedInfo.order === 'descend') {
                    //降序
                    param.sort = 2
                    param.type = filterObj.sortedInfo.column.type
                  }
                }
                setTableLoading(false)
              }
            }
          })
      }
      return () => {
        tableList.forEach((table: any) => {
          table.removeEventListener('scroll', handleTableScroll)
        })
      }
    }
  })

  //导出业务底表
  const putOutTable = (viewType: string) => {
    // setExportLoading(true)
    const param: any = {
      baseFormId: selelctForm.baseFormId,
      viewId: selectTab.id,
    }
    if (viewType == 'whiteBack') {
      param.screenModels = whiteBackFilterObj?.data
    } else {
      param.dataScreenModels = filterCombinationValue
    }
    const { loginToken, nowUserId, nowAccount } = $store.getState()
    if (viewType == 'whiteBack') {
      param.pageNo = 0
      param.pageSize = whiteBackFilterObj?.pagination.total
    }
    param.userAccount = nowAccount
    param.userId = nowUserId
    const _url = viewType != 'whiteBack' ? '/approval/exportBaseFormViewData' : '/approval/exportBackWaiteLog'

    $api
      .request(_url, param, {
        headers: {
          loginToken: loginToken,
          'Content-Type': 'application/json',
        },
      })
      .then(res => {
        const resData = res.data
        if (!resData) {
          message.error('暂无数据可导出')
        } else {
          const ext = resData.fileKey
            .toLowerCase()
            .split('.')
            .splice(-1)[0]
          downloadFile({
            url: 'exportBaseFormReport',
            fileName: resData.fileName + '.' + ext,
            fileKey: resData.fileKey,
            dir: resData.dir,
            fileSize: resData.fileSize,
            fromType: 'businessData',
          })
        }
      })
      .finally(() => {
        // setExportLoading(false)
      })
      .catch(err => {
        message.error(err.returnMessage)
      })
  }
  // 总台账——变更明细切换
  const changeDetailsView = (val: any) => {
    const _type = val
    setViewType(val)
    if (_type === 'allData') {
      setFilterObj({
        filteredInfo: [],
        sortedInfo: null,
        isSort: false,
        clearFilters: true,
      })
      setWhiteBackTableChange({
        ...whiteBackTableChange,
        visible: false,
      })
      setTableLoading(true)
      getBusinessData(selelctForm.baseFormId, 0, selectTab.id)
        .then(resData => {
          // setBaseFormData(resData)
          setPagination({ ...pagination, total: resData.totalElements })
          let _newArr: any = []
          if (resData.viewTitleModels && resData.viewTitleModels.length > 0) {
            _newArr = resData.viewTitleModels.map((item: any, i: number) => {
              return {
                ...item,
                position: i,
              }
            })
            setBaseFormDataTitle({ baseFormDataTitleOld: _newArr, baseFormDataTitleNew: _newArr })
          }
          revertWidth()
          let _compareArr: any = []
          findLocalBaseFormMsg().then((localRes: any) => {
            if (localRes) {
              // 当本地数据库存在数据时，将当前数据与本地数据库数据对比
              const _datas: any = hasIn(localRes, selelctForm.baseFormId)
              // if (_datas.isIn) {
              const _arr = JSON.parse(_datas.datas.field)
              _compareArr = compareArr(_newArr, _arr)
              setBaseFormDataTitle({ baseFormDataTitleOld: _newArr, baseFormDataTitleNew: _compareArr })
              setBaseFormData({ ...resData, viewTitleModels: _compareArr })
              // }
            }
          })
        })
        .finally(() => {
          setTableLoading(false)
        })
    } else if (_type === 'whiteBack') {
      whiteBackTableChange.refresh++
      setWhiteBackTableChange({
        ...whiteBackTableChange,
        visible: true,
      })
      // 变更明细
    }
  }
  const operations = (
    <div className="dataMenu-btnBox">
      {selelctForm !== null && businessOrgList.length !== 0 && (
        <div className="view_tab">
          <div style={{ width: '164px' }}>
            <Radio.Group
              style={{ width: 'inherit' }}
              value={viewType}
              onChange={e => {
                changeDetailsView(e.target.value)
              }}
            >
              <Radio.Button value="allData" className="allData">
                台账
              </Radio.Button>
              <Radio.Button value="whiteBack" className="whiteBackData">
                变更明细
                <Tooltip className="ask" title="变更明细为台账与审批表单关联后，通过审批回写到台账的数据明细">
                  <QuestionCircleOutlined />
                </Tooltip>
              </Radio.Button>
            </Radio.Group>
          </div>
          <div style={{ flex: '1', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
            <Tooltip title="刷新">
              <span
                className="optionRefresh"
                onClick={() => {
                  if (viewType === 'allData') {
                    filterCombinationValue = [] //刷新需要清楚筛选条件
                    setSelectedRowKeys([])
                    setBaseFormData(null)
                  }
                  changeDetailsView(viewType)
                }}
              ></span>
            </Tooltip>

            {selectTab.isDelete && viewType === 'allData' && (
              <Tooltip title="删除数据">
                <span
                  className="optionDel"
                  onClick={() => {
                    if (!baseFormData.baseFormDataMap) {
                      return message.error('暂无可操作的数据')
                    }
                    setDelvsible(true)
                    setRadioValue(0)
                  }}
                ></span>
              </Tooltip>
            )}
            {selectTab.isAdd && viewType === 'allData' && (
              <div className="optionBtn add_btn" onClick={() => queryControlData()}>
                <span></span>添加数据
              </div>
            )}

            {selectTab.isImport && viewType === 'allData' && (
              <div className="optionBtn defaltBtn import_btn" onClick={() => importBusiness()}>
                <span></span>导入
              </div>
            )}
            {selectTab.isDownload && (
              <div className="optionBtn defaltBtn export_btn" onClick={() => putOutTable(viewType)}>
                <span></span>导出
              </div>
            )}
            {viewType === 'allData' && (
              <div className="optionBtn defaltBtn field_btn" onClick={() => setFilterTitle(!filterTitle)}>
                <span></span>字段显示
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )

  useLayoutEffect(() => {
    //点击空白处
    jQuery('.business-data-container')
      .off()
      .click(function(e: any) {
        const _con = jQuery('.checkBox_box:visible,.filterData') // 设置目标区域
        if (!_con.is(e.target) && _con.has(e.target).length === 0) {
          setFilterTitle(false)
        }
      })
  }, [refCheckBox.current])

  //查询控件数据
  const queryControlData = () => {
    formulaInfo = []
    relationSystem(selelctForm.baseFormId)
      .then(() => {
        getBusinessFormDetail(selelctForm.baseFormId)
          .then((data: any) => {
            const formData = data.data.baseFormElementModels || []
            //=========添加属性==============================
            const newFormData = formData.map((item: any) => {
              return {
                ...item,
                contentVal: '',
              }
            })
            setControlData(newFormData)
            //=======================================
            setAddvsible(true)
          })
          .catch(err => {
            message.error(err.returnMessage)
          })
      })
      .catch(err => {
        message.error(err.returnMessage)
      })
  }

  //查询底表数据详情
  const queryFormDataDetails = (id: any) => {
    getFormDataDetails(id).then((data: any) => {
      //渲染底表详情
      formulaInfo = []
      const dataList = data.data || []
      //=========添加属性==============================
      dataList.map((item: any) => {
        item.logcontentVal = item.fillValue
      })
      setControlDetileData(dataList)
    })
  }
  //查询底表数据操作记录
  const queryBaseFormLog = (id: any) => {
    getBaseFormLog(id).then((data: any) => {
      const dataList = data.data || []
      setFormLogData(dataList)
    })
  }
  //导入
  const importBusiness = () => {
    setUploadProgress(false)
    setUploadSuccess(false)
    setUploadFailed(false)
    setUploadMain(true)
    relationSystem(selelctForm.baseFormId)
      .then(() => {
        // findBaseFormDataTemplate(selelctForm.baseFormId)
        //   .then((data: any) => {
        //     setImportVsible(true)
        //     setFileObj(null)
        //     const { fileKey, dir, fileName, fileSize, ext } = data.data
        //     getPictureUrl({
        //       fileName: fileKey,
        //       dir: dir,
        //     }).then(() => {
        //       setImportFile({
        //         fileKey: fileKey,
        //         dir: dir,
        //         fileName: fileName,
        //         fileSize: fileSize,
        //         ext: ext,
        //       })
        //     })
        //   })
        //   .catch(err => {
        //     message.error(err.returnMessage)
        //   })
        setImportVsible(true)
        setFileObj(null)
        setImportFile({
          fileKey: '',
          dir: '',
          fileName: revertFileName(selelctForm.baseFormName),
          fileSize: 0,
          ext: '',
        })
      })
      .catch(err => {
        message.error(err.returnMessage)
      })
  }
  const filterDatas = (fdatas: any) => {
    if (viewType === 'whiteBack') {
      setBaseWhiteBackFormData({ ...baseFormWhiteBackData, viewTitleModels: fdatas.viewTitleModels })
    } else {
      setBaseFormData({ ...baseFormData, viewTitleModels: fdatas.viewTitleModels })
    }
    revertWidth()
    setBaseFormDataTitle({ ...baseFormDataTitle, baseFormDataTitleNew: fdatas.viewTitleModels })
  }
  // 变更明细筛选数据
  const WhiteBckFilterDatas = (datas: any) => {
    setWhiteBackFilterObj(datas)
  }
  // 变更明细数据
  const getWhiteBackDatas = (datas: any) => {
    setBaseFormDataTitle({
      baseFormDataTitleOld: datas.viewTitleModels,
      baseFormDataTitleNew: datas.viewTitleModels,
    })
  }

  /**
   * 选中树节点时
   */
  const onSelect = (selectedKeys: any, e: { selected: boolean; selectedNodes: any; node: any; event: any }) => {
    filterCombinationValue = [] //刷新需要清楚筛选条件
    const thisRow = e.node
    // 更新当前选择企业id
    if (thisRow?.orgId != selOrgId) {
      setSelOrgId(thisRow?.orgId)
    }
    setTreeInit({ selectedKeys: [thisRow.key] })
    if (!thisRow.hasChild && thisRow.hasOwnProperty('id')) {
      pageNoRef.current = 0
      isScrollRef.current = true
      setSelectForm({
        baseFormId: thisRow.id,
        baseFormName: thisRow.title,
        orgId: thisRow.orgId,
        logo: thisRow.logo,
        type: 1,
      })
      paramsClear()
    }
  }
  const paramsClear = () => {
    setFilterObj({
      filteredInfo: [],
      sortedInfo: null,
      isSort: false,
      clearFilters: false,
    })
    setPagination({
      pageNo: 0,
      pageSize: 20,
      total: 0,
    })
  }
  // 展开指定的树节点
  const onExpand = (expandedKeys: any) => {
    const getExpandedKeys = expandedKeys
    setTreeInit({ expandedKeys: getExpandedKeys })
  }
  const onDrop = (info: any) => {
    const { node, dragNode } = info
    const dropKey = node.key
    const dragKey = dragNode.key
    const dropPos = info.node.pos.split('-')
    const dropPosition = info.dropPosition - Number(dropPos[dropPos.length - 1])
    const dropKeys = dropKey.split('-')
    const dragKeys = dragKey.split('-')
    let optionType = 0
    // 不允许拖动企业排序、拖动分组/报表不允许跨企业
    if (dragKeys[0] !== dropKeys[0] || info.dropPosition === -1) {
      return false
    }
    // 不允许分组向下拖动
    if (dropKeys.length === 3 && dragKeys.length === 2) {
      return
    }
    if (dragKeys.length === 2 && !info.dropToGap) {
      optionType = 2
      if (dropKeys.length !== 1) {
        return
      }
    }
    if (dragKeys.length === 3) {
      optionType = 1
      if (dropKeys.length === 1) {
        return
      }
      if (dropKeys.length === 3 || dropKeys.length === 2) {
        if (dragKeys[1] !== dropKeys[1]) {
          return
        }
      }
    }

    const loop = (data: any, key: any, callback: any) => {
      for (let i = 0; i < data.length; i++) {
        if (data[i].key === key) {
          return callback(data[i], i, data)
        }
        if (data[i].children) {
          loop(data[i].children, key, callback)
        }
      }
    }
    const data = [...treeInit.treeData]
    let dragObj: any
    loop(data, dragKey, (item: any, index: any, arr: any) => {
      arr.splice(index, 1)
      dragObj = item
    })
    if (!info.dropToGap) {
      loop(data, dropKey, (item: any) => {
        item.children = item.children || []
        // 添加到头部，可以是随意位置
        item.children.unshift(dragObj)
      })
    } else if (
      (info.node.props.children || []).length > 0 && // Has children
      info.node.props.expanded && // Is expanded
      dropPosition === 1 // On the bottom gap
    ) {
      loop(data, dropKey, (item: any) => {
        item.children = item.children || []
        // 添加到头部，可以是随意位置
        item.children.unshift(dragObj)
      })
    } else {
      let ar: any
      let i: any
      loop(data, dropKey, (item: any, index: any, arr: any) => {
        ar = arr
        i = index
      })
      if (dropPosition === -1) {
        ar.splice(i, 0, dragObj)
      } else {
        ar.splice(i + 1, 0, dragObj)
      }
    }
    //调取接口
    const sortParam: any = {
      userId: $store.getState().nowUserId,
      groupModels: getNewSortData(data),
    }
    dropSort(sortParam)
      .then((res: any) => {
        if (res.returnCode === 0) {
          setTreeInit({ treeData: data })
          message.success(`${optionType === 1 ? '表单' : '分组'}排序成功`)
        }
      })
      .catch(() => {
        queryTreeInfo('', false)
      })
  }
  const getNewSortData = (arr: Array<any>) => {
    const modules: any = []
    arr.forEach((item: any) => {
      //存在分组
      if (item.children && item.children.length > 0) {
        const groups = item.children
        for (let i = 0; i < groups.length; i++) {
          const groupItem = groups[i]
          modules.push({
            groupId: groupItem.groupId,
            formIds: getFormInfo(groups[i].children),
          })
        }
      }
    })
    return modules
  }
  const getFormInfo = (arr: Array<any>) => {
    const formIds: any = []
    if (arr.length > 0) {
      arr.forEach((item: any) => {
        const _formId = item.id
        formIds.push(_formId)
      })
    }
    return formIds
  }
  const needexpandKey = (item: any) => {
    //企业一级
    if (!item.hasOwnProperty('groupId') && !item.hasOwnProperty('id')) {
      return `${item.orgId}`
    }
    //表单
    if (item.hasOwnProperty('id') && item.hasOwnProperty('groupId')) {
      return item.orgId + '-' + item.groupId + '-' + item.id
    }
    //分组
    if (item.hasOwnProperty('groupId') && !item.hasOwnProperty('id')) {
      return item.orgId + '-' + item.groupId
    }
  }
  //默认展开的企业节点
  const getCompanyKeys = (arr: any, keyword: string, isSerch: boolean) => {
    const keys: any = []
    arr.map((item: any, i: number) => {
      keys.push(needexpandKey(item))
      //如果是搜索出的树结构 需要展开所有节点
      if (keyword !== '' && isSerch) {
        if (item.children.length !== 0) {
          const childrenArr = item.children
          childrenArr.map((_item: any, _i: number) => {
            keys.push(needexpandKey(_item))
          })
        }
      }
      //从台账总入口进来展开第一个企业第一个分组
      if (!isSerch && i === 0) {
        if (item.children.length !== 0) {
          keys.push(needexpandKey(item.children[0]))
        }
      }
    })
    keys.push(defaltTypeKey)
    setTreeInit({ expandedKeys: keys })
  }
  const handleTreeData = (arr: any) => {
    return arr.map((item: any) => {
      let itemTitle: any = item.title
      if (!item.hasOwnProperty('groupId') && !item.hasOwnProperty('id')) {
        //企业一级
        item.key = `${item.orgId}`
        item.switcherIcon = <span className="org_icon"></span>
        itemTitle = (
          <span className="org_info">
            <span className="org_info_title">{item.title}</span>
            <span
              className="org_info_mask"
              onClick={() => {
                const thisKey = item.key
                const index = treeInit.expandedKeys.indexOf(thisKey)
                const nowExpandKeys = treeInit.expandedKeys
                if (index == -1) {
                  nowExpandKeys.push(thisKey)
                } else {
                  nowExpandKeys.splice(index, 1)
                }
                // 更新当前选择企业id
                if (thisKey != selOrgId) {
                  setSelOrgId(thisKey)
                }

                setTreeInit({ expandedKeys: nowExpandKeys })
              }}
            ></span>
          </span>
        )
      }
      if (item.hasOwnProperty('id') && item.hasOwnProperty('groupId')) {
        //表单
        item.key = item.orgId + '-' + item.groupId + '-' + item.id
        const src = $tools.asAssetsPath(`/images/approval/${item.logo ? item.logo : 'icon_05.png'}`)
        item.switcherIcon = <img className="form_item_icon" src={src} />
      }
      if (item.hasOwnProperty('groupId') && !item.hasOwnProperty('id')) {
        item.key = item.orgId + '-' + item.groupId
      }
      if ((item.children && item.children.length > 0) || item.hasChild) {
        item.hasChild = true
        return {
          ...item,
          title: itemTitle,
          children: handleTreeData(item.children),
        }
      } else {
        item.hasChild = false
        return {
          ...item,
          title: itemTitle,
        }
      }
    })
  }

  //删除错误数据
  const delErrorItem = (num: number) => {
    const errArr = [...errorData.errorDatas]
    for (let i = errArr.length - 1; i >= 0; i--) {
      if (i === num) {
        errArr.splice(i, 1)
        break
      }
    }
    setErrorData({
      ...errorData,
      errorDatas: errArr,
    })
  }
  //下载失败记录
  const downloadErrorExecl = () => {
    const contentsTitle: any = []
    const allContent: any = []
    const contentstext: any = []
    const errInfoTxt: any = []
    const ths = [...$('.edtitable thead th')]
    for (let i = 0; i < ths.length; i++) {
      contentsTitle.push($(ths[i]).attr('data-id'))
      contentstext.push($(ths[i]).text())
    }

    allContent.push(contentsTitle)
    allContent.push(contentstext)

    const trs = [...$('.edtitable tbody tr')]
    trs.forEach((item: any) => {
      const contentValue: any = []
      const tds = [...$(item).children('td')]
      tds.forEach((_item: any) => {
        const txt = $(_item)
          .children('span')
          .text()
        const errTxt = $(_item)
          .find('span')
          .attr('data-errTip')

        !txt ? contentValue.push('') : contentValue.push(txt)
        !errTxt ? errInfoTxt.push('') : errInfoTxt.push(errTxt)
      })
      allContent.push(contentValue)
      allContent.push(errInfoTxt)
    })

    console.log(allContent)

    downLoadErrorData({
      fileName: importFile.fileName,
      contents: allContent,
    })

    // downloadFailedRecord()
    return
    // const param = {
    //   contents: allContent,
    //   fileName: importFile.fileName,
    //   length: ths.length,
    // }
    // downloadFile({
    //   url: '',
    //   fileName: revertFileName(importFile.fileName, '失败记录'),
    //   fileKey: '',
    //   dir: '',
    //   fileSize: 0,
    //   fromType: 'businessData',
    //   customOption: {
    //     type: 'businessError',
    //     url: `${API_PROTOCOL}${API_HOST}/approval/downloadErrorLog`,
    //     params: param,
    //   },
    // })
  }

  const downLoadErrorData = (params: any) => {
    const { fileName, contents } = params
    const arr = new Array(contents[0].length)
    const dataParams = {
      fileName: fileName,
      isRed: 1,
      titlesStr: contents[0].join(','),
      contentsStr: contents[1].join(',') + '###',
      errorInfosStr: arr.join(',') + '###',
    }
    for (let i = 2; i < contents.length; i++) {
      const item = contents[i].join(',')
      if (i % 2 === 0) {
        dataParams.contentsStr += item + '###'
      } else {
        dataParams.errorInfosStr += item + '###'
      }
    }
    dataParams.contentsStr += arr.join(',')
    dataParams.errorInfosStr += arr.join(',')

    console.log(dataParams)

    downloadFailedRecord(dataParams)
      .then((res: any) => {
        console.log(res)
        if (res && res.data) {
          const { fileKey, dir } = res.data
          const $name = fileName.toLowerCase().split('.')[0]
          const fileSuffix = fileName
            .toLowerCase()
            .split('.')
            .splice(-1)[0]
          console.log(fileSuffix)
          downloadFile({
            url: 'exportBaseFormReport',
            fileName: `${$name}失败记录.${fileSuffix}`,
            fileKey: fileKey,
            dir: dir,
            fileSize: 0,
            fromType: 'businessData',
          })
        } else {
          message.error(res.returnMessage)
        }
      })
      .catch(err => {
        message.error(err.returnMessage)
      })
  }

  //重新上传失败记录
  const uploadAgain = () => {
    const contentsTitle: any = []
    const allContent: any = []
    errorData.viewTitleModels.map((item: any) => {
      contentsTitle.push(item.uuid)
    })
    const trs = [...$('.edtitable tbody tr')]
    if (trs.length == 0) {
      message.error('暂无可操作的数据!')
      return
    }
    trs.forEach((item: any) => {
      const contentObj = {}
      const tds = [...$(item).children('td')]
      tds.forEach((its: any) => {
        const attrId: any = $(its)
          .children('span')
          .attr('data-id')
        const spanTxt = $(its)
          .children('span')
          .text()
        if (!spanTxt) {
          contentObj[attrId] = ''
        } else {
          contentObj[attrId] = spanTxt
        }
      })
      allContent.push(contentObj)
    })
    const param = {
      contents: allContent,
      baseFormId: selelctForm.baseFormId,
      titleUuids: contentsTitle,
      userId: $store.getState().nowUserId,
    }
    //伪造进度条
    const fileSize: any = fileObj.size
    const _baseCount: any = 300 / fileSize
    const baseCount: any = parseFloat(_baseCount)
    let nowCount: any = baseCount
    const timer = setInterval(() => {
      if (nowCount > 0.9) {
        clearInterval(timer)
      }
      $('.impot_module_wrap .progress_inbar').css({
        width: nowCount * 100 + '%',
      })
      const $nowCount: any = nowCount * 100
      $('.impot_module_wrap .progress_word').html(parseFloat($nowCount).toFixed(2) + '%')
      nowCount += baseCount
    }, 100)
    setUploadLoading(true)
    uploadErrorData(param)
      .then((res: any) => {
        setUploadLoading(false)
        if (res.returnCode === 0) {
          handelUplodData(res.data, timer, nowCount)
          setTimeout(() => {
            const errorTips = [...$('.edtitable').find('.errorTip')]
            errorTips.forEach((item: any) => {
              if (!$(item).hasClass('error')) {
                $(item).addClass('error')
              }
            })
          }, 100)
        } else {
          message.error(res.returnMessage)
        }
      })
      .catch(err => {
        message.error(err.returnMessage)
      })
      .finally(() => {
        setUploadLoading(false)
      })
  }
  //上传后的数据处理
  const handelUplodData = (data: any, timer: any, nowCount: any) => {
    // const { errorRecord, errorDatas, succeedRecord, viewTitleModels } = data
    $('.impot_module_wrap .progress_inbar').css('width', 0)
    $('.impot_module_wrap .progress_word').html('0%')
    setUploadProgress(true)
    clearInterval(timer)
    $('.impot_module_wrap .progress_inbar').animate({ width: '100%' }, 500)
    //数值动态变化
    const target = $('.impot_module_wrap .progress_word')
    $({ someValue: nowCount }).animate(
      { someValue: 100 },
      {
        duration: 500,
        step: function() {
          target.html(parseFloat(this.someValue).toFixed(2) + '%')
        },
      }
    )
    setTimeout(() => {
      $('.impot_module_wrap .upload_progress_box').hide()
      setUploadProgress(false)
      //处理返回数据
      if (data.errorRecord == 0) {
        //全部导入成功
        message.success('导入成功')
        setUploadFailed(false)
        setUploadMain(false)
        $('.impot_module_wrap .uploadSuccess .sucess_box')
          .find('em')
          .text(`数据导入完成，已成功导入${data.succeedRecord}条数据`)
        setUploadSuccess(true)
        queryTanbleData() //刷新列表
        setErrorData({
          ...errorData,
          succeedRecord: data.succeedRecord,
        })
      } else {
        //部分导入失败
        // const errData: any = [...errorDatas]
        setUploadMain(false)
        setUploadSuccess(false)
        setUploadFailed(true)
        setErrorData({
          ...errorData,
          errorDatas: [],
        })
        setErrorData({
          errorDatas: data.errorDatas,
          errorRecord: data.errorRecord,
          succeedRecord: data.succeedRecord,
          viewTitleModels: data.viewTitleModels,
        })
      }
      setUploadLoading(false)
    }, 1000)
  }
  //确定上传
  const uploadSubmit = () => {
    if (fileObj) {
      //伪造进度条
      const fileSize: any = fileObj.size
      const _baseCount: any = 300 / fileSize
      const baseCount: any = parseFloat(_baseCount)
      let nowCount: any = baseCount
      const timer = setInterval(() => {
        if (nowCount > 0.9) {
          clearInterval(timer)
        }
        $('.impot_module_wrap .progress_inbar').css({
          width: nowCount * 100 + '%',
        })
        const $nowCount: any = nowCount * 100
        $('.impot_module_wrap .progress_word').html(parseFloat($nowCount).toFixed(2) + '%')
        nowCount += baseCount
      }, 100)
      const formDatas: any = new FormData()
      formDatas.append('file', fileObj)
      formDatas.append('baseFormId', selelctForm.baseFormId)
      formDatas.append('userId', $store.getState().nowUserId)
      setUploadLoading(true)
      axios({
        method: 'post',
        url: `${protocol}${host}/approval/importBaseFormData`,
        headers: {
          loginToken: $store.getState().loginToken,
          teamId: selOrgId,
        },
        cancelToken: source.token,
        data: formDatas,
      })
        .then((data: any) => {
          if (data.data.returnCode === 0) {
            handelUplodData(data.data.data, timer, nowCount)
          } else {
            setUploadLoading(false)
            message.error(data.data.returnMessage)
          }
        })
        .catch(err => {
          message.error(err.returnMessage)
          setUploadLoading(false)
        })
    }
  }
  //新增台账数据
  const createReportData = () => {
    const elementVals: any = []
    let flag = false
    const $data = listRef.getControlData() || []
    $data.map((item: any) => {
      if (item.contentVal) {
        flag = true
      }
      let _vals = item.contentVal
      if (item.numberTransform == 1) {
        // 中文转数字
        _vals = changeWordToNum(_vals)
        _vals = newToFix(_vals, item.decimals)
      }
      elementVals.push({
        type: item.type,
        uuid: item.uuId,
        value: _vals,
      })
    })
    if (!flag) {
      setAddvsible(false)
      return
    }
    saveBaseFormData({
      baseFormValueArr: elementVals,
      businessTableId: selelctForm.baseFormId,
      teamId: selOrgId,
    })
      .then((data: any) => {
        if (data.returnCode == 0) {
          message.success('操作成功')
          if (!checkState) {
            setAddvsible(false)
          }
          //重置控件值
          listRef.emptyHandel()
          const $data: any = [...controlData]
          const emptyControl = $data.map((item: any) => {
            return { ...item, contentVal: '' }
          })
          setControlData(emptyControl)
          queryTanbleData() //刷新列表
        }
      })
      .catch(err => {
        setAddvsible(false)
        message.error(err.returnMessage)
      })
  }

  const tabChange = (activeKey: string) => {
    setActiveKey(activeKey)
  }

  // 关注取消关注
  const followBusinessData = () => {
    const followType = baseFormData.isFollowed === 1 ? 0 : 1
    const params = {
      type: 1, // 关注类型（1台账，4统计）
      typeId: selelctForm.baseFormId, // 类型id
      followType: followType, // 0取消关注，1关注
    }
    followStandingBook(params).then(() => {
      // 刷新工作台
      ipcRenderer.send('refresh_standing_book')
      setBaseFormData({ ...baseFormData, isFollowed: followType })
    })
  }

  const onSelectStatic = (node: any) => {
    setSelectReportForm(node)
  }

  const revertFileName = (fileName: string, errorMsg?: string) => {
    if (fileName && fileName.includes('.xlsx')) {
      const index: number = fileName.indexOf('.')
      const arr = fileName.split('')
      arr.splice(index, 0, errorMsg ? errorMsg : '')
      const newFileName = arr.join('')
      return newFileName
    } else {
      return fileName + (errorMsg ? errorMsg : '') + '.xlsx'
    }
  }
  const listOnRef = (ref: any) => {
    listRef = ref
  }
  const hasAlldata =
    baseFormData && Array.isArray(baseFormData.baseFormDataMap) && baseFormData.baseFormDataMap.length > 0
  return (
    <Spin spinning={false} tip={'加载中，请稍侯'} wrapperClassName="business-data-container">
      <div className="left-panel">
        <Tabs onChange={tabChange} activeKey={activeKey}>
          {authObj.includes('baseFormManage') && (
            <Tabs.TabPane tab="台账" key="standing_book">
              <div style={{ height: '100%', overflow: 'auto' }}>
                <Input
                  ref={inputRef}
                  allowClear
                  placeholder="请输入台账名称"
                  style={{ marginBottom: '26px' }}
                  className="org_menu_search baseInput radius16 border0 bg_gray"
                  suffix={
                    <em
                      className="search-icon-t-btn"
                      onClick={() => {
                        const inputValue = inputRef.current.state.value || ''
                        queryTreeInfo(inputValue, true)
                      }}
                    ></em>
                  }
                  onPressEnter={(e: any) => {
                    queryTreeInfo(e.target.value, true)
                  }}
                />
                <Tree
                  blockNode={true}
                  className="busubess_tree"
                  onSelect={onSelect}
                  draggable
                  selectedKeys={treeInit.selectedKeys}
                  onExpand={onExpand}
                  expandedKeys={treeInit.expandedKeys}
                  onDrop={onDrop}
                  treeData={handleTreeData(treeInit.treeData)}
                />
                {treeInit.treeData.length === 0 && (
                  <NoneData
                    imgSrc={$tools.asAssetsPath('/images/common/report_serach_icon.svg')}
                    showTxt="没有找到相关台账"
                    imgStyle={{ width: 64, height: 66 }}
                  />
                )}
              </div>
            </Tabs.TabPane>
          )}
          {authObj?.includes('baseFormCount') && (
            <Tabs.TabPane tab="统计" key="statistics">
              {activeKey === 'statistics' && (
                <TreeMenu selectNode={selectReportform} activeKey={activeKey} onSelect={onSelectStatic} />
              )}
            </Tabs.TabPane>
          )}
        </Tabs>
      </div>
      {/* 统计详情 */}
      {activeKey === 'statistics' && (
        <div className="right-panel">
          {selectReportform && selectReportform.type === 4 ? (
            <StaticDetails selectNode={selectReportform} />
          ) : (
            <NoneData
              imgSrc={$tools.asAssetsPath('/images/common/report_list_icon.svg')}
              showTxt="请在左边目录中选择一个报表进行查看"
              imgStyle={{ width: 98, height: 71 }}
            />
          )}
        </div>
      )}
      {/* 台账详情 */}
      {activeKey === 'standing_book' && (
        <div className="right-panel">
          {selelctForm && selelctForm.type === 1 ? (
            <>
              <div className="title flex">
                <div>
                  {!selOrgId && `[${orgName}]`}
                  {selelctForm.baseFormName}
                </div>
                <div className="follow_handle">
                  <em
                    className={`${baseFormData?.isFollowed ? 'color_yellow' : 'color_blue'} img_icon`}
                    onClick={followBusinessData}
                  ></em>
                  关注
                </div>
              </div>
              <div className={$c('business-data-tabs', { 'business-wait-tabs': viewType === 'whiteBack' })}>
                {operations}
                <Spin spinning={tableLoading} tip="加载中,请稍后...">
                  {/* 总台账 */}
                  {viewType === 'allData' && baseFormData && (
                    <RenderTableData
                      loading={false}
                      selTab={selectTab}
                      viewTitle={baseFormData.viewTitleModels}
                      dataMap={baseFormData.baseFormDataMap}
                      viewBottom={baseFormData.bottomData}
                      tableChange={tableChangeEvent}
                      setCustomFilter={setCustomFilter}
                      selelctForm={selelctForm}
                      teamId={selOrgId}
                      filteredInfo={filterObj.filteredInfo}
                      sortedInfo={filterObj.sortedInfo}
                      tableRef={mainTableRef}
                      selectedRowKeys={selectedRowKeys}
                      setSelectedRowKeys={(keys: any) => {
                        setSelectedRowKeys(keys)
                      }}
                      queryFormDetaileCall={(id: any) => {
                        queryFormDataDetails(id)
                        queryBaseFormLog(id)
                      }}
                      controlData={controlDetileData}
                      formLogData={formLogData}
                      isUpdate={selectTab.isUpdate}
                      refreshTable={() => queryTanbleData()}
                    />
                  )}
                  {/* {viewType === 'allData' && !hasAlldata && (
                    <NoneData
                      imgSrc={$tools.asAssetsPath('/images/common/report_list_icon.svg')}
                      showTxt="当前还没有数据哦~"
                      imgStyle={{ width: 98, height: 71 }}
                    />
                  )} */}
                  {/* 变更明细 */}
                  {viewType === 'whiteBack' && (
                    <WhiteBckTableData
                      datas={{
                        baseFormId: selelctForm.baseFormId,
                        teamId: selOrgId,
                        selectTab: selectTab,
                        baseFormWhiteBackData: baseFormWhiteBackData,
                      }}
                      tabChange={whiteBackTableChange}
                      filterDatas={WhiteBckFilterDatas}
                      dataChange={getWhiteBackDatas}
                      changeLoding={setTableLoading}
                    />
                  )}
                </Spin>
              </div>
            </>
          ) : (
            <NoneData
              imgSrc={$tools.asAssetsPath('/images/common/report_list_icon.svg')}
              showTxt="请在左边目录中选择一个台账进行查看"
              imgStyle={{ width: 98, height: 71 }}
            />
          )}
          {viewType === 'allData' &&
            baseFormData &&
            Array.isArray(baseFormData.baseFormDataMap) &&
            baseFormData.baseFormDataMap &&
            baseFormData.baseFormDataMap.length !== 0 && (
              <Pagination
                showSizeChanger
                current={pagination.pageNo + 1}
                pageSize={pagination.pageSize}
                pageSizeOptions={['5', '10', '20', '30', '50', '100']}
                total={pagination.total}
                onChange={(current, pageSize) => {
                  setPagination({ ...pagination, pageNo: current - 1, pageSize: pageSize || 20 })
                }}
                onShowSizeChange={(current, pageSize) => {
                  setPagination({ ...pagination, pageNo: current - 1, pageSize: pageSize || 20 })
                }}
              />
            )}
        </div>
      )}

      <DownLoadFileFooter fromType="businessData" />
      {filterTitle && (
        <FileterData
          dataNew={baseFormDataTitle.baseFormDataTitleNew}
          dataOld={baseFormDataTitle.baseFormDataTitleOld}
          baseFormId={selelctForm.baseFormId}
          changeChecked={filterDatas}
        />
      )}
      <Modal
        title="新增台账数据"
        className="control_module_wrap"
        centered
        visible={addvsible}
        onCancel={() => setAddvsible(false)}
        footer={
          <div
            className="control_module_footer"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <div>
              <Checkbox checked={checkState} onChange={e => setCheckState(e.target.checked)}>
                保存后继续创建下一条
              </Checkbox>
            </div>
            <div>
              <Button onClick={() => setAddvsible(false)}>取消</Button>
              <Button type="primary" onClick={() => createReportData()}>
                确定
              </Button>
            </div>
          </div>
        }
        width={850}
      >
        <div className="controlBox">
          <div className="controlWrap" style={{ maxHeight: '468px' }}>
            <RenderControl
              type="add"
              data={controlData}
              tearmId={selOrgId}
              personTearmId={selelctForm && selelctForm.hasOwnProperty('orgId') ? selelctForm.orgId : ''}
              onRef={listOnRef}
            />
          </div>
          <div className="tablePlugTmpBox" style={{ display: 'none' }}></div>
        </div>
      </Modal>
      <Modal
        title="操作提示"
        className="del_module_tip"
        centered
        visible={delvsible}
        onOk={() => {
          if (selectedRowKeys.length === 0 && radioValue === 0) {
            return message.error('未选择删除数据')
          }
          const newKeys = selectedRowKeys.filter(
            (item: any) => Object.prototype.toString.call(item) === '[object String]'
          )
          const params = {
            baseFormId: selelctForm.baseFormId,
            baseFormDataIds: radioValue === 1 ? [] : newKeys,
          }
          relationSystem(selelctForm.baseFormId)
            .then(() => {
              deleteBaseFormData(params)
                .then((data: any) => {
                  if (data.returnCode == 0) {
                    message.success('删除成功')
                    queryTanbleData() //刷新列表
                    setDelvsible(false)
                  }
                })
                .catch(err => {
                  message.error(err.returnMessage)
                  setDelvsible(false)
                })
            })
            .catch(err => {
              message.error(err.returnMessage)
            })
        }}
        onCancel={() => setDelvsible(false)}
        width={400}
      >
        <div style={{ paddingTop: '14px' }}>
          <span className="delTile" style={{ fontSize: '14px' }}>
            请选择删除的数据范围
          </span>
          <Radio.Group onChange={e => setRadioValue(e.target.value)} value={radioValue}>
            <Radio style={radioStyle} value={0}>
              仅删除选中数据
            </Radio>
            <Radio style={radioStyle} value={1}>
              清空台账所有数据
            </Radio>
          </Radio.Group>
        </div>
      </Modal>
      <Modal
        title="导入"
        className="impot_module_wrap"
        centered
        visible={importVsible}
        onCancel={() => setImportVsible(false)}
        width={850}
        footer={
          uploadMain
            ? [
                <Button key="back" onClick={() => setImportVsible(false)}>
                  取消
                </Button>,
                <Button key="submit" type="primary" disabled={uploadLoading} onClick={() => uploadSubmit()}>
                  确定
                </Button>,
              ]
            : null
        }
      >
        {/* <Spin spinning={uploadLoading}> */}
        <div className="impot_module_content">
          {uploadMain && (
            <div style={{ display: 'flex', justifyContent: 'center', margin: '60px 0 48px 0' }}>
              <div className="impot_img"></div>
            </div>
          )}
          {uploadMain && (
            <div className="import_temp_top">
              1、下载导入模板，按照模板的格式填写成员信息，点此下载
              {importFile && (
                <span
                  onClick={() => {
                    // const { fileName, fileKey, fileSize, dir } = importFile
                    // const fileName = selelctForm.baseFormName
                    // const _name = fileName.includes('.xls') ? fileName : fileName + '.xls'
                    downloadFile({
                      url: '',
                      fileName: revertFileName(importFile.fileName),
                      fileKey: '',
                      dir: '',
                      fileSize: 0,
                      fromType: 'businessData',
                      customOption: {
                        type: 'businessImport',
                        url: `${API_PROTOCOL}${API_HOST}/approval/findBaseFormDataTemplate?baseFormId=${selelctForm.baseFormId}`,
                      },
                    })
                  }}
                >
                  <Tooltip title="点击下载">{revertFileName(importFile.fileName)}</Tooltip>
                </span>
              )}
            </div>
          )}
          {uploadMain && (
            <div className="import_temp_btm">
              2、填写完成后，保存Excel文档，然后点击上传
              <div>
                <Upload
                  ref={uploadRef}
                  beforeUpload={(file: any, fileList: any) => {
                    const fileName = fileList[0].name
                    if (
                      fileName.substring(fileName.length - 3) != 'xls' &&
                      fileName.substring(fileName.length - 4) != 'xlsx'
                    ) {
                      message.error('文件模板格式错误')
                    } else {
                      setFileObj(fileList[0])
                    }
                    return false
                  }}
                  onChange={() => {}}
                  maxCount={1}
                  fileList={[]}
                >
                  <Button icon={<UploadOutlined />}>选择上传文件</Button>
                </Upload>
              </div>
            </div>
          )}

          {fileObj && uploadMain && (
            <div className="file_wrap">
              <span className="exel_icon"></span>
              <span className="file_name_box">{fileObj.name}</span>
            </div>
          )}

          {uploadSuccess && (
            <div className="uploadSuccess">
              <div style={{ display: 'flex', justifyContent: 'center', margin: '150px 0px 32px 0' }}>
                <div className="impot_img"></div>
              </div>
              <div className="sucess_box">
                <span></span>
                <em>数据导入完成，已成功导入{errorData.succeedRecord}条数据</em>
              </div>
            </div>
          )}
          {uploadProgress && (
            <div className="upload_progress_box">
              <div className="progress_bar">
                <div className="progress_inbar"></div>
                <Spin spinning={uploadLoading}></Spin>
              </div>
              <p className="progress_word">0%</p>
            </div>
          )}
          {uploadFailed && (
            <div className="uploadFailed">
              <p className="fail_p">
                成功导入{errorData.succeedRecord}条数据，失败{errorData.errorRecord}条数据，详情如下，点此下载
                <a className="download_modal" onClick={() => downloadErrorExecl()}>
                  失败记录
                </a>
              </p>
              <div className="failed_table_box">
                <table className="edtitable">
                  <thead>
                    <tr>
                      {errorData.viewTitleModels.map((item: any, index: number) => (
                        <th
                          key={index}
                          data-id={item.uuid}
                          style={{
                            borderRight:
                              index === errorData.viewTitleModels.length - 1 ? '1px solid #e7e7e9' : 'none',
                          }}
                        >
                          {item.title}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {errorData.errorDatas.map((item: any, i) => (
                      <tr data-id={item.uuid} key={i}>
                        {errorData.viewTitleModels.map((_item: any, index: number) => (
                          <ErrorTable
                            key={index}
                            errrorData={item}
                            item={_item}
                            trIndex={i}
                            errorList={errorData.errorDatas}
                          />
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="del_icon_box">
                  {errorData.errorDatas.map((item: any, i) => (
                    <div className="delBtn" key={i} data-id={i} onClick={() => delErrorItem(i)}></div>
                  ))}
                </div>
              </div>
              <div className="button-wrap">
                <Button type="primary" onClick={() => uploadAgain()}>
                  重新上传失败记录
                </Button>
              </div>
            </div>
          )}
        </div>
        {/* </Spin> */}
      </Modal>
    </Spin>
  )
}

export default BusinessData
const splicingInfo = (arr: any, type: string) => {
  let htmlStr = ''
  for (let k = 0; k < arr.length; k++) {
    let tempStr = ''
    let symbol = ','
    if (type === 'peoSel') {
      //人员
      tempStr = arr[k].userName
      symbol = ';'
    } else if (type === 'deptSel') {
      //部门
      tempStr = arr[k].deptName
    } else {
      //岗位
      tempStr = `${arr[k].deptName}-${arr[k].roleName}`
    }
    if (k == arr.length - 1) {
      htmlStr += tempStr
    } else {
      htmlStr += `${tempStr}${symbol}`
    }
  }
  return htmlStr
}

//校验是否是错误数据
const isError = (errorList: any, index: number, uuid: any) => {
  const errObj = {
    errorFlag: false,
    title: '',
  }
  for (const i in errorList[index].errorElementMap) {
    if (uuid == i) {
      errObj.errorFlag = true
      if (i == '唯一ID') {
        errObj.title = '唯一id格式错误或者不存在'
      } else {
        errObj.title = errorList[index].errorElementMap[i]
      }
    }
  }
  return errObj
}
const tdItemEvent = (e: any) => {
  //找到当前鼠标点击的td,this对应的就是响应了click的那个td
  const tdObj: any = $(e.target)
  if (tdObj.children('input').length > 0) {
    return false
  }
  const text = tdObj.html()
  //清空td中的内容
  tdObj.html('')
  const inputObj = $("<input type='text'>")
    .css({
      border: '0',
      width: '100%',
      height: '40px',
      'font-size': '12px',
      outline: 'none',
      'text-align': 'center',
    })
    .width(tdObj.width())
    .height(tdObj.height())
    .css('background-color', tdObj.css('background-color'))
    .val(text)
    .appendTo(tdObj)
  //是文本框插入之后就被选中
  inputObj.trigger('focus').trigger('select')
  inputObj.click(function() {
    return false
  })
  //处理文本框上失去焦点赋值
  inputObj.on('blur', e => {
    //获取当当前文本框中的内容
    const inputtext = $(e.target).val()
    //将td的内容修改成文本框中的内容
    tdObj.html(inputtext).removeClass('error')
  })
  inputObj.keyup(function(event) {
    //处理ctrl+z撤回的情况
    if (event.ctrlKey == true && event.keyCode == 90) {
      //将td中的内容还原成text
      tdObj.html(text)
    }
  })
}
const ErrorTable = ({ errrorData, item, trIndex, errorList }: ErrorDataProps) => {
  const elementType = ['peoSel', 'deptSel', 'roleSel']
  const _isError = isError(errorList, trIndex, item.uuid)
  const toolTip = _isError.errorFlag ? _isError.title : ''
  let content: any = ''
  let _value: any = []
  const allElementMapUuid = errrorData.allElementMap[item.uuid]
  if (allElementMapUuid) {
    content = allElementMapUuid == 'null' ? '' : allElementMapUuid

    if (IsJsonString(allElementMapUuid)) {
      _value = JSON.parse(allElementMapUuid)
    }
  }
  const getTdInfo = (type: string) => {
    if (type === 'peoSel' || type === 'deptSel' || type === 'roleSel') {
      return splicingInfo(_value, item.type) || ''
    } else {
      return content
    }
  }
  const renderContent = () => {
    let htmlStr: any = ''
    if (allElementMapUuid) {
      const hasType = elementType.includes(item.type)
      htmlStr = hasType ? (_value.length == 0 ? content : getTdInfo(item.type)) : content
    } else {
      htmlStr = ''
    }
    return htmlStr
  }
  //渲染TD
  return (
    <td style={{ width: item.type == 'dateRange' ? '160px' : 'auto' }}>
      <Tooltip title={toolTip}>
        <span
          data-id={item.uuid}
          data-errTip={toolTip}
          className={$c({ 'error errorTip': _isError.errorFlag })}
          onClick={(e: any) => tdItemEvent(e)}
        >
          {renderContent()}
        </span>
      </Tooltip>
    </td>
  )
}

//渲染控件
const limitDecimals = (value: any, _decimals: any): any => {
  let _decimalsCount: any = ''
  for (let i = 0; i < _decimals; i++) {
    _decimalsCount += '\\d'
  }
  // const reg1 = /^(\-)*(\d+)\.(\d\d).*$/
  // _decimals 动态控制小数位数
  const reg = new RegExp('^(\\-)*(\\d+)\\.(' + _decimalsCount + ').*$')
  let newVal = ''
  if (typeof value === 'string') {
    newVal = !isNaN(Number(value)) ? value.replace(reg, '$1$2.$3') : ''
  } else if (typeof value === 'number') {
    newVal = !isNaN(value) ? String(value).replace(reg, '$1$2.$3') : ''
  }
  if (newVal.split('.')[1] && newVal.split('.')[1] == '00') {
    newVal = newVal.split('.')[0]
  }
  return newVal
}
const compare = (property: any) => {
  return function(a: any, b: any) {
    const value1 = parseInt(a[property])
    const value2 = parseInt(b[property])
    return value1 - value2
  }
}
//替换eval
const evil = (fn: any) => {
  const Fn = Function //一个变量指向Function，防止有些前端编译工具报错
  return new Fn('return ' + fn)()
}
// 限制整数位最多12位
const interNum = (obj: any, isTrans: any) => {
  if (isTrans == 1) {
    let _val: any = $(obj).val()
    let _floatNum = ''
    if (_val.indexOf('.') != -1) {
      _floatNum = _val.split('.')[1]
      _val = _val.split('.')[0]
    }
    const reg = /[0-9]{13}/
    const re = new RegExp(reg)
    if (re.test(_val)) {
      message.error('金额已超出最大转换值')
      if (_floatNum != '') {
        _floatNum = '.' + _floatNum
      }
      _val = _val.substring(0, 12) + _floatNum
      $(obj).val(_val)
    }
  }
}
const clearNoNum = (item: any, type: string, callbackFn: (id: any, val: any) => void) => {
  // 查找所有公式
  let oldTxt: any = ''
  let oldVal: any = ''
  for (let i = 0; i < formulaInfo.length; i++) {
    const fItem = formulaInfo[i]
    // 变量是否是公式引用的
    let isUser = false
    // 公式使用的变量是否有未填写的
    let isNullVarNum = 0
    let formulaVal: any = 0
    let totalSum = 0
    const totalArr: any = []
    let productVal: any = 1
    const $controlBox = type === 'edit' ? $('.business_detail_tabs_wrap .controlBox') : $('.controlBox')
    $controlBox.find('.tablePlugTmpBox').html(fItem.formulaHtml || '')

    let sortVariable = []
    if (fItem.variable) {
      sortVariable = fItem.variable.sort(compare('sort'))
    }
    sortVariable.map((vItem: any, v: number) => {
      // 确认此数值控件有被公式控件引用
      isUser = true
      let thisValSour: any = 0
      const $numval_input = $controlBox.find(`.controlWrap>div[data-id="${vItem.id}"]`).find('.numval_input')
      const $formula_input = $controlBox.find(`.controlWrap>div[data-id="${vItem.id}"]`).find('.formula_input')
      if ($numval_input.length != 0) {
        const _val: any = $numval_input.find('input').val()
        thisValSour = parseFloat(_val.replace(/,/g, '')) || 0
      } else if ($formula_input.length != 0) {
        const _val: any = $formula_input.val()
        thisValSour = parseFloat(_val.replace(/,/g, '')) || 0
      }
      let thisVal: any = parseFloat(thisValSour) || 0
      totalSum += thisVal
      productVal = parseFloat(productVal) * parseFloat(thisVal)
      totalArr.push(thisVal)
      if (fItem.formulaMode == 6) {
        //自定义公式
        if (thisVal < 0) {
          //防止出现负号
          thisVal = '(' + thisVal + ')'
        }
        $($controlBox.find('.tablePlugTmpBox .countValItem')[v]).html(thisVal)
      }
      // 有变量未填写(NaN、undefined情况)
      if (thisValSour !== 0 && !thisValSour) {
        isNullVarNum++
      }
    })
    // 此数值控件被此公式使用则将值填充到公式控件
    if (isUser) {
      // 有一个变量为空则不计算
      if (isNullVarNum > 0) {
        $controlBox
          .find(`.controlWrap>div[data-id="${fItem.formlaId}"]`)
          .find('.formula_input')
          .val('')
        return
      }
      // 0求和 1平均值 2最大值 3最小值 4乘积 5计数 6自定义
      if (fItem.formulaMode == 0) {
        formulaVal = totalSum
      } else if (fItem.formulaMode == 1) {
        formulaVal = totalSum / fItem.variable.length
      } else if (fItem.formulaMode == 2) {
        formulaVal = Math.max.apply(null, totalArr)
      } else if (fItem.formulaMode == 3) {
        formulaVal = Math.min.apply(null, totalArr)
      } else if (fItem.formulaMode == 4) {
        formulaVal = productVal
      } else if (fItem.formulaMode == 5) {
        if (fItem.countChild) {
          //有内嵌公式
          formulaVal = 1
        } else {
          formulaVal = fItem.variable.length
        }
      } else if (fItem.formulaMode == 6) {
        const resultTxt = $controlBox.find('.tablePlugTmpBox').text()
        formulaVal = evil(resultTxt)
        if (!formulaVal || formulaVal == Infinity) {
          formulaVal = 0
        }
      }
      const isTrans: any = $controlBox
        .find(`.controlWrap>div[data-id="${fItem.formlaId}"]`)
        .attr('data-numbertransform')
      const formulaDom = $controlBox
        .find(`.controlWrap>div[data-id="${fItem.formlaId}"]`)
        .find('.formula_input')
      interNum(formulaDom, isTrans)
      if (isTrans == 1) {
        const fix = $controlBox.find(`.controlWrap>div[data-id="${fItem.formlaId}"]`).attr('data-decimals')
        $controlBox
          .find(`.form_list>div[data-id="${fItem.formlaId}"]`)
          .find('.formula_input')
          .attr('data-oldval', newToFix(formulaVal, fix))
        oldVal = formulaVal
        formulaVal = init(formulaVal, fix)
        oldTxt = formulaVal != undefined ? formulaVal : oldTxt
      } else {
        const resultNum = parseFloat(formulaVal).toFixed(fItem.decimals)
        oldTxt = resultNum
        $controlBox
          .find(`.controlWrap>div[data-id="${fItem.formlaId}"]`)
          .find('.formula_input')
          .attr('data-oldval', resultNum)
      }
      const _itemId: any = $controlBox.find(`.controlWrap>div[data-id="${fItem.formlaId}"]`).attr('data-mid')
      const itemId = parseInt(_itemId)
      $controlBox
        .find(`.controlWrap>div[data-id="${fItem.formlaId}"]`)
        .find('.formula_input')
        .val(oldTxt)
        .change()
      callbackFn(itemId, oldTxt)
    }
  }
}

//渲染单个表单控件
const RenderControl = (props: ControlProps) => {
  const { data, type, personTearmId, onRef } = props
  //缓存一份数据
  const [storageData, setStorageData] = useState<any>([])
  // 此处注意参数是目标元素的ref引用
  useImperativeHandle(onRef, () => ({
    getControlData: (params: any) => {
      return storageData
    },
    emptyHandel: () => {
      const emptyControl = storageData.map((item: any) => {
        return { ...item, contentVal: '' }
      })
      setStorageData(emptyControl)
    },
  }))

  useEffect(() => {
    let isUnmounted = false
    if (!isUnmounted) {
      setStorageData([...data])
    }
    return () => {
      isUnmounted = true
    }
  }, [data])

  const callback = (_id: number, domValue: any) => {
    let newData: any = []
    if (type === 'add') {
      newData = storageData.map((item: any) => {
        if (_id === item.id) {
          return {
            ...item,
            contentVal: domValue,
          }
        }
        return item
      })
      setStorageData(newData)
    } else {
      const $domVal = !!domValue ? domValue : ''
      const $TYPS = ['input', 'time', 'dateRange', 'textarea', 'peoSel', 'deptSel', 'roleSel']
      storageData.map((item: any) => {
        const { id, type, formlaId } = item
        const $wrapMid = $(".controlBox .controlWrap>div[data-mid='" + id + "']")
        const $wrapId = $(".controlBox .controlWrap>div[data-id='" + id + "']")
        const $wrapForm = $(".controlBox .controlWrap>div[data-id='" + formlaId + "']")
        if (_id === id) {
          const oldCont = $wrapMid.attr('data-oldval')
          if ($TYPS.includes(type)) {
            if (oldCont != $domVal) $wrapMid.attr('data-newVal', $domVal)
          } else if (type === 'numval' || type === 'formula') {
            if (oldCont != $domVal) $wrapMid.attr('data-newVal', $domVal)
            $wrapId.find('.formula_input').attr('old-val', $domVal)
            //同步改变关联公式的值
            for (let i = 0; i < formulaInfo.length; i++) {
              const oldVal = $wrapForm.find('.formula_input').attr('old-val')
              const newVal = $wrapForm.find('.formula_input').attr('data-oldval')
              if (newVal && oldVal != newVal && $domVal != 'null') {
                $wrapForm.find('.formula_input').attr('old-val', newVal)
                $wrapForm.attr('data-newVal', newVal)
              }
            }
          }
          item.fillValue = $domVal
        }
      })
      const newData = storageData.map((_item: any) => {
        if (_id === _item.id) {
          return {
            ..._item,
            fillValue: $domVal,
          }
        }
        return _item
      })
      setStorageData(newData)
    }
  }
  const getformulaVal = (rowId: any) => {
    const rowVal = storageData.filter((item: any) => item.id === parseInt(rowId))
    if (Array.isArray(rowVal) && rowVal.length && rowVal[0].hasOwnProperty('contentVal')) {
      return rowVal[0].contentVal
    } else {
      return ''
    }
  }
  return (
    <>
      {storageData.map((item: any, index: number) => {
        const isHideDom = item.elementPower === 0 ? true : false //item.elementPower  2查看  1编辑  0没有
        const isdisabled = item.elementPower === 2 || item.specialAttribute != 0 ? true : false
        let elementVal = type === 'edit' ? item.fillValue : item.contentVal
        if (item.type === 'formula') {
          const formulaFix = item.decimals || 0
          let getFormula = []
          if (item.designFormulas) {
            getFormula = JSON.parse(item.designFormulas) || []
            getFormula.decimals = formulaFix
          }
          const newFormulaStr = JSON.stringify(formulaInfo)
          if (newFormulaStr.indexOf(getFormula.formlaId) == -1) {
            formulaInfo.push(getFormula)
          }
        }
        //自动获取时间
        if (item.selfMade === 1 && !item.fillValue) {
          const nowDate = $tools.getMyDate()
          if (item.dateType === 2) {
            elementVal = nowDate.split(' ')[1]
          } else {
            elementVal = nowDate
          }
        }

        if (item.type === 'formula' && item.numberTransform === 1 && type == 'edit') {
          if (elementVal && elementVal.includes('.')) {
            // 已经转过大写金额的不用再次转
            const fix = elementVal && elementVal.split('.')[1] ? elementVal.split('.')[1].length : 0
            elementVal = init(elementVal, fix)
          }
        }

        return (
          <div
            key={index}
            className={$c('controlItem', { controlHide: isHideDom })}
            data-mid={item.id}
            data-id={item.uuId}
            data-elementtype={item.type}
            data-numbertransform={item.numberTransform}
            data-decimals={item.decimals}
            data-oldval={item.logcontentVal}
          >
            <span className="labelName" style={{ width: item.type === 'text' ? '100%' : '147px' }}>
              {item.name}
            </span>
            {item.type === 'input' && (
              <>
                <Input
                  placeholder={item.placeholder}
                  value={elementVal}
                  maxLength={item.textNumber}
                  disabled={isdisabled}
                  onChange={e => {
                    const val = e.target.value
                    callback(item.id, val)
                  }}
                />
              </>
            )}
            {item.type === 'numval' && (
              <div className="numval_wrap">
                <InputNumber
                  value={elementVal}
                  disabled={isdisabled}
                  className="ant-input numberInput numval_input"
                  maxLength={12}
                  onKeyUp={() =>
                    clearNoNum(item, type, function(id: number, val: string) {
                      callback(id, val)
                    })
                  }
                  min={0}
                  onChange={(value: any) => {
                    callback(item.id, value)
                  }}
                  formatter={(e: any) => limitDecimals(e, item.decimals)}
                  parser={(e: any) => limitDecimals(e, item.decimals)}
                />
                <span
                  className="numval_unit"
                  style={{ fontSize: '14px', color: '#191F25', paddingLeft: '10px' }}
                >
                  {item.unit}
                </span>
              </div>
            )}
            {item.type === 'formula' && (
              <>
                {type == 'add' && (
                  <Input
                    disabled
                    value={getformulaVal(item.id)}
                    className="formula_input"
                    data-numbertransform={item.numberTransform}
                    data-decimals={item.decimals}
                  />
                )}
                {type == 'edit' && (
                  <Formula
                    data={data || []}
                    elementVal={elementVal}
                    id={item.id}
                    numberTransform={item.numberTransform}
                    decimals={item.decimals}
                  />
                )}
              </>
            )}
            {item.type === 'textarea' && (
              <TextArea
                value={elementVal}
                // rows={4}
                autoSize={{ minRows: 2, maxRows: 15 }}
                disabled={isdisabled}
                onChange={e => {
                  callback(item.id, e.target.value)
                }}
              />
            )}
            {(item.type === 'peoSel' || item.type === 'deptSel' || item.type === 'roleSel') && (
              <PersonModle
                item={item}
                personVal={elementVal}
                tearmId={personTearmId}
                isdisabled={isdisabled}
                timer={new Date().getTime()}
                callbackFn={(id: any, val: any) => {
                  callback(id, val)
                }}
              />
            )}
            {item.type === 'dateRange' && (
              <div style={{ width: '100%' }}>
                <RangePicker
                  value={
                    revertDateRange(elementVal).startTime
                      ? [
                          moment(
                            revertDateRange(elementVal).startTime,
                            item.dateType === 1 ? 'YYYY/MM/DD HH:mm' : 'YYYY/MM/DD'
                          ),
                          moment(
                            revertDateRange(elementVal).endTime,
                            item.dateType === 1 ? 'YYYY/MM/DD HH:mm' : 'YYYY/MM/DD'
                          ),
                        ]
                      : null
                  }
                  format={item.dateType === 1 ? 'YYYY/MM/DD HH:mm' : 'YYYY/MM/DD'}
                  disabled={isdisabled}
                  onChange={(value, dateString) => {
                    const timeStr = dateString[0] + '-' + dateString[1]
                    callback(item.id, timeStr)
                  }}
                  showTime={item.dateType === 1}
                />
              </div>
            )}
            {item.type === 'time' && (
              <div style={{ width: '100%' }}>
                <DatePicker
                  className="time_date_picker"
                  format={item.dateType === 1 ? 'YYYY/MM/DD HH:mm' : 'YYYY/MM/DD'}
                  value={
                    elementVal
                      ? moment(elementVal, item.dateType === 1 ? 'YYYY/MM/DD HH:mm' : 'YYYY/MM/DD')
                      : undefined
                  }
                  disabled={isdisabled || item.selfMade === 1}
                  onChange={(date, dateString) => callback(item.id, dateString)}
                  showTime={item.dateType === 1}
                />
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}

//公式单独渲染
const Formula = (props: any) => {
  const { id, elementVal, numberTransform, decimals, data } = props
  //是否是第一次渲染
  let isFirstRender: any = false
  //数值控件单独获取值
  const formulaVal = (rowId: any, elementVal: string) => {
    if (!isFirstRender && !!elementVal) {
      isFirstRender = true
      return elementVal
    }
    const rowVal = data.filter((item: any) => item.id === parseInt(rowId))
    if (Array.isArray(rowVal) && rowVal.length && rowVal[0].hasOwnProperty('contentVal')) {
      return rowVal[0].contentVal
    } else {
      return ''
    }
  }
  return (
    <Input
      disabled
      value={formulaVal(id, elementVal)}
      className="formula_input"
      data-numbertransform={numberTransform}
      data-decimals={decimals}
    />
  )
}

//单独渲染人员选择
const PersonModle = (props: PersonProps) => {
  const { personVal, item, tearmId, isdisabled, timer, callbackFn } = props
  //是否显示选择人员弹窗
  const [visible, setVisible] = useState(false)
  //选择类型
  const [findType, setFindType] = useState(0)
  const [showSelectUsers, setShowSelectUsers] = useState<any>([])
  let checkboxType: any = findType == 0 ? (item.isRadio == 1 ? 'checkbox' : 'radio') : 'checkbox'
  if (findType == 31) {
    //岗位只能单选
    checkboxType = 'radio'
  }
  //弹窗选择类型
  const showSelectModal = (_type: string) => {
    if (_type === 'peoSel') {
      setFindType(0)
    } else if (_type === 'deptSel') {
      setFindType(3)
    } else {
      setFindType(31)
    }
    setVisible(true)
  }

  const delUser = (curId: any) => {
    const newUsers = [...showSelectUsers]
    for (let i = newUsers.length; i--; ) {
      if (newUsers[i].curId === curId) {
        newUsers.splice(i, 1)
      }
    }
    setShowSelectUsers(newUsers)
    callbackFn(item.id, JSON.stringify(newUsers))
  }

  useEffect(() => {
    //处理人员 部门 岗位回显数据
    const newArr = personVal ? JSON.parse(personVal) : []
    setShowSelectUsers(handelSelectData(newArr))
  }, [timer])

  const handelSelectData = (data: any) => {
    const arr = data.map((vitem: any) => {
      const { userId, userName, account, deptId, deptName, roleId, roleName } = vitem
      if (item.type === 'peoSel') {
        return {
          curId: userId,
          curName: userName,
          userId: userId,
          userName: userName,
          account: account,
        }
      } else if (item.type === 'deptSel') {
        return {
          curId: deptId,
          curName: deptName,
          deptId: deptId,
          deptName: deptName,
        }
      } else {
        return {
          curId: roleId,
          curName: roleName,
          deptId: deptId,
          deptName: deptName,
          roleId: roleId,
          roleName: roleName,
        }
      }
    })
    return arr
  }

  return (
    <div className="personInfo" style={{ opacity: isdisabled ? 0.5 : 1 }}>
      <PlusOutlined
        onClick={() => {
          if (isdisabled) {
            return
          }
          showSelectModal(item.type)
        }}
      />
      <div className="userWrap">
        {showSelectUsers.map((item: any, index: number) => (
          <span key={index} className="userItem">
            {item.hasOwnProperty('roleId') ? `${item.deptName}-${item.curName}` : item.curName}
            {!isdisabled && (
              <span className="del" onClick={() => delUser(item.curId)}>
                <CloseOutlined />
              </span>
            )}
          </span>
        ))}
      </div>
      {visible && (
        <SelectMemberOrg
          param={{
            visible: visible,
            allowTeamId: [tearmId],
            selectList: showSelectUsers,
            checkboxType: checkboxType, //单选Or多选
            findType: findType,
            title: findType == 0 ? '请选择成员' : findType == 3 ? '请选择部门' : '请选择岗位',
            fliterByType: {
              '1': {
                show: true,
                text: '按组织架构选择',
              },
              '2': {
                show: findType != 3 && findType != 31,
                text: '按角色选择',
              },
              '3': {
                show: true,
              },
              '4': {
                show: true,
                text: `常用${findType === 3 ? '部门' : findType === 31 ? '岗位' : ''}`,
              },
            },
            onSure: (datas: any) => {
              const arr = datas.map((pitem: any) => {
                const { userId, userName, account, deptId, curId, deptName, curName, roleId, roleName } = pitem
                if (item.type === 'peoSel') {
                  return {
                    userId: userId.toString(),
                    userName: userName,
                    account: account,
                  }
                } else if (item.type === 'deptSel') {
                  return {
                    deptId: deptId.toString() || curId.toString(),
                    deptName: deptName || curName,
                  }
                } else {
                  return {
                    deptId: deptId.toString(),
                    deptName: deptName,
                    roleId: roleId.toString(),
                    roleName: roleName,
                  }
                }
              })
              setShowSelectUsers(handelSelectData(arr))
              callbackFn(item.id, JSON.stringify(arr))
            },
          }}
          action={{
            setModalShow: setVisible,
          }}
        />
      )}
    </div>
  )
}

/**
 * 是否是json字符串
 * @param str
 */
const IsJsonString = (str: any) => {
  if (typeof str == 'string') {
    try {
      const obj = JSON.parse(str)
      if (typeof obj == 'object' && obj) {
        return true
      } else {
        return false
      }
    } catch (e) {
      return false
    }
  }
}

/**
 * 去除html标签
 * @param str
 */
const removeHTML = (str: any) => {
  if (null != str) {
    return str.replace(/<\/?.+?>/g, '')
  }
  return str
}

//渲染日志
const RenderFormLog = ({ item }: { item: any }) => {
  const { type, username, elementType, elementName, newElementName, oldElementName } = item
  if (type == 0 && newElementName == null) {
    return <span>{elementType == 'system_base_form' ? elementName : `${username} 创建了台账数据`}</span>
  } else if (type == 0 && newElementName != '') {
    let itemName = newElementName
    if (IsJsonString(newElementName)) {
      itemName = JSON.parse(item.newElementName)[0].txt
    }
    return (
      <span>
        {username} 新增了控件【{elementName}】<em>{removeHTML(itemName)}</em>
      </span>
    )
  } else if (type == 1 && oldElementName == null) {
    //编辑底表数据
    //旧值处理人员部门岗位选择
    let showOldVal = item.oldValue
    let isSel = false //是否是部门岗位人员删除
    if (IsJsonString(item.oldValue)) {
      const nameList: any[] = JSON.parse(item.oldValue) || []
      let newStr = ''
      if (item.elementType == 'text') {
        newStr = nameList[0].txt
      } else {
        if (Object.prototype.toString.call(nameList) === '[object Array]') {
          for (let i = 0; i < nameList.length; i++) {
            const item = nameList[i]
            const showSymbol = i == nameList.length - 1 ? '' : '、'
            if (item.deptName && item.roleName) {
              newStr += `${item.deptName}-${item.roleName}${showSymbol}`
            } else {
              newStr += `${item.userName || item.deptName}${showSymbol}`
            }
          }
        }
      }
      isSel = true
      showOldVal = newStr
    }
    //修改后的值处理人员部门岗位展示
    let showNewVal = item.newValue
    if (IsJsonString(item.newValue)) {
      const nameList: any[] = JSON.parse(item.newValue) || []
      let newStr = ''
      if (item.elementType == 'text') {
        newStr = nameList[0].txt
      } else {
        if (Object.prototype.toString.call(nameList) === '[object Array]') {
          for (let i = 0; i < nameList.length; i++) {
            const item = nameList[i]
            const showSymbol = i == nameList.length - 1 ? '' : '、'
            if (item.deptName && item.roleName) {
              newStr += `${item.deptName}-${item.roleName}${showSymbol}`
            } else {
              newStr += `${item.userName || item.deptName}${showSymbol}`
            }
          }
        }
      }
      showNewVal = newStr
    }
    if (isSel && showNewVal == '') {
      return (
        <span>
          {username} 在 【{elementName}】中将 <em>{removeHTML(showOldVal)}</em> 移除
        </span>
      )
    } else {
      return (
        <span>
          {username}将【{removeHTML(newElementName) || elementName}】<em>{removeHTML(showOldVal)}</em> 修改为{' '}
          <em>{removeHTML(showNewVal)}</em>
        </span>
      )
    }
  } else if (type == 1 && oldElementName != null && newElementName != null) {
    //编辑控件数据
    //旧值处理人员部门岗位选择
    let showOldVal = item.oldElementName
    let isSel = false //是否是部门岗位人员删除
    if (IsJsonString(item.oldElementName)) {
      const nameList = JSON.parse(item.oldElementName)
      let newStr = ''
      if (item.elementType == 'text') {
        newStr = nameList[0].txt
      } else {
        nameList.map((item: any, i: number) => {
          const showSymbol = i == nameList.length - 1 ? '' : '、'
          if (item.deptName && item.roleName) {
            newStr += `${item.deptName}-${item.roleName}${showSymbol}`
          } else {
            newStr += `${item.userName || item.deptName}${showSymbol}`
          }
        })
      }
      isSel = true
      showOldVal = newStr
    }
    //修改后的值处理人员部门岗位展示
    let showNewVal = item.newElementName
    if (IsJsonString(item.newElementName)) {
      const nameList = JSON.parse(item.newElementName)
      let newStr = ''
      if (item.elementType == 'text') {
        newStr = nameList[0].txt
      } else {
        nameList.map((item: any, i: number) => {
          const showSymbol = i == nameList.length - 1 ? '' : '、'
          if (item.deptName && item.roleName) {
            newStr += `${item.deptName}-${item.roleName}${showSymbol}`
          } else {
            newStr += `${item.userName || item.deptName}${showSymbol}`
          }
        })
      }
      showNewVal = newStr
    }
    if (isSel && showNewVal == '') {
      //如果将部门人员岗位修改为空，则文案显示改变
      return (
        <span>
          {username} 在 【{elementName}】中将 <em>{removeHTML(showOldVal)}</em> 移除
        </span>
      )
    } else {
      return (
        <span>
          {username} 将 【{elementName}】 <em>{removeHTML(showOldVal)}</em> 修改为{' '}
          <em>{removeHTML(showNewVal)}</em>
        </span>
      )
    }
  } else if (type == 2 && newElementName != null) {
    return (
      <span>
        {username} 移除了 【{elementName}】 <em>{removeHTML(newElementName)}</em>
      </span>
    )
  } else {
    return <span></span>
  }
}

// 字段筛选
const FileterData = ({
  dataNew,
  dataOld,
  baseFormId,
  changeChecked,
}: {
  dataNew: any
  dataOld: any
  baseFormId: any
  changeChecked: (value: any) => void
}) => {
  const [filterDatas, setFilterStatus] = useState<any>({
    filterState: false,
    viewTitleModels: [],
    filterNew: [],
    filterOld: [],
  })
  useEffect(() => {
    setFilterStatus({
      filterState: false,
      viewTitleModels: [],
      filterNew: dataNew,
      filterOld: dataOld,
    })
  }, [dataOld])

  //选择多选后处理
  const changeCheckBoxSel = (e: any) => {
    const _uuid = e.target.value.uuid
    const _type = e.target.value.type
    const _checked = e.target.checked
    let checkSel = []

    if (!_checked && filterDatas.filterNew.length === 1) {
      message.error('请至少保留查看一个字段')
      return false
    }

    if (!_checked) {
      // 取消选中
      checkSel = _uuid
        ? filterDatas.filterNew.filter((item: { uuid: any }) => item.uuid !== _uuid)
        : filterDatas.filterNew.filter((item: { type: any }) => item.type !== _type)
    } else {
      // 选中
      checkSel = [...filterDatas.filterNew, e.target.value]
    }

    findLocalBaseFormMsg().then((localRes: any) => {
      if (localRes) {
        let _arr: any = ''
        const _datas: any = hasIn(localRes, baseFormId)
        if (_datas.isIn) {
          _arr = JSON.parse(_datas.datas.field)
        }
        // 取消选中 添加到本地
        if (_checked) {
          for (let i = 0; i < _arr.length; i++) {
            if (
              (e.target.value.uuid && _arr[i]?.uuid === e.target.value.uuid) ||
              (!e.target.value.uuid && e.target.value.type == _arr[i].type)
            ) {
              _arr.splice(i, 1)
              break
            }
          }
        } else {
          _arr.push(e.target.value)
        }
        upateLocalLoginMsg(_datas.datas, _arr)
      }
    })

    checkSel = checkSel.sort(sortData)
    setFilterStatus({ ...filterDatas, viewTitleModels: checkSel, filterNew: checkSel })
    changeChecked({ viewTitleModels: checkSel, filterNew: checkSel })
  }

  const sortData = (a: any, b: any) => {
    return a.position - b.position
  }

  return (
    <div className="checkBox_box">
      <Checkbox.Group value={filterDatas.filterNew}>
        {filterDatas.filterOld?.map((item: { uuid: any; title: React.ReactNode }, index: number) => (
          <Row key={index}>
            <Col>
              <Checkbox
                key={index}
                value={item}
                name={item.uuid}
                onChange={(e: any) => {
                  changeCheckBoxSel(e)
                }}
              >
                {htmlDecode(item.title, item.uuid)}
              </Checkbox>
            </Col>
          </Row>
        ))}
      </Checkbox.Group>
    </div>
  )
}

/**
 * 筛选标题
 */
const getNameBytype = (type: string) => {
  if (type === 'input' || type === 'textarea' || type === 'form_serial_number') {
    return '文字'
  } else if (type === 'time' || type === 'dateRange' || type === 'input_time' || type === 'update_time') {
    return '时间'
  } else if (type === 'peoSel' || type === 'input_person' || type === 'apply_person') {
    return '人员'
  } else if (type === 'deptSel' || type === 'apply_person_dept') {
    return '部门'
  } else if (type === 'roleSel') {
    return '岗位'
  } else if (type === 'back_form_name') {
    return '回写表单'
  } else if (type === 'create_time') {
    return '发起时间'
  }
}

//渲染自定义筛选弹窗
const RenderFilterModal = ({
  setSelectedKeys,
  selectedKeys,
  confirm,
  handleFunc,
  type,
  uuid,
  teamId,
  clearFilters,
}: {
  setSelectedKeys: any
  selectedKeys: any
  confirm: any
  handleFunc: any
  type: string
  uuid: string
  teamId: number
  clearFilters: any
}) => {
  //是否显示包含不包含
  const showSelect =
    type === 'input' ||
    type === 'textarea' ||
    type === 'input_person' ||
    type === 'deptSel' ||
    type === 'roleSel' ||
    type === 'peoSel' ||
    type === 'form_serial_number' ||
    type === 'apply_person_dept' ||
    type === 'apply_person' ||
    type === 'back_form_name'
      ? true
      : false
  //是否显示日期输入框
  const showDateInput =
    type === 'time' ||
    type === 'dateRange' ||
    type === 'input_time' ||
    type === 'update_time' ||
    type === 'create_time'
  //是否包含
  const [isContain, setIsContain] = useState('0')
  //是否显示选择人员弹窗
  const [visible, setVisible] = useState(false)
  //选择类型
  const [findType, setFindType] = useState(0)

  //修改包含不包含赋值
  useEffect(() => {
    if (showSelect && selectedKeys.length !== 0) {
      setSelectedKeys([{ ...selectedKeys[0], contain: isContain }])
    }
  }, [isContain])

  //弹窗选择类型
  const showSelectModal = (type: string) => {
    if (type === 'input_person' || type === 'peoSel' || type === 'apply_person') {
      setFindType(0)
    } else if (type === 'deptSel' || type === 'apply_person_dept') {
      setFindType(3)
    } else {
      setFindType(31)
    }
    setVisible(true)
  }

  //确定选择人员
  const selectedChange = (data: any) => {
    const valueArr: any = []
    const filterArr = data.map((item: any) => {
      if (type === 'deptSel' || type === 'apply_person_dept') {
        valueArr.push(`"deptId":"${item.curId}"`)
        return {
          deptId: item.curId,
          deptName: item.curName,
        }
      } else if (type === 'roleSel') {
        valueArr.push(`"roleId":"${item.curId}"`)
        return {
          deptId: item.deptId,
          deptName: item.deptName,
          roleId: item.roleId,
          roleName: item.roleName,
        }
      } else if (type === 'input_person' || type === 'apply_person') {
        valueArr.push(`${item.curId}`)
        return {
          userId: item.userId,
          userName: item.userName,
          account: item.account,
        }
      } else {
        valueArr.push(`"userId":"${item.curId}"`)
        return {
          userId: item.userId,
          userName: item.userName,
          account: item.account,
        }
      }
    })
    const realVal = type === 'input_person' ? valueArr.join(',') : valueArr.join('<#separate#>')
    setSelectedKeys([{ contain: isContain, type, uuid, value: realVal, filterArr }])
    setVisible(false)
  }

  //外部删除已选择
  const delSelectUser = (delId: number, type: string) => {
    const newValue: any = []
    let newSelectKeys = []
    if (type === 'deptSel' || type === 'apply_person_dept') {
      newSelectKeys = selectedKeys[0].filterArr.filter((item: { deptId: number }) => item.deptId !== delId)
    } else if (type === 'roleSel') {
      newSelectKeys = selectedKeys[0].filterArr.filter((item: { roleId: number }) => item.roleId !== delId)
    } else {
      newSelectKeys = selectedKeys[0].filterArr.filter((item: { userId: number }) => item.userId !== delId)
    }
    newSelectKeys.map((item: any) => {
      if (type === 'deptSel' || type === 'apply_person_dept') {
        newValue.push(`"deptId":"${item.deptId}"`)
      } else if (type === 'roleSel') {
        newValue.push(`"roleId":"${item.roleId}"`)
      } else if (type === 'input_person') {
        newValue.push(`${item.roleId}`)
      } else {
        newValue.push(`"userId":"${item.userId}"`)
      }
    })
    setSelectedKeys([
      {
        contain: isContain,
        type,
        uuid,
        value: type === 'input_person' ? newValue.join(',') : newValue.join('<#separate#>'),
        filterArr: newSelectKeys,
      },
    ])
  }
  //处理回显数据
  const showSelectUsers =
    selectedKeys.length !== 0 &&
    (type === 'input_person' ||
      type === 'deptSel' ||
      type === 'roleSel' ||
      type === 'peoSel' ||
      type === 'apply_person' ||
      type === 'apply_person_dept')
      ? getShowUsers(selectedKeys[0].filterArr, type)
      : []
  let showTypeTxt = '联系人'
  if (findType == 3) {
    showTypeTxt = '部门'
  } else if (findType == 31) {
    showTypeTxt = '岗位'
  }
  return (
    <div style={{ padding: 8, overflow: 'hidden' }}>
      <div className="title" style={{ height: 40, display: 'flex', alignItems: 'center' }}>
        <span style={{ flex: 1, fontWeight: 'bold', fontSize: 14 }}>{getNameBytype(type)}</span>
        {showSelect && (
          <Select
            bordered={false}
            value={selectedKeys.length !== 0 ? selectedKeys[0].contain : isContain}
            onChange={value => setIsContain(value)}
            style={{ float: 'right', width: 75 }}
          >
            <Select.Option value="0">包含</Select.Option>
            <Select.Option value="1">不包含</Select.Option>
          </Select>
        )}
      </div>
      {showDateInput && (
        <RangePicker
          style={{ display: 'flex' }}
          format={'YYYY/MM/DD'}
          value={
            selectedKeys.length !== 0
              ? [
                  moment(selectedKeys[0].value.split('-')[0], 'YYYY/MM/DD'),
                  moment(selectedKeys[0].value.split('-')[1], 'YYYY/MM/DD'),
                ]
              : null
          }
          allowClear={false}
          onChange={(_dates, dateStrings) => {
            setSelectedKeys([{ type, uuid, value: dateStrings.join('-') }])
          }}
        />
      )}
      {(type === 'input_person' ||
        type === 'deptSel' ||
        type === 'roleSel' ||
        type === 'peoSel' ||
        type === 'apply_person_dept' ||
        type === 'apply_person') && (
        <div
          onClick={() => {
            showSelectModal(type)
          }}
          style={{ width: 250, minHeight: 60, padding: 10, border: '1px solid #ccc', borderRadius: 4 }}
        >
          {showSelectUsers.length !== 0 &&
            showSelectUsers.map((item: any) => {
              return (
                <Tag
                  key={item.curId}
                  onClose={(e: { preventDefault: () => void }) => {
                    e.preventDefault()
                    delSelectUser(item.curId, type)
                  }}
                  closable
                  style={{ marginBottom: 6 }}
                >
                  {item.curName}
                </Tag>
              )
            })}
        </div>
      )}
      {(type === 'input' || type === 'textarea' || type === 'form_serial_number') && (
        <Input
          placeholder={'请输入关键字筛选'}
          value={selectedKeys.length !== 0 ? selectedKeys[0].value : ''}
          onChange={e => setSelectedKeys([{ contain: isContain, type, uuid, value: e.target.value }])}
        />
      )}
      <Button
        type="primary"
        onClick={e => {
          e.preventDefault()
          handleFunc(selectedKeys, confirm)
        }}
        style={{ float: 'right', marginTop: 8 }}
      >
        确定
      </Button>
      <Button
        onClick={e => {
          e.preventDefault()
          handleFunc([{ uuid: uuid, type: type, value: '' }], confirm, clearFilters)
          setIsContain('0')
        }}
        style={{ float: 'right', marginTop: 8, marginRight: 10 }}
      >
        重置
      </Button>
      {visible && (
        <SelectMemberOrg
          param={{
            visible: visible,
            allowTeamId: [teamId],
            selectList: showSelectUsers,
            findType: findType,
            fliterByType: {
              '1': {
                show: true,
                text: '按组织架构选择',
              },
              '2': {
                show: findType != 3 && findType != 31,
                text: '按角色选择',
              },
              '3': {
                show: true,
              },
              '4': {
                show: true,
                text: `常用${showTypeTxt}`,
              },
            },
            onSure: (datas: any) => {
              selectedChange(datas)
            },
          }}
          action={{
            setModalShow: setVisible,
          }}
        />
      )}
    </div>
  )
}

//处理数据参数，回显选择人员部门岗位
const getShowUsers = (arr: any, type: string) => {
  if (!arr) {
    return []
  }
  const newArr = arr.map((item: any) => {
    if (type === 'deptSel' || type === 'apply_person_dept') {
      return {
        curId: item.deptId,
        curName: item.deptName,
        deptId: item.deptId,
        deptName: item.deptName,
      }
    } else if (type === 'roleSel') {
      return {
        curId: item.roleId,
        curName: item.roleName,
        roleId: item.roleId,
        roleName: item.roleName,
        deptId: item.deptId,
        deptName: item.deptName,
      }
    } else {
      return {
        curId: item.userId,
        curName: item.userName,
        userId: item.userId,
        userName: item.userName,
        account: item.account,
      }
    }
  })
  return newArr
}

/**
 * 渲染业务数据表格
 */
const RenderTableData = ({
  viewTitle,
  dataMap,
  viewBottom,
  selTab,
  loading,
  tableChange,
  setCustomFilter,
  sortedInfo,
  selelctForm,
  tableRef,
  teamId,
  selectedRowKeys,
  setSelectedRowKeys,
  queryFormDetaileCall,
  controlData,
  formLogData,
  isUpdate,
  refreshTable,
}: any) => {
  //自适应表格高度
  const [windowHeight, setWindowHeight] = useState(0)
  //是否显示底表详情弹窗
  const [showBusinessDetail, setShowBusinessDetail] = useState(false)
  //数据详情loading
  const [detailLoading, setDetailLoading] = useState(false)
  //详情id
  const [detailId, setDetailId] = useState<any>(null)
  useEffect(() => {
    // 初始化多语言配置
    loadLocales()
    setWindowHeight(window.innerHeight)
    window.addEventListener('resize', function() {
      setWindowHeight(this.window.innerHeight)
    })
    return () => {
      window.removeEventListener('resize', function() {})
    }
  }, [])
  const handleFilter = (selectVals: any, confirm: any, clearFilters?: any) => {
    confirm()
    setCustomFilter(selectVals, clearFilters)
    clearFilters ? clearFilters() : ''
  }
  const { baseFormId, orgId } = selelctForm
  const _viewTitle = viewTitle || []
  //列数据
  const Columns = _viewTitle.map((item: { title: any; uuid: any; type: string; numberTransform: number }) => {
    const _txt = htmlDecode(item.title, item.uuid)
    const paramColumn: any = {
      title: _txt,
      dataIndex: item.uuid,
      key: item.uuid,
      width: 200,
      align: 'center',
      type: item.type,
      filterIcon: (filtered: any) => {
        // return <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
        return <em className={`Search_filter ${filtered ? 'hover' : ''}`}></em>
      },
      numberTransform: item.numberTransform == 1 ? true : false,
      // filteredValue:
      //   filteredInfo &&
      //   ((item.uuid && filteredInfo.uuid && filteredInfo.uuid === item.uuid) ||
      //     (!filteredInfo.uuid && filteredInfo.type === item.type))
      //     ? [filteredInfo]
      //     : null,
      render: (text: any, record: any) => {
        if (record[item.uuid] && $tools.isJsonString(record[item.uuid])) {
          if (item.type === 'peoSel') {
            //人员选择
            return JSON.parse(record[item.uuid])
              .map((idx: { userName: string }) => {
                return idx.userName
              })
              .join('、')
          } else if (item.type === 'deptSel') {
            //部门选择
            return JSON.parse(record[item.uuid])
              .map((idx: { deptName: string }) => {
                return idx.deptName
              })
              .join('、')
          } else if (item.type === 'roleSel') {
            return JSON.parse(record[item.uuid])
              .map((idx: { deptName: string; roleName: string }) => {
                return idx.deptName + '-' + idx.roleName
              })
              .join('、')
          } else {
            const _txt = htmlDecode(record[item.uuid], item.uuid)
            if (item.type == 'textarea') {
              return <Tooltip title={_txt}><span className="td_line_text">{_txt}</span></Tooltip>
            } else {
              return _txt
            }
          }
        } else if (record[item.type]) {
          const _txt = htmlDecode(record[item.type], item.uuid)
          if (item.type == 'textarea') {
            return <Tooltip title={_txt}><span className="td_line_text">{_txt}</span></Tooltip>
          } else {
            return _txt
          }
        } else {
          const _txt = htmlDecode(text, item.uuid)
          if (item.type == 'textarea') {
            return <Tooltip title={_txt}><span className="td_line_text">{_txt}</span></Tooltip>
          } else {
            return _txt
          }
        }
      },
    }
    if (item.type !== 'peoSel' && item.type !== 'deptSel' && item.type !== 'roleSel') {
      paramColumn.sorter = true
      paramColumn.sortOrder = sortedInfo
        ? ((item.uuid && sortedInfo.columnKey === item.uuid) ||
            (sortedInfo.column && !item.uuid && sortedInfo.column.type === item.type)) &&
          sortedInfo.order
        : null
    }
    if (item.type !== 'formula' && item.type !== 'numval') {
      paramColumn.filterDropdown = (props: any) => {
        return (
          <RenderFilterModal
            {...props}
            handleFunc={handleFilter}
            teamId={teamId}
            type={item.type}
            uuid={item.uuid}
          />
        )
      }
    }
    return paramColumn
  })
  //表格数据处理
  let _dataMap: any = dataMap || []
  if (_viewTitle.length == 0) {
    _dataMap = []
  }

  const tableData = dataMap
    ? _dataMap.map((item: any) => {
        const _item = getColData(item, viewTitle)
        return {
          ..._item,
          key: item.base_form_data_id,
        }
      })
    : []
  //补齐空白
  if (_dataMap.length > 0 && dataMap && tableData && tableData.length < 15) {
    const newLen = 15 - tableData.length
    for (let i = 0; i < newLen; i++) {
      tableData.push(getNoneTableData(viewTitle, tableData.length))
    }
  }

  //点击表格行
  const clickTableRow = (record: any) => {
    const $baseFormId = record.hasOwnProperty('base_form_data_id') ? record['base_form_data_id'] : record['key']
    setDetailId($baseFormId)
    setShowBusinessDetail(true)
    queryFormDetaileCall($baseFormId) //查询数据详情
  }
  //关闭详情
  const closeDetail = () => {
    setShowBusinessDetail(false)
  }

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedRowKeys: any) => {
      //过滤掉没有数据得选项
      // const newKeys = selectedRowKeys.filter(
      //   (item: any) => Object.prototype.toString.call(item) === '[object String]'
      // )
      setSelectedRowKeys(selectedRowKeys)
    },
    getCheckboxProps: (record: any) => {
      if (typeof record.key == 'string') {
        return { disabled: false }
      } else {
        return { disabled: true }
      }
    },
  }

  const saveEditFormData = (baseFormId: any) => {
    //缓存修改业务底表数据
    let changeEditDataList: any[] = []
    const controlItems = [...$('.controlWrapDetile').find('div.controlItem')]
    controlItems.forEach((item: any) => {
      const oldVal = $(item).attr('data-oldval')
      let newVal = $(item).attr('data-newval')
      const _isTrans: any = $(item).attr('data-numbertransform')
      const _decimals = $(item).attr('data-decimals')
      if (_isTrans == 1) {
        // 中文转数字
        const $val = $(item)
          .find('input')
          .val()
        newVal = changeWordToNum(!!newVal ? newVal : $val)
        newVal = newToFix(!!newVal ? newVal : $val, _decimals)
      }
      if (newVal !== undefined && newVal != oldVal) {
        changeEditDataList.push({
          baseFormDataId: parseInt(baseFormId), //底表数据id
          content: newVal, //修改内容
          userName: $store.getState().nowUser, //操作人姓名
          uuid: $(item).attr('data-id'), //UUID,
          elementType: $(item).attr('data-elementtype'),
        })
      }
    })
    if (changeEditDataList.length == 0) {
      return
    }
    const protocol = process.env.API_PROTOCOL
    const host = process.env.API_HOST
    const { loginToken } = $store.getState()
    setDetailLoading(true)
    $.ajax({
      headers: {
        loginToken: loginToken,
      },
      type: 'post',
      dataType: 'json',
      contentType: 'application/json',
      url: `${protocol}${host}/approval/approval/baseForm/updateBaseFormData`,
      data: JSON.stringify(changeEditDataList),
      success: data => {
        setDetailLoading(false)
        if (data.returnCode == 0) {
          message.success('保存成功')
          changeEditDataList = []
          controlItems.forEach((item: any) => {
            if ($(item).attr('data-newval')) {
              $(item).removeAttr('data-newval')
            }
          })
          queryFormDetaileCall(detailId) //刷新数据详情+操作日志
          refreshTable()
          setShowBusinessDetail(false)
        }
      },
      error: (err: any) => {
        setDetailLoading(false)
        message.error(err.returnMessage)
      },
    })
  }

  return (
    <div className="business-table-container" ref={tableRef}>
      <Table
        className={$c('business-main-table')}
        loading={loading}
        bordered={true}
        rowSelection={rowSelection}
        onRow={record => {
          return {
            onClick: event => {
              event.preventDefault()
              if (record.hasOwnProperty('base_form_data_id')) {
                clickTableRow(record)
                filterCombinationValue = []
              }
            },
          }
        }}
        onChange={tableChange}
        tableLayout="fixed"
        scroll={{ x: 'max-content', y: windowHeight - 350 }}
        columns={Columns}
        dataSource={tableData}
        pagination={false}
      ></Table>
      {dataMap && JSON.stringify(viewBottom) != '{}' && (
        <RenderFooterTable viewBottom={viewBottom} viewTitle={viewTitle} baseFormId={baseFormId} />
      )}
      {showBusinessDetail && (
        <Drawer
          visible={showBusinessDetail}
          className="business_drawer_wrap"
          onClose={closeDetail}
          destroyOnClose={true}
          forceRender={true}
          width={'95%'}
        >
          <Tabs defaultActiveKey="1" className="business_detail_tabs">
            <TabPane tab="数据详情" key="1">
              <Spin spinning={detailLoading}>
                <div className="business_detail_tabs_wrap">
                  <div className="business_detail_tabs_wrap_left">
                    <div className="controlBox_room">
                      <div className="controlBox" style={{ flex: 1 }}>
                        <div className="controlWrap controlWrapDetile">
                          <RenderControl
                            data={controlData}
                            type="edit"
                            tearmId={teamId}
                            personTearmId={orgId}
                          />
                        </div>
                        <div className="tablePlugTmpBox" style={{ display: 'none' }}></div>
                      </div>
                    </div>
                    <div className="saveDetileBtn">
                      <Button
                        disabled={!isUpdate}
                        type="primary"
                        style={{ width: '68px' }}
                        onClick={() => saveEditFormData(detailId)}
                      >
                        保存
                      </Button>
                    </div>
                  </div>
                  <div className="business_detail_tabs_wrap_right">
                    <div className="log_room">
                      <Timeline mode="left">
                        {formLogData.map((item: any, index: number) => (
                          <Timeline.Item label={<span>{item.createTime}</span>} key={index}>
                            <RenderFormLog item={item} />
                          </Timeline.Item>
                        ))}
                      </Timeline>
                    </div>
                  </div>
                </div>
              </Spin>
            </TabPane>
            <TabPane tab="回写数据查询" key="2">
              {detailId && (
                <RenderDetailTable
                  baseFormId={baseFormId}
                  baseFormDataId={detailId}
                  teamId={teamId}
                  selectTab={selTab}
                />
              )}
            </TabPane>
          </Tabs>
        </Drawer>
      )}
    </div>
  )
}

//渲染底部数值公式菜单
const RenderBottomDropDown = ({ uuid, value, baseFormId }: any) => {
  const spanRef = useRef<any>(null)

  //底部菜单选项
  const onClick = ({ key, item }: any) => {
    getBottomValue(baseFormId, key, uuid, filterParm).then(value => {
      spanRef.current.innerHTML = `${item.props.title}: ${value}`
    })
  }

  //底部菜单
  const bottomMenu = (
    <Menu onClick={onClick}>
      <Menu.Item key="0" title="求和">
        求和
      </Menu.Item>
      <Menu.Item key="1" title="平均值">
        平均值
      </Menu.Item>
      <Menu.Item key="2" title="最大值">
        最大值
      </Menu.Item>
      <Menu.Item key="3" title="最小值">
        最小值
      </Menu.Item>
    </Menu>
  )

  return (
    <div className="show-numval-select">
      <Dropdown overlay={bottomMenu} trigger={['click']}>
        <a className="ant-dropdown-link" onClick={e => e.preventDefault()}>
          <span ref={spanRef}>求和：{value}</span>
          <CaretUpOutlined style={{ fontSize: 14, color: '#757575', float: 'right' }} />
        </a>
      </Dropdown>
    </div>
  )
}

//渲染底部
const RenderFooterTable = ({ viewTitle, viewBottom, baseFormId }: any) => {
  const columns = viewTitle.map((item: { title: any; uuid: any; type: string }) => {
    return {
      title: item.title,
      dataIndex: item.uuid || item.type,
      key: item.uuid || item.type,
      width: 200,
      type: item.type,
      render: (_text: any, record: any) => {
        if (item.type === 'formula' || item.type === 'numval') {
          // return <RenderBottomDropDown uuid={item.uuid} baseFormId={baseFormId} value={record[item.uuid]} />

          return `求和： ${record[item.uuid]}`
        } else {
          return `已填写： ${record[item.uuid] || record[item.type]}`
        }
      },
    }
  })
  const showViewBottom =
    ([viewBottom] &&
      [viewBottom].map((item: any, index: number) => {
        return {
          ...item,
          key: index,
        }
      })) ||
    []
  const viewAttr = Object.keys(viewBottom)
  return (
    <>
      {viewAttr.length !== 0 && (
        <Table
          className="business-footer-table"
          dataSource={showViewBottom}
          scroll={{ x: 'max-content', y: 60 }}
          tableLayout="fixed"
          columns={columns}
          bordered={true}
          pagination={false}
        ></Table>
      )}
    </>
  )
}

//查询详情数据
const getBackWaiteLog = (
  baseFormId: any,
  baseFormDataId: any,
  viewId: number,
  pagination: any,
  screenModel?: any
) => {
  return new Promise<any>((resolve, reject) => {
    const { loginToken, nowAccount, nowUserId } = $store.getState()
    const param: any = {
      baseFormDataId: baseFormDataId,
      baseFormId: baseFormId,
      viewId,
      pageNo: pagination.pageNo,
      pageSize: pagination.pageSize,
      userAccount: nowAccount,
      userId: nowUserId,
    }
    // screenModel ? (param.screenModels = screenModel) : ''
    screenModel && screenModel.length > 0 ? (param.screenModels = screenModel) : ''
    $api
      .request('/approval/approval/baseForm/findBackWaitStandingBook', param, {
        headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
      })
      .then(resData => {
        resolve(resData.data)
      })
      .catch(err => {
        reject(err)
      })
  })
}

//筛选
const FileterParam = ({ selectedKeys, setSelectedKeys, confirm, clearFilters, handleFilter, item }: any) => {
  //是否包含
  const [isContain, setIsContain] = useState('0')
  const changeCheck = (selectValus: any) => {
    setSelectedKeys([{ ...selectedKeys[0], contain: isContain, type: item.type, value: selectValus.join(',') }])
  }
  //修改包含不包含赋值
  useEffect(() => {
    setSelectedKeys([{ ...selectedKeys[0], contain: isContain }])
  }, [isContain])
  const checkSelecteds = selectedKeys.map((item: { value: any }) => {
    return item.value
  })
  return (
    <div style={{ padding: 8, overflow: 'hidden' }}>
      <div className="title" style={{ height: 40, display: 'flex', alignItems: 'center' }}>
        <span style={{ flex: 1, fontWeight: 'bold', fontSize: 14 }}>回写表单名称</span>
        <Select
          bordered={false}
          value={isContain}
          onChange={value => setIsContain(value)}
          style={{ float: 'right', width: 75 }}
        >
          <Select.Option value="0">包含</Select.Option>
          <Select.Option value="1">不包含</Select.Option>
        </Select>
      </div>
      <Checkbox.Group
        style={{ display: 'flex' }}
        options={allFormsNames}
        // value={checkSelecteds}
        value={checkSelecteds.length > 0 ? checkSelecteds[0]?.split(',') : checkSelecteds}
        onChange={changeCheck}
      ></Checkbox.Group>
      <Button
        type="primary"
        onClick={e => {
          e.preventDefault()
          handleFilter(selectedKeys, confirm)
        }}
        style={{ float: 'right', marginTop: 8 }}
      >
        确定
      </Button>
      <Button
        onClick={e => {
          e.preventDefault()
          // handleFilter([{ value: '' }], confirm, clearFilters)
          handleFilter([{ type: 'back_form_name', uuid: null, value: '' }], confirm, clearFilters)
        }}
        style={{ float: 'right', marginTop: 8, marginRight: 10 }}
      >
        重置
      </Button>
    </div>
  )
}

//详情筛选checkbox
let allFormsNames: any = []
/**
 * 渲染详情table
 */
const RenderDetailTable = ({ baseFormId, baseFormDataId, selectTab, teamId }: any) => {
  //详情数据
  const [detailData, setDetailData] = useState<any>(null)
  //自适应表格高度
  const [windowHeight, setWindowHeight] = useState(0)
  //筛选控制
  const [filterObj, setFilterObj] = useState<any>({
    filteredInfo: [],
    sortedInfo: null,
    isSort: false, //是否是排序
    clearFilters: false, //是否是重置
  })
  const mainTableRef = useRef<any>(null)
  //loading
  const [detailLoading, setDetailLoading] = useState(false)
  //页码
  const [pagination, setPagination] = useState({
    pageNo: 0,
    pageSize: 20,
    total: 0,
  })
  //初始化
  useEffect(() => {
    setWindowHeight(window.innerHeight)
    window.addEventListener('resize', function() {
      setWindowHeight(this.window.innerHeight)
    })
    setDetailLoading(true)
    //请求详情
    getBackWaiteLog(baseFormId, baseFormDataId, selectTab.id, pagination)
      .then(resData => {
        setDetailData(resData)
        setPagination({ ...pagination, total: resData.totalElements })
      })
      .finally(() => {
        setDetailLoading(false)
      })
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      window.removeEventListener('resize', function() {})
    }
  }, [pagination.pageNo, pagination.pageSize])

  useEffect(() => {
    if (filterObj.filteredInfo.length == 0 && !filterObj.sortedInfo && !filterObj.clearFilters) {
      return
    }

    let _customFilterParam = []
    if (filterObj.filteredInfo.length > 0) {
      _customFilterParam = filterObj.filteredInfo.map((item: any) => {
        const param: any = {}
        param.type = item.type
        if (item.type === 'apply_person_dept') {
          param.contain = item.contain
          const valueArr = item.filterArr.map((item: { deptId: any }) => {
            return item.deptId
          })
          param.value = valueArr.join(',')
        } else if (item.type === 'apply_person') {
          param.contain = item.contain
          const valueArr = item.filterArr.map((item: { userId: any }) => {
            return item.userId
          })
          param.value = valueArr.join(',')
        } else if (item.type === 'form_serial_number' || item.type === 'back_form_name') {
          param.contain = item.contain
          param.value = item.value
        } else if (item.type === 'create_time') {
          param.value = item.value
        } else {
          param.contain = item.contain
          param.value = item.value
          param.uuid = item.uuid
        }
        return param
      })
    }
    //排序
    if (filterObj.sortedInfo) {
      const param: any = {
        uuid: filterObj.sortedInfo.field,
      }
      if (filterObj.sortedInfo.order === 'ascend') {
        //升序
        param.sort = 1
        param.type = filterObj.sortedInfo.column.type
      } else if (filterObj.sortedInfo.order === 'descend') {
        //降序
        param.sort = 2
        param.type = filterObj.sortedInfo.column.type
      }
      const _test = filterAssemble(param, _customFilterParam)
      if (_test.isIn) {
        // 如果筛选数组中有则替换
        _customFilterParam[_test.index] = param
      } else {
        // 如果筛选数组中没有则添加
        _customFilterParam.push(param)
      }
    }
    filterCombinationValue = _customFilterParam
    setDetailLoading(true)
    getBackWaiteLog(baseFormId, baseFormDataId, selectTab.id, pagination, _customFilterParam)
      .then(resData => {
        setDetailData(resData)
        setPagination({ ...pagination, total: resData.totalElements })
      })
      .finally(() => {
        setDetailLoading(false)
      })
  }, [filterObj])

  //筛选完成
  const handleFilter = (selectVals: any, confirm: any, clearFilters?: any) => {
    confirm()
    setCustomFilter(selectVals, clearFilters)
    clearFilters ? clearFilters() : ''
  }

  //表格筛选
  const tableChangeEvent = (
    _pagination: any,
    _filters: any,
    sorter: any,
    extra: { currentDataSource: any; action: string }
  ) => {
    if (extra.action === 'sort') {
      setFilterObj({
        ...filterObj,
        sortedInfo: sorter,
        isSort: true,
      })
    }
  }

  const setCustomFilter = (selectVals: any, clearFilters?: any) => {
    const _newArr = filterObj.filteredInfo
    const _isFilter = filterAssemble(selectVals[0], _newArr, filterObj.sortedInfo, clearFilters)
    if (clearFilters) {
      // 重置筛选数组中当前项
      if (_isFilter.isIn) {
        _newArr.splice(_isFilter.index, 1)
      }
    } else {
      // 添加
      if (_newArr.length === 0) {
        _newArr.push(selectVals[0])
      } else {
        if (_isFilter.isIn) {
          // 如果筛选数组中有则替换
          _newArr[_isFilter.index] = selectVals[0]
        } else {
          // 如果筛选数组中没有则添加
          _newArr.push(selectVals[0])
        }
      }
    }

    setFilterObj({
      filteredInfo: _newArr,
      isSort: false,
      sortedInfo: _isFilter.delSor ? null : filterObj.sortedInfo,
      clearFilters: clearFilters ? true : false,
    })
  }

  //所有回写表单名称
  if (filterObj.filteredInfo.length === 0 && !filterObj.sortedInfo) {
    allFormsNames = []
    detailData &&
      detailData.backWaiteLogModels &&
      detailData.backWaiteLogModels.map((item: any) => {
        if (JSON.stringify(allFormsNames).indexOf(item['backFormId']) == -1) {
          allFormsNames.push({
            label: item['back_form_name'],
            value: `${item['backFormId']}`,
          })
        }
      })
  }

  //冲销穿透
  const writeOff = (arr: any[]) => {
    if (selectTab.isPenetrate) {
      //查看详情
      $store.dispatch({ type: 'SET_OPERATEAPPROVALID', data: { isQueryAll: true, ids: arr } })
      $tools.createWindow('ApprovalOnlyDetail')
    } else {
      message.error('暂无穿透权限')
    }
  }

  //详情列
  const columns =
    detailData &&
    detailData.viewTitleModels
      .concat([])
      .reverse()
      .map((item: { title: any; uuid: any; type: string }) => {
        const filterParam: any = {
          title: item.title,
          dataIndex: item.uuid,
          key: item.uuid,
          width: 200,
          align: 'center',
          type: item.type,
          filterIcon: (filtered: any) => {
            return <img src={$tools.asAssetsPath('/images/approval/search.svg')} style={{ marginTop: '65%' }} />
          },
          render: (text: any, record: any) => {
            if (record[item.uuid] && $tools.isJsonString(record[item.uuid])) {
              if (item.type === 'peoSel') {
                //人员选择
                return JSON.parse(record[item.uuid])
                  .map((idx: { userName: string }) => {
                    return idx.userName
                  })
                  .join('、')
              } else if (item.type === 'deptSel') {
                //部门选择
                return JSON.parse(record[item.uuid])
                  .map((idx: { deptName: string }) => {
                    return idx.deptName
                  })
                  .join('、')
              } else if (item.type === 'roleSel') {
                return JSON.parse(record[item.uuid])
                  .map((idx: { deptName: string; roleName: string }) => {
                    return idx.deptName + '-' + idx.roleName
                  })
                  .join('、')
              } else if (item.type === 'numval' && record.chargeAgainst && record.chargeAgainst[item.uuid]) {
                return (
                  <span
                    style={{ color: '#4285f4', textDecoration: 'underline' }}
                    onClick={e => {
                      e.stopPropagation()
                      e.preventDefault()
                      writeOff(record.chargeAgainst[item.uuid])
                    }}
                  >
                    {record[item.uuid]}
                  </span>
                )
              } else {
                if (item.type == 'textarea') {
                  return <Tooltip title={record[item.uuid]}><span className="td_line_text">{record[item.uuid]}</span></Tooltip>
                } else {
                  return record[item.uuid]
                }
              }
            } else if (record[item.type]) {
              if (item.type == 'textarea') {
                return <Tooltip title={record[item.type]}><span className="td_line_text">{record[item.type]}</span></Tooltip>
              } else {
                return record[item.type]
              }
            } else {
              if (item.type == 'textarea') {
                return <Tooltip title={text}><span className="td_line_text">{text}</span></Tooltip>
              } else {
                return text
              }
            }
          },
        }
        if (
          item.type != 'peoSel' &&
          item.type != 'deptSel' &&
          item.type != 'roleSel' &&
          item.type != 'apply_person_dept' &&
          item.type != 'input_person' &&
          item.type != 'apply_person' &&
          item.type != 'back_form_name'
        ) {
          filterParam.sorter = true
          filterParam.sortOrder = filterObj.sortedInfo
            ? ((item.uuid && filterObj.sortedInfo.columnKey === item.uuid) ||
                (filterObj.sortedInfo.column &&
                  !item.uuid &&
                  filterObj.sortedInfo.column.type === item.type)) &&
              filterObj.sortedInfo.order
            : null
        }
        if (item.type !== 'formula' && item.type !== 'numval' && item.type !== 'back_form_name') {
          filterParam.filterDropdown = (props: any) => {
            return (
              <RenderFilterModal
                {...props}
                handleFunc={handleFilter}
                teamId={teamId}
                type={item.type}
                uuid={item.uuid}
              />
            )
          }
        }
        if (item.type === 'back_form_name') {
          filterParam.filterDropdown = ({ selectedKeys, setSelectedKeys, confirm, clearFilters }: any) => {
            return (
              <FileterParam
                selectedKeys={selectedKeys}
                setSelectedKeys={setSelectedKeys}
                confirm={confirm}
                clearFilters={clearFilters}
                handleFilter={handleFilter}
                item={item}
              />
            )
          }
        }

        return filterParam
      })
  //详情展示数据
  const tableData =
    detailData &&
    detailData.backWaiteLogModels &&
    detailData.backWaiteLogModels.map(
      (item: { backWaiteDataMap: any; chargeAgainstIdMap: any }, index: number) => {
        return {
          ...item,
          ...item.backWaiteDataMap,
          chargeAgainst: item.chargeAgainstIdMap,
          key: index,
        }
      }
    )
  //补齐空白行
  if (tableData && tableData.length < 15) {
    const newLen = 15 - tableData.length
    for (let i = 0; i < newLen; i++) {
      tableData.push(getNoneTableData(detailData.viewTitleModels, tableData.length))
    }
  }
  //点击表格行
  const clickTableRow = (record: any) => {
    if (!record.approvalId) {
      return
    }
    if (selectTab.isPenetrate) {
      //查看详情
      $store.dispatch({ type: 'SET_OPERATEAPPROVALID', data: { isQueryAll: false, ids: record.approvalId } })
      $tools.createWindow('ApprovalOnlyDetail')
    } else {
      message.error('暂无穿透权限')
    }
  }

  useEffect(() => {
    //拖动组合
    const tableList = Array.from(mainTableRef.current.querySelectorAll('.ant-table-body'))
    const handleTableScroll = (e: { currentTarget: any }) => {
      const current = e.currentTarget
      tableList.forEach((table: any) => {
        if (table !== current && table.scrollLeft !== current.scrollLeft) {
          table.scrollLeft = current.scrollLeft
        }
      })
    }
    tableList.forEach((table: any) => {
      table.addEventListener('scroll', handleTableScroll)
    })
    return () => {
      tableList.forEach((table: any) => {
        table.removeEventListener('scroll', handleTableScroll)
      })
    }
  }, [detailData])

  return (
    <div className="business-detail-container" ref={mainTableRef}>
      {detailData !== null && (
        <Table
          className={$c('business-main-table', { hasScrollbar: detailData && detailData.backWaiteLogModels })}
          bordered={true}
          loading={detailLoading}
          tableLayout="fixed"
          scroll={{ x: 'max-content', y: windowHeight - 220 }}
          columns={columns}
          dataSource={tableData}
          pagination={false}
          onChange={tableChangeEvent}
          onRow={record => {
            return {
              onClick: event => {
                event.stopPropagation()
                event.preventDefault()
                clickTableRow(record)
              },
            }
          }}
        ></Table>
      )}
      {detailData && detailData.backWaiteLogModels && (
        <RenderFooterTable
          viewBottom={detailData.bottomData}
          viewTitle={detailData.viewTitleModels.concat([]).reverse()}
          baseFormId={selectTab.id}
        />
      )}
      {detailData && detailData.backWaiteLogModels && (
        <Pagination
          showSizeChanger
          current={pagination.pageNo + 1}
          pageSize={pagination.pageSize}
          pageSizeOptions={['5', '10', '20', '30', '50', '100']}
          total={pagination.total}
          onChange={(current, pageSize) => {
            setPagination({ ...pagination, pageNo: current - 1, pageSize: pageSize || 20 })
          }}
          onShowSizeChange={(current, pageSize) => {
            setPagination({ ...pagination, pageNo: current - 1, pageSize: pageSize || 20 })
          }}
        />
      )}
      {detailData === null && (
        <NoneData
          imgSrc={$tools.asAssetsPath('/images/common/report_list_icon.svg')}
          showTxt="暂无详情数据~"
          imgStyle={{ width: 98, height: 71 }}
        />
      )}
    </div>
  )
}

/**
 *
 * @param selectVals 当前筛选数据
 * @param arr 组合筛选数组
 */
const filterAssemble = (selectVals: any, arr: any, filterSortArr?: any, clearFilters?: any) => {
  let isIn = false
  let _index = 0
  const _colId = selectVals.uuid
  const _type = selectVals.type
  const delSor = false
  // arr中是否有排序
  const _hasSort = filterSortArr ? true : false
  for (let i = 0; i < arr.length; i++) {
    if (
      (arr[i].uuid && _colId && arr[i].uuid == _colId && !_hasSort) ||
      ((_colId == null || _colId == undefined) && _type && arr[i].type == _type && !_hasSort)
    ) {
      isIn = true
      _index = i
      break
    }
    if (clearFilters) {
      // 重置
      if (
        (arr[i].uuid && _colId && arr[i].uuid == _colId) ||
        ((_colId == null || _colId == undefined) && _type && arr[i].type == _type)
      ) {
        isIn = true
        _index = i
        break
      }
    }
  }
  return {
    isIn: isIn,
    index: _index,
    delSor: delSor,
  }
}

// 处理大小写
const getColData = (mapData: any, viewTitle: any) => {
  const _formulaVal: any = {}
  viewTitle.map((item: any) => {
    const dataValue = mapData[item.uuid || item.type] || 0
    if (item.numberTransform == 1 && !isNaN(dataValue)) {
      const fix = dataValue && dataValue.split('.')[1] ? dataValue.split('.')[1].length : 0
      _formulaVal[item.uuid || item.type] = init(dataValue, fix)
    } else {
      _formulaVal[item.uuid || item.type] = dataValue || ''
    }
    if (mapData['base_form_data_id']) {
      _formulaVal['base_form_data_id'] = mapData['base_form_data_id'] || ''
    }
  })
  return _formulaVal
}

// 获取转移后的字符(富文本编辑的会带标签)
function htmlDecode(val: any, id: any) {
  if (typeof val == 'string') {
    const _doms = document.createElement('div')
    _doms.innerHTML = val
    _doms.className = 'test' + id
    $('body').append(_doms)
    const _val = $(`.test${id}`).text()
    $(`.test${id}`).remove()
    return _val
  } else {
    return val
  }
}

const revertDateRange = (str: string) => {
  return {
    startTime: str ? str.split('-')[0] : '',
    endTime: str ? str.split('-')[1] : '',
  }
}

// 根据用户名查询本地数据
export const findLocalBaseFormMsg = () => {
  const { nowUserId } = $store.getState()
  return new Promise(resolve => {
    const _data = `SELECT * FROM base_form_data WHERE userId = ${nowUserId}`
    db.all(_data).then((resData: any) => {
      if (resData && resData.length) {
        // 已经存在数据
        resolve(resData)
      } else {
        // 没有数据
        resolve(null)
      }
    })
  })
}

// 插入数据
export const inserteLocalLoginMsg = (params: any) => {
  return new Promise<any>((resolve, reject) => {
    db.run('INSERT INTO base_form_data (id,userId,baseFormId,field) VALUES (?, ?, ?, ?)', [
      null,
      params.userId,
      params.baseFormId,
      JSON.stringify(params.field),
    ])
      .then((res: any) => {
        resolve(res)
      })
      .catch((err: any) => {
        reject(err)
      })
  })
}

// 更新数据
export const upateLocalLoginMsg = (_datas: any, _arr: any) => {
  db.run(`UPDATE base_form_data set baseFormId=?,field=? WHERE userId=?`, [
    _datas.baseFormId,
    JSON.stringify(_arr),
    _datas.userId,
  ])
    .then((res: any) => {
      // 更新数据成功
      console.log('更新数据成功', res)
    })
    .catch((err: any) => {
      // 更新数据失败
      // console.log('更新数据失败')
    })
}

// 当前台账有没有存储在本地数据库
const hasIn = (_arr: any, bid: any) => {
  const { nowUserId } = $store.getState()
  let _isIn = false
  let _datas = ''
  for (let i = 0; i < _arr.length; i++) {
    if (_arr[i].userId === nowUserId && bid === _arr[i].baseFormId) {
      _isIn = true
      _datas = _arr[i]
      break
    }
  }
  return {
    isIn: _isIn,
    datas: _datas,
  }
}

// 后台返回与本地缓存对比
const compareArr = (returnArr: any, localArr: any) => {
  const _returnArr = returnArr.concat([])
  if (returnArr.length === 0 || localArr.length === 0) {
    return returnArr
  }
  for (let i = 0; i < _returnArr.length; i++) {
    for (let j = 0; j < localArr.length; j++) {
      // 当有uuid时对比uuid，没有uuid对比type
      if (
        (_returnArr[i].uuid && _returnArr[i].uuid === localArr[j].uuid) ||
        (!_returnArr[i].uuid && _returnArr[i].type == localArr[j].type)
      ) {
        // _returnArr[i].isCkecked = false
        _returnArr.splice(i, 1)
        if (i > 0) {
          i--
        }
      }
    }
  }
  return _returnArr
}
