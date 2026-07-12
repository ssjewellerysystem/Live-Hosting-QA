export const categoryMap = {
  'Rings': 'अंगूठियाँ',
  'Necklaces': 'हार',
  'Earrings': 'झुमके',
  'Bracelets': 'कंगन',
  'Bridal Collection': 'ब्राइडल कलेक्शन'
};

export const uiLabelsMap = {
  'All Products': 'सभी उत्पाद',
  'Showing premium handpicked items in stock.': 'स्टॉक में उपलब्ध प्रीमियम चयनित उत्पाद',
  'Shop By Category': 'श्रेणी के अनुसार खरीदें'
};

export const translateCategory = (categoryName, language) => {
  if (!categoryName) return '';
  if (language === 'hi') {
    return categoryMap[categoryName] || categoryName;
  }
  return categoryName;
};

export const translateUiLabel = (label, language) => {
  if (!label) return '';
  if (language === 'hi') {
    return uiLabelsMap[label] || label;
  }
  return label;
};
