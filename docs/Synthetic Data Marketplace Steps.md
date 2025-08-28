### Phased Plan for Synthetic Data Marketplace

Below is a breakdown of the implementation into phases and tasks. Each phase builds on the previous one, focusing on off-chain AI generation, on-chain storage, and frontend marketplace integration. Tasks are prioritized within phases for incremental progress.

#### Phase 1: Preparation and Setup (1-2 days)
- [ ] Verify local environment: Ensure hyv_ml_env venv is activated and ONNX models in models are accessible.
- [ ] Install dependencies: Add `onnxruntime` and `requests` to hyv_ml_env via `pip install`.
- [ ] Test local IC setup: Run `dfx start --clean` and deploy canisters to confirm backend connectivity.
- [ ] Review existing code: Familiarize with main.mo, lib.rs, and App.jsx structures.

#### Phase 2: Backend Canister Development (2-3 days)
- [ ] Add job queue types: Define `JobId`, `JobStatus`, `GenerationJob` types in main.mo.
- [ ] Implement stable variables: Add `pendingJobs` and `nextJobId` for persistence.
- [ ] Create job APIs: Implement `submitGenerationJob`, `listPendingJobs`, and `markJobComplete` functions.
- [ ] Integrate with existing dataset storage: Ensure `markJobComplete` links to `uploadDataset` or similar for final storage.
- [ ] Test backend APIs: Use `dfx canister call` to verify job submission and listing work locally.

#### Phase 3: Off-Chain Worker Development (2-3 days)
- [ ] Create worker script: Develop `scripts/generator_worker.py` with job polling logic.
- [ ] Implement inference: Add ONNX model loading and synthetic data generation (start with simple text generation).
- [ ] Add IC communication: Use HTTP requests or an IC library to call backend canister methods.
- [ ] Handle errors: Add try-catch for job failures, timeouts, and retries.
- [ ] Test worker: Run worker locally, submit a job via `dfx`, and verify dataset storage.

#### Phase 4: Frontend Integration (2-3 days)
- [ ] Update generation UI: Modify `handleGenerate` in App.jsx to call `submitGenerationJob` instead of direct generation.
- [ ] Add polling mechanism: Implement interval-based polling for job completion and dataset refresh.
- [ ] Enhance marketplace display: Ensure new datasets appear in the marketplace grid with proper metadata.
- [ ] Add job status UI: Show pending jobs with spinners or status messages in the UI.
- [ ] Test frontend flow: Submit a job from the UI, monitor polling, and verify dataset modal appears.

#### Phase 5: Marketplace Enhancements (1-2 days)
- [ ] Add pricing to datasets: Extend `Dataset` type in backend to include `price: Nat` and sale logic.
- [ ] Implement purchase API: Add `purchaseDataset(id)` function in backend for on-chain transactions.
- [ ] Update frontend sale UI: Add buy buttons and pricing display in dataset cards.
- [ ] Add verification: Ensure purchases use canister calls for trust and immutability.
- [ ] Test marketplace: Simulate buying/selling datasets and verify on-chain records.

#### Phase 6: Testing, Deployment, and Polish (2-3 days)
- [ ] End-to-end testing: Run full flow (submit job → worker generates → store on-chain → display on frontend).
- [ ] Handle edge cases: Test failures (worker offline, model errors), timeouts, and multiple jobs.
- [ ] Optimize performance: Add caching, batching, or streaming for large datasets.
- [ ] Deploy to mainnet: Use `dfx deploy --network ic` once local tests pass.
- [ ] Documentation: Update README with setup and usage instructions for the marketplace.

### Next Actions
- Start with Phase 1 to ensure your environment is ready.
- Confirm which phase you'd like to tackle first, or if you need code snippets/patches for a specific task.
- If blocked, provide error logs or specific questions for debugging.