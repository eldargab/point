var $ = require('jquery')
var ui = require('points')
var computable = ui.mixin('computable')

// App logic

var Todo = ui.Model.extend(function Todo () {
    this.set('createdAt', new Date)
})

Todo.prototype.del = function () {
    this.emit('delete')
}

Todo.prototype.edit = function () {
    this.set('isEditing', true)
}

Todo.prototype.endEdit = function () {
    this.set('isEditing', false)
}


var App = ui.Model.extend()

App.use('collection')

App.prototype.on('change:newTodoTitle', function () {
    var self = this

    var title = this.get('newTodoTitle'); if (!title) return

    setTimeout(function () {
        self.set('newTodoTitle', '')
    })

    var todo = new Todo
    todo.set('title', title)
    todo.on('delete', function () {
        self.remove(this)
    })
    this.add(todo)
})

App.prototype.on('add', function (todo) {
    var self = this
    todo.on('change:isDone', function () {
        self.emit('itemDone')
    })
})

App.prototype.clearDoneItems = function () {
    this.forEach(function (todo) {
        todo.get('isDone') && todo.del()
    })
}

App.use(computable, 'done', ['remove', 'itemDone'], function () {
    var count = 0
    this.forEach(function (todo) {
        todo.get('isDone') && count++
    })
    return count
})

App.use(computable, 'left', ['change:done', 'change:length'], function () {
    return this.length - this.get('done')
})

var app = new App

app.set('mode', 'all')


// Views

var TodoView = ui.View.extend()

TodoView.prototype.point_focus = function (el) {
    return {
        set: function (focus) {
            focus && $(el).focus()
        }
    }
}

TodoView.prototype.filter_enter = function (eventPoint) {
    eventPoint.onevent(function (e) {
        if (e.keyCode != 13) this.stop = true
    })
    return eventPoint
}

TodoView.prototype.hide = function () {
    this.hidden = true
    this._hide && this._hide.set(this.hidden)
}

TodoView.prototype.show = function () {
    this.hidden = false
    this._hide && this._hide.set(this.hidden)
}

TodoView.prototype.bind_css_at_hidden = function (point) {
    this._hide = point
    this._hide.set(this.hidden)
}

TodoView.prototype.onAppMode = function () {
    if (!this.model) return
    var isDone = this.model.get('isDone')
    switch (app.get('mode')) {
        case 'all':
            this.show()
            break
        case 'active':
            isDone ? this.hide() : this.show()
            break
        case 'completed':
            isDone ? this.show() : this.hide()
            break
    }
}

TodoView.prototype.on('attach', function () {
    this.onAppMode()
    if (!this._onAppMode) {
        app.on('change:mode', ui.thisFn(this, 'onAppMode'))
        this.on('destroy', function () {
            app.off('change:mode', this._onAppMode)
        })
    }
})


var AppView = ui.View.extend()

AppView.prototype.bind_foreach_at_todos = function (foreach) {
    foreach.ItemView = TodoView
    foreach.attach(app)
}

AppView.prototype.point_toggleMode = function (el, mode) {
    $(el).click(function () {
        app.set('mode', mode)
    })

    function onmode () {
        app.get('mode') == mode
            ? $(el).addClass('selected')
            : $(el).removeClass('selected')
    }

    app.on('change:mode', onmode)

    onmode()
}

AppView.prototype.filter_items = function (point) {
    var set = point.set
    point.set = function (val) {
        set.call(this, val > 1 || val == 0 ? 'items' : 'item')
    }
    return point
}


// Bootstraping
$(function () {
    var appView = new AppView
    appView.attach(app)
    appView.el = document.body
    appView.bind()
})
