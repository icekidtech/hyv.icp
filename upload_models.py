#!/usr/bin/env python3
import os
import subprocess
import sys

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
        return result.returncode == 0
    except subprocess.TimeoutExpired:
        print("⏰ Timeout uploading chunk")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def upload_model(file_path, clear_func, append_func, model_name):
    """Upload a model file in chunks"""
    print(f"📁 Uploading {model_name} from {file_path}")
    
    if not os.path.exists(file_path):
        print(f"❌ Error: File {file_path} not found")
        return False
    
    file_size = os.path.getsize(file_path)
    print(f"📊 File size: {file_size:,} bytes")
    
    # Clear existing data
    print(f"🧹 Clearing existing {model_name} data...")
    subprocess.run(['dfx', 'canister', 'call', 'hyv_ai_engine', clear_func])
    
    # Use 16KB chunks for better reliability
    chunk_size = 16384
    total_chunks = (file_size + chunk_size - 1) // chunk_size
    
    print(f"📦 Uploading in {total_chunks} chunks of {chunk_size:,} bytes each...")
    
    with open(file_path, 'rb') as f:
        for chunk_num in range(1, total_chunks + 1):
            print(f"⬆️  Uploading chunk {chunk_num}/{total_chunks}...")
            
            chunk_data = f.read(chunk_size)
            if not chunk_data:
                break
                
            if not upload_model_chunk(chunk_data, append_func):
                print(f"❌ Failed to upload chunk {chunk_num}")
                return False
    
    print(f"✅ Successfully uploaded {model_name}")
    return True

def main():
    print("🔄 Uploading ONNX models to Hyv AI Engine...")
    
    # Upload models
    models = [
        ("models/distilgpt2.onnx", "clear_text_model_bytes", "append_text_model_bytes", "DistilGPT-2"),
        ("models/codet5-small.onnx", "clear_code_model_bytes", "append_code_model_bytes", "CodeT5")
    ]
    
    for file_path, clear_func, append_func, model_name in models:
        if not upload_model(file_path, clear_func, append_func, model_name):
            print(f"❌ Failed to upload {model_name}")
            sys.exit(1)
    
    print("🔧 Setting up models in canister...")
    result = subprocess.run(['dfx', 'canister', 'call', 'hyv_ai_engine', 'setup_models'])
    
    if result.returncode == 0:
        print("🎉 All models uploaded and configured successfully!")
    else:
        print("⚠️  Models uploaded but setup may have failed")

if __name__ == "__main__":
    main()
