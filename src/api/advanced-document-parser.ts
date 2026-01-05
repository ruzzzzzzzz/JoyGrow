/**
 * Advanced Document Parser - FIXED VERSION
 * Properly extracts text from PDF, DOCX, TXT files
 */

import JSZip from 'jszip';

// @ts-ignore - PDF.js is loaded from CDN in index.html
const pdfjsLib = window.pdfjsLib;

// Configure PDF.js worker
if (pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

interface ParsedDocument {
  text: string;
  pageCount?: number;
  wordCount: number;
}

/**
 * Parse PDF files using PDF.js
 */
async function parsePDFDocument(file: File): Promise<ParsedDocument> {
  if (!pdfjsLib) {
    throw new Error('PDF.js library not loaded. Please refresh the page.');
  }

  try {
    console.log('📄 Processing PDF file...');
    
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    const textContent: string[] = [];
    const pageCount = pdf.numPages;
    
    console.log(`  Found ${pageCount} pages`);
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      
      const pageText = content.items
        .map((item: any) => item.str)
        .join(' ');
      
      if (pageText.trim().length > 0) {
        textContent.push(pageText);
      }
      
      console.log(`  ✓ Page ${pageNum}/${pageCount} extracted`);
    }
    
    const fullText = textContent.join('\n\n').trim();
    
    if (fullText.length < 50) {
      throw new Error('Could not extract enough readable text from PDF. The file may be image-based or corrupted.');
    }
    
    const wordCount = fullText.split(/\s+/).filter(w => w.length > 0).length;
    
    console.log(`✅ PDF parsed: ${wordCount} words, ${pageCount} pages`);
    
    return {
      text: fullText,
      wordCount,
      pageCount,
    };
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parse DOCX files using JSZip
 */
async function parseDOCXDocument(file: File): Promise<ParsedDocument> {
  try {
    console.log('📝 Processing DOCX file...');
    
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    
    // DOCX files contain the main document in word/document.xml
    const documentXml = await zip.file('word/document.xml')?.async('text');
    
    if (!documentXml) {
      throw new Error('Could not find document content in DOCX file.');
    }
    
    // Extract text from XML by finding all <w:t> tags
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(documentXml, 'text/xml');
    
    // Get all text nodes
    const textNodes = xmlDoc.getElementsByTagName('w:t');
    const textContent: string[] = [];
    
    for (let i = 0; i < textNodes.length; i++) {
      const text = textNodes[i].textContent;
      if (text) {
        textContent.push(text);
      }
    }
    
    // Join all text with spaces
    const finalText = textContent.join(' ').replace(/\s+/g, ' ').trim();
    
    // Check if we extracted enough text
    if (finalText.length < 50) {
      throw new Error('Could not extract readable text from DOCX file. The document may be empty or corrupted.');
    }
    
    const wordCount = finalText.split(/\s+/).filter(word => word.length > 0).length;
    
    console.log(`✅ DOCX parsed: ${wordCount} words`);
    
    return {
      text: finalText,
      wordCount
    };
  } catch (error) {
    console.error('DOCX parsing error:', error);
    throw new Error('Failed to parse DOCX file. Please ensure the file is a valid Word document or try converting to TXT format.');
  }
}

/**
 * Parse TXT files
 */
async function parseTXTDocument(file: File): Promise<ParsedDocument> {
  try {
    console.log('📄 Processing TXT file...');
    
    const text = await file.text();
    const trimmedText = text.trim();
    
    if (trimmedText.length < 50) {
      throw new Error('Text file is too short or empty. Please provide a document with at least 50 characters.');
    }
    
    const wordCount = trimmedText.split(/\s+/).filter(w => w.length > 0).length;
    
    console.log(`✅ TXT parsed: ${wordCount} words`);
    
    return {
      text: trimmedText,
      wordCount
    };
  } catch (error) {
    console.error('TXT parsing error:', error);
    throw new Error('Failed to read text file.');
  }
}

/**
 * Main document parsing function
 */
export async function parseDocument(file: File): Promise<ParsedDocument> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  console.log(`🔍 Parsing ${extension?.toUpperCase()} file: ${file.name}`);
  console.log(`📦 File size: ${(file.size / 1024).toFixed(2)} KB`);
  
  switch (extension) {
    case 'pdf':
      return await parsePDFDocument(file);
    
    case 'doc':
    case 'docx':
      return await parseDOCXDocument(file);
    
    case 'txt':
      return await parseTXTDocument(file);
    
    default:
      throw new Error(`Unsupported file type: ${extension}. Please upload PDF, DOCX, or TXT files.`);
  }
}

/**
 * Extract summary from text using extractive summarization
 */
export function generateSmartSummary(text: string, maxSentences: number = 5): string {
  const sentences = text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 30 && s.split(/\s+/).length >= 5);
  
  if (sentences.length === 0) {
    return text.slice(0, 300) + '...';
  }
  
  // Score each sentence
  const scoredSentences = sentences.map((sentence, index) => {
    let score = 0;
    
    // Length score (prefer medium-length sentences)
    const words = sentence.split(/\s+/).length;
    if (words >= 10 && words <= 25) score += 3;
    else if (words > 25 && words <= 35) score += 2;
    else score += 1;
    
    // Position score (first sentences are often important)
    if (index === 0) score += 5;
    else if (index === 1) score += 3;
    else if (index === 2) score += 2;
    else if (index === sentences.length - 1) score += 2;
    
    // Keywords that indicate importance
    const importantKeywords = [
      'important', 'significant', 'key', 'main', 'primary', 'essential',
      'fundamental', 'critical', 'vital', 'crucial', 'major', 'central',
      'conclude', 'therefore', 'thus', 'consequently', 'in summary',
      'overall', 'in conclusion', 'notably', 'significantly'
    ];
    
    const lowerSentence = sentence.toLowerCase();
    importantKeywords.forEach(keyword => {
      if (lowerSentence.includes(keyword)) score += 3;
    });
    
    // Numbers and statistics
    if (/\d+/.test(sentence)) score += 2;
    
    // Proper nouns (capitalized words)
    const capitalWords = sentence.match(/\b[A-Z][a-z]+\b/g) || [];
    score += Math.min(capitalWords.length, 3);
    
    return { sentence, score, index };
  });
  
  // Get top sentences
  const topSentences = scoredSentences
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSentences)
    .sort((a, b) => a.index - b.index) // Restore original order
    .map(s => s.sentence);
  
  const summary = topSentences.join('. ') + '.';
  
  // Ensure summary isn't too long
  if (summary.length > 600) {
    return summary.slice(0, 600) + '...';
  }
  
  return summary;
}

