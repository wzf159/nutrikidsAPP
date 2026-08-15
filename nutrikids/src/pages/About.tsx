import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

type TabId =
  | 'about-nutrikids'
  | 'mission'
  | 'how-it-works'
  | 'team'
  | 'sources'
  | 'ai-disclaimer'
  | 'medical-disclaimer'
  | 'privacy-policy'
  | 'terms-of-use'
  | 'get-in-touch';

const gradientText: React.CSSProperties = {
  fontFamily: "'Fredoka One', cursive",
  fontSize: '24px',
  background: 'linear-gradient(135deg, #893ce3 0%, #c026d3 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  margin: 0,
};

const cardStyle: React.CSSProperties = {
  background: 'white',
  borderRadius: '20px',
  padding: '28px 32px',
  boxShadow: '0 2px 16px rgba(137,60,227,0.07)',
};

const sectionGap: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '22px',
};

const subheading: React.CSSProperties = {
  color: '#7c3aed',
  fontSize: '16px',
  marginBottom: '8px',
  fontFamily: "'Nunito', sans-serif",
};

const bodyText: React.CSSProperties = {
  color: '#555',
  lineHeight: 1.8,
  margin: 0,
  fontFamily: "'Nunito', sans-serif",
};

const pillBox = (bg: string, border: string): React.CSSProperties => ({
  background: bg,
  borderLeft: `4px solid ${border}`,
  borderRadius: '8px',
  padding: '14px 18px',
  fontFamily: "'Nunito', sans-serif",
});

const highlightBox: React.CSSProperties = {
  background: '#f5f3ff',
  borderRadius: '12px',
  padding: '16px 20px',
};

function PanelAbout() {
  const { t } = useTranslation();
  const paragraphs = t('about.panelAbout.paragraphs', { returnObjects: true }) as string[];
  return (
    <div style={cardStyle}>
      <h2 style={{ ...gradientText, marginBottom: '16px' }}>{t('about.panelAbout.title')}</h2>
      {paragraphs.slice(0, 3).map((text, i) => (
        <p key={i} style={{ ...bodyText, marginBottom: '14px' }}>{text}</p>
      ))}
      <p style={{ ...bodyText, marginBottom: '14px' }} dangerouslySetInnerHTML={{ __html: paragraphs[3] }} />
      <p style={bodyText} dangerouslySetInnerHTML={{ __html: paragraphs[4] }} />
    </div>
  );
}

function PanelMission() {
  const { t } = useTranslation();
  const paragraphs = t('about.panelMission.paragraphs', { returnObjects: true }) as string[];
  return (
    <div style={cardStyle}>
      <h2 style={{ ...gradientText, marginBottom: '16px' }}>{t('about.panelMission.title')}</h2>
      {paragraphs.map((text, i) => (
        <p
          key={i}
          style={i < paragraphs.length - 1 ? { ...bodyText, marginBottom: '14px' } : bodyText}
          dangerouslySetInnerHTML={{ __html: text }}
        />
      ))}
    </div>
  );
}

function PanelHowItWorks() {
  const { t } = useTranslation();
  const badge = (label: string, color: string, bg: string) => (
    <span style={{ background: bg, color, fontSize: '12px', padding: '2px 10px', borderRadius: '999px', marginLeft: '8px' }}>
      {label}
    </span>
  );
  return (
    <div style={cardStyle}>
      <h2 style={{ ...gradientText, marginBottom: '20px' }}>{t('about.panelHowItWorks.title')}</h2>
      <div style={{ marginBottom: '22px' }}>
        <h3 style={{ color: '#7c3aed', fontSize: '17px', marginBottom: '8px', fontFamily: "'Nunito', sans-serif" }}>
          🔍 {t('about.panelHowItWorks.foodAnalyzer.title')}{badge(t('about.panelHowItWorks.foodAnalyzer.badge'), '#7c3aed', '#e9d5ff')}
        </h3>
        <p style={bodyText}>{t('about.panelHowItWorks.foodAnalyzer.desc')}</p>
      </div>
      <div style={{ marginBottom: '22px' }}>
        <h3 style={{ color: '#7c3aed', fontSize: '17px', marginBottom: '8px', fontFamily: "'Nunito', sans-serif" }}>
          📊 {t('about.panelHowItWorks.dailyTracking.title')}{badge(t('about.panelHowItWorks.dailyTracking.badge'), '#92400e', '#fde68a')}
        </h3>
        <p style={bodyText}>{t('about.panelHowItWorks.dailyTracking.desc')}</p>
      </div>
      <div style={{ marginBottom: '22px' }}>
        <h3 style={{ color: '#7c3aed', fontSize: '17px', marginBottom: '8px', fontFamily: "'Nunito', sans-serif" }}>
          🧬 {t('about.panelHowItWorks.personalizedPlans.title')}{badge(t('about.panelHowItWorks.personalizedPlans.badge'), '#92400e', '#fde68a')}
        </h3>
        <p style={bodyText}>{t('about.panelHowItWorks.personalizedPlans.desc')}</p>
      </div>
      <div style={{ background: '#f5f3ff', borderRadius: '14px', padding: '16px 20px', fontFamily: "'Nunito', sans-serif" }}>
        <h3 style={{ color: '#7c3aed', fontSize: '16px', marginBottom: '8px' }}>💡 {t('about.panelHowItWorks.approach.title')}</h3>
        <p style={bodyText} dangerouslySetInnerHTML={{ __html: t('about.panelHowItWorks.approach.desc') }} />
      </div>
    </div>
  );
}

