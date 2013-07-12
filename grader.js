#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";
var rest = require('restler');
var crypto = require('crypto');
var urlFile = '';

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var assertUrlValid = function(url) {
    var urlStr = url.toString();
    urlFile = 'f' + crypto.randomBytes(4).readUInt32LE(0) + '.html';
    rest.get(urlStr).on('complete', function(result, response) {
        if (result instanceof Error) {
            console.log("%s is a URL causes following result: %s. Exiting.", url, result);
            process.exit(1);
        } else {
//            console.log("Should write " + urlFile);
            fs.writeFile(urlFile, result, function (err) { 
                if (err) throw err;
                program.file = urlFile;
                completion();
            });
        }
    });
    return urlStr;
};

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile) {
    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

var completion = function() {
    var checkJson = checkHtmlFile(program.file, program.checks);
    var outJson = JSON.stringify(checkJson, null, 4);
    var urlFileExists = urlFile && fs.existsSync(urlFile);
    if (urlFileExists) {
        fs.unlink(urlFile, function(err) { 
            if (err) throw err;
        });
    }
    console.log(outJson);

};

if(require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
        .option('--url <url>', 'URL to download', clone(assertUrlValid)) 
        .parse(process.argv);
//    console.log('main:url=' + program.url + ';urlFile=' + urlFile + ';file=' + program.file);
    if (!program.url && program.file && program.checks) {
        completion();
    }
} else {
    exports.checkHtmlFile = checkHtmlFile;
}
