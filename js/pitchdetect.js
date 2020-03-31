/*
The MIT License (MIT)

Copyright (c) 2014 Chris Wilson

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

window.AudioContext = window.AudioContext || window.webkitAudioContext;

var audioContext = null;
var isPlaying = false;
var sourceNode = null;
var analyser = null;
var theBuffer = null;
var DEBUGCANVAS = null;
var mediaStreamSource = null;
var shouldStop = null;
var detectorElem,
  canvasElem,
  waveCanvas,
  pitchElem,
  noteElem,
  detuneElem,
  detuneAmount;
var frequency_buf = null;
var SAMPLE_RATE = 44000;

function pitchDetectOnLoad() {
	//audioContext.sampleRate
//  audioContext = new AudioContext({sampleRate: 44000});
 MAX_SIZE = Math.max(4, Math.floor(SAMPLE_RATE / 5000)); // corresponds to a 5kHz signal

  detectorElem = document.getElementById("detector");
  canvasElem = document.getElementById("output");
  DEBUGCANVAS = document.getElementById("waveform");
  if (DEBUGCANVAS) {
    waveCanvas = DEBUGCANVAS.getContext("2d");
    DEBUGCANVAS.setAttribute("width", 1024);
    waveCanvas.strokeStyle = "black";
    waveCanvas.lineWidth = 1;
  }
  pitchElem = document.getElementById("pitch");
  noteElem = document.getElementById("note");
  detuneElem = document.getElementById("detune");
  detuneAmount = document.getElementById("detune_amt");

  detectorElem.ondragenter = function() {
    this.classList.add("droptarget");
    return false;
  };
  detectorElem.ondragleave = function() {
    this.classList.remove("droptarget");
    return false;
  };
  detectorElem.ondrop = function(e) {
    this.classList.remove("droptarget");
    e.preventDefault();
    theBuffer = null;

    var reader = new FileReader();
    reader.onload = function(event) {
      audioContext.decodeAudioData(
        event.target.result,
        function(buffer) {
          theBuffer = buffer;
        },
        function() {
          alert("error loading!");
        }
      );
    };
    reader.onerror = function(event) {
      alert("Error: " + reader.error);
    };
    reader.readAsArrayBuffer(e.dataTransfer.files[0]);
    return false;
  };
}
function getUserMedia(dictionary, callback) {
  try {
    navigator.getUserMedia =
      navigator.getUserMedia ||
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia;
    navigator.getUserMedia(dictionary, callback, error);
  } catch (e) {
    alert("getUserMedia threw exception :" + e);
  }
}

function toggleLiveInput() {
  if (isPlaying) {
    //stop playing and return
    sourceNode.stop(0);
    sourceNode = null;
    analyser = null;
    frequency_buf = null;
    isPlaying = false;
    if (!window.cancelAnimationFrame)
      window.cancelAnimationFrame = window.webkitCancelAnimationFrame;
    window.cancelAnimationFrame(rafID);
  } else {
    if (audioContext== null){
      audioContext = new AudioContext({sampleRate: SAMPLE_RATE});
    }
  }
  getUserMedia(
    {
      audio: {
        mandatory: {
          googEchoCancellation: "false",
          googAutoGainControl: "false",
          googNoiseSuppression: "false",
          googHighpassFilter: "false"
        },
        optional: []
      }
    },
    gotStream
  );
}

function error() {
  alert("Stream generation failed.");
}

function gotStream(stream) {
  audioContext.resume();
  // Create an AudioNode from the stream.
  mediaStreamSource = audioContext.createMediaStreamSource(stream);

  // Connect it to the destination.
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 2048;
  analyser.smoothingTimeConstant = 0;
  if (DEBUGCANVAS) {
    DEBUGCANVAS.setAttribute("width", analyser.frequencyBinCount);
  }
  frequency_buf = new Uint8Array(analyser.frequencyBinCount);
  mediaStreamSource.connect(analyser);
  shouldStop = false;
  updatePitch();
}

function stopListening() {
  audioContext.suspend();
  shouldStop = true;
}

var buflen = 1024;
var buf = new Float32Array(buflen);

var noteStrings = [
  "A",
  "A#",
  "B",
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#"
  ];

// note relative to A2 on a piano
function noteFromPitch(frequency) {
  var noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
  return Math.round(noteNum) + (49-25);
}
// note relative to A2 on a piano
function frequencyFromNoteNumber(note) {
  return 440 * Math.pow(2, (note - (49-25)) / 12);
}

function centsOffFromPitch(frequency, note) {
  return Math.floor(
    (1200 * Math.log(frequency / frequencyFromNoteNumber(note))) / Math.log(2)
  );
}

// this is a float version of the algorithm below - but it's not currently used.
/*
function autoCorrelateFloat( buf, sampleRate ) {
	var MIN_SAMPLES = 4;	// corresponds to an 11kHz signal
	var MAX_SAMPLES = 1000; // corresponds to a 44Hz signal
	var SIZE = 1000;
	var best_offset = -1;
	var best_correlation = 0;
	var rms = 0;

	if (buf.length < (SIZE + MAX_SAMPLES - MIN_SAMPLES))
		return -1;  // Not enough data

	for (var i=0;i<SIZE;i++)
		rms += buf[i]*buf[i];
	rms = Math.sqrt(rms/SIZE);

	for (var offset = MIN_SAMPLES; offset <= MAX_SAMPLES; offset++) {
		var correlation = 0;

		for (var i=0; i<SIZE; i++) {
			correlation += Math.abs(buf[i]-buf[i+offset]);
		}
		correlation = 1 - (correlation/SIZE);
		if (correlation > best_correlation) {
			best_correlation = correlation;
			best_offset = offset;
		}
	}
	if ((rms>0.1)&&(best_correlation > 0.1)) {
		console.log("f = " + sampleRate/best_offset + "Hz (rms: " + rms + " confidence: " + best_correlation + ")");
	}
//	var best_frequency = sampleRate/best_offset;
}
*/

