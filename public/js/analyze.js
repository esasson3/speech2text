let joyAdj = ['bright', 'upbeat', 'glory', 'yellow', 'dynamic', 'alive', 'blissed',
    'buoyant', 'high', 'rapt', 'sunny', 'tickled', 'pink', 'airy', 'lifted', 'pleasant'
];

let joyNoun = ['celebration', 'morning', 'light'];

let fearAdj = ['scared', 'sinister', 'trembling', 'anxious', 'suspect',
    'shady', 'trapped', 'exposed', 'vulnerable'
];

let fearNoun = ['shadow', 'phobia', 'panic', 'alarm', 'risk', 'danger',
    'gamble', 'stakes'
];

let sadnessAdj = ['down', 'gloomy', "melancholy", 'misfortune', 'woeful', 'blue', 'desolate', 'downbeat', 'downcast', 'flat', 'heavy',
    'sulky', 'unhappy', 'sorrowful', 'dejected', 'depressed', 'downcast', 'miserable', 'down',
    'despondent', 'despairing', 'disconsolate', 'desolate', 'wretched', 'glum', 'gloomy', 'doleful', 'dismal', 'melancholy',
    'mournful', 'woebegone', 'forlorn', 'crestfallen', 'heartbroken', 'inconsolable', 'blue', 'down in/at the mouth',
    'down in the dumps', 'blah'
];

let sadnessNoun = ["misfortune", "gloom", "cloud", 'sorrow', 'dejection', 'misery', 'despondency',
'despair', 'desolation', 'wretchedness', 'gloom', 'gloominess', 'dolefulness',
'melancholy', 'mournfulness', 'woe', 'heartache',
'grief', 'the blues'];

let angerAdj = ['messed up', 'tempered', 'bitter', 'bigoted', 'agrieved', 'bent', 'red',
    'moody', 'rancorous', 'burning', 'venomous',
];

let angerNoun = ['fury', 'heat', 'shit', 'damn', 'asperity', 'resentment', 'bile', 'funk', 'grudge',
    'fit', 'wrath'
];

let noEmo = ['neutral', 'fine', 'okay', 'calm', 'nonchalant']

let anal = ["I think", ":", '-', 'if', 'that explains', '$', 'either or'];

let tent = ["maybe", "...", "?", 'I guess', 'hmm', '/', 'or', "but..."];

