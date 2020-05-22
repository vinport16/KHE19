let chat = document.getElementById("chat");
let slots = chat.children[0].children;
let input = document.getElementById("chat-input");

messages = [
  {from:"server", text:"HELLO! hi!"},
  {from:"bobby", text:"this message is more recent"}
];

function displayText(message){
  return message.from + ": " + message.text;
}

function createMessageElement(message){
  let tr = document.createElement("tr");
  let td = document.createElement("td");
  tr.appendChild(td);
  let text = document.createTextNode(displayText(message));
  td.appendChild(text);
  return tr;
}

function pushMessage(message){
  messages.push(message);
  let m_input = slots[slots.length-1];
  m_input.remove();
  slots[0].remove();
  let newMessage = createMessageElement(message);
  chat.children[0].appendChild(newMessage);
  newMessage.style.visibility = "visible";
  setTimeout(function(){newMessage.style.visibility = "inherit";}, 2000);
  chat.children[0].appendChild(m_input);
}

function showMessageLog(){
  chat.style.visibility = "visible";
}

function hideMessageLog(){
  chat.style.visibility = "hidden";
}

function messageOnT(event){
  if(event.key == 't'){
    showMessageLog();
    input.focus();
  }
  setTimeout(function(){input.value = ''}, 1);
}

function sendOnEnter(event){
  if(event.key == 'Enter'){
    pushMessage({from:"me", text:input.value});
    input.value = '';
    hideMessageLog();
    document.children[0].focus();
  }
  event.stopPropagation();
}

document.addEventListener('keydown', messageOnT, false);
input.addEventListener('keydown', sendOnEnter, false);
updateMessageLog();