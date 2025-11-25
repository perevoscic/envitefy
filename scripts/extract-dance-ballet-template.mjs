import fs from 'fs';
import path from 'path';

const sourceFile = 'src/app/event/dance-ballet/customize/page.tsx';
const targetFile = 'src/components/event-templates/DanceBalletTemplate.tsx';

const content = fs.readFileSync(sourceFile, 'utf8');

// Extract everything from type DanceEvent to const config
const startIdx = content.indexOf('type DanceEvent');
const configStartIdx = content.indexOf('const config = {');
const configEndIdx = content.indexOf('const Page = createSimpleCustomizePage');

if (startIdx === -1 || configStartIdx === -1 || configEndIdx === -1) {
  console.error('Could not find required sections');
  console.error(`startIdx: ${startIdx}, configStartIdx: ${configStartIdx}, configEndIdx: ${configEndIdx}`);
  process.exit(1);
}

const typesAndSections = content.substring(startIdx, configStartIdx);
const configSection = content.substring(configStartIdx, configEndIdx);

// Build the template file
const templateContent = `// @ts-nocheck
"use client";

import React, { memo } from "react";
import {
  ClipboardList,
  Users,
  MapPin,
  Clock,
  Phone,
  Mail,
  Shirt,
  Plus,
  Trash2,
} from "lucide-react";

${typesAndSections}

${configSection}

export { 
  config, 
  eventsSection,
  practiceSection,
  rosterSection,
  logisticsSection,
  gearSection
};
export type { 
  DanceEvent, 
  PracticeBlock, 
  RosterDancer, 
  LogisticsInfo, 
  GearInfo 
};
`;

fs.writeFileSync(targetFile, templateContent, 'utf8');
console.log(`Created ${targetFile} (${templateContent.length} bytes)`);

