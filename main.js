(function () {
  'use strict';
  var $mainDiv = $('<div style="position: fixed; right:0; top: 3rem; z-index: 1000;"><h1>Леше</h1><div><button id="search-vk" class="flat_button button_small button_wide">Обработать поиск</button></div><textarea style="height: 15rem;"></textarea><div class=""><button class="flat_button button_small button_wide total" style="background-color: lightgrey;" title="остановить"></button><button class="flat_button button_small button_wide clear" style="background-color: lightpink; color: red; display:none;">Очистить все</button></div></div>');//
  var $textarea = $('textarea', $mainDiv);
  var $total = $('.total', $mainDiv);
  var $clear = $('.clear', $mainDiv);
  
  var Data = JSON.parse(localStorage.getItem('Data') || '[]');///массив результатов
  var $Data = JSON.parse(localStorage.getItem('$Data') || '{}');///кэш по уникальным href
  
  const SaveStorage = () => {
    localStorage.setItem('Data', JSON.stringify(Data));
    localStorage.setItem('$Data', JSON.stringify($Data));
  };
  
  const ShowData = (val) => {
    if(val === undefined) val = '<?xml version="1.0" encoding="UTF-8"?>\n<people>\n'+Data.join("\n")+"\n</people>\n";
    $textarea.val(val);
    $clear.show();
  };
  
  if (Data.length) {
    $total.text('Всего: '+Data.length).css('color', 'green');
    ShowData();
    $clear.on('click', function(){
      Data.splice(0, Data.length);
      Object.keys($Data).map(function(key){ delete $Data[key] });
      SaveStorage();
      ShowData('');
      $total.text('');
      $clear.hide();
    });
  }
  
  const months = {'января':'01', 'февраля':'02', 'марта': '03', 'апреля': '04', 'мая':'05', 'июня':'06', 'июля':'07', 'августа':'08', 'сентября':'09', 'октября':'10', 'ноября':'11', 'декабря':'12'};
  
  var RE = {
    'двоеточие': new RegExp('\s*:\s*$'),
    "пробелы": /\s+/,
    "escape": /[<>"'`=\/]/g,
    "escapeAmp": /[&]/g, ///  отдельно впереди будет замена
    "escapeQuot": /\\"/g, /// будет замена после JSON.stringify() и .html()
    "пусто": /^\s+|\s+$/g,
    "day": /(\d+)\s+/, /// !!!косячит replace month
    "month": new RegExp('\s*(' + Object.keys(months).join('|') + ')\s*'),
    "year": /\s*(\d+)\s*г\./,
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
  
  const replaceMonth = (mon, p1, p2) => {
    return '.'+months[p1];
  };
  
  ///для xml
  const replaceTag = (tag) => {
    return escapeChars[tag] || tag;
  };
  
  const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
  };
  
  /// на странице профиля выбрать для поля его значения
  const mapProfileLabelContents  = (node) => {
    //~ var val = this;///массив значений поля
     var text = $(node).text().replace(RE['пусто'], '');///*.replace(RE.escapeAmp, replaceTag)*/.replace(RE.escape, replaceTag);
     //~ if (text === undefined || text === null || text == '') return;
     //~ if (text) val.push(text);
    return text;
  };
  
  const mapProfileLabels = (label, data) => {
    var $label = $(label);
     var attr = $label.text().replace(RE['двоеточие'], '');
     var val = $label.next().contents().toArray().map(mapProfileLabelContents);
     if (data.profile[attr]) {
       if (!data.profile[attr].pop) data.profile[attr] = [data.profile[attr]];///Object.prototype.toString.call(data.profile[attr]) != '[object Array]'
       data.profile[attr].push(val.join(' ').replace(RE['пусто'], ''));
      }
     else data.profile[attr] = val.join(' ').replace(RE['пусто'], '');
  };

  ///рекурсия с выборкой массива результатов поиска
  const ProcessData = (res, company, dolzhnost) => {///массив div- позиций в поисковой выдаче
    var item = res.shift();
    $textarea.val('Осталось позиций: '+res.length);
    $total.text('Всего: '+Data.length).css('color', 'maroon');
    if (!item) {///финал
      //~ $('#search-vk').show();
      $('#search-vk').prop('disabled', false);
      $total.css('color', 'green');
      return ShowData();///JSON.stringify(Data)
    }
    var $item = $(item);
    var href = $('a', $item).attr('href');
    if(!href || $Data[href]) return ProcessData(res, company, dolzhnost);
    
    var data = {"name": $item.text().replace(RE['пусто'], ''), "href": href, "profile":{}, "search-company": company, "search-position": dolzhnost,};
    var names = data.name.split(RE['пробелы']);
    var $profile = $('<profile>').attr('href', 'https://vk.com'+href)
      .append($('<name1>').text(names.shift()))
      .append($('<name2>').text(names.join(' ')))
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
       mapProfileLabels(this, data);
       //~ $profile.attr(attr, val);///не катит
    });
    
    $profile.append($('<current-company>').text(data.profile['Место работы'] && (data.profile['Место работы'].pop ? data.profile['Место работы'][0] : data.profile['Место работы'])));///верхнее место
    $profile.append($('<birthday>').text(data.profile['День рождения'] && data.profile['День рождения'].toString().replace(RE.day, '$1').replace(RE.month, replaceMonth).replace(RE.year, '.$1')));
    $profile.append($('<data-json>').text(JSON.stringify(data.profile)));
    //~ Data.push(data);
    Data.push($('<item>').append($profile).html().replace(RE.escapeQuot, escapeChars['"']));
    $Data[href] = data;
    SaveStorage();
    sleep(1100).then(function(){ ProcessData(res, company, dolzhnost); });///не больше 1 запроса в сек
  };
  
  ///пролистать весь список
  const showMore = () => {
    $textarea.val('Идет прокрутка поиска...');
    var loadMore = $('#ui_search_load_more');
    if (!$('#no_results').length && loadMore.length) window.wrappedJSObject.searcher.showMore();
    if (loadMore.css('display') == 'block') return sleep(500).then(showMore);
    ///console.log('results ', $('#results > div').length, window.wrappedJSObject.searcher );
    var data = $('#results div.labeled.name').toArray();///.map(processItem);
    $total.one( "click", function() {
      data.splice(0, data.length);
    });
    var company = $('#company').val(),
      dolzhnost=$('#position').val();
    $clear.hide();    
    ProcessData(data, company, dolzhnost);
  };
  
 
  $(document).ready(function () {
    
    $('body').prepend($mainDiv);
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