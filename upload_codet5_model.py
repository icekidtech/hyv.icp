#!/usr/bin/env python3
"""
CodeT5 Model Upload Script for Hyv AI Engine
Uploads only the CodeT5 model with resume capability
"""

import os
import subprocess
import sys
import json
from pathlib import Path

# State tracking - same file as DistilGPT-2 script
STATE_FILE = "upload_state.json"
TARGET_MODEL = "codet5-small.onnx"

def get_model_config():
    """Get upload configuration for CodeT5"""
    return {
        "clear_func": "clear_code_model_bytes",
        "append_func": "append_code_model_bytes",
        "display_name": "CodeT5-small",
        "model_type": "code_model"
    }

def save_upload_state(chunk_num, total_chunks):
    """Save current upload progress"""
    state = {}
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE, 'r') as f:
            state = json.load(f)
    
    state[TARGET_MODEL] = {
        "completed_chunks": chunk_num,
        "total_chunks": total_chunks
    }
    
    with open(STATE_FILE, 'w') as f:
        json.dump(state, f)

def get_upload_state():
    """Get previous upload progress"""
    if not os.path.exists(STATE_FILE):
        return 0, 0
    
    with open(STATE_FILE, 'r') as f:
        state = json.load(f)
    
    if TARGET_MODEL in state:
        return state[TARGET_MODEL]["completed_chunks"], state[TARGET_MODEL]["total_chunks"]
    return 0, 0

def upload_model_chunk(chunk_data, function_name):
    """Upload a single chunk of binary data"""
    # Convert to hex (like the working upload_models.py)
    hex_data = chunk_data.hex()
    
    # Format as Candid blob with proper escaping (COPY FROM WORKING SCRIPT)
    candid_blob = 'blob "' + ''.join(f'\\{hex_data[i:i+2]}' for i in range(0, len(hex_data), 2)) + '"'
    
    # Call dfx with the properly formatted data
    cmd = ['dfx', 'canister', 'call', 'hyv_ai_engine', function_name, candid_blob]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        if result.returncode != 0:
            print(f"❌ dfx error: {result.stderr}")
        return result.returncode == 0
    except subprocess.TimeoutExpired:
        print("⏰ Timeout uploading chunk")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def upload_codet5(resume=True):
    """Upload CodeT5 model with resume capability"""
    file_path = os.path.join("models", TARGET_MODEL)
    
    if not os.path.exists(file_path):
        print(f"❌ Error: {TARGET_MODEL} not found in models/ directory")
        print("💡 Run the model conversion script first to generate the ONNX model")
        print("   python scripts/convert_models.py")
        return False
    
    config = get_model_config()
    
    print(f"🔄 Uploading {config['display_name']} ({TARGET_MODEL})")
    print("=" * 60)
    
    # Check previous progress
    completed_chunks, prev_total = get_upload_state()
    
    if completed_chunks > 0 and resume:
        print(f"🔄 Found previous upload: {completed_chunks} chunks completed")
        print(f"🔄 Resuming upload from chunk {completed_chunks + 1}")
    else:
        # Clear existing data when starting fresh
        print(f"🧹 Clearing existing {config['display_name']} data...")
        result = subprocess.run(['dfx', 'canister', 'call', 'hyv_ai_engine', config['clear_func']], 
                              capture_output=True, text=True)
        if result.returncode != 0:
            print(f"⚠️  Warning: Clear operation failed: {result.stderr}")
    
    file_size = os.path.getsize(file_path)
    chunk_size = 16384  # 16KB chunks
    total_chunks = (file_size + chunk_size - 1) // chunk_size
    
    print(f"📊 File size: {file_size:,} bytes")
    print(f"📦 Total chunks: {total_chunks}")
    print(f"📦 Uploading chunks {completed_chunks + 1} to {total_chunks}")
    
    with open(file_path, 'rb') as f:
        # Skip to resume position
        f.seek(completed_chunks * chunk_size)
        
        for chunk_num in range(completed_chunks + 1, total_chunks + 1):
            print(f"⬆️  Uploading chunk {chunk_num}/{total_chunks}... ", end="", flush=True)
            
            chunk_data = f.read(chunk_size)
            if not chunk_data:
                break
            
            if upload_model_chunk(chunk_data, config['append_func']):
                print("✅")
                save_upload_state(chunk_num, total_chunks)
            else:
                print("❌")
                print(f"❌ Failed at chunk {chunk_num}. Run script again to resume from here.")
                return False
    
    # Clear state on successful completion
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE, 'r') as f:
            state = json.load(f)
        if TARGET_MODEL in state:
            del state[TARGET_MODEL]
        with open(STATE_FILE, 'w') as f:
            json.dump(state, f)
    
    print(f"✅ Successfully uploaded {config['display_name']}!")
    return True

def setup_codet5():
    """Setup CodeT5 model after upload"""
    config = get_model_config()
    
    print(f"🔧 Setting up {config['display_name']} in canister...")
    
    # Call setup_models to initialize the uploaded model
    result = subprocess.run(['dfx', 'canister', 'call', 'hyv_ai_engine', 'setup_models'], 
                          capture_output=True, text=True)
    
    if result.returncode == 0:
        print(f"🎉 {config['display_name']} setup completed successfully!")
        
        # Verify the model is loaded
        verify_result = subprocess.run(['dfx', 'canister', 'call', 'hyv_ai_engine', 'get_loaded_models'],
                                     capture_output=True, text=True)
        if verify_result.returncode == 0:
            print(f"📋 Loaded models: {verify_result.stdout.strip()}")
        
        return True
    else:
        print(f"⚠️  Setup failed: {result.stderr}")
        return False

def main():
    print("🧠 Hyv AI Engine - CodeT5 Upload")
    print("=" * 60)
    
    # Check if model file exists
    model_path = os.path.join("models", TARGET_MODEL)
    if not os.path.exists(model_path):
        print(f"❌ {TARGET_MODEL} not found in models/ directory")
        print("💡 Run the model conversion script first:")
        print("   python scripts/convert_models.py")
        sys.exit(1)
    
    # Show model info
    file_size_mb = os.path.getsize(model_path) / (1024 * 1024)
    print(f"📁 Found: {TARGET_MODEL} ({file_size_mb:.1f} MB)")
    
    # Upload the model
    print(f"\n🚀 Starting CodeT5 upload...")
    if upload_codet5():
        # Setup the model
        if setup_codet5():
            print("\n🎉 Upload and setup completed successfully!")
            print("📝 You can now test code generation with:")
            print("   dfx canister call hyv_ai_engine generate_code '(\"Create a data processing function\")'")
        else:
            print("\n⚠️  Upload succeeded but setup failed")
    else:
        print("\n❌ Upload failed")
        sys.exit(1)

if __name__ == "__main__":
    main()