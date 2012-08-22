var Bundle = require('exposer').Bundle

Bundle('.compiled/todos/app.js', function () {
    this.add('..', 'lib', {as: 'point'})
    this.add('todos', 'app.js')
    this.includeRequire()
    this.append('require.register("jquery", function (module) { module.exports = $ })')
    this.append('require("app")')
})