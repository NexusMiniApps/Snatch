import Papa from 'papaparse';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

interface InstagramComment {
  username: string;
  comment: string;
  tags: string[];
  profilePictureUrl: string;
}

interface CsvRow {
  'User ID': string;
  'Username': string;
  'Comment': string;
  'Avatar URL': string;
}

function extractTags(comment: string): string[] {
  // Match all @mentions in the comment
  const tagRegex = /@[\w._]+/g;
  return comment.match(tagRegex) || [];
}

function cleanComment(comment: string): string {
  // Remove all @mentions and any text until a space
  return comment.replace(/@[\w._]+\s*/g, '').trim();
}

async function convertCsvToJson(): Promise<void> {
  try {
    // Read the CSV file
    const csvFilePath = join(process.cwd(), 'public', 'misc', 'matchaGiveaway.csv');
    const csvContent = readFileSync(csvFilePath, 'utf-8');

    // Remove BOM if present
    const cleanContent = csvContent.replace(/^\uFEFF/, '');

    // Parse CSV content
    const result = Papa.parse<CsvRow>(cleanContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim()
    });

    if (result.errors.length > 0) {
      console.error('CSV parsing errors:', result.errors);
      process.exit(1);
    }

    // Convert to desired JSON format
    const jsonData: InstagramComment[] = result.data.map((record: CsvRow) => ({
      username: record.Username,
      comment: cleanComment(record.Comment),
      tags: extractTags(record.Comment),
      profilePictureUrl: record['Avatar URL']
    }));

    // Write to JSON file
    const outputPath = join(process.cwd(), 'public', 'misc', 'matchaGiveaway.json');
    writeFileSync(outputPath, JSON.stringify(jsonData, null, 2));

    console.log('Conversion completed successfully!');
    console.log(`Output saved to: ${outputPath}`);
    console.log(`Total entries converted: ${jsonData.length}`);

  } catch (error) {
    console.error('Error during conversion:', error);
    process.exit(1);
  }
}

// Run the conversion
convertCsvToJson().catch(console.error); 