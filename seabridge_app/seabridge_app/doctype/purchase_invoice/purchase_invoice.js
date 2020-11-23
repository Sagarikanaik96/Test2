// Copyright (c) 2020, seabridge_app and contributors
// For license information, please see license.txt

frappe.ui.form.on('Purchase Invoice', { 
after_save:function(frm,cdt,cdn){
	console.log("After Save")
	if(frm.doc.is_return==1){
		frappe.call({
                method:"seabridge_app.seabridge_app.api.update_status",
                args:{
			doc:cur_frm.doc.return_against,
			"method":"method",
			"status":frm.doc.status		
		},
                async:false,
                callback: function(r){
                    console.log("Refresh")
                }
            });
	    //frappe.model.set_value("Purchase Invoice", frm.doc.return_against, "status", "Debit Note Initialized");
	}
	



},
before_save:function(frm,cdt,cdn){
	var count=0;
	if(frm.doc.naming_series){}
	else{
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
	}
	frappe.db.get_value("Sales Invoice",frm.doc.bill_no,"po_no",(c)=>{
		$.each(frm.doc.items, function(idx, item){
			item.purchase_order=c.po_no;
		})
		frm.set_value("purchase_order",c.po_no)
	})

	var flag=0;
	$.each(frm.doc.items, function(idx, item){
	            if (item.parent_item_group != "Services"){
		flag=1;
            }
        })
	if(flag==1){ frm.set_df_property("total_net_weight", "hidden", 0);
	} else {  frm.set_df_property("total_net_weight", "hidden", 1);  }
},


after_workflow_action: (frm) => {
		console.log("WorkflowState",frm.doc.workflow_state)
	console.log("approve_email",frm.doc.approve_email)
var email_id;
	if(frm.doc.workflow_state=="Pending")
	{
		frappe.db.get_value("Company",frm.doc.company,"associate_agent_company",(c)=>{
		if(c.associate_agent_company){
		console.log("associate_agent_company",c.associate_agent_company)
			frappe.call({
            method: "frappe.client.get_list",
            args: {
                doctype: "User",
                fields: ["email","name"],
                filters:{
                    "represents_company":c.associate_agent_company
                },
            },
            callback: function(r) {
                for(var i=0;i<r.message.length;i++){
                    console.log("Email",r.message[i].email)

					frappe.call({
                method:"seabridge_app.seabridge_app.api.get_user_email",
                args:{
			name:r.message[i].email
		},
		async:false,
                callback: function(r){
                    console.log("Refresh")
			email_id=r.message
			console.log("email_id",email_id)
		if(email_id){
				frappe.call({
        method: "frappe.core.doctype.communication.email.make",
        args: {
            subject: "Approval",
            communication_medium: "Email",
            recipients: email_id,
            content: "Please approve the Purchase Invoice",
            communication_type: "Communication",
            send_email:1,
            attachments:[],
            print_format:"Standard",
            doctype: "Purchase Invoice",
            name: frm.doc.name,
            print_letterhead: 0
        },        
        callback: function(rh){
            console.log("sent");
		
        }   
    });
}
                }
            });

                }
                
            }
        })
				
}
})
	}
if(frm.doc.workflow_state=="Submitted"){
 var tabletransfer= frappe.model.get_doc("Purchase Invoice", frm.doc.name)
        $.each(tabletransfer.items, function(index, row){
               
     frappe.call({
                                            async: false,
                                            "method": "frappe.client.set_value",
                                            "args": {
                                                "doctype": "Item",
                                                "name": row.item_code,
                                                "fieldname": "over_billing_allowance",
                                                "value":0
                                            }
                                        });  
        	});
}
},
refresh:function(frm,cdt,cdn){
	if(frm.doc.purchase_order){
		if(frm.doc.purchase_receipt){}
		else{
			      frappe.call({
				method:"seabridge_app.seabridge_app.api.get_purchase_receipt",
				args:{
				    purchase_order:frm.doc.purchase_order,
					purchase_invoice:frm.doc.name
				},
				async:false,
				callback: function(r){
				 
				}
			    });
		}

		if(frm.doc.service_completion_note){}
		else{
			frappe.db.get_value("Service Completion Note",{"reference_no":frm.doc.purchase_order},"name",(c)=>{
			console.log("Name",c.name)
				frappe.call({
				                            async: false,
				                            "method": "frappe.client.set_value",
				                            "args": {
				                                "doctype": "Purchase Invoice",
				                                "name": frm.doc.name,
				                                "fieldname": "service_completion_note",
				                                "value":c.name
				                            }
				                        });
				
			})
		}
	}
	else{
	frappe.db.get_value("Sales Invoice",frm.doc.bill_no,"po_no",(c)=>{

			frappe.call({
		                                    async: false,
		                                    "method": "frappe.client.set_value",
		                                    "args": {
		                                        "doctype": "Purchase Invoice",
		                                        "name": frm.doc.name,
		                                        "fieldname": "purchase_order",
		                                        "value":c.po_no
		                                    }
		                                });
			
		})
	}	
	
}
});


frappe.ui.form.on("Purchase Invoice Item", "item_code",function(frm, doctype, name) {
      var row = locals[doctype][name];
        frappe.db.get_value("Item",row.item_code, "item_group",(s)=>{
          frappe.db.get_value("Item Group",s.item_group,"parent_item_group",(a)=>{
		if(s.item_group=="Services"){
		row.parent_item_group="Services";
		}else
			{
                row.parent_item_group=a.parent_item_group;
		}
            })
        })
        
})


frappe.ui.form.on("Purchase Invoice", "validate", function(frm) {
console.log("Check")
})

