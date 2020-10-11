const axios = require('axios').default;
const { parseTime, formatTime } = require('../utils/time');
const iconv = require('iconv-lite');

function reformatTime(str) {
    // "special" total times (like wrong or missing control)
    if (str.indexOf(':') === -1) {
        return str;
    }

    return formatTime(parseTime(str));
}

function reformatSplitTime(str) {
    // normalize missing punch time
    if (str === '-' ||  str === '-----') {
        return '-';
    }

    // normalize not working control
    if (str === '0.00') {
        return 's';
    }

    return formatTime(parseTime(str));
}

module.exports.event = (req, res) => {
  if (req.method !== 'GET') {
    res.status(405);
    res.json({'message': 'HTTP method ' + req.method + ' not supported!'});
    return;
  }

  const id = req.path.substring(1).length > 0 ? req.path.substring(1) : req.query.id;
  axios.get('https://o-l.ch/cgi-bin/results', {
    responseType: 'arraybuffer',
    params: {
      type: 'rang',
      rl_id: id,
      kind: 'all',
      zwizt: 1,
      csv: 1
    }
  }).then((response) => {
    var converted = iconv.decode(response.data, 'cp1252');

    // interpret unknown event - SOLV does not properly do that for us...
    if (response.status === 404 || converted.substring(0, 14) === '<!DOCTYPE html') {
      res.status(404);
      res.json({ 
        message: 'event with id ' + id + ' does not exist'
      });
      return;
    }
    
    // convert CSV to JSON
    var categories = { };
    var result = {
      categories: []
    };
    
    var lines = converted.split('\n');
    
    lines.forEach(function(line, idx) {
      var tokens = line.split(';');
      if (tokens.length < 11) {
        return;
      }
      
      var name = tokens[0];
      var category = categories[name];
      if (!category) {
        category = {
          name: name,
          distance: Math.round(parseFloat(tokens[1]) * 1000),
          ascent: tokens[2],
          controls: parseInt(tokens[3]),
          runners: []
        };
        categories[name] = category;
        result.categories.push(category);
      }
      
      var runner = {
        id: idx + 1,
        fullName: tokens[5],
        yearOfBirth: tokens[6],
        city: tokens[7],
        club: tokens[8],
        time: reformatTime(tokens[9]),
        startTime: tokens[10],
        splits: []
      };

      if ((tokens.length - 12) < category.controls * 2) {
        // some crappy SOLV data...
        console.log('fix crappy data from SOLV - not enough tokens on line for runner ' + runner.fullName);
        for (var i = tokens.length; i < category.controls * 2 + 12; i++) {
          if (i % 2 === 0) {
            tokens[i] = category.runners.length === 0 ? '???' : category.runners[0].splits[(i - 12) / 2].code;
          } else {
            tokens[i] = '-';
          }
        }
      }
      
      for (var i = 12; i < tokens.length - 1; i += 2) {
        var time = reformatTime(tokens[i + 1]);
        if (runner.splits.length > 0 && parseTime(time)) {
          var prev = parseTime(runner.splits[runner.splits.length - 1]);
          if (time === prev || tokens[i + 1] === '0.00' || parseTime(tokens[i + 1]) > 180 * 60) {
            // normalize valid manual punches
            time = 's';
          }
        }
        runner.splits.push([ tokens[i], time ]);
      }
      
      category.runners.push(runner);
    });
    
    res.status(200);
    res.send(result);
  }).catch(reason => {
      res.status(500);
      res.json({ message: reason });
  });
}