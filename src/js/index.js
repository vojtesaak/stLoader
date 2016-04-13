/**
 * Created by vojtechmalek on 18/11/15.
 */

'use strict';

var can = require('can');

//@todo make as module
var cssAnimationsHelpers = {
    animationFinished: function() {

        var self = this;
        var deferred =  $.Deferred();
        var animationsEvents = '' +
            'webkitAnimationEnd ' +
            'oanimationend ' +
            'msAnimationEnd ' +
            'animationend ' +
            'webkitTransitionEnd ' +
            'oTransitionEnd ' +
            'MSTransitionEnd ' +
            'transitionend';

        this.one(animationsEvents, function() {
            deferred.resolve(self);
        });

        return deferred;
    }

};

var ACTIVE_LOADER_COUNT = 0;

can.Component.extend({

    tag: 'loader',

    template: function (data, options) {

        var config = data._context.dataConfig;
        var tpl;

        if (config) {

            var template = can.view({
                url: config.customTemplate,
                engine: 'stache'
            });
            if (typeof template === 'undefined') {
                return can.view(can.view.stache('templateNotFound', 'Template not loaded'))();
            } else {
                var customTemplate = $('<div>').append(template(config, options)).html();
                tpl = data._context._getTemplate(customTemplate);
                return can.stache(tpl)(data, options);
            }

        }

        tpl = data._context._getTemplate(data._context.dataLoadingText);
        return can.stache(tpl)(data, options);

    },

    viewModel: {

        type: null,

        callback: null,

        /**
         * min duration in ms
         */
        minDuration: 250,

        _overlayTpl: '<div id="loader-overlay" class="loader-overlay"><div id="cursor"><i class="icon-loader"></i></div></div>',

        startAt: null,


        init: function(cfg) {

            if (!can.$.fn.animationFinished) {
                can.$.fn.extend(cssAnimationsHelpers);
            }

            if ( cfg.dataType ) {
                this.attr('type', cfg.dataType );
            }

        },

        /**
         *  CONTROLS - EXAMPLE USAGE
         *
         *          TEMPLATE :  '<loader data-name="form-loader"></loader>';
         *
         *
         *
         *          var $loader = $('loader[data-name="form-loader"]');
         *
         *          if( $loader.length > 0 ) {
         *
         *              ---- LOADING ----
         *              $loader.viewModel().showLoader('loading');
         *              $loader.viewModel().finishLoader();
         *
         *
         *              ---- SUCCESS ----
         *              $loader.viewModel().showSuccess( callback );
         *
         *
         *              ---- FULL LOADER ----
         *              $loader.viewModel().showLoader('full');
         *              $loader.viewModel().showSuccess( callback, $loader );
         *          }
         *
         */

        /**
         *
         * @param {string} type     full|loading
         * @param {function} [cb]
         */
        showLoader: function( type, cb ) {
            this.attr('type', type);
            this.attr('startAt', new Date() );

            this._showLoaderOverlay();

            if ( cb && typeof cb === 'function') {
                this.attr('callback', type);
            }
        },

        /**
         * @param {String|Object} data
         * @returns {string}
         * @private
         */
        _getTemplate: function (data) {
            return '' +
                '{{#if type}}' +
                    '<div class="loader-container">' +

                        '<div class="loader">' +
                            '<div class="animations">' +
                                '{{#loadingLoader}}' +
                                '<span class="animation loading"></span>' +
                                '{{/loadingLoader}}' +

                                '{{#successLoader}}' +
                                '<span class="animation success"></span>' +
                                '{{/successLoader}}' +

                                '{{#fullLoader}}' +
                                '<span class="animation success"></span>' +
                                '<span class="animation loading"></span>' +
                                '{{/fullLoader}}' +
                            '</div>' +
                                data +
                        '</div>' +
                    '</div>' +
                '{{/if}}';
        },


        _showLoaderOverlay: function() {
            if ( ACTIVE_LOADER_COUNT  === 0 ) {
                $('body').append( this._overlayTpl );
                $(window).on('mousemove', this._setCursorPosition );
                this._setCursorPosition();
            }

            ACTIVE_LOADER_COUNT++;
        },


        _hideLoaderOverlay: function() {

            var id = $( this._overlayTpl).attr('id');

            if ( ACTIVE_LOADER_COUNT > 0 ) {
                ACTIVE_LOADER_COUNT--;
            }

            if ( ACTIVE_LOADER_COUNT === 0 ) {
                $('#' + id).remove();
                $(window).unbind('mousemove', this._setCursorPosition );
            }

        },

        /**
         * Finishing middleware
         */
        finishLoader: function() {
            var self = this;
            var duration  = this._getLoaderDuration();
            var minDuration =  this.attr('minDuration');

            if ( duration <= minDuration ) {
                setTimeout(function() {
                    self._finishLoader();
                }, minDuration - duration);
            } else {
                self.attr('type', null);
                this._finishLoader();
            }

        },

        /**
         * Finishes loader
         */
        _finishLoader: function () {
            this.attr('type', null);
            this._hideLoaderOverlay();
        },


        /**
         * Display 'success' loader or finishes 'full' loader
         *
         * @param {function} [cb]
         * @param {object} [$loader]      mandatory for 'full' loader
         */
        showSuccess: function ( cb, $loader ) {
            var self = this;

            if ( $loader ) {
                $loader.find('.loading').fadeOut(400, function () {
                    self._successAnimation($loader.find('.success'), function () {
                        if ( cb && typeof cb === 'function' ){
                            cb();
                        }
                        self._finishLoader();
                    });
                });

            } else {

                this.attr('type', 'success');
                this.attr('callback', cb);

            }
        },


        _getLoaderDuration: function() {
            var date = this.attr('startAt');
            var duration = 100000000;
            if ( date ) {
                duration = new Date().getTime() - date.getTime();
                this.attr('startAt', null);
            }

            return duration
        },


        /**
         * success Animation
         *
         * @param {can.$} $el
         * @param {function} [cb]
         * @private
         */
        _successAnimation: function( $el, cb ) {
            $el.css({'top': '-10px'}).animationFinished()
                .then(function($el){;
                    return $el.css({'top': '100%'}).animationFinished();
                })
                .done(function(){
                    if( cb && typeof cb === 'function') {
                        cb();
                    }
                });
        },

        /**
         *
         * @param e
         * @private
         */
        _setCursorPosition: function(e) {
            var $cursor = $('#cursor');
            if (e) {
                $cursor.show();
                $cursor.offset({
                    left: (e.pageX - $cursor.width() / 2 ),
                    top : (e.pageY - $cursor.height() / 2 )
                });
            } else {
                $cursor.hide();
            }
        }


    },


    helpers: {

        /**
         * Helper for loading animation
         *
         * @param options
         * @returns {*}
         */
        loadingLoader: function( options) {
            if (options.context.type === 'loading') {
                return options.fn();
            }
        },

        /**
         * Helper for success animation
         *
         * @param options
         * @returns {*}
         */
        successLoader: function(options) {

            var c = options.context;

            if (c.type === 'success') {

                var $element = can.$( options.fn()).find('.success');

                setTimeout(function() {
                    c._successAnimation($element, function(){
                        c.callback();
                        c.attr('type', null);
                    });
                }, 50);

                return $element;
            }

        },


        /**
         * Helper for loading and then success animation
         *
         * @param options
         * @returns {*}
         */
        fullLoader: function(options) {
            if (options.context.type === 'full') {
                return options.fn();
            }
        }


    }


});

