(function () {
var req = (function () {
/*!
 * Require function by TJ Holowaychuk <tj@learnboost.com>
 */

/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(p, parent){
  var path = require.resolve(p)
    , mod = require.modules[path];
  if (!mod) {
    parent = parent || 'root'
    throw new Error('failed to require "' + p + '" from ' + parent);
  }
  if (!mod.exports) {
    mod.exports = {};
    mod.call(mod.exports, mod, mod.exports, require.relative(path));
  }
  return mod.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Resolve `path`.
 *
 * @param {String} path
 * @return {Object} module
 * @api public
 */

require.resolve = function(path){
  var orig = path
    , reg = path + '.js'
    , index = path + '/index'
    , indexjs = index + '.js';
  return require.modules[orig] && orig
    || require.modules[index] && index
    || require.modules[reg] && reg
    || require.modules[indexjs] && indexjs
    || orig;
};

/**
 * Register module at `path` with callback `fn`.
 *
 * @param {String} path
 * @param {Function} fn
 * @api public
 */

require.register = function(path, fn){
  require.modules[path] = fn;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  return function(p){
    if ('.' != p.charAt(0)) return require(p);

    var path = parent.split('/')
      , segs = p.split('/');
    path.pop();

    for (var i = 0; i < segs.length; i++) {
      var seg = segs[i];
      if ('..' == seg) path.pop();
      else if ('.' != seg) path.push(seg);
    }

    return require(path.join('/'), parent);
  };
};

require.register("point/index", function(module, exports, require) {
var util = require('./util')

exports.extend = util.extend

exports.Emitter = require('./emitter')

exports.Model = require('./model')

exports.View = require('./view/view')

exports.filters = require('./view/filters')

exports.endpoint = util.endpoint

exports.mixin = util.mixin

exports.thisFn = util.thisFn

})
require.register("point/util", function(module, exports, require) {
var uid = 0

exports.guid = function (obj) {
    if (obj.__uid) return obj.__uid
    return obj.__uid = ++uid
}

exports.mix = function (target, src) {
    for (var key in src) {
        target[key] = src[key]
    }
    return target
}

exports.extend = function (Klass, parent) {
    if (parent && parent.prototype) {
        Klass.prototype = Object.create(parent.prototype)
    } else if (arguments.length > 1) {
        Klass.prototype = Object.create(parent)
    }
    Klass.use = use
    Klass.extend = function (ChildKlass) {
        ChildKlass = ChildKlass || function () {}
        return exports.extend(ChildKlass, this)
    }
    return Klass
}

function use (proto) {
    switch (typeof proto) {
        case 'function':
            var protoHasEnumerables = false
            for (var key in proto.prototype) {
                this.prototype[key] = proto.prototype[key]
                protoHasEnumerables = true
            }
            if (!protoHasEnumerables)
                proto.apply(this.prototype, Array.prototype.slice.call(arguments, 1))
            break
        case 'string':
            proto = exports.mixin(proto)
            use.apply(this, arguments)
            break
        default:
            for (var key in proto) {
                this.prototype[key] = proto[key]
            }
    }
    return this
}

exports.mixin = function (name) {
    return require('./mixin/' + name)
}

exports.thisFn = function (ctx, prop) {
    var key = '_' + prop
    if (ctx[key]) return ctx[key]
    return ctx[key] = function () {
        ctx[prop].apply(ctx, arguments)
    }
}

var eCache = {}

exports.endpoint = function (type) {
    if (eCache[type] !== undefined) return eCache[type]
    try {
        return eCache[type] = require('./endpoints/' + type)
    } catch (e) {
        return eCache[type] = null
    }
}

})
require.register("point/mixin/collection", function(module, exports, require) {
var guid = require('../util').guid

var proto = exports

proto.add = function (obj) {
    var objects = this._objects || (this._objects = {})
    objects[guid(obj)] = obj
    this.length++
    this.emit('add', obj)
    this.emit('change:length')
    return this
}

proto.remove = function (obj) {
    if (!this._objects) return
    var id = guid(obj)
    if (!this._objects[id]) return
    delete this._objects[id]
    this.length--
    this.emit('remove', obj)
    this.emit('change:length')
    return this
}

proto.forEach = function (cb, ctx) {
    ctx = ctx || this
    for (var key in this._objects) {
        cb.call(ctx, this._objects[key])
    }
    return this
}

proto.onget_length = function () {
    return this.length
}

proto.length = 0
})
require.register("point/mixin/computable", function(module, exports, require) {

module.exports = function (name, deps, fn) {
    var change = 'change:' + name
    var scheduled = '__computable_change_scheduled_' + name
    var cache = '__computable_value_' + name

    this['onget_' + name] = function () {
        if (this[cache] !== undefined) return this[cache]
        return this[cache] = fn.call(this)
    }

    deps.forEach(function (dep) {
        this.on(dep, function () {
            this[cache] = undefined
            if (this[scheduled]) return
            this[scheduled] = true
            var self = this
            setTimeout(function () {
                self[scheduled] = false
                self.emit(change)
            })
        })
    }, this)
}
})
require.register("point/model", function(module, exports, require) {
var Emitter = require('./emitter')

module.exports = Model

function Model () {}

Emitter.extend(Model)

Model.prototype.get = function (attr) {
    var getter = this['onget_' + attr]
    if (getter) return getter.call(this)
    return this._attr && this._attr[attr]
}

Model.prototype.set = function (attr, val) {
    if (typeof attr == 'string') {
        this.__setAttr(attr, val)
    } else {
        for (var key in attr) {
            this.__setAttr(key, attr[key])
        }
    }
}

Model.prototype.__setAttr = function (attr, val) {
    var setter = this['onset_' + attr]
    setter ? setter.call(this, val, attr) : this._set(attr, val)
}

Model.prototype._set = function (attr, val) {
    var a = this._attr
    if (!a) {
        a = this._attr = Object.create(null, {__ui_proto: {value: this}})
    } else if (a.__ui_proto !== this) {
        a = this._attr = Object.create(this._attr, {__ui_proto: {value: this}})
    }
    a[attr] = val
    this.emit('change:' + attr, attr)
}
})
require.register("point/endpoints/foreach", function(module, exports, require) {
var thisFn = require('../util').thisFn

module.exports = ForEach

function ForEach (el) {
    this.el = el
    if (this.template = this.el.firstElementChild) {
        this.el.removeChild(this.template)
    }
    this.views = []
    this.models = []
}

ForEach.prototype.attach = function (col) {
    if (this.col) this.detach()
    this.col = col
    this.col.on('add', thisFn(this, 'add'))
    this.col.on('remove', thisFn(this, 'remove'))
}

ForEach.prototype.detach = function () {
    this.col.off('add', this._add)
    this.col.off('remove', this._remove)
    this.col = null
    this.views.forEach(function (view) {
        view.destroy()
    })
    this.views = []
    this.models = []
}

ForEach.prototype.add = function (obj) {
    var view = new this.ItemView
    if (this.template) view.html = this.template
    view.attach(obj)
    view.render()
    this.views.push(view)
    this.models.push(obj)
    this.el.appendChild(view.el)
    this.resort()
}

ForEach.prototype.remove = function (obj) {
    var index = this.findItem(obj)
    var view = this.views.splice(index, 1)[0]
    view.destroy()
    this.models.splice(index, 1)
}

ForEach.prototype.findItem = function (obj) {
    for (var i = 0; i < this.models.length; i++) {
        if (this.models[i] === obj) return i
    }
    throw new Error('Attempt to remove uncontained object')
}

ForEach.prototype.sort = function (compare) {
    if (typeof compare != 'function')
        throw new Error('You must pass a compare function')
    this.compare = compare
    this.resort()
}

ForEach.prototype.resort = function () {
    if (!this.compare) return
    this.models.sort(this.compare).forEach(function (obj, i) {
        var view = this.views[i]
        if (view.model === obj) return
        view.detach()
        view.attach(obj)
    }, this)
}
})
require.register("point/endpoints/value", function(module, exports, require) {
var $ = require('jquery')

module.exports = Value

function Value (el) {
    this.$el = $(el)
    this.type = el.type

    var self = this

    this.$el.on('change', function () {
        self._onchange && self._onchange()
    })
}

Value.prototype.get = function () {
    return this.type == 'checkbox' || this.type == 'radio'
        ? this.$el[0].checked
        : this.$el.val()
}

Value.prototype.set = function (val) {
    this.type == 'checkbox' || this.type == 'radio'
        ? this.$el[0].checked = !!val
        : this.$el.val(val)
}

Value.prototype.onchange = function (cb) {
    this._onchange = cb
}

})
require.register("point/endpoints/css", function(module, exports, require) {
var $ = require('jquery')

module.exports = Css

function Css (el, klass) {
    this.$el = $(el)
    this.klass = klass
}

Css.prototype.get = function () {
    return this.$el.hasClass(this.klass)
}

Css.prototype.set = function (val) {
    this.$el.toggleClass(this.klass, !!val)
}
})
require.register("point/endpoints/text", function(module, exports, require) {
var $ = require('jquery')

module.exports = Text

function Text (el) {
    this.$el = $(el)
}

Text.prototype.get = function () {
    return this.$el.text()
}

Text.prototype.set = function (val) {
    return this.$el.text(val == null ? '' : String(val))
}

})
require.register("point/endpoints/event", function(module, exports, require) {
var $ = require('jquery')

module.exports = Event

function Event (el, name) {
    this.$el = $(el)
    var self = this
    this.$el.on(name, function (e) {
        self.stop = false
        self.hooks && self.hooks.forEach(function (hook) {
            !self.stop && hook.call(this, e)
        }, self)
    })
}

Event.prototype.onevent = function (cb) {
    if (!this.hooks) this.hooks = []
    this.hooks.push(cb)
}
})
require.register("point/endpoints/attr", function(module, exports, require) {
module.exports = Attr

function Attr (el, name) {
    this.el = el
    this.name = name
}

Attr.prototype.set = function (val) {
    val != null ? this.el.setAttribute(this.name, val) : this.el.removeAttribute(this.name)
}

Attr.prototype.get = function () {
    return this.el.getAttribute(this.name)
}
})
require.register("point/endpoints/cssValue", function(module, exports, require) {
var $ = require('jquery')

module.exports = CssValue

function CssValue (el, initialValue) {
    this.$el = $(el)
    this.prev = initialValue
}

CssValue.prototype.set = function (val) {
    if (this.prev) this.$el.removeClass(this.prev)
    this.$el.addClass(val)
    this.prev = val
}

CssValue.prototype.get = function () {
    return this.prev
}
})
require.register("point/view/view", function(module, exports, require) {
var parse = require('./data-bind-syntax')
var filters = require('./filters')
var Emitter = require('../emitter')
var util = require('../util')
var thisFn = util.thisFn


module.exports = View

function View () {}

Emitter.extend(View)

View.prototype.attach = function (model) {
    this.model = model
    this.emit('attach')
}

View.prototype.detach = function () {
    this.emit('detach')
    this.model = undefined
}

View.prototype.on('attach', function () {
    this.model.onevent(thisFn(this, 'onModelEvent'))
})

View.prototype.on('detach', function () {
    this.model.offevent(this._onModelEvent)
})

View.prototype.onModelEvent = function (ev) {
    ev = 'model:' + ev
    this.emit.apply(this, arguments)
}

View.prototype.on('domevent', function (id, e) {
    var fn = this[id]
    if (fn) return fn.call(this, e)
    fn = this.model && this.model[id]
    fn && fn.call(this.model)
})

View.prototype.clearDom = function () {
    var p = this.el && this.el.parentNode
    p && p.removeChild(this.el)
}

View.prototype.destroy = function () {
    this.clearDom()
    this.model && this.detach()
    this.emit('destroy')
}

View.prototype.bind = function () {
    this.forEachPoint(function (type, param, path, filters, el) {
        var p = this.createPoint(type, param, el); if (!p) return
        for (var i = 0; i < filters.length; i++) {
            p = this.onfilter(filters[i], p)
        }
        this.onbind(p, type, path)
    })
}

View.prototype.forEachPoint = function (cb) {
    this.forEachElementPoint(this.el, cb)
    var childs = this.el.getElementsByTagName('*')
    for (var i = 0; i < childs.length; i++) {
        this.forEachElementPoint(childs[i], cb)
    }
}

View.prototype.forEachElementPoint = function (el, cb) {
    var self = this
    var points = el.getAttribute('data-bind')
    points && parse(points, function (type, param, path, filters) {
        cb.call(self, type, param, path, filters, el)
    })
}

View.prototype.createPoint = function (type, param, el) {
    var create = this['point_' + type]
    if (create) return create.call(this, el, param)
    var Type = util.endpoint(type)
    return Type && (new Type(el, param))
}

View.prototype.onfilter = function (type, point) {
    var filter = this['filter_' + type] || filters[type]
    return filter ? filter(point) : point
}

View.prototype.onbind = function (point, type, path) {
    var bind = this['bind_' + type + '_at_' + path]
    if (bind) {
        bind.call(this, point)
        return
    }

    bind = this['bind_' + type]
    if (bind) {
        bind.call(this, point, path)
        return
    }

    this.bindPoint(point, path)
}

View.prototype.bindPoint = function (point, path) {
    if (!point.set) return
    var self = this

    point.onchange && point.onchange(function push () {
        self.model && self.model.set(path, point.get())
    })

    function pull () {
        point.set(self.model && self.model.get(path))
    }

    this.on('model:change:' + path, pull)
    this.on('attach', pull)
    pull()
}

View.prototype.bind_event = function (point, path) {
    var self = this
    point.onevent(function (e) {
        self.emit('domevent', path, e)
    })
}

View.prototype.render = function () {
    this.el = this.html.cloneNode(true)
    this.bind()
}
})
require.register("point/view/filters", function(module, exports, require) {

exports.not = function (point) {
    var get = point.get
    var set = point.set

    point.get = function () {
        return !get.call(this)
    }

    point.set = function (val) {
        set.call(this, !val)
    }

    return point
}


exports.stop = function (eventPoint) {
    eventPoint.onevent(stop)
    return eventPoint
}

function stop (e) {
    e.preventDefault()
    e.stopPropagation()
}
})
require.register("point/view/data-bind-syntax", function(module, exports, require) {
module.exports = function parse (attr, onpoint) {
    attr.split(/,/g).forEach(function (binding) {
        var b = binding.split(/:/g)
        var path = b[1] && b[1].trim() || ''
        var p = b[0].split(/\|/g)
        var m = /([^\-]*)(?:\-(.*))?/.exec(p[0].trim())
        var type = m[1]
        var param = m[2]
        if (param) param = param.trim()
        var filters = p.slice(1).map(function (s) { return s.trim() })
        onpoint(type, param, path, filters)
    })
}
})
require.register("point/emitter", function(module, exports, require) {
var util = require('./util')
var guid = util.guid

module.exports = Emitter

function Emitter () {}

Emitter.extend = function (Klass) {
    Klass = Klass || function () {}
    return util.extend(Klass, this)
}

Emitter.prototype.on = function (event, handler) {
    var h = this._createHandlers(event)
    h[guid(handler)] = handler
    return this
}

Emitter.prototype._createHandlers = function (event) {
    var key = '__event_' + event
    var h = this[key]
    if (!h) return this[key] = Object.create(null, {__evt_proto: {value: this}})
    if (h.__evt_proto === this) return h
    return this[key] = Object.create(this[key], {__evt_proto: {value: this}})
}

Emitter.prototype.off = function (event, handler) {
    delete this._createHandlers(event)[guid(handler)]
    return this
}

Emitter.prototype.onevent = function (handler) {
    return this.on('__ev__', handler)
}

Emitter.prototype.offevent = function (handler) {
    return this.off('__ev__', handler)
}

Emitter.prototype.emit = function (event, var_args) {
    if (this.__event___ev__) {
        for (var k in this.__event___ev__) {
            this.__event___ev__[k].apply(this, arguments)
        }
    }
    var handlers = this['__event_' + event]
    if (!handlers) return
    var args = Array.prototype.slice.call(arguments, 1)
    for (var key in handlers) {
        this.event = event
        handlers[key].apply(this, args)
    }
}
})

return require
})()

if (typeof define == "function" && define.amd) {
  define("point", ["jquery"], function (jquery) {
    req.register("jquery", function (module) {
      module.exports = jquery
    })
    return req("point")
  })
} else if (typeof module != "undefined" && module.exports) {
  req.register("jquery", function (module) {
    module.exports = require("jquery")
  })
  module.exports = req("point")
} else {
  req.register("jquery", function (module) { module.exports = $ })
  window.Point = req("point")
}
})()