let conf = ["definitely", "truly",'I believe', 'surely',  "!", '.', 'and'];


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
    let poemToFormat;


    let myRec = new p5.SpeechRec('en-US'); // Speech capture item

    function toneCallback(data) {
        let tones = data.document_tone.tones.slice(0);

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


    $( "#start_button" )
      .mouseup(function() {
        console.log('stopping')
        myRec.stop;
      })
      .mousedown(function() {
        console.log('starting')
        myRec.start();
        myRec.onResult = parseSpeech;
        });

    function parseSpeech() {
        let input = myRec.resultString;
        let parts = getPartsOfSpeech(input);
        let result = input.split(' ');

        let tonesArr = [];

        if (input.length > 0) { // If we have any sort of input, follow this codepath to send to API
            getToneAnalysis(input); // Pushes the tones into a global array, then pass that array to the timeout function -> timeoutTones
            setTimeout(timeOutTones(globalTones, tonesArr, parts, result), 800); // This timout allows the API results to come back and populate the tonesArray
          }
      }

      function timeOutTones(tones, arr, parts, result) {
          return function() {
            let poem
              for (let i = 0; i < tones.length; i++) {
                  arr.push(tones[i])
              }
              poem = determinesLanguage(arr, parts, result);
              returnPoem(poem);
              globalTones = []; // Resets the global array to be empty
              pickFormat(poemToFormat)
          }
      }

      function returnPoem(poem) {
        poemToFormat = poem;
        return poemToFormat;
      }


      function pickFormat(array) {
        if (array) {
          let tone = array[0];
          let poem = array[1];
          if (tone == 'Tentative') {
            formatTentative(poem)
          } else if (tone == 'Analytical') {
            formatAnalytical(poem)
          } else if (tone == 'Confident') {
            formatConfident(poem)
          } else {
            formatPassive(poem)
          }
        }

      }


      function formatAnalytical(poem) {
        console.log('formatting poem')
        makePoem(poem);
      }


      function formatConfident(poem) {
        console.log('formatting poem')
        makePoem(poem);

      }

      function formatTentative(poem) {
        console.log('formatting poem')
        makePoem(poem);
      }

      function formatPassive(poem) {
        console.log('formatting poem')
        makePoem(poem);
      }

      function makePoem(finalString) {
        console.log('making poem')

        let container = document.getElementById('container');

        let newPoem = document.createElement('p');
            newPoem.setAttribute('class', 'poem')
        let node = document.createTextNode(finalString);


        newPoem.appendChild(node);
        container.appendChild(newPoem);
      }


        function determinesLanguage(tones, parts, result) {
            let languageTone;
            let emotionTone;

            languageTone = tones.filter(tone => tone.length > 7);
            emotionTone = tones.filter(eTone => eTone.length < 8);

            if (emotionTone.length < 4) {
              emotionTone = wordPicker(noEmo);
              console.log('emo', emotionTone)
            }
            let finalPoem;

            if (languageTone[0] == 'Analytical') {
                console.log('Analytical')
                finalPoem = makeAnalytical(emotionTone, parts, result)
            } else if (languageTone[0] == 'Confident') {
                console.log('Confident')
                finalPoem = makeConfident(emotionTone, parts, result);
            } else if (languageTone[0] == 'Tentative') {
                console.log('Tentative')
                finalPoem = makeTentative(emotionTone, parts, result);
            } else {
                console.log('Passive')
              finalPoem = makePassive(emotionTone, parts, result);
            }

            return [languageTone, finalPoem];
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

            result.splice(0, wordPicker(anal));
            for (let i = 0; i < result.length; i++) {
                if (parts[i] == '-') {
                    let sub = wordPicker(anal);
                    result.splice(i, 1, sub);
                    result.splice(i, 0, '\n');
                }
                if (parts[i] == 'a') {
                    let sub = whichAdj(emotionTone)
                    result.splice(i, 1, sub);
                }
                if (parts[i] == 'n') {
                    let sub = whichNoun(emotionTone);
                    result.splice(i, 0, sub);
                }
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
            return finalString;
        }

        function makeConfident(emotionTone, parts, result) {
          console.log(emotionTone);
          //Confident array1 = ["surely" 'noun' 'verb' '-' 'adj' 'adv 'v']
          //array2 = ["noun" verb' 'noun']
        //  result.reverse();
          //result.pop();
          result.splice(0, wordPicker(conf));
            for (let i = 0; i < result.length; i++) {
                if (parts[i] == '-') {
                  let sub = wordPicker(conf);
                  result.splice(i, 1, sub);
                  result.splice(i, 0, '\n');
                }
                if (parts[i] == 'a') {
                  let sub = whichAdj(emotionTone);
                    result.splice(i, 1, sub);
                }
                if (parts[i] == 'n') {
                    let sub = whichNoun(emotionTone);
                    result.splice(i, 0, sub);
                }
            }
            let finalString = result.join(' ');
            console.log(finalString);
            return finalString;
        }

        function makeTentative(emotionTone, parts, result) {
            console.log(emotionTone);
          //  result.reverse();
            //result.pop();
            result.splice(0, wordPicker(tent));
            for (let i = 0; i < result.length; i++) {
                if (parts[i] == '-') {
                  let sub = wordPicker(tent);
                  result.splice(i, 1, sub);
                  result.splice(i, 0, '\n');
                }
                if (parts[i] == 'a') {
                   let sub = whichAdj(emotionTone);
                   result.splice(i, 1, sub);
                }
                if (parts[i] == 'n') {
                  let sub = whichNoun(emotionTone);
                  result.splice(i, 0, sub);
                }
            }

            let finalString = result.join(' ');
            console.log(finalString);
            return finalString;
        }

        function makePassive(emotionTone, parts, result) {
            console.log(emotionTone);
            //result.reverse();
            //result.pop();

            /*let passivePoem = [];
            let a = parts.indexOf('-');
            passivePoem.push(result[a]);
            result.splice(a, 1);

            let b = parts.indexOf('a');
            passivePoem.push(result[b]);
            result.splice(b, 1);

            let sub = whichAdj(emotionTone);
            passivePoem.push(sub);

            let c = parts.indexOf('n');
            passivePoem.push(result[c]);
            result.splice(c, 1);

            let d = parts.indexOf('v');
            passivePoem.push(result[d]);
            result.splice(d, 1);

            let e = parts.indexOf('-');
            passivePoem.push(result[e]);
            result.splice(e, 1);
*/

            for (let i = 0; i < result.length; i++) {
                if (parts[i] == '-') {
                  let sub = wordPicker(conf);
                  result.splice(i, 1, sub);
                  result.splice(i, 0, '\n');
                }
                if (parts[i] == 'a') {
                  let sub = whichAdj(emotionTone);
                  result.splice(i, 1, sub);
                }
                if (parts[i] == 'n') {
                    let sub = whichNoun(emotionTone);
                    result.splice(i, 0, sub);
                }
            }

            let finalString = result.join(' ');
            console.log(finalString);
            return finalString;
        }

        function whichAdj(emotionTone) {
            if (emotionTone == "Fear")
                return wordPicker(fearAdj);
            else if (emotionTone == "Joy")
                return wordPicker(joyAdj);
            else if (emotionTone == "Anger")
                return wordPicker(angerAdj);
            else
                return wordPicker(noEmo);
        }

        function whichNoun(emotionTone) {
            if (emotionTone == "Fear")
                return wordPicker(fearNoun);
            else if (emotionTone == "Joy")
                return wordPicker(joyNoun);
            else if (emotionTone == "Anger")
                return wordPicker(angerNoun);
            else
                return wordPicker(noEmo);
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
