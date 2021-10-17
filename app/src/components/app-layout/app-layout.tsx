import React from 'react'
import $c from 'classnames'
import './app-layout.less'

export class AppLayout extends React.Component<any, any> {
  render() {
    return (
      <div>
        <div className={$c('flex app-layout', process.platform)}>
          <div className="flex-1 app-content-wrap">
            <div className="app-content flex">{this.props.children}</div>
          </div>
        </div>
      </div>
    )
  }
} // class AppLayout end
