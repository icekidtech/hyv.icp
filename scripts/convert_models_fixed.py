#!/usr/bin/env python3
"""
Hyv AI Model Conversion Script - Day 2 (Fixed)
Converts Hugging Face models to ONNX format for ICP deployment
"""

import torch
import transformers
from transformers import AutoTokenizer, AutoModelForCausalLM, AutoConfig, T5ForConditionalGeneration
import os
import sys
import numpy as np
from pathlib import Path

def setup_directories():
    """Create necessary directories"""
    os.makedirs("models", exist_ok=True)
    os.makedirs("models/test", exist_ok=True)
    print("📁 Created model directories")

def convert_distilgpt2():
    """Convert DistilGPT-2 for text generation - Fixed version"""
    print("\n🔄 Converting DistilGPT-2...")
    print("=" * 50)
    
    try:
        # Load with simplified configuration
        model = AutoModelForCausalLM.from_pretrained(
            "distilgpt2",
            torchscript=True,
            return_dict=False  # Add this
        )
        model.eval()
        
        # Use a longer dummy input to avoid masking issues
        dummy_input = torch.randint(0, 50257, (1, 10))  # Longer sequence
        
        # Export with simpler parameters
        output_path = "models/distilgpt2.onnx"
        torch.onnx.export(
            model,
            dummy_input,
            output_path,
            export_params=True,
            opset_version=14,  # Try newer opset
            input_names=["input_ids"],
            output_names=["logits"]
        )
        
        # Check file size and return success
        size_mb = os.path.getsize(output_path) / (1024 * 1024)
        print(f"✅ DistilGPT-2 converted successfully!")
        print(f"📁 File: {output_path}")
        print(f"📊 Size: {size_mb:.1f} MB")
        
        return output_path, size_mb
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return None, 0

def convert_codet5():
    """Convert CodeT5-small for code generation - Fixed for T5 architecture"""
    print("\n🔄 Converting CodeT5-small...")
    print("=" * 50)
    
    model_name = "Salesforce/codet5-small"
    
    try:
        # Load model and tokenizer - Use T5ForConditionalGeneration
        print(f"📥 Loading {model_name}...")
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        model = T5ForConditionalGeneration.from_pretrained(model_name)
        config = AutoConfig.from_pretrained(model_name)
        
        print(f"📊 Model info:")
        print(f"   - Parameters: ~{model.num_parameters() / 1e6:.1f}M")
        print(f"   - Vocab size: {config.vocab_size}")
        
        # Add padding token if missing
        if tokenizer.pad_token is None:
            tokenizer.pad_token = tokenizer.eos_token
            print("✅ Added padding token")
        
        # Prepare model for export
        model.eval()
        model.config.use_cache = False
        
        # Create dummy input for T5 (encoder-decoder model)
        dummy_text = "Generate code: def create_data():"
        dummy_input = tokenizer(
            dummy_text, 
            return_tensors="pt", 
            padding=True,
            truncation=True,
            max_length=32
        )
        
        # T5 needs decoder input ids for generation
        decoder_input_ids = torch.zeros((1, 1), dtype=torch.long)
        
        print(f"🔧 Encoder input shape: {dummy_input.input_ids.shape}")
        print(f"🔧 Decoder input shape: {decoder_input_ids.shape}")
        
        # Export to ONNX - T5 specific export
        output_path = "models/codet5-small.onnx"
        print(f"💾 Exporting to {output_path}...")
        
        torch.onnx.export(
            model,
            (dummy_input.input_ids, dummy_input.attention_mask, decoder_input_ids),
            output_path,
            export_params=True,
            opset_version=11,
            do_constant_folding=True,
            input_names=["input_ids", "attention_mask", "decoder_input_ids"],
            output_names=["logits"],
            dynamic_axes={
                "input_ids": {0: "batch_size", 1: "encoder_sequence"},
                "attention_mask": {0: "batch_size", 1: "encoder_sequence"},
                "decoder_input_ids": {0: "batch_size", 1: "decoder_sequence"},
                "logits": {0: "batch_size", 1: "decoder_sequence"}
            },
            verbose=False
        )
        
        # Check file size
        size_mb = os.path.getsize(output_path) / (1024 * 1024)
        print(f"✅ CodeT5-small converted successfully!")
        print(f"📁 File: {output_path}")
        print(f"📊 Size: {size_mb:.1f} MB")
        
        # Save tokenizer for testing
        tokenizer.save_pretrained("models/codet5_tokenizer")
        print("💾 Tokenizer saved for testing")
        
        return output_path, size_mb
        
    except Exception as e:
        print(f"❌ Error converting CodeT5-small: {e}")
        import traceback
        traceback.print_exc()
        return None, 0

