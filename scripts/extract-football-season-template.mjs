import fs from 'fs';
import path from 'path';

const sourceFile = 'src/app/event/football-season/customize/page.tsx';
const targetFile = 'src/components/event-templates/FootballSeasonTemplate.tsx';

const content = fs.readFileSync(sourceFile, 'utf8');

// Extract everything from type PlayerStatus to const config
const startIdx = content.indexOf('type PlayerStatus');
const configStartIdx = content.indexOf('const config: SimpleTemplateConfig = {');
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

import React from "react";
import {
  Users,
  Trophy,
  ClipboardList,
  Bus,
  Shirt,
  Car,
  Plus,
  Trash2,
  AlertCircle,
  Clock,
  MapPin,
  Phone,
  FileText,
  Link as LinkIcon,
  CheckSquare,
  Bell,
  Download,
  ExternalLink,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Home,
  Plane,
} from "lucide-react";

${typesAndSections}

${configSection}

export { 
  config, 
  gameScheduleSection,
  practiceSection,
  rosterSection,
  logisticsSection,
  gearSection,
  volunteersSection
};
export type { 
  PlayerStatus, 
  Player, 
  Game, 
  PracticeBlock, 
  LogisticsInfo, 
  GearItem, 
  VolunteerSlot 
};
`;

fs.writeFileSync(targetFile, templateContent, 'utf8');
console.log(`Created ${targetFile} (${templateContent.length} bytes)`);

