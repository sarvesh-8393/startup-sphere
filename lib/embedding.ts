// lib/embedding.ts
// Handles all embedding generation using Google's text-embedding-004 model
// Free tier: 1500 requests/day, 768-dimensional vectors

/**
 * Builds the text we will embed for a startup.
 * We combine the most descriptive fields into one string.
 */
export function buildStartupText(startup: {
  name?: string;
  short_description?: string;
  description?: string;
  mission_statement?: string;
  problem_solution?: string;
  target_market?: string;
  tags?: string[];
}): string {
  return [
    startup.name || "",
    startup.short_description || "",
    startup.description || "",
    startup.mission_statement || "",
    startup.problem_solution || "",
    startup.target_market || "",
    (startup.tags || []).join(" "),
  ]
    .join(" ")
    .toLowerCase()
    .trim();
}

/**
 * Calls Google's text-embedding-004 API and returns a 768-dimensional vector.
 *
 * Called:
 *   - Once when a startup is CREATED
 *   - Once when a startup is UPDATED
 *   - Once per recommendation request (to embed the user's interest vector)
 */
export async function getEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.GOOGLE_EMBEDDING_API_KEY;

  if (!apiKey) {
    throw new Error("GOOGLE_EMBEDDING_API_KEY is not set in environment variables");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "models/text-embedding-004",
        content: { parts: [{ text }] },
        output_dimensionality: 768,
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Google Embedding API error: ${err}`);
  }

  const data = await response.json();
  return data.embedding.values as number[];
}

/**
 * Averages multiple vectors into one.
 * Used to combine a user's liked startup vectors into one interest vector.
 *
 * Example:
 *   User liked 3 startups → 3 vectors → 1 averaged vector
 *   That averaged vector represents "what this user is interested in"
 */
export function averageVectors(vectors: number[][]): number[] {
  if (vectors.length === 0) return [];
  const dim = vectors[0].length;
  const result = new Array(dim).fill(0);

  vectors.forEach((vec) => {
    vec.forEach((val, i) => {
      result[i] += val;
    });
  });

  return result.map((val) => val / vectors.length);
}

/**
 * Cosine similarity between two vectors.
 * Returns a value between 0 (no similarity) and 1 (identical).
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;

  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}