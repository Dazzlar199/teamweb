# Project Overview

## Purpose
Team Dashboard (팀 대시보드) - Internal collaboration and management tool for a special team.

## Tech Stack
- **Framework**: Next.js 16.1.1
- **React**: 19.2.3
- **TypeScript**: 5.x
- **Styling**: Tailwind CSS 4.x
- **Backend**: Supabase (optional)
- **Rich Editor**: Quill 2.0.3 with react-quill-new
- **Excel Support**: exceljs, file-saver

## Features
- Dashboard
- Schedule Management
- Project Management
- Document Management
- 2026 Pre-Startup Package Management
- Financial Management
- Customer Validation (Interviews, Surveys)
- Communication Space (Board)

## Project Structure
- Monorepo structure with root package.json
- Main app: `apps/team-dashboard`
- Key directories:
  - `app/` - Next.js app router
  - `components/` - React components
  - `lib/` - Utility libraries
  - `public/` - Static assets