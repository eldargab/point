var sinon = require('sinon')
var Lib = require('../lib')
var computable = Lib.mixin('computable')

describe('Computable @mixin', function () {
    var m, onchange

    beforeEach(function () {
        m =  new Lib.Model
        onchange = sinon.spy()
    })

    it('Adds support for computable properties', function (done) {
        m.use(computable, 'greeting', [':hello', ':world'], function () {
            return this.get('hello') + ' ' + this.get('world')
        })

        m.on('change:greeting', onchange)

        m.set({
            hello: 'Hi',
            world: 'world'
        })

        m.get('greeting').should.equal('Hi world')

        m.set('hello', 'Hello')

        m.get('greeting').should.equal('Hello world')

        onchange.called.should.be.false

        setTimeout(function () {
            onchange.calledOnce.should.be.true
            done()
        }, 10)
    })

    it('Computable value is cached', function () {
        var calls = 0
        m.use(computable, 'foo', ['bar'], function () {
            calls++
            return 'foo'
        })
        m.get('foo')
        calls.should.equal(1)
        m.get('foo')
        calls.should.equal(1)

        m.emit('bar')
        m.get('foo')
        calls.should.equal(2)
    })

    it('Cache is cleared on reset', function (done) {
        m.use(computable, 'foo', [], function () {
            return !!this.get('baz')
        })

        m.on('change:foo', onchange)

        m.get('foo').should.equal(false)

        m.reset({baz: true})

        m.get('foo').should.equal(true)

        setTimeout(function () {
            onchange.called.should.be.false
            done()
        }, 10)
    })

    it('Emits `_change_` event when cache is cleared', function () {
        m.use(computable, 'foo', ['bar'], function () {
        })
        m.on('_change_:foo', onchange)
        m.emit('bar')
        onchange.called.should.be.true
    })
})