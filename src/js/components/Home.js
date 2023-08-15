import {templates} from './../settings.js';
import utils from './../utils.js';

class Home{
    constructor(element){
        const thisHome = this;

        thisHome.render(element);
        thisHome.initCarousel();
    }
    render(element){
        const thisHome = this;

        thisHome.dom = {};
        thisHome.dom.wrapper = element;

        const generatedHTML = templates.home(thisHome.dom.wrapper);
        const generatedDOM = utils.createDOMFromHTML(generatedHTML);
        thisHome.dom.wrapper.appendChild(generatedDOM);
    }

    initCarousel(){
        var elem = document.querySelector('.main-carousel');
        var flkty = new Flickity( elem, {
        // options
        cellAlign: 'left',
        contain: true,
        autoPlay: true
        });
        console.log(flkty);
    }
}

export default Home;