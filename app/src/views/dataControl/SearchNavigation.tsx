import { Dropdown, Switch } from 'antd'
import React from 'react'
import '../task/taskManage/searchnavigation.less'

const SearchNavigation = (popos: any) => {
  const onChange = (checked: any) => {
    console.log(`switch to ${checked}`)
    popos.concealOrganization(checked)
  }
  return (
    <div className="search_navigation_box">
      <div>
        <div className="sn_title">{popos.title}</div>
        <div className="content_box">
          <i
            className="search"
            onClick={() => {
              popos.showSearchFn(true)
            }}
          ></i>
          {/* <Dropdown
            trigger={['click']}
            placement="bottomRight"
            overlay={
              <div className="pull-downs-sn">
                <p>自动隐藏组织架构栏</p>
                <Switch checked={popos.pattern ? true : false} onChange={onChange} />
              </div>
            }
          >
            <i className="navig"></i>
          </Dropdown> */}
          {/* <i
            className={`unfold ${popos.pattern == 1 || !popos.from ? 'hide' : ''}`}
            onClick={() => {
              popos.unfoldFn('hide')
            }}
          ></i> */}
        </div>
      </div>
    </div>
  )
}

export default SearchNavigation
