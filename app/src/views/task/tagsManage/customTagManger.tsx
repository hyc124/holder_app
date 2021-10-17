import React, { useState, useEffect } from 'react'
import { Modal, Tabs, Input, message } from 'antd'
import NoneData from '@/src/components/none-data/none-data'
import { TagArea, GetCompanyTagsData, InitTabsTags, UpdateCustomTagsData } from './tagComon'
const { TabPane } = Tabs

const RenderItemTag = ({ item, deleteTagItem, updateTagItemName }: any) => {
  const [showInput, setShowInput] = useState(false)
  return (
    <div className="add-tag-box">
      {showInput && (
        <div className="editor-tag-box">
          <Input
            autoFocus
            placeholder="请输入标签名称,最多输入12个字符"
            defaultValue={item.content}
            maxLength={12}
            onBlur={e => {
              updateTagItemName(item, e.target.value)
              setShowInput(false)
            }}
          />
          <span
            className="del-icon editor-del-icon"
            onClick={() => {
              deleteTagItem(item)
              setShowInput(false)
            }}
          ></span>
        </div>
      )}
      {!showInput && (
        <p className="tag-name">
          {item.content}
          <span
            className="icon-none icon-show del-icon editor-del-icon"
            onClick={() => {
              deleteTagItem(item)
            }}
          ></span>
          <span
            className="icon-none icon-show editor-icon editor-del-icon "
            onClick={() => setShowInput(true)}
          ></span>
        </p>
      )}
    </div>
  )
}
const CustomTagManger = ({ visible, modalOk, modalCancel, conpanyId }: any) => {
  const { loginToken } = $store.getState()
  const [defaultValue, setDefaultValue] = useState('') //新增标签
  const [addTagInputShow, setAddTagInputShow] = useState(false) //控制新增输入框显示
  const [newData, setNewData] = useState([])

  //异步操作在这里执行（ajax）
  useEffect(() => {
    if (!visible) return
    //企业id 244

    GetCompanyTagsData(
      {
        typeId: conpanyId,
      },
      loginToken
    ).then((res: any) => {
      // console.log(res)
      const customTagsData: any = JSON.parse(JSON.stringify(InitTabsTags))
      customTagsData[0].data = res
      const newAreaSortTag = TagArea(res)
      customTagsData[1].data = newAreaSortTag[0]
      customTagsData[2].data = newAreaSortTag[1]
      customTagsData[3].data = newAreaSortTag[2]
      customTagsData[4].data = newAreaSortTag[3]

      setNewData(customTagsData)
    })
  }, [visible, conpanyId])

  //发送请求 更新标签项
  const updateTagsData = () => {
    const list: any = [...newData]

    const param = {
      tagList: list[0].data,
      typeId: conpanyId, //企业id 244
    }
    UpdateCustomTagsData(param, loginToken)
      .then(res => {
        const result: any = res
        if (result.returnCode === 0) {
          message.success('保存成功！')
          modalOk()
        } else {
          message.success(result.returnMessage)
        }
      })
      .catch(err => {
        console.error(err)
      })
  }
  //增加新标签
  const pushAddTag = (value: any) => {
    if (!value.replace(/(^\s*)|(\s*$)/g, '')) return
    //验证是否已存在
    const nowData: any = [...newData]
    const isHas = nowData[0].data.filter((item: any) => {
      if (item.content == value) return item
    })

    if (isHas.length > 0) return message.warning('请勿添加重复标签！')
    const timestamp = new Date().getTime()
    const itemData = { content: value, createTime: timestamp }
    nowData[0].data.unshift(itemData)
    setNewData(nowData)
  }
  //删除标签项
  const deleteTagItem = (tag: any) => {
    const newArr = [...newData]
    newArr.forEach((item: any) => {
      item.data.forEach((seItem: any, index: number) => {
        if (seItem.id && seItem.id == tag.id) {
          item.data.splice(index, 1)
        }
        if (!seItem.id && seItem.createTime === tag.createTime) {
          item.data.splice(index, 1)
        }
      })
    })
    setNewData(newArr)
  }

  //更新标签名
  const updateTagItemName = (tag: any, value: any) => {
    // 判断
    if (!value.replace(/(^\s*)|(\s*$)/g, '')) return
    const newArr = [...newData]

    newArr.forEach((item: any) => {
      item.data.forEach((seItem: any) => {
        if (seItem.id && seItem.id == tag.id) {
          seItem.content = value
        }
        if (!seItem.id && seItem.createTime === tag.createTime) {
          seItem.content = value
        }
      })
    })

    setNewData(newArr)
  }
  return (
    <Modal
      className="customModal"
      title="管理自定义标签"
      okText="保存"
      visible={visible}
      onOk={() => {
        updateTagsData()
      }}
      onCancel={() => modalCancel()}
    >
      <div
        className="add-tag"
        onClick={() => {
          setAddTagInputShow(true)
        }}
      >
        新增标签
      </div>
      <Tabs className="tabs-custom" defaultActiveKey="0">
        {newData.map((tab: any, index: number) => (
          <TabPane tab={tab.title} key={index}>
            <div className="custom-container">
              {addTagInputShow && (
                <div className="add-tag-box">
                  <Input
                    autoFocus
                    className="add-tag-ipt"
                    defaultValue={defaultValue}
                    placeholder="请输入标签名称,最多输入12个字符"
                    maxLength={12}
                    onBlur={e => {
                      pushAddTag(e.target.value)
                      setAddTagInputShow(false)
                      setDefaultValue('')
                    }}
                  />
                  {/* <span
                    className="del-icon"
                    onClick={() => {
                      setAddTagInputShow(false)
                    }}
                  ></span> */}
                </div>
              )}
              {tab.data.length == 0 && (
                <NoneData
                  imgSrc={$tools.asAssetsPath('/images/noData/no_task_org_child.png')}
                  showTxt="暂无标签"
                  imgStyle={{ width: 80, height: 76 }}
                />
              )}
              {tab.data.map((data: any, index: number) => (
                <div key={index} className="tag-box ">
                  <RenderItemTag
                    item={data}
                    deleteTagItem={deleteTagItem}
                    updateTagItemName={updateTagItemName}
                  />
                </div>
              ))}
            </div>
          </TabPane>
        ))}
      </Tabs>
    </Modal>
  )
}

export default CustomTagManger
