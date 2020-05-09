export class SearchIndexComponent {

  constructor(termsToNames, namesToPaths) {
    this.termsToNames_ = termsToNames;
    this.namesToPaths_ = namesToPaths;
    this.lettersToTerms_ = new Map();

    for (const term of this.termsToNames_.keys()) {
      const first = term[0].toLowerCase();
      if (!this.lettersToTerms_.has(first)) {
        this.lettersToTerms_.set(first, new Set());
      }
      this.lettersToTerms_.get(first).add(term);
    }
  }

  search(query) {
    const terms =
        query.split(',').map(t => t.trim().toLowerCase()).filter(t => !!t);
    
    let whitelist = undefined;
    for (const term of terms) {
      whitelist = this.matchTerm_(term, whitelist);
    }
    
    if (!whitelist) {
      return [];
    }

    const results = [];
    for (const name of whitelist) {
      results.push({
        name,
        path: this.namesToPaths_.get(name),
      });
    }
    return results;
  }

  matchTerm_(term, opt_whitelist) {
    const matchingTerms = this.lettersToTerms_.get(term[0]);
    const matchingNames = new Set();
    if (!matchingTerms) {
      return matchingNames;
    }

    for (const possibleTerm of matchingTerms) {
      if (!possibleTerm.toLowerCase().startsWith(term)) {
        continue;
      }

      for (const name of this.termsToNames_.get(possibleTerm)) {
        if (opt_whitelist && !opt_whitelist.has(name)) {
          continue;
        }

        matchingNames.add(name);
      }
    }

    return matchingNames;
  }
}
