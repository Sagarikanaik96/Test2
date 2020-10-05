# -*- coding: utf-8 -*-
# Copyright (c) 2020, veena and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe.model.document import Document
import datetime

class SalesInvoice(Document):
	pass


def auto_create_purchase_invoice(doc,method):
	supplier=frappe.db.get_value('Supplier',{'is_internal_supplier':1,'represents_company':doc.company},'supplier_name')
	company=frappe.db.get_value('Customer',{'is_internal_Customer':1,'customer_name':doc.customer_name},'represents_company')
	contact_person=frappe.db.get_value('Dynamic Link',{'parenttype':'Contact','link_doctype':'Supplier',"link_name":supplier},'parent')
	if company:
		if supplier:
			tax_template=frappe.db.get_value('Purchase Taxes and Charges Template',{'company':doc.customer_name},'name')
			tax_list=frappe.db.get_list("Purchase Taxes and Charges",filters={'parent':tax_template,'parenttype':'Purchase Taxes and Charges Template'},fields={'*'})
			pi_doc=frappe.get_doc(dict(doctype = 'Purchase Invoice',
						supplier=supplier,
						company=company,
						posting_date=datetime.datetime.strptime(doc.posting_date, "%Y-%m-%d").date(),
						due_date=datetime.datetime.strptime(doc.due_date, "%Y-%m-%d").date(),
						supplier_address=frappe.db.get_value("Dynamic Link",{"parenttype":"Address","link_doctype":"Supplier","link_name":supplier},"parent"),
						contact_person=contact_person,
						contact_email=frappe.db.get_value('Contact Email', {'parenttype':'Contact','parent':contact_person},'email_id'),
						conversion_rate=1,
						bill_no=doc.name,
						bill_date=datetime.datetime.strptime(doc.posting_date, "%Y-%m-%d").date(),
						tc_name=doc.tc_name,
						payment_terms_template=doc.payment_terms_template,
						terms=doc.terms,
						total=doc.total,
						grand_total=doc.grand_total,
						base_grand_total=doc.base_grand_total,
						rounded_total=doc.rounded_total,
						base_rounded_total=doc.base_rounded_total
					)).insert(ignore_mandatory=True)
			for val in doc.items:
					pi_doc.append('items', {
						'item_code':val.item_code,
						'qty':val.qty,
						'uom':val.uom,
						'stock_uom':val.stock_uom,
						'rate':val.rate,
						'amount':val.amount,
						'base_rate':val.base_rate,
						'base_amount':val.base_amount,
						'description':val.description,
						'conversion_factor':val.conversion_factor
					})
			for tax in tax_list:
					pi_doc.append('taxes',{
						'account_head':tax.account_head,
						'charge_type':tax.charge_type,
						'rate':frappe.db.get_value("Sales Taxes and Charges",{'parent':doc.name,'parenttype':'Sales Invoice'},'rate')
					})
			pi_doc.add_comment('Comment',' System created  '+pi_doc.name)
			pi_doc.save()
			doc.add_comment('Comment','  Purchase Invoice: '+pi_doc.name)  
	else:
		frappe.msgprint('Unable to create  Sales Invoice as customer: '+doc.customer_name +' is not associated with any company. Register the Customer for the Company and submit the document: '+doc.name+ '.')
		raise frappe.ValidationError('Unable to create  Sales Invoice as customer: '+doc.customer_name +' is not associated with any company. Register the Customer for the Company and submit the document: '+doc.name+ '.')
