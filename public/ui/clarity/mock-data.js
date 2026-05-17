// Realistic mock wardrobe + AI feedback for the prototype.

window.MOCK = {
  wardrobe: [
    {
      id: 'w1', name: 'Off-white cotton tee', category: 'tops',
      color: 'Off-white', colorHex: '#F1ECDD',
      audio: 'Lightweight cotton tee, off-white with a slight cream tone. Crew neck. Boxy fit through the shoulders. Reads casual and clean.',
      tags: ['casual', 'work', 'date'],
    },
    {
      id: 'w2', name: 'Indigo wash denim', category: 'bottoms',
      color: 'Indigo', colorHex: '#324E7B',
      audio: 'Mid-rise indigo denim, straight leg, light fade at the thighs. Versatile across casual and smart casual.',
      tags: ['casual', 'smart_casual'],
    },
    {
      id: 'w3', name: 'Black ribbed knit', category: 'tops',
      color: 'Black', colorHex: '#1A1A1A',
      audio: 'Fine merino rib knit. Long sleeve, crew. Slim through the body, drapes close. Pairs sharp with trousers.',
      tags: ['smart_casual', 'date', 'work'],
    },
    {
      id: 'w4', name: 'Olive field jacket', category: 'outerwear',
      color: 'Olive', colorHex: '#5C6B3B',
      audio: 'Heavyweight cotton field jacket, dusty olive. Four flap pockets. Boxy through the chest, hits at the hip.',
      tags: ['casual', 'outdoor'],
    },
    {
      id: 'w5', name: 'White leather low-tops', category: 'shoes',
      color: 'White', colorHex: '#F4F2EC',
      audio: 'Minimal leather low-top sneakers. Plain white upper, no logo, gum sole.',
      tags: ['casual', 'smart_casual', 'date'],
    },
    {
      id: 'w6', name: 'Cream merino cardigan', category: 'outerwear',
      color: 'Cream', colorHex: '#E8DDC2',
      audio: 'Lightweight merino cardigan, cream. Five buttons. Soft drape, hits just below the waist.',
      tags: ['smart_casual', 'work', 'date'],
    },
    {
      id: 'w7', name: 'Charcoal wool trousers', category: 'bottoms',
      color: 'Charcoal', colorHex: '#2D2D33',
      audio: 'Tropical wool trousers in deep charcoal. Pleated front, tapered ankle. Dressier alternative to denim.',
      tags: ['work', 'formal', 'date'],
    },
    {
      id: 'w8', name: 'Burnt orange scarf', category: 'accessories',
      color: 'Burnt orange', colorHex: '#B95E2A',
      audio: 'Soft wool scarf, burnt orange with a small fringe. Adds warmth and a strong accent.',
      tags: ['casual', 'outdoor'],
    },
  ],

  scanResult: {
    name: 'Indigo washed cotton tee',
    color: 'Washed indigo',
    colorHex: '#3F5C8A',
    fit: 'Relaxed',
    confidence: 0.92,
    speech_segments: [
      { id: 1, text: 'I am looking at a washed indigo cotton tee. The wash sits between mid and dark, with light tonal variation through the chest — the fabric reads soft and broken in, not new.' },
      { id: 2, text: 'The fit is relaxed: shoulders fall a little wide, sleeves hit mid-bicep, body hangs straight without taper. This shape will sit well over slim bottoms.' },
      { id: 3, text: 'Crew neck, no chest detail, no graphic. A quiet piece — works as a foundation in your wardrobe.' },
    ],
    color_feedback: 'Indigo plays cleanly against cream, off-white, and warm browns. Strong pairing with your olive field jacket.',
    fit_feedback: 'The relaxed cut is forgiving and modern; tuck a quarter of the front into mid-rise trousers for a sharper line.',
  },

  mirrorResult: {
    occasion: 'Smart casual',
    overall: 'Strong outfit. Confident and considered.',
    speech_segments: [
      { id: 1, text: 'Cream merino cardigan over the off-white tee. Charcoal wool trousers. White leather low-tops.' },
      { id: 2, text: 'The cream-on-off-white tonal layering is doing the heavy lifting — soft and elevated. The charcoal trouser anchors the look so it does not float.' },
      { id: 3, text: 'Proportions read well: the cardigan sits just below the waist, your trouser hem breaks once on the shoe. Shoulders are clean.' },
    ],
    personal_appearance: 'You are looking sharp. Posture is open, the palette suits your skin tone, and the outfit feels intentional without trying.',
    score: 8.6,
  },

  outfitSuggestion: {
    occasion: 'Date night',
    items: ['w3', 'w7', 'w5'],
    rationale: 'Black ribbed knit, charcoal wool trousers, white low-tops. The rib gives you texture up close, the charcoal keeps it grown-up, the white sneaker reads relaxed without undercutting the rest. Wear the burnt orange scarf if it is cold — that accent is the move.',
    speech_segments: [
      { id: 1, text: 'For date night I would build around the black ribbed knit. It is the most flattering top in your wardrobe up close — the rib catches light and reads expensive.' },
      { id: 2, text: 'Pair with the charcoal wool trousers. Tonal dark-on-dark, no jarring colour break. Finish with the white leather low-tops to keep it from feeling stiff.' },
      { id: 3, text: 'If the evening is cool, the burnt orange scarf is the accent move. Otherwise leave it off and let the silhouette speak.' },
    ],
  },

  shoppingResult: {
    verdict: 'good',
    speech_segments: [
      { id: 1, text: 'You are looking at a muted sage green button-up. Soft, slightly washed, no pattern.' },
      { id: 2, text: 'This works with your wardrobe. Sage layers cleanly over the off-white tee and pairs with both the indigo denim and the charcoal trousers.' },
      { id: 3, text: 'You do not have a green piece yet — this would extend your palette without clashing. I would say buy it.' },
    ],
    matches: ['w1', 'w2', 'w7'],
  },
};
