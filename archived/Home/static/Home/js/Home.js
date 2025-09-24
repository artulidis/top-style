var aboutmenu = document.getElementById("about-menu");
var mainheader = document.getElementById("about-main-header");
var dAboutMenu = document.getElementById("d-nav");
var dAboutHeader = document.getElementById("d-header-underline");

var aboutPageMenu = function() {
    var y = window.scrollY;
    if (y >= (window.innerHeight * 0.8)) {
      aboutmenu.style.animation = "menu-show 0.3s forwards";
    } else {
      aboutmenu.style.animation = "menu-hide 0.3s forwards";
    }
  };

  var aboutPageHeader = function() {
    var y = window.scrollY;
    if (y >= (window.innerHeight * 0.8)) {
      mainheader.style.opacity = "1";
    } else {
        mainheader.style.opacity = "0";
    }
  };


  var dAboutPageNav = function() {
    var y = window.scrollY;
    if (y >= (window.innerHeight * 0.9)) {
        dAboutMenu.style.animation = "menu-show 0.3s forwards";
    } else {
        dAboutMenu.style.animation = "menu-hide 0.3s forwards";
    }
  };

  var dAboutPageHeader = function() {
    var y = window.scrollY;
    if (y >= (window.innerHeight * 0.9)) {
        dAboutHeader.style.width = "15vw";
    } else {
        dAboutHeader.style.width = "0vw";
    }
  };

  window.addEventListener("scroll", aboutPageMenu);
  window.addEventListener("scroll", aboutPageHeader);
  window.addEventListener("scroll", dAboutPageNav);
  window.addEventListener("scroll", dAboutPageHeader);


// HOME MEDIA PAGE


  document.getElementById("d-stylists-textbox-hit-area").onclick = function() {expandStylistTextBox()};
  document.getElementById("d-stylists-textbox-bottom").onclick = function() {expandStylistTextBoxBottom()};

  function expandStylistTextBox() {

    if(document.getElementById("stylists-full-text").className === "hidden") {
      document.getElementById("d-stylists-textbox").style.height = "50vh";
      document.getElementById("stylists-click-to-see").style.display = "none";
      document.getElementById("stylists-full-text").style.opacity = "1";
      document.getElementById("d-stylists-textbox-bottom").style.display = "none";
      document.getElementById('right-side-header-bottom').style.display = "none";
      document.getElementById('scroll-arrow-media').style.display = "none";
      document.getElementById("stylists-full-text").className = "shown";

    } else if(document.getElementById("stylists-full-text").className === "shown") {
      document.getElementById("d-stylists-textbox").style.height = "22vh";
      document.getElementById("stylists-click-to-see").style.display = "inline";
      document.getElementById("stylists-full-text").style.opacity = "0";
      document.getElementById("d-stylists-textbox-bottom").style.display = "block";
      document.getElementById('right-side-header-bottom').style.display = "block";
      document.getElementById('scroll-arrow-media').style.display = "block";
      document.getElementById("stylists-full-text").className = "hidden";
    }

    
  }


  function expandStylistTextBoxBottom() {
   
    if(document.getElementById("d-stylists-textbox-bottom").className === "hidden") {
      document.getElementById('right-side-header-bottom').style.display = "none";
      document.getElementById('d-stylists-textbox').style.display = "none";
      document.getElementById('right-side-header-top').style.display = "none";
      document.getElementById('scroll-arrow-media').style.display = "none";

      document.getElementById('cancellation-policy-h5').style.opacity = "1";
      document.getElementById('cancellation-policy-p').style.opacity = "1";
      document.getElementById('cancellation-policy-span').style.opacity = "1";
      document.getElementById('covid-policy-h5').style.opacity = "1";
      document.getElementById('covid-policy-p').style.opacity = "1";

      document.getElementById("d-stylists-textbox-bottom").style.width = "50vw";
      document.getElementById("d-stylists-textbox-bottom").style.height = "70vh";
      document.getElementById("d-stylists-textbox-bottom").className = "shown";
      
    } else if(document.getElementById("d-stylists-textbox-bottom").className === "shown") {
      document.getElementById('right-side-header-bottom').style.display = "block";
      document.getElementById('d-stylists-textbox').style.display = "block";
      document.getElementById('right-side-header-top').style.display = "block";
      document.getElementById('scroll-arrow-media').style.display = "block";

      document.getElementById('cancellation-policy-h5').style.opacity = "0";
      document.getElementById('cancellation-policy-p').style.opacity = "0";
      document.getElementById('cancellation-policy-span').style.opacity = "0";
      document.getElementById('covid-policy-h5').style.opacity = "0";
      document.getElementById('covid-policy-p').style.opacity = "0";

      document.getElementById("d-stylists-textbox-bottom").style.width = "30vw";
      document.getElementById("d-stylists-textbox-bottom").style.height = "27vh";
      document.getElementById("d-stylists-textbox-bottom").className = "hidden";
    }

  }

  document.getElementById("close-icon").onclick = function() {closeFace()};
  document.getElementById("d-page-one-menu").onclick = function() {openFace()};

  document.getElementById("page-one-menu").onclick = function() {openFaceMobile()};

  document.getElementById("d-about-menu").onclick = function() {openFace()};

  document.getElementById("about-menu").onclick = function() {openFaceMobile()};

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
      
