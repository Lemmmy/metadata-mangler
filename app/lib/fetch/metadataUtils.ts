/**
 * Searches for a catalog number (e.g. CPNL-0004) in the input string (e.g. a directory name). Returns all the catalog
 * numbers within the range if a range is specified.
 * @param input
 */
export function parseCatalogNumber(input: string): string[] {
  const regex =
    /\b(([A-Z]{2,5}[-–—])\d{3,5}R?)(?:[~～](\d{1,3})|[-–—~～][A-Z0-9]{1,3})?\b/g;
  const results = [];

  let match;
  while ((match = regex.exec(input)) !== null) {
    const [whole, catalogNumber, prefix, range] = match;

    const out = [whole];

    // If there's a range (e.g. KSLC-0036~9), then include all the catalog numbers within that range. The number after the
    // tilde is the last catalog number in the range, digits replaced from right to left.
    if (range && prefix) {
      out.push(catalogNumber);

      // Extract the numeric part from the catalog number
      const numericPart = catalogNumber.substring(prefix.length);

      // Parse the starting number
      const startNum = parseInt(numericPart, 10);

      // Determine the end number by replacing digits from right to left
      let endNumStr = numericPart;
      const rangeDigits = range.split("");

      // Replace digits from right to left
      for (let i = 0; i < rangeDigits.length; i++) {
        const position = endNumStr.length - 1 - i;
        if (position >= 0) {
          endNumStr =
            endNumStr.substring(0, position) +
            rangeDigits[rangeDigits.length - 1 - i] +
            endNumStr.substring(position + 1);
        }
      }

      const endNum = parseInt(endNumStr, 10);

      // Generate all catalog numbers in the range
      for (let i = startNum + 1; i <= endNum; i++) {
        // Format the number with leading zeros to match the original format
        const formattedNum = i.toString().padStart(numericPart.length, "0");
        out.push(`${prefix}${formattedNum}`);
      }
    }

    results.push(...out);
  }

  return results;
}

export function isBarcode(input: string | undefined): boolean {
  if (!input || input == "N/A") return false;
  return /^\d{6,}R?$/.test(input);
}
