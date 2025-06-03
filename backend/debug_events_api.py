#!/usr/bin/env python3
"""
Debug script to check what the events API is returning
Run this to see the exact order of events from the database
"""

import sys
import os
sys.path.append('/Users/jata/Documents/MSD_App/msd_admin_app/backend')

from database import supabase

def debug_events():
    # Get the order ID for DEMO-2024-002
    order_result = supabase.table("orders").select("order_id").eq("order_number", "DEMO-2024-002").execute()
    
    if not order_result.data:
        print("❌ Order DEMO-2024-002 not found!")
        return
    
    order_id = order_result.data[0]['order_id']
    print(f"✅ Found order ID: {order_id}")
    print()
    
    # Get events in the same way the API does
    events_result = supabase.table("order_events").select("*").eq("order_id", order_id).order("created_at", desc=False).execute()
    
    print(f"📊 Found {len(events_result.data)} events")
    print("=" * 80)
    
    for i, event in enumerate(events_result.data, 1):
        print(f"{i:2d}. {event['created_at']} | {event['event_type']:20} | {event['description']}")
    
    print()
    print("🔍 Checking chronological order...")
    
    # Check if they're actually in chronological order
    prev_time = None
    for i, event in enumerate(events_result.data):
        current_time = event['created_at']
        if prev_time and current_time < prev_time:
            print(f"❌ Order issue at position {i+1}: {current_time} comes after {prev_time}")
        prev_time = current_time
    
    print("✅ Order check complete")

if __name__ == "__main__":
    debug_events()