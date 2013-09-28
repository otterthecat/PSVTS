module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    jshint: {

      files: ['client/*.js', 'server/*/*.js', 'test/specs/*.js'],
      options: {

        // seems jsHint doesn't like Mongoose Schemas...
        ignores: ['server/db/*.js']
      }
    },

    browserify: {

      basic: {

        src: ['client/app.js'],
        dest: 'js/app.js',
        options: {

          debug: true
        }
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
            src: ['server/*.js', 'client/*.js'],
            options: {

                /*
                  @errorsOnly - show only maintainabilty errors
                  @cycolmatic - typical acceptance is a value of 4 (lower is better)
                  @halstead - typcial acceptance is 10, (lower is better)
                  @maintainability - typical acceptance is ~70. Higher is better, 171 max
                */
                errorsOnly: false,
                cyclomatic: 3,
                halstead: 10,
                maintainability: 100
            }
        },
    },

    less: {

      dev: {

        src: './less/app.less',
        dest: './css/app.css'
      }
    },

    csslint: {

      options: {

        'box-sizing': false,
        'box-model': false,
        'adjoining-classes': false
      },

      src: ['css/*.css']
    },

    watch: {

      css: {

        files: 'less/*',
        tasks: ['css']
      },

      js: {

        files: 'client/*.js',
        tasks: ['js']
      }
    },

    plato: {
      dev: {
        options : {
          jshint : false
        },
        files: {
          'reports': ['server/*.js', 'client/*.js'],
        },
      },
    }
  });

  // Load Grunt Tasks
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-mocha-cli');
  grunt.loadNpmTasks('grunt-complexity');
  grunt.loadNpmTasks('grunt-contrib-csslint');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-plato');

  // Defined task(s).
  grunt.registerTask('default', ['jshint', 'mochacli', 'complexity', 'csslint']);
  grunt.registerTask('js', ['jshint', 'mochacli', 'complexity', 'browserify']);
  grunt.registerTask('css', ['less:dev', 'csslint']);
  grunt.registerTask('report', ['plato:dev']);
};