/** Static widget defaults; live copy comes from GET /chat/settings and /chat/faqs when the API is up. */
export const chatbotConfig = {
  brandName: 'NexPept',
  bubbleTitle: 'Your Research Support at NexPept',
  greeting: 'Hey! How can we assist you today?',
  headerTitle: 'Our team is here for you',
  agentName: 'NexPept Support',
  agentAvatar:
    'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200&h=200&fit=crop&crop=faces',
  whatsappUrl: 'https://wa.me/16472606806',
  instagramUrl: 'https://www.instagram.com/official.nexpept/',
  faqs: [
    {
      id: 'coa',
      question: 'Do you provide COAs?',
      answer:
        'Product Quality Summary is available on every product page. Independent third-party Certificates of Analysis are available upon request for select batches.',
    },
    {
      id: 'shipping',
      question: 'Where do you ship?',
      answer:
        'We ship to addresses within Canada only via Canada Post Xpresspost for safe, discreet delivery.',
    },
    {
      id: 'delivery',
      question: 'When will I get my order?',
      answer:
        'Most orders ship the same business day. GTA typically 1–2 business days; rural or remote areas 3–5 business days.',
    },
    {
      id: 'quality',
      question: 'How do you verify product quality?',
      answer:
        'Every peptide product is lab-tested before listing. If a product has not been tested, we do not sell it.',
    },
    {
      id: 'returns',
      question: 'What is your return policy?',
      answer:
        'All sales are final due to the nature of our products. If you have a quality concern, contact us so we can assist.',
    },
  ],
  channels: [
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      type: 'whatsapp',
    },
    {
      id: 'instagram',
      label: 'Instagram DM',
      type: 'instagram',
    },
  ],
}