var MIN_SAMPLES = 0; // will be initialized when AudioContext is created.
var GOOD_ENOUGH_CORRELATION = 0.7; // this is the "bar" for how close a correlation needs to be

function frequencyAnalysis(buffer, samplingRate){
  

  max_pos = 0;
  for (var i = 1; i < buffer.length; i++){
    if (buffer[i] > buffer[max_pos]){
      max_pos = i;
    }
  }

  if (max_pos != 0 && max_pos+1 < buffer.length){
    // parabolic interponation given on max_pos +-1 and the relative buffervalues
    var x1 = max_pos-1;
    var x2 = max_pos;
    var x3 = max_pos+1;

    var y1 = buffer[max_pos-1];
    var y2 = buffer[max_pos];
    var y3 = buffer[max_pos+1];

      var a = (y3-y1)-(y2-y1)/(x3*x3 - x1*x1)-(x2*x2-x1*x1)*(x3-x1);
      var b = (y2-y1)-a*(x2*x2-x1*x1);
      var exact_pos = -b/(2*a);
      return exact_pos;
    }

  return max_pos;

}



function autoCorrelate(buf, sampleRate) {
  var SIZE = buf.length;
  var MAX_SAMPLES = Math.floor(SIZE / 2);
  var best_offset = -1;
  var best_correlation = 0;
  var rms = 0;
  var foundGoodCorrelation = false;
  var correlations = new Array(MAX_SAMPLES);

  for (var i = 0; i < SIZE; i++) {
    var val = buf[i];
    rms += val * val;
  }
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01)
    // not enough signal
    return -1;

  var lastCorrelation = 1;
  for (var offset = MIN_SAMPLES; offset < MAX_SAMPLES; offset++) {
    var correlation = 0;

    for (var i = 0; i < MAX_SAMPLES; i++) {
      correlation += Math.abs(buf[i] - buf[i + offset]);
    }
    correlation = 1 - correlation / MAX_SAMPLES;
    correlations[offset] = correlation; // store it, for the tweaking we need to do below.
    if (
      correlation > GOOD_ENOUGH_CORRELATION &&
      correlation > lastCorrelation
    ) {
      foundGoodCorrelation = true;
      if (correlation > best_correlation) {
        best_correlation = correlation;
        best_offset = offset;
      }
    } else if (foundGoodCorrelation) {
      // short-circuit - we found a good correlation, then a bad one, so we'd just be seeing copies from here.
      // Now we need to tweak the offset - by interpolating between the values to the left and right of the
      // best offset, and shifting it a bit.  This is complex, and HACKY in this code (happy to take PRs!) -
      // we need to do a curve fit on correlations[] around best_offset in order to better determine precise
      // (anti-aliased) offset.

      // we know best_offset >=1,
      // since foundGoodCorrelation cannot go to true until the second pass (offset=1), and
      // we can't drop into this clause until the following pass (else if).
      var shift =
        (correlations[best_offset + 1] - correlations[best_offset - 1]) /
        correlations[best_offset];
      return sampleRate / (best_offset + 8 * shift);
    }
    lastCorrelation = correlation;
  }
  if (best_correlation > 0.01) {
    // console.log("f = " + sampleRate/best_offset + "Hz (rms: " + rms + " confidence: " + best_correlation + ")")
    return sampleRate / best_offset;
  }
  return -1;
  //	var best_frequency = sampleRate/best_offset;
}

