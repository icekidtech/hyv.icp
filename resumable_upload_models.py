#!/usr/bin/env python3
import os
import subprocess
import json

# Add state tracking
STATE_FILE = "upload_state.json"

def save_upload_state(model_name, chunk_num, total_chunks):
    """Save current upload progress"""
    state = {}
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE, 'r') as f:
            state = json.load(f)
    
    state[model_name] = {
        "completed_chunks": chunk_num,
        "total_chunks": total_chunks
    }
    
    with open(STATE_FILE, 'w') as f:
        json.dump(state, f)

def get_upload_state(model_name):
    """Get previous upload progress"""
    if not os.path.exists(STATE_FILE):
        return 0, 0
    
    with open(STATE_FILE, 'r') as f:
        state = json.load(f)
    
    if model_name in state:
        return state[model_name]["completed_chunks"], state[model_name]["total_chunks"]
    return 0, 0

def upload_model_resumable(file_path, clear_func, append_func, model_name):
    """Upload with resume capability"""
    print(f"📁 Uploading {model_name} from {file_path}")
    
    # Check previous progress
    completed_chunks, prev_total = get_upload_state(model_name)
    
    if completed_chunks > 0:
        print(f"🔄 Found previous upload: {completed_chunks} chunks completed")
        resume = input(f"Resume upload from chunk {completed_chunks + 1}? (y/n): ")
        if resume.lower() != 'y':
            completed_chunks = 0
    
    # If starting fresh, clear existing data
    if completed_chunks == 0:
        print(f"🧹 Clearing existing {model_name} data...")
        subprocess.run(['dfx', 'canister', 'call', 'hyv_ai_engine', clear_func])
    
    file_size = os.path.getsize(file_path)
    chunk_size = 16384
    total_chunks = (file_size + chunk_size - 1) // chunk_size
    
    print(f"📦 Uploading chunks {completed_chunks + 1} to {total_chunks}")
    
    with open(file_path, 'rb') as f:
        # Skip to resume position
        f.seek(completed_chunks * chunk_size)
        
        for chunk_num in range(completed_chunks + 1, total_chunks + 1):
            print(f"⬆️  Uploading chunk {chunk_num}/{total_chunks}...")
            
            chunk_data = f.read(chunk_size)
            if not chunk_data:
                break
            
            if upload_model_chunk(chunk_data, append_func):
                save_upload_state(model_name, chunk_num, total_chunks)
            else:
                print(f"❌ Failed at chunk {chunk_num}. Resume from here next time.")
                return False
    
    # Clear state on successful completion
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE, 'r') as f:
            state = json.load(f)
        if model_name in state:
            del state[model_name]
        with open(STATE_FILE, 'w') as f:
            json.dump(state, f)
    
    return True