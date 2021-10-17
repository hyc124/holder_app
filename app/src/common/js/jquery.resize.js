/* eslint-disable */
;(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['jquery'], function($) {
      return (root.returnExportsGlobal = factory(jQuery, this))
    })
  } else if (typeof exports === 'object') {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like enviroments that support module.exports,
    // like Node.
    module.exports = factory(require('jquery'), this)
  } else {
    factory(jQuery, this)
  }
})(this, function($, h, c) {
  var a = $([]),
    e = ($.resize = $.extend($.resize, {})),
    i,
    k = 'setTimeout',
    j = 'resize',
    d = j + '-special-event',
    b = 'delay',
    f = 'throttleWindow'
  e[b] = 350
  e[f] = true
  $.event.special[j] = {
    setup: function() {
      if (!e[f] && this[k]) {
        return false
      }
      var l = $(this)
      a = a.add(l)
      $.data(this, d, {
        w: l.width(),
        h: l.height(),
      })
      if (a.length === 1) {
        g()
      }
    },
    teardown: function() {
      if (!e[f] && this[k]) {
        return false
      }
      var l = $(this)
      a = a.not(l)
      l.removeData(d)
      if (!a.length) {
        clearTimeout(i)
      }
    },
    add: function(l) {
      if (!e[f] && this[k]) {
        return false
      }
      var n
      function m(s, o, p) {
        var q = $(this),
          r = $.data(this, d)
        r.w = o !== c ? o : q.width()
        r.h = p !== c ? p : q.height()
        n.apply(this, arguments)
      }
      if ($.isFunction(l)) {
        n = l
        return m
      } else {
        n = l.handler
        l.handler = m
      }
    },
  }
  function g() {
    i = setTimeout(function() {
      a.each(function() {
        var n = $(this),
          m = n.width(),
          l = n.height(),
          o = $.data(this, d)
        if (m !== o.w || l !== o.h) {
          n.trigger(j, [(o.w = m), (o.h = l)])
        }
      })
      g()
    }, e[b])
  }
})
