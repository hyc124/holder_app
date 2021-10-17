import React, { useImperativeHandle, useState } from 'react'
import { Menu } from 'antd'
const { SubMenu } = Menu

interface MenuState {
  visible: boolean
  menuJson: any
  style: any
}
/**
 * 右键事件绑定
 */
export const contextEvent = ({
  nodes,
  menuRef,
  menuJson,
  beforeMenuShow,
}: {
  nodes: any
  menuRef: any
  menuJson?: any
  beforeMenuShow?: (callback: (menuJson: any) => void) => void //右键触发时的回调
}) => {
  const blankClick = (menuJson: any) => {
    //   点击空白处隐藏
    $('body')
      .off('click')
      .on('click', (e: any) => {
        if (!$(nodes).is(e.target) && $(nodes).has(e.target).length == 0) {
          menuRef.current.menuVisible({
            visible: false,
            menuJson,
            style: { pageX: e.pageX, pageY: e.pageY },
          })
          $('body').off('click')
        }
      })
  }
  $(nodes)
    .off('contextmenu')
    .on('contextmenu', (e: any) => {
      e.preventDefault()
      e.stopPropagation()
      // 所有菜单内容一致时，无需权限，首次传入菜单menuJson即可
      if (menuJson && !beforeMenuShow) {
        menuRef.current.menuVisible({
          visible: true,
          menuJson,
          style: { pageX: e.pageX, pageY: e.pageY },
        })
        blankClick(menuJson)
      } else {
        // 右键触发时如果需要根据权限控制菜单内容，则传此回调，在回调中检查权限后组装菜单
        if (beforeMenuShow) {
          beforeMenuShow((menusRes: any) => {
            menuRef.current.menuVisible({
              visible: true,
              menuJson: menusRes,
              style: { pageX: e.pageX, pageY: e.pageY },
            })
            blankClick(menusRes)
          })
        }
      }
    })
}

/**
 * 右键菜单组件
 */
export const ContextMenu = React.forwardRef(
  (
    {
      className,
    }: {
      className?: string
    },
    ref
  ) => {
    const [menuState, setMenuState] = useState<MenuState>({
      visible: false,
      menuJson: [],
      style: { pageX: 0, pageY: 0 },
    })
    // ***********************暴露给父组件的方法 start**************************//
    // 此处注意useImperativeHandle方法的的第一个参数是目标元素的ref引用
    useImperativeHandle(ref, () => ({
      /**
       * 菜单显示隐藏
       */
      menuVisible: ({ visible, menuJson, style }: any) => {
        setMenuState({ visible, menuJson, style })
      },
    }))
    // ***********************暴露给父组件的方法 end**************************//
    const menus = (
      <Menu
        className={`myDropMenu ${className || ''}`}
        selectable={false}
        style={{
          position: 'fixed',
          display: menuState.visible ? 'block' : 'none',
          left: menuState.style.pageX + 'px',
          top: menuState.style.pageY + 'px',
        }}
        // onClick={(menuProp: any) => {
        //   console.log(menuProp);
        // }}
      >
        {menuState.menuJson?.map((item: any, i: number) => {
          if (item.children && item.children.length > 0) {
            return (
              <SubMenu
                key={i}
                title={item.text || ''}
                // onTitleClick={menuClick}
              >
                {item.children?.map((sitem: any, s: number) => {
                  return (
                    <Menu.Item
                      className="myMenuItem"
                      key={i + '_' + s}
                      onClick={() => {
                        // setMenuState({...menuState,visible:false});
                        sitem.onclick && sitem.onclick()
                      }}
                    >
                      {sitem.text || ''}
                    </Menu.Item>
                  )
                })}
              </SubMenu>
            )
          } else {
            return (
              <Menu.Item
                className="myMenuItem"
                key={i}
                onClick={() => {
                  // setMenuState({...menuState,visible:false});
                  item.onclick && item.onclick()
                }}
              >
                {item.text || ''}
              </Menu.Item>
            )
          }
        })}
      </Menu>
    )

    return menus
  }
)
