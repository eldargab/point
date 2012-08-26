var subobject = require('../lib/mixin/subobject')
var Model = require('../lib/model')


describe('Subobject @mixin', function () {
    var Parent, Child

    beforeEach(function () {
        Parent = Model.extend()
        Child = Model.extend()
        Child.prototype.set({
            a: 'a',
            b: 'b'
        })
        Child.prototype.sayHello = function () {
            return 'Hello'
        }

    })

    it('Defines subobject', function () {
        Parent.use(subobject, 'sub', Child)
        var m = new Parent
        m.get('sub').get('a').should.equal('a')
        m.get('sub').set('b', 'B')
        m.get('sub').get('b').should.equal('B')
        m.sub().should.equal(m.get('sub'))
        m.sub().sayHello().should.equal('Hello')
    })

    it('Parent resets subobect on its reset', function (done) {
        Parent.use(subobject, 'sub', Child)
        var m = new Parent

        m.sub().on('reset', function () {
            this.get('a').should.equal('A')
            this.get('foo').should.equal('foo')
            m.sub().should.equal(this)
            done()
        })

        m.reset({
            sub: {
                a: 'A',
                foo: 'foo'
            }
        })
    })

    it('Parent includes childs JSON in its JSON', function () {
        Parent.use(subobject, 'sub', Child)
        var m = new Parent
        m.set('bar', 'bar')
        m.sub().set('foo', 'foo')
        m.sub().on('json', function (json) {
            json.baz = 'baz'
        })
        m.toJSON().should.eql({
            bar: 'bar',
            sub: {
                foo: 'foo',
                baz: 'baz',
                a: 'a',
                b: 'b'
            }
        })
    })
})