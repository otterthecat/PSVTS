// assertion library
// /////////////////////////////////////////////////////////
var chai = require('chai').should();


// mock objects
// /////////////////////////////////////////////////////////
var mockList = ['fs', 'path'];


// modules to test
// /////////////////////////////////////////////////////////
var DL = require('../../server/DependencyLoader');
var dependencyLoader;

describe('DependencyLoader', function(){

    it('should set internal list when passed array', function(){

        dependencyLoader = new DL(mockList);
    });

    describe('#loadDependencies()', function(){

        it('should set internal deps object with list passed to constructor', function(){

            dependencyLoader.loadDependencies().deps.should.include.keys('fs', 'path');
        });
    });

    describe('#get()', function(){

        it('should return full internal #deps object when passing "*" character', function(){

            dependencyLoader.get('*').should.deep.equal(dependencyLoader.deps);
        });

        it('should return correct #deps property when passing name', function(){

           dependencyLoader.deps.fs = {'fake': 'object'};
           dependencyLoader.get('fs').should.deep.equal(dependencyLoader.deps.fs);
        });
    });
});