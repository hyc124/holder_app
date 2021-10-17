/**
 * @description  draggable polyfill
 * @author       XboxYan
 * @email        yanwenbin1991@live.com
 * @github       https://github.com/XboxYan/draggable-polyfill
 * @license      MIT
 */

/**
 * draggable polyfill
 */
(function () {
    if ("setDragImage" in window.DataTransfer.prototype && document.body.animate) {
        var cloneObj = null;
        var offsetX = 0;
        var offsetY = 0;
        var startX = 0;
        var startY = 0;
        var dragbox = null;
        var axis, _axis;
        var previewImage = new Image();
        let getNowArr = []
        var getBeforeX = 0 //初始偏移位置
        // var nowOffsetWidth = 0 //拖动的宽度
        var nowOffsetHeight = 0 //拖动的高度
        previewImage.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' %3E%3Cpath /%3E%3C/svg%3E";
        var styles = document.createElement("style");
        styles.type = "text/css";
        styles.textContent = '[dragging]{position:static!important;box-sizing:border-box!important;margin:0!important;}\
      .drag-obj{position:fixed;left:0;top:0;z-index:1001;pointer-events:none;}'
        document.querySelector('head').appendChild(styles);
        HTMLElement.prototype.initDraggable = function () {
            this.init = true;
            this.addEventListener('dragstart', function (ev) {
                dragbox = this;
                dragbox.dragData = {};
                getNowArr = []
                if (dragbox.parentNode.children && dragbox.parentNode.children.length > 0) {
                    dragbox.parentNode.children.forEach((item) => {
                        if (item.getAttribute('data-mainid') == dragbox.getAttribute('data-mainid')) {
                            getNowArr.push(item)
                        }
                    })
                }
                if (dragbox.getElementsByClassName('part_name_input').length > 0 || dragbox.getElementsByClassName('show_percent').length > 0 || getNowArr.length < 2) {
                    return
                }
                axis = dragbox.getAttribute('axis');

                _axis = axis;
                ev.dataTransfer.setData('text', '');
                ev.dataTransfer.setDragImage(previewImage, 0, 0);
                var rect = this.getBoundingClientRect();
                var left = rect.left;
                var top = rect.top;
                getBeforeX = rect.left
                startX = ev.clientX;
                startY = ev.clientY;
                offsetX = startX - left;
                offsetY = startY - top;
                this.style.transition = 'none';
                cloneObj = document.createElement('TABLE');
                var fakeObj = this.cloneNode(true);
                fakeObj.style.width = this.offsetWidth + 'px';

                if (this.offsetHeight > 80) {
                    fakeObj.style.height = this.offsetHeight - 32 + 'px';
                } else {
                    fakeObj.style.height = this.offsetHeight + 'px';
                }
                // nowOffsetWidth = this.offsetWidth
                fakeObj.style.transform = 'translate3d(0,0,0)';
                fakeObj.setAttribute('dragging', '');
                cloneObj.appendChild(fakeObj);
                cloneObj.className = 'drag-obj';
                cloneObj.style = 'transform:translate3d( ' + left + 'px ,' + top + 'px,0);width:' + this.offsetWidth + 'px;';
                document.body.appendChild(cloneObj);
            })
            this.addEventListener('dragend', function (ev) {
                if (cloneObj) {
                    // var rect = this.getBoundingClientRect();
                    document.body.removeChild(cloneObj);
                    cloneObj = null;
                    dragbox.dragData = null;
                }
            })
        };
        document.addEventListener('dragover', function (ev) {
            if (cloneObj) {
                var left = ~~(ev.clientX - offsetX);
                var top = ~~(ev.clientY - offsetY);
                if (ev.shiftKey || axis) {
                    if (_axis === 'X') {
                        top = ~~(startY - offsetY);
                    } else if (_axis === 'Y') {
                        left = ~~(startX - offsetX);
                    } else {
                        _axis = ~~Math.abs(ev.clientX - startX) > ~~Math.abs(ev.clientY - startY) && 'X' || ~~Math.abs(ev.clientX - startX) < ~~Math.abs(ev.clientY - startY) && 'Y' || '';
                    }
                } else {
                    _axis = '';
                }
                startX = left + offsetX;
                startY = top + offsetY;
                let maxheight = top
                if (getNowArr.length > 0) {
                    nowOffsetHeight = getNowArr[0].getBoundingClientRect().top
                    maxheight = getNowArr[getNowArr.length - 1].getBoundingClientRect().top
                }
                // 计算可移动位置的大小， 保证元素不会超过可移动范围
                // 此处就是父元素的宽度减去子元素宽度
                // var width = document.body.clientWidth - dragbox.parentNode.clientWidth
                // var height = dragbox.parentNode.clientHeight
                console.log(dragbox)
                // min方法保证不会超过右边界，max保证不会超过左边界
                left = Math.min(Math.max(0, getBeforeX), getBeforeX)
                top = Math.min(Math.max(nowOffsetHeight, top), maxheight)
                cloneObj.style.transform = 'translate3d( ' + left + 'px ,' + top + 'px,0)';
                dragbox.dragData.left = left;
                dragbox.dragData.top = top;
            }
        })

        var observer = new MutationObserver(function (mutationsList) {
            mutationsList.forEach(function (mutation) {
                var target = mutation.target;
                switch (mutation.type) {
                    case 'childList':
                        target.querySelectorAll('.kr_content_tr').forEach(function (el) {
                            if (!el.init) {
                                el.initDraggable();
                            }
                        });
                        break;
                    default:
                        break;
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });

        //inject
        document.querySelectorAll('.kr_content_tr').forEach(function (el) {
            if (!el.init) {
                el.initDraggable();
            }
        });
    }
})();
