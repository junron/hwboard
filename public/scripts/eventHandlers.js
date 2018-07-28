//Required for all ppl, not just admins
//Attach event listener to elements
$(document).on("change","input[type='radio']",function(){
  if(this.name in sortOptions){
    if(this.name=="order"){
      sortOptions[this.name] = parseInt(this.value)
    }else{
      sortOptions[this.name] = this.value
    }
  }
})
//Edit button clicked
//TODO put this in a admin only js file
$(document).on("click",".swipeout-edit-button",function(){
  lastTouched = this.parentElement.parentElement
  mainView.router.navigate("/popups/edit/")
})

