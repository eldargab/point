var Model = require('../lib/model')
var sinon = require('sinon')
var should = require('should')

describe('Model', function () {
    var m, l, l2

    beforeEach(function () {
        m = new Model
        l = sinon.spy()
        l2 = sinon.spy()
    })

    it('Supports getting and setting of attributes', function () {
        m.set('foo', 'foo')
        m.get('foo').should.equal('foo')

        m.set({
            foo: 'bar',
            hello: 'world'
        })

        m.get('foo').should.equal('bar')
        m.get('hello').should.equal('world')
    })

    it('Emits `change` event when property is set', function () {
        m.on('change:foo', l)
        m.on('change', l2)
        m.set('foo', 'foo')
        l.calledOnce.should.be.true
        l2.calledWithExactly('foo').should.be.true
        m.set('foo', 'foo')
        l.calledTwice.should.be.true
        l2.calledTwice.should.be.true
    })

    it('Emits `_change_` event before `change`', function () {
        m.on('_change_:foo', l).on('change:foo', l2)
        m.set('foo', 1)
        l.calledBefore(l2)
    })

    it('Respects onset_<prop> setters', function () {
        m.onset_foo = function (val, prop) {
            val.should.equal('baz')
            prop.should.equal('foo')
            this.onset('foo', 'bar')
        }
        m.on('change:foo', l)
        m.set('foo', 'baz')
        m.get('foo').should.equal('bar')
        l.calledOnce.should.be.true

        m.set('baz', 'baz')
        m.onset_baz = function () {}
        m.on('change:baz', l2)
        m.set('baz', 'hi')
        m.get('baz').should.equal('baz')
        l2.called.should.be.false
    })

    it('Respects onget_<prop> getters', function () {
        m.onget_foo = function (prop) {
            prop.should.equal('foo')
            return 'FOO'
        }
        m.get('foo').should.equal('FOO')

        m.set('bar', 'bar')
        m.onget_baz = function () {
            return this.onget('bar')
        }
        m.get('baz').should.equal('bar')
    })

    it('.toJSON()', function () {
        m.set({
            a: 'a',
            b: 'b',
            c: 'c'
        })

        m.on('json', function (json) {
            delete json.a
        })

        m.toJSON().should.eql({
            b: 'b',
            c: 'c'
        })

        m.get('a').should.equal('a')
    })

    it('.reset()', function (done) {
        m.set({
            a: 'a',
            b: 'b',
            c: 'c'
        })

        m.on('change:a', l)

        m.on('_reset_', function (attr) {
            delete attr.x
            attr.y = 'z'
        })

        m.on('reset', function () {
            this.get('y').should.equal('z')
            should.not.exist(this.get('a'))
            should.not.exist(this.get('x'))
            this.get('f').should.equal('f')
            l.called.should.be.false
            done()
        })

        m.reset({
            x: 'x',
            y: 'y',
            f: 'f'
        })
    })
})