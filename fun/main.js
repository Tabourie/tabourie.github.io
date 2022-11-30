/* jQuery and javascript */

//alert("hello there");



$(".button").on("click",function(){
    
   var name = "Hello jQuery"
   
   $(".message p").html(name);
   
   var size = Math.random()*100;

   $(".message p").css("font-size" , size + "px");
   
   var red= Math.random()*255;
   var green= Math.random()*255;
   var blue= Math.random()*255;
   
   var bg="rgb("+red+","+green+","+blue+")";
   
   $(".message").css("background-color", bg );

});



