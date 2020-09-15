function load_content(event, content) {
  var contents = document.getElementsByClassName("content");
  var links = document.getElementsByClassName("link");

  for (var i = 0; i < contents.length; i++)
    contents[i].style.display = "none";
  for (var i = 0; i < links.length; i++) {
    links[i].className = links[i].className.replace(" active", "");
  }

  document.getElementById(content).style.display = "block";
  event.currentTarget.className += " active";
}
