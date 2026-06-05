# Lab 4: Invoice Extraction Pipeline

⏱ Estimated time: 6h

## What You'll Build

A production-grade document processing pipeline for ClearBooks that extracts structured data from invoice and receipt PDFs using Claude's tool_use API, validates the output with a correction-instruction retry loop, and routes results by confidence tier. The pipeline also supports overnight batch processing of large invoice volumes using the Batch API with per-document correlation via custom identifiers.

## Real-World Scenario

ClearBooks is a fictional accounts payable automation platform serving mid-size businesses. Their clients receive hundreds of vendor invoices per month in inconsistent PDF formats — some include line items, some lack invoice numbers, some mix currencies. The accounting team currently keys in data by hand and wants 80%+ straight-through processing with automatic validation, a human review queue for ambiguous documents, and overnight batch runs to keep costs low.

## Exam Domains Exercised

| Domain | Concepts Tested |
|---|---|
| D4 — Prompt Engineering & Structured Output | JSON schema design, nullable fields, enum + companion fields, tool_use for structured extraction, validation-retry with specific correction instructions |
| D5 — Context Management & Reliability | Explicit "not found" exit path, retry failure modes, partial batch failure handling, confidence routing, stratified accuracy tracking |

## Prerequisites

- Module 04 (Prompt Engineering & Structured Output) — complete before M1 and M2
- Module 05 (Context Management & Reliability) — complete before M3 and M4

## Milestones Overview

- **M1** — Design the JSON schema with nullable and enum fields; verify null (not fabricated) values for absent data
- **M2** — Build a validation-retry loop with field-specific correction instructions and an explicit "not found" exit path
- **M3** — Submit a 50-invoice batch, correlate results via custom_id, and handle partial failures gracefully
- **M4** — Add confidence-tier routing and stratified accuracy tracking broken down by document_type
