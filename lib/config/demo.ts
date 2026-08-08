// Build-time demo flag. Because it's read from a NEXT_PUBLIC_* env var
// against a literal, Next can statically eliminate the demo branches
// from the production bundle when the flag is unset.
export const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
