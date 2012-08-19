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