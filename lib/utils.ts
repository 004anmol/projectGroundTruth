/**
 * Utility functions for the AI Creative Studio
 * 
 * TODO: Add helper functions for:
 * - Prompt building
 * - Image generation
 * - File system operations
 */

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function generateBatchId(): string {
  return `batch-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

