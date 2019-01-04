const mainView = Framework7App.views.create('.view-main');
$(document).on("click",".page-current a[href='/'].link",()=>{
  mainView.router.back();
});