//alert("hello");

// --------------------------------------------------------------
// CAROUSEL
// --------------------------------------------------------------

$("#carousel").skippr({
   autoPlayDuration: 2000,
   speed: 1000,
   navType: 'bubble',
   arrows: true,
   autoPlay: true
});

// other options for carousel
// autoplayduration is the wait time between each slide 
// speed is the slide speed in milliseconds.
// navType:'bubble' display dots. change to   
// navType:'block'  to display boxes
// arrows:false      will switch off arrows


// --------------------------------------------------------------
// COLOUR CHANGER
// --------------------------------------------------------------

// javascript settings for colour changing the hero h1 tag.

$(".hero").mousemove(function (e) {
   red = e.pageX;
   green = e.pageY;
   blue = 255;
   rgb = "rgb(" + red + "," + green + "," + blue + ")";
   $(".hero h1").css("color", rgb);
});


// --------------------------------------------------------------
// COUNTDOWN TIMER
// --------------------------------------------------------------

/*

to add a countdown timer to your page, add the  HTML below to your page.
Add it wherever you want the countdown timer to display

  <p id="countdown">   Countdown To Awesomeness!   </p>
  
   Add CSS to your stylesheet to control the display of the text.
   
   for example if you add your HTML code to your hero section, use something like this : 
    
    .hero p{
        color:red;
    }

*/


// Set the date we're counting down to
var countDownDate = new Date("Dec 31, 2022 15:37:25").getTime();

// Update the count down every 1 second
var x = setInterval(function () {

   // Get today's date and time
   var now = new Date().getTime();

   // Find the distance between now and the count down date
   var distance = countDownDate - now;

   // Time calculations for days, hours, minutes and seconds
   var days = Math.floor(distance / (1000 * 60 * 60 * 24));
   var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
   var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
   var seconds = Math.floor((distance % (1000 * 60)) / 1000);

   // Output the result in an element with id="countdown"
   document.getElementById("countdown").innerHTML = days + " Days " + hours + " Hrs " +
       minutes + " m " + seconds + " s ";

   // If the count down is over, write some text 
   if (distance < 0) {
       clearInterval(x);
       document.getElementById("countdown").innerHTML = "ITS ON";
   }
}, 1000);
