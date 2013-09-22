module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    jshint: {
      files: ['client/*.js', 'server/*/*.js', 'test/specs/*.js'],
      options: {
        ignores: ['server/db/*.js']
      }

    },


    mochacli: {
        options: {
            reporter: 'nyan',
            bail: true
        },
        files: ['test/specs/*.js']
    },

    complexity: {
        generic: {
            src: ['server/*.js'],
            options: {
                errorsOnly: false, // show only maintainability errors
                cyclomatic: 3,
                halstead: 10,
                maintainability: 100
            }
        },
    },

    csslint: {
      options: {
        'box-sizing': false
      },

      src: ['css/*.css']
    }
  });

  // Load Grunt Tasks
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-mocha-cli');
  grunt.loadNpmTasks('grunt-complexity');
  grunt.loadNpmTasks('grunt-contrib-csslint');
  grunt.loadNpmTasks('grunt-browserify');

  // Default task(s).
  grunt.registerTask('default', ['jshint', 'mochacli', 'complexity', 'csslint']);
  grunt.registerTask('js', ['jshint', 'mochacli', 'complexity']);
  grunt.registerTask('css', ['csslint']);
  grunt.registerTask('compile', ['browserify']);

};