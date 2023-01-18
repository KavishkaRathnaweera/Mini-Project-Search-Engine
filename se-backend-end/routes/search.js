'use strict'

const express = require('express');
const router = express.Router();

const {
  Client
} = require('@elastic/elasticsearch');
const client = new Client({
  node: 'http://localhost:9200'
});

var stopwords = require("../../Dataset/stopwords.json");
var stemwords = require("../../Dataset/stemwords.json");
var named_entities = require("../../Dataset/key_names.json");

// Get Query from the front-end
router.post('/', async function(req, res) {

  var query = req.body.query;
  var query_without_space = query.trim();
  var query_words = query.trim().split(" ");
  var removing_stopwords = [];
  var size = 100;
  var sort_method = [];

  var field_type = 'most_fields';

  var writer_en = 1;
  var writer_si = 1;
  var artist_en = 1;
  var artist_si = 1;
  var song_title_en = 1;
  var song_title_si = 1;
  var year_en = 100;
  var year_si = 100;
  var metaphors = 1;
  var lyrics = 1;
  var time_period = [];

  // Set weights for each field and identify stop words.
  query_words.forEach(word => {
    // Check language.
    if (/^[A-Za-z0-9/\s/]*$/.test(query_without_space)) {

      // Increase score based on stemwords
      stemwords.writer_en.forEach(stemword => {
        if (word.includes(stemword)) {
          word = word.replace(stemword, "");
          writer_en += 1;
        }
      })

      stemwords.artist_en.forEach(stemword => {
        if (word.includes(stemword)) {
          word = word.replace(stemword, "");
          artist_en += 1;
        }
      })

      // Increase score based on stopwords
      if (stopwords.artist_en.includes(word)) {
        artist_en += 1;
        removing_stopwords.push(word);
      }

      if (stopwords.writer_en.includes(word)) {
        writer_en += 1;
        removing_stopwords.push(word);
      }

      if (stopwords.song_title_en.includes(word)) {
        song_title_en += 1;
        removing_stopwords.push(word);
      }

      if (stopwords.year_en.includes(word)) {
        year_en += 1;
        removing_stopwords.push(word);
      }

      // Increase score based on named_entities.
      if (named_entities.writers_en.includes(word)) {
        writer_en += 1;
      }

      if (named_entities.artists_en.includes(word)) {
        artist_en += 1;
      }

      if (named_entities.years.includes(word)) {
        year_en += 1;
      }

    } else {
      // Sinhala

      query_words.forEach(word => {

        // Increase score based on stemwords
        stemwords.writer_si.forEach(stemword => {
          if (word.includes(stemword)) {
            word = word.replace(stemword, "");
            writer_si += 1;
          }
        })

        stemwords.artist_si.forEach(stemword => {
          if (word.includes(stemword)) {
            word = word.replace(stemword, "");
            artist_si += 1;
          }
        })

        // Increase score based on stopwords
        if (stopwords.artist_si.includes(word)) {
          artist_si += 1;
          removing_stopwords.push(word);
        }

        if (stopwords.writer_si.includes(word)) {
          writer_si += 1;
          removing_stopwords.push(word);
        }

        if (stopwords.song_title_si.includes(word)) {
          song_title_si += 1;
          removing_stopwords.push(word);
        }

        if (stopwords.year_si.includes(word)) {
          year_si += 1;
          removing_stopwords.push(word);
        }

        if (stopwords.metaphors.includes(word)) {
          metaphors += 3;
          removing_stopwords.push(word);
        }

        // Increase score based on named_entities.
        if (named_entities.writers_si.includes(word)) {
          writer_si += 1;
        }

        if (named_entities.artists_si.includes(word)) {
          artist_si += 1;
        }

        if (named_entities.years.includes(word)) {
          year_si += 1;
          time_period.push(word);
        }
      })

    }

  })

  removing_stopwords.forEach(word => {
    query = query.replace(word, '');
  });

  stopwords.common.forEach(word => {
    query = query.replace(word, '');
  });

  if (time_period.length == 2) {
    time_period.sort();
    var int_time_period = time_period.map(string => parseInt(string));

    console.log(time_period);

    var result = await client.search({
      index: 'index_sinhala_metaphor',
      body: {
        size: size,
        _source: {
          includes: ["song_title_si", "writer_si", "artist_si", "lyrics", "metaphors.metaphor", "metaphors.source", "metaphors.target", "metaphors.meaning", "year"]
        },
        sort: sort_method,
        query: {
          "range": {
            "year": {
              "gte": int_time_period[0],
              "lte": int_time_period[1],
              "boost": 2.0
            }
          }
        },
        aggs: {
          "metaphore_filter": {
            terms: {
              field: "metaphors.meaning.raw",
              size: 10
            }
          },
          "song_title_filter": {
            terms: {
              field: "song_title_si.raw",
              size: 10
            }
          },
          "artist_filter": {
            terms: {
              field: "artist_si.raw",
              size: 10
            }
          },
          "writer_filter": {
            terms: {
              field: "writer_si.raw",
              size: 10
            }
          },
          "year_filter": {
            terms: {
              field: "year.raw",
              size: 10
            }
          }
        }
      }
    });

  } else {

    if (/^[A-Za-z0-9/\s/]*$/.test(query_without_space)) {

      // Query for english search
      var result = await client.search({
        index: 'index_sinhala_metaphor',
        body: {
          size: size,
          _source: {
            includes: ["song_title_si", "writer_si", "artist_si", "lyrics", "metaphors.target", "metaphors.meaning", "metaphors.source", "metaphors.metaphor", "year"]
          },
          sort: sort_method,
          query: {
            multi_match: {
              query: query.trim(),
              fields: [
                `artist_en.case_insensitive_and_inflections^${artist_en}`,
                `writer_en.case_insensitive_and_inflections^${writer_en}`,
                `song_title_en.case_insensitive_and_inflections^${song_title_en}`,
                `year^${year_en}`
              ],
              operator: "or",
              type: field_type
            }
          },
          aggs: {
            "artist_filter": {
              terms: {
                field: "artist_si.raw",
                size: 10
              }
            },
            "writer_filter": {
              terms: {
                field: "writer_si.raw",
                size: 10
              }
            },
            "year_filter": {
              terms: {
                field: "year.raw",
                size: 10
              }
            }
          }
        }
      });

    } else {

      // Query for sinhala search
      var result = await client.search({
        index: 'index_sinhala_metaphor',
        body: {
          size: size,
          _source: {
            includes: ["song_title_si", "writer_si", "artist_si", "lyrics", "metaphors.target", "metaphors.meaning", "metaphors.source", "metaphors.metaphor", "year"]
          },
          sort: sort_method,
          query: {
            multi_match: {
              query: query.trim(),
              fields: [
                `artist_si^${artist_si}`,
                `writer_si^${writer_si}`,
                `song_title_si^${song_title_si}`,
                `lyrics^${lyrics}`,
                `metaphors.metaphor^${lyrics}`,
                `metaphors.source^${lyrics}`,
                `metaphors.target^${metaphors}`,
                `metaphors.meaning^${metaphors}`,
                `year^${year_si}`
              ],
              operator: "or",
              type: field_type
              // fuzziness: "AUTO:4,6",
              // prefix_length:2
            }
          },
          aggs: {
            "artist_filter": {
              terms: {
                field: "artist_si.raw",
                size: 10
              }
            },
            "writer_filter": {
              terms: {
                field: "writer_si.raw",
                size: 10
              }
            },
            "year_filter": {
              terms: {
                field: "year.raw",
                size: 10
              }
            }
          }
        }
      });
    }

  }

  res.send({
    aggs: result.body.aggregations,
    hits: result.body.hits.hits
  });
});

module.exports = router;
