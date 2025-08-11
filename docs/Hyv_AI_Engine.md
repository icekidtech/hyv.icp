# Hyv AI Engine Documentation

## Overview

The **Hyv AI Engine** is a Rust-based canister that hosts AI models on-chain for synthetic data generation. It supports text generation (DistilGPT-2) and code generation (CodeT5) capabilities, designed to replace external API dependencies with fully decentralized AI inference.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Architecture](#architecture)
3. [Setup](#setup)
4. [Model Preparation](#model-preparation)
5. [Deployment](#deployment)
6. [API Reference](#api-reference)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements
- **OS**: Linux (recommended) or macOS
- **Rust**: Latest stable version with `wasm32-unknown-unknown` target
- **DFX**: Version 0.15.0 or later
- **Python**: 3.8+ with pip
- **Node.js**: 16+ with npm

### Required Tools
```bash
# Install Rust tools
cargo install wasi2ic ic-file-uploader wasm-opt

# Setup Python virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt
pip install transformers torch onnx tokenizers numpy

# Verify dfx installation
dfx --version
```

## Architecture

The Hyv AI Engine follows a modular architecture:

```
hyv_ai_engine/
├── src/
│   └── lib.rs              # Main canister logic
├── Cargo.toml              # Rust dependencies
└── dfx.json               # Canister configuration
```

### Key Components

- **Stable Memory Management**: Uses IC stable memory for persistent model storage
- **WASI Polyfill**: Enables file operations within the canister environment
- **Model Loading System**: Handles chunked upload and loading of ONNX models
- **Generation Engine**: Processes inference requests for text and code generation

## Setup

### 1. Environment Setup

```bash
# Clone the project
cd /path/to/hyv.icp

# Setup Python virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install project dependencies
pip install -r requirements.txt

# Install development dependencies
cargo install wasi2ic ic-file-uploader wasm-opt
pip install transformers torch onnx tokenizers numpy

# Create models directory
mkdir -p models/
```

### 2. Canister Configuration

The canister is configured in `dfx.json`:

```json
{
  "canisters": {
    "hyv_ai_engine": {
      "type": "rust",
      "package": "hyv_ai_engine"
    }
  }
}
```

## Model Preparation

### Supported Models

The engine currently supports two ONNX models:

1. **DistilGPT-2** (~82MB) - Text generation
2. **CodeT5-small** (~60MB) - Code generation

### Converting Models to ONNX

Create a Python script to convert models:

```python
from transformers import AutoTokenizer, AutoModelForCausalLM
import torch

# Convert DistilGPT-2
model = AutoModelForCausalLM.from_pretrained('distilgpt2')
tokenizer = AutoTokenizer.from_pretrained('distilgpt2')
tokenizer.pad_token = tokenizer.eos_token

dummy_input = tokenizer('Generate data:', return_tensors='pt', padding=True)
torch.onnx.export(
    model, 
    (dummy_input.input_ids, dummy_input.attention_mask),
    'models/distilgpt2.onnx',
    opset_version=14
)

# Convert CodeT5-small
code_model = AutoModelForCausalLM.from_pretrained('Salesforce/codet5-small')
code_tokenizer = AutoTokenizer.from_pretrained('Salesforce/codet5-small')

dummy_code_input = code_tokenizer('def hello():', return_tensors='pt', padding=True)
torch.onnx.export(
    code_model,
    (dummy_code_input.input_ids, dummy_code_input.attention_mask),
    'models/codet5-small.onnx',
    opset_version=14
)
```

## Deployment

### 1. Start Local Development Environment

```bash
# Start the local replica
dfx start --background

# Deploy the AI engine canister
dfx deploy hyv_ai_engine
```

### 2. Upload Models

Use the provided `upload_models.py` script:

```bash
python upload_models.py
```

This script:
- Uploads DistilGPT-2 and CodeT5 models in chunks
- Calls the `setup_models` function to initialize them
- Verifies successful deployment

### 3. Verify Deployment

```bash
# Check canister health
dfx canister call hyv_ai_engine health

# Check loaded models
dfx canister call hyv_ai_engine get_loaded_models

# Check engine status
dfx canister call hyv_ai_engine status
```

## API Reference

### Query Functions

#### `health() -> String`
Returns the health status of the AI engine.

```bash
dfx canister call hyv_ai_engine health
```

#### `status() -> String`
Returns the current status and initialization state.

```bash
dfx canister call hyv_ai_engine status
```

#### `get_loaded_models() -> Vec<String>`
Returns a list of currently loaded model names.

```bash
dfx canister call hyv_ai_engine get_loaded_models
```

### Update Functions

#### `clear_text_model_bytes()`
Clears the text model file for chunked upload.

```bash
dfx canister call hyv_ai_engine clear_text_model_bytes
```

#### `clear_code_model_bytes()`
Clears the code model file for chunked upload.

```bash
dfx canister call hyv_ai_engine clear_code_model_bytes
```

#### `append_text_model_bytes(bytes: Vec<u8>)`
Appends bytes to the text model file during chunked upload.

#### `append_code_model_bytes(bytes: Vec<u8>)`
Appends bytes to the code model file during chunked upload.

#### `setup_models() -> Result<String, String>`
Initializes models after upload completion.

```bash
dfx canister call hyv_ai_engine setup_models
```

#### `generate_synthetic_data(prompt: String, config: GenerationConfig) -> GenerationResult`
Main generation function (implementation in progress).

### Data Types

#### `GenerationConfig`
```rust
pub struct GenerationConfig {
    pub max_tokens: u32,
    pub temperature: f32,
    pub data_type: String, // "text", "code", "tabular"
}
```

#### `GenerationResult`
```rust
pub struct GenerationResult {
    pub success: bool,
    pub content: String,
    pub error: Option<String>,
}
```

## Testing

### Local Testing

```bash
# Test health endpoint
dfx canister call hyv_ai_engine health
# Expected: "Hyv AI Engine v1.0 - Ready for synthetic data generation!"

# Test status
dfx canister call hyv_ai_engine status
# Expected: "AI Engine Status: Initialized, awaiting model uploads"

# Upload models and test setup
python upload_models.py
dfx canister call hyv_ai_engine setup_models
# Expected: (Ok "Successfully loaded 2 models")

# Verify loaded models
dfx canister call hyv_ai_engine get_loaded_models
# Expected: (vec { "text_model"; "code_model" })
```

### Integration Testing

The AI engine integrates with the `hyv_generator` canister for end-to-end synthetic data generation.

## Troubleshooting

### Common Issues

#### 1. Model Upload Failures
```bash
# Check available memory
dfx canister status hyv_ai_engine

# Clear and retry upload
dfx canister call hyv_ai_engine clear_text_model_bytes
dfx canister call hyv_ai_engine clear_code_model_bytes
python upload_models.py
```

#### 2. Setup Failures
```bash
# Check if models were uploaded properly
dfx canister call hyv_ai_engine status

# If models missing, re-upload
python upload_models.py
```

#### 3. Memory Issues
```bash
# Check canister memory usage
dfx canister status hyv_ai_engine

# Consider optimizing model size or upgrading canister
```

### Error Codes

- **"Failed to load any models"**: Models not uploaded or corrupted
- **"Model file not found"**: Upload process incomplete
- **"Memory allocation failed"**: Insufficient canister memory

### Performance Optimization

1. **Model Size**: Consider quantized versions for smaller footprint
2. **Memory Management**: Monitor stable memory usage
3. **Chunked Processing**: Implement batch processing for large requests

## Implementation Roadmap

Based on the [implementation roadmap](docs/baba.md), the development follows these phases:

### Phase 1: Foundation & Core AI (Weeks 1-2)
- ✅ Environment setup and model preparation
- ✅ Rust canister structure with stable memory
- ✅ Model loading and text/code generation engines

### Phase 2: Integration & Frontend (Weeks 3-4)
- ✅ Backend integration with existing Hyv infrastructure
- ✅ Frontend enhancement with multi-model selection
- ✅ End-to-end testing and validation

### Phase 3: Enhancement & Marketplace (Weeks 5-6)
- ✅ Model marketplace functionality
- ✅ Quality scoring system
- ✅ Production deployment readiness

### Phase 4: Future Enhancements (Weeks 7-8+)
- ⚡ Advanced AI models (image generation)
- ⚡ Token economy integration
- ⚡ Multi-modal data generation
- ⚡ Analytics and monitoring

## Integration with Hyv Ecosystem

The AI Engine is part of the larger Hyv synthetic data marketplace:

- **Generator Integration**: Works with `hyv_generator` for data orchestration
- **Marketplace Support**: Enables on-chain model NFT trading
- **Quality System**: Supports dataset verification and scoring
- **Token Economy**: Integrates with $HYV token for usage-based pricing

## Next Steps

1. **Complete Generation Logic**: Implement ONNX runtime integration
2. **Add Model Switching**: Support multiple model types per request
3. **Implement Caching**: Cache frequent inference results
4. **Add Monitoring**: Implement usage metrics and logging
5. **Scale Testing**: Test with production-sized workloads

## Related Documentation

- [Product Requirements Document](docs/PRD.md)
- [Implementation Roadmap](docs/baba.md)
- [Frontend Integration Guide](src/hyv_frontend/index.html)
- [Project README](README.md)

## Quick Start Commands

```bash
# Environment setup (Day 1)
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cargo install wasi2ic ic-file-uploader wasm-opt
pip install transformers torch onnx tokenizers numpy

# Create workspace
mkdir -p src/hyv_ai_engine models/

# Start development
dfx start --background
dfx deploy hyv_ai_engine

# Upload and test models
python upload_models.py
dfx canister call hyv_ai_engine health
dfx canister call hyv_ai_engine get_loaded_models
```

---

*For detailed implementation steps and technical specifications, refer to the [complete implementation roadmap](docs/baba.md).*