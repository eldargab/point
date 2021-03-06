var parse = require('./data-bind-syntax')
var filters = require('./filters')
var Model = require('../model')
var util = require('../util')


module.exports = View

function View () {}

Model.extend(View)

View.prototype.attach = function (p, model) {
    if (typeof p != 'string') {
        model = p
        p = ''
    }
    this['model' + p] = model
    this.emit('attach' + p, model)
}

View.prototype.detach = function (p) {
    p = p || ''
    var model = 'model' + p
    this.emit('detach' + p, this[model])
    this[model] = undefined
}

View.prototype.getModel = function (p) {
    if (p == 'self') return this
    return p ? this['model' + p] : this.model
}

View.prototype.clearDom = function () {
    var p = this.el && this.el.parentNode
    p && p.removeChild(this.el)
}

View.prototype.destroy = function () {
    this.clearDom()
    this.emit('destroy')
}

View.prototype.render = function (el) {
    this.el = el || this.html.cloneNode(true)
    this.emit('bind')
}

View.prototype.on('bind', function () {
    if (this.procElementPoints(this.el) === false) return
    util.traverse.call(this, this.el, this.procElementPoints)
})

View.prototype.procElementPoints = function (el) {
    var points = el.getAttribute('data-bind'); if (!points) return

    var self = this, cont

    parse(points, function (type, param, path, filters) {
        var p = self.point(type, param, el)
        if (!p) return
        for (var i = 0; i < filters.length; i++) {
            p = self.filter(filters[i], p)
        }
        if (p.stopTraversal) cont = false
        self.bind(p, type, path)
    })
    return cont
}

View.prototype.point = function (type, param, el) {
    var create = this['point_' + type]
    if (create) return create.call(this, el, param)
    var Type = util.endpoint(type)
    return Type && (new Type(el, param))
}

View.prototype.filter = function (type, point) {
    var filter = this['filter_' + type] || filters[type]
    return filter ? filter(point) : point
}

View.prototype.bind = function (point, type, path) {
    var bind = this['bind_' + type + '_at_' + path]
    if (bind) {
        bind.call(this, point, type, path)
        return
    }

    bind = this['bind_' + type]
    if (bind) {
        bind.call(this, point, path)
        return
    }

    bind = this['bind_at_' + path]
    if (bind) {
        bind.call(this, point, type, path)
        return
    }

    this.bindPoint(point, path)
}

View.prototype.bindPoint = function (point, path) {
    if (!point.set) return
    var p = this.parsePath(path)
    var self = this

    point.onchange && point.onchange(function push () {
        var m = self.getModel(p.model)
        m && m.set(p.attr, point.get())
    })

    function pull () {
        var m = self.getModel(p.model)
        point.set(m && m.get(p.attr))
    }

    this.onmodel(p.model, 'change:' + p.attr, pull)
    this.onmodel(p.model, 'reset', pull)
    p.model != 'self' && this.on('attach' + p.model, pull)
    pull()
}

View.prototype.onmodel = function (p, event, fn) {
    if (typeof event != 'string') {
        fn = event
        event = p
        p = ''
    }

    if (p == 'self') return this.on(event, fn)

    fn && this.on('model' + p + ':' + event, fn)

    var getListener = '_get_onmodel_' + p

    if (this[getListener]) return

    this[getListener] = function () {
        var self = this
        var listener = '_onmodel_' + p

        if (this[listener]) return this[listener]

        return this[listener] = function (ev) {
            ev = 'model' + p + ':' + ev
            self.emit.apply(self, arguments)
        }
    }

    this.on('attach' + p, function (m) {
        m.onevent(this[getListener]())
    })

    this.on('detach' + p, function (m) {
        m.offevent(this[getListener]())
    })

    this.getModel(p) && this.getModel(p).onevent(this[getListener]())
}


View.prototype.parsePath = function (path) {
    var m = /((.*)\.)?([^\.]+)$/.exec(path)
    return new Path(m[2] || '', m[3])
}

function Path (model, attr) {
    this.model = model
    this.attr = attr
}


View.prototype.bind_event = function (point, path) {
    var self = this
    point.onevent(function (e) {
        self.emit('domevent', path, e)
    })
}

View.prototype.on('domevent', function (path, e) {
    var p = this.parsePath(path)
    var m = this.getModel(p.model)
    m && m[p.attr] && m[p.attr].call(m)
})
