export function extractVariables(text: string): string[] {
  const regex = /\{\{([a-z_][a-z0-9_]*)\}\}/g;
  const matches = [...text.matchAll(regex)];
  return Array.from(new Set(matches.map(m => m[1])));
}

export function hasMalformedVariables(text: string): boolean {
  // basic check for unclosed or improperly formatted braces
  const openCount = (text.match(/\{\{/g) || []).length;
  const closeCount = (text.match(/\}\}/g) || []).length;
  if (openCount !== closeCount) return true;
  
  const allBracesContent = text.match(/\{\{([^}]*)\}\}/g) || [];
  for (const match of allBracesContent) {
    const inner = match.slice(2, -2);
    if (!/^[a-z_][a-z0-9_]*$/.test(inner)) {
      return true;
    }
  }
  return false;
}
