function load_content(content) {
  var contents = document.getElementsByClassName("content");
  var links = document.getElementsByClassName("link");

  for (var i = 0; i < contents.length; i++)
    contents[i].style.display = "none";
  for (var i = 0; i < links.length; i++) {
    links[i].className = links[i].className.replace(" active", "");
  }

  document.getElementById(content).style.display = "block";
  document.getElementById(`${content}_tab_button`).className += " active";
}

export { load_content };
