odoo.define('web.web_widget_text_markdown', function(require) {

    "use strict";

    var ajax = require('web.ajax');
    var core = require('web.core');
    var session = require('web.session');
    var registry = require('web.field_registry');


    var QWeb = core.qweb;
    var _lt = core._lt;

    var FieldTextMarkDown = registry.get('ace').extend(
        {
            willStart: function () {
              var js_def = ajax.loadJS('/web/static/lib/ace/ace.odoo-custom.js').then(function () {
                  return $.when(
                      ajax.loadJS('/web_widget_text_markdown/static/lib/ace/mode-markdown.js'),
                  );
              });
              return $.when(this._super.apply(this, arguments), js_def);
            },

            _startAce: function(node) {
                this._super(node);
                this.md = markdownit({
                    html: true,
                    linkify: true,
                    typographer: true,
                    highlight: function(str, lang) {
                        if (lang && hljs.getLanguage(lang)) {
                            try {
                                return hljs.highlight(lang, str).value;
                            } catch (__) {}
                        }
                        try {
                            return hljs.highlightAuto(str).value;
                        } catch (__) {}

                        return ''; // use external default escaping
                    }
                });

                this.md.use(markdownItAttrs);

            },


            _render: function() {
              if (this.mode != 'readonly') {
                var newValue = this._formatValue(this.value);
            if (this.aceSession.getValue() !== newValue) {
                this.aceSession.setValue(newValue);
            }

        } else {
          var txt = this.md.render(this.value || '');
          this.$el.html(txt);
          this.$el.addClass('markdown-body');
        }
            },
  });


    registry.add('bootstrap_markdown', FieldTextMarkDown);

    return {
            FieldTextMarkDown: FieldTextMarkDown
        };
});
