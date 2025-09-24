var shopNav = function() {
    var y = window.scrollY;
    if (y >= (window.innerHeight * 0.8)) {
      document.getElementById("shop-nav").style.animation = "shop-nav-show 0.2s linear forwards";
    } else {
      document.getElementById("shop-nav").style.animation = "shop-nav-hide 0.2s linear forwards";
    }
  };

  window.addEventListener("scroll", shopNav);

document.getElementById("close-icon").onclick = function() {closeFace()};
document.getElementById("shop-header-menu").onclick = function() {openFace()};
document.getElementById("shop-header-menu").onclick = function() {openFaceMobile()};

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