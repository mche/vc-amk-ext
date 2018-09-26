(function () {
  'use strict';
  var mainDiv = $('<div style="position: fixed; right:0; top: 3rem; z-index: 1000;"><h1>Леше</h1><div><button id="search-vk" class="flat_button button_small button_wide">Обработать поиск</button></div><textarea style="height: 15rem;"></textarea></div>');//
  
  var Data = [];///массив результатов
  var $Data = {};///кэш по уникальным href
  var RE = {
    'двоеточие': new RegExp('\s*:\s*$'),
    "escape": /[<>"'`=\/]/g,
    "escapeAmp": /[&]/g, ///  отдельно впереди будет замена
    "escapeQuot": /\\"/g, /// будет замена после JSON.stringify() и .html()
    "пусто": /^\s+|\s+$/g,
  };
  var escapeChars = {///для xml
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;',
    //~ "'": '&#39;',
    //~ '/': '&#x2F;',
    //~ '`': '&#x60;',
    //~ '=': '&#x3D;'
  };
  
  ///для xml
  const replaceTag = (tag) => {
    return escapeChars[tag] || tag;
  };
  
  const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
  };
  
  /// на странице профиля выбрать для поля его значения
  const mapProfileLabels = (node) => {
    //~ var val = this;///массив значений поля
     var text = $(node).text().replace(RE['пусто'], '');///*.replace(RE.escapeAmp, replaceTag)*/.replace(RE.escape, replaceTag);
     //~ if (text === undefined || text === null || text == '') return;
     //~ if (text) val.push(text);
    return text;
    
  };

  ///рекурсия с выборкой массива результатов поиска
  const ProcessData = (res) => {///массив div- позиций в поисковой выдаче
    var item = res.shift();
    $('textarea', mainDiv).val('Осталось позиций: '+res.length);
    if (!item) {///финал
      //~ $('#search-vk').show();
      $('#search-vk').prop('disabled', false);
      return $('textarea', mainDiv).val('<?xml version="1.0" encoding="UTF-8"?>\n<people>\n'+Data.join("\n")+"\n</people>\n");///JSON.stringify(Data)
    }
    var $item = $(item);
    var href = $('a', $item).attr('href');
    if(!href || $Data[href]) return ProcessData(res);
    var data = {"name": $item.text(), "href": href, "profile":{}, "search-company": $('input[name="c[company]"]').val(), "search-position": $('input[name="c[position]]"').val()};
    var $profile = $('<profile>').attr('href', 'https://vk.com'+href)
      .append($('<name>').text(data.name))
      .append($('<poisk-company>').text(data['search-company']))
      .append($('<poisk-dolzhnost>').text(data['search-position']))
    ;

    /// запрос полного профиля
    var htmlPage = $.ajax({
      url: href,
      async: false
     }).responseText;
     var $htmlPage = $(htmlPage);
     $('.profile_info_row .label.fl_l', $htmlPage).map(function(){
       var $this = $(this);
       var attr = $this.text().replace(RE['двоеточие'], '');
       var val = $this.next().contents().toArray().map(mapProfileLabels);
       if (data.profile[attr]) {
         if (!data.profile[attr].pop) data.profile[attr] = [data.profile[attr]];///Object.prototype.toString.call(data.profile[attr]) != '[object Array]'
         data.profile[attr].push(val.join(' ').replace(RE['пусто'], ''));
        }
       else data.profile[attr] = val.join(' ').replace(RE['пусто'], '');
       //~ $profile.attr(attr, val);///не катит
      });
    
    $profile.append($('<current-company>').text(data.profile['Место работы'].pop ? data.profile['Место работы'][0] : data.profile['Место работы']));///верхнее место
    $profile.append($('<data-json>').text(JSON.stringify(data.profile)));
    //~ Data.push(data);
    Data.push($('<item>').append($profile).html().replace(RE.escapeQuot, escapeChars['"']));
    $Data[href] = data;
    sleep(1100).then(function(){ ProcessData(res); });///не больше 1 запроса в сек
  };
  
  const showMore = () => {///пролистать весь список
    var loadMore = $('#ui_search_load_more');
    if (!$('#no_results').length && loadMore.length) window.wrappedJSObject.searcher.showMore();
    if (loadMore.css('display') == 'block') return sleep(500).then(showMore);
    ///console.log('results ', $('#results > div').length, window.wrappedJSObject.searcher );
    var data = $('#results div.labeled.name').toArray();///.map(processItem);
    ProcessData(data);
  };
  
 
  $(document).ready(function () {
    

    $('body').prepend(mainDiv);
    $('#search-vk').click(function(ev){
      
      //~ $(this).hide();
      $(this).prop('disabled', true);

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