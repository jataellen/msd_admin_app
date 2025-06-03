#!/usr/bin/env python3
"""
Check event timestamps for DEMO-2024-002 to identify timeline issues
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import supabase
from datetime import datetime

def check_timestamps():
    # Get the order
    order_result = supabase.table("orders").select("*").eq("order_number", "DEMO-2024-002").execute()
    
    if not order_result.data:
        print("❌ Order DEMO-2024-002 not found!")
        return
    
    order = order_result.data[0]
    order_id = order['order_id']
    print(f"✅ Found order: {order['order_number']}")
    print(f"   Order created: {order['created_at']}")
    print()
    
    # Get all events
    events_result = supabase.table("order_events").select("*").eq("order_id", order_id).order("created_at", desc=False).execute()
    
    if not events_result.data:
        print("❌ No events found!")
        return
    
    events = events_result.data
    print(f"📊 Found {len(events)} events")
    print("=" * 100)
    print(f"{'#':3} {'Timestamp':20} {'Type':20} {'Description':55}")
    print("-" * 100)
    
    # Check for issues
    issues = []
    prev_time = None
    
    for i, event in enumerate(events, 1):
        timestamp = event['created_at']
        event_type = event['event_type']
        description = event['description'][:55] if event['description'] else 'No description'
        
        print(f"{i:3} {timestamp:20} {event_type:20} {description:55}")
        
        # Check for year 2025
        if '2025' in timestamp:
            issues.append(f"Event #{i} has year 2025: {timestamp}")
        
        # Check chronological order
        if prev_time and timestamp < prev_time:
            issues.append(f"Event #{i} is out of order: {timestamp} comes after {prev_time}")
        
        # Check for duplicates
        if prev_time and timestamp == prev_time:
            issues.append(f"Event #{i} has duplicate timestamp: {timestamp}")
        
        prev_time = timestamp
    
    print()
    print("🔍 Issues Found:")
    print("=" * 100)
    
    if issues:
        for issue in issues:
            print(f"❌ {issue}")
    else:
        print("✅ No timestamp issues found!")
    
    # Check for workflow_status_change events that might be duplicates
    print()
    print("🔍 Checking for duplicate workflow_status_change events:")
    print("-" * 100)
    
    status_changes = [e for e in events if e['event_type'] == 'workflow_status_change']
    
    status_map = {}
    for event in status_changes:
        # Extract the new status from description
        desc = event['description']
        if 'Status changed to ' in desc:
            status = desc.split('Status changed to ')[-1].split()[0]
            if status in status_map:
                print(f"⚠️  Duplicate status change to {status}:")
                print(f"   1. {status_map[status]['created_at']} - {status_map[status]['description']}")
                print(f"   2. {event['created_at']} - {event['description']}")
            else:
                status_map[status] = event

if __name__ == "__main__":
    check_timestamps()