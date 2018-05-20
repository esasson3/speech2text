let joyAdj = ['bright', 'upbeat', 'glory', 'yellow', 'dynamic', 'alive', 'blissed',
'buoyant', 'high', 'rapt', 'sunny', 'tickled', 'pink', 'airy', 'lifted', 'pleasant'];

let joyNoun = ['celebration', 'morning', 'light'];

let fearAdj = ['scared', 'sinister', 'tremble', 'anxious', 'suspect',
'shady', 'trapped', 'exposed', 'vulnerable'];

let fearNoun = ['shadow', 'phobia','panic', 'alarm', 'risk', 'danger',
'gamble', 'stakes'];

let sadnessAdj = ['down', 'gloomy', "melancholy", 'misfortune',
'pathos', 'woeful', 'blue', 'desolate', 'downbeat', 'downcast', 'flat', 'heavy',
'sulky'];

let sadnessNoun = ["misfortune", "pathos", "gloom", "cloud"];

let angerAdj = ['messed up',  'tempered', 'bitter', 'bigoted', 'agrieved', 'bent', 'red',
'moody', 'rancorous', 'burning', 'venomous', ];

let angerNoun = ['fury', 'heat', 'shit', 'damn', 'asperity','resentment','bile', 'funk', 'grudge',
'fit', 'wrath'];

let anal = ["I think", ""]

let tent = ["maybe", "...", "?"]

let conf = ["definitely", "truly" ]


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

  $('#start_button').on('click', function() { // On click, start recording
      myRec.start();
      myRec.onResult = parseSpeech;
    });

  function parseSpeech() {
    let input = myRec.resultString;
    let parts = getPartsOfSpeech(input);
    let result = input.split(' ');

    let tonesArr = [];

    if (input.length > 0) {  // If we have any sort of input, follow this codepath to send to API
      getToneAnalysis(input); // Pushes the tones into a global array, then pass that array to the timeout function -> timeoutTones
      setTimeout(timeOutTones(globalTones, tonesArr, parts, result), 1000);  // This timout allows the API results to come back and populate the tonesArray
    }


  function timeOutTones(tones, arr, parts, result) {
    return function() {
      for(let i = 0; i < tones.length; i++) {
        arr.push(tones[i])
      }
      determinesLanguage(arr, parts, result);
      globalTones = []; // Resets the global array to be empty
    }
  }


  /*
    EXAMPLE

    tones =  ["Joy", "Analytical", "Tentative"]
    parts = ["n", "r", "v", "-", "n"]
    result =  ["I'm", "really", "excited", "about", "today"]
  */

  function determinesLanguage(tones, parts, result) {

    console.log(tones, parts, result) // These are all the parameters you have to build new poems with
    let languageTone = tones[1], // languageTone is analytical/confident/tentative OR passive if theres no tone in that position
        emotionTone = tones[0]; // emotionTone is joy/fear/sadness etc.

    if (languageTone == 'Analytical') {
      makeAnalytical(emotionTone, parts, result)
    } else if (languageTone == 'Confident') {
      console.log('Confident')
      makeConfident(emotionTone, parts, result);
    } else if (languageTone == 'Tentative') {
      console.log('Tentative')
        makeTentative(emotionTone, parts, result);
    } else {
      console.log('Passive')
        makePassive(emotionTone, parts, result);
    }
  }

  function wordPicker(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

    /*
      Fill out the functions for each structure, follow the directions in makeAnalytical and complete for all functions
    */
    function makeAnalytical(emotionTone, parts, result) {
      /*
          use parts to get the position of a part of speech
          use result to replace an actual word in the array
          use emotionTone to choose which array to pick from (joy, fear, etc)
      */
      for (let i = 0; i < result.length; i++){
          if (parts[i] == '-')
          let sub = wordPicker(anal);
          result.splice(i, 0, sub)
          if (parts[i] == 'a')
          let sub = whichAdj(emotionTone)
            result.splice(i, 0, sub)
          if (parts[i] == 'n')
          let sub = whichNoun(emotionTone);
            result.splice(i, sub)
      }
      //console.log("new sent" + result);
      /*
        when you've finished subbing words in the array, use javascript native array method join()
        i.e.     result =  ["I'm", "really", "excited", "about", "today"]
        let finalString = result.join(' ');
        * finalString will be 'I'm really excited about today'
      */
       let finalString = result.join(' ');
       console.log(finalString);
    }

    function makeConfident(emotionTone, parts, result) {
      for (let i = 0; i < result.length; i++){
          if (parts[i] == '-')
          result.splice(i, 0, wordPicker(conf))
          if (parts[i] == 'a')
            result.splice(i, 0, whichAdj(emotionTone))
          if (parts[i] == 'n')
            result.splice(i, whichNoun(emotionTone))
      }
      let finalString = result.join(' ');
      console.log(finalString);
    }

    function makeTentative(emotionTone, parts, result) {
      for (let i = 0; i < result.length; i++){
          if (parts[i] == '-')
          result.splice(i, 0, wordPicker(tent))
          if (parts[i] == 'a')
            result.splice(i, 0, whichAdj(emotionTone))
          if (parts[i] == 'n')
            result.splice(i, whichNoun(emotionTone))
      }
      let finalString = result.join(' ');
      console.log(finalString);
    }

    function makePassive(emotionTone, parts, result) {
      for (let i = 0; i < result.length; i++){
          if (parts[i] == '-')
          result.splice(i, 0, wordPicker(tent))
          if (parts[i] == 'a')
            result.splice(i, 0, whichAdj(emotionTone))
          if (parts[i] == 'n')
            result.splice(i, whichNoun(emotionTone))
      }
      let finalString = result.join(' ');
      console.log(finalString);
  }

  function whichAdj(emotionTone){
    if (emotionTone == "Fear")
      return wordPicker(fearAdj);
    else if (emotionTone == "Joy")
      return wordPicker(joyAdj);
    else if (emotionTone == "Anger")
        return wordPicker(angerAdj);
    else
      return wordPicker(sadnessAdj);
  }

  function whichNoun(emotionTone){
    if (emotionTone == "Fear")
      return wordPicker(fearNoun);
    else if (emotionTone == "Joy")
      return wordPicker(joyNoun);
    else if (emotionTone == "Anger")
        return wordPicker(angerNoun);
    else
      return wordPicker(sadnessNoun);

  }

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
})
