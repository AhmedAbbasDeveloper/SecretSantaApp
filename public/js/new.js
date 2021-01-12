var reqs_id = 0;

function removeElement(ev) {
  var button = ev.target;
  var field = button.previousSibling;
  var space = field.previousSibling;
  var div = button.parentElement;
  var par_div = div.parentElement;
  par_div.removeChild(div);
}

function add() {
  reqs_id++;
  var div = document.createElement("div");
  div.style.display = "flex";
  div.className = "mb-3";

  var input = document.createElement("input");
  input.type = "text";
  input.setAttribute("name", "participant" + reqs_id);
  input.setAttribute("class", "form-control");
  input.setAttribute("placeholder", "Participant Name");
  var reqs = document.getElementById("reqs");

  var remove = document.createElement("button");
  remove.setAttribute("id", "reqsr" + reqs_id);
  remove.setAttribute("class", "btn btn-danger");
  remove.setAttribute("type", "button");
  remove.onclick = function(e) {
    removeElement(e)
  };
  remove.innerHTML = "X";

  div.appendChild(input);
  div.appendChild(remove);
  var new_ln = document.createTextNode("\r\n");
  div.appendChild(new_ln);
  reqs.appendChild(div);
}
