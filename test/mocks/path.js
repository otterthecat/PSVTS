var MockPath = function(){


};

MockPath.prototype = {

	extname: function(str){

		return '.html';
	}
};

module.exports = MockPath;