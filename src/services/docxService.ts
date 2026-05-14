import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, SectionType } from 'docx';
import { saveAs } from 'file-saver';
import { Blueprint } from '../types';

export const generateDocx = async (blueprint: Blueprint) => {
  const doc = new Document({
    sections: [
      {
        properties: {
          type: SectionType.NEXT_PAGE,
        },
        children: [
          // Header
          new Paragraph({
            text: blueprint.event_meta.title,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "BLUEPRINT OPERASIONAL KOMUNITAS",
                bold: true,
                color: "0D9488", // teal-600
                size: 24,
              }),
            ],
            spacing: { after: 800 },
          }),

          // Metadata Section
          new Paragraph({
            text: "RINGKASAN ACARA",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Lokasi: ", bold: true }),
              new TextRun({ text: blueprint.event_meta.location }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Budget: ", bold: true }),
              new TextRun({ text: `Rp ${blueprint.event_meta.budget.toLocaleString('id-ID')}` }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Skala: ", bold: true }),
              new TextRun({ text: blueprint.event_meta.scale_classification }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Strategi: ", bold: true }),
              new TextRun({ text: blueprint.event_meta.strategy }),
            ],
            spacing: { after: 400 },
          }),

          // Wellbeing Analysis
          new Paragraph({
            text: "WELLBEING & OPERATIONAL ANALYSIS",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Analisis Lelah Tim: ", bold: true }),
              new TextRun({ text: blueprint.wellbeing_guard.fatigue_analysis, italics: true }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Kerumitan Operasional: ", bold: true }),
              new TextRun({ text: `${blueprint.event_meta.operational_complexity}%` }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Risiko Burnout: ", bold: true }),
              new TextRun({ text: `${blueprint.event_meta.burnout_risk}%` }),
            ],
            spacing: { after: 400 },
          }),

          // Wellbeing Guard Recommendations
          new Paragraph({
            text: "REKOMENDASI WELLBEING GUARD",
            heading: HeadingLevel.HEADING_3,
          }),
          ...blueprint.wellbeing_guard.action_items.map(rec => 
            new Paragraph({
              text: `• ${rec}`,
              spacing: { before: 100 },
            })
          ),

          // Budget Allocation
          new Paragraph({
            text: "ALOKASI BUDGET SURVIVAL",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 600, after: 200 },
          }),
          ...blueprint.operational.budget_allocation.flatMap(item => [
            new Paragraph({
              children: [
                new TextRun({ text: item.item, bold: true }),
                new TextRun({ text: ` (Rp ${item.amount.toLocaleString('id-ID')})` }),
              ],
            }),
            new Paragraph({
              text: item.label,
              spacing: { after: 200 },
              indent: { left: 400 },
            }),
          ]),

          // Rundown
          new Paragraph({
            text: "RUNDOWN MANUSIAWI",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 600, after: 200 },
          }),
          ...blueprint.operational.rundown.map(step => 
            new Paragraph({
              children: [
                new TextRun({ text: `${step.time}: `, bold: true }),
                new TextRun({ text: step.task }),
              ],
              spacing: { after: 100 },
            })
          ),

          // Outreach
          new Paragraph({
            text: "OUTREACH & KOLABORASI",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 600, after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Partner Lokal Potensial: ", bold: true }),
              new TextRun({ text: blueprint.outreach.local_partners.join(', ') }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Instagram Caption Kit:", bold: true }),
            ],
            spacing: { before: 200 },
          }),
          new Paragraph({
            text: blueprint.outreach.ig_caption,
            spacing: { after: 400 },
          }),

          // Footer
          new Paragraph({
            text: "Dihasilkan secara otomatis oleh CommunityOS - AI Operating System for Communities in Indonesia",
            alignment: AlignmentType.CENTER,
            spacing: { before: 1000 },
            children: [
              new TextRun({
                text: "\nLanjutkan dokumen ini di Google Docs untuk koordinasi tim yang lebih efektif.",
                bold: true,
                color: "64748B", 
              }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `CommunityOS-Blueprint-${blueprint.event_meta.title.replace(/\s+/g, '-')}.docx`);
};
