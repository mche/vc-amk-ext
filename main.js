(function () {
  
  var mainDiv = $('<div style="position: absolute; right:0; top: 3rem; z-index: 1000;"><h1>Леше</h1><div><button id="search-vk" class="flat_button button_small button_wide">Обработать поиск</button></div><textarea></textarea></div>');//
  
  const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
  };

  const ProcessData = (res, done) => {///массив 
    var item = res.shift();
    var btn = $('#search-vk');
    btn.html('Осталось позиций: '+res.length);
    if (!item) return console.log('Done', $('textarea', mainDiv).val(JSON.stringify(done)));
    var $item = $(item);
    var data = {"name": $item.text(), "href":$('a', $item).attr('href'), "profile":{}, "работа": $('input[name="c[company]"]').val(), "должность": $('input[name="c[position]]"').val()};

    // присланные от сервера данные, запишем в переменную html
    var htmlPage = $.ajax({
      url: data.href,
      async: false
     }).responseText;
     var $htmlPage = $(htmlPage);
     $('.profile_info_row .label.fl_l', $htmlPage).map(function(){
       var $this = $(this);
       data.profile[$this.text()] = $this.next().text();
      });
    //~ console.log('processItem: ', $('.profile_info_row .label.fl_l', $htmlPage).toArray());
    done.push(data);
    return sleep(1100).then(function(){ ProcessData(res, done); });
  };
  
  const showMore = () => {///пролистать весь список
    var loadMore = $('#ui_search_load_more');
    if (!$('#no_results').length && loadMore.length) window.wrappedJSObject.searcher.showMore();
    if (loadMore.css('display') == 'block') return sleep(500).then(showMore);
    ///console.log('results ', $('#results > div').length, window.wrappedJSObject.searcher );
    var data = $('#results div.labeled.name').toArray();///.map(processItem);
    //~ $('textarea', mainDiv).val(.join("\n"));
    ProcessData(data, []);
  };
  
  /*
  var xmlDoc = document.implementation.createDocument(null, "people");
  profile = xmlDoc.createElement("profile");
  name = xmlDoc.createElement("name");
  name.appendChild(xmlDoc.createTextNode("Вася Пуп"));


  profile.setAttribute("Место работы","first");
  xmlDoc.getElementsByTagName("people")[0].appendChild(item);
  
  */
  
  $(document).ready(function () {
    

    $('body').prepend(mainDiv);
    $('#search-vk').click(function(ev){
      
      

      //~ var len = 0;
      
      //~ while (len != $('#results > div').length) {
        //~ len = $('#results > div').length;
      //~ while ($('#ui_search_load_more').css('display') == 'block') {
      //~ showMore();
      showMore();

        
        //~ console.log('while ', len, $('#results > div').length, $('#ui_search_load_more').css('display') );
      //~ }
      
      
    });
  });
  
  
})();