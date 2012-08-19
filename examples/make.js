var Bundle = require('exposer').Bundle

Bundle('.compiled/todos/app.js', function () {
    this.add('.', 'jquery.js', {as: 'jquery'})
    this.add('..', 'lib', {as: 'points'})
    this.add('todos', 'app.js')
    this.includeRequire = true
    this.main = 'app'
})