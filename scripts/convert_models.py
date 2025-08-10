#!/usr/bin/env python3
"""
Hyv AI Model Conversion Script
Converts Hugging Face models to ONNX format for ICP deployment
"""

import torch
import transformers
from transformers import AutoTokenizer, AutoModelForCausalLM
import os
import sys

def convert_distilgpt2():
    """Convert DistilGPT-2 for text generation"""
    print("🔄 Converting DistilGPT-2...")
    
    model_name = "distilgpt2"
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForCausalLM.from_pretrained(model_name)
    
    # Add padding token if missing
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
        print("✅ Added padding token")
    
    # Create dummy input for ONNX export
    dummy_text = "Generate synthetic data:"
    dummy_input = tokenizer(dummy_text, return_tensors="pt", padding=True)
    
    # Export to ONNX
    output_path = "models/distilgpt2.onnx"
    torch.onnx.export(
        model,
        (dummy_input.input_ids, dummy_input.attention_mask),
        output_path,
        opset_version=11,
        input_names=["input_ids", "attention_mask"],
        output_names=["logits"],
        dynamic_axes={
            "input_ids": {0: "batch_size", 1: "sequence"},
            "attention_mask": {0: "batch_size", 1: "sequence"},
            "logits": {0: "batch_size", 1: "sequence"}
        },
        verbose=False
    )
    
    # Check file size
    size_mb = os.path.getsize(output_path) / (1024 * 1024)
    print(f"✅ DistilGPT-2 converted successfully!")
    print(f"📁 File: {output_path}")
    print(f"📊 Size: {size_mb:.1f} MB")
    
    return output_path

def convert_codet5():
    """Convert CodeT5-small for code generation"""
    print("🔄 Converting CodeT5-small...")
    
    model_name = "Salesforce/codet5-small"
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForCausalLM.from_pretrained(model_name)
    
    # Add padding token if missing
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
        print("✅ Added padding token")
    
    # Create dummy input
    dummy_text = "def generate_data():"
    dummy_input = tokenizer(dummy_text, return_tensors="pt", padding=True)
    
    # Export to ONNX
    output_path = "models/codet5-small.onnx"
    torch.onnx.export(
        model,
        (dummy_input.input_ids, dummy_input.attention_mask),
        output_path,
        opset_version=11,
        input_names=["input_ids", "attention_mask"],
        output_names=["logits"],
        dynamic_axes={
            "input_ids": {0: "batch_size", 1: "sequence"},
            "attention_mask": {0: "batch_size", 1: "sequence"},
            "logits": {0: "batch_size", 1: "sequence"}
        },
        verbose=False
    )
    
    # Check file size
    size_mb = os.path.getsize(output_path) / (1024 * 1024)
    print(f"✅ CodeT5-small converted successfully!")
    print(f"📁 File: {output_path}")
    print(f"📊 Size: {size_mb:.1f} MB")
    
    return output_path

def main():
    print("🧠 Hyv AI Model Conversion")
    print("=" * 40)
    
    # Ensure models directory exists
    os.makedirs("models", exist_ok=True)
    
    try:
        # Convert models
        distilgpt2_path = convert_distilgpt2()
        codet5_path = convert_codet5()
        
        print("\n🎉 All models converted successfully!")
        print(f"📂 Models saved in: ./models/")
        print(f"📝 Next: Run these models through ic-file-uploader")
        
        # Calculate total size
        total_size = sum(os.path.getsize(path) for path in [distilgpt2_path, codet5_path])
        total_mb = total_size / (1024 * 1024)
        print(f"💾 Total size: {total_mb:.1f} MB")
        
    except Exception as e:
        print(f"❌ Error during conversion: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
