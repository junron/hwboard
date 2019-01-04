//Required for all ppl, not just admins
//Attach event listener to elements
$(document).on("change","input[type='radio']",function(){
  if(this.name in sortOptions){
    if(this.name=="order"){
      sortOptions[this.name] = parseInt(this.value);
    }else{
      sortOptions[this.name] = this.value;
    }
  }
});
//Edit button clicked
//TODO put this in a admin only js file
$(document).on("click",".swipeout-edit-button",function(){
  const homeworkElement = this.parentElement.parentElement;
  mainView.router.navigate("/popups/edit/");
  //Sometimes init event may not trigger
  const manualTrigger = setTimeout(()=>{
    console.log("Force trigger");
    startEdit(homeworkElement,".page-current");
  },2000);
  Dom7(document).on("page:init",e=>{
    if(e.detail.route.url==="/popups/edit/"){
      clearTimeout(manualTrigger);
      startEdit(homeworkElement);
    }
  });
});

$(document).on("click",".hwboard-item-info",function(){
  loadDetails(this.parentElement);
});
$(document).on("click",".hwboard-item-delete",function(){
  startDelete(this.parentElement.parentElement);
});