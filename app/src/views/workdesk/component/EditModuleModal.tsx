import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react'
import { Modal, Tabs, message, Select, Checkbox, Button } from 'antd'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import $c from 'classnames'
import './EditModuleModal.less'
import LittleModuleItem from './LittleModuleItem'
import { useDrag, DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { useSelector, useDispatch } from 'react-redux'
import {
  backDefaultSetting,
  getAllHomeElement,
  getModuleTagSetting,
  getUserTemplateSet,
  saveModuleTagSetting,
} from '../getData'
import { deskBackDefSetting, queryDeskUserTemplateApi } from '../../myWorkDesk/workDeskApi'
const { TabPane } = Tabs
interface EditModalProps {
  onSure?: (data: any) => void
}
interface ElementItemProps {
  moduleId?: number
  elementId: number
  elementCode: string
  elementName: string
  elementTypeName: string
  elementPosition: number
  status: number
  count: number
  isDisabled?: boolean
}
interface TempalteProps {
  templateId: number
  templateName: string
  userId: number
  useState: number
  position: number
  homeModuleModelList: any[]
  modules: any[]
}
interface ItemType {
  moduleId: null
  elementId: number
  elementCode: string
  elementName: string
  elementTypeName: string
  elementPosition: number
  status: number
  count: number
}
const ModuleTheme = ['sky_blue', 'light_green', 'deep_yellow']

const moduleItem = {
  moduleId: null,
  elementId: 0,
  elementCode: '',
  elementName: '',
  elementTypeName: '',
  elementPosition: 0,
  status: 0,
  count: 0,
}

const EditModuleModal = forwardRef(({ onSure }: EditModalProps, ref) => {
  const { nowUserId } = $store.getState()
  //工作台所有模块
  const [homeElement, setHomeElement] = useState<any>([])
  //目标任务模块
  const [targetData, setTargetData] = useState<any>([])
  //OKR模块
  const [okrData, setOkrData] = useState<any>([])
  //关注类模块
  const [projectData, setProjectData] = useState<any>([])
  //关注类模块
  const [followData, setFollowData] = useState<any>([])
  //工作台模块模板
  const [templateData, setTemplateData] = useState<any>([])
  //默认选中的模板key
  const [selectKey, setSelectKey] = useState('1')
  //模块主题常量
  const [moduleTheme, setModuleTheme] = useState(ModuleTheme[0])
  //缓存模板模块position
  const [modulePositionArr, setModulePositionArr] = useState<any>([])
  // 所有state整合
  const [state, setState] = useState<any>({
    visible: false,
    modalTagItemData: {},
    onSure: null,
  })
  // 监听全局store中弹框visible变化
  // const visible = useSelector((store: StoreStates) => store.showEditModal)
  // const dispatch = useDispatch()

  // 打开标签设置组件
  const [openTagConfig, setTagConfig] = useState({
    visible: false,
    ElementItem: null,
  })

  const tagConfigRef: any = useRef(null)

  //监听外部传入visible变化
  // useEffect(() => {
  //   setState({ ...state, visible, modalTagItemData })
  // }, [visible])

  //打开模态框请求接口
  useEffect(() => {
    if (state.visible) {
      initFn()
    }
  }, [state.visible])
  //处理所有模块
  useEffect(() => {
    if (homeElement.length !== 0) {
      setOkrData(homeElement.filter((item: ElementItemProps) => item.elementTypeName === 'OKR类'))
      setTargetData(homeElement.filter((item: ElementItemProps) => item.elementTypeName === '目标任务'))
      setFollowData(homeElement.filter((item: ElementItemProps) => item.elementTypeName === '关注类'))
      setProjectData(homeElement.filter((item: ElementItemProps) => item.elementTypeName === '项目类'))
    }
  }, [homeElement])

  useEffect(() => {
    if (homeElement.length !== 0 && templateData.length !== 0) {
      //获取当前选择模板
      const nowTemplateList: TempalteProps[] = templateData.filter(
        (item: TempalteProps) => item.position === parseInt(selectKey)
      )
      //获取当前选择模板下的所有模块元素
      const selectModel = nowTemplateList[0].modules || nowTemplateList[0].homeModuleModelList
      let allTemElements: Array<ElementItemProps> = []
      //缓存模块POSITION
      const positionArr: any[] = []
      selectModel.map((item: any) => {
        const elementModels = item.elementModels || item.elements
        allTemElements = allTemElements.concat(elementModels)
        positionArr.push(item.modulePosition)
      })
      setModulePositionArr(positionArr)
      //修改左侧模块列表的状态
      homeElement.map((item: ElementItemProps) => {
        if (
          allTemElements.filter((val: ElementItemProps) => val.elementCode === item.elementCode).length !== 0
        ) {
          item.isDisabled = true
        } else {
          item.isDisabled = false
        }
      })
      const newhomeElement = [...homeElement]
      setHomeElement(newhomeElement)
    }
  }, [templateData, selectKey])

  /**
   * 暴露给父组件的方法
   */
  useImperativeHandle(ref, () => ({
    /**
     * 刷新方法
     */
    setState: (paramObj: any) => {
      setState({ ...state, ...paramObj })
    },
  }))
  /**
   * 初始化方法
   */
  const initFn = () => {
    //模块编辑器查询所有模块
    getAllHomeElement().then((resData: any) => {
      setHomeElement(resData)
    })
    //查询当前账号工作台模板
    // getUserTemplateSet 旧版接口
    queryDeskUserTemplateApi({
      userId: nowUserId,
    }).then((resData: any) => {
      const dataList = resData.dataList || []
      const nowKey = dataList.filter((item: { useState: number }) => item.useState === 1)[0].position
      console.log('nowKey-----', nowKey)
      setSelectKey(nowKey.toString())
      // const themeKey = nowKey < 1 ? nowKey : parseInt(nowKey) - 1
      const data: any = tempDataHandel(dataList)
      setTemplateData(data)
      setModuleTheme(ModuleTheme[parseInt(nowKey)])
    })
    // modalTagItemData 存在，则直接显示该标签配置项
    if (state.modalTagItemData) {
      console.log('标签数据------------------------------', state.modalTagItemData)
      setTagConfig({
        visible: true,
        ElementItem: state.modalTagItemData,
      })
    }
  }

  //数据处理 填充为空的模块 防止拖动错位
  const tempDataHandel = (data: any) => {
    const newArr = [...data]
    newArr.map((item: any) => {
      const homeModuleModelList = [...item.modules]
      homeModuleModelList.forEach((item: any, index: number) => {
        item.modulePosition = item.modulePosition || index
        let nowElementModels
        const elementModels = item.elements
        if (elementModels.length == 5) {
          nowElementModels = elementModels.concat(new Array(5 - elementModels.length).fill(moduleItem))
        } else {
          nowElementModels = elementModels.concat(new Array(4 - elementModels.length).fill(moduleItem))
        }
        const listData: Array<ItemType> = []
        nowElementModels.map((_item: any, index: number) => {
          listData.push({
            moduleId: null,
            elementId: _item.elementId,
            elementCode: _item.elementCode,
            elementName: _item.elementName,
            elementTypeName: _item.elementTypeName,
            elementPosition: index,
            status: 0,
            count: 0,
          })
        })
        item.elements = listData
      })
    })
    return newArr
  }

  //切换模板
  const changeModule = (key: string) => {
    // const themeKey = parseInt(key) < 1 ? key : parseInt(key) - 1
    setModuleTheme(ModuleTheme[parseInt(key)])
    setSelectKey(key)
  }
  //判断元素是否在数组中
  const isInArray = (arr: any, val: number) => {
    let isIn = false
    for (let i = arr.length; i--; ) {
      if (arr[i] == val) {
        isIn = true
        break
      }
    }
    return isIn
  }
  //替换数组元素
  const compare = (property: any) => {
    return function(a: any, b: any) {
      const value1 = a[property]
      const value2 = b[property]
      return value1 - value2
    }
  }

  /**
   * 添加modulePosition
   */
  const setDefPosition = ({ dataList, addName }: any) => {
    dataList.forEach((item: any, index: number) => {
      item[addName] = item[addName] || index
    })
  }
  //模块修改更新视图
  const editModal = (type: string, obj: any) => {
    const nowTemplateList: TempalteProps[] = templateData.filter(
      (item: TempalteProps) => item.position === parseInt(selectKey)
    )
    const arr = nowTemplateList[0].modules
    if (type == 'modalType' || type == 'modalName') {
      const newArr: any = []
      arr.forEach((item: any) => {
        const newItem = { ...item }
        if (item.modulePosition == obj.position) {
          if (type.includes('Type')) {
            newItem.moduleType = obj.type
          } else {
            newItem.moduleName = obj.name
          }
        }
        newArr.push(newItem)
      })
      nowTemplateList[0].modules = newArr
    } else if (type == 'addModal') {
      //添加模板模块
      //最多新增模块元素个数个模板
      const _len = homeElement.length
      for (let i = 0; i < _len - 1; i++) {
        if (!isInArray(modulePositionArr, i)) {
          arr.push({
            moduleId: null,
            moduleName: '自定义',
            modulePosition: i,
            elements: [],
            moduleType: parseInt(obj.key),
          })
          modulePositionArr.push(i)
          break
        }
      }
      nowTemplateList[0].modules = arr
    } else if (type == 'dropModal') {
      const newArr: any = []
      const sItem = obj.sPosition
      const tItem = obj.tPosition
      arr.forEach((item: any) => {
        const _itemObj = { ...item }
        if (item.modulePosition == sItem) {
          _itemObj.modulePosition = tItem
        }
        if (item.modulePosition == tItem) {
          _itemObj.modulePosition = sItem
        }
        newArr.push(_itemObj)
      })
      const newSort = newArr.sort(compare('modulePosition'))
      nowTemplateList[0].modules = newSort
    } else if (type == 'dropSModal') {
      const sItem = obj.sourceItem
      const tItem = obj.targetItem
      const nArr: any = []
      arr.forEach((item: any) => {
        const iTem = { ...item }
        if (item.modulePosition == sItem.position) {
          const Models: any = []
          //定位到当前标签所存在的数据模块
          item.elements.forEach((_item: any) => {
            const ele = { ..._item }
            if (_item.elementCode == sItem.elementCode) {
              ele.elementPosition = parseInt(tItem.id)
            }
            if (_item.elementCode == tItem.elementCode) {
              ele.elementPosition = parseInt(sItem.id)
            }
            Models.push(ele)
          })
          const newModels = Models.sort(compare('elementPosition'))
          iTem.elements = newModels
        }
        nArr.push(iTem)
      })
      nowTemplateList[0].modules = nArr
    } else if (type == 'dropRef') {
      //左侧区域拖动到右侧模块
      const newListArr: any = []
      arr.forEach((item: any) => {
        //定位到需要添加数据的模块
        const iTem = { ...item }
        if (item.modulePosition == obj.param.position) {
          //找到对应的模块
          const Models = iTem.elements
          const index = parseInt(obj.param.id)
          Models.splice(index, 1, obj.item) //替换插入的元素
        }
        newListArr.push(iTem)
      })
      nowTemplateList[0].modules = newListArr
    } else if (type == 'delTag') {
      const newArr: any = []
      arr.forEach((item: any) => {
        const iTem = { ...item }
        if (item.modulePosition == obj.position) {
          const Models = iTem.elements
          Models.forEach((element: any, i: number) => {
            if (element.elementCode == obj.code) {
              Models.splice(i, 1, {
                moduleId: null,
                elementId: 0,
                elementCode: '',
                elementName: '',
                elementTypeName: '',
                elementPosition: 0,
                status: 0,
                count: 0,
              })
            }
          })
          //刪除元素
          Models.map((_item: any, i: number) => {
            _item.elementPosition = i
          })
        }
        newArr.push(iTem)
      })
      nowTemplateList[0].modules = newArr
    } else if (type == 'removeModels') {
      //刪除右侧大模块、
      const newArr = [...arr]
      newArr.forEach((item: any, i: number) => {
        if (item.modulePosition == obj.position) {
          newArr.splice(i, 1)
        }
      })
      newArr.map((_item: any, i: number) => {
        _item.modulePosition = i
      })
      nowTemplateList[0].modules = newArr
    } else if (type == 'recovery') {
      //恢复默认
      deskBackDefSetting({ type: selectKey }).then((res: any) => {
        console.log(res)
        if (res) {
          const temData = res.data || {}
          setDefPosition({ dataList: temData.modules || [], addName: 'modulePosition' })
          const newModels: any = [...templateData]
          newModels.forEach((item: any, index: number) => {
            if (item.position == selectKey) {
              newModels.splice(index, 1) //删除对应模块
              newModels.push(temData)
            }
          })
          const newSort = newModels.sort(compare('position'))
          setTemplateData(newSort)
        }
      })
    }
    const newTemplateData = [...templateData]
    setTemplateData(newTemplateData)
  }

  //保存编辑模块
  const saveEditModal = () => {
    const models: any = [...templateData]
    //删除为空的模块标签
    if (selectKey == '1') {
      models[0].useState = 0
      models[1].useState = 1
      models[2].useState = 0
    } else if (selectKey == '2') {
      models[0].useState = 0
      models[1].useState = 0
      models[2].useState = 1
    } else {
      models[0].useState = 1
      models[1].useState = 0
      models[2].useState = 0
    }
    // 判断是否存在空模块，存在则提示不保存
    let isNull = false
    models.forEach((item: any) => {
      if (!item.modules || item.modules.length == 0) {
        isNull = true
      }
    })
    if (isNull) {
      return message.error('模块不能为空')
    }
    setState({ ...state, visible: false })
    state.onSure && state.onSure(models)
    onSure && onSure(models)
  }

  //渲染左侧
  const DroNavitem = ({ dataProps }: any) => {
    const [, drag] = useDrag({
      item: { type: 'drop-item', itemData: dataProps },
    })
    const { elementTypeName, elementCode } = dataProps

    return (
      <span ref={drag} className={$c('tab_item', { tabDisabled: dataProps.isDisabled })}>
        <span className="element-name">{dataProps.elementName}</span>
        {hasTagSetting(elementTypeName, elementCode) && (
          <em
            className="set-icon"
            onClick={() => {
              setTagConfig({ visible: true, ElementItem: dataProps })
            }}
          ></em>
        )}
      </span>
    )
  }
  return (
    <Modal
      title="模块编辑器"
      wrapClassName={`edit-module-modal ${openTagConfig.visible ? 'tag-config-set' : ''}`}
      width={850}
      maskClosable={false}
      centered={true}
      closable={true}
      visible={state.visible}
      destroyOnClose={true}
      onOk={saveEditModal}
      onCancel={() => {
        // 判断是否处于编辑标签配置页面
        if (openTagConfig.visible) {
          tagConfigRef.current &&
            tagConfigRef.current.closeEditModal(1, () => {
              // dispatch({
              //   type: 'SHOW_EDIT_MODAL',
              //   data: { visible: false },
              // })
              setState({ ...state, visible: false })
            })
        } else {
          // dispatch({
          //   type: 'SHOW_EDIT_MODAL',
          //   data: { visible: false },
          // })
          setState({ ...state, visible: false })
        }
      }}
    >
      <div className="edit-module-container flex">
        <DndProvider backend={HTML5Backend}>
          <div className="module-set-left-list">
            {okrData?.length != 0 && (
              <>
                <h4 className="tab_title">OKR</h4>
                <div className="tab_list">
                  {okrData.map((item: ElementItemProps, index: number) => (
                    <div key={index}>
                      <DroNavitem dataProps={item} />
                    </div>
                  ))}
                </div>
              </>
            )}
            {targetData?.length != 0 && (
              <>
                <h4 className="tab_title">任务类</h4>
                <div className="tab_list">
                  {targetData.map((item: ElementItemProps, index: number) => (
                    <div key={index}>
                      <DroNavitem dataProps={item} />
                    </div>
                  ))}
                </div>
              </>
            )}
            <h4 className="tab_title">项目类</h4>
            <div className="tab_list">
              {projectData.map((item: ElementItemProps, index: number) => (
                <div key={index}>
                  <DroNavitem dataProps={item} />
                </div>
              ))}
            </div>
            <h4 className="tab_title">关注类</h4>
            <div className="tab_list">
              {followData.map((item: ElementItemProps, index: number) => (
                <div key={index}>
                  <DroNavitem dataProps={item} />
                </div>
              ))}
            </div>
          </div>
        </DndProvider>
        <div className={`module-set-right-content flex column ${openTagConfig.visible ? 'forcedHide' : ''}`}>
          <h4 className="tab_title" style={{ marginBottom: '4px' }}>
            选择模块
          </h4>
          <Tabs
            className="template-tabs flex-1"
            onTabClick={changeModule}
            activeKey={selectKey}
            onChange={changeModule}
          >
            {templateData.map((item: TempalteProps) => (
              <TabPane tab={item.templateName} key={item.position}>
                <LittleModuleItem
                  data={item.homeModuleModelList || item.modules}
                  moduleTheme={moduleTheme}
                  editModal={editModal}
                />
              </TabPane>
            ))}
          </Tabs>
        </div>
        {openTagConfig.visible && (
          <TagConfigCom ref={tagConfigRef} params={{ openTagConfig, setTagConfig }}></TagConfigCom>
        )}
      </div>
    </Modal>
  )
})
export default EditModuleModal
// 是否选项标签设置按钮
export const hasTagSetting = (elementTypeName: string, elementCode: string) => {
  if (
    // elementTypeName == "OKR类" ||
    (elementTypeName == '目标任务' && elementCode != 'archive_task') ||
    (elementTypeName == '关注类' && elementCode == 'focus_task')
  )
    return true
  return false
}
// 标签排序数据
const sortOptionData = [
  {
    value: 1,
    text: '按截止时间升序排列',
    subText: '（顶部截至时间最早）',
  },
  {
    value: 2,
    text: '按截止时间降序排列',
    subText: '（顶部截止时间最晚）',
  },
  {
    value: 3,
    text: '按创建时间降序排列',
    subText: '（顶部为最后创建任务）',
  },
  {
    value: 4,
    text: '按创建时间升序排列',
    subText: '（顶部为最初创建任务）',
  },
]
// 标签显示配置数据
const checkBoxList: any = [
  {
    value: 1,
    checked: false,
    label: '不展示已完成任务',
    isHide: false,
  },
  {
    value: 2,
    checked: true,
    label: '已完成任务排列在底部',
    isHide: false,
  },
  {
    value: 3,
    checked: true,
    label: '不展示已冻结任务',
    isHide: false,
  },
  {
    value: 4,
    checked: false,
    label: '不展示已延迟任务',
    isHide: false,
  },
]

// 缓存初始配置
let initTempData: any = {}

// 标签配置组件

const TagConfigCom = React.forwardRef((props: any, ref: any) => {
  const { openTagConfig, setTagConfig } = props.params
  const { ElementItem, visible } = openTagConfig
  const [config, setConfig] = useState<any>({ timeSortItem: 1, checkBoxArr: [] })
  const btnComRef: any = useRef(null)

  // ***********************暴露给父组件的方法 start**************************//
  // 此处注意useImperativeHandle方法的的第一个参数是目标元素的ref引用
  useImperativeHandle(ref, () => ({
    //查询是否存在编辑数据
    closeEditModal: goBack,
  }))
  // ***********************暴露给父组件的方法 end**************************//

  useEffect(() => {
    // 获取初期配置
    visible && initConfigFn()
    return () => {
      initTempData = {}
    }
  }, [visible, ElementItem.elementId])

  // 初始配置信息
  const initConfigFn = async () => {
    await getModuleTagSetting({
      userId: $store.getState().nowUserId,
      elementId: ElementItem.elementId,
    }).then((res: any) => {
      console.log(res)
      if (res.returnCode == 0) {
        const { timeSortItem, selectItem } = res.data
        let _selectItem = selectItem || []
        _selectItem = _selectItem.sort()

        checkBoxList.forEach((item: any, index: number) => {
          const _value = item.value
          if (_selectItem.includes(_value)) {
            item.checked = true
          } else {
            item.checked = false
          }

          // 如果 不展示已完成 勾选，则 已完成任务排列顺序不展示
          if (_value == 1) {
            _selectItem.includes(_value)
              ? (checkBoxList[index + 1].isHide = true)
              : (checkBoxList[index + 1].isHide = false)
          }
        })
        setConfig({ ...config, timeSortItem, checkBoxArr: [..._selectItem] })
        initTempData = {
          timeSortItem,
          checkBoxArr: [..._selectItem],
        }
      }
    })
  }

  // 复选框选择变化
  const checkedChange = (e: any, data: any) => {
    if (e['target']['checked']) {
      config.checkBoxArr.push(data.value)
      checkBoxList.forEach((item: any) => {
        if (item.value == data.value) item.checked = true
        // '展示已完成任务' 为选择状态，则 '已完成任务排序' 选择无意义（隐藏该选项）
        if (data.value == 1 && item.value == 2) {
          item.isHide = true
          if (item.checked) {
            config.checkBoxArr.splice(config.checkBoxArr.indexOf(item.value), 1)
            item.checked = false
          }
        }
      })
    } else {
      config.checkBoxArr.splice(config.checkBoxArr.indexOf(data.value), 1)
      checkBoxList.forEach((item: any) => {
        if (item.value == data.value) item.checked = false
        // '展示已完成任务' 放弃选择状态，则 '已完成任务排序' 可选择（显示该选项）
        if (data.value == 1 && item.value == 2) {
          item.isHide = false
          if (!item.checked) {
            config.checkBoxArr.push(item.value)
            item.checked = true
          }
        }
      })
    }
    setConfig({ ...config })
  }

  // 提交保存标签配置
  const saveTagConfig = () => {
    console.log(config)
    // 判断数据是否发生变化
    if (!isChange(initTempData.timeSortItem, config.timeSortItem, initTempData.checkBoxArr, config.checkBoxArr))
      return message.info('暂无修改')
    const { timeSortItem, checkBoxArr } = config
    const param = {
      userId: $store.getState().nowUserId,
      elementId: ElementItem.elementId, //模块标签id
      timeSortItem,
      selectItem: checkBoxArr,
    }
    saveModuleTagSetting(param).then((res: any) => {
      console.log(res)
      if (res.returnCode == 0) {
        message.success('修改成功！')
        initTempData = {
          timeSortItem,
          checkBoxArr: [...checkBoxArr],
        }

        // 更新按钮状态
        btnComRef && btnComRef.current.updateDiffStatus(false)

        // setTagConfig({ visible: true, ElementItem: null })
        // 保存成功配置项，刷新对应模块数据排序
        const { elementCode } = ElementItem
        const _codeDom = $('[data-code=' + elementCode + ']')
        if (
          !_codeDom
            .parent()
            .parent()
            .hasClass('ant-tabs-tab-active')
        )
          return
        // if (elementCode == "okr" || elementCode == "focus_okr") {
        //   // 刷新 okr 数据
        //   okr_updateRefDataFn("", elementCode)
        // } else {
        // 其他数据源
        // refreshOpenPanle(elementCode)
        _codeDom.click()
        // }
      }
    })
  }

  // type: 1(关闭模态框)
  const goBack = (type?: number, callback?: () => void) => {
    if (
      isChange(initTempData.timeSortItem, config.timeSortItem, initTempData.checkBoxArr, config.checkBoxArr)
    ) {
      Modal.confirm({
        title: '提醒',
        icon: <ExclamationCircleOutlined />,
        content: '修改还未保存，确定离开吗？',
        onOk() {
          if (type) {
            setConfig({
              ...initTempData,
            })
            callback && callback()
          }
          setTagConfig({ visible: false, ElementItem: null })
        },
        onCancel() {
          console.log('Cancel')
        },
      })
    } else {
      if (type) callback && callback()
      setTagConfig({ visible: false, ElementItem: null })
    }
  }

  return (
    <div className="module-set-right-content flex column tag-config-box">
      <em className="back-icon" onClick={() => goBack()}>
        →
      </em>
      <h4 className="tab_title" style={{ marginBottom: '4px' }}>
        配置标签：{ElementItem.elementName}
      </h4>
      <span className="sort-label">排序规则</span>
      <Select
        defaultValue={1}
        className=""
        value={config.timeSortItem}
        style={{ width: 340 }}
        onChange={(value: any) => {
          setConfig({
            ...config,
            timeSortItem: value,
          })
        }}
      >
        {sortOptionData.map((item: any, index: number) => {
          return (
            <Select.Option value={item.value} key={index}>
              <span className="option-text">{item.text}</span>
              <span className="sub-option-text">{item.subText}</span>
            </Select.Option>
          )
        })}
      </Select>
      {checkBoxList.map((item: any, index: number) => {
        return (
          <Checkbox
            onChange={(e: object) => checkedChange(e, item)}
            key={item.value}
            checked={item.checked}
            className={item.isHide ? 'forcedHide' : ''}
          >
            <span className="checkbox-label">{item.label}</span>
          </Checkbox>
        )
      })}
      <SaveBtnCom ref={btnComRef} param={{ data: config, callBacks: saveTagConfig }}></SaveBtnCom>
    </div>
  )
})

// 确定按钮
const SaveBtnCom = forwardRef((props: any, ref) => {
  const { data, callBacks } = props.param
  const [isDiff, setDiff] = useState(true) //控制是否变化

  // ***********************暴露给父组件的方法**************************//
  useImperativeHandle(ref, () => ({
    /**
     * 更新按钮状态
     */
    updateDiffStatus: setDiff,
  }))

  useEffect(() => {
    initTempData &&
      JSON.stringify(initTempData) != '{}' &&
      setDiff(
        isChange(initTempData.timeSortItem, data.timeSortItem, initTempData.checkBoxArr, data.checkBoxArr)
      )
  }, [data])

  return (
    <Button
      type="primary"
      disabled={!isDiff}
      htmlType="submit"
      className="submit-button"
      style={{ width: 68 }}
      onClick={callBacks}
    >
      确定
    </Button>
  )
})

// 判断数据变化
const isChange = (timeSortItem1: number, timeSortItem2: number, arr1: any[], arr2: any[]) => {
  if (timeSortItem1 != timeSortItem2) return true
  const res = ArrayIsEqual(arr1, arr2) ? false : true
  return res
}
//判断2个数组是否相等
function ArrayIsEqual(arr1: any[], arr2: any[]) {
  arr1.sort()
  arr2.sort()
  if (arr1 === arr2) {
    //如果2个数组对应的指针相同，那么肯定相等，同时也对比一下类型
    return true
  } else {
    if (arr1.length != arr2.length) {
      return false
    } else {
      //长度相同
      for (const i in arr1) {
        //循环遍历对比每个位置的元素
        if (arr1[i] != arr2[i]) {
          //只要出现一次不相等，那么2个数组就不相等
          return false
        }
      } //for循环完成，没有出现不相等的情况，那么2个数组相等
      return true
    }
  }
}
