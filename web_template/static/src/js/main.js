/*global: openerp,$,_,QWeb2 */



odoo.define('web.web_template', function(require) {

    "use strict";

    var core = require('web.core');
    var Model = require('web.Model');
    var Widget = require('web.Widget');
    var common = require('web.form_common');
    var formats = require('web.formats');
    var session = require('web.session');
    var utils = require('web.utils');

    var QWeb = core.qweb;
    var _lt = core._lt;
    var _t = core._t;

    function make_local_qweb_extension($template_node) {
        var qweb = new QWeb2.Engine();
        qweb.debug = session.debug;
        qweb.default_dict = _.clone(QWeb.default_dict);
        var div = $.extend({}, $template_node);
        div.tag = 'div';
        delete div.attrs;
        qweb.add_template(
            "<templates><t t-name='_local'>" +
                utils.json_node_to_xml(div) +
            "</t></templates>");
        return qweb;
    }

    // /**
    //  * Form Field Widget
    //  */
    //
    // // This function is ment to be a method of a Form Field widget
    // // It replaces "button" element as form usually does.
    // function replace_elements() {
    //     var self = this;
    //
    //     this.$el.find("button").each(function() {
    //         var $elem = $(this);
    //         var tag_name = $elem[0].tagName.toLowerCase();
    //         var obj = core.form_tag_registry.get_object(tag_name);
    //         var w = new (obj)(self.view, utils.xml_to_json($elem[0]));
    //         w.replace($elem);
    //     });
    // };

    var FieldTemplate = common.AbstractField.extend(
        common.ReinitializeFieldMixin, {
          template: 'FieldTemplate',

          init: function(fm, node) {
              var self = this;
              this._super.apply(this, arguments);
              var attrs = arguments[1].attrs;
              if (attrs.write_widget) {
                  var original_class = this.view.fields_registry.get_object(attrs.write_widget);
                  var dynamic_class =  original_class.extend({
                      init: function(fm, node) {
                          this._super.apply(this, arguments);
                          this.qweb = make_local_qweb_extension(this.node);
                      },
                      render_value: function () {
                          if (this.get("effective_readonly")) {
                              self.render_value.apply(this, arguments);
                          } else {
                              this._super();
                          };
                      }
                  });
                  return new dynamic_class(fm, node);
              };
              this.qweb = make_local_qweb_extension(this.node);
          },

          initialize_content: function() {
          },

          render_value: function() {
              this.$el.html(this.qweb.render("_local", {'value': this.get_value()}));
              // replace_elements.apply(this);
          },

          set_value: function(value_) {
              this._super(value_);
          },

          get_value: function() {
              return this.get('value');
          },
        });

    var FieldM2MTemplate = FieldTemplate.extend(
            {

        render_value: function() {
            var self = this;
            var datarecords;
            datarecords = (typeof this.get_value() !== "object") ? $.when() :
                (new Model(this.view.fields_view.fields[this.name].relation))
                .call('read', [this.get_value(), false],
                      {context: this.view.dataset.context});

            $.when(datarecords).then(function(records) {
                self.$el.html(self.qweb.render("_local", {'records': records}));
                // replace_elements.apply(self);
            });

        },

        set_value: function(value_) {
            value_ = value_ || [];
            if (value_.length >= 1 && value_[0] instanceof Array) {
                value_ = value_[0][2];
            }
            this._super(value_);
        },

    });

    var FieldO2MTemplate = FieldM2MTemplate.extend({
        template: 'FieldO2MTemplate',
    });

    var FieldM2OTemplate = FieldTemplate.extend({
        template: 'FieldM2OTemplate',

        render_value: function() {
            var self = this;
            var datarecord;
            datarecord = (typeof this.get_value() !== "number") ? $.when() :
                (new Model(this.view.fields_view.fields[this.name].relation))
                .call('read', [[this.get_value()], false],
                      {context: this.view.dataset.context});

            $.when(datarecord).then(function(records) {
                var value = (typeof records !== "undefined" &&
                             typeof records.length !== "undefined") ? records[0] :
                            records;
                self.$el.html(self.qweb.render("_local", {'record': value}));
                // replace_elements.apply(self);
            });

        },

        set_value: function(value_) {
            if (value_ instanceof Array) {
                value_ = value_[0];
            }
            value_ = value_ || false;
            this.set('value', value_);
        },

    });


        core.form_widget_registry.add('one2many_template', FieldO2MTemplate);
        core.form_widget_registry.add('many2one_template', FieldM2OTemplate);
        core.form_widget_registry.add('many2many_template',FieldM2MTemplate);
        core.form_widget_registry.add('template', FieldTemplate);


        return {
            FieldO2MTemplate: FieldO2MTemplate,
            FieldM2OTemplate: FieldM2OTemplate,
            FieldM2MTemplate: FieldM2MTemplate,
            FieldTemplate: FieldTemplate
        };


    // /**
    //  * List Field Columns
    //  */
    //
    // instance.web_template.ColumnTemplate = instance.web.list.Column.extend({
    //
    //     init: function() {
    //         this._super.apply(this, arguments);
    //         this.qweb = make_local_qweb_extension(this.node);
    //     },
    //
    //     _format: function (row_data, options) {
    //         var self = this;
    //         var record_id = row_data.id.value;
    //         var field_value = row_data[this.id].value;
    //         var datarecord;
    //         var opts = {shadow: true};
    //         var fields = this.fields ? this.fields.split(",") : false
    //         if (_(["many2many", "one2many"]).contains(this.type)) {
    //             datarecord = (new instance.web.Model(this.relation))
    //                 .call('read', [field_value, fields],
    //                       {context: this.parent.dataset.context}, opts);
    //         } else if (_(["many2one", "one2one"]).contains(this.type) && field_value !== false) {
    //             datarecord = (new instance.web.Model(this.relation))
    //                 .call('read', [[field_value[0]], fields],
    //                       {context: this.parent.dataset.context},opts);
    //         } else {
    //             datarecord = $.when(field_value);
    //         }
    //
    //         $.when(datarecord).then(function(data) {
    //             var template_data = {
    //                 'raw_value': field_value,
    //                 'options': options
    //             };
    //             if (_(["many2many", "one2many"]).contains(self.type)) {
    //                 template_data.value = data;
    //             } else if (_(["many2one", "one2one"]).contains(self.type)) {
    //                 template_data.value = data[0];
    //             } else {
    //                 template_data.value = field_value;
    //             }
    //
    //             self.parent.$el.find("tr[data-id=" + record_id +
    //                              "] > td[data-field='" + self.id + "']")
    //                 .html(self.qweb.render("_local", template_data));
    //         });
    //         return "<div class='web_template_container'/>";
    //     }
    //
    // });
    //
    // instance.web_template.M2MColumnTemplate = instance.web_template.ColumnTemplate.extend({
    //
    // });
    //
    //
    // instance.web.list.columns.add('field.template', 'instance.web_template.ColumnTemplate');
    //
    //
    // /**
    //  * Monkey-patch ``instance.web.list.columns.for_``
    //  */
    //
    // // Don't need to monkey path both the ``for_`` and the ``ListView``
    // instance.web.list.columns.orig_for_ = instance.web.list.columns.for_;
    // instance.web.list.columns.for_ = function (id, field, node) {
    //     if (typeof field !== "undefined")
    //         field.node = node;
    //     return instance.web.list.columns.orig_for_(id, field, node);
    // };
    //
    //
    // var setup_columns = function (fields, grouped) {
    //     var self = this;
    //     this._super.apply(this, arguments);
    //     _(this.columns).each(function (col) {
    //         col.parent = self;
    //     });
    // };
    //
    // instance.web_template.ListView = instance.web.ListView.extend({
    //     setup_columns: setup_columns,
    // });
    //
    // instance.web.form.SelectCreateListView = instance.web.form.SelectCreateListView.extend({
    //     setup_columns: setup_columns,
    // });
    //
    // instance.web.form.One2ManyListView = instance.web.form.One2ManyListView.extend({
    //     setup_columns: setup_columns,
    // });
    //
    //
    // instance.web.views.add('list', 'instance.web_template.ListView');


});