/**
 * Extract key terms with improved algorithm
 */
export function extractKeyTerms(text: string, maxTerms: number = 20): string[] {
  const stopWords = new Set([
    'the', 'is', 'at', 'which', 'on', 'a', 'an', 'as', 'are', 'was', 'were',
    'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
    'would', 'should', 'could', 'may', 'might', 'must', 'can', 'of', 'to',
    'in', 'for', 'with', 'by', 'from', 'up', 'about', 'into', 'through',
    'during', 'before', 'after', 'above', 'below', 'between', 'under',
    'and', 'or', 'but', 'if', 'then', 'than', 'so', 'this', 'that', 'these',
    'those', 'it', 'its', 'their', 'them', 'they', 'he', 'she', 'his', 'her',
    'we', 'our', 'your', 'you', 'me', 'my', 'mine', 'who', 'whom', 'what',
    'where', 'when', 'why', 'how', 'all', 'each', 'every', 'both', 'few',
    'more', 'most', 'other', 'some', 'such', 'only', 'own', 'same', 'also',
    'just', 'very', 'too', 'can', 'will', 'now', 'make', 'like', 'time',
    'slide', 'page', 'section'
  ]);
  
  // Extract words and count frequencies
  const words = text.toLowerCase()
    .replace(/[^a-z\s-]/g, ' ')
    .split(/\s+/)
    .filter(word => 
      word.length > 3 && 
      !stopWords.has(word) &&
      !/^\d+$/.test(word) // Exclude pure numbers
    );
  
  const wordFreq = new Map<string, number>();
  words.forEach(word => {
    wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
  });
  
  // Extract multi-word terms (2-3 words)
  const phrases: string[] = [];
  
  // Extract capitalized multi-word terms from original text
  const capitalizedTerms = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2}\b/g) || [];
  capitalizedTerms.forEach(term => {
    if (term.split(/\s+/).length <= 3) {
      phrases.push(term);
    }
  });
  
  // Count phrase frequencies
  const phraseFreq = new Map<string, number>();
  phrases.forEach(phrase => {
    const lower = phrase.toLowerCase();
    if (!stopWords.has(lower)) {
      phraseFreq.set(phrase, (phraseFreq.get(phrase) || 0) + 1);
    }
  });
  
  // Combine and rank terms
  const singleWordTerms = Array.from(wordFreq.entries())
    .filter(([word, count]) => count >= 2) // Appears at least twice
    .sort((a, b) => b[1] - a[1])
    .slice(0, Math.floor(maxTerms * 0.6))
    .map(([word]) => word);
  
  const multiWordTerms = Array.from(phraseFreq.entries())
    .filter(([_, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, Math.floor(maxTerms * 0.4))
    .map(([phrase]) => phrase);
  
  // Capitalize first letter of each term
  const allTerms = [...multiWordTerms, ...singleWordTerms]
    .map(term => term.charAt(0).toUpperCase() + term.slice(1))
    .slice(0, maxTerms);
  
  return [...new Set(allTerms)]; // Remove duplicates
}

/**
 * Extract main concepts from text
 */
export function extractMainConcepts(text: string, maxConcepts: number = 8): string[] {
  const sentences = text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 30);
  
  const concepts: string[] = [];
  
  // Pattern 1: Definition patterns
  const definitionPatterns = [
    /([A-Z][^.!?]*?)\s+(?:is|are|was|were)\s+(?:a|an|the)?\s*([^.!?]{20,100})/gi,
    /([A-Z][^.!?]*?)\s+(?:refers to|means|defined as|describes)\s+([^.!?]{20,100})/gi,
    /([A-Z][^.!?]*?)\s*:\s*([^.!?]{20,100})/gi,
  ];
  
  definitionPatterns.forEach(pattern => {
    const matches = [...text.matchAll(pattern)];
    matches.forEach(match => {
      const concept = `${match[1].trim()}: ${match[2].trim()}`;
      if (concept.length < 150) {
        concepts.push(concept);
      }
    });
  });
  
  // Pattern 2: Important sentences
  const importantIndicators = [
    'important', 'key point', 'main idea', 'primary', 'essential',
    'fundamental', 'critical', 'significant', 'notably', 'remember that'
  ];
  
  sentences.forEach(sentence => {
    const lower = sentence.toLowerCase();
    if (importantIndicators.some(indicator => lower.includes(indicator))) {
      if (sentence.length < 150) {
        concepts.push(sentence);
      }
    }
  });
  
  // Pattern 3: Numbered or bulleted points
  const bulletPattern = /(?:•|\*|-|\d+\.)\s*([^•\*\-\d.][^.!?]{30,150})/g;
  let match;
  while ((match = bulletPattern.exec(text)) !== null) {
    concepts.push(match[1].trim());
  }
  
  // Remove duplicates and limit
  return [...new Set(concepts)].slice(0, maxConcepts);
}

