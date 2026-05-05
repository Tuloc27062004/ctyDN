import { Blog } from "@/types/blog.type";

export const mockBlogs : Blog[] = [
  {
    id: '1',
    title: 'Sustainable Materials: The Future of Construction',
    slug: 'sustainable-materials-future-construction',
    excerpt:
      'Discover how eco-friendly materials are reshaping the construction industry and reducing environmental impact.',
    content: `
      <p>The construction industry is undergoing a major transformation as sustainability becomes a top priority.</p>

      <h2>Why Sustainable Materials Matter</h2>
      <p>Traditional materials like concrete and steel contribute significantly to carbon emissions. Eco-friendly alternatives help reduce this footprint.</p>

      <h2>Popular Sustainable Materials</h2>
      <ul>
        <li>Recycled concrete</li>
        <li>Bamboo</li>
        <li>Hempcrete</li>
      </ul>

      <p>At EcoCrete Vietnam, we are committed to developing innovative green solutions.</p>
    `,
    coverImageUrl:
      'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1200&q=80',
    isPublished: true,
    publishedAt: new Date('2024-01-10'),
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    title: 'How EcoCrete Reduces Carbon Footprint',
    slug: 'ecocrete-reduces-carbon-footprint',
    excerpt:
      'Learn how our technology helps reduce emissions while maintaining durability and performance.',
    content: `
      <p>EcoCrete is designed to minimize environmental impact without compromising strength.</p>

      <h2>Key Benefits</h2>
      <ul>
        <li>Lower CO2 emissions</li>
        <li>High durability</li>
        <li>Cost efficiency</li>
      </ul>

      <p>Our mission is to lead the green construction revolution in Vietnam.</p>
    `,
    coverImageUrl:
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80',
    isPublished: true,
    publishedAt: new Date('2024-02-05'),
    createdAt: new Date('2024-02-01'),
  },
  {
    id: '3',
    title: 'Green Architecture Trends in 2025',
    slug: 'green-architecture-trends-2025',
    excerpt:
      'Explore the latest trends in eco-friendly architecture shaping the cities of tomorrow.',
    content: `
      <p>Green architecture is becoming the standard for modern urban development.</p>

      <h2>Top Trends</h2>
      <ul>
        <li>Energy-efficient buildings</li>
        <li>Smart materials</li>
        <li>Urban greenery</li>
      </ul>

      <p>These innovations are transforming how we design and live in cities.</p>
    `,
    coverImageUrl:
      'https://images.unsplash.com/photo-1496307653780-42ee777d4833?w=1200&q=80',
    isPublished: true,
    publishedAt: new Date('2024-03-01'),
    createdAt: new Date('2024-02-25'),
  },
];