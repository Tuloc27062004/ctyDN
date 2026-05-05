interface ContactInfo {
  phone: string[];
  email: string[];
  address: {
    street: string;
    city: string;
    country: string;
    postalCode: string;
  };
  workingHours: {
    days: string;
    hours: string;
  }[];
  socialMedia: {
    platform: string;
    url: string;
  }[];
  mapEmbedUrl: string;
}

interface Testimonial {
  id: string;
  name: string;
  role?: string;
  company?: string;
  avatar: string;
  content: string;
  rating: number;
}

// ============================================
// CONTACT INFORMATION
// Update this data to change contact details across the site
// ============================================
export const contactInfo: ContactInfo = {
  phone: [
    '+84 776 105 959',
  ],
  email: [
    'ecocretevietnam@gmail.com',
  ],
  address: {
    street: 'No. 276, Hoang Minh Chanh Street, Group 18, An Hoa Quarter',
    city: 'Bien Hoa Ward, Dong Nai Province',
    country: 'Vietnam',
    postalCode: '',
  },
  workingHours: [
    { days: 'Monday - Friday', hours: '8:00 AM - 6:00 PM' },
    { days: 'Saturday', hours: '9:00 AM - 5:00 PM' },
    { days: 'Sunday', hours: 'Closed' },
  ],
  socialMedia: [
    {
      platform: 'Facebook',
      url: 'https://facebook.com/',
    },
    {
      platform: 'Instagram',
      url: 'https://instagram.com/',
    },
    {
      platform: 'Twitter',
      url: 'https://twitter.com/',
    },
    {
      platform: 'YouTube',
      url: 'https://youtube.com/',
    },
    {
      platform: 'Pinterest',
      url: 'https://pinterest.com/',
    },
  ],
  mapEmbedUrl: 'https://www.google.com/maps?q=No.%20276%2C%20Hoang%20Minh%20Chanh%20Street%2C%20Group%2018%2C%20An%20Hoa%20Quarter%2C%20Bien%20Hoa%20Ward%2C%20Dong%20Nai%20Province%2C%20Vietnam&z=17&output=embed',
};

// ============================================
// TESTIMONIALS
// Add customer testimonials here
// ============================================
export const testimonials: Testimonial[] = [
  {
    id: 't001',
    name: 'Sarah Mitchell',
    role: 'Interior Designer',
    company: 'Mitchell Design Studio',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80',
    content: 'EcoCrete Vietnam pieces have become staples in my design projects. The quality and craftsmanship are exceptional, and my clients always love the natural aesthetic they bring to spaces.',
    rating: 5,
  },
  {
    id: 't002',
    name: 'James Chen',
    role: 'Landscape Architect',
    company: 'Green Spaces Ltd',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80',
    content: 'We\'ve been sourcing planters from EcoCrete Vietnam for over 5 years. Their products withstand the elements beautifully while maintaining their elegant appearance. Highly recommended for any outdoor project.',
    rating: 5,
  },
  {
    id: 't003',
    name: 'Emily Tran',
    role: 'Homeowner',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80',
    content: 'I discovered EcoCrete Vietnam at a home fair and fell in love with their bamboo collection. The planters transformed my balcony garden into a peaceful retreat. Beautiful work!',
    rating: 5,
  },
  {
    id: 't004',
    name: 'Michael Roberts',
    role: 'Hotel Manager',
    company: 'Riverside Resort',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80',
    content: 'We furnished our entire resort garden with EcoCrete Vietnam products. The guest feedback has been overwhelmingly positive. The pieces add a luxurious yet natural touch to our property.',
    rating: 5,
  },
];

// ============================================
// FAQ DATA
// Add frequently asked questions here
// ============================================
export interface FAQ {
  question: string;
  answer: string;
}

export const faqs: FAQ[] = [
  {
    question: 'Do you offer international shipping?',
    answer: 'Yes, we ship worldwide. Shipping costs and delivery times vary depending on the destination. Please contact our sales team for a quote on international orders.',
  },
  {
    question: 'Are your products suitable for outdoor use?',
    answer: 'Most of our planters and furniture are designed for both indoor and outdoor use. Each product page specifies its suitability. Our outdoor products are treated with weather-resistant finishes.',
  },
  {
    question: 'Do you offer custom orders?',
    answer: 'Absolutely! We welcome custom orders for both individual clients and businesses. Please contact us with your requirements, and our design team will work with you to create the perfect piece.',
  },
  {
    question: 'What is your return policy?',
    answer: 'We offer a 30-day return policy for unused items in their original packaging. Custom orders are non-refundable. Please contact our customer service team to initiate a return.',
  },
  {
    question: 'How do I care for my EcoCrete Vietnam products?',
    answer: 'Care instructions vary by product material. Generally, we recommend gentle cleaning with mild soap and water. Avoid harsh chemicals. Detailed care instructions are included with each purchase.',
  },
  {
    question: 'Do you offer bulk discounts for businesses?',
    answer: 'Yes, we offer special pricing for bulk orders and trade accounts. Hotels, restaurants, and design professionals are welcome to apply for our trade program.',
  },
];
