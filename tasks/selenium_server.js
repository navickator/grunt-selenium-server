module.exports = function (grunt) {

    var fs = require('fs');
    var path = require('path');
    var url = require('url');
    var request = require('request');
    var ProgressBar = require('progress');
    var DecompressZip = require('decompress-zip');

    /**
     * References running server processes.
     *
     * @type {Object}
     */
    var childProcesses = {};

    /**
     * Download the Selenium Server jar file.
     *
     * @param  {Object}   options Grunt task options.
     * @param  {Function} cb
     */
    function downloadFile(options, cb) {
        var fileToDownload = options.fileToDownload;

        // Where to save file to.
        var destination = path.join(options.downloadLocation, path.basename(fileToDownload));

        // If it's already there don't download it.
        if (fs.existsSync(destination)) {
            return cb(destination, null);
        }

        grunt.log.ok('Saving file to: ' + destination);

        var writeStream = fs.createWriteStream(destination);

        // Start downloading and showing progress.
        request(fileToDownload).on('response', function (res) {
            // Full length of file.
            var len = parseInt(res.headers['content-length'], 10);

            // Super nifty progress bar.
            var bar = new ProgressBar(' downloading [:bar] :percent :etas', {
                complete: '=',
                incomplete: ' ',
                width: 20,
                total: len
            });

            // Write new data to file.
            res.on('data', function (chunk) {
                writeStream.write(chunk);
                bar.tick(chunk.length);

            });

            // Close file and holla back.
            res.on('end', function () {
                writeStream.end();
                grunt.log.ok('done.');
                cb(destination, null);
            });

            // Download error.
            res.on('error', function (err) {
                cb(null, err);
            });
        });
    }

    /**
     * Start a selenium server.
     *
     * @param  {String}   target  Grunt task target.
     * @param  {String}   jar     Full path to server jar.
     * @param  {Object}   options Grunt task options.
     * @param  {Function} cb
     */
    function startServer(target, jar, options, cb) {
        var args = ['-jar', jar];

        // Add additional options to command.
        Object.keys(options.serverOptions).forEach(function (key) {
            args.push('-' + key);
            args.push(options.serverOptions[key]);
        });

        grunt.log.ok('Starting Selenium server with following arguments: ' + args);

        // Spawn server process.
        var spawn = require('child_process').spawn;
        childProcesses[target] = spawn('java', args);

        childProcesses[target].stdout.on("data",function(data){
            // Uncomment this line to enable log output of selenium server
            //console.log(target + ">>", data.toString());
        });

        var pid = childProcesses[target].pid;
        grunt.log.ok('Boom, got it. pid is ' + pid + ' in case you give a shit.');

        cb(null);
    }

    /**
     * Start a Selenium server.
     */
    grunt.registerMultiTask('start-selenium-server', 'Start Selenium server.', function () {
        var done = this.async();
        var target = this.target;

        // Set default options.
        var options = this.options({
            downloadUrl: ['https://selenium.googlecode.com/files/selenium-server-standalone-2.39.0.jar'],
            downloadLocation: '/tmp',
            serverOptions: {}
        });

        grunt.verbose.writeflags(options, 'Options');

        // Download jar file. Doesn't do anything if the file's already been downloaded.
        options.downloadUrl.forEach(function (fileUrl) {
            options.fileToDownload = fileUrl;
            downloadFile(options, function (file, err) {
                if (err) {
                    grunt.log.error(err);
                    return done(false);
                }

                // Start the selenium server in a child process.
                if (file.indexOf("selenium-server-standalone") >= 0) {
                    startServer(target, file, options, function (err) {
                        if (err) {
                            grunt.log.error(err);
                            return done(false);
                        }

                        done(true);
                    });
                } else if (path.extname(file) == ".zip") {
                    // Unzip and write file
                    var unZip = new DecompressZip(file);

                    unZip.on('error', function (err) {
                        // Remove file to try again
                        fs.remove(file);
                        grunt.log.error('Caught an error:'+err.toString());
                    });

                    unZip.on('extract', function (log) {
                        grunt.log.ok('Finished extracting');
                    });

                    unZip.extract({
                        path: options.downloadLocation
                    });
                }
            });
        });
    });

    /**
     * Stop a Selenium server.
     */
    grunt.registerMultiTask('stop-selenium-server', 'Stop Selenium server.', function () {
        var target = this.target;

        // Make sure we have a reference to the running server process.
        if (!childProcesses[target]) {
            grunt.log.error('Server not running.');
        }
        else {
            grunt.log.ok('Sending kill signal to child process.');
            childProcesses[target].kill('SIGTERM');
        }
    });

};