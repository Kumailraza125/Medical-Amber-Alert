// Conservative accident-prevention checks, not a privacy/compliance guarantee.
// The shared demo must never be used with real patient information.
export function noteHasSensitiveDetails(note){
 return /\b(?:patient(?:\s+name)?|full\s+name|first\s+name|last\s+name|phn|personal\s+health|health\s+(?:number|identifier)|dob|date\s+of\s+birth|medical\s+(?:history|background)|diagnos(?:is|ed)|allerg(?:y|ies)|symptoms?|illness|injury|home\s+address)\b/i.test(note)
  || /[A-Z][a-z]{1,}\s+[A-Z][a-z]{1,}/.test(note)
  || /[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(note)
  || /(?:\d[\s().+-]*){7,}/.test(note)
  || /\b\d{4}[-/]\d{1,2}[-/]\d{1,2}\b/.test(note);
}
