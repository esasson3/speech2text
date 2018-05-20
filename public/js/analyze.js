let joy = ['bright', 'upbeat', 'glory', 'yellow', 'dynamic', 'alive', 'blissed',
'buoyant', 'high', 'rapt', 'sunny', 'tickled', 'pink', 'air', 'lifted'];

let fear = ['scared', 'sinister', 'tremble', 'shadowy', 'anxious', 'suspect',
'shady', 'phobia', 'panic', 'alarm', 'risk', 'danger',
'gamble', 'stakes', 'leap', 'trap', 'exposure', 'vulnerable'];

let sadness = ['down', 'gloomy', "melancholy", 'misfortune',
'pathos', 'woeful', 'blue', 'desolate', 'downbeat', 'downcast', 'flat', 'gloom', 'heavy',
'sulky', 'cloud'];

let anger = ['messed up', 'fury', 'heat', 'tempered', 'bitter', 'bigoted', 'agrieved', 'bent', 'red',
'shit', 'asperity', 'mood', 'resentment', 'bile', 'funk', 'grudge',
'fit', 'rancor', 'burn', 'venom', 'wrath'];


function allReady(thresholds) {

  function _error(error) {
    var message = typeof error.responseJSON.error === 'string' ?
        error.responseJSON.error :
        'Error code ' + error.responseJSON.error.code + ': ' + error.responseJSON.error.message;
    if (error.responseJSON.code === 429) {
        message = 'You\'ve sent a lot of requests in a short amount of time. ' +
          'As the CPU cores cool off a bit, wait a few seonds before sending more requests.';
    }
  }

let globalTones = [];

let myRec = new p5.SpeechRec('en-US'); // Speech capture item
myRec.continuous = true;

  function toneCallback(data) {
      let tones =  data.document_tone.tones.slice(0);

      tones.forEach(function(tone) {
        globalTones.push(tone.tone_name);
      });
    }

  function getToneAnalysis(text) {
      $.post('/api/tone', {
              'text': text
          },
        toneCallback
      ).fail(_error);
  }

  function getPartsOfSpeech(input) {
      return RiTa.getPosTags(input, true);
  }

  $('#start_button').on('click', function() { // on click, start recording
      myRec.start();
      myRec.onResult = parseSpeech;
    });

  function parseSpeech() {
    let input = myRec.resultString;
    let parts = getPartsOfSpeech(input);
    let result = input.split(' ');
    let sentenceTones;

    let tonesArr = [];
    if (input.length > 0) {
      getToneAnalysis(input);
      setTimeout(timeOutTones(globalTones, tonesArr), 1000); //pass parts and result here to make poems
    }

  }


  function timeOutTones(tones, arr) {
    return function() {
      for(let i = 0; i < tones.length; i++) {
        arr.push(tones[i])
      }
      determinesLanguage(arr);
      globalTones = [];
    }
  }


  function determinesLanguage(tones) {
    let languageTone = tones[1],
        emotionTone = tones[0];
    // let secondaryEmotion;
    //
    // if (tones[2]) { // This only get set if there are multiple feelings
    //   secondaryEmotion = tones[2];
    //   console.log(secondaryEmotion)
    // }
    console.log(tones)
    if (languageTone == 'Analytical') {
      console.log('Analytical')
    } else if (languageTone == 'Confident') {
      console.log('Confident')
    } else if (languageTone == 'Tentative') {
      console.log('Tentative')
    } else {
      console.log('Passive')
    }
  }


  function makeAnalytical() {

  }
}




$(document).ready(function() {
  $.ajaxSetup({
      headers: {
          'csrf-token': $('meta[name="ct"]').attr('content')
      }
  });
  $.when(
        $.ajax('/data/threshold_v0.1.1.json')
      )
    .done(function(thresholds) {
        allReady(thresholds[0]);
    });
});
