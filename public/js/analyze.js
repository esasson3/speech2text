
function ready() {
  // CSRF protection
  $.ajaxSetup({
    headers: {
      'csrf-token': $('meta[name="ct"]').attr('content')
    }
  });

  // load all json data first
  $.when(
      $.ajax('/data/threshold_v0.1.1.json'),
      $.ajax('/data/tweets.txt'),
      $.ajax('/data/review.txt'),
      $.ajax('/data/personal-email.txt'),
      $.ajax('/data/review-fr.txt'))
    .done(function(thresholds, tweets, review, personalEmail, reviewFr) {
      var sampleText = {
        'review': review[0],
        'tweets': tweets[0],
        'email': personalEmail[0],
        'review-fr': reviewFr[0],
        'own-text': ''
      };
      allReady(thresholds[0], sampleText);
    });
}

/**
 * Load application after initial json data is loaded
 * @param {Object} thresholds thresholds json
 * @param {Object} sampleText collection of sample text json
 * @return {undefined}
 */
function allReady(thresholds, sampleText) {
  let globalArrTones = [];
  var $input = $('.input'),
    $output = $('.output'),
    $loading = $('.loading'),
    $error = $('.error'),
    $errorMessage = $('.error--message'),
    $textarea = $('.input--textarea'),
    $submitButton = $('.input--submit-button'),
    $originalTexts = $('.original-text--texts'),
    selectedLang = 'en',
    lastSentenceID;


    let myRec = new p5.SpeechRec('en-US', parseResult);
    myRec.continuous = true;

      $('#start_button').on('click', function() {
        myRec.start();
        myRec.onResult = parseResult;
      });


    function parseResult() {
      let result = myRec.resultString;
      let parts = getPartsOfSpeech(result);

      getToneAnalysis(result);

      result = result.split(' ');
      console.log(result, "This is the sentence") // ['I', 'think', 'you', 'are', 'good']

      console.log(parts, "These are the parts of speech") // ['n', 'v', 'n', 'v', 'adj']
    }

    function getPartsOfSpeech(input) {
      return RiTa.getPosTags(input, true);
    }



    function writePoem(tone, text, parts) {
      // tone = 'analytical'
      // text = array of words
      // parts = array of parts

      if (tone == 'analytical') {
        makeAnalytical(text, parts);
      } else if (tone === 'sad') {
        makeSad(text, parts)
      } else {
        // if no tone
      }
    }

    function makeAnalytical(text, parts) {

    }


  /**
   * Callback function for AJAX post to get tone analyzer data
   * @param {Object} data response data from api
   * @return {undefined}
   */
  function toneCallback(data) {
    $input.show();
    $loading.hide();
    $error.hide();
    $output.show();
    // scrollTo($output);

    console.log(data)

    var emotionTone = data.document_tone.tones.slice(0),
      selectedSample = $('input[name=rb]:checked').val(),
      selectedSampleText = $textarea.val(),
      sentences, sentenceTone = [],
      app;

    // if only one sentence, sentences will not exist, so mutate sentences_tone manually
    if (typeof(data.sentences_tone) === 'undefined' || data.sentences_tone === null) {
      sentences = [{
        sentence_id: 0, // eslint-disable-line camelcase
        text: selectedSampleText,
        tones: data.document_tone.tones.slice(0)
      }];
    } else {
      //Deep copy data.sentences_tone
      sentences = JSON.parse(JSON.stringify(data.sentences_tone));
    }

    //Populate sentencesTone with all unique tones in sentences, to be displayed in sentence view
    sentences.forEach(function(elements) {
      globalArrTones.push(elements);
      elements.tones.forEach(function(item) {
        if (sentenceTone[item.tone_id] == null || sentenceTone[item.tone_id].score < item.score) {
          sentenceTone[item.tone_id] = item;
        }
      });
    });
    sentenceTone = Object.keys(sentenceTone).sort().map(function(obj) {
      return sentenceTone[obj];
    });

    console.log(sentenceTone);


    app = new App(data.document_tone, sentences, thresholds, selectedSample, sentenceTone);
    /**
     * Map Callback function for emotion document tones
     * @param {Object} item current iterating element
     * @return {Object} label, score, threshold
     */
    function emotionMap(item) {
      var v1 = app.percentagify(item.score, 'Emotion Tone');
      var v2 = app.percentagify(app.thresholds().doc[item.tone_name][0]);
      var v3 = app.percentagify(app.thresholds().doc[item.tone_name][1]);
      return {
        label: item.tone_name,
        score: app.percentagify(item.score, 'Emotion Tone'),
        tooltip: app.toneHash()[item.tone_name].tooltip,
        likeliness: v1 > v3 ? 'VERY LIKELY' : v1 >= v2 ? 'LIKELY' : 'UNLIKELY',
        visible: v1 > v3 ? 'show' : v1 >= v2 ? 'show' : 'dim',
        thresholdLow: app.percentagify(app.thresholds().doc[item.tone_name][0]),
        thresholdHigh: app.percentagify(app.thresholds().doc[item.tone_name][1])
      };
    }

    emotionTone = app.getDocumentToneDefault();

    // Update scores for the tones present in response at document level
    if (typeof(data.document_tone.tones) !== 'undefined' && data.document_tone.tones !== null) {
      data.document_tone.tones.forEach(function(element) {
        emotionTone.forEach(function(item) {
          if (item.tone_id == element.tone_id) {
            item.score = element.score;
          }
        });
      });
    }

    emotionTone = emotionTone.map(emotionMap);
    sentenceTone = sentenceTone.map(emotionMap);
  }

  /**
   * AJAX Post request on error callback
   * @param {Object} error The error
   * @return {undefined}
   */
  function _error(error) {
    var message = typeof error.responseJSON.error === 'string' ?
      error.responseJSON.error :
      'Error code ' + error.responseJSON.error.code + ': ' + error.responseJSON.error.message;

    if (error.responseJSON.code === 429) {
      message = 'You\'ve sent a lot of requests in a short amount of time. ' +
        'As the CPU cores cool off a bit, wait a few seonds before sending more requests.';
    }

  }

  /**
   * AJAX Post request for tone analyzer api
   * @param {String} text request body text
   * @return {undefined}
   */
  function getToneAnalysis(text) {
    $.post('/api/tone', {'text': text,'language': selectedLang}, toneCallback)
      .fail(_error);
  }

  /**
   * Submit button click event
   */
  $submitButton.click(function() {
    lastSentenceID = null
    // getToneAnalysis(final_transcript);
    // getToneAnalysis($textarea.val());
    // TODO: call getToneAnalysis() HERE when the speech is complete.

    setTimeout(showJson, 3000)
  });


function showJson() {
    let test = document.createElement('div');

    for (let i = 0; i < globalArrTones.length; i++) {
      let data = JSON.stringify(globalArrTones[i]);
      let item = document.createElement('pre')
      item.innerHTML = data;
      test.appendChild(item);
    }
    let jsonOutput = document.getElementById('jsonOutput');
        jsonOutput.appendChild(test);
  }
}
$(document).ready(ready);
