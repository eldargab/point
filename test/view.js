var View = require('../lib/view/view')
var Model = require('../lib/model')
var sinon = require('sinon')
var should = require('should')

describe('View', function () {
    var view, m, m2, listener, listener2

    beforeEach(function () {
        view = new View
        m = new Model
        m2 = new Model
        listener = sinon.spy()
        listener2 = sinon.spy()
    })

    describe('.attach(model [, path])', function () {
        it('sets `model<path>` property to `model`', function () {
            view.attach(m)
            view.model.should.equal(m)
            view.attach('foo', m2)
            view.modelfoo.should.equal(m2)
        })

        it('emits attach event', function () {
            view.on('attach', listener)
            view.on('attachfoo', listener2)
            view.attach(m)
            view.attach('foo', m2)
            listener.calledWith(m).should.be.true
            listener2.calledWith(m2).should.be.true
        })
    })

    describe('.detach([path])', function () {
        it('clears `model<path>` property', function () {
            view.attach('foo', m)
            view.modelfoo.should.equal(m)
            view.detach('foo')
            should.not.exist(view.modelfoo)
        })

        it('emits detach event', function () {
            view.attach(m)
            view.attach('foo', m2)

            view.on('detach', function (model) {
                model.should.equal(m)
                this.model.should.equal(m)
                listener()
            })
            view.detach()
            should.not.exist(view.model)
            listener.calledOnce.should.be.true

            view.on('detachfoo', listener2)
            view.detach('foo')
            listener2.calledWith(m2).should.be.true
            should.not.exist(view.modelfoo)
        })
    })

    describe('.onmodel([path, ] event, fn)', function () {
        it('subscribes to model event', function (done) {
            view.attach('bar', m)
            view.onmodel('bar', 'foo', function () {
                this.should.equal(view)
                arguments.should.eql([1, 2])
                done()
            })
            m.emit('foo', 1, 2)
        })

        it('`path` can be omitted', function (done) {
            view.attach(m)
            view.onmodel('foo', done)
            m.emit('foo')
        })

        it('automatically starts listening on attach', function (done) {
            view.onmodel('bar', 'foo', done)
            view.attach('bar', m)
            m.emit('foo')
        })

        it('automatically stops listening on detach', function () {
            view.attach(m)
            view.onmodel('foo', listener)
            view.detach()
            m.emit('foo')
            listener.called.should.be.false
        })

        it('works on prototype', function (done) {
            var v = Object.create(view)
            view.onmodel('bar', 'foo', function () {
                this.should.be.equal(v)
                done()
            })
            v.attach('bar', m)
            m.emit('foo')
        })

        it('.onmodel("self",...) means listen to view itself', function (done) {
            view.onmodel('self', 'foo', function () {
                done()
            })
            view.emit('foo')
        })
    })

    describe('.parsePath(path)', function () {
        var parse = View.prototype.parsePath

        it('Should extract model and attribute from the path', function () {
            parse('foo').should.eql({
                model: '',
                attr: 'foo'
            })
            parse('foo.bar.baz').should.eql({
                model: 'foo.bar',
                attr: 'baz'
            })
        })
    })

    describe('.bindPoint(point, path)', function () {
        function Point () {}

        Point.prototype.get = function () {
            return this.val
        }

        Point.prototype.set = function (val) {
            this.val = val
        }

        var p

        beforeEach(function () {
            p = new Point
        })

        it('Should init point with current value from model', function () {
            m.set('a', 'a')
            view.attach(m)
            view.bindPoint(p, 'a')
            p.val.should.equal('a')
        })

        describe('Should update point...', function () {
            beforeEach(function () {
                view.bindPoint(p, 'a')
                m.set('a', 'a')
                view.attach(m)
            })

            it('on model attach', function () {
                p.val.should.equal('a')
            })

            it('on property change', function () {
                m.set('a', 'b')
                p.val.should.equal('b')
            })

            it('on model reset', function () {
                m.reset({
                    a: 'foo'
                })
                p.val.should.equal('foo')
            })
        })

        it('Should update model on point change event', function () {
            p.onchange = function (cb) {
                this.cb = cb
            }
            view.attach(m)
            view.bindPoint(p, 'a')
            p.val = 'bar'
            p.cb()
            m.get('a').should.equal('bar')
        })

        it('Should be able to bind to non-default model', function () {
            view.attach('foo', m)
            view.bindPoint(p, 'foo.a')
            m.set('a', 'b')
            p.val.should.equal('b')
        })

        it('Model `self` means view itself', function () {
            view.set('foo', 'foo')
            view.bindPoint(p, 'self.foo')
            p.val.should.equal('foo')
            view.set('foo', 'bar')
            p.val.should.equal('bar')
        })
    })
})