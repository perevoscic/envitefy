import fs from 'fs';
import path from 'path';

const sourceFile = 'src/app/event/gymnastics/customize/page.tsx';
const targetFile = 'src/components/event-templates/GymnasticsTemplate.tsx';

const content = fs.readFileSync(sourceFile, 'utf8');

// Extract imports (lines 1-45)
const importsMatch = content.match(/^([\s\S]*?)(?=type FieldSpec|const GYM_FONTS)/m);
const imports = importsMatch ? importsMatch[1] : '';

// Extract everything from type AthleteStatus to const config
const startIdx = content.indexOf('type AthleteStatus');
const configStartIdx = content.indexOf('const config = {');
const configEndIdx = content.indexOf('const Page = createSimpleCustomizePage');

if (startIdx === -1 || configStartIdx === -1 || configEndIdx === -1) {
  console.error('Could not find required sections');
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
} from "lucide-react";

${typesAndSections}

${configSection}

export { config, rosterSection, meetSection, practiceSection, logisticsSection, gearSection, volunteersSection, announcementsSection };
export type { AthleteStatus, Athlete, MeetInfo, PracticeBlock, LogisticsInfo, GearItem, VolunteerSlot, CarpoolOffer };
`;

fs.writeFileSync(targetFile, templateContent, 'utf8');
console.log(`Created ${targetFile} (${templateContent.length} bytes)`);

