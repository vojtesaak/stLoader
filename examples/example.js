
var can = require('can');
var stache = require('can/view/stache/stache');
require('../src/js/index');

function getDate() {
    var date = new Date();
    var datetime = date.getDate() + '/'
        + (date.getMonth()+1)  + '/'
        + date.getFullYear() + ' @ '
        + date.getHours() + ':'
        + date.getMinutes() + ':'
        + date.getSeconds();

    return datetime;
}
function onTplLoad () {

    var $loader1 = $('[data-name="loader1"]');
    var $loader2 = $('[data-name="loader2"]');

    if( $loader1.length > 0 ) {
        $loader1.viewModel().showLoader('loading');

       can.$('#stop-loader').one('click', function() {
           $loader1.viewModel().finishLoader();
           can.$(this).text('Finished!');
           console.log( getDate() + ' - loader finished!');

       })
    }

    if( $loader2.length > 0 ) {
        $loader2.viewModel().showLoader('full');
        $loader2.viewModel().showSuccess( function() {
            console.log( getDate() + ' - full loader finished!')
        }, $loader2 );
    }

}


var data = {
    config: {
        customTemplate: './custom-loaders.handlebars',
        loadingText: 'Custom Loading'
    }

};

can.$.ajax({
    url: './loaders.html',
    cache: false,
    success: function( tpl ) {
        var template = stache(tpl);
        $(document.body).append(template(data));
        onTplLoad();
    }
});









