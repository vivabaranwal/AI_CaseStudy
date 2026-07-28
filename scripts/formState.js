/* formState.js — Single source of truth */
export const formState = {
  step1: {
    companyName: '', industry: '',
    timePeriodFrom: '', timePeriodTo: ''
  },
  step2: {
    challengeText: '', protagonistName: '', protagonistTitle: ''
  },
  step3: { aiDiscoveryEnabled: true, manualURLs: [], manualPDFs: [], audioVideoFiles: [], transcriptFiles: [] },
  step4: {
    caseLength: 'standard', tone: 'academic',
    includeTeachingNote: false,
    citationStyle: 'general', sectionApproval: true,
    hookStyle: 'cinematic', language: 'english-academic'
  },
  generatedSections: {},
  approvedSections: [],
  sources: { primary: [], secondary: [] }
};