function updatePitch(time) {
  var cycles = new Array();
  analyser.getByteFrequencyData(frequency_buf);
  analyser.getFloatTimeDomainData(buf);

  
  var freq = frequencyAnalysis(frequency_buf, audioContext.sampleRate);
  
  var ac = autoCorrelate(buf, audioContext.sampleRate);
  // TODO: Paint confidence meter on canvasElem here.
  
  
  if (shouldStop) {
    return;
  }
  if (DEBUGCANVAS) {
    // This draws the current waveform, useful for debugging
    var buffer_size = frequency_buf.length;
    waveCanvas.clearRect(0, 0, buffer_size, 256);
    waveCanvas.strokeStyle = "red";
    waveCanvas.beginPath();

    waveCanvas.moveTo(0, 0);
    waveCanvas.lineTo(0, 256);

    waveCanvas.moveTo(buffer_size / 4, 0);
    waveCanvas.lineTo(buffer_size / 4, 256);

    waveCanvas.moveTo(buffer_size / 2, 0);
    waveCanvas.lineTo(buffer_size / 2, 256);

    waveCanvas.moveTo((3 * buffer_size) / 4, 0);
    waveCanvas.lineTo((3 * buffer_size) / 4, 256);

    waveCanvas.moveTo(buffer_size - 1, 0);
    waveCanvas.lineTo(buffer_size - 1, 256);

    waveCanvas.stroke();

    waveCanvas.strokeStyle = "black";    
    waveCanvas.beginPath();
    waveCanvas.moveTo(0, frequency_buf[0]);
    for (var i = 1; i < frequency_buf.length; i++) {
      waveCanvas.lineTo(i, 256 - frequency_buf[i]);
    }
    waveCanvas.stroke();
    
    if (freq != 0){
      waveCanvas.strokeStyle = "green";    
      waveCanvas.beginPath();
      waveCanvas.moveTo(freq, 0);
      waveCanvas.lineTo(freq, 256 );
      waveCanvas.stroke();    
    }
  }

  if (freq == 0) {
    detectorElem.className = "vague";
    pitchElem.innerText = "--";
    noteElem.innerText = "-";
    detuneElem.className = "";
    detuneAmount.innerText = "--";
  } else {
    detectorElem.className = "confident";
    pitch = (audioContext.sampleRate / analyser.fftSize)*freq;
    pitchElem.innerText = pitch;

    var note = noteFromPitch(pitch);
    noteElem.innerHTML = noteStrings[note % 12];
    var detune = centsOffFromPitch(pitch, note);
    if (detune == 0) {
      detuneElem.className = "";
      detuneAmount.innerHTML = "--";
    } else {
      if (detune < 0) detuneElem.className = "flat";
      else detuneElem.className = "sharp";
      detuneAmount.innerHTML = Math.abs(detune);
    }
  }

  if (!window.requestAnimationFrame)
    window.requestAnimationFrame = window.webkitRequestAnimationFrame;
  rafID = window.requestAnimationFrame(updatePitch);
}
