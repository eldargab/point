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