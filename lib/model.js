var Emitter = require('./emitter')

module.exports = Model

function Model () {}

Emitter.extend(Model)

Model.prototype.get = function (attr) {
    var getter = this['onget_' + attr]
    return getter ? getter.call(this, attr) : this.onget(attr)
}

Model.prototype.onget = function (attr) {
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
    setter ? setter.call(this, val, attr) : this.onset(attr, val)
}

Model.prototype.onset = function (attr, val) {
    this._set(attr, val)
}

Model.prototype._set = function (attr, val) {
    this._thisAttributes()[attr] = val
    this.emit('_change_:' + attr, attr)
    this.emit('change', attr)
    this.emit('change:' + attr, attr)
}

Model.prototype.toJSON = function () {
    var json = {}
    for (var key in this._attr) {
        json[key] = this._attr[key]
    }
    this.emit('json', json)
    return json
}

Model.prototype.reset = function (initials) {
    delete this._attr
    if (initials) {
        var a = this._thisAttributes()
        for (var key in initials) {
            a[key] = initials[key]
        }
    }
    this.emit('_reset_', this._attr)
    this.emit('reset')
}

Model.prototype._thisAttributes = function () {
    if (!this._attr) return this._attr = Object.create(null, {__ui_proto: {value: this}})
    if (this._attr.__ui_proto === this) return this._attr
    return this._attr = Object.create(this._attr, {__ui_proto: {value: this}})
}