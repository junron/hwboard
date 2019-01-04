(async ()=>{
  const colors = [{"hexVal":"#f44336","name":"Red"},{"hexVal":"#e91e63","name":"Pink"},{"hexVal":"#9c27b0","name":"Purple"},{"hexVal":"#673ab7","name":"Deep Purple"},{"hexVal":"#3f51b5","name":"Indigo"},{"hexVal":"#2196f3","name":"Blue"},{"hexVal":"#03a9f4","name":"Light Blue"},{"hexVal":"#00bcd4","name":"Cyan"},{"hexVal":"#009688","name":"Teal"},{"hexVal":"#4caf50","name":"Green"},{"hexVal":"#8bc34a","name":"Light Green"},{"hexVal":"#cddc39","name":"Lime"},{"hexVal":"#ffeb3b","name":"Yellow"},{"hexVal":"#ffc107","name":"Amber"},{"hexVal":"#ff9800","name":"Orange"},{"hexVal":"#ff5722","name":"Deep Orange"},{"hexVal":"#795548","name":"Brown"},{"hexVal":"#9e9e9e","name":"Gray"},{"hexVal":"#607d8b","name":"Blue Gray"},{"hexVal":"#ffffff","name":"White"},{"hexVal":"#000000","name":"Black"}];
  const fuseOptions = {
    shouldSort: true,
    threshold: 0.4,
    location: 0,
    distance: 100,
    maxPatternLength: 32,
    minMatchCharLength: 3,
    limit:3,
    keys: [
      "name"
    ]
  };
  const fuse = new Fuse(colors,fuseOptions);
  Framework7App.autocomplete.create({
    openIn:"dropdown",
    renderItem:item=>{
      const color = colors.find(e=>e.name===item.value);
      const background = tinycolor.readability(color.hexVal,"#fff")<2 ? "#aaaaaa" : "white";
      return `<li>
        <label class="item-radio item-content" data-value="${item.value}" 
        style="color:${color.hexVal};background-color:${background}">
          <div class="item-inner">
            <div class="item-title">
              ${item.value}
            </div>
          </div>
        </label>
      </li>`;
    },
    source:async (query,render)=>{
      if(query=="") return render([]);
      const result = fuse.search(query).slice(0,3).map(color => color.name);
      return render(result);
    },
    inputEl:"#colorInput"
  });
  document.getElementById("add-tag").addEventListener("click",()=>{
    const name = document.getElementById("tagName").value;
    const tagColorName = document.getElementById("colorInput").value;
    const color = colors.find(({name})=>name===tagColorName).hexVal;
    conn.emit("addTag",{channel,name,color},(err)=>{
      if(err){
        console.log(err);
        Framework7App.dialog.alert(err.toString());
        throw err;
      }
      mainView.router.back();
    });
  });
})();