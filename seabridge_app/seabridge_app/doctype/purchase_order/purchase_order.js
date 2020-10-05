// Copyright (c) 2020, seabridge_app and contributors
// For license information, please see license.txt

frappe.ui.form.on('Purchase Order', {
    on_submit:function(frm,cdt,cdn){
          var doc=frm.doc;
          frappe.db.get_value('Customer',{'is_internal_customer':1,'represents_company':doc.company},"customer_name",(r)=>{
            if(r.customer_name){
                frappe.db.get_value("Contact",doc.supplier_name, "user",(c)=>{
                    var email=c.user;
                    if(email!=null){
                        var emailTemplate='<h1><strong>  Purchase Order is created and Submitted Successfully.</strong></h1>';
                        sendEmail(doc.name,email,emailTemplate);
                    }
                })
            }

            else{
                frappe.db.get_value("Contact",doc.company, "user",(c)=>{
                    var email=c.user;
                    if(email!=null){
                        var emailTemplate='<h1><strong>  Customer: Customer is not registered for a '+doc.company+'. The Sales order is not created. Please find the attached PO document..</strong></h1>';
                        sendEmail(doc.name,email,emailTemplate);
                    }
                })
            }
        })
    },
    before_submit:function(frm,cdt,cdn){
        frappe.db.get_value("Supplier",{'is_internal_supplier':1,'supplier_name':frm.doc.supplier_name}, "represents_company",(c)=>{
            var company=c.represents_company
            if(company==null){
                frappe.validated = false;
                msgprint('Unable to create Sales Order as supplier:'+frm.doc.supplier_name+' is not associated with any company. Register the Supplier for this Company and submit the document:'+frm.doc.name)
            }
        })

    },
    before_save:function(frm,cdt,cdn){
        var count=0;
        frappe.model.with_doc("Company", frm.doc.company, function() {
            var tabletransfer= frappe.model.get_doc("Company", frm.doc.company)
            $.each(tabletransfer.series, function(index, row){
                if(row.reference_document==frm.doc.doctype){
                    frm.set_value("naming_series",row.series)
                    count++;
                }
            })
            if(count==0){
                frappe.validated = false;
                msgprint('Unable to save the '+frm.doc.doctype+' as the naming series are unavailable. Please provide the naming series at the Company: '+frm.doc.company+' to save the document.','Alert')
            }
        })
    },
    before_cancel:function(frm,cdt,cdn){
        var po_no;
        frappe.call({
            method: "frappe.client.get_list",
            args: {
                doctype: "Sales Order",
                fields: ["po_no","name"],
                filters:{
                    "po_no":frm.doc.name
                },
            },
            callback: function(r) {
                for(var i=0;i<r.message.length;i++){
                    po_no=r.message[i].po_no
                }
                if(po_no==frm.doc.name){
                    frappe.validated = false;
                    msgprint('Unable to cancel the document as PO:'+frm.doc.name+' is linked with sales order documents.', 'Alert');
                }
            }
        })
    }
});

function sendEmail(name,email,template){
    frappe.call({
        method: "frappe.core.doctype.communication.email.make",
        args: {
            subject: name,
            communication_medium: "Email",
            recipients: email,
            content: template,
            communication_type: "Communication",
            send_email:1,
            attachments:[],
            print_format:"Standard",
            doctype: "Purchase Order",
            name: name,
            print_letterhead: 0
        },        
        callback: function(rh){
            console.log("sent");
        }   
    });
}
