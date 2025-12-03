# AI Creative Studio – Auto Ad Creative Generator  
GroundTruth Mini AI Hackathon 2025  
Problem Code: H-003  
Problem Title: The AI Creative Studio

## 🔍 Problem Statement (H-003)
Businesses spend a significant amount of time manually designing multiple variations of marketing creatives.  
The challenge is to build a system that:

- Accepts a brand logo and product image as input  
- Automatically generates multiple high-quality advertising creative variations  
- Generates matching ad captions  
- Packages all outputs as downloadable files  

This project aims to deliver a fast, automated, and AI-powered creative generation pipeline.

---

## 🛠 Tools & Technologies
- Next.js 14 (App Router)
- React + Tailwind CSS
- Next.js API Routes
- OpenAI / Stability AI (Image Generation)
- OpenAI LLM (Caption Generation)
- JSZip for exporting assets  
- Node.js (file handling, processing)

---

## 🚀 Approach (Brief)
The system is built in iterative phases to ensure smooth development, testing, and debugging:

1. Phase 1 – Base Setup:  
   Project structure, Tailwind integration, upload UI, placeholder API.

2. Phase 2 – UI Enhancements:  
   Client-side previews, validation, UX improvements.

3. Phase 3 – Image Generation Engine:  
   Connect to AI image generator, produce 10 creative variations.

4. Phase 4 – Caption Generator:  
   LLM-based caption/headline generation.

5. Phase 5 – Preview Page:  
   Display generated creatives with captions in a grid.

6. Phase 6 – ZIP Export:  
   Package all creatives + captions for download.