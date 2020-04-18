{
  ("use strict");

  let notes = [
    ["C"],
    ["C#", "Db"],
    ["D"],
    ["D#", "Eb"],
    ["E"],
    ["F"],
    ["F#", "Gb"],
    ["G"],
    ["G#", "Ab"],
    ["A"],
    ["A#", "Bb"],
    ["B"],
    ["C"],
    ["C#", "Db"],
    ["D"],
    ["D#", "Eb"],
    ["E"],
    ["F"],
    ["F#", "Gb"],
    ["G"],
    ["G#", "Ab"],
    ["A"],
    ["A#", "Bb"],
    ["B"]
  ];

  function find_first_occurrence_of(key) {
     for (var i = 0; i < 12; i++) {
      for (var eq = 0; eq < notes[i].length; eq++) {
        if (notes[i][eq] == key) {
          return i;
        }
      }
    }
    return null;
  }

  function setup_scales(key) {
    var start_index = find_first_occurrence_of(key);
    if (start_index == null) {
      start_index = 0;
    }

    setHarmonicaKey(key);
 //   real_note = absolute_harmonica_starting_note[start_index];

    for (var note = 0; note < 12; note++) {
      var out = document.getElementsByClassName("note_" + note);
      note_in_key = note + start_index;
      for (var i = 0; i < out.length; i++) {
        if (notes[note_in_key].length != 0) {
          out[i].innerHTML = notes[note_in_key][0];
        } else {
          out[i].innerHTML = notes[note][0];
        }
      }
    }
  }
}
