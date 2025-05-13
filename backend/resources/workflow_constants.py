# workflow_constants.py

# Materials Only Workflow Stages
MATERIALS_ONLY_STAGES = [
    {
        "id": "LEAD_ACQUISITION",
        "name": "Lead Acquisition",
        "statuses": [
            {"id": "NEW_LEAD", "name": "New Lead"},
            {"id": "QUOTE_REQUESTED", "name": "Quote Requested"},
        ],
    },
    {
        "id": "QUOTATION",
        "name": "Quotation",
        "statuses": [
            {"id": "QUOTE_PREPARED", "name": "Quote Prepared"},
            {"id": "QUOTE_SENT", "name": "Quote Sent"},
            {"id": "QUOTE_ACCEPTED", "name": "Quote Accepted"},
        ],
    },
    {
        "id": "PROCUREMENT",
        "name": "Procurement",
        "statuses": [
            {"id": "PO_CREATED", "name": "PO Created"},
            {"id": "PO_SENT", "name": "PO Sent"},
            {"id": "SUPPLIER_CONFIRMED", "name": "Supplier Confirmed"},
            {"id": "MATERIALS_ORDERED", "name": "Materials Ordered"},
        ],
    },
    {
        "id": "MATERIALS_MANAGEMENT",
        "name": "Materials Management",
        "statuses": [
            {"id": "PARTIAL_RECEIVED", "name": "Partial Received"},
            {"id": "MATERIALS_RECEIVED", "name": "Materials Received"},
            {"id": "CUSTOMER_NOTIFIED", "name": "Customer Notified"},
        ],
    },
    {
        "id": "DELIVERY",
        "name": "Delivery",
        "statuses": [
            {"id": "READY_FOR_PICKUP", "name": "Ready for Pickup"},
            {"id": "DELIVERY_SCHEDULED", "name": "Delivery Scheduled"},
            {"id": "DELIVERED", "name": "Delivered"},
        ],
    },
    {
        "id": "BILLING_COMPLETION",
        "name": "Billing & Completion",
        "statuses": [
            {"id": "INVOICE_SENT", "name": "Invoice Sent"},
            {"id": "PAYMENT_RECEIVED", "name": "Payment Received"},
            {"id": "COMPLETED", "name": "Completed"},
            {"id": "FOLLOW_UP_SENT", "name": "Follow-up Sent"},
        ],
    },
]

# Materials & Installation Workflow Stages
MATERIALS_AND_INSTALLATION_STAGES = [
    {
        "id": "LEAD_ACQUISITION",
        "name": "Lead Acquisition",
        "statuses": [
            {"id": "NEW_LEAD", "name": "New Lead"},
            {"id": "SITE_VISIT_SCHEDULED", "name": "Site Visit Scheduled"},
            {"id": "SITE_VISIT_COMPLETED", "name": "Site Visit Completed"},
        ],
    },
    {
        "id": "QUOTATION",
        "name": "Quotation",
        "statuses": [
            {"id": "QUOTE_PREPARED", "name": "Quote Prepared"},
            {"id": "QUOTE_SENT", "name": "Quote Sent"},
            {"id": "QUOTE_ACCEPTED", "name": "Quote Accepted"},
        ],
    },
    {
        "id": "WORK_ORDER",
        "name": "Work Order",
        "statuses": [
            {"id": "WORK_ORDER_CREATED", "name": "Work Order Created"},
            {"id": "WORK_ORDER_SENT", "name": "Work Order Sent"},
            {"id": "WORK_ORDER_SIGNED", "name": "Work Order Signed"},
            {"id": "DEPOSIT_REQUESTED", "name": "Deposit Requested"},
            {"id": "DEPOSIT_RECEIVED", "name": "Deposit Received"},
        ],
    },
    {
        "id": "PROCUREMENT",
        "name": "Procurement",
        "statuses": [
            {"id": "DETAILED_MEASUREMENT", "name": "Detailed Measurement"},
            {"id": "PO_CREATED", "name": "PO Created"},
            {"id": "MATERIALS_ORDERED", "name": "Materials Ordered"},
        ],
    },
    {
        "id": "PREPARATION",
        "name": "Preparation",
        "statuses": [
            {"id": "INSTALLATION_SCHEDULED", "name": "Installation Scheduled"},
            {"id": "MATERIALS_RECEIVED", "name": "Materials Received"},
            {"id": "INSTALLATION_READY", "name": "Installation Ready"},
        ],
    },
    {
        "id": "INSTALLATION",
        "name": "Installation",
        "statuses": [
            {"id": "INSTALLATION_IN_PROGRESS", "name": "Installation In Progress"},
            {"id": "INSTALLATION_COMPLETED", "name": "Installation Completed"},
            {"id": "FINAL_INSPECTION", "name": "Final Inspection"},
        ],
    },
    {
        "id": "BILLING_COMPLETION",
        "name": "Billing & Completion",
        "statuses": [
            {"id": "INVOICE_SENT", "name": "Invoice Sent"},
            {"id": "PAYMENT_RECEIVED", "name": "Payment Received"},
            {"id": "COMPLETED", "name": "Completed"},
            {"id": "REVIEW_REQUESTED", "name": "Review Requested"},
        ],
    },
]


# Function to get workflow stages by type
def get_workflow_stages(workflow_type):
    if workflow_type == "MATERIALS_AND_INSTALLATION":
        return MATERIALS_AND_INSTALLATION_STAGES
    return MATERIALS_ONLY_STAGES


# Function to get all statuses from stages
def get_all_statuses(stages):
    statuses = []
    for stage in stages:
        for status in stage["statuses"]:
            statuses.append(status)
    return statuses


# Function to find the next status in workflow
def get_next_status(workflow_type, current_status_id, selected_stages):
    stages = get_workflow_stages(workflow_type)
    all_statuses = []

    # Build list of all statuses from selected stages
    for stage in stages:
        if stage["id"] in selected_stages:
            for status in stage["statuses"]:
                all_statuses.append(status["id"])

    if current_status_id in all_statuses:
        current_index = all_statuses.index(current_status_id)
        if current_index < len(all_statuses) - 1:
            return all_statuses[current_index + 1]

    return None
