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

    csslint: {
      src: ['css/*.css']
    }
  });

  // Load Grunt Tasks
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-csslint');
  grunt.loadNpmTasks('grunt-browserify');

  // Default task(s).
  grunt.registerTask('default', ['jshint', 'csslint']);

  grunt.registerTask('compile', ['browserify']);

};