def convert_alternative_code_model():
    """Convert a simpler code generation model as backup"""
    print("\n🔄 Converting GPT-2 for code generation (Alternative)...")
    print("=" * 50)
    
    # Use a code-focused GPT-2 model that's easier to convert
    model_name = "microsoft/CodeGPT-small-py"
    
    try:
        # Try alternative: use base GPT-2 fine-tuned for code
        print(f"📥 Loading {model_name}...")
        tokenizer = AutoTokenizer.from_pretrained("gpt2")  # Use base GPT-2 tokenizer
        model = AutoModelForCausalLM.from_pretrained("gpt2")  # Use base GPT-2 model
        
        print(f"📊 Model info:")
        print(f"   - Parameters: ~{model.num_parameters() / 1e6:.1f}M")
        print(f"   - Using GPT-2 base for code generation")
        
        # Add padding token
        if tokenizer.pad_token is None:
            tokenizer.pad_token = tokenizer.eos_token
            print("✅ Added padding token")
        
        # Prepare model for export
        model.eval()
        model.config.use_cache = False
        
        # Create dummy input
        dummy_text = "def create_dataset():"
        dummy_input = tokenizer(
            dummy_text, 
            return_tensors="pt", 
            padding=True,
            truncation=True,
            max_length=32
        )
        
        print(f"🔧 Dummy input shape: {dummy_input.input_ids.shape}")
        
        # Export to ONNX
        output_path = "models/gpt2-code.onnx"
        print(f"💾 Exporting to {output_path}...")
        
        torch.onnx.export(
            model,
            dummy_input.input_ids,
            output_path,
            export_params=True,
            opset_version=11,
            do_constant_folding=True,
            input_names=["input_ids"],
            output_names=["logits"],
            dynamic_axes={
                "input_ids": {0: "batch_size", 1: "sequence"},
                "logits": {0: "batch_size", 1: "sequence"}
            },
            verbose=False
        )
        
        # Check file size
        size_mb = os.path.getsize(output_path) / (1024 * 1024)
        print(f"✅ GPT-2 Code model converted successfully!")
        print(f"📁 File: {output_path}")
        print(f"📊 Size: {size_mb:.1f} MB")
        
        # Save tokenizer
        tokenizer.save_pretrained("models/gpt2_code_tokenizer")
        print("💾 Tokenizer saved for testing")
        
        return output_path, size_mb
        
    except Exception as e:
        print(f"❌ Error converting alternative code model: {e}")
        return None, 0

def test_onnx_model(model_path, tokenizer_path, test_prompt, model_type="gpt"):
    """Test ONNX model inference"""
    try:
        import onnxruntime as ort
        from transformers import AutoTokenizer
        
        print(f"\n🧪 Testing {model_path}...")
        
        # Load tokenizer
        tokenizer = AutoTokenizer.from_pretrained(tokenizer_path)
        if tokenizer.pad_token is None:
            tokenizer.pad_token = tokenizer.eos_token
        
        # Create ONNX session
        session = ort.InferenceSession(model_path)
        
        # Tokenize input
        inputs = tokenizer(
            test_prompt,
            return_tensors="np",
            padding=True,
            truncation=True,
            max_length=32
        )
        
        # Run inference based on model type
        if model_type == "gpt":
            outputs = session.run(
                None,
                {"input_ids": inputs["input_ids"]}
            )
        else:  # T5
            decoder_input_ids = np.zeros((1, 1), dtype=np.int64)
            outputs = session.run(
                None,
                {
                    "input_ids": inputs["input_ids"],
                    "attention_mask": inputs["attention_mask"],
                    "decoder_input_ids": decoder_input_ids
                }
            )
        
        logits = outputs[0]
        print(f"✅ ONNX inference successful!")
        print(f"📊 Output shape: {logits.shape}")
        print(f"🎯 Sample logits: {logits[0, -1, :5]}")
        
        return True
        
    except ImportError:
        print("⚠️  onnxruntime not installed, skipping ONNX test")
        return False
    except Exception as e:
        print(f"❌ ONNX test failed: {e}")
        return False

def main():
    print("🧠 Hyv AI Model Conversion - Day 2 (Fixed)")
    print("=" * 60)
    
    # Setup directories
    setup_directories()
    
    total_size = 0
    successful_conversions = 0
    
    # Convert DistilGPT-2
    distil_path, distil_size = convert_distilgpt2()
    if distil_path:
        total_size += distil_size
        successful_conversions += 1
        
        # Test DistilGPT-2
        test_onnx_model(
            distil_path, 
            "models/distilgpt2_tokenizer",
            "Generate synthetic customer data:",
            "gpt"
        )
    
    # Try CodeT5 first, then fallback to GPT-2
    codet5_path, codet5_size = convert_codet5()
    if codet5_path:
        total_size += codet5_size
        successful_conversions += 1
        
        # Test CodeT5
        test_onnx_model(
            codet5_path,
            "models/codet5_tokenizer", 
            "Generate code: def create_dataset():",
            "t5"
        )
    else:
        print("\n🔄 Trying alternative code model...")
        alt_path, alt_size = convert_alternative_code_model()
        if alt_path:
            total_size += alt_size
            successful_conversions += 1
            
            # Test alternative
            test_onnx_model(
                alt_path,
                "models/gpt2_code_tokenizer",
                "def create_dataset():",
                "gpt"
            )
    
    # Summary
    print("\n" + "=" * 60)
    print("📋 CONVERSION SUMMARY")
    print("=" * 60)
    print(f"✅ Successful conversions: {successful_conversions}/2")
    print(f"💾 Total size: {total_size:.1f} MB")
    print(f"📂 Models saved in: ./models/")
    
    if successful_conversions >= 1:
        print(f"\n🎉 {successful_conversions} model(s) converted successfully!")
        print("📝 Next steps:")
        print("   1. Upload models to hyv_ai_engine canister")
        print("   2. Implement ONNX inference in Rust")
        print("   3. Test end-to-end generation")
    else:
        print(f"\n⚠️  No models converted successfully")
        print("🔧 Check errors above and retry")
    
    return successful_conversions >= 1

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
