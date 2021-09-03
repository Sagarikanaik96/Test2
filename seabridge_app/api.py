# -*- coding: utf-8 -*-
# Copyright (c) 2020, veena and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe.model.document import Document
import json
from frappe.desk.reportview import build_match_conditions, get_filters_cond
import pandas as pd 
from frappe.core.doctype.communication.email import make
from erpnext.accounts.doctype.purchase_invoice.purchase_invoice import PurchaseInvoice
from erpnext.regional.india.utils import update_grand_total_for_rcm
from frappe.model.db_query import DatabaseQuery
from datetime import datetime
from itertools import groupby
from frappe.frappeclient import FrappeOAuth2Client,OAuth2Session
import requests
from datetime import timedelta, date


@frappe.whitelist()
def status_update(filters = None):
	date=True
	keys=True
	requestData=json.loads(frappe.request.data.decode('utf-8'))
	mandatoryKeyList=['source','vendor_name','document_id','status','document_category','update_date']
	for key in mandatoryKeyList:
		if not key in requestData.keys():
			frappe.local.response['http_status_code'] = 400
			frappe.response['status']="FAILED"
			frappe.response['message']='Mandatory field '+ key+' not provided'
			keys=False
	if keys==True:
		if requestData['status'].lower()=="funded":
			if (requestData['document_category']=="AP"):
				pi_exists=frappe.db.get_list("Purchase Invoice",filters={'name':requestData['document_id']},fields={'*'})
				if pi_exists:
					pi_doc=frappe.get_doc("Purchase Invoice",requestData['document_id']) 
					pi_doc.db_set('is_funded',1)
					pi_doc.db_set('on_hold',0)
					if 'notes' in requestData.keys():
						pi_doc.db_set('notes',requestData['notes'])
					try:
						pi_doc.db_set('update_date',requestData['update_date'])
					except:
						date=False
						
					pi_doc.db_set('source',requestData['source'])
					frappe.db.commit()
					if pi_doc.supplier.lower()==requestData['vendor_name'].lower():
						if date==True:
							frappe.response['status']="SUCCESS"
							frappe.response['message']="Successfully updated the status"
							
						else:
							frappe.local.response['http_status_code'] = 400
							frappe.response['status']="FAILED"
							frappe.response['message']="Date Format Incorrect (Must be 'YYYY-MM-DD')"
					else:
						frappe.local.response['http_status_code'] = 400
						frappe.response['status']="FAILED"
						frappe.response['message']="Vendor Name Incorrect (Vendor Name of this Invoice is "+pi_doc.supplier+")"
				else:
					frappe.local.response['http_status_code'] = 400
					frappe.response['status']="FAILED"
					frappe.response['message']="Purchase Invoice Unavailable"
			else:
				frappe.local.response['http_status_code'] = 400
				frappe.response['status']="FAILED"
				frappe.response['message']="Invalid Document Category (Should be 'AP')"
		else:
			frappe.local.response['http_status_code'] = 400
			frappe.response['status']="FAILED"
			frappe.response['message']="Invalid Status (Must be 'Funded')"