'use strict'
const corpus = require('../Dataset/corpus_formatted.json')
var fs = require('fs');

var writers_en = [];
var writers_si = [];
var artists_en = [];
var artists_si = [];
var years = [];

function collect_named_entities() {
    corpus.forEach(song => {
        var artist_en = song.artist_en;

        if (artist_en) {
            var splits = splitMultiple(artist_en.trim(), [' ', ' and ', ',', '&']);
            splits.forEach(split => {
                if (!artists_en.includes(split.trim())) {
                    artists_en.push(split.trim());
                }
            });
        }

        var artist_si = song.artist_si;
        if (artist_si) {
            var splits = splitMultiple(artist_si.trim(), [' ', ' සහ ', ',', '&', ' සහා ']);
            splits.forEach(split => {
                if (!artists_si.includes(split.trim())) {
                    artists_si.push(split.trim());
                }
            });
        }

        var writer_en = song.writer_en;
        if (writer_en) {
            var splits = splitMultiple(writer_en.trim(), [' ', ' and ', ',', '&']);
            splits.forEach(split => {
                if (!writers_en.includes(split.trim())) {
                    writers_en.push(split.trim());
                }
            });
        }

        var writer_si = song.writer_si;
        if (writer_si) {
            var splits = splitMultiple(writer_si.trim(), [' ', ' සහ ', ',', '&', ' සහා ']);
            splits.forEach(split => {
                if (!writers_si.includes(split.trim())) {
                    writers_si.push(split.trim());
                }
            });
        }

        var year = song.year;
        if (year) {
            if (!years.includes(year)) {
                years.push(year);
            }

        }


    });

    var entities = {
        writers_en,
        writers_si,
        artists_en,
        artists_si,
        years
    }
    var jsonentities = JSON.stringify(entities);
    var fs = require('fs');
    fs.writeFile('../Dataset/key_names.json', jsonentities, 'utf8', (error) => { console.log(error) });
}

function splitMultiple(str, sep) {
    let replacedStr = str

    for (const separator of sep) {
        replacedStr = replacedStr.split(separator).join('$')
    }

    return replacedStr.split('$')

}

collect_named_entities();
