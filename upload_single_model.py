#!/usr/bin/env python3
"""
Single Model Upload Script for Hyv AI Engine
Uploads one model at a time with resume capability
"""

import os
import subprocess
import sys
import json
import glob
from pathlib import Path

# State tracking
STATE_FILE = "upload_state.json"

def list_available_models():
    """List all ONNX models in the models directory"""
    models_dir = "models"
    if not os.path.exists(models_dir):
        return []
    
    onnx_files = glob.glob(os.path.join(models_dir, "*.onnx"))
    return [os.path.basename(f) for f in onnx_files]

def get_model_config(model_name):
    """Get upload configuration for each model"""
    configs = {
        "distilgpt2.onnx": {
            "clear_func": "clear_text_model_bytes",
            "append_func": "append_text_model_bytes",
            "display_name": "DistilGPT-2",
            "model_type": "text_model"
        },
        "codet5-small.onnx": {
            "clear_func": "clear_code_model_bytes", 
            "append_func": "append_code_model_bytes",
            "display_name": "CodeT5-small",
            "model_type": "code_model"
        },
        "gpt2_code.onnx": {
            "clear_func": "clear_code_model_bytes",
            "append_func": "append_code_model_bytes", 
            "display_name": "GPT-2 Code",
            "model_type": "code_model"
        }
    }
    return configs.get(model_name)

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

def upload_model_chunk(chunk_data, function_name):
    """Upload a single chunk of binary data"""
    # Convert to hex
    hex_data = chunk_data.hex()
    
    # Format as Candid blob with proper escaping
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

def upload_single_model(model_name, resume=True):
    """Upload a single model with resume capability"""
    file_path = os.path.join("models", model_name)
    
    if not os.path.exists(file_path):
        print(f"❌ Error: Model file {file_path} not found")
        return False
    
    config = get_model_config(model_name)
    if not config:
        print(f"❌ Error: Unknown model configuration for {model_name}")
        return False
    
    print(f"🔄 Uploading {config['display_name']} ({model_name})")
    print("=" * 60)
    
    # Check previous progress
    completed_chunks, prev_total = get_upload_state(model_name)
    
    if completed_chunks > 0 and resume:
        print(f"🔄 Found previous upload: {completed_chunks} chunks completed")
        resume_choice = input(f"Resume upload from chunk {completed_chunks + 1}? (y/n): ")
        if resume_choice.lower() != 'y':
            completed_chunks = 0
    
    # If starting fresh, clear existing data
    if completed_chunks == 0:
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
                save_upload_state(model_name, chunk_num, total_chunks)
            else:
                print("❌")
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
    
    print(f"✅ Successfully uploaded {config['display_name']}!")
    return True

def setup_single_model(model_name):
    """Setup a specific model after upload"""
    config = get_model_config(model_name)
    if not config:
        return False
    
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
    print("🧠 Hyv AI Engine - Single Model Upload")
    print("=" * 60)
    
    # List available models
    available_models = list_available_models()
    
    if not available_models:
        print("❌ No ONNX models found in models/ directory")
        print("💡 Make sure to run the model conversion script first")
        sys.exit(1)
    
    print("📁 Available models:")
    for i, model in enumerate(available_models, 1):
        config = get_model_config(model)
        display_name = config['display_name'] if config else model
        print(f"   {i}. {display_name} ({model})")
    
    # For your specific request, default to distilgpt2
    if "distilgpt2.onnx" in available_models:
        print(f"\n🎯 Uploading DistilGPT-2 model as requested...")
        model_to_upload = "distilgpt2.onnx"
    else:
        print("\n❌ distilgpt2.onnx not found in models directory")
        print("📝 Available models:", available_models)
        sys.exit(1)
    
    # Upload the model
    if upload_single_model(model_to_upload):
        # Setup the model
        if setup_single_model(model_to_upload):
            print("\n🎉 Upload and setup completed successfully!")
            print("📝 You can now test the model with:")
            print("   dfx canister call hyv_ai_engine generate_text '(\"Hello world\")'")
        else:
            print("\n⚠️  Upload succeeded but setup failed")
    else:
        print("\n❌ Upload failed")
        sys.exit(1)

if __name__ == "__main__":
    main()