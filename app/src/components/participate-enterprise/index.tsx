//选择参与企业
import React, { useState, useEffect, useRef } from 'react'
import Modal from 'antd/lib/modal/Modal'
import './enterprise.less'
import { Button, Input, Avatar, Checkbox, Radio } from 'antd'
import { requestApi } from '@/src/common/js/ajax'
import $c from 'classnames'
// 创建上下文
export const { Provider, Consumer } = React.createContext([])

const ParticipateEnterprise = (props: { param: any; action: any }) => {
  const defaults = {
    nowAccount: $store.getState().nowAccount,
    nowUserName: $store.getState().nowUser,
    nowUserId: $store.getState().nowUserId,
    teamId: '',
  }
  const [searchText, setSearchText] = useState('')
  const [searchlist, setSearchlist] = useState([])
  const [searabnormal, setsearabnormal] = useState(false)
  const [verifyshow, setVerifyshow] = useState(false)
  const [pitchlist, setPitchlist] = useState<any>([])
  // 外部参数
  const PoropParam = props.param
  // 外部方法
  const PoropAction = props.action
  // 合并参数
  const options = { ...defaults, ...PoropParam }
  const ref = React.createRef()
  // 点击取消
  const handleCancel = () => {
    PoropAction.visible(false)
  }
  // 点击确定
  const handleOk = () => {
    PoropAction.visible(false)
    PoropAction.onOk && PoropAction.onOk(pitchlist)
    PoropParam.onOk && PoropParam.onOk(pitchlist)
  }
  //搜索内容
  const searchContent = (e: any) => {
    e.persist()
    setsearabnormal(false)
    setSearchText(e.target.value)
    if (e.target.value == '') {
      setVerifyshow(false)
    }
  }
  //查询搜索内容
  const getSearch = () => {
    if (!searchDataList()) {
      setsearabnormal(false)
      setSearchlist([])
      return
    }
    const param = {
      account: searchText,
      orgId: options.orgId,
      notOrgIds: [...options.notOrgIds],
    }
    $api
      .request('/team/enterpriseRoleInfo/findEnterpriseByAccount', param, {
        headers: { loginToken: $store.getState().loginToken, 'Content-Type': 'application/json' },
      })
      .then((res: any) => {
        if (res.returnCode == 0) {
          const list = res.dataList || []
          if (list.length == 0) {
            setsearabnormal(true)
          } else {
            setsearabnormal(false)
          }
          setSearchlist(list)
        }
      })
      .catch(res => {
        setsearabnormal(true)
        setSearchlist([])
      })
  }
  //验证邮箱及及手机号码
  const searchDataList = () => {
    let isrun = true
    const checkEmail = /^([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+@([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+\.[a-zA-Z]{2,4}$/
    const checkPhone = /^[1][1,2,3,4,5,6,7,8,9][0-9]{9}$/
    const val = searchText
    if (!(val.length == 11 && checkPhone.test(val)) && !checkEmail.test(val)) {
      setVerifyshow(true)
      isrun = false
    } else {
      setVerifyshow(false)
      isrun = true
    }
    return isrun
  }
  //点击选择企业信息
  const selectCmy = (checked: any, data: any) => {
    const list = [...pitchlist]
    if (!checked) {
      const _id = data.id
      for (let i = 0; i < list.length; i++) {
        if (_id == list[i].id) {
          list.splice(i, 1)
          i--
          break
        }
      }
      setPitchlist(list)
    } else {
      const _id = data.id
      for (let i = 0; i < list.length; i++) {
        if (_id == list[i].id) {
          list.splice(i, 1)
          i--
          break
        }
      }
      list.push(data)
      setPitchlist(list)
    }
  }
  const headDef: any = $tools.asAssetsPath('images/task/cmy-normal.png')
  return (
    <Modal
      className="EnterpriseModal"
      visible={PoropParam.visible}
      width={850}
      title={`${
        PoropParam.orignodeUsers.teamName
          ? `修改【${PoropParam.orignodeUsers.teamName}】联系人`
          : '邀请企业及联系人'
      }`}
      onOk={handleOk}
      footer={[
        <Button key="back" onClick={handleCancel}>
          取消
        </Button>,
        <Button key="submit" type="primary" onClick={handleOk}>
          确定
        </Button>,
      ]}
      onCancel={handleCancel}
    >
      <div className="enterpriseContent">
        <div className="member-choose-left">
          <div className="searchBox">
            <Input
              addonAfter={
                <span
                  className={$c({ del: searchText.length > 0 })}
                  onClick={() => {
                    setSearchText('')
                    setVerifyshow(false)
                    setSearchlist([])
                    setsearabnormal(false)
                  }}
                ></span>
              }
              placeholder="请输入进行搜索"
              onChange={searchContent}
              onKeyUp={(e: any) => {
                if (e.keyCode == 13) {
                  getSearch()
                }
              }}
              value={searchText}
            />
            <Button type="primary" onClick={getSearch}>
              匹配企业
            </Button>
          </div>
          <p className={`searchVerify ${verifyshow ? '' : 'hide'}`}>请输入正确的手机号码或邮箱账号</p>
          <Provider value={searchlist}>
            <SearchList
              onSure={(checked: any, data: any) => {
                selectCmy(checked, data)
              }}
              orignodeUsers={options.orignodeUsers}
              selectUserlist={options.selectUserlist || []}
              typeframe={options.typeframe}
              searchText={searchText}
              searabnormal={searabnormal}
            ></SearchList>
          </Provider>
        </div>
        <div className="member-choose-right">
          <p>已选</p>
          <div className="selectCmy">
            <ul>
              {pitchlist.map((item: any, index: number) => {
                return (
                  <li key={index}>
                    <div className="avatars">
                      <Avatar size={32} src={item.profile || headDef} />
                    </div>
                    <div className="text">
                      <p>{item.name}</p>
                      <p>联系人:{item.username}</p>
                      <p></p>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default ParticipateEnterprise

// 子组件渲染搜索列表
export const SearchList = React.forwardRef((props: any, ref) => {
  //解决forwardRef 必须接受两个参数 props and ref
  return (
    // 上下文
    <Consumer>
      {(val: any) => (
        <div className="searchList">
          <p>匹配结果</p>
          <ul>
            {/* props.orignodeUsers.length > 0 修改企业联系人时 企业联系人 */}
            {props.orignodeUsers && props.orignodeUsers.userId != ''
              ? val.map((item: any, index: number) => {
                  let statustext = false
                  if (
                    props.orignodeUsers.userId == item.userId &&
                    props.orignodeUsers.teamid == item.id &&
                    props.typeframe == 'Radio'
                  ) {
                    //已加入任务 不能再次加入
                    statustext = true
                  }
                  // 修改企业联系人
                  return (
                    <li key={index}>
                      <div className="avatars">
                        <Avatar size={32} className={`${!item.profile && 'noPortrait'}`} src={item.profile} />
                      </div>
                      <div className="text">
                        <p>{item.name}</p>
                        <p>联系人:{item.username}</p>
                        {statustext && <span className="red">该联系人已加入任务，不可再次加入</span>}
                      </div>
                      <div className="select">
                        <CheckboxCom
                          typeframe={props.typeframe}
                          onSure={props.onSure}
                          type={0}
                          item={item}
                          statustext={statustext}
                        />
                      </div>
                    </li>
                  )
                })
              : val.map((item: any, index: number) => {
                  // 搜索结果
                  let statustext = ''
                  for (let i = 0; i < props.selectUserlist.length; i++) {
                    if (item.id == props.selectUserlist[i].teamId || item.id == props.selectUserlist[i].id) {
                      //item.userId == props.selectUserlist[i].userId
                      //已邀请
                      statustext = '已邀请'
                    }
                  }
                  return (
                    <li key={index}>
                      <div className="avatars">
                        <Avatar size={32} className={`${!item.profile && 'noPortrait'}`} src={item.profile} />
                      </div>
                      <div className="text">
                        <p>{item.name}</p>
                        <p>联系人:{item.username}</p>
                      </div>
                      <div className="select">
                        {statustext != '' && <span className="statustext">{statustext}</span>}
                        <CheckboxCom
                          typeframe={props.typeframe}
                          onSure={props.onSure}
                          type={1}
                          statustext={statustext}
                          item={item}
                        />
                      </div>
                    </li>
                  )
                })}
            {props.searabnormal && props.searchText != '' && (
              <div className="noseartext">{`没有找到关于"${props.searchText}"的结果`}</div>
            )}
          </ul>
        </div>
      )}
    </Consumer>
  )
})
/**
 * 企业联系人单复选框
 */
const CheckboxCom = ({ typeframe, onSure, type, item, statustext }: any) => {
  const [state, setState] = useState({
    checked: false,
  })
  if (type == 1) {
    return (
      <>
        {typeframe == 'Checkbox' ? (
          <Checkbox
            // ref={ref}
            checked={state.checked}
            disabled={statustext == '已邀请' ? true : false}
            onChange={(e: any) => {
              setState({ ...state, checked: e.target.checked })
              onSure(e.target.checked, item)
            }}
            onClick={(_: any) => {
              if (statustext != '已邀请') {
                setState({ ...state, checked: !state.checked })
                onSure(!state.checked, item)
              }
            }}
          ></Checkbox>
        ) : (
          <Radio
            // ref={ref}
            checked={state.checked}
            disabled={statustext ? true : false}
            onChange={(e: any) => {
              setState({ ...state, checked: e.target.checked })
              onSure(e.target.checked, item)
            }}
            onClick={(_: any) => {
              setState({ ...state, checked: !state.checked })
              onSure(!state.checked, item)
            }}
          ></Radio>
        )}
      </>
    )
  } else {
    return (
      <>
        {typeframe == 'Checkbox' ? (
          <Checkbox
            // ref={ref}
            checked={state.checked}
            onChange={(e: any) => {
              setState({ ...state, checked: !state.checked })
              onSure(e.target.checked, item)
            }}
            // onClick={(e: any) => {
            //   e.stopPropagation()
            //   props.onSure(e.target.checked, item)
            // }}
          ></Checkbox>
        ) : (
          <Radio
            // ref={ref}
            checked={state.checked}
            disabled={statustext ? true : false}
            onChange={(e: any) => {
              setState({ ...state, checked: !state.checked })
              onSure(e.target.checked, item)
            }}
            // onClick={(e: any) => {
            //   e.stopPropagation()
            //   props.onSure(e.target.checked, item)
            // }}
          ></Radio>
        )}
      </>
    )
  }
}
