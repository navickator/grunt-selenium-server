# grunt-selenium-server

> Start/stop a local Selenium standalon server.



## Getting Started

```shell
npm install grunt-selenium-server --save-dev
```

## Configure gruntfile.js
```js
module.exports = function (grunt) {

    grunt.initConfig({
        "start-selenium-server": {
            startSeleniumHub: {
                options: {
                    downloadUrl: ['https://selenium.googlecode.com/files/selenium-server-standalone-2.39.0.jar'],
                        downloadLocation: 'C:\\tmp',
                        serverOptions: {
                        role: "hub"
                    }
                }
            },
            startSeleniumNode: {
                options: {
                    downloadUrl: [
                        'http://chromedriver.storage.googleapis.com/2.8/chromedriver_win32.zip',
                        'http://selenium.googlecode.com/files/IEDriverServer_x64_2.39.0.zip',
                        'http://selenium.googlecode.com/files/selenium-server-standalone-2.39.0.jar'
                    ],
                        downloadLocation: 'C:\\tmp',
                        serverOptions: {
                        role: "node",
                            hub: "http://localhost:4444/grid/register",
                            "Dwebdriver.ie.driver=C:\\tmp\\IEDriverServer.exe":"", // Java argument
                            "Dwebdriver.chrome.driver=C:\\tmp\\chromedriver.exe":"" // Java argument
                    }
                }
            }
        }
    });

    // Load grunt module
    grunt.loadNpmTasks('grunt-selenium-server');

    // And define task to init selenium hub and node
    grunt.registerTask('initSeleniumServer', ['start-selenium-server:startSeleniumHub', 'start-selenium-server:startSeleniumNode']);
```
