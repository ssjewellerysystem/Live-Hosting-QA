import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Truck, RotateCcw, Award } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

export const TrustShowcase = () => {
  const { language } = useTranslation();

  // Translations
  const text = {
    en: {
      title: "The SSJewellery Heritage Promise",
      subtitle: "Secured quality guarantees for lifetime luxury heirloom transactions",
      items: [
        {
          title: "GIA Certified Diamonds",
          desc: "Every solitaire & gemstone is verified by the Gemological Institute of America, guaranteeing top color, cut, and clarity values.",
          detail: "100% GIA Certified"
        },
        {
          title: "100% BIS Hallmarked Gold",
          desc: "Our gold jewelry is officially stamped with the Bureau of Indian Standards (BIS) hallmark logo, verifying genuine 916 (22K) purity.",
          detail: "Government Stamp Verified"
        },
        {
          title: "Insured Transit Shipping",
          desc: "Each valuable parcel is fully insured and shipped via specialized secure transit channels, eliminating buyer delivery risk.",
          detail: "Fully Insured Delivery"
        },
        {
          title: "Lifetime Value exchange",
          desc: "We offer transparent lifetime buyback guarantees and gold trade-in value exchange policies on all gold weights.",
          detail: "Easy Exchange Policies"
        }
      ]
    },
    hi: {
      title: "SSJewellery विरासत और विश्वास",
      subtitle: "आजीवन लक्जरी आभूषणों की सुरक्षा और गुणवत्ता की गारंटी",
      items: [
        {
          title: "GIA प्रमाणित हीरे",
          desc: "प्रत्येक सॉलिटेयर और रत्न जेमोलॉजिकल इंस्टीट्यूट ऑफ अमेरिका द्वारा सत्यापित है, जो सर्वोत्तम रंग, कट और स्पष्टता की गारंटी देता है।",
          detail: "100% GIA प्रमाणित"
        },
        {
          title: "100% BIS हॉलमार्क सोना",
          desc: "हमारे सोने के आभूषणों पर आधिकारिक तौर पर भारतीय मानक ब्यूरो (BIS) हॉलमार्क लोगो अंकित है, जो वास्तविक 916 (22K) शुद्धता की पुष्टि करता है।",
          detail: "सरकारी स्टैम्प प्रमाणित"
        },
        {
          title: "बीमाकृत सुरक्षित डिलीवरी",
          desc: "प्रत्येक बहुमूल्य पार्सल का पूरी तरह से बीमा किया जाता है और विशेष सुरक्षित कूरियर माध्यमों से भेजा जाता है, जिससे डिलीवरी जोखिम समाप्त हो जाता है।",
          detail: "पूर्णतः सुरक्षित ट्रांजिट"
        },
        {
          title: "लाइफटाइम एक्सचेंज गारंटी",
          desc: "हम सभी सोने के गहनों पर पारदर्शी आजीवन बायबैक गारंटी और विनिमय नीतियां प्रदान करते हैं, जिससे आपका निवेश सुरक्षित रहता है।",
          detail: "आसान विनिमय नीतियां"
        }
      ]
    }
  }[language === 'hi' ? 'hi' : 'en'];

  // Icons matching options
  const icons = [
    <Award className="h-6 w-6 text-[#D4A75F]" />,
    <ShieldCheck className="h-6 w-6 text-[#D4A75F]" />,
    <Truck className="h-6 w-6 text-[#D4A75F]" />,
    <RotateCcw className="h-6 w-6 text-[#D4A75F]" />
  ];

  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10"
    >
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h2 className="text-xl sm:text-3xl font-bold font-serif text-[#3F1D5A] dark:text-[#EFE7DB] tracking-wide relative inline-block pb-3">
          {text.title}
          <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-0.5 bg-gradient-to-r from-transparent via-[#D4A75F] to-transparent" />
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
          {text.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {text.items.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            whileHover={{ y: -8, scale: 1.02 }}
            className="group bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:border-[#D4A75F]/35 transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              {/* Icon Container */}
              <div className="p-3 bg-amber-500/10 dark:bg-amber-500/5 rounded-xl w-fit mb-4 group-hover:bg-gradient-to-r group-hover:from-[#D4A75F] group-hover:to-[#BF934B] group-hover:text-white transition-all duration-300">
                <span className="group-hover:text-white transition-colors duration-300">
                  {icons[index]}
                </span>
              </div>

              <h3 className="text-sm sm:text-base font-bold text-slate-850 dark:text-slate-150 tracking-wide mb-2 group-hover:text-[#3F1D5A] dark:group-hover:text-[#D4A75F] transition-colors duration-300">
                {item.title}
              </h3>
              
              <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed">
                {item.desc}
              </p>
            </div>

            {/* Badge Footer */}
            <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800/80">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#D4A75F]">
                🛡️ {item.detail}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
};
