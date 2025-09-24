console.log('hello');

function expandCutting(element) {

    table = element.children[2];

    if(element.classList.contains("hidden")) {
        element.style.height = "24vh";
        table.style.opacity = "0.9";
        table.style.height = "24vh";
        element.classList.replace("hidden", "shown");
        console.log(table);
    } 
    else if(element.classList.contains("shown")) {
        element.style.height = "12vh";
        table.style.opacity = "0";
        table.style.height = "12vh";
        element.classList.replace("shown","hidden");
        console.log('hey');
    }
}


document.getElementById("close-icon").onclick = function() {closeFace()};
document.getElementById("d-services-menu").onclick = function() {openFace()};
document.getElementById("services-menu").onclick = function() {openFaceMobile()};

  function closeFace() {
    document.getElementById("menu-face").style.animation = "menu-face-hide 0.2s linear forwards";
    document.getElementById("menu-screen").style.opacity = "0.0";
    document.getElementById("menu-screen").style.display = "none";
  }


  function openFace() {
    if(document.getElementById("menu-face").style.display = "hidden") {
      document.getElementById("menu-screen").style.display = "block";
      document.getElementById("menu-face").style.animation = "menu-face-show 0.2s linear forwards";
      document.getElementById("menu-screen").style.opacity = "1";
    }

  }

  function openFaceMobile() {
    if(document.getElementById("menu-face").style.display = "hidden") {
        document.getElementById("menu-screen").style.display = "block";
        document.getElementById("menu-face").style.animation = "menu-face-show-mobile 0.2s linear forwards";
        document.getElementById("menu-screen").style.opacity = "1";
    }
  }
