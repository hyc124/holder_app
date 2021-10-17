import { Button, Checkbox, Modal, Radio, Tooltip } from 'antd'
import React, { forwardRef, useState, useImperativeHandle } from 'react'
import $c from 'classnames'
import { deskModuleListSave } from './workDeskApi'

const CheckboxGroup = Checkbox.Group
/**
 * 选择工作视窗弹框
 */
export const DeskModeModal = forwardRef(
  (
    {
      isFollow,
      getDeskModule,
    }: {
      isFollow?: boolean
      getDeskModule?: any
    },
    ref
  ) => {
    const { nowUserId, followUserInfo } = $store.getState()
    const [winOption, setWinOption] = useState({
      className: 'jyz-window',
      checkValue: 1,
      visible: false,
      selectModuleTypeList: [],
    })

    /**
     * 暴露给父组件的方法
     */
    useImperativeHandle(ref, () => ({
      /**
       * 刷新方法
       */
      setState: (paramObj: any) => {
        setWinOption({ ...winOption, ...paramObj })
      },
    }))

    /**
     * 视窗切换
     * @param e
     */
    const deskModuleChange = (e: any) => {
      const targetVal = e.target.value
      setWinOption({
        ...winOption,
        checkValue: targetVal,
        className: targetVal == 1 ? 'jyz-window' : targetVal == 2 ? 'glz-window' : 'yg-window',
      })
    }
    //保存选择的工作视窗
    const selectModuleType = () => {
      // 旧版接口：/public/homeModule/saveUserTemplate
      // 新版接口
      const url = '/public/workbench/module/initTemplate'
      const queryParams: any = {
        userId: isFollow ? followUserInfo.userId : nowUserId,
      }
      if (url.includes('saveUserTemplate')) {
        const newTypeList = winOption.selectModuleTypeList.map((item: any) => {
          return {
            ...item,
            useState: item.position == winOption.checkValue ? 1 : 0,
          }
        })
        queryParams.homeTemplateModelList = newTypeList
      } else {
        queryParams.type = winOption.checkValue
      }
      deskModuleListSave(queryParams, url).then((res: any) => {
        if (res) {
          setWinOption({ ...winOption, visible: false })
          getDeskModule && getDeskModule() //刷新工作台
        }
      })
    }
    return (
      <Modal
        className="desk_module_window"
        title={<h4 className="desk_module_header_title">请选择工作视窗</h4>}
        centered
        closable={false}
        confirmLoading={true}
        maskStyle={{ background: '#00000085' }}
        visible={winOption.visible}
        footer={null}
        bodyStyle={{ height: '560px' }}
        width={848}
      >
        {winOption.visible ? (
          <>
            <div className="desk_module_option">
              <Radio.Group onChange={deskModuleChange} value={winOption.checkValue}>
                <Radio value={1}>
                  <span className={$c('optSpan', { optionActive: winOption.checkValue == 1 })}>经营者视窗</span>
                </Radio>
                <Radio value={2}>
                  <span className={$c('optSpan', { optionActive: winOption.checkValue == 2 })}>管理者视窗</span>
                </Radio>
                <Radio value={3}>
                  <span className={$c('optSpan', { optionActive: winOption.checkValue == 3 })}>员工视窗</span>
                </Radio>
              </Radio.Group>
            </div>
            <div className={$c(`${winOption.className}`)}></div>
            <div className="desk_module_footer_btn">
              <div className="module_tips">
                选择后你还可以在
                <span>
                  “更多
                  <Tooltip title="更多">
                    <img src={$tools.asAssetsPath('/images/index/module_tips_icon.png')} />
                  </Tooltip>
                  一 编辑模块”
                </span>
                里进行个性化自定义
              </div>
              <Button type="primary" onClick={() => selectModuleType()}>
                确定
              </Button>
            </div>
          </>
        ) : (
          ''
        )}
      </Modal>
    )
  }
)

/**
 * 导入任务选择弹框
 */
export const ImportTaskModal = forwardRef((_: any, ref) => {
  const [state, setState] = useState<any>({
    visible: false,
    checkedList: [],
    onSure: null,
  })

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
   * 确认
   */
  const onSure = () => {
    setState({ ...state, visible: false })
    state.onSure &&
      state.onSure({
        checkedList: state.checkedList,
      })
  }
  return (
    <Modal
      title="导入任务"
      className="addTaskModel"
      visible={state.visible}
      mask={false}
      onOk={() => onSure()}
      onCancel={() => setState({ ...state, visible: false })}
    >
      {state.visible ? (
        <CheckboxGroup
          options={[
            { label: '关注的任务', value: -1 },
            { label: '指派的任务', value: 1 },
            { label: '协同的任务', value: 2 },
            { label: '督办的任务', value: 6 },
          ]}
          value={state.checkedList}
          onChange={(checkedList: any) => setState({ ...state, checkedList: checkedList })}
        />
      ) : (
        ''
      )}
    </Modal>
  )
})