function PanelTeam() {
  const { t } = useTranslation();
  const members = t('about.panelTeam.members', { returnObjects: true }) as { emoji: string; name: string; role: string }[];
  return (
    <div style={cardStyle}>
      <h2 style={{ ...gradientText, marginBottom: '8px' }}>{t('about.panelTeam.title')}</h2>
      <p style={{ color: '#888', fontSize: '14px', marginBottom: '24px' }} dangerouslySetInnerHTML={{ __html: t('about.panelTeam.desc') }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: '16px' }}>
        {members.map((m) => (
          <div key={m.name} style={{ background: '#f5f3ff', borderRadius: '14px', padding: '18px 20px' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>{m.emoji}</div>
            <div style={{ fontWeight: 700, color: '#3b0764', fontSize: '15px' }}>{m.name}</div>
            <div style={{ color: '#7c3aed', fontSize: '13px', marginTop: '4px' }}>{m.role}</div>
          </div>
        ))}
      </div>
      <p style={{ color: '#888', fontSize: '13px', marginTop: '20px' }}>{t('about.panelTeam.footer')}</p>
    </div>
  );
}
function PanelSources() {
  const { t } = useTranslation();

  const scoreDims = t(
    'about.panelSources.scoreCalc.dims',
    { returnObjects: true }
  ) as {
    label: string;
    weight: string;
    desc: string;
  }[];

  const sourceGroups = [
    {
      emoji: '🌍',
      name: 'World Health Organization',
      abbr: 'WHO',
      references: [
        {
          text: 'World Health Organization. (2011). Nutrient profiling: report of a WHO/IASO technical meeting, London, United Kingdom, 4–6 October 2010.',
          url: 'https://iris.who.int/handle/10665/336447',
        },
      ],
    },

    {
      emoji: '🏥',
      name: 'Centers for Disease Control and Prevention',
      abbr: 'CDC',
      references: [
        {
          text: 'Centers for Disease Control and Prevention. (2015, March). Dental caries and sealant prevalence in children and adolescents in the United States, 2011-2012 (NCHS Data Brief No. 191).',
          url: 'https://www.cdc.gov/nchs/products/databriefs/db191.htm',
        },
        {
          text: 'Centers for Disease Control and Prevention. (2025, December 3). Physical activity basics and your health.',
          url: 'https://www.cdc.gov/physicalactivity/basics/children/',
        },
      ],
    },

    {
      emoji: '🔬',
      name: 'NIH Office of Dietary Supplements',
      abbr: 'NIH ODS',
      references: [
        {
          text: 'National Institutes of Health, Office of Dietary Supplements. (2025, September 4). Iron: Fact sheet for health professionals.',
          url: 'https://ods.od.nih.gov/factsheets/Iron-HealthProfessional/',
        },
        {
          text: 'National Institutes of Health, Office of Dietary Supplements. (n.d.). Dietary supplements for immune function and infectious diseases: Fact sheet for health professionals.',
          url: 'https://ods.od.nih.gov/factsheets/ImmuneFunction-HealthProfessional/',
        },
        {
          text: 'National Institutes of Health, Office of Dietary Supplements. (n.d.). Omega-3 fatty acids: Fact sheet for health professionals.',
          url: 'https://ods.od.nih.gov/factsheets/Omega3FattyAcids-HealthProfessional/',
        },
        {
          text: 'National Institutes of Health, Office of Dietary Supplements. (2026, June 22). Calcium: Fact sheet for health professionals.',
          url: 'https://ods.od.nih.gov/factsheets/Calcium-HealthProfessional/',
        },
        {
          text: 'National Institutes of Health, Office of Dietary Supplements. (n.d.). Folate: Fact sheet for health professionals.',
          url: 'https://ods.od.nih.gov/factsheets/Folate-HealthProfessional/',
        },
        {
          text: 'National Institutes of Health, Office of Dietary Supplements. (2024, May 1). Iodine: Fact sheet for consumers.',
          url: 'https://ods.od.nih.gov/factsheets/Iodine-Consumer/',
        },
        {
          text: 'National Institutes of Health, Office of Dietary Supplements. (2026, January 6). Magnesium: Fact sheet for health professionals.',
          url: 'https://ods.od.nih.gov/factsheets/Magnesium-HealthProfessional/',
        },
        {
          text: 'National Institutes of Health, Office of Dietary Supplements. (n.d.). Phosphorus: Fact sheet for health professionals.',
          url: 'https://ods.od.nih.gov/factsheets/Phosphorus-HealthProfessional/',
        },
        {
          text: 'National Institutes of Health, Office of Dietary Supplements. (2022, June 2). Potassium: Fact sheet for health professionals.',
          url: 'https://ods.od.nih.gov/factsheets/Potassium-HealthProfessional/',
        },
        {
          text: 'National Institutes of Health, Office of Dietary Supplements. (2025, March 10). Vitamin A and carotenoids: Fact sheet for consumers.',
          url: 'https://ods.od.nih.gov/factsheets/VitaminA-Consumer/',
        },
        {
          text: 'National Institutes of Health, Office of Dietary Supplements. (2025, July 2). Vitamin B12: Fact sheet for health professionals.',
          url: 'https://ods.od.nih.gov/factsheets/VitaminB12-HealthProfessional/',
        },
        {
          text: 'National Institutes of Health, Office of Dietary Supplements. (2023, June 16). Vitamin B6: Fact sheet for consumers.',
          url: 'https://ods.od.nih.gov/factsheets/VitaminB6-Consumer/',
        },
        {
          text: 'National Institutes of Health, Office of Dietary Supplements. (n.d.). Vitamin D: Fact sheet for health professionals.',
          url: 'https://ods.od.nih.gov/factsheets/VitaminD-HealthProfessional/',
        },
        {
          text: 'National Institutes of Health, Office of Dietary Supplements. (2021, March 22). Vitamin E: Fact sheet for consumers.',
          url: 'https://ods.od.nih.gov/factsheets/VitaminE-Consumer/',
        },
        {
          text: 'National Institutes of Health, Office of Dietary Supplements. (2021, March 22). Vitamin K: Fact sheet for consumers.',
          url: 'https://ods.od.nih.gov/factsheets/VitaminK-Consumer/',
        },
        {
          text: 'National Institutes of Health, Office of Dietary Supplements. (2022, October 4). Zinc: Fact sheet for consumers.',
          url: 'https://ods.od.nih.gov/factsheets/Zinc-Consumer/',
        },
      ],
    },

    {
      emoji: '🔬',
      name: 'NIH National Center for Complementary and Integrative Health',
      abbr: 'NIH NCCIH',
      references: [
        {
          text: 'National Center for Complementary and Integrative Health. (2019, August). Probiotics: Usefulness and safety.',
          url: 'https://www.nccih.nih.gov/health/probiotics-usefulness-and-safety',
        },
      ],
    },

    {
      emoji: '🩺',
      name: 'U.S. Preventive Services Task Force',
      abbr: 'USPSTF',
      references: [
        {
          text: 'U.S. Preventive Services Task Force. (2021, December 7). Prevention of dental caries in children younger than 5 years: Screening and interventions. JAMA.',
          url: 'https://www.uspreventiveservicestaskforce.org/uspstf/recommendation/prevention-of-dental-caries-in-children-younger-than-age-5-years-screening-and-interventions1',
        },
      ],
    },

    {
      emoji: '👶',
      name: 'American Academy of Pediatrics',
      abbr: 'AAP',
      references: [
        {
          text: 'Wagner, C. L., Greer, F. R., & American Academy of Pediatrics Section on Breastfeeding and Committee on Nutrition. (2008). Prevention of rickets and vitamin D deficiency in infants, children, and adolescents. Pediatrics, 122(5), 1142-1152.',
          url: 'https://publications.aap.org/pediatrics/article/122/5/1142/71470',
        },
      ],
    },

    {
      emoji: '❤️',
      name: 'American Heart Association',
      abbr: 'AHA',
      references: [
        {
          text: 'American Heart Association. (2026, March 31). 2026 dietary guidance to improve cardiovascular health: A scientific statement from the American Heart Association. Circulation.',
          url: 'https://www.ahajournals.org/doi/10.1161/CIR.0000000000001435',
        },
        {
          text: 'American Heart Association. (2026, March 31). Following 9 key steps for a lifetime of eating well can support heart health. AHA Newsroom.',
          url: 'https://newsroom.heart.org/news/following-9-key-steps-for-a-lifetime-of-eating-well-can-support-heart-health',
        },
        {
          text: 'American Heart Association. (n.d.). Dietary recommendations for healthy children.',
          url: '',
        },
      ],
    },

    {
      emoji: '🏨',
      name: "Children's Hospital Los Angeles",
      abbr: 'CHLA',
      references: [
        {
          text: "Children's Hospital Los Angeles. (n.d.). Infant nutrition and feeding: Nutritional needs (Chapter 1).",
          url: 'https://www.chla.org/sites/default/files/migrated/Chapter1_NutritionalNeeds.pdf',
        },
      ],
    },

    {
      emoji: '📖',
      name: 'National Center for Biotechnology Information',
      abbr: 'NCBI',
      references: [
        {
          text: 'National Institute of Dental and Craniofacial Research. (2021, December). Oral health across the lifespan: Adolescents. In Oral health in America (NBK578291). NCBI Bookshelf.',
          url: 'https://www.ncbi.nlm.nih.gov/books/NBK578291/',
        },
        {
          text: 'Institute of Medicine (National Academies Press). (2011). Dietary reference intakes for energy, carbohydrate, fiber, fat, fatty acids, cholesterol, protein, and amino acids: Summary tables (NBK56068). NCBI Bookshelf.',
          url: 'https://www.ncbi.nlm.nih.gov/books/NBK56068/',
        },
        {
          text: 'Canadian Agency for Drugs and Technologies in Health. (2024, June). Choline supplementation for infants, children, and pregnant people (NBK605544). NCBI Bookshelf.',
          url: 'https://www.ncbi.nlm.nih.gov/books/NBK605544/',
        },
      ],
    },

    {
      emoji: '📖',
      name: 'PubMed Central and National Center for Biotechnology Information',
      abbr: 'PMC + NCBI',
      references: [
        {
          text: 'Atherosclerotic cardiovascular disease beginning in childhood. (2010). Korean Circulation Journal.',
          url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2812791/',
        },
        {
          text: 'Bone metabolism in children and adolescents: Main characteristics of the determinants of peak bone mass. (2014). Clinical Cases in Mineral and Bone Metabolism.',
          url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3917578/',
        },
        {
          text: 'Bone mineral accrual from adolescence into young adulthood and peak bone mass: A longitudinal cohort study. (2025). Health Science Reports.',
          url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12560013/',
        },
        {
          text: 'Breast and bottle feeding as risk factors for dental caries: A systematic review and meta-analysis. (2015). PLoS ONE.',
          url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4651315/',
        },
        {
          text: 'Dietary models and cardiovascular risk prevention in pediatric patients. (2023). Nutrients.',
          url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10458109/',
        },
        {
          text: 'Effects of malnutrition on the immune system and infection: A literature review. (2023). Nutrients.',
          url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10780435/',
        },
        {
          text: 'Fibre intake is associated with cardiovascular health in European children. (2020). Nutrients.',
          url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7822117/',
        },
        {
          text: "Impact of unhealthy food and beverage consumption on children's risk of dental caries: A systematic review. (2023). Nutrition Reviews.",
          url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11465133/',
        },
        {
          text: 'Nutritional approach to prevention and treatment of cardiovascular disease in childhood. (2021). Nutrients.',
          url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8308497/',
        },
        {
          text: 'The composition of the gut microbiota throughout life, with an emphasis on early life. (2015). Microbial Ecology in Health and Disease.',
          url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4315782/',
        },
        {
          text: 'The development of visual acuity and contrast sensitivity in children. (2010). Journal of Optometry.',
          url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3972638/',
        },
        {
          text: 'The prevalence and risk factors of abnormal vision among preschool children. (2024). Pediatric Health, Medicine and Therapeutics.',
          url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11584346/',
        },
        {
          text: 'Early development of infant gut microbiota in relation to breastfeeding and human milk oligosaccharides. (2023). Frontiers in Nutrition.',
          url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10034312/',
        },
        {
          text: 'Lutein supplementation for eye diseases. (2020). Nutrients.',
          url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7352796/',
        },
      ],
    },

    {
      emoji: '📰',
      name: 'Frontiers in Nutrition',
      abbr: 'Front. Nutr',
      references: [
        {
          text: 'Bone health in school age children: Effects of nutritional intake on outcomes. (2021). Frontiers in Nutrition.',
          url: 'https://www.frontiersin.org/journals/nutrition/articles/10.3389/fnut.2021.773425/full',
        },
        {
          text: 'Role of nutrition and gut microbiome in childhood brain development and behavior. (2025, June 9). Frontiers in Nutrition.',
          url: 'https://www.frontiersin.org/journals/nutrition/articles/10.3389/fnut.2025.1590172/full',
        },
      ],
    },

    {
      emoji: '📰',
      name: 'International Journal of Research in Orthopaedics',
      abbr: 'IJORO',
      references: [
        {
          text: 'Bone health from infancy to adolescence: A narrative review of nutritional and lifestyle determinants. (2025). International Journal of Research in Orthopaedics.',
          url: 'https://www.ijoro.org/index.php/ijoro/article/download/3876/2200/22717',
        },
      ],
    },

    {
      emoji: '📰',
      name: 'Merck Manual Professional Edition',
      abbr: 'MMPE',
      references: [
        {
          text: 'Merck Manual Professional Edition. (2025, January). Physical growth and sexual maturation of adolescents.',
          url: 'https://www.merckmanuals.com/professional/pediatrics/growth-and-development/physical-growth-and-sexual-maturation-of-adolescents',
        },
      ],
    },

    {
      emoji: '📰',
      name: 'S. Karger AG',
      abbr: 'Karger',
      references: [
        {
          text: 'S. Karger AG. (2019, December 28). Nutritional factors in fetal and infant brain development. Annals of Nutrition and Metabolism.',
          url: 'https://karger.com/anm/article/75/Suppl.%201/20/42664',
        },
        {
          text: 'S. Karger AG. (2025, June 24). Microbiome maturation trajectory and key milestones in early life. Annals of Nutrition and Metabolism.',
          url: 'https://karger.com/anm/article/81/Suppl.%201/20/925489',
        },
      ],
    },

    {
      emoji: '📰',
      name: 'ScienceDirect',
      abbr: 'ScienceDirect',
      references: [
        {
          text: 'Characteristics and longitudinal stability of gut microbiota in healthy individuals across different age groups. (2025, November). ScienceDirect.',
          url: 'https://www.sciencedirect.com/science/article/pii/S2666517425001725',
        },
        {
          text: 'Lewis, T. L., & Maurer, D. (2017). Critical periods re-examined: Evidence from children treated for dense cataracts. Cognitive Development.',
          url: 'https://www.sciencedirect.com/science/article/abs/pii/S0885201416300934',
        },
        {
          text: 'Neurodevelopmental effects of childhood malnutrition: A neuroimaging perspective. (2021, May). NeuroImage.',
          url: 'https://www.sciencedirect.com/science/article/pii/S1053811921001051',
        },
        {
          text: 'Origin of atherosclerosis in childhood and adolescence. (2023). American Journal of Clinical Nutrition.',
          url: 'https://www.sciencedirect.com/science/article/pii/S0002916523068727',
        },
        {
          text: 'Psychiatric and cognitive outcomes of iron supplementation in non-anemic children, adolescents, and menstruating adults: A meta-analysis and systematic review. (2025). Neuroscience & Biobehavioral Reviews.',
          url: 'https://www.sciencedirect.com/science/article/abs/pii/S0149763425003732',
        },
        {
          text: 'The impact of undernutrition and overnutrition on early brain development. (2025, June). ScienceDirect.',
          url: 'https://www.sciencedirect.com/science/article/abs/pii/S1071909125000336',
        },
      ],
    },

    {
      emoji: '🥛',
      name: 'U.S. Dairy and National Dairy Council',
      abbr: 'NDC',
      references: [
        {
          text: 'U.S. Dairy / National Dairy Council. (2026, January 27). Nutrition and childhood brain development.',
          url: 'https://www.usdairy.com/news-articles/infant-and-childhood-nutrition-and-cognition',
        },
      ],
    },

    {
      emoji: '🧪',
      name: 'BioRxiv',
      abbr: 'BioRxiv',
      references: [
        {
          text: 'Adolescent girls at familial risk for depression with more advanced adrenarche have altered gut microbiota. (2025, August 8). bioRxiv.',
          url: 'https://www.biorxiv.org/content/10.1101/2025.08.07.669149.full.pdf',
        },
      ],
    },

    {
      emoji: '📦',
      name: 'Open Food Facts',
      abbr: 'Open Food Facts',
      references: [
        {
          text: 'Open Food Facts. (2012). Open Food Facts [Data set].',
          url: 'https://world.openfoodfacts.org',
        },
      ],
    },
  ];

  return (
    <div style={cardStyle}>
      <h2 style={{ ...gradientText, marginBottom: '16px' }}>
        {t('about.panelSources.title')}
      </h2>

      <p style={{ ...bodyText, marginBottom: '20px' }}>
        {t('about.panelSources.desc')}
      </p>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        {sourceGroups.map((group) => (
          <details
            key={group.abbr}
            style={{
              background: '#f8f2ff',
              border: '1.5px solid rgba(137,60,227,0.18)',
              borderRadius: '18px',
              overflow: 'hidden',
            }}
          >
            <summary
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '18px 20px',
                cursor: 'pointer',
                listStyle: 'none',
              }}
            >
              <span
                style={{
                  fontSize: '28px',
                  flexShrink: 0,
                }}
              >
                {group.emoji}
              </span>

              <div style={{ flex: 1 }}>
                <div
                  style={{
                    color: '#3b0764',
                    fontWeight: 800,
                    fontSize: '17px',
                    fontFamily: "'Nunito', sans-serif",
                  }}
                >
                  {group.name}
                </div>

                <div
                  style={{
                    color: '#a855f7',
                    fontWeight: 700,
                    fontSize: '13px',
                    marginTop: '3px',
                  }}
                >
                  {group.abbr} · {group.references.length}{' '}
                  {group.references.length === 1
                    ? 'reference'
                    : 'references'}
                </div>
              </div>

              <span
                style={{
                  color: '#9ca3af',
                  fontSize: '20px',
                  fontWeight: 800,
                }}
              >
                ›
              </span>
            </summary>

            <div
              style={{
                borderTop:
                  '1px solid rgba(137,60,227,0.12)',
                padding: '16px 18px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {group.references.map((ref, index) => (
                <div
                  key={index}
                  style={{
                    background: '#fff',
                    borderRadius: '14px',
                    padding: '14px 16px',
                    border:
                      '1px solid rgba(137,60,227,0.08)',
                    color: '#4b5563',
                    fontSize: '13px',
                    lineHeight: 1.7,
                  }}
                >
                  <span>{ref.text} </span>

                  <a
                    href={ref.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: '#893ce3',
                      fontWeight: 700,
                      textDecoration: 'none',
                      wordBreak: 'break-all',
                    }}
                  >
                    {ref.url}
                  </a>
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>

      {/* scoreCalc 保留你原来的 */}
      <div
        style={{
          marginTop: '24px',
          background: '#faf5ff',
          border:
            '1.5px solid rgba(137,60,227,0.15)',
          borderRadius: '14px',
          padding: '20px 22px',
        }}
      >
        <h3
          style={{
            color: '#7c3aed',
            fontSize: '16px',
            fontWeight: 800,
            marginBottom: '6px',
            fontFamily: "'Nunito', sans-serif",
          }}
        >
          📐 {t('about.panelSources.scoreCalc.title')}
        </h3>

        <p
          style={{
            ...bodyText,
            fontSize: '13px',
            marginBottom: '16px',
          }}
        >
          {t('about.panelSources.scoreCalc.desc')}
        </p>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          {scoreDims.map((d, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                background: '#fff',
                borderRadius: '10px',
                padding: '10px 14px',
              }}
            >
              <span
                style={{
                  flexShrink: 0,
                  minWidth: '46px',
                  textAlign: 'center',
                  fontWeight: 800,
                  fontSize: '13px',
                  color: '#893ce3',
                  background: 'rgba(137,60,227,0.1)',
                  borderRadius: '999px',
                  padding: '3px 8px',
                }}
              >
                {d.weight}
              </span>

              <div>
                <p
                  style={{
                    color: '#3b0764',
                    fontWeight: 700,
                    fontSize: '13.5px',
                    margin: 0,
                  }}
                >
                  {d.label}
                </p>

                <p
                  style={{
                    color: '#777',
                    fontSize: '12.5px',
                    margin: '2px 0 0',
                  }}
                >
                  {d.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        <p
          style={{
            color: '#999',
            fontSize: '11.5px',
            marginTop: '14px',
            lineHeight: 1.7,
          }}
        >
          {t('about.panelSources.scoreCalc.note')}
        </p>
      </div>

      <p
        style={{
          color: '#888',
          fontSize: '13px',
          marginTop: '18px',
        }}
      >
        {t('about.panelSources.footer')}
      </p>
    </div>
  );
}
function PanelAIDisclaimer() {
  const { t } = useTranslation();
  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <span style={{ fontSize: '32px' }}>🤖</span>
        <h2 style={gradientText}>{t('about.panelAIDisclaimer.title')}</h2>
      </div>
      <p style={{ ...bodyText, marginBottom: '14px' }}>{t('about.panelAIDisclaimer.p1')}</p>
      <div style={{ ...pillBox('#fef3c7', '#f59e0b'), marginBottom: '14px' }}>
        <p style={{ color: '#78350f', lineHeight: 1.8, margin: 0 }} dangerouslySetInnerHTML={{ __html: t('about.panelAIDisclaimer.pillText') }} />
      </div>
      <p style={bodyText} dangerouslySetInnerHTML={{ __html: t('about.panelAIDisclaimer.p2') }} />
    </div>
  );
}

function PanelMedicalDisclaimer() {
  const { t } = useTranslation();
  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <span style={{ fontSize: '32px' }}>⚕️</span>
        <h2 style={gradientText}>{t('about.panelMedicalDisclaimer.title')}</h2>
      </div>
      <p style={{ ...bodyText, marginBottom: '14px' }} dangerouslySetInnerHTML={{ __html: t('about.panelMedicalDisclaimer.p1') }} />
      <div style={{ ...pillBox('#fee2e2', '#ef4444'), marginBottom: '14px' }}>
        <p style={{ color: '#7f1d1d', lineHeight: 1.8, margin: 0 }} dangerouslySetInnerHTML={{ __html: t('about.panelMedicalDisclaimer.pillText') }} />
      </div>
      <p style={bodyText} dangerouslySetInnerHTML={{ __html: t('about.panelMedicalDisclaimer.p2') }} />
    </div>
  );
}

function PanelPrivacyPolicy() {
  const { t } = useTranslation();
  const sections = t('about.panelPrivacyPolicy.sections', { returnObjects: true }) as Array<{
    title: string;
    content: string;
    items?: string[];
    type?: 'highlight';
  }>;
  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
        <span style={{ fontSize: '32px' }}>🔒</span>
        <h2 style={gradientText}>{t('about.panelPrivacyPolicy.title')}</h2>
      </div>
      <p style={{ color: '#aaa', fontSize: '13px', marginBottom: '24px' }}>{t('about.panelPrivacyPolicy.lastUpdated')}</p>
      <div style={sectionGap}>
        {sections.map((section, i) => {
          const Wrapper = section.type === 'highlight'
            ? ({ children }: { children: React.ReactNode }) => <div style={highlightBox}>{children}</div>
            : ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
          return (
            <Wrapper key={i}>
              <h3 style={subheading}>{section.title}</h3>
              {section.items ? (
                <>
                  <p style={{ ...bodyText, marginBottom: '10px' }} dangerouslySetInnerHTML={{ __html: section.content }} />
                  <ul style={{ color: '#555', lineHeight: 1.9, paddingLeft: '20px', margin: 0 }}>
                    {section.items.map((item, j) => (
                      <li key={j}>{item}</li>
                    ))}
                  </ul>
                </>
              ) : (
                <p style={bodyText} dangerouslySetInnerHTML={{ __html: section.content }} />
              )}
            </Wrapper>
          );
        })}
      </div>
    </div>
  );
}

function PanelTermsOfUse() {
  const { t } = useTranslation();
  const sections = t('about.panelTermsOfUse.sections', { returnObjects: true }) as Array<{
    title: string;
    content: string;
    type?: 'warning' | 'alert' | 'highlight';
  }>;
  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
        <span style={{ fontSize: '32px' }}>📜</span>
        <h2 style={gradientText}>{t('about.panelTermsOfUse.title')}</h2>
      </div>
      <p style={{ color: '#aaa', fontSize: '13px', marginBottom: '24px' }}>{t('about.panelTermsOfUse.lastUpdated')}</p>
      <div style={sectionGap}>
        {sections.map((section, i) => {
          if (section.type === 'warning') {
            return (
              <div key={i} style={pillBox('#fef3c7', '#f59e0b')}>
                <h3 style={{ color: '#92400e', fontSize: '15px', marginBottom: '6px' }}>{section.title}</h3>
                <p style={{ color: '#78350f', lineHeight: 1.8, margin: 0 }} dangerouslySetInnerHTML={{ __html: section.content }} />
              </div>
            );
          }
          if (section.type === 'alert') {
            return (
              <div key={i} style={pillBox('#fee2e2', '#ef4444')}>
                <h3 style={{ color: '#991b1b', fontSize: '15px', marginBottom: '6px' }}>{section.title}</h3>
                <p style={{ color: '#7f1d1d', lineHeight: 1.8, margin: 0 }} dangerouslySetInnerHTML={{ __html: section.content }} />
              </div>
            );
          }
          if (section.type === 'highlight') {
            return (
              <div key={i} style={highlightBox}>
                <h3 style={subheading}>{section.title}</h3>
                <p style={bodyText} dangerouslySetInnerHTML={{ __html: section.content }} />
              </div>
            );
          }
          return (
            <div key={i}>
              <h3 style={subheading}>{section.title}</h3>
              <p style={bodyText} dangerouslySetInnerHTML={{ __html: section.content }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PanelGetInTouch() {
  const { t } = useTranslation();
  const email = t('about.panelGetInTouch.email');
  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <span style={{ fontSize: '32px' }}>✉️</span>
        <h2 style={gradientText}>{t('about.panelGetInTouch.title')}</h2>
      </div>
      <div style={{ background: '#f5f3ff', borderRadius: '14px', padding: '24px 28px', textAlign: 'center' }}>
        <p style={{ color: '#4b5563', fontSize: '15px', lineHeight: 1.8, marginBottom: '16px' }}>{t('about.panelGetInTouch.text')}</p>
        <a
          href={`mailto:${email}`}
          style={{
            display: 'inline-block',
            fontFamily: "'Nunito', sans-serif",
            fontSize: '16px',
            fontWeight: 800,
            color: '#893ce3',
            textDecoration: 'none',
            background: 'rgba(137,60,227,0.08)',
            padding: '10px 24px',
            borderRadius: '999px',
            border: '1.5px solid rgba(137,60,227,0.2)',
          }}
        >
          {email}
        </a>
      </div>
    </div>
  );
}

const PANELS: Record<TabId, React.ReactNode> = {
  'about-nutrikids': <PanelAbout />,
  'mission': <PanelMission />,
  'how-it-works': <PanelHowItWorks />,
  'team': <PanelTeam />,
  'sources': <PanelSources />,
  'ai-disclaimer': <PanelAIDisclaimer />,
  'medical-disclaimer': <PanelMedicalDisclaimer />,
  'privacy-policy': <PanelPrivacyPolicy />,
  'terms-of-use': <PanelTermsOfUse />,
  'get-in-touch': <PanelGetInTouch />,
};

export default function About() {
  const location = useLocation();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabId>(
    (location.state as any)?.tab ?? 'about-nutrikids'
  );

  useEffect(() => {
    const tab = (location.state as any)?.tab;
    if (tab) setActiveTab(tab as TabId);
  }, [location.state]);

  const TABS: { id: TabId; label: string }[] = [
    { id: 'about-nutrikids', label: t('about.tabs.aboutNutrikids') },
    { id: 'mission', label: t('about.tabs.mission') },
    { id: 'how-it-works', label: t('about.tabs.howItWorks') },
    { id: 'team', label: t('about.tabs.team') },
    { id: 'sources', label: t('about.tabs.sources') },
    { id: 'ai-disclaimer', label: t('about.tabs.aiDisclaimer') },
    { id: 'medical-disclaimer', label: t('about.tabs.medicalDisclaimer') },
    { id: 'privacy-policy', label: t('about.tabs.privacyPolicy') },
    { id: 'terms-of-use', label: t('about.tabs.termsOfUse') },
    { id: 'get-in-touch', label: t('about.tabs.getInTouch') },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-br from-[#d8ccf5] via-[#e8ccec] to-[#ccd8f5]">
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '24px 16px 60px' }}>

        {/* Tab bar — 5-column grid matching original */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '8px',
            marginBottom: '28px',
          }}
        >
          {TABS.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  fontFamily: "'Nunito', sans-serif",
                  fontSize: '13px',
                  fontWeight: 700,
                  padding: '8px 12px',
                  borderRadius: '999px',
                  border: isActive ? 'none' : '1.5px solid rgba(137,60,227,0.22)',
                  background: isActive
                    ? 'linear-gradient(135deg, #893ce3 0%, #b06ae4 100%)'
                    : 'rgba(255,255,255,0.65)',
                  color: isActive ? '#fff' : '#893ce3',
                  cursor: 'pointer',
                  boxShadow: isActive ? '0 2px 8px rgba(137,60,227,0.25)' : 'none',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content panel */}
        {PANELS[activeTab]}
      </div>
    </div>
  );
}
