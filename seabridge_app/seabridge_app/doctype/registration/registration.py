# -*- coding: utf-8 -*-
# Copyright (c) 2020, seabridge_app and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe.model.document import Document

class Registration(Document):
	pass

def on_registration_submit(doc,method):
        co_doc=frappe.get_doc(dict(doctype = 'Company',
                    company_name=doc.company,
                    abbr=doc.abbr,
                    default_currency=doc.default_currency,
                    country=doc.country,
                    is_group=doc.is_group,
                    parent_company=doc.parent_company
        )).insert(ignore_mandatory=True)
        co_doc.save()

        us_doc=frappe.get_doc(dict(doctype = 'User',
                    email=doc.email,
                    first_name=doc.first_name,
                    last_name=doc.last_name,
                    send_welcome_email=doc.send_welcome_email
        )).insert(ignore_mandatory=True)
        us_doc.save()

        up_doc=frappe.get_doc(dict(doctype = 'User Permission',
                    user=doc.email,
                    allow="Company",
                    for_value=doc.company,
                    apply_to_all_doctypes=1
        )).insert(ignore_mandatory=True)
        up_doc.save()

        if doc.company_type=="Vendor":
                    su_doc=frappe.get_doc(dict(doctype = 'Supplier',
                    supplier_name=doc.supplier_name,
                    supplier_group=doc.supplier_group,
                    supplier_type=doc.supplier_type,
                    country=doc.country,
                    is_internal_supplier=1,
                    represents_company=doc.company
                    )).insert(ignore_mandatory=True)
                    su_doc.save()