/**
 * Detect topics from text
 */
export function detectTopics(text: string, keyTerms: string[]): string[] {
  const topics: string[] = [];
  const lowerText = text.toLowerCase();
  const lowerTerms = keyTerms.map(t => t.toLowerCase());
  
  const topicKeywords: { [topic: string]: string[] } = {
    'Science': ['science', 'experiment', 'hypothesis', 'theory', 'research', 'study', 'cell', 'atom', 'molecule', 'chemical', 'physics', 'biology'],
    'Technology': ['technology', 'computer', 'software', 'program', 'algorithm', 'code', 'data', 'digital', 'internet', 'network', 'system', 'application'],
    'Mathematics': ['math', 'equation', 'formula', 'calculate', 'number', 'algebra', 'geometry', 'statistics', 'probability', 'theorem', 'proof'],
    'Business': ['business', 'market', 'company', 'economy', 'finance', 'management', 'strategy', 'profit', 'revenue', 'customer', 'product'],
    'Medicine': ['medical', 'health', 'disease', 'treatment', 'patient', 'diagnosis', 'symptom', 'therapy', 'clinical', 'hospital', 'doctor'],
    'History': ['history', 'historical', 'century', 'war', 'revolution', 'empire', 'ancient', 'modern', 'era', 'civilization', 'culture'],
    'Literature': ['literature', 'author', 'novel', 'poem', 'story', 'character', 'plot', 'theme', 'literary', 'book', 'writing'],
    'Law': ['law', 'legal', 'court', 'justice', 'rights', 'constitution', 'legislation', 'attorney', 'judge', 'case'],
    'Engineering': ['engineering', 'design', 'build', 'structure', 'mechanical', 'electrical', 'civil', 'construction', 'architecture'],
    'Education': ['education', 'learning', 'teaching', 'student', 'course', 'curriculum', 'instruction', 'academic', 'school', 'university'],
  };
  
  Object.entries(topicKeywords).forEach(([topic, keywords]) => {
    const matchCount = keywords.filter(keyword => 
      lowerText.includes(keyword) || lowerTerms.some(term => term.includes(keyword))
    ).length;
    
    if (matchCount >= 3) {
      topics.push(topic);
    }
  });
  
  return topics.length > 0 ? topics : ['General Knowledge'];
}