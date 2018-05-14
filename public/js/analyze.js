showInfo('info_start');
var create_email = false;
var final_transcript = '';
var recognizing = false;
var ignore_onend;
var start_timestamp;

let globalArrTones = [];
if (!('webkitSpeechRecognition' in window)) {
    upgrade();
} else {
    start_button.style.display = 'inline-block';
    var recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onstart = function() {
        recognizing = true;
        showInfo('info_speak_now');
        start_img.src = '/images/mic-animate.gif';
    };
    recognition.onerror = function(event) {
        if (event.error == 'no-speech') {
            start_img.src = '/images/mic.gif';
            showInfo('info_no_speech');
            ignore_onend = true;
        }
        if (event.error == 'audio-capture') {
            start_img.src = '/images/mic.gif';
            showInfo('info_no_microphone');
            ignore_onend = true;
        }
        if (event.error == 'not-allowed') {
            if (event.timeStamp - start_timestamp < 100) {
                showInfo('info_blocked');
            } else {
                showInfo('info_denied');
            }
            ignore_onend = true;
        }
    };
    recognition.onend = function() {
        recognizing = false;
        if (ignore_onend) {
            return;
        }
        start_img.src = '/images/mic.gif';
        if (!final_transcript) {
            showInfo('info_start');
            return;
        }
        showInfo('');
        if (window.getSelection) {
            window.getSelection().removeAllRanges();
            var range = document.createRange();
            range.selectNode(document.getElementById('final_span'));
            window.getSelection().addRange(range);
        }
        if (create_email) {
            create_email = false;
            createEmail();
        }
    };

    recognition.onresult = function(event) {
        var interim_transcript = '';
        for (var i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                final_transcript += event.results[i][0].transcript;
            } else {
                interim_transcript += event.results[i][0].transcript;
            }
        }
        
        
        var shown_transcript = final_transcript;
//        getToneAnalysis(shown_transcript);
        
        // analyze shown_transcript
        // use analyzer results to change final_transcript
        
        
        final_transcript = capitalize(final_transcript);
        final_span.innerHTML = linebreak(final_transcript);
        interim_span.innerHTML = linebreak(interim_transcript);
        if (final_transcript || interim_transcript) {
            showButtons('inline-block');
        }
    };

}

function upgrade() {
    start_button.style.visibility = 'hidden';
    showInfo('info_upgrade');
}
var two_line = /\n\n/g;
var one_line = /\n/g;

function linebreak(s) {
    return s.replace(two_line, '<p></p>').replace(one_line, '<br>');
}
var first_char = /\S/;

function capitalize(s) {
    return s.replace(first_char, function(m) {
        return m.toUpperCase();
    });
}

//function createEmail() {
//    var n = final_transcript.indexOf('\n');
//    if (n < 0 || n >= 80) {
//        n = 40 + final_transcript.substring(40).indexOf(' ');
//    }
//    var subject = encodeURI(final_transcript.substring(0, n));
//    var body = encodeURI(final_transcript.substring(n + 1));
//    window.location.href = 'mailto:?subject=' + subject + '&body=' + body;
//}

//function copyButton() {
//    if (recognizing) {
//        recognizing = false;
//        recognition.stop();
//    }
//    copy_info.style.display = 'inline-block';
//    showInfo('');
//}

//function emailButton() {
//    if (recognizing) {
//        create_email = true;
//        recognizing = false;
//        recognition.stop();
//    } else {
//        createEmail();
//    }
//    email_button.style.display = 'none';
//    email_info.style.display = 'inline-block';
//    showInfo('');
//}

function startButton(event) {
    if (recognizing) {
        recognition.stop();
        return;
    }
    final_transcript = '';
    recognition.lang = 'en-US';
    recognition.start();
    ignore_onend = false;
    final_span.innerHTML = '';
    interim_span.innerHTML = '';
    start_img.src = '/images/mic-slash.gif';
    showInfo('info_allow');
    start_timestamp = event.timeStamp;
}

function showInfo(s) {
    if (s) {
        for (var child = info.firstChild; child; child = child.nextSibling) {
            if (child.style) {
                child.style.display = child.id == s ? 'inline' : 'none';
            }
        }
        info.style.visibility = 'visible';
    } else {
        info.style.visibility = 'hidden';
    }
}
var current_style;

function showButtons(style) {
    if (style == current_style) {
        return;
    }
    current_style = style;
    email_button.style.display = style;
    copy_info.style.display = 'none';
    email_info.style.display = 'none';
}




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
    var i;
    for (i = 0; i < sentenceTone.length; i++) {
        if (sentenceTone[i].tone_id == "analytical") {
            final_transcript += '?';
            }
        if (sentenceTone[i].tone_id == "joy"){
            final_transcript += '!';
            final_transcipt.italics();
        }
        if (sentenceTone[i].tone_id == "fear") {
            final_transcipt.italics();
        }
    }
       
    final_transcript = capitalize(final_transcript);
    final_span.innerHTML = linebreak(final_transcript);
    interim_span.innerHTML = linebreak(interim_transcript);
    if (final_transcript || interim_transcript) {
                showButtons('inline-block'); }

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

    $input.show();
    $loading.hide();
    $output.hide();
    $error.show();
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
    lastSentenceID = null;
    getToneAnalysis(final_transcript);
    getToneAnalysis($textarea.val());


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
