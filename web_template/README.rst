
Provide QWEB templating for formatting some fields.

Since version 8.0, this is less usefull as whole form can be templated.
But in list views, it's still very much constrained, and this module
make sense.


Form
====


General usage
-------------

In forms, by specifying the correct ``widget``, the XML content of the ``field``
will then be interpreted by QWEB (the javascript version)::

   ...
   <field name="foo" widget="many2one_template">
      <!-- QWEB template, with 'record' being the m2o targetted record -->

   </field>
   ...

Depending on the widget, you'll get some environment variable already filled
with target data. For instance any ``*2m`` will receive ``records`` the list
of targetted values, and any ``*2o`` will receive ``record`` the targetted 
value.


Widgets
-------

These are the form widget available and the given template vars:
 
- ``one2many_template`` with inner ``records`` variable.
- ``many2one_template`` with inner ``record`` variable.
- ``many2many_template`` with inner ``records`` variable.
- ``template`` with inner ``value``.


List
====

In list, there's only one widget called ``template`` and the XML content of the ``field``
will then be interpreted by QWEB (the javascript version)::

   ...
   <field name="foo" widget="template">
      <!-- QWEB template, with 'value' being the value

         - *2o: value is the target record.
         - *2m: value is the array of records.
         - other: value is the direct value

         -->

   </field>
   ...











