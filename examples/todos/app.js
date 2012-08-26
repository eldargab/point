var $ = require('jquery')
var Point = require('point')
var computable = Point.mixin('computable')

// App logic

var Todo = Point.Model.extend(function Todo () {
    this.set('createdAt', new Date)
})

Todo.prototype.del = function () {
    this.emit('delete')
}

var App = Point.Model.extend()

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
    }).on('change:isDone', function () {
        self.emit('itemDone')
    })
    this.add(todo)
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

App.prototype.set('mode', 'all')

var app = new App


// Views

var TodoView = Point.View.extend()

TodoView.prototype.edit = function () {
    this.set('isEditing', true)
}

TodoView.prototype.endEdit = function () {
    this.set('isEditing', false)
}

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

TodoView.use(computable, 'hidden', ['model:change:isDone', 'appmode', 'attach'], function () {
    var isDone = this.model && this.model.get('isDone')
    switch (app.get('mode')) {
        case 'all':
            return false
        case 'active':
            return isDone
        case 'completed':
            return !isDone
    }
})

TodoView.prototype.on('bind', function () {
    var self = this

    this.onmodel('change:isDone')

    function emitAppMode () {
        self.emit('appmode')
    }

    app.on('change:mode', emitAppMode)

    this.on('destroy', function () {
        app.off('change:mode', emitAppMode)
    })
})


var AppView = Point.View.extend()

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

// Bootstrap
$(function () {
    var appView = new AppView
    appView.attach(app)
    appView.render(document.body)
})
