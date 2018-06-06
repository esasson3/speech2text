$(document).ready(function() {
  $('#startModal').dialog(({show: 'fade'}));

  $('#question_button').on('click', function() {
      $('#startModal').dialog(({show: 'fade'}));
  });

  $('#closeButton').on('click', function() {
    $('#startModal').dialog('close');
  });
  $('#start_button').on('click', function() {
    $('#startModal').dialog('close');
  });
});
