/* global Handlebars, dataSource */
const utils = {}; // eslint-disable-line no-unused-vars

//tworzy element DOM z HTML(z stringa)
utils.createDOMFromHTML = function(htmlString) {
  let div = document.createElement('div');
  div.innerHTML = htmlString.trim();
  return div.firstChild;
};

utils.createPropIfUndefined = function(obj, key, value = []){
  if(!obj.hasOwnProperty(key)){
    obj[key] = value;
  }
};

//konwertuje obiekt folmularza (to co pkazuje się na stronie- z wybranymi opcjami) do zwykłego obiektu JS
utils.serializeFormToObject = function(form){
  let output = {};
  if (typeof form == 'object' && form.nodeName == 'FORM') {
    for (let field of form.elements) {
      if (field.name && !field.disabled && field.type != 'file' && field.type != 'reset' && field.type != 'submit' && field.type != 'button') {
        if (field.type == 'select-multiple') {
          for (let option of field.options) {
            if(option.selected) {
              utils.createPropIfUndefined(output, field.name);
              output[field.name].push(option.value);
            }
          }
        } else if ((field.type != 'checkbox' && field.type != 'radio') || field.checked) {
          utils.createPropIfUndefined(output, field.name);
          output[field.name].push(field.value);
        } else if(!output[field.name]) output[field.name] = [];
      }
    }
  }
  return output;
};

utils.convertDataSourceToDbJson = function(){
  const productJson = [];
  for(let key in dataSource.products){
    productJson.push(Object.assign({id: key}, dataSource.products[key]));
  }

  console.log(JSON.stringify({product: productJson, order: []}, null, '  '));
};

Handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
  return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
});

Handlebars.registerHelper('joinValues', function(input, options) {
  return Object.values(input).join(options.fn(this));
});

utils.queryParams = function(params){
  return Object.keys(params)
    .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
    .join('&');
};

utils.numberToHour = function(number){
  return (Math.floor(number) % 24) + ':' + (number % 1 * 60 + '').padStart(2, '0');
};

//konwertowanie godziny do innego formatu
utils.hourToNumber = function(hour){
  const parts = hour.split(':');

  return parseInt(parts[0]) + parseInt(parts[1])/60;
};

//przekształca obiekt daty na tekst w wygodniejszym formacie rok-miesiąc-dzień, czyli np. '2021-05-31'
utils.dateToStr = function(dateObj){
  return dateObj.toISOString().slice(0, 10);
};

//może przesunąć datę
//przyjmuje dwa argumenty: datę, do której ma dodać ilość dni, oraz ilość dni, która ma być dodana
utils.addDays = function(dateStr, days){
  const dateObj = new Date(dateStr);
  dateObj.setDate(dateObj.getDate() + days);
  return dateObj;
};


export default utils;